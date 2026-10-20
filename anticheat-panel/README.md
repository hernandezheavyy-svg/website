# AntiCheat Panel

Next.js 14 · Tailwind · shadcn/ui — dark dashboard for the AntiCheat plugin.

---

## VPS Setup

### 1. Prerequisites

```bash
# Node 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# (Optional) PM2 for process management
npm install -g pm2
```

### 2. Clone / upload the project

```bash
git clone <your-repo> anticheat-panel
cd anticheat-panel
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Generate a bcrypt password hash:
```bash
node scripts/hash-password.js yourpassword
```

Generate a session secret:
```bash
openssl rand -hex 32
```

Edit `.env.local` and fill in:
- `PANEL_PASSWORD_HASH` — hash from above
- `SESSION_SECRET` — 32-byte hex from above
- `MC_WS_URL` — where the plugin connects (e.g. `ws://localhost:25580`)
- `MC_WS_TOKEN` — shared secret between panel and plugin (any strong random string)

### 4. Build and start

```bash
npm run build
npm start
# Runs on port 3000
```

Or with PM2:
```bash
pm2 start npm --name "ac-panel" -- start
pm2 save
pm2 startup
```

### 5. Nginx reverse proxy (recommended)

```nginx
server {
    listen 80;
    server_name panel.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Add SSL with `certbot --nginx`.

### 6. Firewall

```bash
# Only expose nginx — keep port 3000 and 25580 internal
ufw allow 80
ufw allow 443
ufw allow 22
# Port 25580 (WS) should NOT be publicly exposed if MC server is on same VPS
```

---

## Plugin side

The plugin needs to connect OUT to the panel's WebSocket server on port 25580.
In the plugin config add:

```yaml
panel:
  enabled: true
  url: "ws://YOUR_VPS_IP:25580"   # or ws://localhost:25580 if same machine
  token: "SAME_TOKEN_AS_MC_WS_TOKEN"
```

The plugin sends JSON events:
```json
{ "type": "player_join",  "payload": { ...PlayerInfo }, "ts": 1234567890 }
{ "type": "detection",    "payload": { ...DetectionRecord }, "ts": ... }
{ "type": "player_quit",  "payload": { "uuid": "..." }, "ts": ... }
{ "type": "stats",        "payload": { "tps": 19.8, "online": 5, "max": 20, "uptime": 3600 }, "ts": ... }
```

The panel sends commands back:
```json
{ "type": "command", "command": "ban SomePlayer hacking", "id": "uuid" }
```

---

## Dev mode

```bash
npm run dev
# http://localhost:3000
```
