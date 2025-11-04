#!/bin/bash

# Скрипт быстрого восстановления бота
# Автор: AI Assistant
# Дата: $(date)

set -e  # Остановка при ошибке

# Настройки
PROJECT_DIR="/root/Tg_BOTs/tg-bot-mini"
BACKUP_DIR="/root/Tg_BOTs/backups"

# Функция показа помощи
show_help() {
    echo "🔄 Скрипт восстановления бота"
    echo ""
    echo "Использование:"
    echo "  $0 [номер_бэкапа]     - Восстановить из конкретного бэкапа"
    echo "  $0 latest             - Восстановить из последнего бэкапа"
    echo "  $0 list               - Показать список бэкапов"
    echo ""
    echo "Примеры:"
    echo "  $0 1                 - Восстановить из первого бэкапа"
    echo "  $0 latest            - Восстановить из последнего бэкапа"
    echo "  $0 list              - Показать список бэкапов"
}

# Показать список бэкапов
show_backups() {
    echo "📋 Доступные бэкапы:"
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "❌ Директория бэкапов не найдена: $BACKUP_DIR"
        exit 1
    fi
    
    backups=($(ls -t "$BACKUP_DIR"/tg-bot-backup-*.tar.gz 2>/dev/null || echo ""))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "❌ Бэкапы не найдены"
        exit 1
    fi
    
    for i in "${!backups[@]}"; do
        backup_file="${backups[$i]}"
        backup_name=$(basename "$backup_file" .tar.gz)
        backup_date=$(echo "$backup_name" | sed 's/tg-bot-backup-//' | sed 's/_/ /')
        backup_size=$(du -h "$backup_file" | cut -f1)
        echo "  $((i+1)). $backup_name ($backup_size) - $backup_date"
    done
}

# Восстановить из бэкапа
restore_backup() {
    local backup_num="$1"
    local backups=($(ls -t "$BACKUP_DIR"/tg-bot-backup-*.tar.gz 2>/dev/null || echo ""))
    
    if [ ${#backups[@]} -eq 0 ]; then
        echo "❌ Бэкапы не найдены"
        exit 1
    fi
    
    if [ "$backup_num" = "latest" ]; then
        backup_file="${backups[0]}"
    else
        if ! [[ "$backup_num" =~ ^[0-9]+$ ]] || [ "$backup_num" -lt 1 ] || [ "$backup_num" -gt ${#backups[@]} ]; then
            echo "❌ Неверный номер бэкапа. Доступны номера: 1-${#backups[@]}"
            exit 1
        fi
        backup_file="${backups[$((backup_num-1))]}"
    fi
    
    echo "🔄 Восстанавливаем из: $(basename "$backup_file")"
    
    # Останавливаем бота
    echo "⏹️ Останавливаем бота..."
    pkill -f "node index.js" || true
    sleep 2
    
    # Создаем резервную копию текущего состояния
    echo "💾 Создаем резервную копию текущего состояния..."
    if [ -d "$PROJECT_DIR" ]; then
        mv "$PROJECT_DIR" "$PROJECT_DIR.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
    fi
    
    # Создаем директорию проекта
    mkdir -p "$PROJECT_DIR"
    
    # Извлекаем бэкап
    echo "📦 Извлекаем бэкап..."
    cd "$PROJECT_DIR"
    tar -xzf "$backup_file" -C "$(dirname "$PROJECT_DIR")"
    
    # Перемещаем файлы в правильное место
    extracted_dir="$(dirname "$PROJECT_DIR")/tg-bot-backup-$(basename "$backup_file" .tar.gz | sed 's/tg-bot-backup-//')"
    if [ -d "$extracted_dir" ]; then
        mv "$extracted_dir"/* "$PROJECT_DIR/"
        rmdir "$extracted_dir"
    fi
    
    # Устанавливаем права
    chmod +x "$PROJECT_DIR"/*.sh 2>/dev/null || true
    
    # Устанавливаем зависимости
    echo "📦 Устанавливаем зависимости..."
    cd "$PROJECT_DIR"
    npm install --production
    
    # Запускаем бота
    echo "▶️ Запускаем бота..."
    nohup node index.js > server.log 2>&1 &
    
    echo "✅ Восстановление завершено!"
    echo "🌐 Бот доступен по адресу: http://165.232.139.129:3000"
    
    # Проверяем статус
    sleep 3
    if curl -s -I http://165.232.139.129:3000 > /dev/null 2>&1; then
        echo "✅ Бот успешно запущен и отвечает"
    else
        echo "⚠️ Бот запущен, но может быть недоступен. Проверьте логи: tail -f $PROJECT_DIR/server.log"
    fi
}

# Основная логика
case "${1:-latest}" in
    "list")
        show_backups
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        restore_backup "$1"
        ;;
esac


