const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  deadlines: {
    studentSelfProposal: Date,
    preference: Date,
    teacherProposalReview: Date,
    teacherSelfProposal: Date
  },
  matchingCompleted: { type: Boolean, default: false },
  currentPhase: { type: String, default: 'preference' },
  /** Set on key "student_cohort" to skip re-running bulk student seed */
  cohortVersion: { type: Number },
  /** Set on key "project_catalog" after catalogue → Project sync */
  catalogVersion: { type: Number },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
