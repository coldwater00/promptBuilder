#!/usr/bin/env bash
set -euo pipefail

# Posizionati nella directory radice del progetto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Se .env non esiste, crealo a partire da .env.example
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  echo "⚙️  File .env non trovato: copia automatica da .env.example..."
  cp .env.example .env
fi

# Se node_modules non esiste, installa le dipendenze
if [ ! -d "node_modules" ]; then
  echo "📦 Installazione dipendenze npm in corso..."
  npm install
fi

# Carica le porte da .env se presenti
if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BE_PORT="${PORT:-3002}"
FE_PORT="${FRONTEND_PORT:-5173}"
MODE="${1:-dev}"

case "$MODE" in
  dev)
    echo "🚀 Avvio PromptBuilder in modalità sviluppo (Backend :${BE_PORT} + Frontend Vite :${FE_PORT})..."
    exec npm run dev
    ;;
  server)
    echo "🚀 Avvio solo server backend Express (http://localhost:${BE_PORT})..."
    exec npm run dev:server
    ;;
  prod|start)
    if [ ! -d "dist/client" ]; then
      echo "🔨 Build di produzione del frontend in corso..."
      npm run build
    fi
    echo "🚀 Avvio PromptBuilder in modalità produzione (http://localhost:${BE_PORT})..."
    exec npm start
    ;;
  *)
    echo "Utilizzo: ./run.sh [dev|server|prod]"
    echo "  dev    (default) Avvia backend (:${BE_PORT}) + frontend Vite (:${FE_PORT})"
    echo "  server           Avvia solo il server backend Express (:${BE_PORT})"
    echo "  prod             Esegue la build (se assente) e avvia il server di produzione (:${BE_PORT})"
    exit 1
    ;;
esac
