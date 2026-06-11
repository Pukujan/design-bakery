import { useEffect, useRef, useState } from 'react';
import {
  getBlogs,
  getBlogCategories,
  setBlogCategories,
  saveBlog,
  deleteBlog,
  type BlogPost,
  type BlogCategory,
} from '@/lib/adminContentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, X } from 'lucide-react';
import type { BlogSeo } from '@/lib/adminContentService';
import { isPublishKitEnabled } from '@/lib/blogFeatureFlags';
import {
  MAX_BLOG_TAGS,
  mergeTags,
  parseCommaSeparatedTags,
} from '@/modules/blog/lib/parseBlogTags';
import { applyPublishKitSeoToPost } from '@/modules/blog/studio/applyPublishKitSeo';
import { BlogPublishKit } from '@/modules/blog/studio/BlogPublishKit';
import {
  DEFAULT_PUBLISH_KIT_EDITOR_DRAFT,
  type PublishKitEditorDraft,
} from '@/modules/blog/studio/types';
import {
  blogEditSessionKey,
  fingerprintBlogPost,
  isBlogEditorDirty,
  hasUnappliedKitPreview,
} from '@/modules/blog/admin/blogEditorDraft';
import { commitPublishKitImagesForSave } from '@/modules/blog/studio/publishKitImages';
import {
  getPublishKitImageFormHint,
  publishKitImagesNeedUpload,
} from '@/modules/blog/studio/publishKitSaveHint';
import { resolveBlogNumericId } from '@/modules/blog/data/blogData';
import {
  createNewBlogPostDraft,
  DEFAULT_BLOG_AUTHOR,
  formatBlogDisplayDate,
  prepareBlogPostForSave,
} from '@/modules/blog/lib/blogPostDefaults';
import { resolveBlogOgPreviewUrl } from '@/modules/blog/seo/blogMeta';
import { PublishImagePreview } from '@/modules/blog/studio/PublishImagePreview';

function emptySeo(): BlogSeo {
  return {};
}

/** Prevent long unbroken strings from blowing out admin form layout. */
const FIELD_OVERFLOW =
  'min-w-0 max-w-full overflow-x-auto [overflow-wrap:anywhere]';

