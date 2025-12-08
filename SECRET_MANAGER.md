## GCP Secret Manager setup for Clerk

1) Create the secret (replace the placeholder with your Clerk publishable key):
```
PROJECT_ID=$(gcloud config get-value project)
gcloud secrets create CLERK_PUBLISHABLE_KEY \
  --replication-policy=automatic
echo -n "pk_test_dXByaWdodC1ib2EtNDguY2xlcmsuYWNjb3VudHMuZGV2JA" | gcloud secrets versions add CLERK_PUBLISHABLE_KEY --data-file=-
```

2) Grant access to Cloud Build and Cloud Run runtime SAs (replace `PROJECT_NUMBER`):
```
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
CB_SA="$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"
RUN_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"  # or your custom Run SA

gcloud secrets add-iam-policy-binding CLERK_PUBLISHABLE_KEY \
  --member="serviceAccount:$CB_SA" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding CLERK_PUBLISHABLE_KEY \
  --member="serviceAccount:$RUN_SA" \
  --role="roles/secretmanager.secretAccessor"
```

3) Deploy via Cloud Build (already configured in `cloudbuild.yaml`):
- Build step pulls the secret via `availableSecrets` and passes it as `--build-arg VITE_CLERK_PUBLISHABLE_KEY`.
- Deploy step injects runtime env with `--set-secrets=VITE_CLERK_PUBLISHABLE_KEY=CLERK_PUBLISHABLE_KEY:latest`.

4) Smoke test after deployment:
- Confirm Cloud Run service env `VITE_CLERK_PUBLISHABLE_KEY` is set.
- Load the app and ensure Clerk loads without 401/404 on `clerk.js`/`jwks.json`.

