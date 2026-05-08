const MedicalRecord = require('../models/MedicalRecord');
const FamilyProfile = require('../models/FamilyProfile');
const { runOCR } = require('../services/ocrService');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const fs = require('fs');
const path = require('path');

const buildFileUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

const parseJSON = (str, fallback = []) => {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
};

// ─── POST /api/records/ocr-extract ───────────────────────────────────────────
const ocrExtract = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 400, 'No file uploaded');

    const fileData = {
      filename: req.file.filename, originalName: req.file.originalname,
      mimetype: req.file.mimetype, size: req.file.size,
      path: req.file.path, url: buildFileUrl(req, req.file.filename),
    };

    let ocrResult = {};
    try {
      ocrResult = await runOCR(req.file.path, req.file.mimetype, req.body.recordType || null);
    } catch (err) {
      console.error('OCR error:', err.message);
      ocrResult = { extractedText: '', documentType: 'Other', ocrConfidence: 'none' };
    }

    return successResponse(res, 200, 'OCR extraction complete', {
      file: fileData,
      extracted: {
        documentType: ocrResult.documentType || 'Other',
        ocrConfidence: ocrResult.ocrConfidence || 'none',
        extractedText: ocrResult.extractedText || '',
        doctorName: ocrResult.doctorName || '',
        hospitalName: ocrResult.hospitalName || '',
        diagnosis: ocrResult.diagnosis || '',
        notes: ocrResult.notes || '',
        visitDate: ocrResult.visitDate || '',
        medicines: ocrResult.medicines || [],
        labName: ocrResult.labName || '',
        patientName: ocrResult.patientName || '',
        labTests: ocrResult.labTests || [],
        impression: ocrResult.impression || '',
        scanType: ocrResult.scanType || '',
        bodyPart: ocrResult.bodyPart || '',
        findings: ocrResult.findings || '',
        admissionDate: ocrResult.admissionDate || '',
        dischargeDate: ocrResult.dischargeDate || '',
        treatmentSummary: ocrResult.treatmentSummary || '',
        dischargeAdvice: ocrResult.dischargeAdvice || '',
        conditionAtDischarge: ocrResult.conditionAtDischarge || '',
        billNumber: ocrResult.billNumber || '',
        totalAmount: ocrResult.totalAmount || '',
        lineItems: ocrResult.lineItems || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/records/upload ─────────────────────────────────────────────────
const uploadRecord = async (req, res, next) => {
  try {
    const { profileId, recordType, existingFilename, extractedText } = req.body;
    if (!profileId) return errorResponse(res, 400, 'Profile ID is required');

    const profile = await FamilyProfile.findOne({ _id: profileId, ownerUserId: req.user._id, isActive: true });
    if (!profile) return errorResponse(res, 404, 'Profile not found or access denied');

    let fileData = null;
    let ocrData = {};

    if (req.file) {
      fileData = {
        filename: req.file.filename, originalName: req.file.originalname,
        mimetype: req.file.mimetype, size: req.file.size,
        path: req.file.path, url: buildFileUrl(req, req.file.filename),
      };
      try { ocrData = await runOCR(req.file.path, req.file.mimetype, recordType); } catch (e) { console.error('OCR:', e.message); }
    } else if (existingFilename) {
      const filePath = path.join(__dirname, '..', 'uploads', existingFilename);
      if (fs.existsSync(filePath)) {
        fileData = {
          filename: existingFilename, originalName: existingFilename,
          mimetype: existingFilename.match(/\.pdf$/i) ? 'application/pdf' : 'image/jpeg',
          path: filePath, url: `${req.protocol}://${req.get('host')}/uploads/${existingFilename}`,
        };
      }
    }

    const b = req.body;
    const record = await MedicalRecord.create({
      profileId, ownerUserId: req.user._id, uploadedFile: fileData,
      recordType: recordType || ocrData.documentType || 'Other',
      doctorName: b.doctorName || ocrData.doctorName || '',
      hospitalName: b.hospitalName || ocrData.hospitalName || '',
      diagnosis: b.diagnosis || ocrData.diagnosis || '',
      notes: b.notes || ocrData.notes || '',
      visitDate: b.visitDate || ocrData.visitDate || new Date(),
      medicines: parseJSON(b.medicines).length > 0 ? parseJSON(b.medicines) : (ocrData.medicines || []),
      labName: b.labName || ocrData.labName || '',
      patientName: b.patientName || ocrData.patientName || '',
      labTests: parseJSON(b.labTests).length > 0 ? parseJSON(b.labTests) : (ocrData.labTests || []),
      impression: b.impression || ocrData.impression || '',
      scanType: b.scanType || ocrData.scanType || '',
      bodyPart: b.bodyPart || ocrData.bodyPart || '',
      findings: b.findings || ocrData.findings || '',
      admissionDate: b.admissionDate || ocrData.admissionDate || '',
      dischargeDate: b.dischargeDate || ocrData.dischargeDate || '',
      treatmentSummary: b.treatmentSummary || ocrData.treatmentSummary || '',
      dischargeAdvice: b.dischargeAdvice || ocrData.dischargeAdvice || '',
      conditionAtDischarge: b.conditionAtDischarge || ocrData.conditionAtDischarge || '',
      billNumber: b.billNumber || ocrData.billNumber || '',
      totalAmount: b.totalAmount || ocrData.totalAmount || '',
      lineItems: parseJSON(b.lineItems).length > 0 ? parseJSON(b.lineItems) : (ocrData.lineItems || []),
      extractedText: extractedText || ocrData.extractedText || '',
      ocrProcessed: !!(extractedText || ocrData.extractedText),
      ocrConfidence: ocrData.ocrConfidence || '',
    });

    return successResponse(res, 201, 'Record saved successfully', { record, ocrExtracted: ocrData });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/records/:profileId ─────────────────────────────────────────────
const getRecords = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const { search, doctor, hospital, diagnosis, recordType, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { profileId, isDeleted: false };
    if (search) {
      query.$or = [
        { doctorName: { $regex: search, $options: 'i' } },
        { hospitalName: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
        { 'medicines.name': { $regex: search, $options: 'i' } },
        { 'labTests.testName': { $regex: search, $options: 'i' } },
      ];
    }
    if (doctor) query.doctorName = { $regex: doctor, $options: 'i' };
    if (hospital) query.hospitalName = { $regex: hospital, $options: 'i' };
    if (diagnosis) query.diagnosis = { $regex: diagnosis, $options: 'i' };
    if (recordType) query.recordType = recordType;
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await MedicalRecord.countDocuments(query);
    const records = await MedicalRecord.find(query).sort({ visitDate: -1 }).skip(skip).limit(parseInt(limit));
    return successResponse(res, 200, 'Records fetched', {
      records,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) },
    });
  } catch (error) { next(error); }
};

// ─── GET /api/records/detail/:id ─────────────────────────────────────────────
const getRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, ownerUserId: req.user._id, isDeleted: false });
    if (!record) return errorResponse(res, 404, 'Record not found');
    return successResponse(res, 200, 'Record fetched', { record });
  } catch (error) { next(error); }
};

