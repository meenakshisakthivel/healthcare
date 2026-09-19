document.addEventListener('DOMContentLoaded', async () => {
  const patientSelect = document.getElementById('timelinePatientSelect');
  const timelineContainer = document.getElementById('timelineContainer');

  async function loadPatients() {
    const response = await fetch('/api/patients');
    const data = await response.json();
    const patients = data.patients || [];
    patientSelect.innerHTML = patients.map((patient) => `
      <option value="${patient.patientId || patient.id}">${patient.fullName || patient.patientId}</option>
    `).join('');
    if (patients.length) loadTimeline(patients[0].patientId || patients[0].id);
  }

  async function loadTimeline(patientId) {
    const response = await fetch(`/api/patients/${patientId}/timeline`);
    const data = await response.json();
    const events = data.events || [];

    if (!events.length) {
      timelineContainer.innerHTML = '<div class="empty-state">No events available for this patient.</div>';
      return;
    }

    const grouped = events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    timelineContainer.innerHTML = grouped.map((event) => {
      const purpose = event.diagnosis || event.eventType || 'Care review';
      const medication = event.medication || 'No medication recorded';
      const test = event.test || 'No test recorded';
      const source = event.sourceFilename || 'Unknown source';

      return `
        <div class="timeline-item">
          <div class="timeline-date">${event.eventDate || 'Unknown date'}</div>
          <h3>${event.title || 'Medical event'}</h3>
          <div class="badge info">${event.eventType || 'Medical'}</div>
          <p><strong>Purpose:</strong> ${purpose}</p>
          <p><strong>Medication / treatment:</strong> ${medication}</p>
          <p><strong>Clinical detail:</strong> ${event.description || 'No additional description available.'}</p>
          <p><strong>Relevant test / result:</strong> ${test}${event.result ? ` — ${event.result}` : ''}</p>
          <div class="timeline-event-meta">Doctor: ${event.doctor || '-'} · Hospital: ${event.hospital || '-'} · Source: ${source}</div>
        </div>
      `;
    }).join('');
  }

  patientSelect.addEventListener('change', (event) => {
    loadTimeline(event.target.value);
  });

  loadPatients();
});
