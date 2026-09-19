document.addEventListener('DOMContentLoaded', async () => {
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('documentInput');
  const uploadStatus = document.getElementById('uploadStatus');
  const uploadList = document.getElementById('uploadList');
  const identityType = document.getElementById('identityType');
  const identityValue = document.getElementById('identityValue');
  const uploadSummary = document.getElementById('uploadSummary');
  const uploadBox = document.getElementById('uploadBox');

  const setStatus = (text, type = 'success') => {
    uploadStatus.textContent = text;
    uploadStatus.className = `message-box ${type}`;
  };

  fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    uploadList.innerHTML = files.map((file) => `
      <div class="upload-item">
        <span>${file.name}</span>
        <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
    `).join('');
  });

  uploadBox.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadBox.style.borderColor = '#0f5d9c';
  });

  uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = '#dfe7f1';
  });

  uploadBox.addEventListener('drop', (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    fileInput.files = files;
    fileInput.dispatchEvent(new Event('change'));
    uploadBox.style.borderColor = '#dfe7f1';
  });

  uploadBtn.addEventListener('click', async () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) {
      setStatus('Please choose at least one document before uploading.', 'error');
      return;
    }
    if (!identityValue.value.trim()) {
      setStatus('Enter an identity value before uploading.', 'error');
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('identityType', identityType.value);
    formData.append('identityValue', identityValue.value.trim());

    try {
      setStatus('Uploading and processing documents...', 'success');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed');

      const uploaded = data.documents || [];
      for (const document of uploaded) {
        await fetch('/api/documents/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id })
        });
      }

      const summaryDocument = uploaded[uploaded.length - 1];
      const processedResponse = await fetch(`/api/documents/${summaryDocument.id}`);
      const processedData = await processedResponse.json();
      const summary = processedData.document?.structuredData;
      uploadSummary.classList.remove('hidden');
      uploadSummary.innerHTML = `<strong>Verified patient: ${data.patient.fullName} (${data.patient.patientId})</strong>
        <p>${summary?.document?.type || 'Document'} summarized successfully. ${summary?.clinicalInformation?.diagnoses?.join(', ') || 'No diagnosis was extracted.'}</p>`;
      setStatus(`${uploaded.length} document(s) routed to ${data.patient.fullName} and summarized successfully.`, 'success');
      fileInput.value = '';
      uploadList.innerHTML = '';
    } catch (error) {
      setStatus(error.message || 'Document upload failed.', 'error');
    }
  });

});
