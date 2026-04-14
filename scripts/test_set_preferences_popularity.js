const mongoose = require('mongoose');
require('dotenv').config();

async function testSetPreferences() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    });

    console.log('✅ Connected to MongoDB\n');

    const Project = require('../models/Project');
    const Student = require('../models/Student');
    const studentService = require('../services/studentService');

    // Get student s001 and check current state
    const student = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`👤 Student s001 current preferences: ${JSON.stringify(student.preferences)}`);
    console.log(`   preferencesSubmitted: ${student.preferencesSubmitted}`);

    // Get current popularity of projects in student's preferences
    const projectCodes = student.preferences;
    console.log('\n📊 Current popularity of projects in s001 preferences:');
    for (const code of projectCodes) {
      const proj = await Project.findOne({ code }).lean().exec();
      if (proj) {
        console.log(`   ${code} (${proj.title.substring(0, 30)}): popularity = ${proj.popularity}`);
      }
    }

    // Test: Clear student preferences (simulate fresh start)
    console.log('\n🔄 Resetting student s001 preferences...');
    await Student.updateOne({ id: 's001' }, { $set: { preferences: [], preferencesSubmitted: false } }).exec();
    console.log('✅ Cleared s001 preferences\n');

    // Test setPreferences: set to ["L11", "L12"] (first 2 projects from s001's original list)
    console.log('📝 Testing setPreferences with ["L11", "L12"]...');
    const result = await studentService.setPreferences('s001', ['L11', 'L12']);
    console.log(`Result: ${result.success ? '✅ Success' : '❌ Failed'} - ${result.message}`);

    // Check updated popularity
    console.log('\n📈 Popularity after setting ["L11", "L12"]:');
    const updatedProjects = await Project.find({ code: { $in: ['L11', 'L12', 'D11', 'D12'] } }).lean().exec();
    updatedProjects.forEach(p => {
      console.log(`   ${p.code}: popularity = ${p.popularity}`);
    });

    // Test changing preferences to different projects
    console.log('\n📝 Testing setPreferences with ["D11", "D12"] (swapping to different projects)...');
    const result2 = await studentService.setPreferences('s001', ['D11', 'D12']);
    console.log(`Result: ${result2.success ? '✅ Success' : '❌ Failed'} - ${result2.message}`);

    // Check popularity after swap
    console.log('\n📈 Popularity after swapping to ["D11", "D12"]:');
    const swappedProjects = await Project.find({ code: { $in: ['L11', 'L12', 'D11', 'D12'] } }).lean().exec();
    swappedProjects.forEach(p => {
      console.log(`   ${p.code}: popularity = ${p.popularity}`);
    });

    // Verify final state
    const finalStudent = await Student.findOne({ id: 's001' }).lean().exec();
    console.log(`\n👤 Final student s001 preferences: ${JSON.stringify(finalStudent.preferences)}`);
    console.log(`   preferencesSubmitted: ${finalStudent.preferencesSubmitted}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

testSetPreferences();
