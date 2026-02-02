/**
 * MongoDB 連接配置
 * 使用 MongoDB Driver 直接連接，更穩定
 */

const { MongoClient } = require('mongodb');

// 從環境變量讀取連接字串
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://fyp_user:fypmatchingsystem@fypmatching.j1hzf6h.mongodb.net/fyp_matching?retryWrites=true&w=majority';

let client = null;
let db = null;

// MongoDB Atlas TLS 連接選項 - 專門解決 Windows SSL 握手問題
const clientOptions = {
    // 伺服器選擇超時
    serverSelectionTimeoutMS: 30000,
    // Socket 超時
    socketTimeoutMS: 45000,
    // 連接池
    maxPoolSize: 5,
    minPoolSize: 1,
    // 重試
    retryWrites: true,
    // TLS/SSL 配置
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    // 強制使用 TLS v1.2（更相容）
    // tlsProtocol: 'TLSv1.2'
};

async function connectToMongoDB() {
    if (db) {
        return db; // 已經連接
    }

    try {
        console.log('🔄 正在連接 MongoDB Atlas...');

        client = new MongoClient(MONGO_URI, clientOptions);

        // 監聽連接事件
        client.on('topologyDescriptionChanged', (event) => {
            console.log('📊 拓撲結構變更:', event.topologyDescription.type);
        });

        await client.connect();

        db = client.db('fyp_matching');
        console.log('✅ MongoDB Atlas 連接成功');

        // 測試連接
        await db.command({ ping: 1 });
        console.log('✅ 連接測試成功');

        return db;
    } catch (error) {
        console.error('❌ MongoDB 連接失敗:', error.message);
        console.log('⚠️ 將使用模擬數據模式運行');
        return null;
    }
}

async function getDB() {
    if (!db) {
        await connectToMongoDB();
    }
    return db;
}

async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('🔒 MongoDB 連接已關閉');
    }
}

// 優雅關閉
process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
});

module.exports = {
    connectToMongoDB,
    getDB,
    closeConnection
};
