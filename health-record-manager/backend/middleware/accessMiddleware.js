const AccessControl = require('../models/AccessControl');
const FamilyProfile = require('../models/FamilyProfile');

/**
 * Middleware: verify user owns the profile OR has active shared access.
 * Sets req.profile, req.accessType ('owner' | 'view' | 'upload')
 */
const checkProfileAccess = async (req, res, next) => {
  try {
    const profileId = req.params.profileId || req.body.profileId;

    if (!profileId) {
      return res.status(400).json({ success: false, message: 'Profile ID is required' });
    }

    // 1. Owner check
    const ownedProfile = await FamilyProfile.findOne({
      _id: profileId,
      ownerUserId: req.user._id,
      isActive: true,
    });

    if (ownedProfile) {
      req.profile = ownedProfile;
      req.accessType = 'owner';
      return next();
    }

    // 2. Shared access check (by userId OR email)
    const access = await AccessControl.findOne({
      $or: [
        { targetUserId: req.user._id },
        { targetEmail: req.user.email },
      ],
      profileId,
      status: 'active',
      expiryDate: { $gt: new Date() },
    });

    if (!access) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this profile',
      });
    }

    req.profile = await FamilyProfile.findById(profileId);
    req.accessType = access.accessType; // 'view' | 'upload'
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: require upload permission (owner, upload, or manage access type)
 */
const requireUploadAccess = (req, res, next) => {
  if (req.accessType === 'owner' || req.accessType === 'upload' || req.accessType === 'manage') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Upload permission required for this profile',
  });
};

module.exports = { checkProfileAccess, requireUploadAccess };
