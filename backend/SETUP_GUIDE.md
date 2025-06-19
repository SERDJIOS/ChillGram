# 🚀 Инструкция по настройке Instagram Clone Backend

## 📋 Что у нас есть

✅ **Cloudinary настроен и работает!**
- Cloud Name: `dihf9mssr`
- API Key: `278547552248214`
- Статус: Подключение успешно

❌ **MongoDB Atlas требует настройки**
- Нужно добавить IP адрес в whitelist
- База данных: `instagram_clone`

## 🔧 Настройка MongoDB Atlas

### Шаг 1: Добавление IP адреса в whitelist

1. Зайдите в [MongoDB Atlas](https://cloud.mongodb.com/)
2. Выберите ваш кластер `DB`
3. Перейдите в **Network Access** (Доступ к сети)
4. Нажмите **Add IP Address**
5. Выберите **Add Current IP Address** или добавьте `0.0.0.0/0` для доступа отовсюду (не рекомендуется для продакшена)
6. Нажмите **Confirm**

### Шаг 2: Проверка пользователя базы данных

1. Перейдите в **Database Access** (Доступ к базе данных)
2. Убедитесь, что пользователь `Serdjios` существует
3. Проверьте, что пароль `1488228` правильный
4. Убедитесь, что у пользователя есть права `readWrite` на базу `instagram_clone`

### Шаг 3: Проверка строки подключения

Ваша текущая строка подключения:
```
MONGO_URI=mongodb+srv://Serdjios:1488228@icegram.za2takx.mongodb.net/ice_gram_with_serjio

## 🧪 Тестирование подключений

После настройки MongoDB Atlas запустите тесты:

```bash
# Тест MongoDB
npm run test:mongodb

# Тест Cloudinary (уже работает)
npm run test:cloudinary

# Тест всех подключений
npm run test:all
```

## 📦 Инициализация базы данных

После успешного подключения к MongoDB запустите миграцию:

```bash
# Создание индексов и коллекций
npm run migrate

# Или полная настройка (тесты + миграция)
npm run setup
```

## 🚀 Запуск сервера

```bash
# Разработка (с автоперезагрузкой)
npm run dev

# Продакшен
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

## 📊 Структура базы данных

После миграции будут созданы следующие коллекции:

- **users** - Пользователи
- **posts** - Посты с изображениями
- **likes** - Лайки постов
- **comments** - Комментарии к постам
- **follows** - Подписки между пользователями
- **notifications** - Уведомления

## 🔐 Переменные окружения (.env)

```env
# MongoDB Atlas
MONGO_URI=mongodb+srv://Serdjios:1488228@db.x4xc6u0.mongodb.net/instagram_clone?retryWrites=true&w=majority&appName=DB

# JWT Secret
JWT_SECRET=serdjioskayti

# Server Port
PORT=3000

# Cloudinary Configuration (✅ Работает)
CLOUDINARY_CLOUD_NAME=dihf9mssr
CLOUDINARY_API_KEY=278547552248214
CLOUDINARY_API_SECRET=OMsV_-8TYFULqYsnav-rcVryeys

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5000
```

## 🛠️ Доступные команды

```bash
npm start              # Запуск сервера
npm run dev            # Разработка с nodemon
npm run migrate        # Создание индексов БД
npm run test:mongodb   # Тест MongoDB
npm run test:cloudinary # Тест Cloudinary
npm run test:all       # Тест всех подключений
npm run setup          # Полная настройка
```

## 🔍 Диагностика проблем

### MongoDB Atlas не подключается
- Проверьте IP whitelist
- Убедитесь в правильности пароля
- Проверьте права пользователя

### Cloudinary не работает
- Проверьте API ключи в .env
- Убедитесь в правильности Cloud Name

### Сервер не запускается
- Проверьте порт 3000 (должен быть свободен)
- Убедитесь, что все зависимости установлены: `npm install`

## 📞 Поддержка

Если возникают проблемы:
1. Запустите `npm run test:all` для диагностики
2. Проверьте логи в консоли
3. Убедитесь, что все переменные окружения настроены правильно 