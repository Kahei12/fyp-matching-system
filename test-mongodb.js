/**
 * MongoDB 連接測試腳本
 * 用於診斷 SSL/TLS 連接問題
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧪 MongoDB 連接測試');
console.log('====================');
console.log('Node.js 版本:', process.version);
console.log('Mongoose 版本:', mongoose.version);
console.log('');

// MongoDB Atlas TLS 連接選項
const mongooseOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
    minPoolSize: 1,
    retryWrites: true,
    autoReconnect: true,
    reconnectTries: 3,
    reconnectInterval: 2000,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
};

async function testConnection() {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI 未設置');
        process.exit(1);
    }

    console.log('🔄 正在連接...');
    console.log('連接字串:', process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@')); // 隱藏密碼
    console.log('');

    // 監聽事件
    mongoose.connection.on('connected', () => {
        console.log('✅ connected 事件觸發');
    });

    mongoose.connection.on('error', (err) => {
        console.error('❌ error 事件:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('⚠️ disconnected 事件觸發');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('🔄 reconnected 事件觸發');
    });

    try {
        await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
        console.log('✅ 連接成功！');

        // 測試查詢
        console.log('');
        console.log('🔄 測試查詢...');

        const { MongoClient } = require('mongodb');
        const client = new MongoClient(process.env.MONGO_URI, {
            tls: true,
            tlsAllowInvalidCertificates: true,
        });

        await client.connect();
        const db = client.db('fyp_matching');

        // 列出集合
        const collections = await db.listCollections().toArray();
        console.log('📁 資料庫集合:', collections.map(c => c.name));

        // 測試讀取
        const projects = await db.collection('projects').find({}).limit(5).toArray();
        console.log('📄 項目數量:', projects.length);

        await client.close();

        console.log('');
        console.log('✅ 所有測試通過！');
        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('❌ 連接失敗:', error.message);
        console.error('');
        console.error('可能的原因:');
        console.error('  1. IP 白名單未正確設置');
        console.error('  2. 網絡連接不穩定');
        console.error('  3. MongoDB Atlas 伺服器端問題');
        console.error('  4. TLS 握手被中間設備干擾');
        console.error('');
        process.exit(1);
    }
}

testConnection();

// 優雅關閉
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('');
    console.log('🔒 連接已關閉');
    process.exit(0);
});
