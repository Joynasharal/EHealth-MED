const MedicalRecord = require('../models/MedicalRecord');
const FamilyProfile = require('../models/FamilyProfile');
const AccessControl = require('../models/AccessControl');
const {
  generateHealthSummary,
  generatePatientSummary,
  generateDoctorSummary,
} = require('../services/aiSummaryService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─── GET /api/summary/:profileId ─────────────────────────────────────────────
// Returns full summary including both patient and doctor versions
const getHealthSummary = async (req, res, next) => {
  try {
    const { profileId } = req.params;

    // Allow owner OR doctor with active access
    let profile = await FamilyProfile.findOne({
      _id: profileId,
      ownerUserId: req.user._id,
      isActive: true,
    });

    if (!profile) {
      // Check doctor access
      const access = await AccessControl.findOne({
        targetEmail: req.user.email,
        profileId,
        status: 'active',
        expiryDate: { $gt: new Date() },
      });
      if (!access) return errorResponse(res, 403, 'Access denied');
      profile = await FamilyProfile.findById(profileId);
    }

    if (!profile) return errorResponse(res, 404, 'Profile not found');

    const records = await MedicalRecord.find({ profileId, isDeleted: false }).sort({ visitDate: -1 });
    const summary = generateHealthSummary(records);

    return successResponse(res, 200, 'Health summary generated', {
      profile: {
        _id: profile._id,
        profileName: profile.profileName,
        actualName: profile.actualName,
        age: profile.age,
        gender: profile.gender,
        bloodGroup: profile.bloodGroup,
      },
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/summary/:profileId/patient ─────────────────────────────────────
const getPatientSummary = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await FamilyProfile.findOne({
      _id: profileId,
      ownerUserId: req.user._id,
      isActive: true,
    });
    if (!profile) return errorResponse(res, 404, 'Profile not found');

    const records = await MedicalRecord.find({ profileId, isDeleted: false }).sort({ visitDate: -1 });
    const patientSummary = generatePatientSummary(records);

    return successResponse(res, 200, 'Patient summary generated', { patientSummary });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/summary/:profileId/doctor ──────────────────────────────────────
const getDoctorSummary = async (req, res, next) => {
  try {
    const { profileId } = req.params;

    // Owner or doctor with access
    let hasAccess = await FamilyProfile.findOne({
      _id: profileId,
      ownerUserId: req.user._id,
      isActive: true,
    });

    if (!hasAccess) {
      const access = await AccessControl.findOne({
        targetEmail: req.user.email,
        profileId,
        status: 'active',
        expiryDate: { $gt: new Date() },
      });
      if (!access) return errorResponse(res, 403, 'Access denied');
    }

    const records = await MedicalRecord.find({ profileId, isDeleted: false }).sort({ visitDate: -1 });
    const doctorSummary = generateDoctorSummary(records);

    return successResponse(res, 200, 'Doctor summary generated', { doctorSummary });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHealthSummary, getPatientSummary, getDoctorSummary };
