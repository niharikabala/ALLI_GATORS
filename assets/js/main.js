document.addEventListener('DOMContentLoaded', () => {
  // set current year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Set active navigation link based on current page
  setActiveNavLink();

  // theme toggle with auto mode based on time
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  
  // Function to determine theme based on time (6am-6pm = light, otherwise dark)
  function getAutoTheme() {
    const hour = new Date().getHours();
    console.log('Current hour:', hour);
    return (hour >= 6 && hour < 18) ? 'light' : 'dark';
  }
  
  // Check if user has manually overridden the theme
  const manualOverride = localStorage.getItem('theme-manual-override');
  let theme;
  
  if (manualOverride === 'true') {
    // User manually set a preference, use it
    theme = localStorage.getItem('site-theme');
    console.log('Using manual theme:', theme);
  } else {
    // Auto-detect based on time
    theme = getAutoTheme();
    console.log('Using auto theme:', theme);
  }
  
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  }
  
  function toggleTheme(){
    const isLight = document.documentElement.classList.toggle('light');
    const newTheme = isLight ? 'light' : 'dark';
    localStorage.setItem('site-theme', newTheme);
    localStorage.setItem('theme-manual-override', 'true');
    console.log('Theme manually changed to:', newTheme);
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
      const mailto = `mailto:aalli@ufl.edu?subject=${encodeURIComponent('Contact from '+name)}&body=${encodeURIComponent(message + "\n\nFrom: " + name + " <" + email + ">")}`;
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
    el.innerHTML = top.map(p=>{
      const avatarContent = p.photo 
        ? `<img src="${p.photo}" alt="${p.fullname}">` 
        : `<div class="initials">${(p.firstname?.[0] || '') + (p.lastname?.[0] || '')}</div>`;
      return `
        <article class="card people-card">
          <div class="avatar">${avatarContent}</div>
          <div>
            <h4>${p.fullname}</h4>
            ${p.title ? `<p class="muted-small">${p.title}</p>` : ''}
            <p class="muted-small">${p.department || ''}</p>
            <p style="margin-top:8px"><a href="mailto:${p.email}">Email</a></p>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderPeopleList(list) {
    const search = document.getElementById('people-search');
    const currentSection = document.getElementById('current-people');
    const alumniSection = document.getElementById('alumni-people');
    
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
          p.firstname || '',
          p.lastname || '',
          p.fullname || '',
          p.email || '',
          p.department || ''
        ].join(' ').toLowerCase();
        return searchText.includes(q);
      }) : list;
      console.log('Filtered people:', filtered);

      // Render current people
      const current = filtered.filter(p => p.status === 'current');
      console.log('Current members:', current);
      if (currentSection) {
        currentSection.innerHTML = current.map(p => renderPersonCard(p)).join('');
      }

      // Render alumni
      const alumni = filtered.filter(p => p.status === 'alumni');
      console.log('Alumni:', alumni);
      if (alumniSection) {
        alumniSection.innerHTML = alumni.map(p => renderPersonCard(p)).join('');
      }
    }
  }

  function renderPersonCard(p) {
    // Get initials from firstname and lastname
    const avatarContent = p.photo 
      ? `<img src="${p.photo}" alt="${p.fullname}">` 
      : `<div class="initials">${(p.firstname?.[0] || '') + (p.lastname?.[0] || '')}</div>`;
    
    return `
      <article class="card people-card">
        <div class="avatar">${avatarContent}</div>
        <div>
          <h4>${p.fullname}</h4>
          ${p.title ? `<p class="muted-small">${p.title}</p>` : ''}
          <p class="muted-small">${p.department || ''}</p>
          <p style="margin-top:8px"><a href="mailto:${p.email}">Email</a></p>
        </div>
      </article>
    `;
  }

  function renderPubPreview(list){
    const el = document.getElementById('pub-preview');
    if (!el) return;
    const top = list.slice(0,4);
    el.innerHTML = top.map(p=>{
      const badges = [];
      if (p.free_access) badges.push('<span class="pub-badge free">Free Access</span>');
      if (p.type === 'Review') badges.push('<span class="pub-badge review">Review</span>');
      if (p.type === 'Preprint') badges.push('<span class="pub-badge preprint">Preprint</span>');
      
      return `
        <div class="card pub-item">
          <div class="meta">${p.year} • ${p.venue}</div>
          <h4>${p.title}</h4>
          <p class="muted">${p.authors.slice(0, 3).join(', ')}${p.authors.length > 3 ? ', et al.' : ''}</p>
          ${badges.length > 0 ? `<div class="pub-badges">${badges.join('')}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderPubList(list){
    const el = document.getElementById('pub-list');
    if (!el) return;
    const search = document.getElementById('pub-search');
    const yearSelect = document.getElementById('year-filter');
    const filterBadges = document.querySelectorAll('.filter-badge');
    let activeFilter = 'all';

    // populate year filter
    const years = Array.from(new Set(list.map(p=>p.year))).sort((a,b)=>b-a);
    if (yearSelect){
      yearSelect.innerHTML = '<option value="all">All years</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join('');
    }

    // Update badge counts
    function updateCounts(filtered) {
      const countAll = document.getElementById('count-all');
      const countFree = document.getElementById('count-free');
      const countReview = document.getElementById('count-review');
      const countPreprint = document.getElementById('count-preprint');
      
      if (countAll) countAll.textContent = filtered.length;
      if (countFree) countFree.textContent = filtered.filter(p => p.free_access).length;
      if (countReview) countReview.textContent = filtered.filter(p => p.type === 'Review').length;
      if (countPreprint) countPreprint.textContent = filtered.filter(p => p.type === 'Preprint').length;
    }

    function draw(){
      const q = (search?.value||'').toLowerCase();
      const y = yearSelect?.value || 'all';
      
      // First filter by search and year
      let filtered = list.filter(p=>{
        if (y !== 'all' && String(p.year) !== String(y)) return false;
        if (!q) return true;
        return (p.title + ' ' + p.authors.join(' ') + ' ' + p.venue + ' ' + (p.type||'')).toLowerCase().includes(q);
      });
      
      // Update counts based on search/year filtered results
      updateCounts(filtered);
      
      // Then apply badge filter
      if (activeFilter === 'free') {
        filtered = filtered.filter(p => p.free_access);
      } else if (activeFilter === 'review') {
        filtered = filtered.filter(p => p.type === 'Review');
      } else if (activeFilter === 'preprint') {
        filtered = filtered.filter(p => p.type === 'Preprint');
      }
      
      el.innerHTML = filtered.map(p=>{
        const badges = [];
        if (p.free_access) badges.push('<span class="pub-badge free">Free Access</span>');
        if (p.type === 'Review') badges.push('<span class="pub-badge review">Review</span>');
        if (p.type === 'Preprint') badges.push('<span class="pub-badge preprint">Preprint</span>');
        
        const doiUrl = p.doi ? `https://doi.org/${p.doi}` : '#';
        const pubmedUrl = p.pubmed_url || `https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`;
        
        return `
          <article class="card pub-item">
            <div class="pub-header">
              <div class="meta">${p.year} • ${p.venue}</div>
              ${badges.length > 0 ? `<div class="pub-badges">${badges.join('')}</div>` : ''}
            </div>
            <h3>${p.title}</h3>
            <p class="muted authors-list">${p.authors.join(', ')}</p>
            <div class="pub-links">
              ${p.pmid ? `<a href="${pubmedUrl}" target="_blank" class="pub-link">PubMed</a>` : ''}
              ${p.doi ? `<a href="${doiUrl}" target="_blank" class="pub-link">DOI</a>` : ''}
              <span class="muted">PMID: ${p.pmid || 'N/A'}</span>
            </div>
          </article>
        `;
      }).join('');
    }

    // Filter badge click handlers
    filterBadges.forEach(badge => {
      badge.addEventListener('click', () => {
        const filter = badge.dataset.filter;
        activeFilter = filter;
        
        // Update active states
        filterBadges.forEach(b => b.classList.remove('active'));
        badge.classList.add('active');
        
        draw();
      });
    });

    search?.addEventListener('input', draw);
    yearSelect?.addEventListener('change', draw);
    draw();
  }

  function initials(name){
    return name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  }

  function setActiveNavLink() {
    // Get current page from URL
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Remove all active classes first
    document.querySelectorAll('.main-nav a').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current page link
    const currentLink = document.querySelector(`.main-nav a[href*="${page}"]`);
    if (currentLink) {
      currentLink.classList.add('active');
    } else if (page === '' || page === '/') {
      // If we're at root, activate Home
      const homeLink = document.querySelector('.main-nav a[href*="index.html"]');
      if (homeLink) homeLink.classList.add('active');
    }
  }

});
