import { useEffect, useState } from 'react';
import {
  getBlogs,
  getBlogCategories,
  setBlogCategories,
  saveBlog,
  deleteBlog,
  syncBlogPostsFromSeed,
  type BlogPost,
  type BlogCategory,
} from '../../../lib/adminContentService';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { BlogSeo } from '../../../lib/adminContentService';

function ImageUrlPreview({ url, label }: { url: string; label: string }) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  return (
    <img
      src={trimmed}
      alt={label}
      className="mt-2 max-h-36 w-full rounded-md border border-gray-200 object-cover dark:border-gray-700"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = 'none';
      }}
    />
  );
}

function emptySeo(): BlogSeo {
  return {};
}

/** Prevent long unbroken strings from blowing out admin form layout. */
const FIELD_OVERFLOW =
  'min-w-0 max-w-full overflow-x-auto [overflow-wrap:anywhere]';

const TEXTAREA_OVERFLOW =
  'min-w-0 max-w-full field-sizing-fixed overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere]';

const EMPTY_POST: Omit<BlogPost, 'id'> = {
  numericId: 0,
  title: '',
  excerpt: '',
  date: '',
  readTime: '',
  tags: [],
  category: '',
  color: '#6366f1',
  author: '',
  content: '',
};

export function BlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [tagInput, setTagInput] = useState('');
  const [seedSyncNote, setSeedSyncNote] = useState<string | null>(null);
  const [mirrorCoverToOg, setMirrorCoverToOg] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const seeded = await syncBlogPostsFromSeed();
      if (seeded > 0) {
        setSeedSyncNote(
          `Synced ${seeded} post${seeded === 1 ? '' : 's'} from blog-data.json into Firestore.`,
        );
      } else {
        setSeedSyncNote(null);
      }
      const [loadedPosts, loadedCategories] = await Promise.all([
        getBlogs(),
        getBlogCategories(),
      ]);
      setPosts(loadedPosts);
      setCategories(loadedCategories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function openNew() {
    const defaultCategory = categories.find((c) => c.id !== 'all')?.id ?? '';
    setEditPost({ ...EMPTY_POST, category: defaultCategory });
    setTagInput('');
    setMirrorCoverToOg(false);
  }

  function openEdit(post: BlogPost) {
    setEditPost({ ...post });
    setTagInput('');
    const og = post.seo?.ogImageUrl ?? post.seo?.ogImage ?? '';
    const cover = post.coverImageUrl ?? '';
    setMirrorCoverToOg(Boolean(og && cover && og === cover));
  }

  function patchSeo(patch: Partial<BlogSeo>) {
    if (!editPost) return;
    const seo = { ...emptySeo(), ...editPost.seo, ...patch };
    const next: BlogPost = { ...editPost, seo };
    if (mirrorCoverToOg && patch.ogImageUrl !== undefined) {
      next.coverImageUrl = patch.ogImageUrl;
    }
    setEditPost(next);
  }

  function patchCoverImageUrl(url: string) {
    if (!editPost) return;
    setEditPost({ ...editPost, coverImageUrl: url });
    if (mirrorCoverToOg) {
      patchSeo({ ogImageUrl: url });
    }
  }

  async function handleSave() {
    if (!editPost) return;
    setSaving(true);
    try {
      await saveBlog(editPost);
      setEditPost(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await deleteBlog(deleteId);
    setDeleteId(null);
    await load();
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && editPost && !editPost.tags.includes(t)) {
      setEditPost({ ...editPost, tags: [...editPost.tags, t] });
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    if (!editPost) return;
    setEditPost({ ...editPost, tags: editPost.tags.filter((t) => t !== tag) });
  }

  function toCategoryId(label: string) {
    return label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async function handleAddCategory() {
    const label = newCategoryLabel.trim();
    if (!label) return;

    setAddingCategory(true);
    try {
      const baseId = toCategoryId(label) || 'category';
      let nextId = baseId;
      let suffix = 2;
      const existingIds = new Set(categories.map((c) => c.id));
      while (existingIds.has(nextId)) {
        nextId = `${baseId}-${suffix}`;
        suffix += 1;
      }

      const nextCategory: BlogCategory = {
        id: nextId,
        label,
        color: newCategoryColor,
      };

      const updatedCategories = [...categories, nextCategory];
      await setBlogCategories(updatedCategories);
      setCategories(updatedCategories);

      if (editPost) {
        setEditPost({ ...editPost, category: nextCategory.id });
      }

      setNewCategoryLabel('');
    } finally {
      setAddingCategory(false);
    }
  }

  if (loading) return <p className="text-gray-500">Loading blog posts…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      {seedSyncNote && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {seedSyncNote}
        </p>
      )}

      <p className="mb-4 text-sm text-gray-500">
        Canonical store: Firestore <code className="text-xs">blog_posts</code>. New rows in{' '}
        <code className="text-xs">blog-data.json</code> are copied here on load (doc id{' '}
        <code className="text-xs">seed-&lt;numericId&gt;</code>).
      </p>

      <div className="space-y-3">
        {posts.length === 0 && (
          <p className="text-gray-400 text-sm">No posts yet. Click "New Post" to add one.</p>
        )}
        {posts.map((post) => (
          <div
            key={post.id ?? `n-${post.numericId}`}
            className="flex items-start gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
          >
            <div
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ background: post.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{post.title}</p>
              <p className="text-sm text-gray-500 truncate">{post.excerpt}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {post.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="icon" onClick={() => openEdit(post)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-red-500 hover:text-red-600"
                onClick={() => setDeleteId(post.id!)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / New dialog */}
      <Dialog open={!!editPost} onOpenChange={(open) => { if (!open) setEditPost(null); }}>
        <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPost?.id ? 'Edit Post' : 'New Post'}</DialogTitle>
          </DialogHeader>

          {editPost && (
            <div className="min-w-0 space-y-4 overflow-hidden py-2">
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1">
                  <Label>Title</Label>
                  <Input
                    className={FIELD_OVERFLOW}
                    value={editPost.title}
                    onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <Label>Author</Label>
                  <Input
                    className={FIELD_OVERFLOW}
                    value={editPost.author}
                    onChange={(e) => setEditPost({ ...editPost, author: e.target.value })}
                  />
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <Label>Excerpt</Label>
                <Textarea
                  rows={2}
                  className={TEXTAREA_OVERFLOW}
                  value={editPost.excerpt}
                  onChange={(e) => setEditPost({ ...editPost, excerpt: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Used as the default meta description when SEO description is empty.
                </p>
              </div>

              <div className="min-w-0 space-y-3 rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <p className="text-sm font-bold">SEO &amp; images</p>

                <div className="min-w-0 space-y-1">
                  <Label htmlFor="seo-meta-title">Meta title</Label>
                  <Input
                    id="seo-meta-title"
                    className={FIELD_OVERFLOW}
                    placeholder={editPost.title || 'Defaults to post title'}
                    value={editPost.seo?.metaTitle ?? ''}
                    onChange={(e) => patchSeo({ metaTitle: e.target.value })}
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <Label htmlFor="seo-meta-description">Meta description</Label>
                  <Textarea
                    id="seo-meta-description"
                    rows={2}
                    className={TEXTAREA_OVERFLOW}
                    placeholder={editPost.excerpt || 'Defaults to excerpt'}
                    value={editPost.seo?.metaDescription ?? ''}
                    onChange={(e) => patchSeo({ metaDescription: e.target.value })}
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <Label htmlFor="seo-og-image">Social / SEO image URL</Label>
                  <Input
                    id="seo-og-image"
                    className={FIELD_OVERFLOW}
                    placeholder="https://… (Open Graph, Twitter, LinkedIn)"
                    value={editPost.seo?.ogImageUrl ?? editPost.seo?.ogImage ?? ''}
                    onChange={(e) => patchSeo({ ogImageUrl: e.target.value })}
                  />
                  <ImageUrlPreview
                    url={editPost.seo?.ogImageUrl ?? editPost.seo?.ogImage ?? ''}
                    label="Social preview"
                  />
                </div>

                <div className="min-w-0 space-y-1">
                  <Label htmlFor="cover-image">Cover image URL (below title on blog)</Label>
                  <Input
                    id="cover-image"
                    className={FIELD_OVERFLOW}
                    placeholder="https://…"
                    value={editPost.coverImageUrl ?? ''}
                    onChange={(e) => patchCoverImageUrl(e.target.value)}
                    disabled={mirrorCoverToOg}
                  />
                  <ImageUrlPreview url={editPost.coverImageUrl ?? ''} label="Cover preview" />
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={mirrorCoverToOg}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setMirrorCoverToOg(checked);
                      if (checked && editPost) {
                        const og = editPost.seo?.ogImageUrl ?? editPost.seo?.ogImage ?? '';
                        setEditPost({ ...editPost, coverImageUrl: og });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Use social image as cover (same URL for both)
                </label>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="min-w-0 space-y-1">
                  <Label>Date (e.g. May 2026)</Label>
                  <Input
                    className={FIELD_OVERFLOW}
                    value={editPost.date}
                    onChange={(e) => setEditPost({ ...editPost, date: e.target.value })}
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <Label>Read Time</Label>
                  <Input
                    className={FIELD_OVERFLOW}
                    value={editPost.readTime}
                    onChange={(e) => setEditPost({ ...editPost, readTime: e.target.value })}
                  />
                </div>
                <div className="min-w-0 space-y-1 sm:col-span-1">
                  <Label>Category</Label>
                  <div className="flex min-w-0 gap-2">
                    <select
                      value={editPost.category}
                      onChange={(e) => setEditPost({ ...editPost, category: e.target.value })}
                      className="h-10 min-w-0 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="" disabled>Select category</option>
                      {categories.filter((c) => c.id !== 'all').map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                    <Input
                      className={`min-w-0 flex-1 ${FIELD_OVERFLOW}`}
                      placeholder="New category name"
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                    />
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded border border-gray-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCategory}
                      disabled={addingCategory || !newCategoryLabel.trim()}
                    >
                      {addingCategory ? 'Adding…' : 'Add Category'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <Label>Accent Color</Label>
                <div className="flex min-w-0 gap-2">
                  <input
                    type="color"
                    value={editPost.color}
                    onChange={(e) => setEditPost({ ...editPost, color: e.target.value })}
                    className="h-9 w-12 shrink-0 cursor-pointer rounded border border-gray-200"
                  />
                  <Input
                    className={FIELD_OVERFLOW}
                    value={editPost.color}
                    onChange={(e) => setEditPost({ ...editPost, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {editPost.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(t)}
                    >
                      {t} ✕
                    </Badge>
                  ))}
                </div>
                <div className="flex min-w-0 gap-2">
                  <Input
                    className={`min-w-0 flex-1 ${FIELD_OVERFLOW}`}
                    placeholder="Add tag…"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <Label>Content (Markdown)</Label>
                <Textarea
                  rows={18}
                  className={`font-mono text-xs ${TEXTAREA_OVERFLOW}`}
                  value={editPost.content}
                  onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPost(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
