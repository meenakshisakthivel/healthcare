const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const { extractStructuredData } = require('./extractor');
const { buildTimelineEvents } = require('./timelineBuilder');

const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

const sanitizeFilename = (value) => {
  return String(value || 'upload')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
};

const isAllowedFileType = (filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  return allowedTypes.includes(ext);
};

const extractTextFromPdf = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text || '';
};

const extractTextFromDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || '';
};

const extractTextFromTxt = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
};

const extractTextFromImage = async (filePath) => {
  try {
    const result = await Tesseract.recognize(filePath, 'eng');
    return result.data && result.data.text ? result.data.text : '';
  } catch (error) {
    throw new Error('OCR failed for image file.');
  }
};

const extractTextFromFile = async (filePath, originalName) => {
  const ext = path.extname(originalName || '').toLowerCase();

  if (ext === '.pdf') return extractTextFromPdf(filePath);
  if (ext === '.docx') return extractTextFromDocx(filePath);
  if (ext === '.txt') return extractTextFromTxt(filePath);
  if (['.png', '.jpg', '.jpeg'].includes(ext)) return extractTextFromImage(filePath);
  if (ext === '.doc') return extractTextFromTxt(filePath);

  return '';
};

const processUploadedDocument = async (document) => {
  const filePath = document.storagePath || path.join(__dirname, '..', 'uploads', document.originalFilename || 'upload.txt');
  const extractedText = await extractTextFromFile(filePath, document.originalFilename || 'document.pdf');
  const structuredData = extractStructuredData(extractedText, document);
  const timelineEvents = buildTimelineEvents(document, structuredData);

  const updatedDocument = {
    ...document,
    originalFilename: document.originalFilename || 'document',
    documentDate: document.documentDate || structuredData.document.date || new Date().toISOString().slice(0, 10),
    processingStatus: 'processed',
    extractedText,
    extractionConfidence: structuredData.metadata?.confidence || 0.88,
    category: document.category || structuredData.document.type || 'Other',
    structuredData,
    sourceInfo: document.sourceInfo || { pageNumber: 1 }
  };

  return {
    document: updatedDocument,
    events: timelineEvents
  };
};

module.exports = {
  processUploadedDocument,
  sanitizeFilename,
  isAllowedFileType,
  extractTextFromFile,
  allowedTypes
};
