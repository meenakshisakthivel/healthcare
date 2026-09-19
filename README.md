# Cauvery Med – Medical Document Intelligence System

Cauvery Med is a local prototype for turning fragmented medical documents into a structured and chronological patient timeline. It allows healthcare teams to upload PDFs, TXT files, images, and other common medical documents, extract key clinical facts, and trace every event back to its source document.

> SYNTHETIC DEMO DATA – NOT REAL PATIENT INFORMATION
> This application is intended for demonstration and education only. All extracted information should be reviewed by qualified healthcare professionals before clinical use.

## Features

- Professional healthcare dashboard and login flow
- Patient management (add, view, edit, delete, search)
- Multi-file document upload with drag-and-drop support and processing status
- Text extraction from PDF, TXT, DOCX, JPG, JPEG, and PNG files
- OCR-based extraction for scanned images when available
- Local structured extraction and JSON representation of clinical facts
- Timeline generation sorted by date
- Source-document traceability for every event
- Search across patient name, diagnosis, medication, doctor, hospital, and date
- Report and lab tracking views
- Demo data that works without external AI services

## Technology Stack

- Node.js
- Express.js
- HTML, CSS, JavaScript
- SQLite-ready JSON storage structure for local prototype
- PDF parsing, DOCX extraction, OCR via Tesseract.js
- Local extraction mode with AI gateway support through environment variable

## Folder Structure

- `server.js` – main server and API routes
- `public/` – frontend pages and static assets
- `services/` – document processing, extraction, and timeline logic
- `data/` – patient, document, and event storage JSON files
- `uploads/` – uploaded documents and generated previews
- `demo-docs/` – synthetic sample medical documents

## Installation

1. Open a terminal in the project folder.
2. Run:

```bash
npm install
```

## Environment Setup

Create a `.env` file in the project root with the following values:

```env
PORT=3000
APP_NAME=Cauvery Med
OPENAI_API_KEY=
MAX_UPLOAD_SIZE=10485760
DEMO_MODE=true
```

If an AI provider is available later, set `OPENAI_API_KEY` to enable external extraction. If it is empty, the application works in local demo mode.

## Run the App Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Demo Login

Use the login page and select the demo user option or log in with:

- Email: demo@cauverymed.local
- Password: demo123

## How Document Processing Works

1. A file is uploaded through the upload page or API.
2. The backend validates the extension and size.
3. Text is extracted from the file using PDF parsing, TXT reading, DOCX extraction, or OCR for images.
4. The extracted text is normalized and mapped into structured clinical data.
5. Medical events are generated from the structured output.
6. Events are linked to the source document and stored with confidence metadata.

## Timeline Generation

The timeline builder groups extracted events by date and sorts them chronologically. Each event contains:

- date
- event type
- title
- diagnosis or findings
- medication or test details
- source document name
- confidence score
- extracted snippet for traceability

## API Documentation

### Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "app": "Cauvery Med"
}
```

### Patient APIs

```http
GET /api/patients
POST /api/patients
GET /api/patients/:id
PUT /api/patients/:id
DELETE /api/patients/:id
GET /api/patients/:id/timeline
```

### Document APIs

```http
GET /api/documents
GET /api/documents/:id
POST /api/documents/upload
POST /api/documents/process
```

### Search

```http
GET /api/search?q=hemoglobin
```

## How to Upload Documents

1. Log in to the application.
2. Open the Upload Documents page.
3. Choose a patient.
4. Select one or more files.
5. Click upload.
6. The system processes the file and adds Timeline events when complete.

## Security Notes

- Do not store real API keys in source files.
- Keep `.env` local and out of Git.
- Validate file extensions and file sizes.
- Sanitize uploaded filenames.
- Use the system only as a prototype for local education and demo work.

## Medical Disclaimer

This application is a prototype for educational, demonstration, and workflow support use. It does not replace clinical judgment, physician review, or regulated medical decision tools. Extracted information should always be reviewed by a qualified healthcare professional before being used for patient care.

## GitHub Deployment

1. Create a GitHub repository.
2. Commit the project:

```bash
git init
git add .
git commit -m "Initial Cauvery Med prototype"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

3. Deploy to a platform such as Render, Railway, or a VPS using the same Node.js app structure.

## Live Deployment Tips

- Set environment variables in the hosting platform.
- Keep uploads on a persistent disk if needed.
- Run the app as a Node.js service.
- Use HTTPS in production.

## Common Troubleshooting

- If the app cannot start, confirm dependencies are installed with `npm install`.
- If uploads fail, check file size and supported extension.
- If OCR is unavailable, use TXT or PDF documents for validation.
- If API requests fail, verify the app is running on the expected port.

## License

MIT
