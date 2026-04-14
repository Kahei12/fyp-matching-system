const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabaseStats() {
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

    const Student = require('../models/Student');
    const Project = require('../models/Project');

    // Check collections count
    const studentCount = await Student.countDocuments().exec();
    const projectCount = await Project.countDocuments().exec();

    console.log(`📊 Database Statistics:`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Projects: ${projectCount}\n`);

    // List all students with details
    console.log('👥 All Students:');
    const students = await Student.find({}).lean().exec();
    students.forEach(s => {
      console.log(`   ID: ${s.id} | Name: ${s.name} | Email: ${s.email}`);
      console.log(`      Major: ${s.major} | GPA: ${s.gpa}`);
      console.log(`      Preferences (${s.preferences?.length || 0}): ${JSON.stringify(s.preferences)}`);
      console.log(`      Submitted: ${s.preferencesSubmitted} | Assigned: ${s.assignedProject ? 'Yes' : 'No'}`);
      console.log('');
    });

    // List all projects with popularity
    console.log('📁 All Projects (sorted by popularity):');
    const projects = await Project.find({}).sort({ popularity: -1 }).lean().exec();
    projects.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.code} | ${p.title.substring(0, 35)}`);
      console.log(`      Popularity: ${p.popularity} | Capacity: ${p.capacity} | Status: ${p.status}`);
      console.log(`      Supervisor: ${p.supervisor} | Type: ${p.type}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

checkDatabaseStats();
