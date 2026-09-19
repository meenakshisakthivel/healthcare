require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const dataStore = require('./services/dataStore');
const { processUploadedDocument, sanitizeFilename, isAllowedFileType } = require('./services/documentProcessor');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(__dirname, 'uploads');
const demoDocsDir = path.join(__dirname, 'demo-docs');

fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(demoDocsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const { base } = path.parse(file.originalname);
    const safeBase = sanitizeFilename(base);
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, `${safeBase}-${unique}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (req, file, cb) => {
    const allowed = isAllowedFileType(file.originalname);
    if (!allowed) {
      return cb(new Error('Unsupported file type. Allowed: PDF, DOCX, TXT, PNG, JPG, JPEG'));
    }
    cb(null, true);
  }
});

const ensureDemoData = () => {
  const patients = dataStore.readJSON('patients');
  const documents = dataStore.readJSON('documents');
  const events = dataStore.readJSON('events');

  if (!patients.length) {
    const demoPatient = {
      id: 'P-1001',
      patientId: 'P-1001',
      fullName: 'Asha Nair',
      dateOfBirth: '1987-05-14',
      gender: 'Female',
      phone: '+91 98765 43210',
      email: 'asha.nair@example.com',
      aadhaarId: '',
      abhaId: '',
      address: '2nd Cross, Kadri, Mangaluru',
      emergencyContact: 'Ramesh Nair - +91 98123 45678',
      bloodGroup: 'O+',
      allergies: 'Penicillin',
      existingConditions: 'Hypothyroidism',
      createdAt: new Date().toISOString()
    };
    dataStore.writeJSON('patients', [demoPatient]);
  }

  if (!documents.length) {
    const demoDocuments = [
      {
        id: 'DOC-1001',
        patientId: 'P-1001',
        originalFilename: 'lab-report.pdf',
        fileType: 'PDF',
        uploadDate: '2026-01-12',
        category: 'Laboratory Report',
        processingStatus: 'processed',
        extractedText: 'Patient Name: Asha Nair. Patient ID: P-1001. Hemoglobin: 11.5 g/dL (Reference Range 12.0-15.5 g/dL). TSH: 8.4 mIU/L (Reference Range 0.4-4.0). Diagnosis: Hypothyroidism. Doctor: Dr. S. Kumar. Hospital: Cauvery General Hospital.',
        extractionConfidence: 0.94,
        storagePath: 'uploads/demo/lab-report.pdf',
        documentDate: '2026-01-12',
        sourceInfo: { pageNumber: 1 }
      },
      {
        id: 'DOC-1002',
        patientId: 'P-1001',
        originalFilename: 'prescription.pdf',
        fileType: 'PDF',
        uploadDate: '2026-01-15',
        category: 'Prescription',
        processingStatus: 'processed',
        extractedText: 'Prescription Date: 2026-01-15. Medicine: Levothyroxine 50 mcg. Frequency: Once daily. Duration: 30 days. Prescribing doctor: Dr. N. Menon. Instructions: Take on empty stomach.',
        extractionConfidence: 0.92,
        storagePath: 'uploads/demo/prescription.pdf',
        documentDate: '2026-01-15',
        sourceInfo: { pageNumber: 1 }
      },
      {
        id: 'DOC-1003',
        patientId: 'P-1001',
        originalFilename: 'discharge-summary.txt',
        fileType: 'TXT',
        uploadDate: '2026-02-01',
        category: 'Discharge Summary',
        processingStatus: 'processed',
        extractedText: 'Admission Date: 2026-01-28. Discharge Date: 2026-02-01. Diagnosis: Hypothyroidism. Procedures: None. Hospital Course: Patient discharged stable. Follow-up: Review in 2 weeks. Doctor: Dr. A. Shah. Hospital: Cauvery Med City.',
        extractionConfidence: 0.9,
        storagePath: 'uploads/demo/discharge-summary.txt',
        documentDate: '2026-02-01',
        sourceInfo: { pageNumber: 1 }
      },
      {
        id: 'DOC-1004',
        patientId: 'P-1001',
        originalFilename: 'imaging-report.png',
        fileType: 'PNG',
        uploadDate: '2026-02-05',
        category: 'Imaging Report',
        processingStatus: 'processed',
        extractedText: 'Imaging Type: MRI Brain. Findings: Mild cortical atrophy on T2 weighted images. Impression: Nonspecific findings. Radiologist: Dr. V. Raghavan. Date: 2026-02-05.',
        extractionConfidence: 0.85,
        storagePath: 'uploads/demo/imaging-report.png',
        documentDate: '2026-02-05',
        sourceInfo: { pageNumber: 1 }
      },
      {
        id: 'DOC-1005',
        patientId: 'P-1001',
        originalFilename: 'clinical-note.txt',
        fileType: 'TXT',
        uploadDate: '2026-02-10',
        category: 'Clinical Note',
        processingStatus: 'processed',
        extractedText: 'Clinical note from Dr. S. Kumar. Symptoms: Fatigue, weight gain. Follow-up date: 2026-02-10. Recommendation: Continue dose adjustment and repeat thyroid function tests in 6 weeks.',
        extractionConfidence: 0.88,
        storagePath: 'uploads/demo/clinical-note.txt',
        documentDate: '2026-02-10',
        sourceInfo: { pageNumber: 1 }
      }
    ];
    dataStore.writeJSON('documents', demoDocuments);
  }

  if (!events.length) {
    const demoEvents = [
      {
        id: 'EVT-1001',
        patientId: 'P-1001',
        eventDate: '2026-01-12',
        eventType: 'Laboratory Test',
        title: 'Thyroid panel',
        description: 'Routine blood investigation with low hemoglobin and elevated TSH.',
        diagnosis: 'Hypothyroidism',
        medication: '',
        test: 'Hemoglobin, TSH',
        result: 'Hemoglobin 11.5 g/dL, TSH 8.4 mIU/L',
        procedure: '',
        doctor: 'Dr. S. Kumar',
        hospital: 'Cauvery General Hospital',
        sourceDocumentId: 'DOC-1001',
        sourceFilename: 'lab-report.pdf',
        confidenceScore: 0.94,
        createdAt: new Date().toISOString()
      },
      {
        id: 'EVT-1002',
        patientId: 'P-1001',
        eventDate: '2026-01-15',
        eventType: 'Medication',
        title: 'Levothyroxine prescribed',
        description: 'Medication prescribed for hypothyroidism management.',
        diagnosis: 'Hypothyroidism',
        medication: 'Levothyroxine 50 mcg',
        test: '',
        result: '',
        procedure: '',
        doctor: 'Dr. N. Menon',
        hospital: 'Cauvery General Hospital',
        sourceDocumentId: 'DOC-1002',
        sourceFilename: 'prescription.pdf',
        confidenceScore: 0.92,
        createdAt: new Date().toISOString()
      },
      {
        id: 'EVT-1003',
        patientId: 'P-1001',
        eventDate: '2026-01-28',
        eventType: 'Hospital Admission',
        title: 'Hospital admission',
        description: 'Patient admitted for thyroid evaluation.',
        diagnosis: 'Hypothyroidism',
        medication: '',
        test: '',
        result: '',
        procedure: '',
        doctor: 'Dr. A. Shah',
        hospital: 'Cauvery Med City',
        sourceDocumentId: 'DOC-1003',
        sourceFilename: 'discharge-summary.txt',
        confidenceScore: 0.9,
        createdAt: new Date().toISOString()
      },
      {
        id: 'EVT-1004',
        patientId: 'P-1001',
        eventDate: '2026-02-05',
        eventType: 'Imaging',
        title: 'MRI Brain',
        description: 'Imaging performed for further assessment.',
        diagnosis: 'Nonspecific findings',
        medication: '',
        test: 'MRI Brain',
        result: 'Mild cortical atrophy on T2 weighted images',
        procedure: '',
        doctor: 'Dr. V. Raghavan',
        hospital: 'Cauvery Med City',
        sourceDocumentId: 'DOC-1004',
        sourceFilename: 'imaging-report.png',
        confidenceScore: 0.85,
        createdAt: new Date().toISOString()
      },
      {
        id: 'EVT-1005',
        patientId: 'P-1001',
        eventDate: '2026-02-10',
        eventType: 'Follow-up',
        title: 'Follow-up consultation',
        description: 'Repeated thyroid function tests recommended.',
        diagnosis: 'Hypothyroidism',
        medication: '',
        test: 'Thyroid function tests',
        result: 'Repeat in six weeks',
        procedure: '',
        doctor: 'Dr. S. Kumar',
        hospital: 'Cauvery General Hospital',
        sourceDocumentId: 'DOC-1005',
        sourceFilename: 'clinical-note.txt',
        confidenceScore: 0.88,
        createdAt: new Date().toISOString()
      }
    ];
    dataStore.writeJSON('events', demoEvents);
  }
};

ensureDemoData();

app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Cauvery Med' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (email === 'demo@cauverymed.local' && password === 'demo123') {
    return res.json({ success: true, user: { email, name: 'Demo Clinician' }, redirect: '/dashboard.html' });
  }

  return res.status(401).json({ error: 'Invalid credentials. Try the demo login or contact local admin.' });
});

app.get('/api/patients', (req, res) => {
  const patients = dataStore.readJSON('patients');
  res.json({ patients });
});

app.post('/api/patients', (req, res) => {
  const body = req.body || {};
  const newPatient = {
    id: body.id || `P-${Date.now()}`,
    patientId: body.patientId || `P-${Date.now()}`,
    fullName: body.fullName || '',
    dateOfBirth: body.dateOfBirth || '',
    gender: body.gender || '',
    phone: body.phone || '',
    email: body.email || '',
    aadhaarId: body.aadhaarId || '',
    abhaId: body.abhaId || '',
    address: body.address || '',
    emergencyContact: body.emergencyContact || '',
    bloodGroup: body.bloodGroup || '',
    allergies: body.allergies || '',
    existingConditions: body.existingConditions || '',
    createdAt: new Date().toISOString()
  };

  const patients = dataStore.readJSON('patients');
  patients.push(newPatient);
  dataStore.writeJSON('patients', patients);
  res.status(201).json({ patient: newPatient });
});

app.get('/api/patients/:id', (req, res) => {
  const patients = dataStore.readJSON('patients');
  const patient = patients.find((item) => item.id === req.params.id || item.patientId === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found.' });
  }
  return res.json({ patient });
});

app.put('/api/patients/:id', (req, res) => {
  const patients = dataStore.readJSON('patients');
  const index = patients.findIndex((item) => item.id === req.params.id || item.patientId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Patient not found.' });
  }
  const updated = { ...patients[index], ...req.body, id: patients[index].id, patientId: patients[index].patientId };
  patients[index] = updated;
  dataStore.writeJSON('patients', patients);
  res.json({ patient: updated });
});

app.delete('/api/patients/:id', (req, res) => {
  const patients = dataStore.readJSON('patients');
  const filtered = patients.filter((item) => item.id !== req.params.id && item.patientId !== req.params.id);
  if (filtered.length === patients.length) {
    return res.status(404).json({ error: 'Patient not found.' });
  }
  dataStore.writeJSON('patients', filtered);
  return res.json({ success: true });
});

app.get('/api/documents', (req, res) => {
  const docs = dataStore.readJSON('documents');
  res.json({ documents: docs });
});

app.get('/api/documents/:id', (req, res) => {
  const docs = dataStore.readJSON('documents');
  const doc = docs.find((item) => item.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }
  return res.json({ document: doc });
});

app.post('/api/documents/upload', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files || [];
    const identityType = String(req.body.identityType || '').trim().toLowerCase();
    const identityValue = String(req.body.identityValue || '').trim();
    const patients = dataStore.readJSON('patients');
    const normalizedIdentity = identityValue.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const identityFields = identityType === 'aadhaar' ? ['aadhaarId']
      : identityType === 'abha' ? ['abhaId']
        : ['patientId', 'id'];
    const matchedPatient = patients.find((patient) => identityFields.some((field) => (
      String(patient[field] || '').replace(/[^a-z0-9]/gi, '').toLowerCase() === normalizedIdentity
    )));

    if (!files.length) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }
    if (!identityValue || !matchedPatient) {
      return res.status(422).json({ error: 'No patient matched the supplied identity. Verify the Aadhaar, ABHA, or patient ID.' });
    }

    const documents = dataStore.readJSON('documents');
    const savedDocs = [];

    for (const file of files) {
      const storedDoc = {
        id: `DOC-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        patientId: matchedPatient.patientId || matchedPatient.id,
        verifiedIdentity: {
          type: identityType || 'patient-id',
          value: identityValue,
          verifiedAt: new Date().toISOString()
        },
        originalFilename: file.originalname,
        fileType: file.mimetype || 'application/octet-stream',
        uploadDate: new Date().toISOString().slice(0, 10),
        category: 'Other',
        processingStatus: 'queued',
        extractedText: '',
        extractionConfidence: 0,
        storagePath: file.path,
        documentDate: '',
        sourceInfo: { pageNumber: 1 }
      };
      documents.push(storedDoc);
      savedDocs.push(storedDoc);
    }

    dataStore.writeJSON('documents', documents);
    res.status(201).json({
      success: true,
      patient: { id: matchedPatient.id, patientId: matchedPatient.patientId, fullName: matchedPatient.fullName },
      documents: savedDocs
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed.', message: 'Please verify the file type and size.' });
  }
});

