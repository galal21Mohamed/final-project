#!/bin/bash
set -e

# GitHub Token - set this before running
# export GITHUB_TOKEN="your_token_here"

echo "╔════════════════════════════════════════╗"
echo "║     ShopVerse Setup Script             ║"
echo "╚════════════════════════════════════════╝"

echo "$USER ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/$USER > /dev/null
sudo sysctl -w fs.inotify.max_user_instances=512 -q
sudo sysctl -w fs.inotify.max_user_watches=524288 -q
sudo sysctl -w fs.file-max=131072 -q
echo "✅ System configured"

minikube start --driver=docker --nodes=3 --cpus=2 --memory=4096 --disk-size=30g --profile=shopverse 2>/dev/null || minikube start -p shopverse
echo "✅ minikube started"

CRASHED=$(kubectl get pods -n kube-system | grep kube-proxy | grep -c "CrashLoopBackOff" || true)
if [ "$CRASHED" -gt "0" ]; then kubectl delete pods -n kube-system -l k8s-app=kube-proxy && sleep 5; fi
echo "✅ kube-proxy OK"

docker build -t shopverse-backend:v1.0.0 backend/ -q
docker build -t shopverse-frontend:v1.0.0 frontend/ -q
minikube image load shopverse-backend:v1.0.0 -p shopverse
minikube image load shopverse-frontend:v1.0.0 -p shopverse
minikube image load galalmohamed/shopverse-backend:latest -p shopverse 2>/dev/null || true
minikube image load galalmohamed/shopverse-frontend:latest -p shopverse 2>/dev/null || true
docker pull fluent/fluentd:v1.16-1 && minikube image load fluent/fluentd:v1.16-1 -p shopverse 2>/dev/null || true
echo "✅ Images ready"

kubectl apply -f https://raw.githubusercontent.com/traefik/traefik/v3.0.0/docs/content/reference/dynamic-configuration/kubernetes-crd-definition-v1.yml 2>/dev/null
helm repo add traefik https://traefik.github.io/charts 2>/dev/null || true
helm repo update
kubectl create namespace traefik --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null
helm upgrade --install traefik traefik/traefik --namespace traefik --values k8s/ingress/traefik-values.yaml --timeout 120s
echo "✅ Traefik ready"

helm upgrade --install shopverse helm/shopverse --namespace shopverse --create-namespace
echo "✅ ShopVerse installed"

kubectl wait pod shopverse-mysql-0 -n shopverse --for=condition=Ready --timeout=300s
kubectl wait pod shopverse-mysql-1 -n shopverse --for=condition=Ready --timeout=300s
echo "✅ MySQL ready"

kubectl exec -n shopverse shopverse-mysql-0 -- bash /docker-entrypoint-initdb.d/setup-primary.sh 2>/dev/null
kubectl exec -n shopverse shopverse-mysql-1 -- bash /docker-entrypoint-initdb.d/setup-secondary.sh 2>/dev/null
echo "✅ MySQL Replication configured"

kubectl wait deployment/shopverse-backend -n shopverse --for=condition=Available --timeout=300s
kubectl wait deployment/shopverse-frontend -n shopverse --for=condition=Available --timeout=300s
echo "✅ All pods ready"

kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml 2>/dev/null | grep -v "unchanged" || true
kubectl wait deployment/argocd-server -n argocd --for=condition=Available --timeout=300s
echo "✅ ArgoCD installed"

pkill -f "kubectl port-forward.*argocd" 2>/dev/null || true
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
sleep 5

ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d)

kubectl exec -n argocd deployment/argocd-server -- argocd login localhost:8080 --username admin --password "$ARGOCD_PASSWORD" --insecure 2>/dev/null

kubectl exec -n argocd deployment/argocd-server -- argocd repo add https://github.com/galal21Mohamed/final-project.git --username galal21Mohamed --password "${GITHUB_TOKEN}" --insecure-skip-server-verification 2>/dev/null || true

kubectl exec -n argocd deployment/argocd-server -- argocd app create shopverse --repo https://github.com/galal21Mohamed/final-project.git --path helm/shopverse --dest-server https://kubernetes.default.svc --dest-namespace shopverse --revision devops --helm-set global.namespace=shopverse --sync-policy automated --auto-prune --self-heal --insecure 2>/dev/null || kubectl exec -n argocd deployment/argocd-server -- argocd app sync shopverse --insecure 2>/dev/null || true

echo "✅ ArgoCD configured"

MINIKUBE_IP=$(minikube ip -p shopverse)
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║           Setup Complete! 🎉                 ║"
echo "╠══════════════════════════════════════════════╣"
echo "║ ShopVerse: http://${MINIKUBE_IP}:30080       ║"
echo "║ ArgoCD:    https://localhost:8080            ║"
echo "║ Username:  admin                             ║"
echo "║ Password:  ${ARGOCD_PASSWORD}                ║"
echo "╚══════════════════════════════════════════════╝"