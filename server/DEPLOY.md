# Pholar Natural API — VPS Deployment

Target: Contabo VPS, Ubuntu 24.04, deploying as the `deploy` user.

---

## Prerequisites on the VPS

```bash
# Install Docker and the Compose plugin (run once as root / sudo)
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow deploy user to run Docker without sudo
usermod -aG docker deploy
newgrp docker
```

---

## 1. Get the code onto the VPS

Option A — clone from GitHub:
```bash
cd ~
git clone https://github.com/31133498/pholarnatural.com.git pholar
cd pholar/server
```

Option B — rsync from your local machine (run on your laptop):
```bash
rsync -avz --exclude '.venv' --exclude '__pycache__' --exclude '*.pyc' \
  "server/" deploy@169.58.178.47:~/pholar/server/
```

---

## 2. Create the .env file

```bash
cd ~/pholar/server
cp .env.example .env
nano .env        # fill in every value — see notes below
```

**Critical values to fill in:**

| Variable | How to get it |
|---|---|
| `POSTGRES_PASSWORD` | Invent a strong password (e.g. `openssl rand -hex 16`) |
| `DATABASE_URL` | `postgresql://pholar:<same password>@db/pholar_db` |
| `SECRET_KEY` | `openssl rand -hex 32` |
| `ADMIN_REGISTRATION_KEY` | Any strong secret — used once to create the admin account |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | Same place |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → create endpoint → signing secret |
| `DOMAIN` | Your live frontend URL, e.g. `https://pholarnatural.com` |
| `CLOUDINARY_CLOUD_NAME/KEY/SECRET` | Cloudinary console → Settings → API Keys |
| `RESEND_API_KEY` | resend.com → API Keys |
| `DEFAULT_FROM_EMAIL` | A domain you've verified in Resend |

---

## 3. Build and start the containers

```bash
cd ~/pholar/server
docker compose build
docker compose up -d
```

Both containers start: `pholar-natural-db-1` (Postgres) and `pholar-natural-api-1` (FastAPI).
The API is bound to `127.0.0.1:8000` — it is not directly reachable from the internet until
you put Nginx in front of it (see step 6).

Check they're healthy:
```bash
docker compose ps
docker compose logs api --tail 50
```

---

## 4. Run Alembic migrations

Do this once after the containers are up. The `db` service must be healthy first.

```bash
docker compose exec api alembic upgrade head
```

Expected output ends with:
```
INFO  [alembic.runtime.migration] Running upgrade  -> da0264ead017, Initial Model
```

**⚠ Known gap:** Two models — `AdminSetting` and `ContactMessage` (from `app/models/system.py`)
— are imported but their tables are absent from the initial migration. After running
`alembic upgrade head`, generate the missing migration:

```bash
docker compose exec api alembic revision --autogenerate -m "add system tables"
docker compose exec api alembic upgrade head
```

Verify:
```bash
docker compose exec db psql -U pholar -d pholar_db -c "\dt"
```
You should see 11 tables including `admin_settings` and `contact_messages`.

---

## 5. Create the admin account

```bash
curl -X POST https://YOUR_DOMAIN/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "strong-password",
    "secret_key": "YOUR_ADMIN_REGISTRATION_KEY"
  }'
```

After this, `ADMIN_REGISTRATION_KEY` no longer grants access to anything unless someone
hits `/register` again, so you can leave it set.

---

## 6. Put Nginx in front (HTTPS)

Install Nginx and Certbot on the VPS:
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/pholar-api`:
```nginx
server {
    server_name api.pholarnatural.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/pholar-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.pholarnatural.com
```

---

## 7. Configure the Stripe webhook

In the Stripe dashboard, create a webhook endpoint:
- URL: `https://api.pholarnatural.com/api/v1/webhooks/payments/`
- Events: `checkout.session.completed`
- Copy the **Signing secret** into `.env` as `STRIPE_WEBHOOK_SECRET`, then restart:

```bash
docker compose restart api
```

---

## 8. Update CORS for production

The API currently allows all origins (`"*"`). Before going live, update `server/app/main.py`:

```python
allow_origins=["https://pholarnatural.com", "https://www.pholarnatural.com"],
```

Rebuild after this change:
```bash
docker compose build api
docker compose up -d api
```

---

## Day-to-day operations

```bash
# View live logs
docker compose logs -f api

# Restart the API after a code change
docker compose build api && docker compose up -d api

# Open a Postgres shell
docker compose exec db psql -U pholar -d pholar_db

# Run a new migration after model changes
docker compose exec api alembic revision --autogenerate -m "describe change"
docker compose exec api alembic upgrade head

# Stop everything
docker compose down

# Stop and wipe the database volume (destructive!)
docker compose down -v
```