app.post('/api/documents/process', async (req, res) => {
  try {
    const { documentId } = req.body || {};
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required.' });
    }

    const docs = dataStore.readJSON('documents');
    const docIndex = docs.findIndex((item) => item.id === documentId);
    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const processed = await processUploadedDocument(docs[docIndex]);
    docs[docIndex] = processed.document;

    const events = dataStore.readJSON('events');
    const eventList = processed.events || [];
    eventList.forEach((event) => {
      const existing = events.find((item) => item.id === event.id);
      if (!existing) {
        events.push(event);
      }
    });

    dataStore.writeJSON('documents', docs);
    dataStore.writeJSON('events', events);

    res.json({ success: true, document: processed.document, events: eventList });
  } catch (error) {
    const docs = dataStore.readJSON('documents');
    const docIndex = docs.findIndex((item) => item.id === req.body.documentId);
    if (docIndex !== -1) {
      docs[docIndex].processingStatus = 'failed';
      docs[docIndex].errorMessage = error.message || 'Processing failed';
      dataStore.writeJSON('documents', docs);
    }
    res.status(500).json({ error: 'Processing failed. Please review the document and try again.' });
  }
});

app.get('/api/patients/:id/documents', (req, res) => {
  const patientId = req.params.id;
  const documents = dataStore.readJSON('documents').filter((document) => document.patientId === patientId);
  documents.sort((a, b) => new Date(b.uploadDate || b.documentDate || 0) - new Date(a.uploadDate || a.documentDate || 0));
  res.json({ documents });
});

