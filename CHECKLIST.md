# ✅ Pre-Deployment Checklist

Use this checklist before deploying to production.

## 📋 Repository Setup

### Files Verified
- [ ] `server/Dockerfile` exists
- [ ] `client/Dockerfile` exists  
- [ ] `website/Dockerfile` exists
- [ ] `docker-compose.yml` exists
- [ ] `.github/deploy.yaml` exists
- [ ] `.env.example` exists
- [ ] All `.dockerignore` files exist

### Git Status
- [ ] All changes committed
- [ ] Working directory clean: `git status`
- [ ] On main branch: `git branch`
- [ ] Remote repository connected: `git remote -v`

## 🔐 GitHub Secrets Configuration

Go to: `GitHub Repository > Settings > Secrets and variables > Actions`

### Docker Hub (2 secrets)
- [ ] `DOCKERHUB_USERNAME` = Your Docker Hub username
- [ ] `DOCKERHUB_TOKEN` = Docker Hub Personal Access Token

### SSH Access (4 secrets)
- [ ] `SSH_HOST` = Production server IP or hostname
- [ ] `SSH_USER` = SSH username (e.g., ubuntu, root)
- [ ] `SSH_KEY` = Complete SSH private key (including headers)
- [ ] `SSH_PORT` = SSH port (typically 22)

### Database (3 secrets)
- [ ] `MONGO_ROOT_USERNAME` = MongoDB admin username
- [ ] `MONGO_ROOT_PASSWORD` = Strong random password
- [ ] `MONGODB_URL` = Full connection string with above credentials

### Application (2 secrets)
- [ ] `JWT_SECRET` = Strong random string (32+ chars)
- [ ] `OPENAI_API_KEY` = Valid OpenAI API key with credits

**Total: 11 GitHub Secrets Required**

## 🖥️ Production Server Setup

### Server Requirements
- [ ] Ubuntu 20.04+ or similar Linux distribution
- [ ] Minimum 2GB RAM
- [ ] Minimum 20GB disk space
- [ ] Root or sudo access

### Software Installed
```bash
# Check Docker
docker --version  # Should show v20.10+

# Check Docker Compose
docker-compose --version  # Should show v2.0+

# Verify Docker service is running
systemctl status docker
```

### User Permissions
```bash
# Verify user can run Docker without sudo
docker ps

# If not, add user to docker group
sudo usermod -aG docker $USER
# Then log out and back in
```

### Firewall Configuration
```bash
# Check firewall status
sudo ufw status

# Required ports open:
# - 22 (SSH)
# - 80 (HTTP)
# - 443 (HTTPS)
# - 8001 (Client - app.spentiva.com)
# - 8002 (API - backend.spentiva.com)
# - 8003 (Website - spentiva.com)

# Allow ports if needed:
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### SSH Key Setup
```bash
# On production server, verify SSH key access works
ssh -i ~/.ssh/your_key user@your-server

# Make sure key is in authorized_keys
cat ~/.ssh/authorized_keys
```

## 🧪 Local Testing

### Docker Compose Test
```bash
# Copy environment template
cp .env.example .env

# Edit .env with test values
nano .env

# Build images locally
docker-compose build

# Start services
docker-compose up -d

# Check containers are running
docker-compose ps

# Check logs for errors
docker-compose logs

# Test health endpoints
curl http://localhost:8002/api/health  # Should return {"status":"ok"}
curl http://localhost:8001/            # Should return HTML
curl http://localhost:8003/            # Should return HTML

# Stop services
docker-compose down
```

### Individual Build Tests
```bash
# Test server build
cd server && docker build -t test-server . && cd ..

# Test client build
cd client && docker build -t test-client . && cd ..

# Test website build
cd website && docker build -t test-website . && cd ..