// ─── PUT /api/records/:id ─────────────────────────────────────────────────────
const updateRecord = async (req, res, next) => {
  try {
    const b = req.body;
    const updates = {
      recordType: b.recordType, doctorName: b.doctorName, hospitalName: b.hospitalName,
      diagnosis: b.diagnosis, notes: b.notes, visitDate: b.visitDate,
      medicines: parseJSON(b.medicines),
      labName: b.labName, patientName: b.patientName,
      labTests: parseJSON(b.labTests),
      impression: b.impression, scanType: b.scanType, bodyPart: b.bodyPart, findings: b.findings,
      admissionDate: b.admissionDate, dischargeDate: b.dischargeDate,
      treatmentSummary: b.treatmentSummary, dischargeAdvice: b.dischargeAdvice,
      conditionAtDischarge: b.conditionAtDischarge,
      billNumber: b.billNumber, totalAmount: b.totalAmount,
      lineItems: parseJSON(b.lineItems),
    };
    // Remove undefined keys
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, ownerUserId: req.user._id, isDeleted: false },
      updates, { new: true, runValidators: true }
    );
    if (!record) return errorResponse(res, 404, 'Record not found');
    return successResponse(res, 200, 'Record updated', { record });
  } catch (error) { next(error); }
};

// ─── DELETE /api/records/:id ──────────────────────────────────────────────────
const deleteRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, ownerUserId: req.user._id },
      { isDeleted: true }, { new: true }
    );
    if (!record) return errorResponse(res, 404, 'Record not found');
    return successResponse(res, 200, 'Record deleted successfully');
  } catch (error) { next(error); }
};

// ─── POST /api/records/:id/ocr ────────────────────────────────────────────────
const rerunOCR = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, ownerUserId: req.user._id });
    if (!record?.uploadedFile?.path) return errorResponse(res, 404, 'Record or file not found');
    const ocrData = await runOCR(record.uploadedFile.path, record.uploadedFile.mimetype, record.recordType);
    record.extractedText = ocrData.extractedText;
    record.ocrProcessed = true;
    record.ocrConfidence = ocrData.ocrConfidence;
    if (!record.doctorName && ocrData.doctorName) record.doctorName = ocrData.doctorName;
    if (!record.hospitalName && ocrData.hospitalName) record.hospitalName = ocrData.hospitalName;
    if (!record.diagnosis && ocrData.diagnosis) record.diagnosis = ocrData.diagnosis;
    if (!record.medicines?.length && ocrData.medicines?.length) record.medicines = ocrData.medicines;
    if (!record.labTests?.length && ocrData.labTests?.length) record.labTests = ocrData.labTests;
    await record.save();
    return successResponse(res, 200, 'OCR re-processed', { record, ocrExtracted: ocrData });
  } catch (error) { next(error); }
};

module.exports = { ocrExtract, uploadRecord, getRecords, getRecord, updateRecord, deleteRecord, rerunOCR };