app.get('/api/patients/:id/timeline', (req, res) => {
  const patientId = req.params.id;
  const events = dataStore.readJSON('events').filter((event) => event.patientId === patientId);
  events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  res.json({ events });
});

app.get('/api/search', (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  const documents = dataStore.readJSON('documents');
  const events = dataStore.readJSON('events');

  if (!query) {
    return res.json({ documents: [], events: [] });
  }

  const filteredDocs = documents.filter((document) => {
    const haystack = `${document.originalFilename} ${document.category} ${document.extractedText || ''} ${document.patientId || ''}`.toLowerCase();
    return haystack.includes(query);
  });

  const filteredEvents = events.filter((event) => {
    const haystack = `${event.title || ''} ${event.description || ''} ${event.diagnosis || ''} ${event.medication || ''} ${event.test || ''} ${event.doctor || ''} ${event.hospital || ''} ${event.eventType || ''}`.toLowerCase();
    return haystack.includes(query);
  });

  res.json({ documents: filteredDocs, events: filteredEvents });
});

app.get('/api/dashboard', (req, res) => {
  const patients = dataStore.readJSON('patients');
  const documents = dataStore.readJSON('documents');
  const events = dataStore.readJSON('events');

  const counts = {
    totalPatients: patients.length,
    totalDocuments: documents.length,
    medicalEvents: events.length,
    recentUploads: documents.slice(-5).reverse(),
    latestTimelineEvents: events.slice(-5).reverse(),
    byType: documents.reduce((acc, doc) => {
      acc[doc.category || 'Other'] = (acc[doc.category || 'Other'] || 0) + 1;
      return acc;
    }, {})
  };

  res.json(counts);
});

app.use((req, res) => {
  const filePath = path.join(publicDir, req.path.replace(/^\//, ''));
  if (filePath.endsWith('.html') && fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Upload failed.', message: err.message });
  }
  if (err) {
    return res.status(400).json({ error: 'Invalid request.', message: err.message || 'Please check the payload.' });
  }
  next();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Cauvery Med server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