# Clean up test images
docker rmi test-server test-client test-website
```

## 📦 Docker Hub Preparation

### Account Setup
- [ ] Docker Hub account created
- [ ] Personal Access Token generated
- [ ] Token has read/write permissions

### Repository Names (will be auto-created)
- [ ] `spentiva-server` - Backend API
- [ ] `spentiva-client` - React PWA
- [ ] `spentiva-website` - Astro site

## 🚀 Deployment Preparation

### Code Review
- [ ] Latest code tested locally
- [ ] No console.log or debug code in production
- [ ] Environment variables properly used
- [ ] No hardcoded secrets in code
- [ ] TypeScript compiled without errors

### Configuration Review
- [ ] `.env.example` has all required variables
- [ ] `docker-compose.yml` ports are correct
- [ ] Dockerfile health checks are configured
- [ ] `.dockerignore` excludes node_modules

### Documentation Review
- [ ] `DEPLOYMENT.md` read and understood
- [ ] `SECRETS.md` reviewed
- [ ] `QUICK_START.md` bookmarked for reference

## 🎬 Go-Live Steps

### 1. Final Verification
```bash
# Verify all secrets in GitHub
# Verify server is accessible
# Verify Docker is running on server
# Review deployment workflow file
```

### 2. Trigger Deployment
```bash
# Commit and push to main
git add .
git commit -m "Initial deployment setup"
git push origin main
```

### 3. Monitor Deployment
- [ ] Go to GitHub repository
- [ ] Click "Actions" tab
- [ ] Watch workflow progress
- [ ] Check for any errors

### 4. Post-Deployment Verification
```bash
# SSH into server
ssh user@your-server

# Check containers are running
docker ps --filter "name=spentiva-"

# Check logs
docker logs spentiva-server
docker logs spentiva-client
docker logs spentiva-website

# Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:3000/
curl http://localhost:8080/

# Check disk usage
df -h

# Check memory
free -m
```

### 5. External Testing
- [ ] Test API: `curl http://YOUR_SERVER_IP:8002/api/health`
- [ ] Test Client: `http://YOUR_SERVER_IP:8001` or `http://app.spentiva.com`
- [ ] Test Website: `http://YOUR_SERVER_IP:8003` or `http://spentiva.com`
- [ ] Test from different network/device

## 🎯 Success Criteria

All these should be ✅ after deployment:

- [ ] GitHub Actions workflow completed successfully
- [ ] 4 containers running (mongodb, server, client, website)
- [ ] Backend health check returns 200 OK
- [ ] Client loads in browser
- [ ] Website loads in browser
- [ ] Can create user account via client
- [ ] Can log expense via client
- [ ] No errors in any container logs
- [ ] Containers restart after server reboot
- [ ] Disk usage is reasonable (<50%)
- [ ] Memory usage is reasonable (<80%)

## 🔧 Optional Enhancements

Post-deployment improvements to consider:

### Security
- [ ] Configure SSL/TLS certificates (Let's Encrypt)
- [ ] Set up firewall rules (ufw)
- [ ] Configure fail2ban for SSH
- [ ] Enable automatic security updates
- [ ] Set up log monitoring

### Domain & DNS
- [ ] Purchase domain name (spentiva.com)
- [ ] Configure DNS A records
- [ ] Set up subdomain for client (app.spentiva.com)
- [ ] Set up subdomain for API (backend.spentiva.com)

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Configure log aggregation (ELK stack)
- [ ] Set up container monitoring (Prometheus/Grafana)
- [ ] Configure alerting (email, Slack, etc.)

### Backups
- [ ] Automated MongoDB backups (daily)
- [ ] Backup uploaded files (daily)
- [ ] Off-site backup storage (S3, etc.)
- [ ] Test backup restoration

### Performance
- [ ] Set up CDN (CloudFlare)
- [ ] Configure Redis for caching
- [ ] Optimize database indexes
- [ ] Enable HTTP/2

## 📝 Notes

Record important information:

**Server IP**: _________________

**Deployment Date**: _________________

**Docker Hub Repos**: 
- spentiva-server: _________________
- spentiva-client: _________________
- spentiva-website: _________________

**Domain Names** (if configured):
- Main: _________________
- App: _________________
- API: _________________

**Backup Location**: _________________

**Emergency Contacts**: _________________

---

## ⚠️ Troubleshooting Reference

If deployment fails:

1. **Check GitHub Actions logs** - Detailed error messages
2. **Verify all secrets** - Most common issue
3. **Check SSH connection** - Can you manually SSH?
4. **Verify Docker on server** - Is Docker running?
5. **Check server resources** - Enough disk/memory?
6. **Review container logs** - `docker logs <container>`
7. **Consult DEPLOYMENT.md** - Detailed troubleshooting section

---

**Last Updated**: 2025-01-18
**Version**: 1.0.0

Good luck with your deployment! 🚀
