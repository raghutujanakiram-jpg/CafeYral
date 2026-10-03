/* ==========================================================================
   YRAL Cafe — Booking Engine (customer journey)
   Login (demo OTP / demo Google) → Date & Guests → Availability →
   Summary → Razorpay Payment → Confirmation.

   IMPORTANT — read before going live:
   - OTP delivery here is SIMULATED (no real SMS is sent). A production
     launch needs a backend endpoint + SMS provider (Twilio/MSG91/etc).
   - Google login uses Google Identity Services; set GOOGLE_CLIENT_ID below
     once you've created an OAuth Client ID in Google Cloud Console
     (no charge for basic sign-in, but Google requires a verified app for
     production use). A "demo" fallback button simulates it either way.
   - Razorpay Checkout.js below runs fully client-side with a TEST key.
     For real payment capture you need a backend to create an "order" and
     verify the payment signature — client-only checkout is fine for demos
     but should not be trusted for final settlement without that backend.
   ========================================================================== */
(function(){
  "use strict";
  const $ = (s, c) => (c||document).querySelector(s);
  const $$ = (s, c) => Array.from((c||document).querySelectorAll(s));

  // ---- Config placeholders (replace before going live) ----
  const RAZORPAY_KEY_ID = 'rzp_test_1DP5mmOlF5G5ag'; // Razorpay's public demo key — replace with your live/test Key ID
  const GOOGLE_CLIENT_ID = 'REPLACE_WITH_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  const CONFIRMATION_FEE = 79; // ₹ — configurable in admin > Cafe Settings

  function toast(msg, isError){
    const region = $('#toastRegion');
    const el = document.createElement('div');
    el.className = 'toast';
    const icon = isError ? '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>' : '<path d="M20 6 9 17l-5-5"/>';
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${icon}</svg><span>${msg}</span>`;
    region.appendChild(el);
    setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),400); }, 4200);
  }

  /* ---------------- Theme (shared) ---------------- */
  const themeSwitch = $('#themeSwitch');
  let currentTheme = localStorage.getItem('yral-theme') || 'dark';
  document.body.setAttribute('data-theme', currentTheme);
  themeSwitch.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('yral-theme', currentTheme);
  });

  /* ---------------- State ---------------- */
  const state = {
    step: 1,
    customer: { name:'', phone:'', email:'', loginMethod:'' },
    date: '', time: '', guests: 2,
    allocatedTables: [],
    guestName: '', guestNotes: '',
    payment: { status:'pending', ref:'' },
    bookingRef: ''
  };

  let allTables = [];
  let allBookings = [];

  /* ---------------- Step navigation ---------------- */
  function gotoStep(n){
    state.step = n;
    $$('.step-panel').forEach(p => p.classList.toggle('active', Number(p.dataset.step) === n));
    $$('.step-pip').forEach(p => {
      const pn = Number(p.dataset.stepPip);
      p.classList.toggle('active', pn === n);
      p.classList.toggle('done', pn < n);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $$('[data-goto-step]').forEach(btn => btn.addEventListener('click', () => gotoStep(Number(btn.dataset.gotoStep))));

  /* ======================================================================
     STEP 1 — LOGIN (demo OTP + demo Google)
     ====================================================================== */
  $$('[data-login-tab]').forEach(tab => tab.addEventListener('click', () => {
    $$('[data-login-tab]').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    $$('[data-login-panel]').forEach(p => p.classList.toggle('active', p.dataset.loginPanel === tab.dataset.loginTab));
  }));

  let demoOtp = '';
  let resendCountdown;

  const mobileInput = $('#mobileInput');
  const sendOtpBtn = $('#sendOtpBtn');
  const otpStage = $('#otpStage');
  const otpInputs = $$('#otpInputs input');
  const otpPhoneEcho = $('#otpPhoneEcho');
  const otpError = $('#otpError');
  const resendBtn = $('#resendBtn');
  const resendTimer = $('#resendTimer');
  const verifyOtpBtn = $('#verifyOtpBtn');

  sendOtpBtn.addEventListener('click', () => {
    const phone = mobileInput.value.trim();
    const wrap = $('#fld-mobile');
    if (!/^[6-9]\d{9}$/.test(phone)){
      wrap.classList.add('invalid');
      return;
    }
    wrap.classList.remove('invalid');
    sendOtpBtn.classList.add('loading'); sendOtpBtn.disabled = true;
    setTimeout(() => {
      sendOtpBtn.classList.remove('loading'); sendOtpBtn.disabled = false;
      demoOtp = String(Math.floor(1000 + Math.random()*9000));
      otpStage.style.display = 'block';
      otpPhoneEcho.textContent = '+91 ' + phone;
      otpInputs[0].focus();
      toast(`Demo OTP sent: ${demoOtp} (simulated — no real SMS)`, false);
      startResendCountdown();
    }, 900);
  });

  function startResendCountdown(){
    let secs = 30;
    resendBtn.disabled = true;
    clearInterval(resendCountdown);
    resendCountdown = setInterval(() => {
      secs--;
      resendTimer.textContent = `Resend code in ${secs}s`;
      if (secs <= 0){
        clearInterval(resendCountdown);
        resendTimer.textContent = "Didn't get it?";
        resendBtn.disabled = false;
      }
    }, 1000);
  }
  resendBtn.addEventListener('click', () => {
    demoOtp = String(Math.floor(1000 + Math.random()*9000));
    toast(`New demo OTP: ${demoOtp}`, false);
    startResendCountdown();
  });

  otpInputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g,'');
      if (inp.value && otpInputs[i+1]) otpInputs[i+1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && otpInputs[i-1]) otpInputs[i-1].focus();
    });
  });

  verifyOtpBtn.addEventListener('click', () => {
    const entered = otpInputs.map(i => i.value).join('');
    if (entered.length < 4){
      otpError.style.display = 'block';
      otpError.textContent = 'Please enter all 4 digits.';
      return;
    }
    verifyOtpBtn.classList.add('loading'); verifyOtpBtn.disabled = true;
    setTimeout(() => {
      verifyOtpBtn.classList.remove('loading'); verifyOtpBtn.disabled = false;
      if (entered !== demoOtp){
        otpError.style.display = 'block';
        otpError.textContent = 'Incorrect code. Please try again.';
        return;
      }
      otpError.style.display = 'none';
      state.customer = {
        name: '', phone: '+91 ' + mobileInput.value.trim(), email: '', loginMethod: 'mobile_otp'
      };
      toast('Logged in successfully!');
      gotoStep(2);
    }, 700);
  });

  // Google Identity Services (real) — falls back silently if client id is placeholder
  function initGoogleButton(){
    if (GOOGLE_CLIENT_ID.startsWith('REPLACE_WITH')) return; // not configured — demo button is the fallback
    if (!window.google || !google.accounts || !google.accounts.id) return;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        try {
          const payload = JSON.parse(atob(resp.credential.split('.')[1]));
          state.customer = { name: payload.name||'', phone:'', email: payload.email||'', loginMethod:'google' };
          toast(`Signed in as ${payload.email}`);
          gotoStep(2);
        } catch(e){ toast('Google sign-in failed to parse response', true); }
      }
    });
    google.accounts.id.renderButton($('#googleBtnMount'), { theme: 'outline', size: 'large', width: 320 });
  }
  window.addEventListener('load', () => setTimeout(initGoogleButton, 400));

  $('#googleDemoBtn').addEventListener('click', () => {
    state.customer = { name: 'Demo Guest', phone:'', email: 'demo.guest@gmail.com', loginMethod:'google' };
    toast('Signed in as demo.guest@gmail.com (simulated Google login)');
    gotoStep(2);
  });

  /* ======================================================================
     STEP 2 — DATE, TIME SLOT, GUESTS
     ====================================================================== */
  const bookDate = $('#bookDate');
  const today = new Date();
  bookDate.min = today.toISOString().split('T')[0];
  bookDate.value = today.toISOString().split('T')[0];
  state.date = bookDate.value;
  bookDate.addEventListener('change', () => { state.date = bookDate.value; $('#fld-bookdate').classList.remove('invalid'); });

  const slotGrid = $('#slotGrid');
  function renderSlots(){
    slotGrid.innerHTML = BookingLogic.TIME_SLOTS.map(t =>
      `<button type="button" class="slot-btn${state.time===t?' active':''}" data-slot="${t}">${t}</button>`
    ).join('');
  }
  renderSlots();
  slotGrid.addEventListener('click', e => {
    const btn = e.target.closest('.slot-btn');
    if (!btn || btn.disabled) return;
    state.time = btn.dataset.slot;
    $$('.slot-btn', slotGrid).forEach(b => b.classList.toggle('active', b === btn));
    $('#slotError').style.display = 'none';
  });

  const guestCount = $('#guestCount');
  const guestMinus = $('#guestMinus');
  const guestPlus = $('#guestPlus');
  const largePartyBanner = $('#largePartyBanner');
  function renderGuests(){
    guestCount.textContent = state.guests;
    guestMinus.disabled = state.guests <= 1;
    guestPlus.disabled = state.guests >= 20;
    largePartyBanner.style.display = state.guests > BookingLogic.MAX_ONLINE_PARTY ? 'flex' : 'none';
  }
  guestMinus.addEventListener('click', () => { if (state.guests>1) state.guests--; renderGuests(); });
  guestPlus.addEventListener('click', () => { if (state.guests<20) state.guests++; renderGuests(); });
  renderGuests();

  $('#toAvailabilityBtn').addEventListener('click', async () => {
    let ok = true;
    if (!state.date){ $('#fld-bookdate').classList.add('invalid'); ok = false; }
    if (!state.time){ $('#slotError').style.display='block'; ok = false; }
    if (state.guests > BookingLogic.MAX_ONLINE_PARTY){
      toast('Groups of 13+ need to call the cafe directly — see the note above.', true);
      ok = false;
    }
    if (!ok) return;
    gotoStep(3);
    await runAvailabilityCheck();
  });

  /* ======================================================================
     STEP 3 — AVAILABILITY CHECK (real logic against Table API data)
     ====================================================================== */
  async function loadTablesAndBookings(){
    try {
      [allTables, allBookings] = await Promise.all([
        TableAPI.listAll('restaurant_tables'),
        TableAPI.listAll('bookings')
      ]);
    } catch(e){
      // Fallback: static 9-table config if the Table API isn't reachable in preview
      allTables = Array.from({length:9}, (_,i) => ({
        id:'t'+(i+1), table_number:i+1, label:`Table ${i+1}`, capacity:6, status:'enabled'
      }));
      allBookings = [];
    }
  }

  async function runAvailabilityCheck(){
    $('#availLoading').style.display = 'flex';
    $('#availOk').classList.remove('show');
    $('#availFail').classList.remove('show');
    $('#step3Title').textContent = 'Checking availability…';

    await loadTablesAndBookings();
    await new Promise(r => setTimeout(r, 900)); // perceived-progress delay

    const available = BookingLogic.getAvailableTables(allTables, allBookings, state.date, state.time);
    const result = BookingLogic.allocateTables(available, state.guests);

    $('#availLoading').style.display = 'none';

    if (result.ok){
      state.allocatedTables = result.tables;
      $('#step3Title').textContent = 'Table found!';
      $('#tablePickList').innerHTML = result.tables.map(t => `
        <div class="table-chip">
          <b>${t.label}</b>
          <span>${t.capacity} seats · ${t.location || ''}</span>
        </div>
      `).join('');
      $('#availOk').classList.add('show');
    } else {
      $('#step3Title').textContent = 'No exact match';
      const msg = $('#availFailMsg');
      if (result.reason === 'call_required'){
        msg.textContent = `Online booking supports up to ${result.maxOnline} guests. For larger groups, please call us directly.`;
        $('#altSlots').innerHTML = '';
      } else {
        msg.textContent = 'All matching tables are booked for this time. Try one of these nearby slots:';
        const alternatives = BookingLogic.TIME_SLOTS.filter(t => t !== state.time).filter(t => {
          const avail = BookingLogic.getAvailableTables(allTables, allBookings, state.date, t);
          return BookingLogic.allocateTables(avail, state.guests).ok;
        }).slice(0, 4);
        $('#altSlots').innerHTML = alternatives.length
          ? alternatives.map(t => `<button type="button" class="slot-btn" data-alt-slot="${t}">${t}</button>`).join('')
          : `<span style="color:var(--text-faint);font-size:.85rem;">No other slots free today for this party size.</span>`;
      }
      $('#availFail').classList.add('show');
    }
  }

  $('#altSlots').addEventListener('click', async e => {
    const btn = e.target.closest('[data-alt-slot]');
    if (!btn) return;
    state.time = btn.dataset.altSlot;
    renderSlots();
    await runAvailabilityCheck();
  });

  /* ======================================================================
     STEP 4 — SUMMARY
     ====================================================================== */
  $('#toPaymentBtn').addEventListener('click', () => {
    const nameField = $('#fld-guestname');
    const nameInput = $('#guestName');
    if (!nameInput.value.trim()){
      nameField.classList.add('invalid');
      return;
    }
    nameField.classList.remove('invalid');
    state.guestName = nameInput.value.trim();
    state.guestNotes = $('#guestNotes').value.trim();
    renderPaymentStep();
  });

  function renderSummary(targetId, forConfirmation){
    const tableLabels = state.allocatedTables.map(t => t.label).join(' + ');
    const rows = [
      ['Name', state.guestName || state.customer.name || '—'],
      ['Contact', state.customer.phone || state.customer.email || '—'],
      ['Date', formatDate(state.date)],
      ['Time', state.time],
      ['Guests', state.guests],
      ['Table(s)', tableLabels],
    ];
    if (forConfirmation){
      rows.push(['Confirmation fee', `₹${CONFIRMATION_FEE} — Paid`]);
    }
    $('#'+targetId).innerHTML = rows.map(([k,v]) => `<div class="summary-row"><span>${k}</span><span>${v}</span></div>`).join('');
  }

  function formatDate(iso){
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  }

  // Populate summary whenever step 4 becomes active
  const observer4 = new MutationObserver(() => {
    if ($('[data-step="4"]').classList.contains('active')) renderSummary('summaryList', false);
  });
  observer4.observe($('[data-step="4"]'), { attributes:true, attributeFilter:['class'] });

  /* ======================================================================
     STEP 5 — PAYMENT (Razorpay)
     ====================================================================== */
  function renderPaymentStep(){
    $('#feeAmountLabel').textContent = `₹${CONFIRMATION_FEE}`;
    gotoStep(5);
  }

  $('#payNowBtn').addEventListener('click', () => {
    const btn = $('#payNowBtn');
    if (typeof Razorpay === 'undefined'){
      toast('Payment gateway failed to load. Check your connection and try again.', true);
      return;
    }
    btn.classList.add('loading'); btn.disabled = true;

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: CONFIRMATION_FEE * 100, // paise
      currency: 'INR',
      name: 'YRAL Cafe',
      description: 'Table booking confirmation fee',
      image: 'images/yral-logo.jpg',
      prefill: {
        name: state.guestName || state.customer.name || '',
        contact: (state.customer.phone || '').replace(/\D/g,''),
        email: state.customer.email || ''
      },
      theme: { color: '#ff7a3d' },
      handler: function(response){
        btn.classList.remove('loading'); btn.disabled = false;
        state.payment = { status:'paid', ref: response.razorpay_payment_id || ('demo_'+Date.now()) };
        finalizeBooking();
      },
      modal: {
        ondismiss: function(){
          btn.classList.remove('loading'); btn.disabled = false;
          toast('Payment cancelled — you can try again when ready.', true);
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.open();
    } catch(err){
      btn.classList.remove('loading'); btn.disabled = false;
      toast('Could not open payment window: ' + err.message, true);
    }
  });

  /* ======================================================================
     STEP 6 — FINALIZE + CONFIRMATION
     ====================================================================== */
  async function finalizeBooking(){
    state.bookingRef = BookingLogic.generateBookingRef(state.date);
    const payload = {
      booking_ref: state.bookingRef,
      customer_name: state.guestName || state.customer.name || 'Guest',
      customer_phone: state.customer.phone || '',
      customer_email: state.customer.email || '',
      booking_date: state.date,
      booking_time: state.time,
      guests: state.guests,
      table_ids: state.allocatedTables.map(t => t.id).join(','),
      table_labels: state.allocatedTables.map(t => t.label).join(' + '),
      status: 'confirmed',
      payment_status: 'paid',
      payment_amount: CONFIRMATION_FEE,
      payment_ref: state.payment.ref,
      notes: state.guestNotes || '',
      source: 'website'
    };
    try {
      await TableAPI.create('bookings', payload);
    } catch(e){
      console.warn('Booking save failed (preview mode?)', e);
      toast('Note: could not persist booking to the database in this preview, but your confirmation is shown below.', true);
    }
    renderSummary('confirmSummary', true);
    $('#confirmRef').textContent = state.bookingRef;
    gotoStep(6);
    toast('Booking confirmed! See you soon 🎉');
  }

  $('#newBookingBtn').addEventListener('click', () => {
    state.time = ''; state.allocatedTables = []; state.guestNotes = '';
    $('#guestName').value = ''; $('#guestNotes').value = '';
    renderSlots();
    gotoStep(2);
  });

})();
