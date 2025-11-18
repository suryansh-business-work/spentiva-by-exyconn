# DNS Configuration Guide for Spentiva

## 🌐 Domain Structure

Your Spentiva deployment uses the following domain structure:

| Service | Domain | Port | Purpose |
|---------|--------|------|---------|
| Website | `spentiva.com` | 8003 | Main marketing website |
| Client App | `app.spentiva.com` | 8001 | Progressive Web App |
| API Backend | `backend.spentiva.com` | 8002 | REST API server |

## 📝 DNS Records Configuration

### Option 1: Direct Port Access (Initial Setup)

If you want to access services directly via ports before configuring SSL:

**A Records:**
```
spentiva.com          A    YOUR_SERVER_IP
app.spentiva.com      A    YOUR_SERVER_IP
backend.spentiva.com  A    YOUR_SERVER_IP
www.spentiva.com      A    YOUR_SERVER_IP
```

**Access URLs:**
- `http://YOUR_SERVER_IP:8003` → Main website
- `http://YOUR_SERVER_IP:8001` → Client app
- `http://YOUR_SERVER_IP:8002` → API backend

### Option 2: With Nginx Reverse Proxy (Recommended for Production)

**A Records:**
```
spentiva.com          A    YOUR_SERVER_IP
app.spentiva.com      A    YOUR_SERVER_IP
backend.spentiva.com  A    YOUR_SERVER_IP
www.spentiva.com      CNAME spentiva.com
```

**Access URLs (after SSL setup):**
- `https://spentiva.com` → Main website
- `https://www.spentiva.com` → Main website (redirects)
- `https://app.spentiva.com` → Client app
- `https://backend.spentiva.com` → API backend

## 🔧 Setup Instructions

### Step 1: Configure DNS Records

1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Go to DNS Management
3. Add the A records listed above
4. Wait for DNS propagation (5 minutes - 48 hours)

**Verify DNS propagation:**
```bash
# Check if DNS has propagated
nslookup spentiva.com
nslookup app.spentiva.com
nslookup backend.spentiva.com

# Or use online tools:
# https://dnschecker.org
```

### Step 2: Deploy Containers (Without Nginx)

Containers are already configured with the correct ports:
```bash
# Containers will be accessible at:
http://YOUR_SERVER_IP:8003  # Website
http://YOUR_SERVER_IP:8001  # Client
http://YOUR_SERVER_IP:8002  # Backend
```

### Step 3: Enable Nginx Reverse Proxy (Optional but Recommended)

The `nginx.conf` file is already configured with your domains. To enable:

1. **Update docker-compose.yml** to activate nginx profile:
```bash
docker-compose --profile production up -d nginx
```

2. **Install Certbot for SSL** (on production server):
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Stop nginx temporarily
docker stop spentiva-nginx

# Get SSL certificates
sudo certbot certonly --standalone -d spentiva.com -d www.spentiva.com
sudo certbot certonly --standalone -d app.spentiva.com
sudo certbot certonly --standalone -d backend.spentiva.com

# Certificates will be in: /etc/letsencrypt/live/
```

3. **Update nginx volume mount** in docker-compose.yml:
```yaml
nginx:
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/nginx/certs:ro  # Add this line
```

4. **Start nginx**:
```bash
docker-compose --profile production up -d nginx
```

## 🔐 SSL Certificate Setup (Let's Encrypt)

### Automated SSL Setup Script

Create `setup-ssl.sh`:
```bash
#!/bin/bash

# Stop nginx if running
docker stop spentiva-nginx 2>/dev/null || true

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    sudo apt update
    sudo apt install -y certbot
fi

# Get certificates
sudo certbot certonly --standalone \
    -d spentiva.com \
    -d www.spentiva.com \
    --non-interactive \
    --agree-tos \
    --email admin@spentiva.com

sudo certbot certonly --standalone \
    -d app.spentiva.com \
    --non-interactive \
    --agree-tos \
    --email admin@spentiva.com

sudo certbot certonly --standalone \
    -d backend.spentiva.com \
    --non-interactive \
    --agree-tos \
    --email admin@spentiva.com

# Restart nginx with SSL
docker-compose --profile production up -d nginx

