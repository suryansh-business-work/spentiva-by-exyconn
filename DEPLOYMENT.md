# Spentiva Deployment Guide

## 🏗️ Architecture Overview

This project consists of three main components:

1. **Astro Website** (`/website`) - Static marketing website (Port 8003)
2. **React Client** (`/client`) - Progressive Web App (PWA) (Port 8001)
3. **Node.js Backend** (`/server`) - Express API server (Port 8002)
4. **MongoDB Atlas** - Cloud database (managed service)

**Note:** Development and production ports are aligned for consistency.

## 📋 Prerequisites

### For GitHub Actions Deployment

Set up the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username | `myusername` |
| `DOCKERHUB_TOKEN` | Docker Hub access token | `dckr_pat_xxx` |
| `SSH_HOST` | Production server IP/hostname | `123.45.67.89` |
| `SSH_USER` | SSH username | `ubuntu` |
| `SSH_KEY` | SSH private key | `-----BEGIN RSA PRIVATE KEY-----...` |
| `SSH_PORT` | SSH port (usually 22) | `22` |
| `MONGO_ROOT_USERNAME` | MongoDB admin username | `admin` |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password | `securepassword123` |
| `MONGODB_URL` | MongoDB connection string | `mongodb://admin:password@mongodb:27017/expenses?authSource=admin` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-key-here` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-xxx` |

### For Local Development

1. **Docker & Docker Compose** installed
2. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your values
```

## 🚀 Deployment Options

### Option 1: GitHub Actions (Recommended for Production)

1. **Configure GitHub Secrets** (see Prerequisites above)

2. **Push to main branch** - Deployment will trigger automatically:
```bash
git push origin main
```

3. **Monitor deployment** in GitHub Actions tab

The workflow will:
- Build Docker images for all three projects
- Push images to Docker Hub
- Deploy to production server via SSH
- Perform health checks
- Clean up old images

### Option 2: Docker Compose (Local/Development)

1. **Start all services**:
```bash
docker-compose up -d
```

2. **View logs**:
```bash
docker-compose logs -f
```

3. **Stop all services**:
```bash
docker-compose down
```

4. **Rebuild after code changes**:
```bash
docker-compose up -d --build
```

### Option 3: Manual Docker Commands

#### Build Images
```bash
# Backend
docker build -t spentiva-server:latest ./server

# Client
docker build -t spentiva-client:latest ./client

# Website
docker build -t spentiva-website:latest ./website
```

#### Run Containers
```bash
# Create network
docker network create spentiva-network

# Backend Server
docker run -d --name spentiva-server \
  --network spentiva-network \
  -p 8002:8002 \
  -e MONGODB_URL="mongodb://admin:password@spentiva-mongodb:27017/expenses?authSource=admin" \
  -e JWT_SECRET="your-secret" \
  -e OPENAI_API_KEY="sk-xxx" \
  spentiva-server:latest

# Client
docker run -d --name spentiva-client \
  --network spentiva-network \
  -p 8001:80 \
  spentiva-client:latest

# Website
docker run -d --name spentiva-website \
  --network spentiva-network \
  -p 8003:80 \
  spentiva-website:latest
```

## 🔍 Health Checks

Once deployed, verify all services are running:

```bash
# Backend API
curl http://localhost:8002/api/health

# Client App
curl http://localhost:8001/

# Marketing Website
curl http://localhost:8003/
```

## 📊 Monitoring

### View Container Logs
```bash
# All containers
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f website
```

### Check Container Status
```bash
docker ps --filter "name=spentiva-"
```

### Resource Usage
```bash
docker stats spentiva-server spentiva-client spentiva-website
```

## 🛠️ Troubleshooting

### Container won't start
```bash
# Check logs
docker logs spentiva-server

# Restart container
docker restart spentiva-server

# Remove and recreate
docker stop spentiva-server
docker rm spentiva-server
# Run the docker run command again
```

### Database connection issues
```bash
# Check MongoDB is running
docker ps | grep mongodb

# Test connection
docker exec spentiva-mongodb mongosh --eval "db.runCommand('ping')"
```

### Port conflicts
```bash
# Check what's using the port
netstat -ano | grep :8002

# Change port mapping in docker-compose.yml or docker run command
```

## 🔄 Updates & Maintenance

### Update a specific service
```bash
# Rebuild and restart
docker-compose up -d --build server

# Or manually
docker build -t spentiva-server:latest ./server
docker stop spentiva-server
docker rm spentiva-server
# Run the container again
```

### Backup MongoDB
```bash
docker exec spentiva-mongodb mongodump --out=/backup
docker cp spentiva-mongodb:/backup ./mongodb-backup
```

### Restore MongoDB
```bash
docker cp ./mongodb-backup spentiva-mongodb:/backup
docker exec spentiva-mongodb mongorestore /backup
```

## 🌐 Production Considerations

### 1. Environment Variables
- Never commit `.env` files
- Use secure, randomly generated secrets
- Rotate credentials regularly

### 2. SSL/TLS
- Use a reverse proxy (Nginx) for SSL termination
- Obtain certificates from Let's Encrypt
- Configure HTTPS redirect

### 3. Firewall
```bash
# Allow only necessary ports
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

### 4. Monitoring
- Set up container monitoring (Prometheus, Grafana)
- Configure log aggregation
- Set up alerts for critical issues

### 5. Backups
- Automated MongoDB backups
- Volume snapshots
- Off-site backup storage

### 6. Scaling
- Use Docker Swarm or Kubernetes for orchestration
- Set up load balancing
- Implement horizontal scaling

## 📝 Project Structure

```
spentiva-by-exyconn/
├── .github/
│   └── deploy.yaml          # GitHub Actions workflow
├── server/                  # Node.js Backend
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
├── client/                  # React PWA
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
├── website/                 # Astro Website
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
├── docker-compose.yml       # Orchestration config
└── .env.example            # Environment template
```

## 🔐 Security Checklist

- [ ] Use strong passwords for MongoDB
- [ ] Keep JWT_SECRET secure and complex
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS in production
- [ ] Keep Docker images updated
- [ ] Scan images for vulnerabilities
- [ ] Implement rate limiting
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular security audits

## 📞 Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Review GitHub Actions logs
4. Check container health: `docker ps`

## 🎯 Quick Commands Reference

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# Rebuild specific service
docker-compose up -d --build server

# View logs
docker-compose logs -f

# Restart service
docker-compose restart server

# Scale service (if needed)
docker-compose up -d --scale server=3

# Clean up
docker-compose down -v --rmi all
docker system prune -a --volumes
```

## 📈 Performance Tips

1. **Enable caching** in nginx for static assets
2. **Use CDN** for client and website assets
3. **Optimize images** before deployment
4. **Enable gzip compression** (already configured in Dockerfiles)
5. **Monitor database** indexes and queries
6. **Set up Redis** for caching API responses
7. **Implement database** connection pooling

---

**Last Updated**: 2025-01-18
**Version**: 1.0.0
