/**
 * 初始化學生數據到 MongoDB
 * 確保測試學生存在於數據庫中
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

const testStudents = [
  {
    id: 'S001',
    name: 'Chan Tai Man',
    email: 'student@hkmu.edu.hk',
    gpa: 3.45,
    major: 'Computer Science',
    year: 'Year 4',
    preferences: [],
    proposalSubmitted: false,
    assignedProject: null
  }
];

async function seedStudents() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  
  console.log('🔌 連接到 MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ 已連接 MongoDB');

  console.log('\n📋 初始化學生數據...');
  
  for (const studentData of testStudents) {
    try {
      const result = await Student.updateOne(
        { id: studentData.id },
        { $set: studentData },
        { upsert: true }
      );
      
      if (result.upsertedCount > 0) {
        console.log(`  ✅ 新增學生: [${studentData.id}] ${studentData.name}`);
      } else if (result.modifiedCount > 0) {
        console.log(`  🔄 更新學生: [${studentData.id}] ${studentData.name}`);
      } else {
        console.log(`  ⏭️  學生已存在: [${studentData.id}] ${studentData.name}`);
      }
    } catch (err) {
      console.error(`  ❌ 錯誤 [${studentData.id}]: ${err.message}`);
    }
  }

  console.log('\n📋 數據庫中的學生列表:');
  const allStudents = await Student.find({}).lean().exec();
  console.log(`   共 ${allStudents.length} 個學生\n`);
  allStudents.forEach(s => {
    console.log(`   [${s.id}] ${s.name} (${s.email})`);
  });

  await mongoose.disconnect();
  console.log('\n👋 已斷開 MongoDB 連接');
}

seedStudents().catch(err => {
  console.error('❌ 致命錯誤:', err);
  process.exit(1);
});
