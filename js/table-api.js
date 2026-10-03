/* ==========================================================================
   YRAL Cafe — Table API helper
   Thin wrapper around the RESTful Table API (tables/{table}) used by both
   the booking engine (booking.html) and the admin dashboard (admin.html).
   ========================================================================== */
const TableAPI = (function(){
  "use strict";

  async function list(table, { page = 1, limit = 100, search = '', sort = '' } = {}){
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    const res = await fetch(`tables/${table}?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to load ${table} (${res.status})`);
    return res.json();
  }

  async function listAll(table){
    // Table API caps at 100 per page by default — page through everything.
    let page = 1, out = [], total = Infinity;
    while (out.length < total){
      const data = await list(table, { page, limit: 100 });
      out = out.concat(data.data || []);
      total = data.total ?? out.length;
      if (!data.data || !data.data.length) break;
      page++;
    }
    return out;
  }

  async function get(table, id){
    const res = await fetch(`tables/${table}/${id}`);
    if (!res.ok) throw new Error(`Failed to load ${table}/${id} (${res.status})`);
    return res.json();
  }

  async function create(table, payload){
    const res = await fetch(`tables/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to create in ${table} (${res.status})`);
    return res.json();
  }

  async function update(table, id, payload){
    const res = await fetch(`tables/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to update ${table}/${id} (${res.status})`);
    return res.json();
  }

  async function remove(table, id){
    const res = await fetch(`tables/${table}/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error(`Failed to delete ${table}/${id} (${res.status})`);
    return true;
  }

  return { list, listAll, get, create, update, remove };
})();
