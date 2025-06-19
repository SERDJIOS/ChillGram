#!/bin/bash

echo "🚀 Запуск IceGram Full Stack приложения..."
echo ""

# Проверяем, установлены ли зависимости
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Устанавливаем зависимости бэкенда..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontik/node_modules" ]; then
    echo "📦 Устанавливаем зависимости фронтенда..."
    cd frontik && npm install && cd ..
fi

echo ""
echo "🎯 Запускаем серверы..."
echo "📍 Бэкенд: http://localhost:3000"
echo "📍 Фронтенд: http://localhost:5000"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

# Запускаем оба сервера одновременно
npm run dev 