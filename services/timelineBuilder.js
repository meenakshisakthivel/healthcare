const buildTimelineEvents = (document, structuredData) => {
  const patientId = document.patientId || structuredData.patient?.patientId || 'P-UNKNOWN';
  const documentDate = document.documentDate || structuredData.document?.date || new Date().toISOString().slice(0, 10);
  const category = document.category || structuredData.document?.type || 'Other';
  const doctor = structuredData.metadata?.doctor || document.doctor || 'Unspecified';
  const hospital = structuredData.metadata?.hospital || 'Unspecified';
  const sourceFilename = document.originalFilename || structuredData.document?.sourceFile || 'source.pdf';

  const eventTypeMap = {
    'Laboratory Report': 'Laboratory Test',
    'Prescription': 'Medication',
    'Discharge Summary': 'Hospital Admission',
    'Imaging Report': 'Imaging',
    'Clinical Note': 'Follow-up',
    'Medical Certificate': 'Medical Certificate',
    'Other': 'Clinical Note'
  };

  const titleMap = {
    'Laboratory Report': 'Laboratory investigation',
    'Prescription': 'Medication prescribed',
    'Discharge Summary': 'Discharge summary',
    'Imaging Report': 'Imaging report',
    'Clinical Note': 'Clinical note',
    'Medical Certificate': 'Medical certificate',
    'Other': 'Clinical document'
  };

  const diagnosis = (structuredData.clinicalInformation?.diagnoses || [])[0] || '';
  const med = (structuredData.medications || [])[0] || '';
  const test = (structuredData.laboratoryResults || [])[0]?.testName || '';
  const result = (structuredData.laboratoryResults || [])[0]?.result || '';

  const event = {
    id: `EVT-${document.id || Date.now()}`,
    patientId,
    eventDate: documentDate,
    eventType: eventTypeMap[category] || 'Clinical Note',
    title: titleMap[category] || 'Medical record',
    description: `Extracted from ${sourceFilename}. ${diagnosis ? `Diagnosis: ${diagnosis}.` : ''} ${med ? `Medication: ${med}.` : ''} ${test && result ? `Test: ${test} (${result}).` : ''}`.trim(),
    diagnosis,
    medication: med,
    test,
    result,
    procedure: (structuredData.procedures || [])[0] || '',
    doctor,
    hospital,
    sourceDocumentId: document.id || 'DOC-UNKNOWN',
    sourceFilename,
    confidenceScore: structuredData.metadata?.confidence || 0.88,
    createdAt: new Date().toISOString()
  };

  return [event];
};

module.exports = {
  buildTimelineEvents
};
