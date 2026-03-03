# Docker Setup for EvidenceCheck

## Quick Start with Docker

### Prerequisites
- Docker Desktop installed (download from https://www.docker.com/products/docker-desktop)
- Git installed

### Option 1: Using Docker Compose (Easiest)

```bash
# Clone the repository
git clone https://github.com/rithvik-palepu/mad-hacks-project.git
cd mad-hacks-project

# Build and run with docker-compose
docker-compose up --build
```

The app will be available at: `http://localhost:8501`

**First build takes 5-10 minutes** (downloading PyTorch and dependencies)

### Option 2: Using Docker directly

```bash
# Clone the repository
git clone https://github.com/rithvik-palepu/mad-hacks-project.git
cd mad-hacks-project

# Build the Docker image
docker build -t evidencecheck .

# Run the container
docker run -p 8501:8501 evidencecheck
```

The app will be available at: `http://localhost:8501`

### Stopping the Application

**With Docker Compose:**
```bash
docker-compose down
```

**With Docker:**
```bash
# Find container ID
docker ps

# Stop container
docker stop <container_id>
```

## Troubleshooting

**Port already in use:**
- Change port in docker-compose.yml: `"8502:8501"`
- Or stop other services using port 8501

**Build fails:**
- Make sure Docker Desktop is running
- Try: `docker system prune -a` to clear cache
- Check if you have enough disk space (Docker images can be large)

**Slow first build:**
- Normal - downloading PyTorch and dependencies (~2GB)
- First build takes 5-10 minutes
- Subsequent builds are much faster

**Permission errors (Linux/Mac):**
```bash
sudo docker-compose up --build
```

## Benefits of Docker

✅ No Python setup needed  
✅ No virtual environment setup  
✅ No dependency conflicts  
✅ Works on Windows, Mac, Linux  
✅ Consistent environment for all team members  
✅ One command to run: `docker-compose up --build`

