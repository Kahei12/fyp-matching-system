const mongoose = require('mongoose');
require('dotenv').config();

async function testAddPreference() {
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

    // Find a project with popularity 0
    const project = await Project.findOne({ popularity: 0 }).exec();
    if (!project) {
      console.log('No project with popularity 0 found');
      await mongoose.disconnect();
      return;
    }

    console.log(`📁 Project before: Code=${project.code}, Title=${project.title}, Popularity=${project.popularity}`);

    // Find student s001
    const student = await Student.findOne({ id: 's001' }).exec();
    if (!student) {
      console.log('Student s001 not found');
      await mongoose.disconnect();
      return;
    }

    console.log(`👤 Student s001 preferences before: ${JSON.stringify(student.preferences)}`);

    // Simulate addPreference logic
    const existing = (student.preferences || []).map(p => String(p));
    const pidStr = String(project._id);
    console.log(`\n🔍 Checking if project ${pidStr} already in preferences: ${existing.includes(pidStr)}`);

    if (existing.includes(pidStr)) {
      console.log('Project already in preferences');
    } else {
      // Add preference
      student.preferences = existing.concat([pidStr]);
      await student.save();
      console.log('✅ Student preferences saved');

      // Update popularity
      console.log(`📈 Before project.save(): popularity = ${project.popularity}`);
      project.popularity = (project.popularity || 0) + 1;
      console.log(`📈 After increment: popularity = ${project.popularity}`);

      try {
        await project.save();
        console.log('✅ Project.save() completed without error');
      } catch (e) {
        console.error('❌ Project.save() error:', e.message);
      }
    }

    // Reload from DB to verify
    const updatedProject = await Project.findById(project._id).lean().exec();
    const updatedStudent = await Student.findOne({ id: 's001' }).lean().exec();

    console.log(`\n📁 Project after: Popularity=${updatedProject.popularity} (type: ${typeof updatedProject.popularity})`);
    console.log(`👤 Student s001 preferences after: ${JSON.stringify(updatedStudent.preferences)}`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  }
}

testAddPreference();
