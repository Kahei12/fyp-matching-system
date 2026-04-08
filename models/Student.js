const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  id: String, // student id like "s001"
  name: String,
  email: String,
  password: String, // hashed password
  gpa: Number,
  major: { 
    type: String, 
    enum: ['Computer and Cyber Security', 'Electronics and Computer Engineering'], 
    default: 'Computer and Cyber Security' 
  }, // Student major
  year: String,
  preferences: [String], // array of project ids (can be code or ObjectId string)
  /** True after student clicks "Submit Preferences" (ranking lock). Distinct from self-proposal. */
  preferencesSubmitted: { type: Boolean, default: false },
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
  }],
  mustChangePassword: { type: Boolean, default: true },  // Requires password change on first login
  initialPassword: String  // Plain-text initial password for comparison during change
});

module.exports = mongoose.model('Student', StudentSchema);











