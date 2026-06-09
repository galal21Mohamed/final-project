cat > setup.sh << 'EOF'
#!/bin/bash

# Set your GitHub token
GITHUB_TOKEN="${GITHUB_TOKEN:-your_github_token_here}"
set -e

echo "╔════════════════════════════════════════╗"
echo "║     ShopVerse Setup Script             ║"
echo "╚════════════════════════════════════════╝"

# Step 0: sudo
echo ""
echo "▶ Step 0: Configuring sudo..."
echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER > /dev/null
echo "Sudo configured"

# Step 1: Fix system limits
echo ""
echo "▶ Step 1: Fixing system limits..."
sudo sysctl -w fs.inotify.max_user_instances=512
sudo sysctl -w fs.inotify.max_user_watches=524288
sudo sysctl -w fs.file-max=131072
echo "System limits fixed"

# Step 2: Start minikube
echo ""
echo "▶ Step 2: Starting minikube..."
minikube start \
  --driver=docker \
  --nodes=3 \
  --cpus=2 \
  --memory=4096 \
  --disk-size=30g \
  --profile=shopverse 2>/dev/null || \
minikube start -p shopverse
echo "minikube started"

# Step 3: Fix kube-proxy
echo ""
echo "▶ Step 3: Checking kube-proxy..."
CRASHED=$(kubectl get pods -n kube-system | grep kube-proxy | grep -c "CrashLoopBackOff" || true)
if [ "$CRASHED" -gt "0" ]; then
  echo " Fixing crashed kube-proxy..."
  kubectl delete pods -n kube-system -l k8s-app=kube-proxy
  sleep 5
fi
echo "kube-proxy OK"

# Step 4: Build Docker images
echo ""
echo "▶ Step 4: Building Docker images..."
docker build -t shopverse-backend:v1.0.0 backend/ -q
docker build -t shopverse-frontend:v1.0.0 frontend/ -q
echo "Images built"

# Step 5: Load images to minikube
echo ""
echo "▶ Step 5: Loading images to minikube..."
minikube image load shopverse-backend:v1.0.0 -p shopverse
minikube image load shopverse-frontend:v1.0.0 -p shopverse
echo "Images loaded"

# Step 6: Install Traefik CRDs
echo ""
echo "▶ Step 6: Installing Traefik CRDs..."
kubectl apply -f https://raw.githubusercontent.com/traefik/traefik/v3.0.0/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml 2>/dev/null
echo "Traefik CRDs installed"

# Step 7: Install Traefik
echo ""
echo "▶ Step 7: Installing Traefik..."
helm repo add traefik https://traefik.github.io/charts 2>/dev/null || true
helm repo update -q
kubectl create namespace traefik --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null
helm upgrade --install traefik traefik/traefik \
  --namespace traefik \
  --values k8s/ingress/traefik-values.yaml \
  --timeout 120s -q
echo "Traefik installed"

# Step 8: Install ShopVerse
echo ""
echo "▶ Step 8: Installing ShopVerse..."
helm upgrade --install shopverse helm/shopverse \
  --namespace shopverse \
  --create-namespace -q
echo "ShopVerse installed"

# Step 9: Wait for MySQL
echo ""
echo "▶ Step 9: Waiting for MySQL..."
kubectl wait pod shopverse-mysql-0 -n shopverse \
  --for=condition=Ready --timeout=300s
kubectl wait pod shopverse-mysql-1 -n shopverse \
  --for=condition=Ready --timeout=300s
echo "MySQL ready"

# Step 10: Setup MySQL Replication
echo ""
echo "▶ Step 10: Setting up MySQL Replication..."
kubectl exec -n shopverse shopverse-mysql-0 -- \
  bash /docker-entrypoint-initdb.d/setup-primary.sh 2>/dev/null
kubectl exec -n shopverse shopverse-mysql-1 -- \
  bash /docker-entrypoint-initdb.d/setup-secondary.sh 2>/dev/null

REPLICA_STATUS=$(kubectl exec -n shopverse shopverse-mysql-1 -- \
  mysql -uroot -prootpassword \
  -e "SHOW REPLICA STATUS\G" 2>/dev/null | grep "Replica_IO_Running" | awk '{print $2}')

if [ "$REPLICA_STATUS" = "Yes" ]; then
  echo "MySQL Replication running"
else
  echo "Replication not running - check manually"
fi

# Step 11: Wait for all pods
echo ""
echo "▶ Step 11: Waiting for all pods..."
kubectl wait deployment/shopverse-backend -n shopverse \
  --for=condition=Available --timeout=300s
kubectl wait deployment/shopverse-frontend -n shopverse \
  --for=condition=Available --timeout=300s
echo "All pods ready"

# Step 12: Install ArgoCD
echo ""
echo "▶ Step 12: Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml \
  2>/dev/null | grep -v "unchanged" || true

echo "⏳ Waiting for ArgoCD server..."
kubectl wait deployment/argocd-server -n argocd \
  --for=condition=Available --timeout=300s
echo "ArgoCD installed"

# Step 13: Setup ArgoCD
echo ""
echo "▶ Step 13: Configuring ArgoCD..."
pkill -f "kubectl port-forward.*argocd" 2>/dev/null || true
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
sleep 5

ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" 2>/dev/null | base64 -d)

kubectl exec -n argocd deployment/argocd-server -- \
  argocd login localhost:8080 \
  --username admin \
  --password "$ARGOCD_PASSWORD" \
  --insecure 2>/dev/null

kubectl exec -n argocd deployment/argocd-server -- \
  argocd repo add https://github.com/galal21Mohamed/final-project.git \
  --username galal21Mohamed \
  --password ${GITHUB_TOKEN} \
  --insecure-skip-server-verification 2>/dev/null || true

kubectl exec -n argocd deployment/argocd-server -- \
  argocd app create shopverse \
  --repo https://github.com/galal21Mohamed/final-project.git \
  --path helm/shopverse \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace shopverse \
  --revision devops \
  --helm-set global.namespace=shopverse \
  --sync-policy automated \
  --auto-prune \
  --self-heal \
  --insecure 2>/dev/null || \
kubectl exec -n argocd deployment/argocd-server -- \
  argocd app sync shopverse --insecure 2>/dev/null || true

echo "ArgoCD configured"

# Final
MINIKUBE_IP=$(minikube ip -p shopverse)
echo ""
echo "╔════════════════════════════════════════╗"
echo "║         Setup Complete!                ║"
echo "╠════════════════════════════════════════╣"
echo "║ ShopVerse: http://${MINIKUBE_IP}:30080 ║"
echo "║ ArgoCD:    https://localhost:8080      ║"
echo "║ Username:  admin                       ║"
echo "║ Password:  ${ARGOCD_PASSWORD}          ║"
echo "╚════════════════════════════════════════╝"
EOF

chmod +x setup.sh