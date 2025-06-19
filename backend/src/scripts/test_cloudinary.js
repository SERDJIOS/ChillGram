const cloudinary = require('../config/cloudinary');
require('dotenv').config();

const testCloudinary = async () => {
  try {
    console.log('🚀 Testing Cloudinary connection...');
    
    // Проверяем конфигурацию
    console.log('📋 Cloudinary Configuration:');
    console.log(`  - Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`  - API Key: ${process.env.CLOUDINARY_API_KEY}`);
    console.log(`  - API Secret: ${process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'Not set'}`);
    
    // Тестируем подключение через API
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful!');
    console.log('📊 Response:', result);
    
    // Получаем информацию об аккаунте
    const usage = await cloudinary.api.usage();
    console.log('\n📈 Account Usage:');
    console.log(`  - Plan: ${usage.plan || 'Free'}`);
    console.log(`  - Credits used: ${usage.credits?.used || 0}/${usage.credits?.limit || 'unlimited'}`);
    console.log(`  - Storage used: ${Math.round((usage.storage?.used || 0) / 1024 / 1024)} MB`);
    console.log(`  - Bandwidth used: ${Math.round((usage.bandwidth?.used || 0) / 1024 / 1024)} MB`);
    
    // Проверяем папки
    console.log('\n📁 Checking folders...');
    try {
      const folders = await cloudinary.api.root_folders();
      console.log('  Available folders:', folders.folders.map(f => f.name));
    } catch (error) {
      console.log('  No custom folders found (this is normal for new accounts)');
    }
    
    console.log('\n🎉 Cloudinary is ready to use!');
    
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    
    if (error.http_code === 401) {
      console.error('🔑 Authentication failed. Please check your API credentials in .env file');
    } else if (error.http_code === 403) {
      console.error('🚫 Access forbidden. Please check your account permissions');
    } else {
      console.error('🌐 Network or configuration error. Please check your internet connection and credentials');
    }
    
    process.exit(1);
  }
};

// Запуск теста если файл вызван напрямую
if (require.main === module) {
  testCloudinary();
}

module.exports = testCloudinary; 