/**
 * AI Summary Service
 * Generates two types of health summaries from medical records:
 *  1. Patient-friendly  — simple language for everyday users
 *  2. Doctor summary    — clinical terminology for medical professionals
 */

// ─── Monthly visit counts for charts ─────────────────────────────────────────
const getMonthlyVisits = (records) => {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const count = records.filter((r) => {
      const d = new Date(r.visitDate);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    }).length;
    months.push({ month: `${monthName} ${year}`, count });
  }
  return months;
};

// ─── Core analytics from records ─────────────────────────────────────────────
const analyzeRecords = (records) => {
  const diagnosisCount = {};
  const medicineCount = {};
  const hospitalCount = {};
  const doctorCount = {};

  records.forEach((r) => {
    if (r.diagnosis) {
      const k = r.diagnosis.toLowerCase().trim();
      diagnosisCount[k] = (diagnosisCount[k] || 0) + 1;
    }
    (r.medicines || []).forEach((m) => {
      if (m.name) {
        const k = m.name.toLowerCase().trim();
        medicineCount[k] = (medicineCount[k] || 0) + 1;
      }
    });
    if (r.hospitalName) {
      const k = r.hospitalName.trim();
      hospitalCount[k] = (hospitalCount[k] || 0) + 1;
    }
    if (r.doctorName) {
      const k = r.doctorName.trim();
      doctorCount[k] = (doctorCount[k] || 0) + 1;
    }
  });

  const sort = (obj) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

  return {
    frequentDiagnoses: sort(diagnosisCount).slice(0, 5),
    currentMedications: sort(medicineCount).slice(0, 8),
    frequentHospitals: sort(hospitalCount).slice(0, 3),
    frequentDoctors: sort(doctorCount).slice(0, 3),
  };
};

// ─── Patient-friendly summary ─────────────────────────────────────────────────
const generatePatientSummary = (records) => {
  if (!records || records.length === 0) {
    return 'No medical records found yet. Start by uploading your first prescription or report.';
  }

  const { frequentDiagnoses, currentMedications, frequentHospitals, frequentDoctors } = analyzeRecords(records);
  const recent = records.slice(0, 3);
  const lines = [];

  lines.push(`You have ${records.length} medical record${records.length > 1 ? 's' : ''} stored safely.`);

  if (recent.length > 0) {
    const last = recent[0];
    const parts = [];
    if (last.doctorName) parts.push(`Dr. ${last.doctorName}`);
    if (last.hospitalName) parts.push(`at ${last.hospitalName}`);
    if (last.diagnosis) parts.push(`for ${last.diagnosis}`);
    if (parts.length > 0) {
      lines.push(`Your most recent visit was to ${parts.join(' ')}.`);
    }
  }

  if (frequentDiagnoses.length > 0) {
    const top = frequentDiagnoses[0];
    if (top.count > 1) {
      lines.push(`You have visited a doctor for "${top.name}" ${top.count} times — it may be worth discussing this with your doctor.`);
    } else {
      lines.push(`Your records mention "${top.name}" as a recent health concern.`);
    }
  }

  if (currentMedications.length > 0) {
    const meds = currentMedications.slice(0, 3).map((m) => m.name).join(', ');
    lines.push(`Medicines that appear in your records include: ${meds}.`);
  }

  if (frequentHospitals.length > 0) {
    lines.push(`You most often visit ${frequentHospitals[0].name}.`);
  }

  return lines.join(' ');
};

