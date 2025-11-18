# 🚀 Spentiva Quick Deployment Reference

## Project Structure
```
📦 Spentiva (Full Stack)
├── 🌐 Website (Astro) - Port 8003 - spentiva.com
├── 📱 Client (React + Vite) - Port 8001 - app.spentiva.com
├── ⚙️ Server (Node.js + Express) - Port 8002 - backend.spentiva.com
└── 🗄️ MongoDB - Internal - Database
```

## 🎯 Quick Start Commands

### Local Development (Individual Services)
```bash
# Backend Server (Port 8002)
cd server
npm install
npm run dev

# Client App (Port 8001)
cd client
npm install
npm run dev

# Website (Port 8003)
cd website
npm install
npm run dev
```

### Local Development with Docker Compose
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Deploy via GitHub Actions
```bash
# 1. Configure secrets (see SECRETS.md)
# 2. Push to main
git add .
git commit -m "Deploy updates"
git push origin main

# 3. Monitor deployment
# Go to: GitHub > Actions tab
```

## 📋 Pre-Deployment Checklist

### GitHub Secrets (10 required)
- [ ] `DOCKERHUB_USERNAME` - Docker Hub username
- [ ] `DOCKERHUB_TOKEN` - Docker Hub access token
- [ ] `SSH_HOST` - Server IP/hostname
- [ ] `SSH_USER` - SSH username
- [ ] `SSH_KEY` - SSH private key
- [ ] `SSH_PORT` - SSH port (22)
- [ ] `MONGO_ROOT_USERNAME` - MongoDB admin user
- [ ] `MONGO_ROOT_PASSWORD` - MongoDB admin password
- [ ] `MONGODB_URL` - Full connection string
- [ ] `JWT_SECRET` - JWT signing secret
- [ ] `OPENAI_API_KEY` - OpenAI API key

### Server Requirements
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] Ports open: 22, 80, 443, 8001, 8002, 8003
- [ ] User has Docker permissions: `docker ps`
- [ ] Sufficient disk space: 10GB+

## 🔍 Health Check URLs

```bash
# Backend API
curl http://your-server:8002/api/health

# React Client (PWA)
curl http://your-server:8001/

# Astro Website
curl http://your-server:8003/
```

## 🛠️ Common Operations

### View Running Containers
```bash
docker ps --filter "name=spentiva-"
```

### View Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker logs spentiva-server -f
```

### Restart a Service
```bash
docker-compose restart server
# or
docker restart spentiva-server
```

### Rebuild and Deploy Single Service
```bash
docker-compose up -d --build server
```

### Database Backup
```bash
docker exec spentiva-mongodb mongodump --out=/backup
docker cp spentiva-mongodb:/backup ./backup-$(date +%Y%m%d)
```

### Clean Up
```bash
# Remove all Spentiva containers
docker stop $(docker ps -aq --filter "name=spentiva-")
docker rm $(docker ps -aq --filter "name=spentiva-")

# Remove images
docker rmi spentiva-server spentiva-client spentiva-website

# Full cleanup (including volumes)
docker-compose down -v --rmi all
```

## 🚨 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs spentiva-server

# Check if port is in use
netstat -ano | grep :8002

# Restart container
docker restart spentiva-server
```

### Database Connection Failed
```bash
# Verify MongoDB is running
docker ps | grep mongodb

# Test MongoDB connection
docker exec spentiva-mongodb mongosh --eval "db.runCommand('ping')"

# Check environment variables
docker inspect spentiva-server | grep -A 20 Env
```

### Build Failed
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild with no cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test ./server
```

## 📊 Monitoring

### Resource Usage
```bash
docker stats spentiva-server spentiva-client spentiva-website
```

### Disk Space
```bash
# Docker disk usage
docker system df

# Container sizes
docker ps --size
```

### Network
```bash
# List networks
docker network ls

# Inspect network
docker network inspect spentiva-network
```

## 🔐 Security Reminders

- ✅ Use strong, random passwords (32+ chars)
- ✅ Never commit .env files
- ✅ Rotate secrets regularly
- ✅ Keep Docker images updated
- ✅ Enable HTTPS in production
- ✅ Use firewall rules
- ✅ Monitor logs for suspicious activity
- ✅ Regular security audits

## 📚 Documentation Files

- `DEPLOYMENT.md` - Full deployment guide
- `SECRETS.md` - GitHub secrets configuration
- `docker-compose.yml` - Local orchestration
- `.github/deploy.yaml` - CI/CD pipeline
- `nginx.conf` - Production reverse proxy (optional)

## 🆘 Need Help?

1. Check logs: `docker-compose logs -f`
2. Verify environment variables in `.env`
3. Review GitHub Actions logs
4. Test services individually
5. Check server resources: `df -h`, `free -m`

## 🎉 Success Indicators

After deployment, you should see:
- ✅ 4 containers running (mongodb, server, client, website)
- ✅ Health checks passing
- ✅ Services accessible on their ports
- ✅ No errors in logs
- ✅ API responds to requests

---

**Environment**: Production
**Last Updated**: 2025-01-18
**Version**: 1.0.0
