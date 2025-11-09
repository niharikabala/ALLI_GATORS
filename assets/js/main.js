document.addEventListener('DOMContentLoaded', () => {
  // set current year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  // remember theme in localStorage
  const theme = localStorage.getItem('site-theme');
  if (theme === 'light') document.documentElement.classList.add('light');
  function toggleTheme(){
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('site-theme', isLight ? 'light' : 'dark');
  }
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  // simple client-side router for data-driven pages
  const path = location.pathname.split('/').pop() || 'index.html';

  // fetch and render people for preview and full page
  console.log('Fetching people data...');
  fetch('./assets/data/people.json').then(r=>r.json()).then(data=>{
    console.log('People data loaded:', data);
    renderPeoplePreview(data.filter(p => p.status !== 'alumni'));
    if (path === 'people.html') {
      console.log('Rendering full people list...');
      renderPeopleList(data);
    }
  }).catch(e=>console.warn('people.json fetch failed', e));

  // fetch publications
  console.log('Fetching publications data...');
  fetch('./assets/data/publications.json').then(r=>r.json()).then(data=>{
    console.log('Publications data loaded:', data);
    renderPubPreview(data);
    if (path === 'publications.html') {
      console.log('Rendering full publications list...');
      renderPubList(data);
    }
  }).catch(e=>console.warn('publications.json fetch failed', e));

  // contact form - open mail client
  const contactForm = document.getElementById('contact-form');
  if (contactForm){
    contactForm.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const form = new FormData(contactForm);
      const name = form.get('name');
      const email = form.get('email');
      const message = form.get('message');
      const mailto = `mailto:lab@example.edu?subject=${encodeURIComponent('Contact from '+name)}&body=${encodeURIComponent(message + "\n\nFrom: " + name + " <" + email + ">")}`;
      location.href = mailto;
    });
    document.getElementById('contact-reset')?.addEventListener('click', ()=>contactForm.reset());
  }

  // search handler
  const peopleSearch = document.getElementById('people-search');
  if (peopleSearch){
    peopleSearch.addEventListener('input', filterPeople);
  }

  const pubSearch = document.getElementById('pub-search');
  const yearFilter = document.getElementById('year-filter');
  if (pubSearch || yearFilter){
    // handled inside renderPubList
  }

  // rendering helpers
  function renderPeoplePreview(list){
    const el = document.getElementById('people-preview');
    if (!el) return;
    const top = list.slice(0,4);
    el.innerHTML = top.map(p=>renderPersonCard(p)).join('');
  }

  function renderPeopleList(list) {
    const search = document.getElementById('people-search');
    
    // Call filterPeople initially to show all people
    filterPeople();
    
    // Add event listener to search input
    if (search) {
      search.addEventListener('input', filterPeople);
    }
    
    function filterPeople() {
      console.log('Filtering people with search:', search?.value);
      console.log('Total people in list:', list.length);
      const q = (search?.value||'').toLowerCase().trim();
      const filtered = q ? list.filter(p => {
        const searchText = [
          p.name,
          p.interests || '',
          p.title || '',
          p.role || '',
          p.current_position || ''
        ].join(' ').toLowerCase();
        return searchText.includes(q);
      }) : list;
      console.log('Filtered people:', filtered);

      // Clear all sections first
      document.querySelectorAll('.card-grid[data-role]').forEach(section => {
        section.innerHTML = '';
      });

      // Split and render current members by role
      const current = filtered.filter(p => p.status !== 'alumni');
      console.log('Current members:', current);
      current.forEach(person => {
        const section = document.querySelector(`.card-grid[data-role="${person.role}"]`);
        if (section) {
          section.innerHTML += renderPersonCard(person);
        }
      });

      // Render alumni section
      const alumniSection = document.querySelector('.card-grid[data-role="Alumni"]');
      if (alumniSection) {
        const alumni = filtered.filter(p => p.status === 'alumni');
        console.log('Alumni:', alumni);
        alumniSection.innerHTML = alumni.map(p => renderAlumniCard(p)).join('');
      }

      // Hide empty sections
      document.querySelectorAll('.role-section').forEach(section => {
        const cards = section.querySelector('.card-grid');
        if (!cards) return;
        const hasCards = cards.children.length > 0;
        section.style.display = hasCards ? 'block' : 'none';
        // Also hide the heading if section is empty
        const heading = section.querySelector('h3');
        if (heading) heading.style.display = hasCards ? 'block' : 'none';
      });
    }
  }

  function renderPersonCard(p) {
    return `
      <article class="card people-card">
        <div class="avatar">${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : initials(p.name)}</div>
        <div>
          <h4>${p.name}</h4>
          <p class="muted-small">${p.role} — ${p.title || ''}</p>
          <p class="muted">${(p.interests||'').slice(0,120)}</p>
          <p style="margin-top:8px"><a href="mailto:${p.email}">Email</a> • <a href="${p.website||'#'}">Website</a></p>
        </div>
      </article>
    `;
  }

  function renderAlumniCard(p) {
    return `
      <article class="card people-card alumni-card">
        <div class="avatar">${p.photo ? `<img src="${p.photo}" alt="${p.name}">` : initials(p.name)}</div>
        <div>
          <h4>${p.name}</h4>
          <p class="muted-small">${p.title || ''}</p>
          ${p.current_position ? `<p class="current-position">Now: ${p.current_position}</p>` : ''}
          <p style="margin-top:8px"><a href="mailto:${p.email}">Email</a> • <a href="${p.website||'#'}">Website</a></p>
        </div>
      </article>
    `;
  }

  function renderPubPreview(list){
    const el = document.getElementById('pub-preview');
    if (!el) return;
    const top = list.slice(0,4);
    el.innerHTML = top.map(p=>`
      <div class="card pub-item">
        <div class="meta">${p.year} • ${p.venue}</div>
        <h4>${p.title}</h4>
        <p class="muted">${p.authors.join(', ')}</p>
      </div>
    `).join('');
  }

  function renderPubList(list){
    const el = document.getElementById('pub-list');
    if (!el) return;
    const search = document.getElementById('pub-search');
    const yearSelect = document.getElementById('year-filter');

    // populate year filter
    const years = Array.from(new Set(list.map(p=>p.year))).sort((a,b)=>b-a);
    if (yearSelect){
      yearSelect.innerHTML = '<option value="all">All years</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join('');
    }

    function draw(){
      const q = (search?.value||'').toLowerCase();
      const y = yearSelect?.value || 'all';
      const filtered = list.filter(p=>{
        if (y !== 'all' && String(p.year) !== String(y)) return false;
        if (!q) return true;
        return (p.title + ' ' + p.authors.join(' ') + ' ' + (p.tags||'')).toLowerCase().includes(q);
      });
      el.innerHTML = filtered.map(p=>`
        <article class="card pub-item">
          <div class="meta">${p.year} • ${p.venue}</div>
          <h3>${p.title}</h3>
          <p class="muted">${p.authors.join(', ')}</p>
          <p>${p.abstract ? p.abstract.slice(0,240) + (p.abstract.length>240? '…' : '') : ''}</p>
          <p><a href="${p.doi|| '#'}" target="_blank">Link</a> • <span class="muted">tags: ${p.tags?.join(', ') || '—'}</span></p>
        </article>
      `).join('');
    }

    search?.addEventListener('input', draw);
    yearSelect?.addEventListener('change', draw);
    draw();
  }

  function initials(name){
    return name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  }

});
