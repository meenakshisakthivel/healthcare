document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');

  const performSearch = async () => {
    const value = searchInput.value.trim();
    if (!value) {
      searchResults.innerHTML = '<div class="empty-state">Enter a search term to find documents or events.</div>';
      return;
    }

    const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    const data = await response.json();
    const docs = data.documents || [];
    const events = data.events || [];

    if (!docs.length && !events.length) {
      searchResults.innerHTML = '<div class="empty-state">No matching medical data found.</div>';
      return;
    }

    searchResults.innerHTML = `
      ${docs.map((item) => `
        <div class="search-card">
          <h3>${item.originalFilename || 'Document'}</h3>
          <div class="timeline-event-meta">Patient: ${item.patientId || '-'} · Type: ${item.category || 'Other'} · Date: ${item.documentDate || item.uploadDate || '-'}</div>
          <p>${(item.extractedText || '').slice(0, 220)}...</p>
        </div>
      `).join('')}
      ${events.map((item) => `
        <div class="search-card">
          <h3>${item.title || 'Event'}</h3>
          <div class="timeline-event-meta">${item.eventType || 'Medical'} · ${item.eventDate || '-'} · ${item.sourceFilename || 'n/a'}</div>
          <p>${item.description || ''}</p>
        </div>
      `).join('')}
    `;
  };

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') performSearch();
  });
});
