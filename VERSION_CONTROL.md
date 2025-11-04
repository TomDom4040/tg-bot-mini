# 🏷️ Система версионирования бота

## 📋 Обзор

Система позволяет создавать именованные версии бота и быстро откатываться к ним. Намного удобнее, чем номера бэкапов!

## 🚀 Основные команды

### Создать версию
```bash
cd /root/Tg_BOTs/tg-bot-mini
./version.sh create "working-version"
```

### Восстановить версию
```bash
cd /root/Tg_BOTs/tg-bot-mini
./version.sh restore "working-version"
```

### Показать все версии
```bash
cd /root/Tg_BOTs/tg-bot-mini
./version.sh list
```

### Удалить версию
```bash
cd /root/Tg_BOTs/tg-bot-mini
./version.sh delete "old-version"
```

## 🎯 Рекомендуемые названия версий

### Основные версии:
- **`working-version`** - Текущая рабочая версия
- **`stable-release`** - Стабильный релиз
- **`before-changes`** - Версия до изменений

### Тестовые версии:
- **`test-version`** - Тестовая версия
- **`experimental`** - Экспериментальная версия
- **`debug-version`** - Версия для отладки

### Специальные версии:
- **`backup-before-update`** - Бэкап перед обновлением
- **`emergency-rollback`** - Экстренный откат
- **`feature-complete`** - Завершенная функция

## 📊 Как это работает

### 1. Создание версии
```bash
./version.sh create "my-version"
```
- Останавливает бота
- Копирует все файлы и данные
- Создает именованный архив
- Запускает бота обратно

### 2. Восстановление версии
```bash
./version.sh restore "my-version"
```
- Останавливает бота
- Сохраняет текущее состояние
- Восстанавливает из архива
- Устанавливает зависимости
- Запускает бота
- Проверяет работоспособность

## 🔄 Типичные сценарии

### Сценарий 1: Перед изменениями
```bash
# Создаем точку восстановления
./version.sh create "before-changes"

# Делаем изменения...
# Если что-то пошло не так:
./version.sh restore "before-changes"
```

### Сценарий 2: Тестирование
```bash
# Создаем тестовую версию
./version.sh create "test-version"

# Тестируем изменения...
# Если тест прошел успешно:
./version.sh create "stable-release"

# Если тест провалился:
./version.sh restore "working-version"
```

### Сценарий 3: Экстренный откат
```bash
# Если что-то сломалось:
./version.sh restore "working-version"
```

## 📁 Структура версий

```
/root/Tg_BOTs/versions/
├── working-version.tar.gz      # Рабочая версия
├── before-changes.tar.gz       # До изменений
├── stable-release.tar.gz       # Стабильный релиз
└── test-version.tar.gz         # Тестовая версия
```

## 🛡️ Безопасность

### Что сохраняется в версии:
- ✅ **Код бота** (index.js, package.json)
- ✅ **Данные** (все настройки ботов)
- ✅ **Конфигурация** (.env файл)
- ✅ **Скрипты** (backup.sh, restore.sh, etc.)
- ✅ **Зависимости** (node_modules)

### Что НЕ сохраняется:
- ❌ **Логи** (server.log)
- ❌ **Временные файлы**
- ❌ **Кэш**

## ⚡ Быстрые команды

### Создать версию "до изменений"
```bash
./version.sh create "before-changes"
```

### Откатиться к рабочей версии
```bash
./version.sh restore "working-version"
```

### Показать все версии
```bash
./version.sh list
```

## 🔍 Проверка после восстановления

После восстановления версии проверьте:

1. **HTTP ответ**: `curl -I http://165.232.139.129:3000`
2. **Админка**: Откройте http://165.232.139.129:3000
3. **Логи**: `tail -f /root/Tg_BOTs/tg-bot-mini/server.log`
4. **Процесс**: `ps aux | grep "node index.js"`

## 🎯 Интеграция с другими скриптами

### С системой бэкапов:
```bash
# Создаем версию
./version.sh create "stable-release"

# Создаем обычный бэкап
./backup.sh
```

### С системой отката:
```bash
# Если что-то сломалось:
./rollback.sh rollback

# Или восстановить конкретную версию:
./version.sh restore "working-version"
```

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте версии**: `./version.sh list`
2. **Восстановите рабочую**: `./version.sh restore "working-version"`
3. **Проверьте логи**: `tail -f server.log`

---
*Система версионирования для максимального контроля над изменениями*


