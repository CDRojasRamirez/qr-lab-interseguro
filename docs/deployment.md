# Deployment on Google Cloud Run

The three services run on Cloud Run in `southamerica-west1`. Each one is built from
its own Dockerfile with `gcloud run deploy --source` (Cloud Build builds the image and
stores it in Artifact Registry), runs with a dedicated service account and reads only
the secrets it needs from Secret Manager.

```
Frontend (frontend-sa) ──► Go API (go-api-sa) ──► Node API (node-api-sa)
                             │ reads                 │ reads
                             ├─ jwt-private-key      └─ jwt-public-key
                             └─ auth-password
```

Commands below use bash syntax. In Windows PowerShell, wrap any value containing
commas in quotes (`--set-env-vars="A=1,B=2"`); an unquoted comma list is turned into
an array and passed to `gcloud` joined by spaces.

## 1. Project, billing and APIs

```bash
PROJECT_ID=qr-lab-interseguro
REGION=southamerica-west1

gcloud projects create "$PROJECT_ID"
gcloud config set project "$PROJECT_ID"
gcloud billing projects link "$PROJECT_ID" --billing-account=<BILLING_ACCOUNT_ID>
gcloud config set run/region "$REGION"
gcloud config set artifacts/location "$REGION"

gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com
```

A budget alert (Billing > Budgets & alerts) notifies on spend; `--max-instances`
on every service is what actually caps it.

## 2. Secrets

Production uses its own key pair, never the local development one.

```bash
(cd go-api && go run ./cmd/keygen -out ../keys-prod)      # git-ignored

gcloud secrets create jwt-private-key --data-file=keys-prod/private.pem
gcloud secrets create jwt-public-key  --data-file=keys-prod/public.pem
printf '%s' "$DEMO_PASSWORD" | gcloud secrets create auth-password --data-file=-
```

The password must be stored without a trailing newline (`printf '%s'`, not `echo`):
the Go API compares it byte by byte.

## 3. Service accounts (least privilege)

Cloud Run would otherwise use the Compute Engine default account, which usually has
project-wide Editor. Each service gets its own identity, granted access per secret.

```bash
for sa in go-api-sa node-api-sa frontend-sa; do
  gcloud iam service-accounts create "$sa"
done

SA() { echo "serviceAccount:$1@$PROJECT_ID.iam.gserviceaccount.com"; }
ACCESSOR=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding jwt-private-key --member="$(SA go-api-sa)"   --role=$ACCESSOR
gcloud secrets add-iam-policy-binding auth-password   --member="$(SA go-api-sa)"   --role=$ACCESSOR
gcloud secrets add-iam-policy-binding jwt-public-key  --member="$(SA node-api-sa)" --role=$ACCESSOR
```

`frontend-sa` receives no permissions; it exists so the frontend does not run with
the default account.

## 4. Deploy

Cloud Run URLs follow `https://<service>-<project-number>.<region>.run.app`, so the
frontend origin is known before it exists and CORS can be configured up front.

```bash
NUM=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
NODE_URL=https://node-api-$NUM.$REGION.run.app
GO_URL=https://go-api-$NUM.$REGION.run.app
WEB_URL=https://frontend-$NUM.$REGION.run.app
```

**Node API.** The public key is mounted as a file and read through the same
`JWT_PUBLIC_KEY_PATH` variable used locally.

```bash
gcloud run deploy node-api --source ./node-api \
  --service-account="node-api-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --allow-unauthenticated --memory=512Mi --max-instances=2 \
  --set-secrets=/secrets/jwt/public.pem=jwt-public-key:latest \
  --set-env-vars="JWT_PUBLIC_KEY_PATH=/secrets/jwt/public.pem,JWT_ISSUER=qr-go-api,JWT_AUDIENCE=qr-challenge,ALLOWED_ORIGINS=$WEB_URL"
```

**Go API.** `STATS_TIMEOUT` is higher than locally to absorb a Node cold start.

```bash
gcloud run deploy go-api --source ./go-api \
  --service-account="go-api-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --allow-unauthenticated --memory=256Mi --max-instances=2 \
  --set-secrets="/secrets/jwt/private.pem=jwt-private-key:latest,AUTH_PASSWORD=auth-password:latest" \
  --set-env-vars="JWT_PRIVATE_KEY_PATH=/secrets/jwt/private.pem,STATS_API_URL=$NODE_URL,STATS_TIMEOUT=10s,JWT_ISSUER=qr-go-api,JWT_AUDIENCE=qr-challenge,AUTH_USERNAME=admin,ALLOWED_ORIGINS=$WEB_URL"
```

**Frontend.** The same image as local; only the runtime configuration changes.
`DEMO_*` are optional and public by design (they are shown on the login screen).

```bash
gcloud run deploy frontend --source ./frontend \
  --service-account="frontend-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --allow-unauthenticated --memory=256Mi --max-instances=2 \
  --set-env-vars="GO_API_URL=$GO_URL,NODE_API_URL=$NODE_URL,DEMO_USERNAME=admin,DEMO_PASSWORD=$DEMO_PASSWORD"
```

## 5. Operations

| Task                         | Command                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| Change configuration only    | `gcloud run services update <svc> --update-env-vars=KEY=VALUE`          |
| Rotate the demo password     | `gcloud secrets versions add auth-password --data-file=-`, then `gcloud run services update go-api --update-secrets=AUTH_PASSWORD=auth-password:latest` |
| Read logs                    | `gcloud run services logs read go-api --limit=50`                       |
| List revisions / roll back   | `gcloud run revisions list --service=go-api`, then `gcloud run services update-traffic go-api --to-revisions=<rev>=100` |

Configuration changes create a new immutable revision without rebuilding the image.
Secrets exposed as environment variables are resolved when an instance starts, so a
new secret version needs a new revision; file-mounted secrets on `latest` refresh
without one.

**Build compatibility.** Source deploys use Cloud Build's classic Docker builder, so
the Dockerfiles avoid BuildKit-only syntax (for example `COPY --chmod`).

## 6. Production hardening

- Make the Node API private: grant `roles/run.invoker` only to `go-api-sa`, send
  Google's ID token in `X-Serverless-Authorization` (keeping `Authorization` for the
  application JWT) and expose an aggregated health endpoint from Go.
- Replace the demo user with a user store and hashed passwords; read the password
  from a mounted file (`AUTH_PASSWORD_PATH`) like the keys.
- Pin secret versions, add an Artifact Registry cleanup policy and a custom domain.
- Describe the infrastructure with Terraform and deploy from CI on every merge.
- Consider `--min-instances=1` for the Go API to remove cold starts at a small cost.
