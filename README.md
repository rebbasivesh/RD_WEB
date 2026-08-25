# RD_WEB — Enterprise Road Survey & AI Pavement Monitoring Web Application

Enterprise React + TypeScript + Vite Web Application and Authentication API Service for Edge AI Pavement Condition Analysis (DATS / Nirikshan).

## Features
- Interactive GIS Road Network Map & Telemetry Visualisation
- User Authentication & Role-Based Access Control (RBAC)
- Real-time Survey Defect Detection & Pavement Condition Scoring (PCR)
- International Roughness Index (IRI) & Defect Breakdowns
- Storage & Edge Device System Diagnostics

## Initial Default Credentials
- **Super Admin**: `anoop.admin` / `admin123`
- **Operator**: `sivesh.jha` / `password123`
- **Supervisor**: `p.mandava` / `password123`
- **Viewer**: `dg.morth` / `password123`

## Deployment on Edge Device (Jetson / Nvidia / Linux) using Docker

### Quick Start with Docker Compose (Frontend + Auth Backend)
```bash
# Clone the repository
git clone https://github.com/rebbasivesh/RD_WEB.git
cd RD_WEB

# Build & start both Web Frontend and Authentication Backend containers
docker compose up -d --build
```
- Web Frontend: `http://<EDGE_DEVICE_IP>` (Port 80)
- Auth API Backend: `http://<EDGE_DEVICE_IP>:8000/api` (Port 8000)

### Manual Docker Build & Run
```bash
# Backend container
cd backend
docker build -t rd_web_backend:latest .
docker run -d -p 8000:8000 --name rd_web_backend rd_web_backend:latest

# Frontend container
cd ..
docker build -t rd_web_frontend:latest .
docker run -d -p 80:80 --name rd_web_frontend rd_web_frontend:latest
```

## Local Development
```bash
# Start frontend
npm install
npm run dev

# Start backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