echo "SSL certificates installed successfully!"
```

Run the script:
```bash
chmod +x setup-ssl.sh
./setup-ssl.sh
```

### Automatic Certificate Renewal

Add to crontab:
```bash
# Edit crontab
crontab -e

# Add this line to renew certificates at 3am daily
0 3 * * * certbot renew --quiet && docker restart spentiva-nginx
```

## 🧪 Testing Your Setup

### Test DNS Resolution
```bash
# Should return your server IP
dig spentiva.com +short
dig app.spentiva.com +short
dig backend.spentiva.com +short
```

### Test HTTP Access (Before SSL)
```bash
# Test each service
curl -I http://spentiva.com:8003
curl -I http://app.spentiva.com:8001
curl -I http://backend.spentiva.com:8002/api/health
```

### Test HTTPS Access (After SSL)
```bash
# Test each service
curl -I https://spentiva.com
curl -I https://app.spentiva.com
curl -I https://backend.spentiva.com/api/health
```

### Test from Browser
1. Open `http://spentiva.com:8003` (or https://spentiva.com with SSL)
2. Open `http://app.spentiva.com:8001` (or https://app.spentiva.com with SSL)
3. Open `http://backend.spentiva.com:8002/api/health` (or https://backend.spentiva.com/api/health with SSL)

## 🔥 Firewall Configuration

Update firewall to allow traffic:

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow direct port access (optional - only if not using nginx)
sudo ufw allow 8001/tcp
sudo ufw allow 8002/tcp
sudo ufw allow 8003/tcp

# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 📊 Nginx Routing Logic

When using nginx reverse proxy:

```
Client Request                 Nginx                   Docker Container
─────────────────────────────────────────────────────────────────────

https://spentiva.com      →    Port 443    →    website:80 (8003)
https://app.spentiva.com  →    Port 443    →    client:80 (8001)
https://backend.spentiva.com → Port 443    →    server:5000 (8002)
```

**Without nginx:**
```
Client Request                            Docker Container
────────────────────────────────────────────────────────────

http://spentiva.com:8003       →    website:80 (8003)
http://app.spentiva.com:8001   →    client:80 (8001)
http://backend.spentiva.com:8002 →  server:5000 (8002)
```

## 🎯 Deployment Stages

### Stage 1: Basic Deployment (Current)
- Containers running on ports 8001, 8002, 8003
- Access via IP:PORT
- No SSL/HTTPS
- **Status:** ✅ Ready

### Stage 2: DNS Configuration
- Add A records for all domains
- Wait for DNS propagation
- Test domain resolution
- **Status:** 🔄 Next step

### Stage 3: Production Setup (Optional)
- Enable nginx reverse proxy
- Install SSL certificates
- Configure automatic renewal
- Enable HTTPS
- **Status:** ⏭️ Future enhancement

## 🛠️ Troubleshooting

### DNS not resolving
```bash
# Clear DNS cache (on your computer)
# Windows:
ipconfig /flushdns

# Linux:
sudo systemd-resolve --flush-caches

# macOS:
sudo dscacheutil -flushcache
```

### Port not accessible
```bash
# Check if container is running
docker ps | grep spentiva

# Check if port is listening
sudo netstat -tlnp | grep 8003
sudo netstat -tlnp | grep 8001
sudo netstat -tlnp | grep 8002

# Check firewall
sudo ufw status
```

### SSL certificate errors
```bash
# Check certificate validity
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Restart nginx
docker restart spentiva-nginx
```

## 📋 Quick Reference

### Current Configuration (No Nginx)
```
spentiva.com:8003          → Website
app.spentiva.com:8001      → Client App
backend.spentiva.com:8002  → API Backend
```

### Production Configuration (With Nginx + SSL)
```
https://spentiva.com           → Website (Port 443 → 8003)
https://app.spentiva.com       → Client App (Port 443 → 8001)
https://backend.spentiva.com   → API Backend (Port 443 → 8002)
```

### Port Mapping Summary
```
External    →    Container Internal
──────────────────────────────────
8003        →    80 (nginx in website container)
8001        →    80 (nginx in client container)
8002        →    5000 (node.js in server container)
```

---

**Last Updated:** 2025-11-18
**Version:** 1.0.0
