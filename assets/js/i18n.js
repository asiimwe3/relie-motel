/* Relie Motel: language, currency & theme engine.
   English stays in the HTML (crawlable, SEO-safe). Visitors get translation client-side. */
(function () {
  'use strict';
  var LS = window.localStorage;
  function get(k, d) { try { return LS.getItem(k) || d; } catch (e) { return d; } }
  function set(k, v) { try { LS.setItem(k, v); } catch (e) {} }

  var LANGS = [
    ['en', 'English', 'ltr'], ['fr', 'Français', 'ltr'], ['sw', 'Kiswahili', 'ltr'],
    ['lg', 'Luganda', 'ltr'], ['rw', 'Kinyarwanda', 'ltr'], ['ar', 'العربية', 'rtl'],
    ['zh', '中文', 'ltr'], ['es', 'Español', 'ltr'], ['de', 'Deutsch', 'ltr'],
    ['pt', 'Português', 'ltr'], ['hi', 'हिन्दी', 'ltr']
  ];
  var CURRENCIES = [
    ['USD', '$', 'US Dollar'], ['UGX', 'USh', 'Ugandan Shilling'], ['EUR', '€', 'Euro'],
    ['GBP', '£', 'British Pound'], ['KES', 'KSh', 'Kenyan Shilling'], ['TZS', 'TSh', 'Tanzanian Shilling'],
    ['RWF', 'FRw', 'Rwandan Franc'], ['CNY', '¥', 'Chinese Yuan'], ['INR', '₹', 'Indian Rupee'],
    ['AED', 'AED', 'UAE Dirham'], ['ZAR', 'R', 'South African Rand'], ['CAD', 'C$', 'Canadian Dollar'],
    ['AUD', 'A$', 'Australian Dollar']
  ];
  // Fallback rates (per 1 USD) used until live rates load or when offline.
  var FALLBACK = { USD: 1, UGX: 3650, EUR: 0.92, GBP: 0.79, KES: 129, TZS: 2650, RWF: 1450, CNY: 7.2, INR: 84, AED: 3.67, ZAR: 18, CAD: 1.37, AUD: 1.52 };
  var rates = FALLBACK;
  var BIG = { UGX: 1, TZS: 1, RWF: 1, KES: 1, INR: 0 }; // whole numbers

  var root = document.documentElement;
  var base = (function () {
    var s = document.currentScript || document.querySelector('script[src*="i18n.js"]');
    return s ? s.src.replace(/i18n\.js.*$/, '') : '/assets/js/';
  })();

  /* ---------- THEME ---------- */
  var THEMES = ['light', 'dark', 'gold'];
  function applyTheme(t) {
    if (THEMES.indexOf(t) < 0) t = 'light';
    root.setAttribute('data-theme', t);
    set('relie_theme', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = t === 'light' ? '#f7f4ee' : t === 'dark' ? '#0a0f0d' : '#1a1405';
    var btns = document.querySelectorAll('.rl-theme button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('on', btns[i].dataset.t === t);
  }
  // apply ASAP to avoid flash
  var savedTheme = get('relie_theme', (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');
  root.setAttribute('data-theme', THEMES.indexOf(savedTheme) < 0 ? 'light' : savedTheme);

  /* ---------- CURRENCY ---------- */
  var cur = get('relie_cur', 'UGX');
  function fmt(ugx, c) {
    c = c || cur;
    if (c === 'UGX') return 'USh ' + Math.round(ugx).toLocaleString(currentLang());
    var v = (ugx / (rates.UGX || FALLBACK.UGX)) * (rates[c] || 1);
    var sym = (CURRENCIES.filter(function (x) { return x[0] === c; })[0] || [0, c])[1];
    var whole = BIG[c] === 1 || v >= 20;
    var n = whole ? Math.round(v) : Math.round(v * 100) / 100;
    var s = n.toLocaleString(currentLang(), { maximumFractionDigits: whole ? 0 : 2, minimumFractionDigits: 0 });
    return sym + ' ' + s;
  }
  window.RelieMoney = { fmt: fmt, get cur() { return cur; } };

  // Prices in the page are written as UGX <n>; wrap them so we can convert.
  var PRICE_RE = /(Rates from |from )?UGX ([\d,]+(\.\d+)?)/g;
  function markPrices() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT|OPTION|TEXTAREA)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[data-noprice]')) return NodeFilter.FILTER_REJECT;
        return /UGX \d/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var html = node.nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(PRICE_RE, function (m, pre, num) {
        return (pre || '') + '<span class="rl-price" data-ugx="' + num.replace(/,/g, '') + '">UGX ' + num + '</span>';
      });
      var span = document.createElement('span');
      span.innerHTML = html;
      node.parentNode.replaceChild(span, node);
    });
    // select options carry data-price; label text is rebuilt in refreshPrices
  }
  function refreshPrices() {
    var els = document.querySelectorAll('.rl-price');
    for (var i = 0; i < els.length; i++) els[i].textContent = fmt(parseFloat(els[i].dataset.ugx));
    var opts = document.querySelectorAll('option[data-price]');
    for (var j = 0; j < opts.length; j++) {
      var o = opts[j];
      if (!o.dataset.label) o.dataset.label = o.textContent.replace(/\s*[·\-—]\s*(USD|UGX).*$/, '');
      o.textContent = o.dataset.label + ' · ' + fmt(parseFloat(o.dataset.price)) + ' / ' + (T('night') || 'night');
    }
    var tot = document.getElementById('bkTotal');
    if (tot && tot.dataset.ugx != null) tot.textContent = fmt(parseFloat(tot.dataset.ugx));
    document.dispatchEvent(new CustomEvent('relie:currency', { detail: cur }));
  }
  function applyCurrency(c) {
    cur = c; set('relie_cur', c); refreshPrices();
    var sel = document.getElementById('rlCur'); if (sel && sel.value !== c) sel.value = c;
  }
  function loadRates() {
    try {
      var cache = JSON.parse(get('relie_rates', 'null'));
      if (cache && Date.now() - cache.t < 6 * 3600 * 1000) { rates = cache.r; refreshPrices(); return; }
    } catch (e) {}
    if (!window.fetch) return;
    fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.rates && d.rates.UGX) {
        var r = {}; CURRENCIES.forEach(function (c) { r[c[0]] = d.rates[c[0]] || FALLBACK[c[0]]; });
        rates = r; set('relie_rates', JSON.stringify({ t: Date.now(), r: r })); refreshPrices();
      }
    }).catch(function () {});
  }

  /* ---------- LANGUAGE ---------- */
  var lang = 'en', dict = null, enMap = null, nodeIndex = [];
  function currentLang() { return lang === 'zh' ? 'zh-CN' : lang; }
  function norm(t) { return t.replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim(); }
  function T(key) { return (UI[lang] && UI[lang][key]) || UI.en[key] || ''; }

  var UI = {
    en: { night: 'night', nights: 'nights', total: 'Estimated total', lang: 'Language', cur: 'Currency', theme: 'Theme', light: 'Light', dark: 'Dark', gold: 'Gold', rates: 'Rates are indicative; you pay in the hotel.', reserve: 'Reserve Now', ref: 'Reference', sel: 'Select your dates' },
    fr: { night: 'nuit', nights: 'nuits', total: 'Total estimé', lang: 'Langue', cur: 'Devise', theme: 'Thème', light: 'Clair', dark: 'Sombre', gold: 'Or', rates: 'Les tarifs sont indicatifs ; vous payez à l’hôtel.', reserve: 'Réserver', ref: 'Référence', sel: 'Choisissez vos dates' },
    sw: { night: 'usiku', nights: 'usiku', total: 'Jumla inayokadiriwa', lang: 'Lugha', cur: 'Sarafu', theme: 'Mandhari', light: 'Mwanga', dark: 'Giza', gold: 'Dhahabu', rates: 'Bei ni elekezi; unalipa hotelini.', reserve: 'Weka nafasi', ref: 'Kumbukumbu', sel: 'Chagua tarehe zako' },
    lg: { night: 'ekiro', nights: 'ebiro', total: 'Omuwendo gwonna', lang: 'Olulimi', cur: 'Ssente', theme: 'Langi', light: 'Ekitangaala', dark: 'Ekizikiza', gold: 'Zaabu', rates: 'Emiwendo gya kubalirira; osasulira ku hotel.', reserve: 'Kuuma', ref: 'Ennamba', sel: 'Londa ennaku' },
    rw: { night: 'ijoro', nights: 'amajoro', total: 'Igiteranyo giteganyijwe', lang: 'Ururimi', cur: 'Ifaranga', theme: 'Insanganyamatsiko', light: 'Urumuri', dark: 'Umwijima', gold: 'Zahabu', rates: 'Ibiciro ni ibigereranyo; wishyurira kuri hoteli.', reserve: 'Gufata icyumba', ref: 'Nomero', sel: 'Hitamo amatariki' },
    ar: { night: 'ليلة', nights: 'ليالٍ', total: 'الإجمالي التقديري', lang: 'اللغة', cur: 'العملة', theme: 'المظهر', light: 'فاتح', dark: 'داكن', gold: 'ذهبي', rates: 'الأسعار استرشادية؛ تدفع في الفندق.', reserve: 'احجز الآن', ref: 'المرجع', sel: 'اختر التواريخ' },
    zh: { night: '晚', nights: '晚', total: '预计总价', lang: '语言', cur: '货币', theme: '主题', light: '浅色', dark: '深色', gold: '金色', rates: '价格仅供参考，请在酒店支付。', reserve: '立即预订', ref: '编号', sel: '请选择日期' },
    es: { night: 'noche', nights: 'noches', total: 'Total estimado', lang: 'Idioma', cur: 'Moneda', theme: 'Tema', light: 'Claro', dark: 'Oscuro', gold: 'Dorado', rates: 'Las tarifas son orientativas; se paga en el hotel.', reserve: 'Reservar ahora', ref: 'Referencia', sel: 'Elige tus fechas' },
    de: { night: 'Nacht', nights: 'Nächte', total: 'Geschätzter Gesamtpreis', lang: 'Sprache', cur: 'Währung', theme: 'Design', light: 'Hell', dark: 'Dunkel', gold: 'Gold', rates: 'Preise sind unverbindlich; Zahlung im Hotel.', reserve: 'Jetzt buchen', ref: 'Referenz', sel: 'Wählen Sie Ihre Daten' },
    pt: { night: 'noite', nights: 'noites', total: 'Total estimado', lang: 'Idioma', cur: 'Moeda', theme: 'Tema', light: 'Claro', dark: 'Escuro', gold: 'Dourado', rates: 'Tarifas indicativas; pagamento no hotel.', reserve: 'Reservar agora', ref: 'Referência', sel: 'Escolha as datas' },
    hi: { night: 'रात', nights: 'रातें', total: 'अनुमानित कुल', lang: 'भाषा', cur: 'मुद्रा', theme: 'थीम', light: 'हल्का', dark: 'गहरा', gold: 'सुनहरा', rates: 'दरें सांकेतिक हैं; भुगतान होटल में करें।', reserve: 'अभी बुक करें', ref: 'संदर्भ', sel: 'अपनी तिथियाँ चुनें' }
  };
  window.RelieT = T;

  // Collect translatable text nodes + attributes once (English originals kept in memory).
  function collect() {
    nodeIndex = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('.rl-bar,[data-notr]')) return NodeFilter.FILTER_REJECT;
        return norm(n.nodeValue).length > 1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n;
    while ((n = walker.nextNode())) nodeIndex.push({ t: 'text', node: n, en: norm(n.nodeValue), raw: n.nodeValue });
    ['placeholder', 'alt', 'title', 'aria-label'].forEach(function (a) {
      var els = document.querySelectorAll('[' + a + ']');
      for (var i = 0; i < els.length; i++) {
        if (els[i].closest('.rl-bar')) continue;
        var v = norm(els[i].getAttribute(a));
        if (v.length > 1) nodeIndex.push({ t: 'attr', a: a, node: els[i], en: v });
      }
    });
  }

  function translateAll() {
    if (!nodeIndex.length) collect();
    nodeIndex.forEach(function (it) {
      var out = it.en;
      if (lang !== 'en' && dict && enMap) {
        var k = enMap[it.en];
        if (k != null && dict[k]) out = dict[k];
      }
      if (it.t === 'text') {
        var lead = it.raw.match(/^\s*/)[0], trail = it.raw.match(/\s*$/)[0];
        // text nodes that only changed inside .rl-price are skipped by design
        it.node.nodeValue = (lang === 'en' ? it.raw : lead + out + trail);
      } else it.node.setAttribute(it.a, lang === 'en' ? it.node.getAttribute(it.a) && it.en : out);
    });
  }

  function loadEnMap(cb) {
    if (enMap) return cb();
    fetch(base + 'lang/en.json').then(function (r) { return r.json(); }).then(function (d) {
      enMap = {}; Object.keys(d).forEach(function (k) { enMap[norm(d[k])] = k; }); cb();
    }).catch(function () { enMap = {}; cb(); });
  }

  function applyLang(l, silent) {
    var meta = LANGS.filter(function (x) { return x[0] === l; })[0];
    if (!meta) { l = 'en'; meta = LANGS[0]; }
    lang = l; set('relie_lang', l);
    root.setAttribute('lang', l); root.setAttribute('dir', meta[2]);
    var sel = document.getElementById('rlLang'); if (sel && sel.value !== l) sel.value = l;
    updateBarLabels();
    var done = function () { translateAll(); refreshPrices(); document.dispatchEvent(new CustomEvent('relie:lang', { detail: l })); };
    if (l === 'en') { dict = null; return done(); }
    loadEnMap(function () {
      fetch(base + 'lang/' + l + '.json').then(function (r) { return r.json(); }).then(function (d) { dict = d; done(); })
        .catch(function () { dict = null; done(); });
    });
  }

  /* ---------- UI BAR ---------- */
  function buildBar() {
    var lo = LANGS.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('');
    var co = CURRENCIES.map(function (x) { return '<option value="' + x[0] + '">' + x[0] + '</option>'; }).join('');
    var THEME_ICONS = { light: '\u2600', dark: '\u263E', gold: '\u2726' };
    var cluster = document.createElement('div');
    cluster.className = 'rl-top';
    cluster.setAttribute('role', 'group');
    cluster.setAttribute('aria-label', 'Language, currency and theme');
    cluster.innerHTML =
      '<select id="rlLang" aria-label="Language">' + lo + '</select>' +
      '<select id="rlCur" aria-label="Currency">' + co + '</select>' +
      '<button type="button" id="rlTheme" aria-label="Switch theme" title="Switch theme">' + (THEME_ICONS[root.getAttribute('data-theme')] || '\u2600') + '</button>';
    var host = document.querySelector('.topbar') || document.body;
    host.appendChild(cluster);
    cluster.querySelector('#rlLang').addEventListener('change', function () { applyLang(this.value); });
    cluster.querySelector('#rlCur').addEventListener('change', function () { applyCurrency(this.value); updateBarLabels(); });
    cluster.querySelector('#rlTheme').addEventListener('click', function () {
      var order = ['light', 'dark', 'gold'];
      var cur = root.getAttribute('data-theme');
      applyTheme(order[(order.indexOf(cur) + 1) % order.length]);
      updateBarLabels();
    });
    cluster.querySelector('#rlLang').value = lang;
    cluster.querySelector('#rlCur').value = cur;
    window.addEventListener('relie:theme', function () { updateBarLabels(); });
  }
  function updateBarLabels() {
    var q = function (id) { return document.getElementById(id); };
    if (!q('rlLang')) return;
    q('rlLang').value = lang; q('rlCur').value = cur;
    var icons = { light: '\u2600', dark: '\u263E', gold: '\u2726' };
    q('rlTheme').textContent = icons[root.getAttribute('data-theme')] || '\u2600';
  }

  /* ---------- BOOT ---------- */
  function boot() {
    lang = get('relie_lang', '');
    if (!lang) { var nl = (navigator.language || 'en').slice(0, 2).toLowerCase(); lang = LANGS.some(function (x) { return x[0] === nl; }) ? nl : 'en'; }
    if (!cur || !rates[cur]) cur = 'USD';
    markPrices();
    buildBar();
    applyTheme(root.getAttribute('data-theme'));
    refreshPrices();
    applyLang(lang, true);
    loadRates();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.Relie = { setLang: applyLang, setCurrency: applyCurrency, setTheme: applyTheme };
})();
