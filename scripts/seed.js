require('dotenv').config();
const mongoose = require('mongoose');

const Project = require('../models/Project');
const Student = require('../models/Student');

const fypProjects = require('../services/fypProjectsData');
const mockData = require('../services/mockData');

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  await mongoose.connect(uri);
  console.log('Connected to DB for seeding');

  await Project.deleteMany({});
  await Student.deleteMany({});

  const projectDocs = fypProjects.map(p => ({
    code: p.code,
    title: p.title,
    supervisor: p.supervisor,
    supervisorId: p.supervisorId,
    description: p.description,
    skills: p.skills,
    capacity: p.capacity,
    popularity: p.popularity || 0,
    status: p.status,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    department: p.department,
    category: p.category
  }));
  await Project.insertMany(projectDocs);
  console.log(`Inserted ${projectDocs.length} projects.`);

  const students = (mockData && mockData.students) ? mockData.students : [];
  const studentDocs = students.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    gpa: parseFloat(s.gpa) || null,
    major: s.major,
    year: s.year,
    preferences: s.preferences || [],
    proposalSubmitted: !!s.proposalSubmitted,
    assignedProject: null
  }));
  if (studentDocs.length > 0) {
    await Student.insertMany(studentDocs);
    console.log(`Inserted ${studentDocs.length} students.`);
  } else {
    console.log('No students found in mockData to insert.');
  }

  await mongoose.disconnect();
  console.log('Seeding done and disconnected.');
}

run().catch(err => {
  console.error('Seeding error:', err);
  mongoose.disconnect();
});




