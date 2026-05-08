const mongoose = require('mongoose');

const accessControlSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetEmail: {
      type: String,
      required: [true, 'Target email is required'],
      lowercase: true,
      trim: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyProfile',
      required: true,
    },
    accessType: {
      type: String,
      enum: ['view', 'upload'],
      default: 'view',
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked'],
      default: 'active',
    },
    sharedBy: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Auto-expire check
accessControlSchema.methods.isExpired = function () {
  return new Date() > this.expiryDate;
};

module.exports = mongoose.model('AccessControl', accessControlSchema);
