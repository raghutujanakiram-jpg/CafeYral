# YRAL Cafe — Website, Booking Engine & Admin Panel

A premium, single-page marketing site for **YRAL Cafe** (Hyderabad), plus a
customer-facing real-time table **Booking Engine** and a staff **Admin
Panel** — all built as a static HTML/CSS/vanilla-JS site (no backend
server), using the platform's RESTful Table API for all data persistence.

---

## 1. Project goals

- Present YRAL Cafe's brand, menu, gallery and location with a modern,
  glass-morphism / dark-light themed design.
- Let customers check real-time table availability and reserve online, with
  a small confirmation fee collected via Razorpay.
- Give cafe staff a dashboard to manage bookings, tables, menu, gallery,
  and cafe settings without touching code.

---

## 2. Pages / entry points

| Path | Purpose | Auth |
|---|---|---|
| `index.html` | Main marketing site (hero, about, menu, gallery, visit, contact form) | Public |
| `booking.html` | Customer booking journey: Login → Date & Guests → Availability → Summary → Payment → Confirmation | Demo login only (see §5) |
| `admin.html` | Staff dashboard: Overview, Bookings, Tables, Menu, Gallery, Customers, Cafe Settings | **Client-side PIN only — NOT secure, see §6** |

All "Reserve a Table" buttons across `index.html` (hero, mobile drawer,
favorites sheet, visit section, footer) now link to `booking.html`.

---

## 3. Feature 1 — Admin Panel (`admin.html`)

- **Overview**: KPI cards (today's bookings, guests expected, active
  tables, total seats, confirmation revenue), a 7‑day bookings bar chart
  (Chart.js), and a recent-bookings list.
- **Bookings**: searchable/filterable (status, date) table of every
  reservation; view full detail, confirm / modify / cancel, or add a manual
  booking taken by phone/walk-in.
- **Tables**: card grid of all 9 tables — enable/disable with a toggle,
  edit label/capacity/location/notes, add new tables.
- **Menu**: searchable/filterable card grid of all dishes — add, edit,
  hide/show, change price, category, diet tag, description, image URL.
- **Gallery**: card grid of gallery photos — add, edit caption/size/order,
  hide/show.
- **Customers**: a contact/booking-history directory **derived live from
  the `bookings` table** (grouped by phone/email/name) — see §7 for why the
  dedicated `customers` table is currently unused.
- **Cafe Settings**: edit cafe name, tagline, address, phone, email,
  Instagram/Maps links, opening/closing hours, confirmation fee, and the
  Razorpay/Google integration keys — all stored in `cafe_settings`.

## 4. Feature 2 — Booking Engine (`booking.html`)

Six-step customer journey, matching the requested spec:

1. **Login** — Mobile number (OTP) or Google.
2. **Date & Guests** — date picker, time-slot grid, guest-count stepper.
3. **Availability Check** — queries `restaurant_tables` + `bookings` live
   and runs the allocation algorithm in `js/booking-logic.js`.
4. **Booking Summary** — date, time, guests, assigned table(s),
   confirmation amount.
5. **Payment** — Razorpay Checkout modal for the confirmation fee
   (default ₹79, configurable in Admin → Cafe Settings, range ₹70–₹99 per
   your spec).
6. **Confirmation** — instant on-screen booking reference
   (`YRAL-YYYYMMDD-XXXX`) and the booking is saved to the `bookings` table.

### Table allocation logic (⚠️ needs your sign-off)

You asked that allocation logic be finalized with you before development.
No further direction was given, so I implemented a documented default in
`js/booking-logic.js` so the feature would be fully testable. **Please
review and tell me if it should change:**

- **1–6 guests** → smallest single table that fits (each table seats 6).
- **7–12 guests** → two tables combined (greedy: smallest two available).
- **13+ guests** → online booking is not offered; the UI asks the guest to
  call the cafe directly.
- A table is considered unavailable for a slot if it already has an active
  booking (`pending_payment`, `confirmed`, or `modified`) whose time is
  within **90 minutes** of the requested time (configurable via
  `SEATING_WINDOW_MIN` in `js/booking-logic.js`).

---

## 5. Login — important limitations (server-side cost/behavior you must plan for)

