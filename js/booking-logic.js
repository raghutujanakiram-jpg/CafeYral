/* ==========================================================================
   YRAL Cafe — Booking / Table Allocation Logic
   Shared by booking.html (customer journey) and admin.html (dashboard).

   TABLE CONFIGURATION (as briefed):
     9 tables total, 6-seat capacity each = 54 seats.

   ALLOCATION LOGIC (default — confirm/finalize with YRAL before go-live):
     1–6 guests  → 1 table (first available table with capacity >= guests)
     7–12 guests → 2 adjacent/available tables combined (12 seats)
     13+ guests  → cannot be auto-allocated online; customer is asked to
                   call the cafe directly so staff can arrange large-party
                   seating manually.
     A table is "available" for a slot if it has no other CONFIRMED or
     PENDING_PAYMENT booking that overlaps the same date and a 90-minute
     seating window around the requested time.
   ========================================================================== */
const BookingLogic = (function(){
  "use strict";

  const SEATING_WINDOW_MIN = 90; // minutes a table is considered occupied per booking
  const MAX_ONLINE_PARTY = 12;
  const ACTIVE_STATUSES = ['pending_payment', 'confirmed', 'modified'];

  const TIME_SLOTS = [
    '08:00 AM','09:30 AM','11:00 AM','01:00 PM',
    '03:00 PM','05:30 PM','07:00 PM','08:30 PM'
  ];

  function parseTimeToMinutes(t){
    const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let [_, hh, mm, ap] = m;
    hh = parseInt(hh, 10); mm = parseInt(mm, 10);
    if (ap.toUpperCase() === 'PM' && hh !== 12) hh += 12;
    if (ap.toUpperCase() === 'AM' && hh === 12) hh = 0;
    return hh * 60 + mm;
  }

  function slotsOverlap(timeA, timeB, windowMin = SEATING_WINDOW_MIN){
    const a = parseTimeToMinutes(timeA);
    const b = parseTimeToMinutes(timeB);
    if (a === null || b === null) return timeA === timeB;
    return Math.abs(a - b) < windowMin;
  }

  /**
   * Determine which enabled tables are free for a given date/time,
   * given a list of existing bookings (each with booking_date, booking_time,
   * table_ids [comma string], status).
   */
  function getAvailableTables(allTables, existingBookings, date, time){
    const enabled = allTables.filter(t => t.status === 'enabled');
    const busyTableIds = new Set();
    existingBookings.forEach(b => {
      if (!ACTIVE_STATUSES.includes(b.status)) return;
      if (b.booking_date !== date) return;
      if (!slotsOverlap(b.booking_time, time)) return;
      (b.table_ids || '').split(',').map(s => s.trim()).filter(Boolean).forEach(id => busyTableIds.add(id));
    });
    return enabled.filter(t => !busyTableIds.has(t.id));
  }

  /**
   * Try to allocate table(s) for `guests` from the currently available tables.
   * Returns { ok:true, tables:[...] } or { ok:false, reason }.
   */
  function allocateTables(availableTables, guests){
    guests = Number(guests);
    if (guests < 1) return { ok:false, reason:'invalid_party_size' };
    if (guests > MAX_ONLINE_PARTY){
      return { ok:false, reason:'call_required', maxOnline: MAX_ONLINE_PARTY };
    }
    // sort tables by capacity ascending so we don't waste a big table on a small party
    const sorted = [...availableTables].sort((a,b) => a.capacity - b.capacity);

    if (guests <= 6){
      const fit = sorted.find(t => t.capacity >= guests);
      if (fit) return { ok:true, tables:[fit] };
      return { ok:false, reason:'no_availability' };
    }

    // 7–12 guests: combine two tables
    if (sorted.length >= 2){
      // simplest deterministic combo: first two available (any 2 tables = 12 seats)
      const combo = sorted.slice(0, 2);
      if (combo.reduce((s,t) => s + t.capacity, 0) >= guests){
        return { ok:true, tables: combo };
      }
    }
    return { ok:false, reason:'no_availability' };
  }

  function generateBookingRef(date){
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `YRAL-${date.replace(/-/g,'')}-${rand}`;
  }

  return {
    TIME_SLOTS, MAX_ONLINE_PARTY, SEATING_WINDOW_MIN,
    parseTimeToMinutes, slotsOverlap,
    getAvailableTables, allocateTables, generateBookingRef
  };
})();
