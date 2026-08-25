# RD_WEB — Enterprise Road Survey & AI Pavement Monitoring Web Application

Enterprise React + TypeScript + Vite Web Application for Edge AI Pavement Condition Analysis (DATS / Nirikshan).

## Features
- Interactive GIS Road Network Map & Telemetry Visualisation
- Real-time Survey Defect Detection & Pavement Condition Scoring (PCR)
- International Roughness Index (IRI) & Defect Breakdowns
- Storage & Edge Device System Diagnostics

## Deployment on Edge Device (Jetson / Nvidia / Linux) using Docker

### Quick Start with Docker Compose
```bash
# Clone the repository
git clone https://github.com/rebbasivesh/RD_WEB.git
cd RD_WEB

# Build & start the Docker container
docker compose up -d --build
```
The web frontend will be running live at `http://<EDGE_DEVICE_IP>` (Port 80).

### Standalone Docker Build & Run
```bash
docker build -t rd_web:latest .
docker run -d -p 80:80 --name rd_web_frontend rd_web:latest
```

## Local Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```
