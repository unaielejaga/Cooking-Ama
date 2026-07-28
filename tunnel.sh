#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOGS_DIR"

cleanup() {
  echo ""
  echo "Deteniendo túneles..."
  pkill -f "cloudflared" 2>/dev/null || true
  pkill -f "metro|expo start" 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

pkill -f "cloudflared" 2>/dev/null || true
pkill -f "metro|expo start" 2>/dev/null || true
sleep 2

cd "$SCRIPT_DIR/code"

echo "Iniciando Expo..."
EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000 npx expo start --web > "$LOGS_DIR/expo.log" 2>&1 &
sleep 12

if ! curl -s -o /dev/null http://localhost:8081 2>/dev/null; then
  echo "Puerto 8081 ocupado, liberando..."
  fuser -k 8081/tcp 2>/dev/null || true
  sleep 2
  EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000 npx expo start --web > "$LOGS_DIR/expo.log" 2>&1 &
  sleep 12
fi

wait_for_url() {
  local logfile=$1
  local timeout=${2:-30}
  local elapsed=0
  while [ $elapsed -lt $timeout ]; do
    url=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' "$logfile" | head -1)
    if [ -n "$url" ]; then
      echo "$url"
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  return 1
}

echo "Iniciando túnel de Supabase..."
npx cloudflared tunnel --protocol http2 --url http://localhost:8000 > "$LOGS_DIR/cloudflared-supabase.log" 2>&1 &
echo -n "Esperando URL de Supabase"
SUPABASE_URL=$(wait_for_url "$LOGS_DIR/cloudflared-supabase.log" 30) && echo " OK" || echo " (timeout)"

echo "Reiniciando Expo con URL remota..."
kill $(pgrep -f "metro|expo start") 2>/dev/null || true
sleep 3

if [ -n "$SUPABASE_URL" ]; then
  EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL npx expo start --web > "$LOGS_DIR/expo.log" 2>&1 &
else
  EXPO_PUBLIC_SUPABASE_URL=http://localhost:8000 npx expo start --web > "$LOGS_DIR/expo.log" 2>&1 &
fi
sleep 12

echo "Iniciando túnel de Expo..."
npx cloudflared tunnel --protocol http2 --url http://localhost:8081 > "$LOGS_DIR/cloudflared-expo.log" 2>&1 &
echo -n "Esperando URL de Expo"
EXPO_URL=$(wait_for_url "$LOGS_DIR/cloudflared-expo.log" 30) && echo " OK" || echo " (timeout)"

echo ""
echo "═══════════════════════════════════════════════"
echo "  App:       ${EXPO_URL:-http://localhost:8081}"
echo "  Supabase:  ${SUPABASE_URL:-http://localhost:8000}"
echo "═══════════════════════════════════════════════"
echo ""
echo "Logs: $LOGS_DIR/"
echo "Ctrl+C para parar."

wait