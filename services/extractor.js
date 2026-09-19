const DATE_REGEX = /(\d{4}-\d{2}-\d{2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}\/\d{2}\/\d{2})/g;

const findValue = (text, patterns) => {
  for (const pattern of patterns) {
    const match = text.match(new RegExp(`${pattern}\\s*[:\-]\\s*(.+)`, 'i'));
    if (match && match[1]) {
      return match[1].replace(/\s+/g, ' ').trim();
    }
  }
  return '';
};

const parseList = (text, patterns) => {
  const results = [];
  for (const pattern of patterns) {
    const regex = new RegExp(`${pattern}\\s*[:\-]\\s*(.+)`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      const value = match[1].split(/[;\n]/)[0].replace(/\s+/g, ' ').trim();
      if (value) results.push(value);
    }
  }
  return results;
};

const identifyDocumentType = (text, originalName = '') => {
  const normalized = `${text}\n${originalName}`.toLowerCase();
  if (/(lab|hematology|cbc|chemistry|serum|bilirubin|glucose|thyroid|blood test)/i.test(normalized)) return 'Laboratory Report';
  if (/(prescription|medication|tab|capsule|dosage|mg|mcg|daily)/i.test(normalized)) return 'Prescription';
  if (/(discharge summary|admission|discharge date|hospital course|follow-up)/i.test(normalized)) return 'Discharge Summary';
  if (/(mri|ct|x-ray|ultrasound|imaging|radiology|report)/i.test(normalized)) return 'Imaging Report';
  if (/(clinical note|assessment|symptoms|history|follow-up|visit)/i.test(normalized)) return 'Clinical Note';
  if (/(medical certificate|fitness|sick leave)/i.test(normalized)) return 'Medical Certificate';
  return 'Other';
};

const extractStructuredData = (rawText = '', documentMeta = {}) => {
  const text = String(rawText || '').replace(/\r/g, '\n');
  const patientName = findValue(text, ['Patient Name', 'Name', 'Full Name']) || documentMeta.patientName || '';
  const patientId = findValue(text, ['Patient ID', 'MRN', 'UHID']) || documentMeta.patientId || '';
  const dob = findValue(text, ['DOB', 'Date of Birth']) || '';
  const doctor = findValue(text, ['Doctor', 'Consultant', 'Physician', 'Prescribing doctor', 'Radiologist']) || '';
  const hospital = findValue(text, ['Hospital', 'Clinic', 'Institution']) || '';
  const diagnosis = parseList(text, ['Diagnosis', 'Diagnosis:', 'Impression']) || [];
  const symptoms = parseList(text, ['Symptoms', 'Complaint', 'Complaints']) || [];
  const findings = parseList(text, ['Findings', 'Clinical Findings', 'Assessment']) || [];
  const medications = parseList(text, ['Medicine', 'Medication', 'Drug', 'Prescription']) || [];
  const procedures = parseList(text, ['Procedure', 'Surgery', 'Treatment']) || [];
  const followUps = parseList(text, ['Follow-up', 'Follow Up', 'Recommendation']) || [];

  const labMatches = [];
  const labRegex = new RegExp(
    '(\\w[\\w\\s-]*?(?:Hemoglobin|TSH|CBC|Glucose|Platelet|Creatinine|ALT|AST|Cholesterol|WBC|RBC|Hemoglobin A1C|Ferritin|Sodium|Potassium)[\\w\\s-]*?)\\s*[:\\-]?\\s*([0-9.]+)\\s*(mg\\/dL|g\\/dL|mmol\\/L|IU\\/L|mIU\\/L|uL|fL|%|k\\/uL)?\\s*(?:\\(([^\\n]+)\\))?',
    'gi'
  );
  let match;
  while ((match = labRegex.exec(text)) !== null) {
    labMatches.push({
      testName: match[1].trim(),
      result: match[2]?.trim() || '',
      unit: match[3]?.trim() || '',
      referenceRange: match[4]?.trim() || '',
      status: match[2] ? 'Documented' : 'Unclear',
      date: (text.match(DATE_REGEX) || [])[0] || ''
    });
  }

  const imagingMatches = [];
  const imagingRegex = /(MRI|CT|X-Ray|Ultrasound|Radiology|Imaging Type)\s*[:\-]?\s*([^\n]+)/gi;
  while ((match = imagingRegex.exec(text)) !== null) {
    imagingMatches.push({
      imagingType: match[1].trim(),
      details: match[2].trim(),
      date: (text.match(DATE_REGEX) || [])[0] || ''
    });
  }

  const documentDate = (text.match(DATE_REGEX) || [])[0] || new Date().toISOString().slice(0, 10);
  return {
    patient: {
      name: patientName,
      patientId: patientId,
      dateOfBirth: dob
    },
    document: {
      documentId: documentMeta.id || 'DOC-UNKNOWN',
      type: identifyDocumentType(text, documentMeta.originalFilename || ''),
      date: documentDate,
      sourceFile: documentMeta.originalFilename || 'unknown'
    },
    clinicalInformation: {
      symptoms: symptoms,
      diagnoses: diagnosis,
      findings: findings
    },
    medications: medications,
    laboratoryResults: labMatches,
    procedures: procedures,
    imaging: imagingMatches,
    followUps: followUps,
    metadata: {
      doctor,
      hospital,
      confidence: 0.88,
      extractedAt: new Date().toISOString()
    }
  };
};

module.exports = {
  extractStructuredData,
  identifyDocumentType
};
