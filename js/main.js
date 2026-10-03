/* ==========================================================================
   YRAL Cafe — Interactions
   ========================================================================== */
(function(){
  "use strict";

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx) => (ctx||document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx||document).querySelectorAll(sel));

  /* ---------------- Toast ---------------- */
  function toast(msg, icon){
    const region = $('#toastRegion');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${icon || '<path d="M20 6 9 17l-5-5"/>'}</svg><span>${msg}</span>`;
    region.appendChild(el);
    setTimeout(()=>{
      el.classList.add('out');
      setTimeout(()=>el.remove(), 400);
    }, 3200);
  }

  /* ---------------- Theme toggle ---------------- */
  const themeSwitch = $('#themeSwitch');
  const storedTheme = localStorage.getItem('yral-theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  let currentTheme = storedTheme || (prefersLight ? 'light' : 'dark');
  document.body.setAttribute('data-theme', currentTheme);
  syncThemeMeta();
  themeSwitch.setAttribute('aria-pressed', currentTheme === 'light');

  themeSwitch.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('yral-theme', currentTheme);
    themeSwitch.setAttribute('aria-pressed', currentTheme === 'light');
    syncThemeMeta();
    toast(`Switched to ${currentTheme} mode`, '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
  });
  function syncThemeMeta(){
    $('meta[name="theme-color"]').setAttribute('content', currentTheme === 'dark' ? '#0a0908' : '#faf5ec');
  }

  /* ---------------- Navbar scroll state + active link ---------------- */
  const navbar = $('#navbar');
  const sections = ['hero','about','menu','gallery','visit','contact'].map(id => document.getElementById(id)).filter(Boolean);
  const navLinks = $$('.nav-links a');

  function onScroll(){
    navbar.classList.toggle('scrolled', window.scrollY > 30);
    // active section highlight
    let activeId = sections[0].id;
    const scrollPos = window.scrollY + window.innerHeight * 0.32;
    for (const sec of sections){
      if (sec.offsetTop <= scrollPos) activeId = sec.id;
    }
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#'+activeId));
    // back to top
    $('#toTop').classList.toggle('show', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  $('#toTop').addEventListener('click', () => window.scrollTo({ top:0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------------- Mobile drawer ---------------- */
  const drawer = $('#mobileDrawer');
  const navToggle = $('#navToggle');
  function openDrawer(){
    drawer.classList.add('open');
    navToggle.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    navToggle.setAttribute('aria-expanded','false');
    document.body.style.overflow = '';
  }
  navToggle.addEventListener('click', openDrawer);
  $$('[data-close-drawer]').forEach(el => el.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  /* ---------------- Cursor glow (desktop only) ---------------- */
  const cursorGlow = $('#cursorGlow');
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (isFinePointer && !reduceMotion){
    window.addEventListener('pointermove', e => {
      document.body.classList.add('has-cursor');
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
    }, { passive:true });
  }

  /* ---------------- Particle background (hero) ---------------- */
  (function particles(){
    const canvas = $('#particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hero = $('#hero');
    let particlesArr = [];
    let raf;

    function resize(){
      canvas.width = hero.clientWidth * window.devicePixelRatio;
      canvas.height = hero.clientHeight * window.devicePixelRatio;
      canvas.style.width = hero.clientWidth + 'px';
      canvas.style.height = hero.clientHeight + 'px';
      ctx.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0);
      const count = Math.min(70, Math.floor(hero.clientWidth / 22));
      particlesArr = Array.from({length: count}, () => ({
        x: Math.random() * hero.clientWidth,
        y: Math.random() * hero.clientHeight,
        r: Math.random() * 1.8 + 0.6,
        vx: (Math.random()-0.5) * 0.18,
        vy: (Math.random()-0.5) * 0.18,
        o: Math.random() * 0.5 + 0.15
      }));
    }

    function draw(){
      ctx.clearRect(0,0,hero.clientWidth,hero.clientHeight);
      const isLight = document.body.getAttribute('data-theme') === 'light';
      particlesArr.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = hero.clientWidth; if (p.x > hero.clientWidth) p.x = 0;
        if (p.y < 0) p.y = hero.clientHeight; if (p.y > hero.clientHeight) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = isLight ? `rgba(120,80,30,${p.o*0.5})` : `rgba(255,190,140,${p.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }

    resize();
    if (!reduceMotion) draw(); else ctx.clearRect(0,0,canvas.width,canvas.height);
    window.addEventListener('resize', () => { resize(); });
  })();

  /* ---------------- Scroll reveal ---------------- */
  const revealTargets = $$('[data-reveal]');
  const staggerParents = $$('[data-reveal-stagger]');
  staggerParents.forEach(parent => {
    Array.from(parent.children).forEach((child, i) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal','');
      child.style.setProperty('--i', i);
    });
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  function observeReveals(){
    $$('[data-reveal]').forEach(el => { if (!el.classList.contains('in-view')) io.observe(el); });
  }
  observeReveals();

  // Safety net: guarantee content is never permanently invisible for users/
  // tools that don't dispatch scroll/intersection events (e.g. some crawlers,
  // print/export renderers, or assistive tech). Progressive reveal still
  // happens immediately for anyone who scrolls normally.
  setTimeout(() => {
    $$('[data-reveal]').forEach(el => el.classList.add('in-view'));
  }, 1200);

  /* ======================================================================
     MENU — render, search, filter, category tabs, favorites
     ====================================================================== */
  const menuGrid = $('#menuGrid');
  const categoryTabs = $('#categoryTabs');
  const menuSearch = $('#menuSearch');
  const dietButtons = $$('.diet-toggle button');
  const resultCount = $('#menuResultCount');

  let state = {
    category: 'All',
    diet: 'all',
    query: ''
  };

  const FAV_KEY = 'yral-favorites';
  function getFavs(){ try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch(e){ return []; } }
  function setFavs(arr){ localStorage.setItem(FAV_KEY, JSON.stringify(arr)); }

  // Build category tabs
  categoryTabs.innerHTML = YRAL_CATEGORIES.map(cat =>
    `<button type="button" class="cat-tab${cat==='All' ? ' active' : ''}" data-cat="${cat}" role="tab" aria-selected="${cat==='All'}">${cat}</button>`
  ).join('');

  categoryTabs.addEventListener('click', e => {
    const btn = e.target.closest('.cat-tab');
    if (!btn) return;
    $$('.cat-tab', categoryTabs).forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    state.category = btn.dataset.cat;
    renderMenu();
  });

  dietButtons.forEach(btn => btn.addEventListener('click', () => {
    dietButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.diet = btn.dataset.diet;
    renderMenu();
  }));

  let searchDebounce;
  menuSearch.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.query = menuSearch.value.trim().toLowerCase();
      renderMenu();
    }, 180);
  });

  function filteredMenu(){
    return YRAL_MENU.filter(item => {
      if (state.category !== 'All' && item.category !== state.category) return false;
      if (state.diet !== 'all' && item.diet !== state.diet) return false;
      if (state.query){
        const hay = (item.name + ' ' + item.desc + ' ' + item.category).toLowerCase();
        if (!hay.includes(state.query)) return false;
      }
      return true;
    });
  }

  function dietBadge(item){
    return item.diet === 'veg'
      ? `<span class="diet-badge" title="Vegetarian" aria-label="Vegetarian"><i></i></span>`
      : `<span class="diet-badge nonveg" title="Non-Vegetarian" aria-label="Non-Vegetarian"><i></i></span>`;
  }

  function renderMenu(){
    const items = filteredMenu();
    resultCount.textContent = items.length
      ? `Showing ${items.length} of ${YRAL_MENU.length} dishes`
      : `No dishes found`;

    if (!items.length){
      menuGrid.innerHTML = `<div class="menu-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <p>No dishes match your search. Try a different keyword or filter.</p>
      </div>`;
      return;
    }

    const favs = getFavs();
    menuGrid.innerHTML = items.map((item, i) => `
      <article class="menu-card" data-reveal style="--i:${i % 8}">
        <div class="menu-card-media">
          <img src="${item.img}" alt="${item.name} — ${item.category}" loading="lazy">
          ${dietBadge(item)}
          <button type="button" class="fav-btn${favs.includes(item.id) ? ' active' : ''}" data-fav="${item.id}" aria-pressed="${favs.includes(item.id)}" aria-label="Save ${item.name} to favorites">
            <svg viewBox="0 0 24 24" fill="${favs.includes(item.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2 4.5 5.6 4A5 5 0 0 1 12 6.5 5 5 0 0 1 18.4 4C22 4.5 23.5 8.2 22 11.7 19.5 16.4 12 21 12 21Z"/></svg>
          </button>
        </div>
        <div class="menu-card-body">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="menu-card-foot">
            <span class="price-tag">₹${item.price}</span>
            <span class="category-chip">${item.category}</span>
          </div>
        </div>
      </article>
    `).join('');

    observeReveals();
  }

  menuGrid.addEventListener('click', e => {
    const btn = e.target.closest('[data-fav]');
    if (!btn) return;
    const id = btn.dataset.fav;
    let favs = getFavs();
    const item = YRAL_MENU.find(m => m.id === id);
    if (favs.includes(id)){
      favs = favs.filter(f => f !== id);
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed','false');
      btn.querySelector('svg').setAttribute('fill','none');
      toast(`Removed "${item.name}" from saved dishes`);
    } else {
      favs.push(id);
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','true');
      btn.querySelector('svg').setAttribute('fill','currentColor');
      toast(`Saved "${item.name}" ♡`, '<path d="M12 21s-7.5-4.6-10-9.3C.5 8.2 2 4.5 5.6 4A5 5 0 0 1 12 6.5 5 5 0 0 1 18.4 4C22 4.5 23.5 8.2 22 11.7 19.5 16.4 12 21 12 21Z"/>');
    }
    setFavs(favs);
    updateFavUI();
  });

  // Footer "menu" quick links -> set category + scroll
  $$('[data-cat-link]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const cat = a.dataset.catLink;
      const map = { 'Wings': 'YRAL Wings' };
      const target = map[cat] || cat;
      const tabBtn = $$('.cat-tab').find(b => b.dataset.cat === target) || $$('.cat-tab').find(b => b.dataset.cat === 'All');
      $$('.cat-tab').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      tabBtn.classList.add('active'); tabBtn.setAttribute('aria-selected','true');
      state.category = tabBtn.dataset.cat;
      renderMenu();
      document.getElementById('menu').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  renderMenu();

  /* ---------------- Favorites sheet ---------------- */
  const favFloat = $('#favFloat');
  const favCount = $('#favCount');
  const favSheet = $('#favSheet');
  const favBackdrop = $('#favBackdrop');
  const favList = $('#favList');
  const favTotalCount = $('#favTotalCount');

  function updateFavUI(){
    const favs = getFavs();
    favCount.textContent = favs.length;
    favFloat.classList.toggle('show', favs.length > 0);
    favTotalCount.textContent = favs.length;

    if (!favs.length){
      favList.innerHTML = `<div class="sheet-empty">No saved dishes yet. Tap the heart on any dish to save it here.</div>`;
      return;
    }
    favList.innerHTML = favs.map(id => {
      const item = YRAL_MENU.find(m => m.id === id);
      if (!item) return '';
      return `<div class="sheet-item">
        <img src="${item.img}" alt="${item.name}">
        <div class="info"><h4>${item.name}</h4><span>₹${item.price} · ${item.category}</span></div>
        <button type="button" data-unfav="${item.id}" aria-label="Remove ${item.name} from saved">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>`;
    }).join('');
  }

  function openFavSheet(){
    favSheet.classList.add('open');
    favBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeFavSheet(){
    favSheet.classList.remove('open');
    favBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }
  favFloat.addEventListener('click', openFavSheet);
  favBackdrop.addEventListener('click', closeFavSheet);
  $('#favClose').addEventListener('click', closeFavSheet);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFavSheet(); });

  favList.addEventListener('click', e => {
    const btn = e.target.closest('[data-unfav]');
    if (!btn) return;
    let favs = getFavs().filter(f => f !== btn.dataset.unfav);
    setFavs(favs);
    updateFavUI();
    renderMenu();
  });

  $('#favReserve').addEventListener('click', () => { closeFavSheet(); });

  updateFavUI();

  /* ======================================================================
     GALLERY + LIGHTBOX
     ====================================================================== */
  const galleryGrid = $('#galleryGrid');
  galleryGrid.innerHTML = YRAL_GALLERY.map((g, i) => `
    <button type="button" class="gallery-item${g.big ? ' g-big' : ''}${g.wide ? ' g-wide' : ''}" data-index="${i}" aria-label="View ${g.cap} larger">
      <img src="${g.img}" alt="${g.cap}" loading="lazy">
      <span class="g-cap">${g.cap}</span>
    </button>
  `).join('');
  observeReveals();

  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCap = $('#lightboxCap');
  let lbIndex = 0;

  function openLightbox(i){
    lbIndex = i;
    updateLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function updateLightbox(){
    const g = YRAL_GALLERY[lbIndex];
    lightboxImg.src = g.img;
    lightboxImg.alt = g.cap;
    lightboxCap.textContent = g.cap;
  }
  function closeLightbox(){
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
  galleryGrid.addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    openLightbox(Number(item.dataset.index));
  });
  $$('[data-close-lightbox]').forEach(el => el.addEventListener('click', closeLightbox));
  $('#lbPrev').addEventListener('click', () => { lbIndex = (lbIndex - 1 + YRAL_GALLERY.length) % YRAL_GALLERY.length; updateLightbox(); });
  $('#lbNext').addEventListener('click', () => { lbIndex = (lbIndex + 1) % YRAL_GALLERY.length; updateLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') $('#lbPrev').click();
    if (e.key === 'ArrowRight') $('#lbNext').click();
  });

  /* ======================================================================
     OPENING HOURS TABLE
     ====================================================================== */
  (function hours(){
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayIdx = new Date().getDay();
    const tbody = $('#hoursTable tbody');
    tbody.innerHTML = days.map((d,i) => `
      <tr class="${i===todayIdx ? 'today' : ''}">
        <td>${d}${i===todayIdx ? ' (Today)' : ''}</td>
        <td>8:00 AM – 11:00 PM</td>
      </tr>
    `).join('');
  })();

  /* ======================================================================
     RESERVATION FORM — validation + fake submit states
     ====================================================================== */
  const form = $('#reserveForm');
  const submitBtn = $('#reserveSubmit');
  const formStatus = $('#formStatus');

  const validators = {
    rname: v => v.trim().length >= 2,
    rphone: v => /^[6-9]\d{9}$/.test(v.trim()),
    remail: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    rguests: v => v !== '',
    rdate: v => {
      if (!v) return false;
      const chosen = new Date(v + 'T00:00:00');
      const today = new Date(); today.setHours(0,0,0,0);
      return chosen >= today;
    },
    rtime: v => v !== ''
  };

  function validateField(input){
    const wrap = input.closest('.form-field');
    const ok = validators[input.id] ? validators[input.id](input.value) : true;
    wrap.classList.toggle('invalid', !ok);
    return ok;
  }

  Object.keys(validators).forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('blur', () => validateField(input));
    if (input) input.addEventListener('input', () => { if (input.closest('.form-field').classList.contains('invalid')) validateField(input); });
  });

  // set min date = today
  const dateInput = $('#rdate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', e => {
    e.preventDefault();
    let allValid = true;
    Object.keys(validators).forEach(id => {
      const input = document.getElementById(id);
      if (input && !validateField(input)) allValid = false;
    });

    formStatus.classList.remove('show','success','error');

    if (!allValid){
      formStatus.classList.add('show','error');
      formStatus.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><span>Please fix the highlighted fields before submitting.</span>`;
      const firstInvalid = form.querySelector('.form-field.invalid input, .form-field.invalid select');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      formStatus.classList.add('show','success');
      const name = $('#rname').value.trim().split(' ')[0];
      formStatus.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg><span>Thanks ${name}! Your table request for ${$('#rguests').value} guest(s) on ${$('#rdate').value} at ${$('#rtime').value} has been received. We'll confirm shortly.</span>`;
      toast('Reservation request sent!');
      form.reset();
    }, 1400);
  });

  /* ---------------- Year ---------------- */
  $('#year').textContent = new Date().getFullYear();





  /* ---------------- Register service worker (PWA) ---------------- */
  if ('serviceWorker' in navigator){
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

})();
