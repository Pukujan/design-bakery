# Backend secrets (local only)

Place your Firebase **service account** JSON here:

```
firebase-service-account.json
```

In `backend/.env`:

```
GOOGLE_APPLICATION_CREDENTIALS_PATH=./secrets/firebase-service-account.json
```

On **Railway**, use `GOOGLE_APPLICATION_CREDENTIALS_JSON` (single-line JSON) instead of a file.

These files are gitignored. Do not commit them.
