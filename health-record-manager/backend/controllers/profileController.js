const FamilyProfile = require('../models/FamilyProfile');
const MedicalRecord = require('../models/MedicalRecord');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get all profiles for logged-in user
// @route   GET /api/profiles
// @access  Private
const getProfiles = async (req, res, next) => {
  try {
    const profiles = await FamilyProfile.find({
      ownerUserId: req.user._id,
      isActive: true,
    }).sort({ createdAt: 1 });

    return successResponse(res, 200, 'Profiles fetched', { profiles });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single profile
// @route   GET /api/profiles/:id
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const profile = await FamilyProfile.findOne({
      _id: req.params.id,
      ownerUserId: req.user._id,
      isActive: true,
    });

    if (!profile) {
      return errorResponse(res, 404, 'Profile not found');
    }

    return successResponse(res, 200, 'Profile fetched', { profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Create family profile
// @route   POST /api/profiles
// @access  Private
const createProfile = async (req, res, next) => {
  try {
    const { profileName, age, gender, bloodGroup, relationship, dateOfBirth, allergies, chronicConditions } = req.body;

    // Limit profiles per user
    const count = await FamilyProfile.countDocuments({
      ownerUserId: req.user._id,
      isActive: true,
    });

    if (count >= 10) {
      return errorResponse(res, 400, 'Maximum 10 family profiles allowed');
    }

    const profile = await FamilyProfile.create({
      ownerUserId: req.user._id,
      profileName,
      age,
      gender,
      bloodGroup,
      relationship,
      dateOfBirth,
      allergies: allergies || [],
      chronicConditions: chronicConditions || [],
    });

    return successResponse(res, 201, 'Profile created successfully', { profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Update family profile
// @route   PUT /api/profiles/:id
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const profile = await FamilyProfile.findOneAndUpdate(
      { _id: req.params.id, ownerUserId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return errorResponse(res, 404, 'Profile not found');
    }

    return successResponse(res, 200, 'Profile updated', { profile });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete family profile (soft delete)
// @route   DELETE /api/profiles/:id
// @access  Private
const deleteProfile = async (req, res, next) => {
  try {
    const profile = await FamilyProfile.findOneAndUpdate(
      { _id: req.params.id, ownerUserId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!profile) {
      return errorResponse(res, 404, 'Profile not found');
    }

    return successResponse(res, 200, 'Profile deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfiles, getProfile, createProfile, updateProfile, deleteProfile };
