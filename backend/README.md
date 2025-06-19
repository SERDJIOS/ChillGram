# Chillgram Backend

Node.js API для социальной сети Chillgram.

## Технологии
- Node.js
- Express.js
- MongoDB
- Socket.io
- JWT

## Установка
```bash
npm install
cp .env.example .env
npm run dev
```

## API Endpoints
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/posts` - Получение постов
- `POST /api/posts` - Создание поста
- `GET /api/users/:id` - Профиль пользователя