const TEXTAREA_OVERFLOW =
  'min-w-0 max-w-full field-sizing-fixed overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere]';

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
  const [mirrorCoverToOg, setMirrorCoverToOg] = useState(true);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editorExpanded, setEditorExpanded] = useState(true);
  const [baselineFingerprint, setBaselineFingerprint] = useState('');
  const [publishKitDraft, setPublishKitDraft] = useState<PublishKitEditorDraft>(
    DEFAULT_PUBLISH_KIT_EDITOR_DRAFT,
  );
  const newPostSlotRef = useRef(`new-${Date.now()}`);
  const editPanelRef = useRef<HTMLElement>(null);

  const hasUnsavedChanges =
    editPost != null && isBlogEditorDirty(editPost, baselineFingerprint, publishKitDraft);

  const imageFormHint =
    editPost != null
      ? getPublishKitImageFormHint({
          og: editPost.seo?.ogImageUrl ?? editPost.seo?.ogImage ?? '',
          cover: (mirrorCoverToOg
            ? editPost.seo?.ogImageUrl ?? editPost.seo?.ogImage
            : editPost.coverImageUrl) ?? '',
        })
      : null;

  const savePostButtonLabel = saving
    ? saveWarning?.includes('Uploading')
      ? 'Uploading images…'
      : 'Saving…'
    : imageFormHint
      ? 'Save post (upload images)'
      : 'Save post';

  function patchKitDraft(patch: Partial<PublishKitEditorDraft>) {
    setPublishKitDraft((prev) => ({ ...prev, ...patch }));
  }

  function resetKitDraft() {
    setPublishKitDraft(DEFAULT_PUBLISH_KIT_EDITOR_DRAFT);
  }

  function beginEditSession(post: BlogPost, expand = true) {
    setEditPost({ ...post });
    setBaselineFingerprint(fingerprintBlogPost(post));
    resetKitDraft();
    setTagInput('');
    const og = post.seo?.ogImageUrl ?? post.seo?.ogImage ?? '';
    const cover = post.coverImageUrl ?? '';
    setMirrorCoverToOg(Boolean(og && cover && og === cover));
    setSaveWarning(null);
    setSaveError(null);
    setEditorExpanded(expand);
  }

  async function load() {
    setLoading(true);
    try {
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

  useEffect(() => {
    if (editPost && editorExpanded && editPanelRef.current) {
      editPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editPost, editorExpanded]);

  function collapseEditor() {
    setEditorExpanded(false);
  }

  function expandEditor() {
    setEditorExpanded(true);
  }

  function discardChanges() {
    if (!editPost) return;
    const baselinePost = JSON.parse(baselineFingerprint) as Omit<BlogPost, 'id'>;
    setEditPost({ ...baselinePost, id: editPost.id, numericId: editPost.numericId });
    resetKitDraft();
    setSaveWarning(null);
    setSaveError(null);
  }

  function closeEditor() {
    if (
      hasUnsavedChanges &&
      !window.confirm('Discard unsaved changes and close the editor?')
    ) {
      return;
    }
    setEditPost(null);
    setEditorExpanded(true);
    resetKitDraft();
    setSaveWarning(null);
    setSaveError(null);
  }

  function openNew() {
    if (
      editPost &&
      hasUnsavedChanges &&
      !window.confirm('Discard unsaved changes and start a new post?')
    ) {
      return;
    }
    newPostSlotRef.current = `new-${Date.now()}`;
    const defaultCategory = categories.find((c) => c.id !== 'all')?.id ?? '';
    beginEditSession(createNewBlogPostDraft(defaultCategory) as BlogPost);
  }

  function openEdit(post: BlogPost) {
    const nextKey = blogEditSessionKey(post, newPostSlotRef.current);
    if (editPost) {
      const currentKey = blogEditSessionKey(editPost, newPostSlotRef.current);
      if (currentKey === nextKey) {
        if (!editorExpanded) expandEditor();
        return;
      }
      if (
        hasUnsavedChanges &&
        !window.confirm('Discard unsaved changes and edit a different post?')
      ) {
        return;
      }
    }
    beginEditSession(post);
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

  function postWithKitImagesApplied(post: BlogPost): BlogPost {
    if (!hasUnappliedKitPreview(publishKitDraft) || !publishKitDraft.stagedVisual) {
      return post;
    }
    const og = publishKitDraft.stagedVisual.ogPreviewDataUrl;
    const cover =
      publishKitDraft.stagedVisual.coverPreviewDataUrl || og;
    return {
      ...post,
      coverImageUrl: mirrorCoverToOg ? og : cover,
      seo: { ...emptySeo(), ...post.seo, ogImageUrl: og },
    };
  }

  async function handleSave() {
    if (!editPost) return;
    setSaveError(null);
    let working = postWithKitImagesApplied(editPost);
    if (working !== editPost) {
      setEditPost(working);
      patchKitDraft({ appliedToForm: true });
    }

    const og = (working.seo?.ogImageUrl ?? working.seo?.ogImage ?? '').trim();
    const cover = (mirrorCoverToOg ? og : working.coverImageUrl ?? '').trim() || og;
    const needsImageUpload = publishKitImagesNeedUpload({ og, cover });
    setSaving(true);
    try {
      let toSave = working;

      if (needsImageUpload) {
        setSaveWarning('Uploading image previews to Firebase Storage…');
        if (!isPublishKitEnabled()) {
          throw new Error(
            'Posts with generated preview images require the publish kit. Enable VITE_ENABLE_BLOG_PUBLISH_KIT, or paste public https:// image URLs.',
          );
        }
        const blogId = resolveBlogNumericId(working);
        if (blogId <= 0) {
          throw new Error(
            'Save the post once (title and content) to assign a numeric ID, then generate images, Apply to post, and save again.',
          );
        }
        const uploaded = await commitPublishKitImagesForSave({
          post: working,
          mirrorCoverToOg,
        });
        if (!uploaded) {
          throw new Error(
            'Could not upload images. Confirm you clicked Apply to post after Generate, you are signed in to admin, and pnpm run dev is running. Then save again.',
          );
        }
        setSaveWarning(null);
        toSave = {
          ...working,
          coverImageUrl: uploaded.coverImageUrl,
          thumbnailImageUrl: uploaded.thumbnailImageUrl,
          seo: {
            ...emptySeo(),
            ...working.seo,
            ogImageUrl: uploaded.ogImageUrl,
            ogImageThumbUrl: uploaded.ogImageThumbUrl,
            socialOgImageUrl: uploaded.socialOgImageUrl,
          },
        };
      }

      setSaveWarning(null);
      const docId = await saveBlog(prepareBlogPostForSave(toSave));
      await load();
      const refreshed = (await getBlogs()).find((p) => p.id === docId);
      if (refreshed) {
        beginEditSession(refreshed, editorExpanded);
      } else {
        setEditPost(null);
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
      if (publishKitImagesNeedUpload({ og, cover })) {
        setSaveWarning(imageFormHint);
      }
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

  function addTagsFromInput() {
    if (!editPost || editPost.tags.length >= MAX_BLOG_TAGS) return;
    const incoming = parseCommaSeparatedTags(tagInput);
    if (incoming.length === 0) return;
    setEditPost({
      ...editPost,
      tags: mergeTags(editPost.tags, incoming, MAX_BLOG_TAGS),
    });
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

      {editPost && (
        <section
          ref={editPanelRef}
          className="mb-6 w-full min-w-0 rounded-xl border-2 border-indigo-300/80 bg-white shadow-sm dark:border-indigo-800 dark:bg-gray-900"
          aria-label={editPost.id ? 'Edit blog post' : 'New blog post'}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-200/60 bg-indigo-50/60 px-4 py-3 dark:border-indigo-900 dark:bg-indigo-950/40">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-indigo-950 dark:text-indigo-50">
                  {editPost.id ? 'Edit post' : 'New post'}
                  {editPost.title ? `: ${editPost.title}` : ''}
                </h2>
                {hasUnsavedChanges && (
                  <Badge
                    variant="secondary"
                    className="border-amber-400/80 bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100"
                  >
                    Unsaved changes
                  </Badge>
                )}
                {hasUnappliedKitPreview(publishKitDraft) && (
                  <Badge variant="outline" className="text-xs">
                    Image preview not applied
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {editorExpanded
                  ? 'Collapse keeps your draft. Use Discard changes to revert, then Save post.'
                  : 'Editor collapsed — expand to continue editing. Draft is kept in memory.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {editorExpanded ? (
                <Button type="button" variant="outline" size="sm" onClick={collapseEditor}>
                  <ChevronUp className="mr-1.5 h-4 w-4" />
                  Collapse
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={expandEditor}>
                  <ChevronDown className="mr-1.5 h-4 w-4" />
                  Expand
                </Button>
              )}
            </div>
          </div>

          {!editorExpanded ? (
            <div className="space-y-2 px-4 py-3 sm:px-6">
              {saveError && (
                <p className="text-sm font-medium text-red-800 dark:text-red-200" role="alert">
                  {saveError}
                </p>
              )}
              {saveWarning && !saveError && (
                <p className="text-sm text-amber-800 dark:text-amber-200">{saveWarning}</p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={discardChanges}
                  disabled={!hasUnsavedChanges || saving}
                >
                  Discard changes
                </Button>
                <Button type="button" variant="outline" onClick={closeEditor}>
                  <X className="mr-1.5 h-4 w-4" />
                  Close
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {savePostButtonLabel}
                </Button>
              </div>
            </div>
          ) : (
          <div className="min-w-0 space-y-4 overflow-hidden p-4 sm:p-6">
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
                  placeholder={DEFAULT_BLOG_AUTHOR}
                  value={editPost.author}
                  onChange={(e) => setEditPost({ ...editPost, author: e.target.value })}
                />
              </div>
            </div>

            <div className="min-w-0 space-y-1">
              <Label htmlFor="post-excerpt">Short summary (excerpt)</Label>
              <Textarea
                id="post-excerpt"
                rows={2}
                className={TEXTAREA_OVERFLOW}
                placeholder="One or two sentences — shown on the blog index card"
                value={editPost.excerpt}
                onChange={(e) => setEditPost({ ...editPost, excerpt: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Teaser on the blog list and cover-image text. Filled automatically when you use{' '}
                <strong>Generate SEO text + tags</strong> in the publish kit (you can edit after).
              </p>
            </div>

            <section
              className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/50"
              aria-label="SEO, images, and AI publish kit"
            >
              <p className="mb-3 text-sm font-bold">SEO &amp; images</p>

              {imageFormHint && !saving && (
                <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  {imageFormHint}
                </p>
              )}

              <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                <div className="min-w-0 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Fields</p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Used for Open Graph and Twitter when the URL is public https:// (after Save
                      uploads to Storage).
                    </p>
                    <Input
                      id="seo-og-image"
                      className={FIELD_OVERFLOW}
                      placeholder="https://… (Open Graph, Twitter, LinkedIn)"
                      value={editPost.seo?.ogImageUrl ?? editPost.seo?.ogImage ?? ''}
                      onChange={(e) => patchSeo({ ogImageUrl: e.target.value })}
                    />
                  <PublishImagePreview
                    url={
                      resolveBlogOgPreviewUrl(editPost) ??
                      editPost.seo?.ogImageUrl ??
                      editPost.seo?.ogImage ??
                      ''
                    }
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
                    <PublishImagePreview url={editPost.coverImageUrl ?? ''} label="Cover preview" />
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
                    On save, store the social image URL as the cover URL too (same artwork, one Storage file)
                  </label>
                </div>

                {isPublishKitEnabled() && (
                  <div className="min-w-0 space-y-3 rounded-lg border border-indigo-200/80 bg-indigo-50/40 p-4 dark:border-indigo-900/80 dark:bg-indigo-950/25">
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-800/80 dark:text-indigo-200/80 lg:hidden">
                      AI tools
                    </p>
                    <BlogPublishKit
                      variant="panel"
                      post={editPost}
                      kitDraft={publishKitDraft}
                      onKitDraftChange={patchKitDraft}
                      categoryLabel={
                        categories.find((c) => c.id === editPost.category)?.label
                      }
                      publicUrl={
                        editPost.numericId
                          ? `${typeof window !== 'undefined' ? window.location.origin : ''}/blogs/${editPost.numericId}`
                          : undefined
                      }
                      mirrorCoverToOg={mirrorCoverToOg}
                      onApplySeo={({ meta, tags }) => {
                        setEditPost((prev) =>
                          prev
                            ? applyPublishKitSeoToPost(prev, { meta, tags })
                            : prev,
                        );
                      }}
                      onApplyVisual={({ ogImageUrl, coverImageUrl }) => {
                        if (!editPost) return;
                        setEditPost({
                          ...editPost,
                          coverImageUrl: mirrorCoverToOg ? ogImageUrl : coverImageUrl,
                          seo: { ...emptySeo(), ...editPost.seo, ogImageUrl },
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            </section>

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="min-w-0 space-y-1">
                <Label>Date (display)</Label>
                <Input
                  className={FIELD_OVERFLOW}
                  placeholder={formatBlogDisplayDate()}
                  value={editPost.date}
                  onChange={(e) => setEditPost({ ...editPost, date: e.target.value })}
                />
                {!editPost.id && (
                  <p className="text-xs text-gray-500">
                    Defaults to today ({formatBlogDisplayDate()}). Sort order uses a hidden timestamp on first save.
                  </p>
                )}
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {editPost.tags.length}/{MAX_BLOG_TAGS} — separate with commas
              </p>
              <div className="mb-2 flex flex-wrap gap-1">
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
                  placeholder="e.g. React, Systems Design, AI"
                  value={tagInput}
                  disabled={editPost.tags.length >= MAX_BLOG_TAGS}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTagsFromInput();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={editPost.tags.length >= MAX_BLOG_TAGS}
                  onClick={addTagsFromInput}
                >
                  Add
                </Button>
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

            <div className="space-y-2 border-t border-gray-200 bg-gray-50/80 px-4 py-3 -mx-4 -mb-4 dark:border-gray-800 dark:bg-gray-900/50 sm:-mx-6 sm:-mb-6 sm:px-6 sm:py-3">
              {saveError && (
                <p className="text-sm font-medium text-red-800 dark:text-red-200" role="alert">
                  {saveError}
                </p>
              )}
              {saveWarning && !saveError && (
                <p className="text-sm text-amber-800 dark:text-amber-200">{saveWarning}</p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={discardChanges}
                  disabled={!hasUnsavedChanges || saving}
                >
                  Discard changes
                </Button>
                <Button type="button" variant="outline" onClick={closeEditor}>
                  <X className="mr-1.5 h-4 w-4" />
                  Close
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {savePostButtonLabel}
                </Button>
              </div>
            </div>
          </div>
          )}
        </section>
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
        {posts.map((post) => {
          const isEditing =
            editPost &&
            (editPost.id === post.id ||
              (!editPost.id && !post.id && editPost.numericId === post.numericId));
          return (
          <div
            key={post.id ?? `n-${post.numericId}`}
            className={[
              'flex items-start gap-4 rounded-lg border bg-white p-4 dark:bg-gray-900',
              isEditing
                ? 'border-indigo-400 ring-2 ring-indigo-200 dark:border-indigo-600 dark:ring-indigo-900/50'
                : 'border-gray-200 dark:border-gray-800',
            ].join(' ')}
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
          );
        })}
      </div>

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
