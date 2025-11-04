#!/bin/bash

# Система версионирования бота
# Позволяет создавать именованные версии и откатываться к ним

set -e

PROJECT_DIR="/root/Tg_BOTs/tg-bot-mini"
BACKUP_DIR="/root/Tg_BOTs/backups"
VERSIONS_DIR="/root/Tg_BOTs/versions"

# Создаем директорию для версий
mkdir -p "$VERSIONS_DIR"

# Функция создания версии
create_version() {
    local version_name="$1"
    
    if [ -z "$version_name" ]; then
        echo "❌ Необходимо указать название версии"
        echo "Пример: $0 create 'working-version'"
        exit 1
    fi
    
    # Проверяем, что версия не существует
    if [ -f "$VERSIONS_DIR/$version_name.tar.gz" ]; then
        echo "❌ Версия '$version_name' уже существует"
        echo "Используйте другое название или удалите существующую версию"
        exit 1
    fi
    
    echo "🔄 Создаем версию: $version_name"
    
    # Останавливаем бота для безопасного создания версии
    echo "⏹️ Останавливаем бота..."
    pkill -f "node index.js" || true
    sleep 2
    
    # Создаем директорию версии
    local version_path="$VERSIONS_DIR/$version_name"
    mkdir -p "$version_path"
    
    # Копируем основные файлы
    echo "📁 Копируем основные файлы..."
    cp -r "$PROJECT_DIR/index.js" "$version_path/"
    cp -r "$PROJECT_DIR/package.json" "$version_path/"
    cp -r "$PROJECT_DIR/package-lock.json" "$version_path/" 2>/dev/null || true
    cp -r "$PROJECT_DIR/.env" "$version_path/"
    cp -r "$PROJECT_DIR/backup.sh" "$version_path/"
    cp -r "$PROJECT_DIR/restore.sh" "$version_path/"
    cp -r "$PROJECT_DIR/rollback.sh" "$version_path/"
    cp -r "$PROJECT_DIR/health-check.sh" "$version_path/"
    cp -r "$PROJECT_DIR/version.sh" "$version_path/"
    
    # Копируем данные
    echo "💾 Копируем данные..."
    cp -r "$PROJECT_DIR/data" "$version_path/"
    
    # Копируем node_modules (если нужно)
    echo "📦 Копируем зависимости..."
    cp -r "$PROJECT_DIR/node_modules" "$version_path/" 2>/dev/null || true
    
    # Создаем архив версии
    echo "🗜️ Создаем архив версии..."
    cd "$VERSIONS_DIR"
    tar -czf "$version_name.tar.gz" "$version_name"
    rm -rf "$version_name"
    
    # Запускаем бота обратно
    echo "▶️ Запускаем бота..."
    cd "$PROJECT_DIR"
    nohup node index.js > server.log 2>&1 &
    
    echo "✅ Версия '$version_name' создана успешно!"
    echo "📊 Размер архива: $(du -h "$VERSIONS_DIR/$version_name.tar.gz" | cut -f1)"
    echo "📅 Дата создания: $(date)"
}

