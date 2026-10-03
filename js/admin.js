/* ==========================================================================
   YRAL Cafe — Admin Dashboard logic
   Manages: Bookings, Tables, Menu, Gallery, Customers (derived), Settings.
   Data source: RESTful Table API (tables/{table}) — see js/table-api.js.

   SECURITY NOTE: the "Staff PIN" gate below is a client-side UX convenience
   only. It does NOT protect this page from anyone who has the URL — the
   HTML/JS is fully visible in browser dev tools regardless of the PIN.
   Real protection requires the platform's Hosted route-level access control
   (Plus plan or higher). See README.md for details.
   ========================================================================== */
(function(){
  "use strict";
  const $ = (s,c) => (c||document).querySelector(s);
  const $$ = (s,c) => Array.from((c||document).querySelectorAll(s));
  const STAFF_PIN = '1234'; // demo only — change here, or replace with real auth

  function toast(msg, isError){
    const region = $('#toastRegion');
    const el = document.createElement('div');
    el.className = 'toast';
    const icon = isError ? '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>' : '<path d="M20 6 9 17l-5-5"/>';
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${icon}</svg><span>${msg}</span>`;
    region.appendChild(el);
    setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),400); }, 3600);
  }

  /* ---------------- Staff gate ---------------- */
  const staffGate = $('#staffGate');
  const adminShell = $('#adminShell');
  function unlock(){
    staffGate.style.display = 'none';
    adminShell.style.display = 'flex';
    sessionStorage.setItem('yral-staff-ok', '1');
    boot();
  }
  $('#staffGateSubmit').addEventListener('click', () => {
    const val = $('#staffPin').value.trim();
    if (val === STAFF_PIN) unlock();
    else $('#fld-pin').classList.add('invalid');
  });
  $('#staffPin').addEventListener('keydown', e => { if (e.key === 'Enter') $('#staffGateSubmit').click(); });
  if (sessionStorage.getItem('yral-staff-ok') === '1') unlock();

  $('#signOutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('yral-staff-ok');
    location.reload();
  });

  /* ---------------- Theme ---------------- */
  const themeSwitch = $('#themeSwitch');
  let currentTheme = localStorage.getItem('yral-theme') || 'dark';
  document.body.setAttribute('data-theme', currentTheme);
  themeSwitch.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('yral-theme', currentTheme);
    if (window.__bookingsChart) renderChart(); // recolor
  });

  /* ---------------- Sidebar nav + mobile drawer ---------------- */
  const sidebar = $('#adminSidebar');
  const sidebarBackdrop = $('#sidebarBackdrop');
  $('#sidebarToggle').addEventListener('click', () => { sidebar.classList.add('open'); sidebarBackdrop.classList.add('open'); });
  sidebarBackdrop.addEventListener('click', () => { sidebar.classList.remove('open'); sidebarBackdrop.classList.remove('open'); });

  const viewTitles = {
    overview: ['Overview', "Today's snapshot across bookings and tables"],
    bookings: ['Bookings', 'Manage reservations, status and payments'],
    tables: ['Tables', 'Configure tables, capacity and availability'],
    menu: ['Menu', 'Manage dishes, pricing and categories'],
    gallery: ['Gallery', 'Manage photos shown on the website'],
    customers: ['Customers', 'Contact and booking history'],
    settings: ['Cafe Settings', 'Update cafe info, hours and integrations']
  };

  function showView(name){
    $$('.admin-nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    $$('.admin-view').forEach(v => v.classList.toggle('active', v.dataset.viewPanel === name));
    $('#viewTitle').textContent = viewTitles[name][0];
    $('#viewSub').textContent = viewTitles[name][1];
    sidebar.classList.remove('open'); sidebarBackdrop.classList.remove('open');
    if (name === 'overview') renderChart();
  }
  $$('.admin-nav button[data-view]').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
  $$('[data-view-link]').forEach(b => b.addEventListener('click', () => showView(b.dataset.viewLink)));

  /* ---------------- Modal helpers ---------------- */
  function openModal(id){
    $('#'+id+'Backdrop').classList.add('open');
    $('#'+id).classList.add('open');
  }
  function closeModal(id){
    $('#'+id+'Backdrop').classList.remove('open');
    $('#'+id).classList.remove('open');
  }
  $$('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.closeModal)));
  $$('.modal-backdrop').forEach(bd => bd.addEventListener('click', () => {
    const id = bd.id.replace('Backdrop','');
    closeModal(id);
  }));

  let confirmYesHandler = null;
  function askConfirm(text, onYes){
    $('#confirmModalText').textContent = text;
    confirmYesHandler = onYes;
    openModal('confirmModal');
  }
  $('#confirmModalYes').addEventListener('click', () => {
    if (confirmYesHandler) confirmYesHandler();
    closeModal('confirmModal');
  });

  /* ======================================================================
     GLOBAL DATA STORE
     ====================================================================== */
  const DB = { bookings: [], tables: [], menu: [], gallery: [], settings: [] };

  async function loadAll(){
    try {
      const [bookings, tables, menu, gallery, settings] = await Promise.all([
        TableAPI.listAll('bookings'),
        TableAPI.listAll('restaurant_tables'),
        TableAPI.listAll('menu_items'),
        TableAPI.listAll('gallery_items'),
        TableAPI.listAll('cafe_settings')
      ]);
      DB.bookings = bookings.sort((a,b) => (b.created_at||0) - (a.created_at||0));
      DB.tables = tables.sort((a,b) => (a.table_number||0) - (b.table_number||0));
      DB.menu = menu.sort((a,b) => (a.sort_order||0) - (b.sort_order||0));
      DB.gallery = gallery.sort((a,b) => (a.sort_order||0) - (b.sort_order||0));
      DB.settings = settings;
    } catch(e){
      console.error('Failed to load admin data', e);
      toast('Could not load live data from the Table API — check your connection.', true);
    }
  }

  async function boot(){
    await loadAll();
    renderOverview();
    renderBookingsTable();
    renderTables();
    renderMenuAdmin();
    renderGalleryAdmin();
    renderCustomers();
    renderSettingsForm();
  }

  /* ======================================================================
     OVERVIEW
     ====================================================================== */
  function renderOverview(){
    const todayStr = new Date().toISOString().split('T')[0];
    const activeBookings = DB.bookings.filter(b => ['pending_payment','confirmed','modified'].includes(b.status));
    const todaysBookings = activeBookings.filter(b => b.booking_date === todayStr);
    const totalGuestsToday = todaysBookings.reduce((s,b) => s + Number(b.guests||0), 0);
    const enabledTables = DB.tables.filter(t => t.status === 'enabled');
    const totalSeats = enabledTables.reduce((s,t) => s + Number(t.capacity||0), 0);
    const revenueThisWeek = DB.bookings.filter(b => b.payment_status === 'paid').reduce((s,b) => s + Number(b.payment_amount||0), 0);

    $('#navBadgeBookings').textContent = activeBookings.length;

    const kpis = [
      { label:"Today's Bookings", value: todaysBookings.length, icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>' , trend: null},
      { label:"Guests Expected Today", value: totalGuestsToday, icon:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>', trend:null },
      { label:"Active Tables", value: `${enabledTables.length}/${DB.tables.length}`, icon:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M9 10v12"/>', trend:null },
      { label:"Total Seats", value: totalSeats, icon:'<path d="M3 11h18M5 11a7 7 0 0 1 14 0M4 11l1 8h14l1-8"/>', trend:null },
      { label:"Confirmation Revenue", value: `₹${revenueThisWeek}`, icon:'<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>', trend:null },
    ];
    $('#kpiGrid').innerHTML = kpis.map(k => `
      <div class="kpi-card">
        <div class="kpi-top"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${k.icon}</svg></span></div>
        <b>${k.value}</b><span>${k.label}</span>
      </div>
    `).join('');

    // recent bookings (5)
    const recent = DB.bookings.slice(0, 5);
    $('#recentBookingsTable tbody').innerHTML = recent.length ? recent.map(rowToRecentHtml).join('') : emptyRow(6, 'No bookings yet');
    renderChart();
  }

  function rowToRecentHtml(b){
    return `<tr>
      <td>${b.booking_ref||'—'}</td>
      <td>${b.customer_name||'—'}</td>
      <td>${formatDateShort(b.booking_date)} · ${b.booking_time||''}</td>
      <td>${b.guests||0}</td>
      <td>${b.table_labels||'—'}</td>
      <td>${statusPill(b.status)}</td>
    </tr>`;
  }

  function emptyRow(colspan, text){
    return `<tr><td colspan="${colspan}"><div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><p>${text}</p></div></td></tr>`;
  }

  function statusPill(status){
    return `<span class="status-pill ${status}">${(status||'').replace(/_/g,' ')}</span>`;
  }
  function formatDateShort(iso){
    if (!iso) return '—';
    const d = new Date(iso+'T00:00:00');
    return d.toLocaleDateString('en-IN',{ day:'numeric', month:'short' });
  }

  function renderChart(){
    if (typeof Chart === 'undefined') { setTimeout(renderChart, 300); return; }
    const canvas = $('#bookingsChart');
    if (!canvas) return;
    const days = [];
    const counts = [];
    for (let i=0;i<7;i++){
      const d = new Date(); d.setDate(d.getDate()+i);
      const iso = d.toISOString().split('T')[0];
      days.push(d.toLocaleDateString('en-IN',{weekday:'short'}));
      counts.push(DB.bookings.filter(b => b.booking_date === iso && ['pending_payment','confirmed','modified'].includes(b.status)).length);
    }
    const isLight = document.body.getAttribute('data-theme') === 'light';
    const gridColor = isLight ? 'rgba(20,15,5,0.08)' : 'rgba(255,255,255,0.08)';
    const textColor = isLight ? '#1c1710' : '#f6f1e7';
    if (window.__bookingsChart) window.__bookingsChart.destroy();
    window.__bookingsChart = new Chart(canvas, {
      type: 'bar',
      data: { labels: days, datasets: [{ label:'Bookings', data: counts, backgroundColor:'#ff7a3d', borderRadius:8, maxBarThickness:42 }] },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false} },
        scales:{
          x:{ ticks:{color:textColor}, grid:{color:'transparent'} },
          y:{ beginAtZero:true, ticks:{color:textColor, precision:0}, grid:{color:gridColor} }
        }
      }
    });
  }

  /* ======================================================================
     BOOKINGS
     ====================================================================== */
  let bookingsPage = 1;
  const BOOKINGS_PAGE_SIZE = 8;
  let bookingFilters = { search:'', status:'all', date:'' };

  function filteredBookings(){
    return DB.bookings.filter(b => {
      if (bookingFilters.status !== 'all' && b.status !== bookingFilters.status) return false;
      if (bookingFilters.date && b.booking_date !== bookingFilters.date) return false;
      if (bookingFilters.search){
        const q = bookingFilters.search.toLowerCase();
        const hay = `${b.customer_name||''} ${b.customer_phone||''} ${b.customer_email||''} ${b.booking_ref||''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderBookingsTable(){
    const all = filteredBookings();
    const totalPages = Math.max(1, Math.ceil(all.length / BOOKINGS_PAGE_SIZE));
    bookingsPage = Math.min(bookingsPage, totalPages);
    const pageItems = all.slice((bookingsPage-1)*BOOKINGS_PAGE_SIZE, bookingsPage*BOOKINGS_PAGE_SIZE);

    $('#bookingsTable tbody').innerHTML = pageItems.length ? pageItems.map(b => `
      <tr>
        <td>${b.booking_ref||'—'}</td>
        <td>${b.customer_name||'—'}</td>
        <td>${b.customer_phone||b.customer_email||'—'}</td>
        <td>${formatDateShort(b.booking_date)} · ${b.booking_time||''}</td>
        <td>${b.guests||0}</td>
        <td>${b.table_labels||'—'}</td>
        <td>${statusPill(b.status)}</td>
        <td>${statusPill(b.payment_status)}</td>
        <td>
          <div class="row-actions">
            <button data-action="view" data-id="${b.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>View</button>
            <button class="primary" data-action="confirm" data-id="${b.id}">Confirm</button>
            <button class="danger" data-action="cancel" data-id="${b.id}">Cancel</button>
          </div>
        </td>
      </tr>
    `).join('') : emptyRow(9, 'No bookings match these filters');

    $('#bookingsCount').textContent = `${all.length} booking${all.length===1?'':'s'}`;
    $('#bookingsPageLabel').textContent = `Page ${bookingsPage} of ${totalPages}`;
    $('#bookingsPrev').disabled = bookingsPage <= 1;
    $('#bookingsNext').disabled = bookingsPage >= totalPages;
  }

  $('#bookingSearch').addEventListener('input', e => { bookingFilters.search = e.target.value; bookingsPage = 1; renderBookingsTable(); });
  $('#bookingStatusFilter').addEventListener('change', e => { bookingFilters.status = e.target.value; bookingsPage = 1; renderBookingsTable(); });
  $('#bookingDateFilter').addEventListener('change', e => { bookingFilters.date = e.target.value; bookingsPage = 1; renderBookingsTable(); });
  $('#clearBookingFilters').addEventListener('click', () => {
    bookingFilters = { search:'', status:'all', date:'' };
    $('#bookingSearch').value = ''; $('#bookingStatusFilter').value='all'; $('#bookingDateFilter').value='';
    bookingsPage = 1; renderBookingsTable();
  });
  $('#bookingsPrev').addEventListener('click', () => { bookingsPage--; renderBookingsTable(); });
  $('#bookingsNext').addEventListener('click', () => { bookingsPage++; renderBookingsTable(); });

  $('#bookingsTable').addEventListener('click', e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const booking = DB.bookings.find(b => b.id === id);
    if (!booking) return;
    if (btn.dataset.action === 'view') openBookingDetail(booking);
    if (btn.dataset.action === 'confirm') updateBookingStatus(booking, 'confirmed');
    if (btn.dataset.action === 'cancel') askConfirm(`Cancel booking ${booking.booking_ref}?`, () => updateBookingStatus(booking, 'cancelled'));
  });

  async function updateBookingStatus(booking, status){
    try {
      await TableAPI.update('bookings', booking.id, { status });
      booking.status = status;
      toast(`Booking ${booking.booking_ref} marked ${status.replace(/_/g,' ')}`);
      renderBookingsTable(); renderOverview();
    } catch(e){ toast('Failed to update booking status', true); }
  }

  function openBookingDetail(b){
    $('#bookingModalTitle').textContent = `Booking ${b.booking_ref||''}`;
    $('#bookingModalBody').innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><label>Guest name</label><div>${b.customer_name||'—'}</div></div>
        <div class="detail-item"><label>Contact</label><div>${b.customer_phone||b.customer_email||'—'}</div></div>
        <div class="detail-item"><label>Date</label><div>${formatDateShort(b.booking_date)}</div></div>
        <div class="detail-item"><label>Time</label><div>${b.booking_time||'—'}</div></div>
        <div class="detail-item"><label>Guests</label><div>${b.guests||0}</div></div>
        <div class="detail-item"><label>Table(s)</label><div>${b.table_labels||'—'}</div></div>
        <div class="detail-item"><label>Payment</label><div>₹${b.payment_amount||0} · ${b.payment_status||'—'}</div></div>
        <div class="detail-item"><label>Source</label><div>${b.source||'—'}</div></div>
      </div>
      <div class="form-field"><label>Notes / special requests</label><textarea id="detailNotes">${b.notes||''}</textarea></div>
      <div class="form-field"><label>Status</label>
        <select id="detailStatus">
          ${['pending_payment','confirmed','modified','completed','cancelled','no_show'].map(s => `<option value="${s}" ${s===b.status?'selected':''}>${s.replace(/_/g,' ')}</option>`).join('')}
        </select>
      </div>
    `;
    $('#bookingModalFoot').innerHTML = `
      <button class="btn btn-glass" data-close-modal="bookingModal" type="button">Close</button>
      <button class="btn btn-primary" id="saveBookingDetail" type="button">Save Changes</button>
    `;
    $('#saveBookingDetail').addEventListener('click', async () => {
      const newStatus = $('#detailStatus').value;
      const newNotes = $('#detailNotes').value;
      try {
        await TableAPI.update('bookings', b.id, { status: newStatus, notes: newNotes });
        b.status = newStatus; b.notes = newNotes;
        toast('Booking updated');
        closeModal('bookingModal');
        renderBookingsTable(); renderOverview();
      } catch(e){ toast('Failed to save booking', true); }
    });
    openModal('bookingModal');
  }

  $('#addBookingBtn').addEventListener('click', () => {
    $('#bookingModalTitle').textContent = 'New Manual Booking';
    $('#bookingModalBody').innerHTML = `
      <div class="form-row-2">
        <div class="form-field"><label>Guest name</label><input id="nb-name"></div>
        <div class="form-field"><label>Phone</label><input id="nb-phone"></div>
      </div>
      <div class="form-row-2">
        <div class="form-field"><label>Date</label><input type="date" id="nb-date" value="${new Date().toISOString().split('T')[0]}"></div>
        <div class="form-field"><label>Time slot</label>
          <select id="nb-time">${BookingLogic.TIME_SLOTS.map(t=>`<option>${t}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-field"><label>Guests</label><input type="number" id="nb-guests" min="1" max="20" value="2"></div>
        <div class="form-field"><label>Table</label>
          <select id="nb-table">${DB.tables.filter(t=>t.status==='enabled').map(t=>`<option value="${t.id}" data-label="${t.label}">${t.label} (${t.capacity} seats)</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-field"><label>Notes</label><textarea id="nb-notes"></textarea></div>
    `;
    $('#bookingModalFoot').innerHTML = `
      <button class="btn btn-glass" data-close-modal="bookingModal" type="button">Cancel</button>
      <button class="btn btn-primary" id="saveNewBooking" type="button">Create Booking</button>
    `;
    $('#saveNewBooking').addEventListener('click', async () => {
      const name = $('#nb-name').value.trim();
      if (!name){ toast('Guest name is required', true); return; }
      const tableSel = $('#nb-table');
      const selectedOpt = tableSel.options[tableSel.selectedIndex];
      const payload = {
        booking_ref: BookingLogic.generateBookingRef($('#nb-date').value),
        customer_name: name,
        customer_phone: $('#nb-phone').value.trim(),
        customer_email: '',
        booking_date: $('#nb-date').value,
        booking_time: $('#nb-time').value,
        guests: Number($('#nb-guests').value)||1,
        table_ids: tableSel.value,
        table_labels: selectedOpt ? selectedOpt.dataset.label : '',
        status: 'confirmed',
        payment_status: 'not_required',
        payment_amount: 0,
        payment_ref: '',
        notes: $('#nb-notes').value.trim(),
        source: 'admin'
      };
      try {
        const created = await TableAPI.create('bookings', payload);
        DB.bookings.unshift(created);
        toast('Manual booking created');
        closeModal('bookingModal');
        renderBookingsTable(); renderOverview(); renderCustomers();
      } catch(e){ toast('Failed to create booking', true); }
    });
    openModal('bookingModal');
  });

  /* ======================================================================
     TABLES
     ====================================================================== */
  function renderTables(){
    const enabled = DB.tables.filter(t => t.status === 'enabled');
    const seats = enabled.reduce((s,t) => s + Number(t.capacity||0), 0);
    $('#tableCapacitySummary').textContent = `${DB.tables.length} tables · ${enabled.length} enabled · ${seats} seats available`;

    $('#tablesGrid').innerHTML = DB.tables.length ? DB.tables.map(t => `
      <div class="admin-item-card">
        <div class="table-card-head">
          <span class="table-card-num">${t.table_number}</span>
          <div class="info"><b>${t.label}</b><span>${t.location||'—'}</span></div>
        </div>
        <div class="body">
          <div class="meta">Capacity: <strong style="color:var(--text);">${t.capacity} seats</strong></div>
          ${t.notes ? `<div class="meta">${t.notes}</div>` : ''}
        </div>
        <div class="foot">
          <label class="toggle-switch">
            <input type="checkbox" data-toggle-table="${t.id}" ${t.status==='enabled'?'checked':''}>
            <span class="track"></span><span class="thumb"></span>
          </label>
          <div class="row-actions">
            <button data-edit-table="${t.id}">Edit</button>
            <button class="danger" data-delete-table="${t.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('') : `<div class="empty-state" style="grid-column:1/-1;">No tables configured yet.</div>`;
  }

  $('#tablesGrid').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-table]');
    const delBtn = e.target.closest('[data-delete-table]');
    if (editBtn) openTableModal(DB.tables.find(t => t.id === editBtn.dataset.editTable));
    if (delBtn){
      const t = DB.tables.find(x => x.id === delBtn.dataset.deleteTable);
      askConfirm(`Delete ${t.label}? This cannot be undone.`, async () => {
        try {
          await TableAPI.remove('restaurant_tables', t.id);
          DB.tables = DB.tables.filter(x => x.id !== t.id);
          toast('Table deleted');
          renderTables();
        } catch(err){ toast('Failed to delete table', true); }
      });
    }
  });
  $('#tablesGrid').addEventListener('change', async e => {
    const toggle = e.target.closest('[data-toggle-table]');
    if (!toggle) return;
    const t = DB.tables.find(x => x.id === toggle.dataset.toggleTable);
    const newStatus = toggle.checked ? 'enabled' : 'disabled';
    try {
      await TableAPI.update('restaurant_tables', t.id, { status: newStatus });
      t.status = newStatus;
      toast(`${t.label} ${newStatus}`);
      renderTables();
    } catch(err){ toast('Failed to update table status', true); toggle.checked = !toggle.checked; }
  });

  function openTableModal(table){
    const isEdit = !!table;
    $('#tableModalTitle').textContent = isEdit ? 'Edit Table' : 'Add Table';
    $('#tf-id').value = table ? table.id : '';
    $('#tf-number').value = table ? table.table_number : (Math.max(0, ...DB.tables.map(t=>t.table_number||0)) + 1);
    $('#tf-capacity').value = table ? table.capacity : 6;
    $('#tf-label').value = table ? table.label : '';
    $('#tf-location').value = table ? (table.location||'') : '';
    $('#tf-notes').value = table ? (table.notes||'') : '';
    $('#tf-status').checked = table ? table.status === 'enabled' : true;
    $('#tf-status-label').textContent = $('#tf-status').checked ? 'Enabled' : 'Disabled';
    openModal('tableModal');
  }
  $('#addTableBtn').addEventListener('click', () => openTableModal(null));
  $('#tf-status').addEventListener('change', e => { $('#tf-status-label').textContent = e.target.checked ? 'Enabled' : 'Disabled'; });

  $('#tableFormSave').addEventListener('click', async () => {
    const id = $('#tf-id').value;
    const payload = {
      table_number: Number($('#tf-number').value)||0,
      capacity: Number($('#tf-capacity').value)||6,
      label: $('#tf-label').value.trim(),
      location: $('#tf-location').value.trim(),
      notes: $('#tf-notes').value.trim(),
      status: $('#tf-status').checked ? 'enabled' : 'disabled'
    };
    if (!payload.label){ toast('Table label is required', true); return; }
    try {
      if (id){
        await TableAPI.update('restaurant_tables', id, payload);
        Object.assign(DB.tables.find(t=>t.id===id), payload);
        toast('Table updated');
      } else {
        payload.id = 't' + Date.now();
        const created = await TableAPI.create('restaurant_tables', payload);
        DB.tables.push(created);
        toast('Table added');
      }
      DB.tables.sort((a,b)=>(a.table_number||0)-(b.table_number||0));
      closeModal('tableModal');
      renderTables();
    } catch(e){ toast('Failed to save table', true); }
  });

  /* ======================================================================
     MENU
     ====================================================================== */
  let menuFilters = { search:'', category:'all', status:'all' };

  function refreshMenuCategoryOptions(){
    const cats = Array.from(new Set(DB.menu.map(m => m.category))).sort();
    const sel = $('#menuCategoryFilter');
    const current = sel.value;
    sel.innerHTML = `<option value="all">All categories</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');
    sel.value = cats.includes(current) ? current : 'all';
  }

  function renderMenuAdmin(){
    refreshMenuCategoryOptions();
    const items = DB.menu.filter(m => {
      if (menuFilters.category !== 'all' && m.category !== menuFilters.category) return false;
      if (menuFilters.status !== 'all' && m.status !== menuFilters.status) return false;
      if (menuFilters.search && !m.name.toLowerCase().includes(menuFilters.search.toLowerCase())) return false;
      return true;
    });
    $('#menuGridAdmin').innerHTML = items.length ? items.map(m => `
      <div class="admin-item-card">
        <div class="thumb"><img src="${m.image}" alt="${m.name}" loading="lazy"></div>
        <div class="body">
          <h4>${m.name}</h4>
          <div class="meta">${m.category} · ₹${m.price}</div>
          ${statusPill(m.diet)} ${statusPill(m.status)}
        </div>
        <div class="foot">
          <div class="row-actions">
            <button data-edit-menu="${m.id}">Edit</button>
            <button class="danger" data-delete-menu="${m.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('') : `<div class="empty-state" style="grid-column:1/-1;">No dishes match these filters.</div>`;
  }
  $('#menuAdminSearch').addEventListener('input', e => { menuFilters.search = e.target.value; renderMenuAdmin(); });
  $('#menuCategoryFilter').addEventListener('change', e => { menuFilters.category = e.target.value; renderMenuAdmin(); });
  $('#menuStatusFilter').addEventListener('change', e => { menuFilters.status = e.target.value; renderMenuAdmin(); });

  $('#menuGridAdmin').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-menu]');
    const delBtn = e.target.closest('[data-delete-menu]');
    if (editBtn) openMenuModal(DB.menu.find(m => m.id === editBtn.dataset.editMenu));
    if (delBtn){
      const m = DB.menu.find(x => x.id === delBtn.dataset.deleteMenu);
      askConfirm(`Delete "${m.name}" from the menu?`, async () => {
        try {
          await TableAPI.remove('menu_items', m.id);
          DB.menu = DB.menu.filter(x => x.id !== m.id);
          toast('Dish deleted');
          renderMenuAdmin();
        } catch(err){ toast('Failed to delete dish', true); }
      });
    }
  });

  function openMenuModal(item){
    $('#menuModalTitle').textContent = item ? 'Edit Dish' : 'Add Dish';
    $('#mf-id').value = item ? item.id : '';
    $('#mf-name').value = item ? item.name : '';
    $('#mf-category').value = item ? item.category : '';
    $('#mf-price').value = item ? item.price : '';
    $('#mf-diet').value = item ? item.diet : 'veg';
    $('#mf-status').value = item ? item.status : 'active';
    $('#mf-image').value = item ? item.image : '';
    $('#mf-description').value = item ? item.description : '';
    openModal('menuModal');
  }
  $('#addMenuBtn').addEventListener('click', () => openMenuModal(null));
  $('#menuFormSave').addEventListener('click', async () => {
    const id = $('#mf-id').value;
    const payload = {
      name: $('#mf-name').value.trim(),
      category: $('#mf-category').value.trim(),
      price: Number($('#mf-price').value)||0,
      diet: $('#mf-diet').value,
      status: $('#mf-status').value,
      image: $('#mf-image').value.trim() || 'images/yral-menu-poster.jpg',
      description: $('#mf-description').value.trim()
    };
    if (!payload.name || !payload.category){ toast('Name and category are required', true); return; }
    try {
      if (id){
        await TableAPI.update('menu_items', id, payload);
        Object.assign(DB.menu.find(m=>m.id===id), payload);
        toast('Dish updated');
      } else {
        payload.id = 'm' + Date.now();
        payload.sort_order = DB.menu.length + 1;
        const created = await TableAPI.create('menu_items', payload);
        DB.menu.push(created);
        toast('Dish added');
      }
      closeModal('menuModal');
      renderMenuAdmin();
    } catch(e){ toast('Failed to save dish', true); }
  });

  /* ======================================================================
     GALLERY
     ====================================================================== */
  function renderGalleryAdmin(){
    $('#galleryGridAdmin').innerHTML = DB.gallery.length ? DB.gallery.map(g => `
      <div class="admin-item-card">
        <div class="thumb"><img src="${g.image}" alt="${g.caption}" loading="lazy"></div>
        <div class="body">
          <h4>${g.caption}</h4>
          <div class="meta">Tile: ${g.size}</div>
          ${statusPill(g.status)}
        </div>
        <div class="foot">
          <div class="row-actions">
            <button data-edit-gallery="${g.id}">Edit</button>
            <button class="danger" data-delete-gallery="${g.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join('') : `<div class="empty-state" style="grid-column:1/-1;">No gallery images yet.</div>`;
  }
  $('#galleryGridAdmin').addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-gallery]');
    const delBtn = e.target.closest('[data-delete-gallery]');
    if (editBtn) openGalleryModal(DB.gallery.find(g => g.id === editBtn.dataset.editGallery));
    if (delBtn){
      const g = DB.gallery.find(x => x.id === delBtn.dataset.deleteGallery);
      askConfirm(`Delete "${g.caption}" from the gallery?`, async () => {
        try {
          await TableAPI.remove('gallery_items', g.id);
          DB.gallery = DB.gallery.filter(x => x.id !== g.id);
          toast('Image deleted');
          renderGalleryAdmin();
        } catch(err){ toast('Failed to delete image', true); }
      });
    }
  });
  function openGalleryModal(item){
    $('#galleryModalTitle').textContent = item ? 'Edit Image' : 'Add Image';
    $('#gf-id').value = item ? item.id : '';
    $('#gf-caption').value = item ? item.caption : '';
    $('#gf-image').value = item ? item.image : '';
    $('#gf-size').value = item ? item.size : 'normal';
    $('#gf-status').value = item ? item.status : 'active';
    openModal('galleryModal');
  }
  $('#addGalleryBtn').addEventListener('click', () => openGalleryModal(null));
  $('#galleryFormSave').addEventListener('click', async () => {
    const id = $('#gf-id').value;
    const payload = {
      caption: $('#gf-caption').value.trim(),
      image: $('#gf-image').value.trim(),
      size: $('#gf-size').value,
      status: $('#gf-status').value
    };
    if (!payload.caption || !payload.image){ toast('Caption and image path are required', true); return; }
    try {
      if (id){
        await TableAPI.update('gallery_items', id, payload);
        Object.assign(DB.gallery.find(g=>g.id===id), payload);
        toast('Image updated');
      } else {
        payload.id = 'g' + Date.now();
        payload.sort_order = DB.gallery.length + 1;
        const created = await TableAPI.create('gallery_items', payload);
        DB.gallery.push(created);
        toast('Image added');
      }
      closeModal('galleryModal');
      renderGalleryAdmin();
    } catch(e){ toast('Failed to save image', true); }
  });

  /* ======================================================================
     CUSTOMERS (derived from bookings)
     ====================================================================== */
  let customerSearch = '';
  function deriveCustomers(){
    const map = new Map();
    DB.bookings.forEach(b => {
      const key = (b.customer_phone || b.customer_email || b.customer_name || 'unknown').toLowerCase();
      if (!map.has(key)){
        map.set(key, { name: b.customer_name, phone: b.customer_phone, email: b.customer_email, bookings: 0, lastDate: b.booking_date });
      }
      const c = map.get(key);
      c.bookings++;
      if (!c.lastDate || new Date(b.booking_date) > new Date(c.lastDate)) c.lastDate = b.booking_date;
    });
    return Array.from(map.values());
  }
  function renderCustomers(){
    let customers = deriveCustomers();
    if (customerSearch){
      const q = customerSearch.toLowerCase();
      customers = customers.filter(c => `${c.name||''} ${c.phone||''} ${c.email||''}`.toLowerCase().includes(q));
    }
    $('#customersTable tbody').innerHTML = customers.length ? customers.map(c => `
      <tr>
        <td>${c.name||'—'}</td>
        <td>${c.phone||c.email||'—'}</td>
        <td>${c.bookings}</td>
        <td>${formatDateShort(c.lastDate)}</td>
        <td><div class="row-actions"><button data-history="${c.phone||c.email||c.name}">View History</button></div></td>
      </tr>
    `).join('') : emptyRow(5, 'No customers yet — they appear automatically once bookings come in.');
  }
  $('#customerSearch').addEventListener('input', e => { customerSearch = e.target.value; renderCustomers(); });
  $('#customersTable').addEventListener('click', e => {
    const btn = e.target.closest('[data-history]');
    if (!btn) return;
    const key = btn.dataset.history;
    const history = DB.bookings.filter(b => [b.customer_phone,b.customer_email,b.customer_name].includes(key));
    $('#bookingModalTitle').textContent = `Booking history — ${key}`;
    $('#bookingModalBody').innerHTML = history.length ? `
      <div class="data-table-wrap">
        <table class="data-table">
          <thead><tr><th>Ref</th><th>Date</th><th>Guests</th><th>Table</th><th>Status</th></tr></thead>
          <tbody>${history.map(b => `<tr><td>${b.booking_ref}</td><td>${formatDateShort(b.booking_date)}</td><td>${b.guests}</td><td>${b.table_labels||'—'}</td><td>${statusPill(b.status)}</td></tr>`).join('')}</tbody>
        </table>
      </div>` : `<p style="color:var(--text-dim);">No history found.</p>`;
    $('#bookingModalFoot').innerHTML = `<button class="btn btn-glass" data-close-modal="bookingModal" type="button">Close</button>`;
    $$('[data-close-modal]', $('#bookingModalFoot')).forEach(b => b.addEventListener('click', () => closeModal('bookingModal')));
    openModal('bookingModal');
  });

  /* ======================================================================
     SETTINGS
     ====================================================================== */
  function renderSettingsForm(){
    $$('[data-setting-key]').forEach(input => {
      const setting = DB.settings.find(s => s.key === input.dataset.settingKey);
      if (setting) input.value = setting.value;
    });
  }
  $('#settingsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const status = $('#settingsStatus');
    status.classList.remove('show','success','error');
    try {
      const updates = $$('[data-setting-key]').map(async input => {
        const key = input.dataset.settingKey;
        const existing = DB.settings.find(s => s.key === key);
        if (existing){
          await TableAPI.update('cafe_settings', existing.id, { value: input.value });
          existing.value = input.value;
        } else {
          const created = await TableAPI.create('cafe_settings', { id:'s'+Date.now()+key, key, value: input.value });
          DB.settings.push(created);
        }
      });
      await Promise.all(updates);
      status.classList.add('show','success');
      status.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg><span>Settings saved. Changes reflect on the live site's next data fetch.</span>`;
      toast('Cafe settings saved');
    } catch(err){
      status.classList.add('show','error');
      status.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><span>Failed to save some settings. Please try again.</span>`;
    }
  });

})();
