#!/bin/bash
set -e

echo "🚀 Iniciando aplicação CodeWiki..."
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:5173"
echo ""

# Iniciar backend em background
echo "📦 Iniciando Backend..."
node server/api.js &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Aguardar backend estar pronto
echo "⏳ Aguardando backend..."
sleep 5

# Detectar porta do backend
BACKEND_PORT=${PORT:-${API_PORT:-5000}}

# Verificar se backend está rodando
if curl -f -s http://localhost:$BACKEND_PORT/health > /dev/null; then
    echo "✅ Backend está rodando na porta $BACKEND_PORT"
else
    echo "❌ Backend falhou ao iniciar"
    exit 1
fi

# Iniciar frontend
echo "🎨 Iniciando Frontend..."
npm run dev -- --host 0.0.0.0

# Se o frontend parar, matar o backend também
kill $BACKEND_PID 2>/dev/null || true
