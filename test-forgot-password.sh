#!/bin/bash
cd /root/Tg_BOTs/tg-bot-mini

# Запускаем сервер
node index.js &
SERVER_PID=$!

# Ждем запуска
sleep 3

# Тестируем forgot-password
echo "=== Testing forgot-password ==="
curl -X POST http://localhost:3000/forgot-password \
  -d "email=people.us20@gmail.com" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -s | head -5

# Ждем обработки
sleep 2

# Убиваем сервер
kill $SERVER_PID





