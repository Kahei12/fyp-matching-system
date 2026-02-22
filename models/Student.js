const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  id: String, // student id like "S001"
  name: String,
  email: String,
  gpa: Number,
  major: String,
  year: String,
  preferences: [String], // array of project ids (can be code or ObjectId string)
  proposalSubmitted: { type: Boolean, default: false },
  assignedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  // For student-proposed projects
  proposedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  proposalApproved: { type: Boolean, default: false },  // If student's proposal was approved
  proposalStatus: { type: String, default: 'none' },  // none, pending, approved, rejected
  teacherNotes: [{
    note: String,
    teacherEmail: String,
    createdAt: Date
  }]
});

module.exports = mongoose.model('Student', StudentSchema);











