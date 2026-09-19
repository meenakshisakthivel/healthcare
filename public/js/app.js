document.addEventListener('DOMContentLoaded', async () => {
  const isAuthPage = window.location.pathname.endsWith('login.html');
  if (!isAuthPage) {
    const stored = localStorage.getItem('cauveryUser');
    if (!stored) {
      window.location.href = '/login.html';
      return;
    }
  }

  const totalPatientsEl = document.getElementById('totalPatients');
  const totalDocumentsEl = document.getElementById('totalDocuments');
  const medicalEventsEl = document.getElementById('medicalEvents');
  const recentUploadsEl = document.getElementById('recentUploads');
  const latestEventsEl = document.getElementById('latestEvents');
  const documentTypeBreakdownEl = document.getElementById('documentTypeBreakdown');
  const labResultsTableEl = document.getElementById('labResultsTable');
  const labPatientSelect = document.getElementById('labPatientSelect');
  const labFileInput = document.getElementById('labFileInput');
  const labUploadBtn = document.getElementById('labUploadBtn');
  const labUploadStatus = document.getElementById('labUploadStatus');

  async function loadLabPatients() {
    if (!labPatientSelect) return;
    const response = await fetch('/api/patients');
    const data = await response.json();
    const patients = data.patients || [];
    labPatientSelect.innerHTML = patients.map((patient) => `
      <option value="${patient.patientId || patient.id}">${patient.fullName || patient.patientId}</option>
    `).join('');
  }

  async function renderLabResults() {
    if (!labResultsTableEl) return;
    const response = await fetch('/api/documents');
    const data = await response.json();
    const docs = data.documents || [];
    const patients = await fetch('/api/patients').then((res) => res.json()).then((res) => res.patients || []);
    const patientMap = new Map(patients.map((patient) => [patient.patientId || patient.id, patient.fullName || patient.patientId]));

    const labRows = docs.filter((doc) => {
      const type = (doc.category || '').toLowerCase();
      const text = (doc.extractedText || '').toLowerCase();
      return type.includes('laboratory') || /hemoglobin|tsh|cbc|glucose|creatinine|alt|ast|wbc|platelet|ferritin/i.test(text);
    });

    if (!labRows.length) {
      labResultsTableEl.innerHTML = '<div class="empty-state">No lab data available.</div>';
      return;
    }

    labResultsTableEl.innerHTML = `
      <table>
        <thead>
          <tr><th>Patient</th><th>Document</th><th>Type</th><th>Date</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${labRows.map((doc) => `
            <tr>
              <td>${patientMap.get(doc.patientId) || doc.patientId || 'Unknown patient'}</td>
              <td>${doc.originalFilename || 'Lab report'}</td>
              <td>${doc.category || 'Laboratory Report'}</td>
              <td>${doc.documentDate || doc.uploadDate || '-'}</td>
              <td><span class="badge info">${doc.processingStatus || 'stored'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const renderDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      if (totalPatientsEl) totalPatientsEl.textContent = data.totalPatients || 0;
      if (totalDocumentsEl) totalDocumentsEl.textContent = data.totalDocuments || 0;
      if (medicalEventsEl) medicalEventsEl.textContent = data.medicalEvents || 0;

      const recent = data.recentUploads || [];
      if (recentUploadsEl) {
        recentUploadsEl.innerHTML = recent.length
          ? recent.map((item) => `
              <div class="stack-item">
                <strong>${item.originalFilename || 'Document'}</strong>
                <div class="timeline-event-meta">${item.category || 'Other'} · ${item.uploadDate || ''}</div>
              </div>
            `).join('')
          : '<div class="empty-state">No recent uploads yet.</div>';
      }

      const latest = data.latestTimelineEvents || [];
      if (latestEventsEl) {
        latestEventsEl.innerHTML = latest.length
          ? latest.map((item) => `
              <div class="stack-item">
                <strong>${item.title || 'Event'}</strong>
                <div class="timeline-event-meta">${item.eventDate || ''} · ${item.eventType || 'Clinical'} · ${item.sourceFilename || ''}</div>
              </div>
            `).join('')
          : '<div class="empty-state">No timeline events yet.</div>';
      }

      const types = data.byType || {};
      if (documentTypeBreakdownEl) {
        const total = Object.values(types).reduce((sum, value) => sum + value, 0) || 1;
        documentTypeBreakdownEl.innerHTML = Object.entries(types).map(([key, value]) => {
          const width = (value / total) * 100;
          return `
            <div class="chart-row">
              <span>${key}</span>
              <div class="bar"><span style="width:${width}%"></span></div>
              <strong>${value}</strong>
            </div>
          `;
        }).join('') || '<div class="empty-state">No document categories yet.</div>';
      }

      if (labUploadBtn) {
        labUploadBtn.addEventListener('click', async () => {
          const files = Array.from(labFileInput.files || []);
          if (!files.length) {
            if (labUploadStatus) {
              labUploadStatus.textContent = 'Please select at least one lab document.';
              labUploadStatus.className = 'message-box error';
            }
            return;
          }

          const patientId = labPatientSelect.value;
          const formData = new FormData();
          files.forEach((file) => formData.append('files', file));
          formData.append('patientId', patientId);

          try {
            const response = await fetch('/api/documents/upload', {
              method: 'POST',
              body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Lab upload failed');

            const uploadedDocs = data.documents || [];
            for (const document of uploadedDocs) {
              await fetch('/api/documents/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: document.id })
              });
            }

            if (labUploadStatus) {
              labUploadStatus.textContent = `${uploadedDocs.length} lab document(s) saved successfully.`;
              labUploadStatus.className = 'message-box success';
            }
            labFileInput.value = '';
            renderLabResults();
          } catch (error) {
            if (labUploadStatus) {
              labUploadStatus.textContent = error.message || 'Unable to save lab document.';
              labUploadStatus.className = 'message-box error';
            }
          }
        });
      }

      await renderLabResults();
      await loadLabPatients();
    } catch (error) {
      console.error(error);
    }
  };

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      localStorage.removeItem('cauveryUser');
      window.location.href = '/login.html';
    });
  }

  renderDashboard();
});
