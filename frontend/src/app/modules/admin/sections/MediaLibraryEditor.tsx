import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  deleteMediaAsset,
  fetchMediaAssets,
  fileToDataUrl,
  ocrRenameMediaAsset,
  previewOcrForDataUrl,
  updateMediaAsset,
  uploadMediaFiles,
  type MediaAsset,
} from '@/lib/mediaLibraryApi';
import { isSupabaseContentEnabled } from '@/lib/contentApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Copy,
  Loader2,
  ImagePlus,
  Pencil,
  RefreshCw,
  ScanText,
  Sparkles,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';

function formatBytes(n: number | null): string {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

function basename(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function tagsToInput(tags: string[]): string {
  return tags.join(', ');
}

function parseTags(raw: string): string[] {
  const set = new Set<string>();
  for (const token of raw.split(/[,\n]/)) {
    const t = token.trim().toLowerCase().replace(/[^a-z0-9 -]+/g, '');
    if (t.length >= 2) set.add(t.slice(0, 40));
  }
  return [...set];
}

function fallbackTagsForQueue(item: QueuedUpload): string[] {
  const tokens = `${item.slug} ${item.altText} ${item.notes}`
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length >= 4)
    .slice(0, 4);
  const base = tokens.join(' ').trim();
  const seo = new Set<string>([
    base ? `${base} blog hero` : 'blog hero image',
    base ? `${base} visual design` : 'visual design asset',
    base ? `${base} content marketing` : 'content marketing graphic',
    'seo image asset',
    'digital illustration',
  ]);
  return [...seo].slice(0, 8);
}

type QueueStatus = 'ready' | 'generating' | 'uploading' | 'error';

type QueuedUpload = {
  id: string;
  selected: boolean;
  sourceName: string;
  dataUrl: string;
  previewUrl: string;
  filename: string;
  slug: string;
  tagsInput: string;
  altText: string;
  notes: string;
  status: QueueStatus;
  error?: string;
};

export function MediaLibraryEditor() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [batchBusy, setBatchBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [editFilename, setEditFilename] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [ocrBusyId, setOcrBusyId] = useState<string | null>(null);
  const [tagQuery, setTagQuery] = useState('');
  const [collapsedTagGroups, setCollapsedTagGroups] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus('');
    try {
      setAssets(await fetchMediaAssets());
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Failed to load media.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) imageFiles.push(f);
        }
      }
      if (!imageFiles.length) return;
      e.preventDefault();
      void enqueueFiles(imageFiles);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const selectedQueue = useMemo(() => queue.filter((q) => q.selected), [queue]);

  const tagStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assets) {
      for (const t of a.metaTags ?? []) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    const all = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = all.slice(0, 12);
    const groups = new Map<string, [string, number][]>();
    for (const row of all) {
      const key = row[0][0]?.toUpperCase() ?? '#';
      const arr = groups.get(key) ?? [];
      arr.push(row);
      groups.set(key, arr);
    }
    return {
      top,
      groups: [...groups.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([letter, values]) => ({
          letter,
          values: values.filter(([tag]) => tag.includes(tagQuery.toLowerCase())),
        }))
        .filter((g) => g.values.length > 0),
    };
  }, [assets, tagQuery]);

  async function enqueueFiles(files: File[]) {
    if (!files.length) return;
    const appended = await Promise.all(
      files.map(async (file) => {
        const dataUrl = await fileToDataUrl(file);
        const name = basename(file.name || `pasted-${Date.now()}.png`);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          selected: true,
          sourceName: file.name || 'clipboard-image.png',
          dataUrl,
          previewUrl: dataUrl,
          filename: name,
          slug: slugify(name),
          tagsInput: '',
          altText: '',
          notes: '',
          status: 'ready' as QueueStatus,
        };
      }),
    );
    setQueue((prev) => [...appended, ...prev]);
    setStatus(`Queued ${appended.length} image(s).`);
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    setStatus('');
    try {
      await enqueueFiles(Array.from(fileList));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Failed to queue files.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function updateQueue(id: string, patch: Partial<QueuedUpload>) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  async function runPreviewFor(id: string) {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    updateQueue(id, { status: 'generating', error: undefined });
    try {
      const preview = await previewOcrForDataUrl(item.dataUrl);
      updateQueue(id, {
        filename: preview.filename,
        slug: preview.slug,
        tagsInput: tagsToInput(preview.tags),
        altText: item.altText || preview.filename.replace(/-/g, ' '),
        status: 'ready',
      });
      setStatus(`Generated OCR tags for ${item.sourceName}.`);
    } catch (e) {
      updateQueue(id, { status: 'error', error: e instanceof Error ? e.message : 'OCR failed.' });
      setStatus(e instanceof Error ? e.message : 'OCR preview failed.');
    }
  }

  async function runPreviewForSelected() {
    if (!selectedQueue.length) return;
    setBatchBusy(true);
    for (const item of selectedQueue) {
      // eslint-disable-next-line no-await-in-loop
      await runPreviewFor(item.id);
    }
    setBatchBusy(false);
  }

  async function uploadSelectedQueue() {
    if (!selectedQueue.length) {
      setStatus('Select at least one queued item.');
      return;
    }
    setBatchBusy(true);
    setStatus('');
    const payload = selectedQueue.map((item) => ({
      filename: item.filename,
      dataUrl: item.dataUrl,
      slug: item.slug,
      tags: (() => {
        const parsed = parseTags(item.tagsInput);
        return parsed.length > 0 ? parsed : fallbackTagsForQueue(item);
      })(),
      altText: item.altText || null,
      notes: item.notes || null,
    }));
    const ids = new Set(selectedQueue.map((q) => q.id));
    setQueue((prev) => prev.map((q) => (ids.has(q.id) ? { ...q, status: 'uploading' } : q)));
    try {
      const created = await uploadMediaFiles(payload);
      setAssets((prev) => [...created, ...prev]);
      setQueue((prev) => prev.filter((q) => !ids.has(q.id)));
      setStatus(`Uploaded ${created.length} image(s).`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Upload failed.');
      setQueue((prev) =>
        prev.map((q) => (ids.has(q.id) ? { ...q, status: 'error', error: 'Upload failed.' } : q)),
      );
    } finally {
      setBatchBusy(false);
    }
  }

  async function uploadSingleQueueItem(id: string) {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    setBatchBusy(true);
    updateQueue(id, { status: 'uploading', error: undefined });
    try {
      const tags = parseTags(item.tagsInput);
      const created = await uploadMediaFiles([
        {
          filename: item.filename,
          dataUrl: item.dataUrl,
          slug: item.slug,
          tags: tags.length > 0 ? tags : fallbackTagsForQueue(item),
          altText: item.altText || null,
          notes: item.notes || null,
        },
      ]);
      setAssets((prev) => [...created, ...prev]);
      setQueue((prev) => prev.filter((q) => q.id !== id));
      setStatus(`Uploaded ${item.sourceName}.`);
    } catch (e) {
      updateQueue(id, {
        status: 'error',
        error: e instanceof Error ? e.message : 'Upload failed.',
      });
      setStatus(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBatchBusy(false);
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setStatus('URL copied to clipboard.');
  }

  function openEdit(asset: MediaAsset) {
    setEditing(asset);
    setEditFilename(basename(asset.filename));
    setEditSlug(asset.slug ?? '');
    setEditTags(tagsToInput(asset.metaTags ?? []));
    setEditAlt(asset.altText ?? '');
    setEditNotes(asset.notes ?? '');
  }

  async function saveEdit() {
    if (!editing) return;
    setSavingEdit(true);
    setStatus('');
    try {
      const updated = await updateMediaAsset(editing.id, {
        filename: editFilename.trim() || basename(editing.filename),
        slug: editSlug.trim() || null,
        tags: parseTags(editTags),
        altText: editAlt.trim() || null,
        notes: editNotes.trim() || null,
      });
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditing(null);
      setStatus('Saved.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setStatus('');
    try {
      await deleteMediaAsset(deleteTarget.id);
      setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setStatus('Deleted.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setDeleteTarget(null);
    }
  }

  async function runOcrRename(asset: MediaAsset) {
    setOcrBusyId(asset.id);
    setStatus('');
    try {
      const updated = await ocrRenameMediaAsset(asset.id);
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setStatus(
        `OCR filename: ${updated.filename}` +
          (updated.ocrRaw ? ` (model: ${updated.ocrModel ?? 'qwen-vl'})` : ''),
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'OCR rename failed.');
    } finally {
      setOcrBusyId(null);
    }
  }

  if (!isSupabaseContentEnabled()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Media Library</h1>
        <p className="mt-4 text-sm text-gray-500">
          Set <code className="text-xs">VITE_BLOG_API_URL</code> and sign in to admin. Run migration{' '}
          <code className="text-xs">004_media_library.sql</code> +{' '}
          <code className="text-xs">005_media_library_tags_slug.sql</code> in Supabase.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            Queue images first, generate OCR filename/slug/tags, then confirm multi-upload.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="max-w-xs truncate text-sm text-gray-500">{status}</span>}
          <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFilesSelected(e.target.files)}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={batchBusy}
          >
            <Upload className="mr-2 h-4 w-4" />
            Add images
          </Button>
          <Button variant="outline" onClick={() => void runPreviewForSelected()} disabled={batchBusy || selectedQueue.length === 0}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate for selected
          </Button>
          <Button onClick={() => void uploadSelectedQueue()} disabled={batchBusy || selectedQueue.length === 0}>
            {batchBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload selected
          </Button>
        </div>
      </div>

      <div
        className="mb-4 flex min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-900"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          void handleFilesSelected(e.dataTransfer.files);
        }}
      >
        <ImagePlus className="mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-500">Drag/drop, select files, or paste clipboard screenshots.</p>
      </div>

      {queue.length > 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Queued uploads ({queue.length})</h2>
            <Button variant="outline" size="sm" onClick={() => setQueue([])} disabled={batchBusy}>
              Clear queue
            </Button>
          </div>
          <div className="space-y-3">
            {queue.map((item) => (
              <article key={item.id} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => updateQueue(item.id, { selected: e.target.checked })}
                    />
                    {item.sourceName}
                  </label>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => void runPreviewFor(item.id)} disabled={item.status === 'generating' || item.status === 'uploading'}>
                      {item.status === 'generating' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanText className="h-3 w-3" />}
                      <span className="ml-1">Agent</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQueue((prev) => prev.filter((q) => q.id !== item.id))} disabled={item.status === 'uploading'}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-[140px_1fr]">
                  <img src={item.previewUrl} alt={item.filename} className="h-28 w-full rounded object-cover bg-gray-100 dark:bg-gray-800" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input value={item.filename} onChange={(e) => updateQueue(item.id, { filename: e.target.value })} placeholder="filename" />
                    <Input value={item.slug} onChange={(e) => updateQueue(item.id, { slug: slugify(e.target.value) })} placeholder="slug" />
                    <Input value={item.tagsInput} onChange={(e) => updateQueue(item.id, { tagsInput: e.target.value })} placeholder="tag1, tag2, tag3" className="sm:col-span-2" />
                    <Input value={item.altText} onChange={(e) => updateQueue(item.id, { altText: e.target.value })} placeholder="alt text" />
                    <Input value={item.notes} onChange={(e) => updateQueue(item.id, { notes: e.target.value })} placeholder="notes" />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => void uploadSingleQueueItem(item.id)}
                    disabled={batchBusy || item.status === 'uploading'}
                  >
                    {item.status === 'uploading' ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="mr-1 h-3 w-3" />
                    )}
                    Upload this image
                  </Button>
                </div>
                {item.error && <p className="mt-2 text-xs text-red-600">{item.error}</p>}
              </article>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-2 flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-medium">Tag browser</p>
          <Input
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value.toLowerCase())}
            placeholder="Search tags..."
            className="ml-auto max-w-xs"
          />
        </div>
        <div className="mb-2 flex flex-wrap gap-2">
          {tagStats.top.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagQuery(tag)}
              className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              {tag} ({count})
            </button>
          ))}
        </div>
        <div className="max-h-40 space-y-1 overflow-auto text-xs">
          {tagStats.groups.map((group) => (
            <div key={group.letter}>
              <button
                type="button"
                className="mb-1 font-semibold"
                onClick={() =>
                  setCollapsedTagGroups((prev) => ({ ...prev, [group.letter]: !prev[group.letter] }))
                }
              >
                {group.letter} ({group.values.length})
              </button>
              {!collapsedTagGroups[group.letter] && (
                <div className="ml-3 flex flex-wrap gap-1">
                  {group.values.map(([tag, count]) => (
                    <button key={tag} type="button" className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800" onClick={() => setTagQuery(tag)}>
                      {tag} · {count}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading gallery…</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-gray-400">No images yet. Upload to get started.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <article
              key={asset.id}
              className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <a href={asset.url} target="_blank" rel="noreferrer" className="block aspect-video bg-gray-100 dark:bg-gray-800">
                <img
                  src={asset.url}
                  alt={asset.altText ?? asset.filename}
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </a>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="truncate text-sm font-medium" title={asset.filename}>
                  {asset.filename}
                </p>
                <p className="truncate text-xs text-indigo-600 dark:text-indigo-400">/{asset.slug ?? slugify(basename(asset.filename))}</p>
                <p className="text-xs text-gray-400">{formatBytes(asset.byteSize)}</p>
                <div className="flex flex-wrap gap-1">
                  {(asset.metaTags ?? []).slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] dark:bg-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">URL</p>
                  <p className="line-clamp-2 break-all text-xs text-gray-600 dark:text-gray-400">
                    {asset.url}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-1">
                  <Button variant="outline" size="sm" onClick={() => void copyUrl(asset.url)}>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(asset)}>
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={ocrBusyId === asset.id}
                    onClick={() => void runOcrRename(asset)}
                    title="Qwen3-VL 8B OCR → filename"
                  >
                    <ScanText className="mr-1 h-3 w-3" />
                    {ocrBusyId === asset.id ? 'OCR…' : 'OCR name'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteTarget(asset)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            <h2 className="text-lg font-semibold">Edit image</h2>
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="media-filename">Filename</Label>
                <Input
                  id="media-filename"
                  value={editFilename}
                  onChange={(e) => setEditFilename(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="media-alt">Alt text</Label>
                <Input
                  id="media-alt"
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="media-slug">Slug</Label>
                <Input
                  id="media-slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(slugify(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="media-tags">Tags</Label>
                <Input
                  id="media-tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-1"
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div>
                <Label htmlFor="media-notes">Notes</Label>
                <Textarea
                  id="media-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={() => void saveEdit()} disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes <strong>{deleteTarget?.filename}</strong> from storage and the library. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void confirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
