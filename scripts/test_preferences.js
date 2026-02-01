/**
 * 測試腳本：驗證學生 preferences 是否正確保存到 MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Project = require('../models/Project');

async function testPreferences() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  
  console.log('🔌 連接到 MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ 已連接 MongoDB\n');

  // 檢查學生數據
  console.log('📋 檢查學生數據:');
  const students = await Student.find({}).lean().exec();
  students.forEach(s => {
    console.log(`\n  學生: [${s.id}] ${s.name}`);
    console.log(`    Email: ${s.email}`);
    console.log(`    GPA: ${s.gpa}`);
    console.log(`    Preferences: ${JSON.stringify(s.preferences)}`);
    console.log(`    Submitted: ${s.proposalSubmitted}`);
    console.log(`    Assigned Project: ${s.assignedProject || 'None'}`);
  });

  // 檢查項目數據
  console.log('\n📋 檢查項目數據:');
  const projects = await Project.find({}).limit(5).lean().exec();
  console.log(`   共 ${await Project.countDocuments()} 個項目`);
  projects.forEach(p => {
    console.log(`   [${p.code}] ${p.title.substring(0, 40)}... (ID: ${p._id})`);
  });

  await mongoose.disconnect();
  console.log('\n👋 已斷開 MongoDB 連接');
}

testPreferences().catch(err => {
  console.error('❌ 錯誤:', err);
  process.exit(1);
});