You explicitly acknowledged that **SMS OTP and Google OAuth have real
costs/setup that fall on the cafe** — this is correct, and here is exactly
what's implemented vs. what's still needed:

- **Mobile OTP**: currently **simulated/demo only** — `booking.js`
  generates a 4-digit code client-side and displays it in a toast so you
  can test the full flow. **No real SMS is sent.** Going live requires:
  - A backend endpoint (this static site cannot have one) that calls an
    SMS provider (e.g. Twilio, MSG91, AWS SNS) to send/verify OTPs, and
  - The provider's per-SMS charges, borne by the cafe as you noted.
- **Google login**: uses Google Identity Services
  (`accounts.google.com/gsi/client`) with a **placeholder** Client ID
  (`js/booking.js` → `GOOGLE_CLIENT_ID`). A "Continue with Google (Demo)"
  fallback simulates a successful login either way so the rest of the flow
  is testable today. Going live requires you to create a real OAuth 2.0
  Client ID in Google Cloud Console (Google sign-in itself is free; costs
  only apply if you later add paid Google APIs).

---

## 6. Payments — Razorpay integration status

- `booking.html` loads the real `https://checkout.razorpay.com/v1/checkout.js`
  and opens a genuine Razorpay Checkout modal for the confirmation fee.
- The Key ID is currently Razorpay's **public test key**
  (`rzp_test_1DP5mmOlF5G5ag`, in `js/booking.js` → `RAZORPAY_KEY_ID`) so you
  can see the real UI without moving money.
- **Before going live**, replace it with your live Key ID (from your
  Razorpay dashboard → Cafe Settings in Admin) and — critically — add a
  small backend to (a) create the Razorpay **Order** server-side and
  (b) verify the payment **signature** after checkout. Client-only checkout
  can display a working payment sheet but must never be trusted alone to
  mark a booking "paid" in production, per Razorpay's own guidance.
  Razorpay's standard transaction fees apply and are borne by the cafe.

---

## 7. Admin access — real security requires a plan upgrade

I attempted to protect `/admin.html` with the platform's real route-level
access control (`AccessRulesRead`/`AccessRulesUpdate`). That system
returned:

> `membership_required: plus_or_higher` — "Hosted Deploy access rules
> require an active Plus or higher membership."

So genuine, server-enforced admin protection is **not available on the
current plan**. Per platform policy, I did **not** substitute a fake
"secure" claim in application code. Instead, `admin.html` has a **Staff
PIN** screen (`STAFF_PIN = '1234'` in `js/admin.js`) purely as a UX
speed-bump, with an on-page disclaimer:

> ⚠️ This PIN is **not real security** — anyone with the page URL can view
> the HTML/JS source and bypass it. Do not put sensitive data behind this
> page assuming it's protected.

**Recommendation:** upgrade to Plus (or higher) and ask me to apply real
access rules to `/admin.html` (e.g. `mode: allowlist` restricted to staff
emails), or keep the page unlisted/unlinked and change the PIN regularly as
an interim measure only.

---

## 8. Data model (RESTful Table API)

All tables live behind `tables/{name}` REST endpoints (list/get/create/
update/delete). Two tables are more thoroughly explained below.

| Table | Purpose | Key fields |
|---|---|---|
| `restaurant_tables` | The 9 physical tables | `table_number`, `label`, `capacity` (6 each), `location`, `status` (enabled/disabled), `notes` |
| `bookings` | Every reservation | `booking_ref`, `customer_name/phone/email`, `booking_date`, `booking_time`, `guests`, `table_ids`, `table_labels`, `status` (pending_payment/confirmed/modified/cancelled/completed/no_show), `payment_status`, `payment_amount`, `payment_ref`, `notes`, `source` (website/admin/phone) |
| `customers` | Reserved contact directory schema | `name`, `phone`, `email`, `login_method`, `total_bookings`, `last_visit`, `notes` — **defined but not yet written to** (see note below) |
| `menu_items` | All 38 dishes | `name`, `category`, `diet`, `price`, `description`, `image`, `status` (active/hidden), `sort_order` |
| `gallery_items` | 10 gallery photos | `caption`, `image`, `size`, `sort_order`, `status` |
| `cafe_settings` | Key/value site config | `key`, `value` (cafe name, tagline, address, phone, email, social links, hours, confirmation fee, Razorpay key, Google client ID) |