// ─── Doctor / clinical summary ────────────────────────────────────────────────
const generateDoctorSummary = (records) => {
  if (!records || records.length === 0) {
    return 'No medical history available for this patient.';
  }

  const { frequentDiagnoses, currentMedications, frequentHospitals, frequentDoctors } = analyzeRecords(records);
  const recent = records.slice(0, 5);
  const lines = [];

  lines.push(`Patient has ${records.length} documented medical encounter${records.length > 1 ? 's' : ''}.`);

  if (frequentDiagnoses.length > 0) {
    const diagList = frequentDiagnoses.map((d) => `${d.name} (×${d.count})`).join('; ');
    lines.push(`Primary diagnoses: ${diagList}.`);
  }

  if (currentMedications.length > 0) {
    const medList = currentMedications.slice(0, 5).map((m) => m.name).join(', ');
    lines.push(`Documented pharmacotherapy includes: ${medList}.`);
  }

  if (frequentHospitals.length > 0) {
    const hospList = frequentHospitals.map((h) => `${h.name} (${h.count} visit${h.count > 1 ? 's' : ''})`).join(', ');
    lines.push(`Healthcare facilities attended: ${hospList}.`);
  }

  if (frequentDoctors.length > 0) {
    const docList = frequentDoctors.map((d) => `Dr. ${d.name}`).join(', ');
    lines.push(`Treating physicians on record: ${docList}.`);
  }

  // Recent encounters
  const recentLines = recent
    .filter((r) => r.diagnosis || r.recordType)
    .map((r) => {
      const date = r.visitDate ? new Date(r.visitDate).toLocaleDateString('en-GB') : 'unknown date';
      const diag = r.diagnosis || r.recordType;
      const doc = r.doctorName ? ` (Dr. ${r.doctorName})` : '';
      return `${date}: ${diag}${doc}`;
    });

  if (recentLines.length > 0) {
    lines.push(`Recent encounters — ${recentLines.join('; ')}.`);
  }

  return lines.join(' ');
};

// ─── Full health summary object (used by analytics/summary endpoints) ─────────
const generateHealthSummary = (records) => {
  if (!records || records.length === 0) {
    return {
      totalVisits: 0,
      frequentDiagnoses: [],
      currentMedications: [],
      recentTrends: [],
      lastVisit: null,
      insights: ['No medical records found. Start by uploading your first record.'],
      patientSummary: generatePatientSummary([]),
      doctorSummary: generateDoctorSummary([]),
    };
  }

  const { frequentDiagnoses, currentMedications, frequentHospitals, frequentDoctors } = analyzeRecords(records);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const recentRecords = records.filter((r) => new Date(r.visitDate) >= threeMonthsAgo);

  const recentTrends = [];
  if (recentRecords.length > records.length * 0.5) {
    recentTrends.push('Increased medical visits in the last 3 months');
  }
  if (frequentDiagnoses.length > 0 && frequentDiagnoses[0].count > 2) {
    recentTrends.push(`Recurring condition: ${frequentDiagnoses[0].name}`);
  }
  if (currentMedications.length > 3) {
    recentTrends.push('Multiple ongoing medications detected');
  }

  const insights = [];
  if (records.length >= 5) insights.push(`${records.length} medical records stored securely.`);
  if (frequentDiagnoses.length > 0) {
    insights.push(`Most frequent diagnosis: "${frequentDiagnoses[0].name}" (${frequentDiagnoses[0].count}×)`);
  }
  if (currentMedications.length > 0) {
    insights.push(`Commonly prescribed: ${currentMedications.slice(0, 3).map((m) => m.name).join(', ')}`);
  }
  if (frequentHospitals.length > 0) {
    insights.push(`Most visited: ${frequentHospitals[0].name}`);
  }

  return {
    totalVisits: records.length,
    frequentDiagnoses,
    currentMedications,
    frequentHospitals,
    frequentDoctors,
    recentTrends,
    lastVisit: records[0]?.visitDate || null,
    insights,
    monthlyVisits: getMonthlyVisits(records),
    recentRecordsCount: recentRecords.length,
    patientSummary: generatePatientSummary(records),
    doctorSummary: generateDoctorSummary(records),
  };
};

module.exports = {
  generateHealthSummary,
  generatePatientSummary,
  generateDoctorSummary,
  getMonthlyVisits,
};