# Функция восстановления версии
restore_version() {
    local version_name="$1"
    
    if [ -z "$version_name" ]; then
        echo "❌ Необходимо указать название версии"
        echo "Пример: $0 restore 'working-version'"
        exit 1
    fi
    
    local version_file="$VERSIONS_DIR/$version_name.tar.gz"
    
    if [ ! -f "$version_file" ]; then
        echo "❌ Версия '$version_name' не найдена"
        echo "Доступные версии:"
        list_versions
        exit 1
    fi
    
    echo "🔄 Восстанавливаем версию: $version_name"
    
    # Останавливаем бота
    echo "⏹️ Останавливаем бота..."
    pkill -f "node index.js" || true
    sleep 2
    
    # Создаем резервную копию текущего состояния
    echo "💾 Сохраняем текущее состояние..."
    if [ -d "$PROJECT_DIR" ]; then
        mv "$PROJECT_DIR" "$PROJECT_DIR.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
    fi
    
    # Создаем директорию проекта
    mkdir -p "$PROJECT_DIR"
    
    # Извлекаем версию
    echo "📦 Извлекаем версию..."
    cd "$PROJECT_DIR"
    tar -xzf "$version_file" -C "$(dirname "$PROJECT_DIR")"
    
    # Перемещаем файлы в правильное место
    extracted_dir="$(dirname "$PROJECT_DIR")/$version_name"
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
    if curl -s -I http://165.232.139.129:3000 > /dev/null 2>&1; then
        echo "✅ ВЕРСИЯ '$version_name' ВОССТАНОВЛЕНА УСПЕШНО!"
        echo "🌐 Бот доступен по адресу: http://165.232.139.129:3000"
        echo "📋 Логи: tail -f $PROJECT_DIR/server.log"
    else
        echo "❌ ВОССТАНОВЛЕНИЕ НЕ УДАЛОСЬ! Бот не запустился."
        echo "🔍 Проверьте логи: tail -f $PROJECT_DIR/server.log"
        exit 1
    fi
}

# Функция удаления версии
delete_version() {
    local version_name="$1"
    
    if [ -z "$version_name" ]; then
        echo "❌ Необходимо указать название версии"
        echo "Пример: $0 delete 'old-version'"
        exit 1
    fi
    
    local version_file="$VERSIONS_DIR/$version_name.tar.gz"
    
    if [ ! -f "$version_file" ]; then
        echo "❌ Версия '$version_name' не найдена"
        exit 1
    fi
    
    echo "🗑️ Удаляем версию: $version_name"
    rm -f "$version_file"
    echo "✅ Версия '$version_name' удалена"
}

# Функция списка версий
list_versions() {
    echo "📋 ДОСТУПНЫЕ ВЕРСИИ:"
    echo "==================="
    
    if [ ! -d "$VERSIONS_DIR" ] || [ -z "$(ls -A "$VERSIONS_DIR" 2>/dev/null)" ]; then
        echo "❌ Версии не найдены"
        return
    fi
    
    local versions=($(ls -t "$VERSIONS_DIR"/*.tar.gz 2>/dev/null || echo ""))
    
    for i in "${!versions[@]}"; do
        local version_file="${versions[$i]}"
        local version_name=$(basename "$version_file" .tar.gz)
        local version_size=$(du -h "$version_file" | cut -f1)
        local version_date=$(stat -c %y "$version_file" | cut -d' ' -f1)
        echo "  $((i+1)). $version_name ($version_size) - $version_date"
    done
}

# Функция показа помощи
show_help() {
    echo "🏷️ СИСТЕМА ВЕРСИОНИРОВАНИЯ БОТА"
    echo "================================"
    echo ""
    echo "Использование:"
    echo "  $0 create <название>    - Создать именованную версию"
    echo "  $0 restore <название>   - Восстановить версию"
    echo "  $0 delete <название>    - Удалить версию"
    echo "  $0 list                 - Показать список версий"
    echo "  $0 help                 - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 create 'working-version'     - Создать версию 'working-version'"
    echo "  $0 restore 'working-version'    - Восстановить версию 'working-version'"
    echo "  $0 delete 'old-version'         - Удалить версию 'old-version'"
    echo "  $0 list                         - Показать все версии"
    echo ""
    echo "Рекомендуемые названия версий:"
    echo "  - 'working-version'     - Рабочая версия"
    echo "  - 'before-changes'     - До изменений"
    echo "  - 'stable-release'     - Стабильный релиз"
    echo "  - 'test-version'       - Тестовая версия"
}

# Основная логика
case "${1:-help}" in
    "create")
        create_version "$2"
        ;;
    "restore")
        restore_version "$2"
        ;;
    "delete")
        delete_version "$2"
        ;;
    "list")
        list_versions
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


