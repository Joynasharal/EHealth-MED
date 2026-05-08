const AccessControl = require('../models/AccessControl');
const User = require('../models/User');
const FamilyProfile = require('../models/FamilyProfile');
const MedicalRecord = require('../models/MedicalRecord');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─── Helper: auto-expire stale records ───────────────────────────────────────
const autoExpire = async (list) => {
  const now = new Date();
  const stale = list.filter((a) => a.status === 'active' && a.expiryDate < now);
  await Promise.all(stale.map((a) => {
    a.status = 'expired';
    return a.save();
  }));
};

// ─── POST /api/access/share ───────────────────────────────────────────────────
const shareAccess = async (req, res, next) => {
  try {
    const { targetEmail, profileId, accessType, expiryDays, customExpiry } = req.body;

    if (!targetEmail || !profileId) {
      return errorResponse(res, 400, 'Target email and profile are required');
    }

    // Verify profile ownership
    const profile = await FamilyProfile.findOne({
      _id: profileId,
      ownerUserId: req.user._id,
      isActive: true,
    });
    if (!profile) return errorResponse(res, 404, 'Profile not found or access denied');

    // Cannot share with yourself
    if (targetEmail.toLowerCase() === req.user.email.toLowerCase()) {
      return errorResponse(res, 400, 'Cannot share access with yourself');
    }

    // Resolve target user (may not exist yet — share by email still works)
    const targetUser = await User.findOne({ email: targetEmail.toLowerCase() });

    // Calculate expiry date
    let expiryDate;
    if (customExpiry) {
      expiryDate = new Date(customExpiry);
      expiryDate.setHours(23, 59, 59, 999);
    } else {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (parseInt(expiryDays) || 7));
    }

    if (expiryDate <= new Date()) {
      return errorResponse(res, 400, 'Expiry date must be in the future');
    }

    // Upsert: update existing active grant or create new one
    const existing = await AccessControl.findOne({
      ownerUserId: req.user._id,
      targetEmail: targetEmail.toLowerCase(),
      profileId,
      status: 'active',
    });

    let access;
    if (existing) {
      existing.accessType = accessType || 'view';
      existing.expiryDate = expiryDate;
      existing.targetUserId = targetUser?._id || null;
      await existing.save();
      access = existing;
    } else {
      access = await AccessControl.create({
        ownerUserId: req.user._id,
        targetEmail: targetEmail.toLowerCase(),
        targetUserId: targetUser?._id || null,
        profileId,
        accessType: accessType || 'view',
        expiryDate,
        sharedBy: req.user.fullName,
        status: 'active',
      });
    }

    const populated = await AccessControl.findById(access._id)
      .populate('profileId', 'profileName relationship actualName')
      .populate('targetUserId', 'fullName email profilePhoto');

    return successResponse(res, existing ? 200 : 201,
      existing ? 'Access updated successfully' : 'Access shared successfully',
      { access: populated }
    );
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/access/revoke/:id ───────────────────────────────────────────
const revokeAccess = async (req, res, next) => {
  try {
    const access = await AccessControl.findOneAndUpdate(
      { _id: req.params.id, ownerUserId: req.user._id },
      { status: 'revoked' },
      { new: true }
    );
    if (!access) return errorResponse(res, 404, 'Access record not found');
    return successResponse(res, 200, 'Access revoked successfully');
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/access/granted ──────────────────────────────────────────────────
// All grants made BY the logged-in user (patient view)
const getGrantedAccess = async (req, res, next) => {
  try {
    const accessList = await AccessControl.find({ ownerUserId: req.user._id })
      .populate('profileId', 'profileName relationship actualName')
      .populate('targetUserId', 'fullName email profilePhoto role')
      .sort({ createdAt: -1 });

    await autoExpire(accessList);

    // Re-fetch after expiry updates
    const fresh = await AccessControl.find({ ownerUserId: req.user._id })
      .populate('profileId', 'profileName relationship actualName')
      .populate('targetUserId', 'fullName email profilePhoto role')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Access list fetched', { accessList: fresh });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/access/shared-with-me ──────────────────────────────────────────
// All active grants received BY the logged-in user (doctor/family view)
const getSharedWithMe = async (req, res, next) => {
  try {
    const accessList = await AccessControl.find({
      $or: [
        { targetEmail: req.user.email },
        { targetUserId: req.user._id },
      ],
      status: 'active',
      expiryDate: { $gt: new Date() },
    })
      .populate('profileId', 'profileName actualName age gender bloodGroup relationship allergies chronicConditions')
      .populate('ownerUserId', 'fullName email profilePhoto')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Shared profiles fetched', { accessList });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/access/shared-profile/:profileId ───────────────────────────────
// Get records for a shared profile (doctor accessing patient records)
const getSharedProfileRecords = async (req, res, next) => {
  try {
    const { profileId } = req.params;

    // Verify active access
    const access = await AccessControl.findOne({
      $or: [
        { targetEmail: req.user.email },
        { targetUserId: req.user._id },
      ],
      profileId,
      status: 'active',
      expiryDate: { $gt: new Date() },
    });

    if (!access) {
      return errorResponse(res, 403, 'Access denied or expired for this profile');
    }

    const profile = await FamilyProfile.findById(profileId);
    if (!profile) return errorResponse(res, 404, 'Profile not found');

    const records = await MedicalRecord.find({ profileId, isDeleted: false })
      .sort({ visitDate: -1 });

    return successResponse(res, 200, 'Shared profile records fetched', {
      profile,
      records,
      accessType: access.accessType,
      expiryDate: access.expiryDate,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/access/check/:profileId ────────────────────────────────────────
// Check if current user has access to a profile (used by middleware)
const checkAccess = async (req, res, next) => {
  try {
    const { profileId } = req.params;

    const access = await AccessControl.findOne({
      $or: [
        { targetEmail: req.user.email },
        { targetUserId: req.user._id },
      ],
      profileId,
      status: 'active',
      expiryDate: { $gt: new Date() },
    });

    if (!access) {
      return successResponse(res, 200, 'No access', { hasAccess: false });
    }

    return successResponse(res, 200, 'Access found', {
      hasAccess: true,
      accessType: access.accessType,
      expiryDate: access.expiryDate,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shareAccess,
  revokeAccess,
  getGrantedAccess,
  getSharedWithMe,
  getSharedProfileRecords,
  checkAccess,
};
