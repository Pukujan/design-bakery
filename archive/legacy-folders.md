# Legacy folders (safe to delete locally)

If your editor shows TypeScript errors under these paths, they are **not** used by the app anymore.

| Path | Was | Use instead |
|------|-----|-------------|
| `server/` | Early Express API prototype | `backend/` |
| `functions/` | Old Firebase Functions root | `backend/services/` |
| `backend/functions/` | Symlink/duplicate during monorepo move | `backend/services/` |

Remove locally if they still exist:

```bash
rm -rf server functions backend/functions
```

Then in Cursor: **Developer: Reload Window**.

Active layout: `frontend/`, `backend/`, `backend/services/`, `supabase/`.
