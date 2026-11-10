# HealthNexus - Real-Time Health Monitoring System

A real-time health monitoring platform with React frontend and Node.js backend, featuring MongoDB, Redis, RabbitMQ, Elasticsearch, and WebSocket support.

## Prerequisites

- Node.js (v16+)
- Docker Desktop (must be running)
- npm

## Quick Start

### 1. Start Infrastructure Services

Make sure Docker Desktop is running, then:

```bash
docker-compose up -d
```

This starts:
- MongoDB (port 27017)
- Redis (port 6379)
- RabbitMQ (port 5672, Management UI: 15672)
- Elasticsearch (port 9200)
- Logstash (port 5000)
- Prometheus (port 9090)

### 2. Start Backend Server

```bash
cd backend
npm start
```

Backend runs on `http://localhost:5000`

### 3. Start RabbitMQ Worker (Optional, in separate terminal)

```bash
cd backend
npm run worker
```

### 4. Start Frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Verification Steps

### 1. Check Docker Services

```bash
docker ps
```

All services should show as "Up".

### 2. Test Backend API

**Register a User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

Copy the `token` from the response.

**Add Health Reading:**
```bash
curl -X POST http://localhost:5000/api/health \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"heartRate\":75,\"bloodPressureSys\":120,\"bloodPressureDia\":80,\"oxygenSaturation\":98,\"bodyTemperature\":36.6}"
```

**Get Health History:**
```bash
curl http://localhost:5000/api/health \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Test Frontend

1. Open `http://localhost:5173`
2. You'll see the Login page
3. Register a new user or login with credentials
4. Click "Add Vitals" button
5. Enter health data and submit
6. Verify:
   - Dashboard cards update immediately
   - Charts reflect new data
   - If you enter critical values (HR > 100, Temp > 38, O2 < 95), check backend console for RabbitMQ alert

### 4. Test Real-time Updates

1. Open frontend in two browser windows
2. Login with same user in both
3. Add vitals in one window
4. Verify the other window updates automatically (via WebSocket)

### 5. Check Services

- **RabbitMQ Management:** http://localhost:15672 (guest/guest)
- **Elasticsearch:** http://localhost:9200
- **Prometheus:** http://localhost:9090

## Architecture

### Backend (`/backend`)
- **server.js**: Express + Socket.io server
- **models/**: MongoDB schemas (User, HealthData)
- **controllers/**: Business logic
- **routes/**: API endpoints
- **middleware/**: JWT authentication
- **workers/**: RabbitMQ consumers
- **config/**: DB and RabbitMQ setup

### Frontend (`/src`)
- **context/HealthContext.jsx**: State management + API integration
- **pages/Dashboard.jsx**: Main dashboard with charts
- **pages/Login.jsx**: Authentication
- **components/**: Reusable UI components

## Features Implemented

✅ JWT Authentication  
✅ Real-time WebSocket updates  
✅ Redis caching for frequently accessed data  
✅ RabbitMQ for async alert processing  
✅ Elasticsearch indexing for health data  
✅ Prometheus metrics endpoint  
✅ Logstash logging pipeline  
✅ Responsive React UI with Tailwind CSS  
✅ Interactive charts with Recharts  

## Troubleshooting

**Docker services won't start:**
- Ensure Docker Desktop is running
- Check ports aren't already in use
- Try `docker-compose down` then `docker-compose up -d`

**Backend connection errors:**
- Wait 30 seconds after starting Docker for services to initialize
- Check `.env` file in backend directory

**Frontend can't connect:**
- Ensure backend is running on port 5000
- Check browser console for CORS errors
