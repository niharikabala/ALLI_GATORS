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
  fetch('assets/data/people.json').then(r=>r.json()).then(data=>{
    renderPeoplePreview(data);
    if (path === 'people.html') renderPeopleList(data);
  }).catch(e=>console.warn('people.json fetch failed', e));

  // fetch publications
  fetch('assets/data/publications.json').then(r=>r.json()).then(data=>{
    renderPubPreview(data);
    if (path === 'publications.html') renderPubList(data);
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

  // search & filter handlers
  const peopleSearch = document.getElementById('people-search');
  const roleFilter = document.getElementById('role-filter');
  if (peopleSearch || roleFilter){
    // handled inside renderPeopleList
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
    el.innerHTML = top.map(p=>`
      <article class="card people-card">
        <div class="avatar">${initials(p.name)}</div>
        <div class="person-meta">
          <h4>${p.name}</h4>
          <p class="muted">${p.role} — ${p.title || ''}</p>
        </div>
      </article>
    `).join('');
  }

  function renderPeopleList(list){
    const el = document.getElementById('people-list');
    if (!el) return;
    const search = document.getElementById('people-search');
    const role = document.getElementById('role-filter');

    function draw(){
      const q = (search?.value||'').toLowerCase();
      const r = role?.value || 'all';
      const filtered = list.filter(p=>{
        if (r !== 'all' && p.role !== r) return false;
        if (!q) return true;
        return (p.name + ' ' + (p.interests||'') + ' ' + (p.title||'')).toLowerCase().includes(q);
      });
      el.innerHTML = filtered.map(p=>`
        <article class="card people-card">
          <div class="avatar">${initials(p.name)}</div>
          <div>
            <h4>${p.name}</h4>
            <p class="muted-small">${p.role} — ${p.title || ''}</p>
            <p class="muted">${(p.interests||'').slice(0,120)}</p>
            <p style="margin-top:8px"><a href="mailto:${p.email}">Email</a> • <a href="${p.website||'#'}">Website</a></p>
          </div>
        </article>
      `).join('');
    }

    search?.addEventListener('input', draw);
    role?.addEventListener('change', draw);
    draw();
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