**Note on `customers`:** the Admin → Customers view currently *derives* its
directory live from the `bookings` table (grouping by phone/email/name)
rather than reading/writing the dedicated `customers` table. This already
satisfies "maintain customer contact & booking history" functionally, but
if you'd like a persisted, editable customer record (e.g. for manual notes,
VIP tags, marketing consent) independent of bookings, let me know and I'll
wire `customers` in properly.

**Preview vs. Live data:** table rows created in the editor/preview
(including all seed data above) live in the *Preview* data store. A
deployed site's real visitors read/write a **separate** Hosted database
(Cloudflare D1) that is only created and populated by an actual **Hosted
Deploy**. If you deploy this site, the schema will be created on D1
automatically, but you may want the seed rows (9 tables, 38 menu items, 10
gallery photos, 12 settings) copied over too — ask me and I'll do that with
`HostedDbExecute` right after deploy.

---

## 9. Completed features

- [x] Original marketing site: hero, about, searchable/filterable menu,
      gallery + lightbox, visit/contact, footer, dark/light theme,
      particle background, scroll reveals, mobile drawer, favorites sheet.
- [x] Booking engine (`booking.html`): 6-step flow, demo OTP, demo/real
      Google login, live availability check + table allocation, real
      Razorpay Checkout modal (test key), booking persisted to `bookings`.
- [x] Admin panel (`admin.html`): Overview KPIs + chart, Bookings CRUD +
      status/payment management, Tables CRUD + enable/disable, Menu CRUD,
      Gallery CRUD, derived Customers directory, Cafe Settings editor.
- [x] Table API schemas + realistic seed data for all 6 tables.
- [x] "Reserve a Table" CTAs across the main site now link to
      `booking.html`.
- [x] Verified with Playwright (desktop + mobile) — both new pages render
      cleanly with no console errors.

## 10. Not yet implemented / explicitly out of scope for a static site

- Real SMS OTP delivery (needs backend + SMS provider — cost borne by cafe).
- Real Google OAuth in production (needs a verified Google Cloud project).
- Server-side Razorpay order creation + signature verification (needs a
  backend — required before trusting payments in production).
- Real, platform-enforced access control on `/admin.html` (needs Plus or
  higher membership).
- Persisted `customers` table usage (currently derived from `bookings`;
  see §8 note).
- Wiring `index.html`'s menu/gallery display to read live from
  `menu_items`/`gallery_items` (currently still uses the static
  `js/menu-data.js` file; the Admin panel already manages the API-backed
  copies, so editing content in Admin won't yet appear on the public menu
  section until this wiring is added).

## 11. Recommended next steps

1. **Confirm or adjust the table-allocation logic** in §4 — this was left
   pending your sign-off.
2. Decide on the `customers` table question in §8.
3. When ready for production: get a live Razorpay Key ID + build the small
   signature-verification backend; get a real Google OAuth Client ID; pick
   an SMS provider for OTP.
4. Consider a Plus-or-higher membership upgrade so `/admin.html` can get
   real, platform-enforced access control instead of the PIN placeholder.
5. Ask me to wire `index.html`'s menu/gallery sections to the live
   `menu_items`/`gallery_items` tables so Admin edits reflect on the public
   site automatically.
6. When you're ready to publish, use the **Publish tab** for a standard
   manual deploy, or explicitly ask me to run a Hosted Deploy.

---

## 12. Tech notes

- Pure static HTML/CSS/vanilla JS — no build step, no framework, no server.
- `js/table-api.js` — shared fetch wrapper over the Table API
  (`list`/`listAll`/`get`/`create`/`update`/`remove`).
- `js/booking-logic.js` — shared pure functions: time-slot parsing, overlap
  detection, table allocation, booking-ref generation. Shared by both
  `booking.js` and `admin.js`.
- Chart.js, Razorpay Checkout.js, Google Identity Services all loaded via
  CDN `<script>` tags — no npm/build tooling.
- Theming via CSS custom properties (`[data-theme="dark"|"light"]`),
  persisted in `localStorage`.
