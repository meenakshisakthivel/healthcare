document.addEventListener('DOMContentLoaded', async () => {
  const user = localStorage.getItem('cauveryUser');
  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  const patientTableContainer = document.getElementById('patientTableContainer');
  const patientSearch = document.getElementById('patientSearch');
  const patientForm = document.getElementById('patientForm');
  const patientModal = document.getElementById('patientModal');
  const addPatientBtn = document.getElementById('addPatientBtn');

  async function loadPatients() {
    const response = await fetch('/api/patients');
    const data = await response.json();
    const patients = data.patients || [];
    renderPatients(patients);
    return patients;
  }

  function renderPatients(patients) {
    const searchTerm = (patientSearch?.value || '').toLowerCase();
    const filtered = patients.filter((patient) => {
      const haystack = `${patient.fullName} ${patient.patientId} ${patient.email} ${patient.phone}`.toLowerCase();
      return haystack.includes(searchTerm);
    });

    if (!filtered.length) {
      patientTableContainer.innerHTML = '<div class="empty-state">No patients found.</div>';
      return;
    }

    patientTableContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Patient ID</th>
            <th>Name</th>
            <th>DOB</th>
            <th>Gender</th>
            <th>Phone</th>
            <th>Blood Group</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((patient) => `
            <tr>
              <td>${patient.patientId || patient.id}</td>
              <td>${patient.fullName || 'Unknown'}</td>
              <td>${patient.dateOfBirth || '-'}</td>
              <td>${patient.gender || '-'}</td>
              <td>${patient.phone || '-'}</td>
              <td>${patient.bloodGroup || '-'}</td>
              <td>
                <button class="btn btn-secondary view-btn" data-id="${patient.id}">View</button>
                <button class="btn btn-secondary edit-btn" data-id="${patient.id}">Edit</button>
                <button class="btn btn-secondary delete-btn" data-id="${patient.id}">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    patientTableContainer.querySelectorAll('.view-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const patientId = button.dataset.id;
        window.location.href = `/patient.html?id=${patientId}`;
      });
    });

    patientTableContainer.querySelectorAll('.edit-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const patientId = button.dataset.id;
        const response = await fetch(`/api/patients/${patientId}`);
        const data = await response.json();
        openModal(data.patient);
      });
    });

    patientTableContainer.querySelectorAll('.delete-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const patientId = button.dataset.id;
        const confirmed = confirm('Delete this patient record?');
        if (!confirmed) return;
        await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
        await loadPatients();
      });
    });
  }

  function openModal(patient = {}) {
    document.getElementById('patientIdHidden').value = patient.id || '';
    document.getElementById('patientId').value = patient.patientId || patient.id || '';
    document.getElementById('fullName').value = patient.fullName || '';
    document.getElementById('dateOfBirth').value = patient.dateOfBirth || '';
    document.getElementById('gender').value = patient.gender || 'Female';
    document.getElementById('phone').value = patient.phone || '';
    document.getElementById('email').value = patient.email || '';
    document.getElementById('aadhaarId').value = patient.aadhaarId || '';
    document.getElementById('abhaId').value = patient.abhaId || '';
    document.getElementById('address').value = patient.address || '';
    document.getElementById('emergencyContact').value = patient.emergencyContact || '';
    document.getElementById('bloodGroup').value = patient.bloodGroup || '';
    document.getElementById('allergies').value = patient.allergies || '';
    document.getElementById('existingConditions').value = patient.existingConditions || '';
    patientModal.classList.remove('hidden');
  }

  patientForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = {
      patientId: document.getElementById('patientId').value,
      fullName: document.getElementById('fullName').value,
      dateOfBirth: document.getElementById('dateOfBirth').value,
      gender: document.getElementById('gender').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value,
      aadhaarId: document.getElementById('aadhaarId').value,
      abhaId: document.getElementById('abhaId').value,
      address: document.getElementById('address').value,
      emergencyContact: document.getElementById('emergencyContact').value,
      bloodGroup: document.getElementById('bloodGroup').value,
      allergies: document.getElementById('allergies').value,
      existingConditions: document.getElementById('existingConditions').value
    };

    const patientIdHidden = document.getElementById('patientIdHidden').value;
    const method = patientIdHidden ? 'PUT' : 'POST';
    const url = patientIdHidden ? `/api/patients/${patientIdHidden}` : '/api/patients';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    patientForm.reset();
    patientModal.classList.add('hidden');
    await loadPatients();
  });

  addPatientBtn.addEventListener('click', () => openModal());
  patientSearch.addEventListener('input', () => loadPatients());

  document.querySelectorAll('[data-close="patientModal"]').forEach((toggle) => {
    toggle.addEventListener('click', () => patientModal.classList.add('hidden'));
  });

  loadPatients();
});
