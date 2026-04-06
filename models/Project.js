const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  // Basic identification
  code: String,                    // Project code (e.g., "T001", "S001")
  
  // Project content
  title: String,
  description: String,
  skills: [String],
  capacity: Number,
  
  // Categorization
  type: { 
    type: String, 
    enum: ['teacher', 'student'], 
    default: 'teacher' 
  },                             // 'teacher' = teacher-proposed, 'student' = student-proposed
  category: String,               // Project category (General, AI/ML, etc.)
  department: String,
  major: { type: String, enum: ['ECE', 'CCS', 'ECE+CCS', ''], default: '' }, // Project's major (for filtering)
  
  // Status management
  status: { 
    type: String, 
    enum: ['Under Review', 'Approved', 'Rejected', 'Active'], 
    default: 'Under Review' 
  },                             // Overall project status
  
  // Teacher info (for teacher-proposed projects)
  supervisor: String,
  supervisorId: String,
  supervisorEmail: String,
  
  // Student info (for student-proposed projects)
  proposedBy: String,             // Student ID who proposed
  proposedByName: String,        // Student name
  proposedByEmail: String,        // Student email
  
  // Proposal status (for student-proposed projects only)
  // Shows "Rejected" only when:
  // 1. ALL teachers have rejected it, OR
  // 2. Proposal deadline has passed
  proposalStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'hidden'], 
    default: 'pending' 
  },                             // pending, approved, rejected, hidden (not yet shown as rejected)
  
  // Tracking which teachers have reviewed this proposal
  teacherReviews: [{
    teacherId: String,
    teacherEmail: String,
    teacherName: String,
    decision: { 
      type: String, 
      enum: ['approve', 'reject', null], 
      default: null 
    },
    reviewedAt: Date
  }],
  
  // Project metrics
  popularity: { type: Number, default: 0 },  // How many students added this to preferences
  assignedCount: { type: Number, default: 0 }, // How many students are assigned to this project
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Additional flags
  isActive: { type: Boolean, default: true }
});

// Update timestamp on save (Mongoose 9+ uses async style)
ProjectSchema.pre('save', function() {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Project', ProjectSchema);











