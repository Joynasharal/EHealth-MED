const mongoose = require('mongoose');

const familyProfileSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Display name shown in UI (e.g. "Self", "Mom", "Dad")
    profileName: {
      type: String,
      required: [true, 'Profile name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    // Actual full name of the person
    actualName: {
      type: String,
      trim: true,
      default: '',
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    relationship: {
      type: String,
      enum: ['Self', 'Mom', 'Dad', 'Spouse', 'Son', 'Daughter', 'Sibling', 'Other'],
      required: [true, 'Relationship is required'],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    profilePhoto: {
      type: String,
      default: null,
    },
    // Marks the auto-created "Self" profile
    isDefaultProfile: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FamilyProfile', familyProfileSchema);
