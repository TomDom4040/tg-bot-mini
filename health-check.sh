#!/bin/bash

# Скрипт проверки работоспособности бота
# Автоматически проверяет все критически важные компоненты

set -e

PROJECT_DIR="/root/Tg_BOTs/tg-bot-mini"
BOT_URL="http://165.232.139.129:3000"
LOG_FILE="/root/Tg_BOTs/backups/health-check.log"

# Функция логирования
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Функция проверки HTTP ответа
check_http() {
    log "🔍 Проверяем HTTP ответ бота..."
    
    if curl -s -I "$BOT_URL" > /dev/null 2>&1; then
        log "✅ HTTP ответ: OK"
        return 0
    else
        log "❌ HTTP ответ: FAIL"
        return 1
    fi
}

# Функция проверки процесса
check_process() {
    log "🔍 Проверяем процесс бота..."
    
    if pgrep -f "node index.js" > /dev/null; then
        log "✅ Процесс бота: RUNNING"
        return 0
    else
        log "❌ Процесс бота: NOT RUNNING"
        return 1
    fi
}

# Функция проверки порта
check_port() {
    log "🔍 Проверяем порт 3000..."
    
    if ss -tlnp | grep :3000 > /dev/null; then
        log "✅ Порт 3000: LISTENING"
        return 0
    else
        log "❌ Порт 3000: NOT LISTENING"
        return 1
    fi
}

# Функция проверки файлов
check_files() {
    log "🔍 Проверяем критические файлы..."
    
    local files=("index.js" "package.json" ".env" "data")
    local all_ok=true
    
    for file in "${files[@]}"; do
        if [ -e "$PROJECT_DIR/$file" ]; then
            log "✅ $file: EXISTS"
        else
            log "❌ $file: MISSING"
            all_ok=false
        fi
    done
    
    if $all_ok; then
        return 0
    else
        return 1
    fi
}

# Функция проверки логов на ошибки
check_logs() {
    log "🔍 Проверяем логи на ошибки..."
    
    if [ -f "$PROJECT_DIR/server.log" ]; then
        local errors=$(tail -50 "$PROJECT_DIR/server.log" | grep -i "error\|fail\|exception" | wc -l)
        if [ "$errors" -gt 0 ]; then
            log "⚠️ Найдено $errors ошибок в логах"
            return 1
        else
            log "✅ Ошибок в логах не найдено"
            return 0
        fi
    else
        log "❌ Файл логов не найден"
        return 1
    fi
}

# Функция проверки админки
check_admin() {
    log "🔍 Проверяем доступность админки..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BOT_URL" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        log "✅ Админка: ACCESSIBLE"
        return 0
    else
        log "❌ Админка: NOT ACCESSIBLE (HTTP $response)"
        return 1
    fi
}

# Функция автоматического восстановления
auto_recovery() {
    log "🚨 АВТОМАТИЧЕСКОЕ ВОССТАНОВЛЕНИЕ"
    
    # Пытаемся перезапустить бота
    log "🔄 Пытаемся перезапустить бота..."
    pkill -f "node index.js" || true
    sleep 2
    
    cd "$PROJECT_DIR"
    nohup node index.js > server.log 2>&1 &
    
    sleep 5
    
    if check_http; then
        log "✅ Автоматическое восстановление: SUCCESS"
        return 0
    else
        log "❌ Автоматическое восстановление: FAILED"
        return 1
    fi
}

# Основная функция проверки
main() {
    log "🏥 НАЧИНАЕМ ПРОВЕРКУ ЗДОРОВЬЯ БОТА"
    log "=================================="
    
    local checks_passed=0
    local total_checks=6
    
    # Выполняем все проверки
    check_process && ((checks_passed++))
    check_port && ((checks_passed++))
    check_files && ((checks_passed++))
    check_logs && ((checks_passed++))
    check_http && ((checks_passed++))
    check_admin && ((checks_passed++))
    
    log "📊 РЕЗУЛЬТАТ: $checks_passed/$total_checks проверок пройдено"
    
    if [ "$checks_passed" -eq "$total_checks" ]; then
        log "✅ БОТ РАБОТАЕТ НОРМАЛЬНО"
        exit 0
    elif [ "$checks_passed" -ge 4 ]; then
        log "⚠️ БОТ РАБОТАЕТ С ПРОБЛЕМАМИ"
        exit 1
    else
        log "❌ БОТ НЕ РАБОТАЕТ"
        
        # Пытаемся автоматическое восстановление
        if auto_recovery; then
            log "✅ АВТОМАТИЧЕСКОЕ ВОССТАНОВЛЕНИЕ УСПЕШНО"
            exit 0
        else
            log "❌ ТРЕБУЕТСЯ РУЧНОЕ ВОССТАНОВЛЕНИЕ"
            log "🆘 Выполните: cd $PROJECT_DIR && ./rollback.sh rollback"
            exit 2
        fi
    fi
}

# Обработка аргументов
case "${1:-check}" in
    "check")
        main
        ;;
    "recovery")
        auto_recovery
        ;;
    "help"|"-h"|"--help")
        echo "🏥 Скрипт проверки здоровья бота"
        echo ""
        echo "Использование:"
        echo "  $0 check     - Полная проверка здоровья"
        echo "  $0 recovery  - Попытка автоматического восстановления"
        echo "  $0 help      - Показать эту справку"
        ;;
    *)
        echo "❌ Неизвестная команда: $1"
        exit 1
        ;;
esac
