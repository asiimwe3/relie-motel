/* DeryCode Pixel (dcp) v1 - first-party analytics & conversion tracking.
   Works like a Meta pixel but the data lands in our own database.
   Install:  <script src="assets/js/pixel.js" data-site="relie-motel" defer></script>
   Custom events: dcp.track('event_name', {key:'value'})   */
(function () {
  'use strict';
  var script = document.currentScript || document.querySelector('script[src*="pixel.js"]');
  var SITE = (script && script.dataset.site) || 'unknown';
  var ENDPOINT = (script && script.dataset.endpoint) || 'https://emldbjqegftrngxypeca.supabase.co/rest/v1/pixel_events';
  var KEY = (script && script.dataset.key) || ''; // anon key injected at install
  var DNT = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1';
  if (DNT) return;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // anonymous visitor id (no personal data) + session (30 min idle)
  var vid = store('dcp_vid'); if (!vid) { vid = uuid(); store('dcp_vid', vid); }
  var sess = null, sessTs = 0;
  try { sess = sessionStorage.getItem('dcp_sess'); sessTs = +sessionStorage.getItem('dcp_ts') || 0; } catch (e) {}
  if (!sess || Date.now() - sessTs > 30 * 60 * 1000) { sess = uuid(); try { sessionStorage.setItem('dcp_sess', sess); } catch (e) {} }
  try { sessionStorage.setItem('dcp_ts', String(Date.now())); } catch (e) {}

  // capture marketing attribution once per session
  function params() {
    var q = {}, s = location.search.replace(/^\?/, '');
    if (s) s.split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); });
    return q;
  }
  var q = params();
  var utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref'].forEach(function (k) { if (q[k]) utm[k] = q[k]; });
  var stored = store('dcp_utm');
  if (Object.keys(utm).length) store('dcp_utm', JSON.stringify(utm));
  else if (stored) { try { utm = JSON.parse(stored); } catch (e) {} }

  var sent = 0;
  function send(event, props) {
    if (sent > 120) return; // runaway guard
    sent++;
    var row = {
      site: SITE,
      event: String(event).slice(0, 60),
      page: location.pathname.slice(0, 200),
      title: (document.title || '').slice(0, 200),
      referrer: (document.referrer || '').slice(0, 300),
      session_id: sess,
      visitor_id: vid,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      language: (navigator.language || '').slice(0, 12),
      utm: utm,
      props: props || {}
    };
    var body = JSON.stringify(row);
    // fetch with keepalive: works on page hide, Supabase answers CORS preflight
    try {
      return fetch(ENDPOINT, {
        method: 'POST', keepalive: true, mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'apikey': KEY,
          'Authorization': 'Bearer ' + KEY,
          'Prefer': 'return=minimal'
        },
        body: body
      }).catch(function () {
        // last resort on unload: beacon (may be dropped by CORS, harmless)
        try { if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT + '?apikey=' + encodeURIComponent(KEY), new Blob([body], { type: 'application/json' })); } catch (e) {}
      });
    } catch (e) {}
  }

  var t0 = Date.now();
  var api = { track: send, id: vid, session: sess, site: SITE };
  window.dcp = api;
  window.derypixel = api; // alias

  // ---- automatic events ----
  function fire() { send('page_view', { path: location.pathname }); }
  if (document.readyState === 'complete') fire(); else window.addEventListener('load', fire);

  // outbound / contact intent clicks
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    var label = (a.textContent || '').trim().slice(0, 60);
    if (/wa\.me|api\.whatsapp\.com/i.test(h)) send('whatsapp_click', { label: label, href: h.slice(0, 120) });
    else if (/^tel:/i.test(h)) send('phone_click', { label: label, number: h.replace(/^tel:/, '').slice(0, 20) });
    else if (/^mailto:/i.test(h)) send('email_click', { label: label });
    else if (/book\.html/i.test(h)) send('booking_intent', { label: label });
    else if (/^https?:\/\//i.test(h) && a.hostname && a.hostname !== location.hostname) send('outbound_click', { href: h.slice(0, 120) });
  }, true);

  // form submissions (no field values captured)
  document.addEventListener('submit', function (e) {
    var f = e.target;
    send('form_submit', { form: (f.id || f.className || 'form').toString().slice(0, 40) });
  }, true);

  // booking completed (the site dispatches this after a reservation)
  document.addEventListener('booking_completed', function (e) {
    send('booking_completed', { room: (e.detail && e.detail.room) || '', nights: (e.detail && e.detail.nights) || 0, value_usd: (e.detail && e.detail.value) || 0, currency: 'USD' });
  });

  // scroll depth 50/90
  var marks = {};
  window.addEventListener('scroll', function () {
    var d = document.documentElement, pct = Math.round((d.scrollTop + innerHeight) / d.scrollHeight * 100);
    [50, 90].forEach(function (m) { if (pct >= m && !marks[m]) { marks[m] = 1; send('scroll_' + m); } });
  }, { passive: true });

  // engaged time
  [15, 60].forEach(function (s) {
    setTimeout(function () { send('engaged_' + s + 's', { seconds: s }); }, s * 1000);
  });
  window.addEventListener('pagehide', function () { send('page_leave', { seconds: Math.round((Date.now() - t0) / 1000) }); });
})();
