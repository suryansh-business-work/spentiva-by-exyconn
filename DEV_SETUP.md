# 🚀 Spentiva Development Setup

## Quick Start

### Development Ports (Aligned with Production)
- **Website (Astro)**: Port 8003 → `http://localhost:8003`
- **Client (React PWA)**: Port 8001 → `http://localhost:8001`
- **Server (Node.js API)**: Port 8002 → `http://localhost:8002`

### Run Individual Services

#### 1. Backend Server
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
# Server runs on http://localhost:8002
```

#### 2. Client App
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:8001
# API proxy configured to http://localhost:8002
```

#### 3. Website
```bash
cd website
npm install
npm run dev
# Website runs on http://localhost:8003
```

### Run All Services with Docker
```bash
# From project root
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

## Port Configuration Summary

| Service | Dev Port | Production Port | Domain |
|---------|----------|-----------------|---------|
| Website | 8003 | 8003 | spentiva.com |
| Client | 8001 | 8001 | app.spentiva.com |
| Server | 8002 | 8002 | backend.spentiva.com |
| MongoDB | - | Internal | - |

**Note:** Development and production ports are now aligned for consistency.

## Project Structure

```
spentiva-by-exyconn/
├── server/           # Node.js + Express + TypeScript (Port 8002)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── client/           # React + Vite + TypeScript + PWA (Port 8001)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── website/          # Astro + Tailwind (Port 8003)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── .github/
    └── deploy.yaml
```

## Environment Variables

### Server (.env)
```env
PORT=8002
MONGODB_URL=mongodb://...
JWT_SECRET=your-secret
OPENAI_API_KEY=sk-...
```

### Client
No .env needed (API proxy configured in vite.config.ts)

### Website
No environment variables needed for static build

## Deployment

See detailed documentation:
- `DEPLOYMENT.md` - Complete deployment guide
- `QUICK_START.md` - Quick reference
- `CHECKLIST.md` - Pre-deployment checklist
- `DNS_SETUP.md` - Domain and SSL configuration

## Technologies

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- OpenAI Integration

### Client
- React 18
- Vite
- Material-UI (MUI)
- PWA (Service Workers)
- TypeScript

### Website
- Astro 5
- Tailwind CSS
- SASS
- Static Site Generation

---

**Ready to develop!** Start any service and begin coding. All ports are aligned between development and production.
