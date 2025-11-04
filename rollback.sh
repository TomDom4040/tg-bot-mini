#!/bin/bash

# Скрипт быстрого отката к рабочему состоянию
# Используется когда что-то пошло не так во время изменений

set -e

PROJECT_DIR="/root/Tg_BOTs/tg-bot-mini"
BACKUP_DIR="/root/Tg_BOTs/backups"

echo "🚨 ЭКСТРЕННЫЙ ОТКАТ К РАБОЧЕМУ СОСТОЯНИЮ"
echo "========================================"

# Функция проверки работоспособности
check_health() {
    echo "🔍 Проверяем работоспособность бота..."
    
    # Проверяем, отвечает ли бот
    if curl -s -I http://165.232.139.129:3000 > /dev/null 2>&1; then
        echo "✅ Бот отвечает на HTTP запросы"
        return 0
    else
        echo "❌ Бот не отвечает на HTTP запросы"
        return 1
    fi
}

# Функция быстрого отката
quick_rollback() {
    echo "🔄 Выполняем быстрый откат..."
    
    # Останавливаем бота
    echo "⏹️ Останавливаем бота..."
    pkill -f "node index.js" || true
    sleep 2
    
    # Находим последний рабочий бэкап
    latest_backup=$(ls -t "$BACKUP_DIR"/tg-bot-backup-*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        echo "❌ Бэкапы не найдены! Невозможно выполнить откат."
        exit 1
    fi
    
    echo "📦 Восстанавливаем из: $(basename "$latest_backup")"
    
    # Создаем резервную копию текущего состояния
    echo "💾 Сохраняем текущее состояние..."
    if [ -d "$PROJECT_DIR" ]; then
        mv "$PROJECT_DIR" "$PROJECT_DIR.broken.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
    fi
    
    # Создаем директорию проекта
    mkdir -p "$PROJECT_DIR"
    
    # Извлекаем бэкап
    echo "📦 Извлекаем рабочий бэкап..."
    cd "$PROJECT_DIR"
    tar -xzf "$latest_backup" -C "$(dirname "$PROJECT_DIR")"
    
    # Перемещаем файлы в правильное место
    extracted_dir="$(dirname "$PROJECT_DIR")/tg-bot-backup-$(basename "$latest_backup" .tar.gz | sed 's/tg-bot-backup-//')"
    if [ -d "$extracted_dir" ]; then
        mv "$extracted_dir"/* "$PROJECT_DIR/"
        rmdir "$extracted_dir"
    fi
    
    # Устанавливаем права
    chmod +x "$PROJECT_DIR"/*.sh 2>/dev/null || true
    
    # Устанавливаем зависимости
    echo "📦 Устанавливаем зависимости..."
    cd "$PROJECT_DIR"
    npm install --production --silent
    
    # Запускаем бота
    echo "▶️ Запускаем бота..."
    nohup node index.js > server.log 2>&1 &
    
    # Ждем запуска
    echo "⏳ Ждем запуска бота..."
    sleep 5
    
    # Проверяем работоспособность
    if check_health; then
        echo "✅ ОТКАТ УСПЕШЕН! Бот работает нормально."
        echo "🌐 Бот доступен по адресу: http://165.232.139.129:3000"
        echo "📋 Логи: tail -f $PROJECT_DIR/server.log"
    else
        echo "❌ ОТКАТ НЕ УДАЛСЯ! Бот не запустился."
        echo "🔍 Проверьте логи: tail -f $PROJECT_DIR/server.log"
        echo "🆘 Попробуйте ручное восстановление: ./restore.sh latest"
        exit 1
    fi
}

# Функция диагностики
diagnose() {
    echo "🔍 ДИАГНОСТИКА ПРОБЛЕМЫ"
    echo "========================"
    
    # Проверяем статус бота
    echo "📊 Статус процессов:"
    ps aux | grep "node index.js" | grep -v grep || echo "❌ Бот не запущен"
    
    # Проверяем порт
    echo "🌐 Проверка порта 3000:"
    ss -tlnp | grep :3000 || echo "❌ Порт 3000 не занят"
    
    # Проверяем логи
    echo "📋 Последние ошибки в логах:"
    if [ -f "$PROJECT_DIR/server.log" ]; then
        tail -10 "$PROJECT_DIR/server.log" | grep -i error || echo "❌ Ошибок в логах не найдено"
    else
        echo "❌ Файл логов не найден"
    fi
    
    # Проверяем файлы
    echo "📁 Проверка основных файлов:"
    [ -f "$PROJECT_DIR/index.js" ] && echo "✅ index.js" || echo "❌ index.js"
    [ -f "$PROJECT_DIR/package.json" ] && echo "✅ package.json" || echo "❌ package.json"
    [ -f "$PROJECT_DIR/.env" ] && echo "✅ .env" || echo "❌ .env"
    [ -d "$PROJECT_DIR/data" ] && echo "✅ data/" || echo "❌ data/"
}

# Функция показа помощи
show_help() {
    echo "🚨 СКРИПТ ЭКСТРЕННОГО ОТКАТА"
    echo "============================"
    echo ""
    echo "Использование:"
    echo "  $0 rollback    - Быстрый откат к последнему рабочему состоянию"
    echo "  $0 diagnose    - Диагностика проблем"
    echo "  $0 help        - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 rollback    - Откатиться к рабочему состоянию"
    echo "  $0 diagnose    - Понять, что сломалось"
    echo ""
    echo "После отката:"
    echo "  - Проверьте: curl -I http://165.232.139.129:3000"
    echo "  - Логи: tail -f $PROJECT_DIR/server.log"
    echo "  - Админка: http://165.232.139.129:3000"
}

# Основная логика
case "${1:-rollback}" in
    "rollback")
        quick_rollback
        ;;
    "diagnose")
        diagnose
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Неизвестная команда: $1"
        show_help
        exit 1
        ;;
esac
