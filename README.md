# RD_WEB — Enterprise Road Survey & AI Pavement Monitoring Web Application

Enterprise React + TypeScript + Vite Web Application and Authentication API Service for Edge AI Pavement Condition Analysis (DATS / Nirikshan).

## Repository Architecture
```
RD_WEB/
├── frontend/             # Dedicated React + Vite + TypeScript Web Frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── backend/              # Dedicated FastAPI Authentication & User Management Service
│   ├── app/
│   │   ├── api/          # auth, users, permissions, audit, health
│   │   ├── core/         # PBKDF2 hashing, JWT signing
│   │   └── database/     # models, schemas, database session
│   ├── requirements.txt
│   └── Dockerfile
├── nginx/                # Dedicated Nginx reverse proxy configuration
│   └── nginx.conf
└── docker-compose.yml    # Root Docker Compose orchestrating all services
```

---

## Edge Device Deployment Commands (Jetson / Nvidia / Linux)

### Step 1: Clone Repository
Run the following commands on the Edge Device terminal (`/home/nvidia/`):
```bash
cd /home/nvidia/
git clone https://github.com/rebbasivesh/RD_WEB.git
cd RD_WEB
```

### Step 2: Build & Launch Container Cluster
```bash
sudo docker compose up -d --build
```

### Step 3: Verify Running Services
```bash
sudo docker ps
```

---

## Live Endpoints & Default Login Credentials

- **Web Application UI**: `http://<EDGE_DEVICE_IP>` (Port 80)
- **Auth API Endpoint**: `http://<EDGE_DEVICE_IP>:8000/api` (Port 8000)

### Initial System Credentials

| Role | Login ID | Default Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin` | `123admin` |
| **Operator** | `sivesh.jha` | `password123` |
| **Supervisor** | `p.mandava` | `password123` |
| **Viewer** | `dg.morth` | `password123` |

---

## Local Development Commands

### 1. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### 2. Run Auth Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
