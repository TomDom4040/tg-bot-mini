#!/bin/bash

# Скрипт автоматического бэкапа бота
# Автор: AI Assistant
# Дата: $(date)

set -e  # Остановка при ошибке

# Настройки
PROJECT_DIR="/root/Tg_BOTs/tg-bot-mini"
BACKUP_DIR="/root/Tg_BOTs/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="tg-bot-backup-$DATE"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Создаем директорию для бэкапов
mkdir -p "$BACKUP_DIR"

echo "🔄 Начинаем создание бэкапа: $BACKUP_NAME"

# Останавливаем бота для безопасного бэкапа
echo "⏹️ Останавливаем бота..."
pkill -f "node index.js" || true
sleep 2

# Создаем директорию бэкапа
mkdir -p "$BACKUP_PATH"

# Копируем основные файлы
echo "📁 Копируем основные файлы..."
cp -r "$PROJECT_DIR/index.js" "$BACKUP_PATH/"
cp -r "$PROJECT_DIR/package.json" "$BACKUP_PATH/"
cp -r "$PROJECT_DIR/package-lock.json" "$BACKUP_PATH/" 2>/dev/null || true
cp -r "$PROJECT_DIR/.env" "$BACKUP_PATH/"
cp -r "$PROJECT_DIR/backup.sh" "$BACKUP_PATH/"
cp -r "$PROJECT_DIR/restore.sh" "$BACKUP_PATH/"

# Копируем данные
echo "💾 Копируем данные..."
cp -r "$PROJECT_DIR/data" "$BACKUP_PATH/"

# Копируем node_modules (если нужно)
echo "📦 Копируем зависимости..."
cp -r "$PROJECT_DIR/node_modules" "$BACKUP_PATH/" 2>/dev/null || true

# Создаем архив
echo "🗜️ Создаем архив..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Удаляем старые бэкапы (оставляем последние 7)
echo "🧹 Очищаем старые бэкапы..."
ls -t "$BACKUP_DIR"/tg-bot-backup-*.tar.gz | tail -n +8 | xargs -r rm

# Запускаем бота обратно
echo "▶️ Запускаем бота..."
cd "$PROJECT_DIR"
nohup node index.js > server.log 2>&1 &

echo "✅ Бэкап создан: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "📊 Размер архива: $(du -h "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | cut -f1)"

# Показываем список бэкапов
echo "📋 Доступные бэкапы:"
ls -la "$BACKUP_DIR"/tg-bot-backup-*.tar.gz 2>/dev/null || echo "Бэкапы не найдены"


