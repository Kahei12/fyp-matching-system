const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  code: String,
  title: String,
  supervisor: String,
  supervisorId: String,
  supervisorEmail: String,  // Added for teacher identification
  description: String,
  skills: [String],
  capacity: Number,
  popularity: { type: Number, default: 0 },
  status: String,
  createdAt: Date,
  department: String,
  category: String,
  // For student proposed projects
  proposedBy: String,        // Student ID who proposed
  proposedByEmail: String,   // Student email
  isProposed: { type: Boolean, default: false },  // Is this a student-proposed project?
  proposalStatus: { type: String, default: 'pending' },  // pending, approved, rejected
  proposalDate: Date
});

module.exports = mongoose.model('Project', ProjectSchema);











