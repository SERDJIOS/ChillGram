const mongoose = require('mongoose');
require('dotenv').config();

const testMongoDB = async () => {
  try {
    console.log('🚀 Testing MongoDB Atlas connection...');
    console.log(`📋 Connection URI: ${process.env.MONGO_URI?.replace(/:[^:@]*@/, ':***@')}`);
    
    // Подключение к MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Получаем информацию о базе данных
    const db = mongoose.connection.db;
    const admin = db.admin();
    
    // Проверяем статус подключения
    const serverStatus = await admin.serverStatus();
    console.log('\n📊 Server Information:');
    console.log(`  - MongoDB Version: ${serverStatus.version}`);
    console.log(`  - Host: ${serverStatus.host}`);
    console.log(`  - Uptime: ${Math.round(serverStatus.uptime / 3600)} hours`);
    
    // Получаем список коллекций
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    if (collections.length === 0) {
      console.log('  - No collections found (database is empty)');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`  - ${collection.name}: ${count} documents`);
      }
    }
    
    // Тестируем операции записи/чтения
    console.log('\n🧪 Testing database operations...');
    const testCollection = db.collection('connection_test');
    
    // Вставляем тестовый документ
    const testDoc = { 
      message: 'Connection test', 
      timestamp: new Date(),
      test: true 
    };
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('  ✅ Write operation successful');
    
    // Читаем тестовый документ
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('  ✅ Read operation successful');
    
    // Удаляем тестовый документ
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('  ✅ Delete operation successful');
    
    // Проверяем права доступа
    console.log('\n🔐 Checking database permissions...');
    try {
      const stats = await db.stats();
      console.log(`  ✅ Database stats accessible (${stats.collections} collections, ${Math.round(stats.dataSize / 1024)} KB)`);
    } catch (error) {
      console.log('  ⚠️  Limited access to database stats');
    }
    
    console.log('\n🎉 MongoDB Atlas is ready to use!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('🔑 Authentication failed. Please check your username and password in MONGO_URI');
    } else if (error.message.includes('network')) {
      console.error('🌐 Network error. Please check your internet connection and MongoDB Atlas network access');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Connection timeout. Please check your network and MongoDB Atlas configuration');
    } else {
      console.error('🔧 Configuration error. Please check your MONGO_URI in .env file');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Запуск теста если файл вызван напрямую
if (require.main === module) {
  testMongoDB();
}

module.exports = testMongoDB; 