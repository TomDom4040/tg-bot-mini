# Настройка Email для сброса пароля

## Переменные окружения

Для работы функции "забыл пароль" необходимо настроить следующие переменные окружения:

### Gmail (рекомендуется)

```bash
export EMAIL_HOST="smtp.gmail.com"
export EMAIL_PORT="587"
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-app-password"
export EMAIL_FROM="your-email@gmail.com"
export BASE_URL="https://yourdomain.com"
```

### Другие SMTP провайдеры

```bash
# Yandex
export EMAIL_HOST="smtp.yandex.ru"
export EMAIL_PORT="587"
export EMAIL_USER="your-email@yandex.ru"
export EMAIL_PASS="your-password"

# Mail.ru
export EMAIL_HOST="smtp.mail.ru"
export EMAIL_PORT="587"
export EMAIL_USER="your-email@mail.ru"
export EMAIL_PASS="your-password"

# Custom SMTP
export EMAIL_HOST="your-smtp-server.com"
export EMAIL_PORT="587"
export EMAIL_USER="your-username"
export EMAIL_PASS="your-password"
```

## Настройка Gmail

1. Включите двухфакторную аутентификацию в Google аккаунте
2. Создайте пароль приложения:
   - Перейдите в настройки Google аккаунта
   - Безопасность → Пароли приложений
   - Создайте новый пароль для приложения
   - Используйте этот пароль в `EMAIL_PASS`

## Настройка для production

```bash
# .env файл
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=admin@yourdomain.com
EMAIL_PASS=your-app-password
EMAIL_FROM=admin@yourdomain.com
BASE_URL=https://yourdomain.com
SESSION_SECRET=your-very-secure-random-string
```

## Безопасность

- Используйте сильные пароли для email аккаунтов
- Включите двухфакторную аутентификацию
- Регулярно обновляйте пароли
- Используйте HTTPS в production

## Тестирование

Если email не настроен, система будет выводить токен сброса в консоль для тестирования.









