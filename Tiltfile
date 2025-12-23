## Backend: Docker image + Kubernetes (kind)
docker_build(
  'full-stack-app:local',
  '.',
  dockerfile='Dockerfile',
)

# Kubernetes manifests
k8s_yaml('k8s/app.yaml')

# Resource config: port-forward 8080 so you can hit the backend
k8s_resource(
  'full-stack-app',
  port_forwards=[8080],
)

## Frontend: Vite dev server via pnpm dev
# One-time (or infrequent) install step, managed by Tilt
local_resource(
  'frontend-install',
  cmd='cd frontend && pnpm install',
  deps=['frontend/package.json', 'frontend/pnpm-lock.yaml'],
  allow_parallel=True,
)

# Long-running Vite dev server, started automatically by Tilt
local_resource(
  'frontend-dev',
  cmd='cd frontend && pnpm dev --host 0.0.0.0 --port 5173',
  deps=['frontend'],
  serve_cmd='cd frontend && pnpm dev --host 0.0.0.0 --port 5173',
  allow_parallel=True,
)