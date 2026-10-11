/* Relie Motel Support — offline AI assistant.
   Pure client-side knowledge base: no APIs, no network, works offline.
   Answers from the hotel's official info and hands off to WhatsApp. */
(function () {
  'use strict';
  var WA = 'https://wa.me/256775193137';

  var KB = [
    { k: ['room', 'rooms', 'stay', 'sleep', 'accommodation', 'bed', 'double', 'twin', 'deluxe', 'suite', 'family'],
      a: 'We have 26 spotless rooms in three types: Standard Double ($24/night), Standard Twin ($29/night) and Deluxe Double ($35/night). All have private bathrooms, free Wi-Fi, TV and breakfast is included. Which one interests you?',
      c: [['Book a room', 'booking'], ['See facilities', 'facilities']] },

    { k: ['price', 'prices', 'cost', 'rate', 'rates', 'how much', 'fee', 'charge', 'expensive', 'cheap', 'affordable', 'discount', 'offer'],
      a: 'Our rates: Standard Double $24/night, Standard Twin $29/night, Deluxe Double $35/night. Breakfast, Wi-Fi and secure parking are included. We also have packages (including Kibale chimp trekking bundles) and our best-rate guarantee when you book direct. Currency switcher at the top converts to UGX, KES, EUR and more.',
      c: [['See packages', 'packages'], ['Book now', 'booking']] },

    { k: ['book', 'booking', 'reserve', 'reservation', 'availability', 'available', 'vacancy'],
      a: 'You can book in two easy ways: tap "Book Now" on the site to use the online booking form, or message us on WhatsApp for instant confirmation.',
      c: [['Chat on WhatsApp', 'wa'], ['Check-in time', 'checkin']] },

    { k: ['check in', 'checkin', 'check-in', 'checkout', 'check out', 'check-out', 'arrive', 'departure', 'leave'],
      a: 'Check-in is from 2:30 PM and check-out is by 10:00 AM. The front desk is open 24/7, so late arrivals are no problem — just let us know.',
      c: [['Book a room', 'booking'], ['Where are you', 'location']] },

    { k: ['where', 'location', 'address', 'directions', 'find', 'map', 'located', 'far', 'distance', 'kibale', 'palace', 'town'],
      a: 'We are on Malibo Road, Bazaar, in the heart of Fort Portal City (Plus code M72C+PHQ). Kibale National Park is 13 km away, the Tooro Kingdom Palace a 15-minute walk, and markets and the golf course are close by.',
      c: [['Places to visit', 'explore'], ['Contact us', 'contact']] },

    { k: ['facility', 'facilities', 'amenities', 'wifi', 'wi-fi', 'internet', 'parking', 'pool', 'massage', 'spa', 'gym', 'restaurant', 'food', 'dine', 'bar', 'breakfast', 'conference', 'hall', 'meeting', 'event'],
      a: 'Our facilities: restaurant & bar with fresh local and international dishes, free breakfast, free Wi-Fi, secure on-site parking, in-house massage room, conference hall and a 24/7 front desk.',
      c: [['Room rates', 'rates'], ['Book a conference', 'contact']] },

    { k: ['explore', 'visit', 'attraction', 'tourism', 'tour', 'activities', 'chimpanzee', 'trek', 'crater', 'lake', 'safari'],
      a: 'Fort Portal is Uganda\'s Tourism City. From here: Kibale National Park (chimp trekking, 13 km), the Crater Lakes region, Amabere ga Nyina Mwiru caves, Lake Kyaninga, Sempaya hot springs and the Tooro Kingdom Palace. We also offer Kibale chimp trekking packages.',
      c: [['See packages', 'packages'], ['Book with us', 'booking']] },

    { k: ['package', 'packages', 'deal', 'deals', 'bundle', 'offer'],
      a: 'Our packages include best-rate guarantees and Kibale chimp trekking bundles crafted to make your stay memorable. Tap "Learn More" on the Packages page or ask here for anything specific.',
      c: [['Open packages page', 'packagespage']] },

    { k: ['contact', 'phone', 'call', 'number', 'whatsapp', 'email', 'reach', 'speak', 'message'],
      a: 'Reach us anytime: WhatsApp 0775 193137 or 0704 193137, call +256 775 193137 / +256 704 193137, or the front desk line +256 778 472498 (24/7).',
      c: [['Chat on WhatsApp', 'wa'], ['Book a room', 'booking']] },

    { k: ['pay', 'payment', 'money', 'cash', 'momo', 'airtel', 'card', 'currency', 'dollar', 'ugx', 'shilling', 'exchange'],
      a: 'You can pay with cash, MTN MoMo or Airtel Money. Rates are quoted in USD and you can switch currency at the top of the site; payment is made at the hotel.',
      c: [['Room rates', 'rates'], ['Book now', 'booking']] },

    { k: ['policy', 'policies', 'cancel', 'cancellation', 'refund', 'pet', 'pets', 'smoking', 'children', 'kids', 'faq', 'question'],
      a: 'Our policies: children and family stays are welcome, payment is at the hotel (cash, MTN MoMo or Airtel Money), and the front desk is 24/7. For cancellations and anything else, message us on WhatsApp and we will sort you out quickly.',
      c: [['Chat on WhatsApp', 'wa']] },

    { k: ['group', 'groups', 'conference', 'meeting', 'wedding', 'party', 'event', 'team', 'retreat', 'bus'],
      a: 'Yes! We host groups and events with a conference hall, projector, dining and 26 rooms. WhatsApp us on 0775 193137 with your dates and group size for a tailored quote.',
      c: [['Chat on WhatsApp', 'wa'], ['See facilities', 'facilities']] }
  ];

  var GREET = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'habari', 'olotya', 'how are you', 'thank', 'thanks'];
  var WELCOME = 'Welcome to Relie Motel! I am the Relie AI assistant. Ask me anything about rooms, rates, facilities, booking, location or Fort Portal.';

  var CHIPS = [['Rooms & rates', 'rates'], ['Book now', 'booking'], ['Facilities', 'facilities'], ['Where are you', 'location'], ['WhatsApp us', 'wa']];
  var PAGES = { packagespage: 'packages.html' };

  function score(q, keys) {
    var n = 0;
    q = ' ' + q + ' ';
    for (var i = 0; i < keys.length; i++) if (q.indexOf(keys[i]) > -1) n += keys[i].length > 4 ? 2 : 1;
    return n;
  }
  function best(q) {
    var low = ' ' + q.toLowerCase().replace(/[^\w\s'\-]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    var top = null, ts = 0;
    for (var i = 0; i < KB.length; i++) { var s = score(low, KB[i].k); if (s > ts) { ts = s; top = KB[i]; } }
    if (!top && GREET.some(function (g) { return low.indexOf(g) > -1; })) return { a: WELCOME, c: CHIPS };
    return top;
  }

  var ui = document.createElement('div');
  ui.className = 'rl-sup';
  ui.innerHTML =
    '<button type="button" class="rl-sup-fab" aria-label="Relie AI Support" aria-expanded="false">' +
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
    '<span>Relie AI</span></button>' +
    '<div class="rl-sup-box" hidden>' +
    '<div class="rl-sup-head"><b>Relie AI Support</b><span>Ask anything · instant answers</span></div>' +
    '<div class="rl-sup-log" aria-live="polite"></div>' +
    '<div class="rl-sup-chips"></div>' +
    '<form class="rl-sup-form"><input type="text" placeholder="Type your question..." aria-label="Your question"><button type="submit" aria-label="Send">&#10148;</button></form>' +
    '</div>';
  document.body.appendChild(ui);

  var fab = ui.querySelector('.rl-sup-fab'), box = ui.querySelector('.rl-sup-box'),
      log = ui.querySelector('.rl-sup-log'), chips = ui.querySelector('.rl-sup-chips'),
      form = ui.querySelector('.rl-sup-form'), input = form.querySelector('input');

  function addMsg(text, who) {
    var d = document.createElement('div');
    d.className = 'rl-sup-m ' + who;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }
  function addLink(text, url) {
    var d = document.createElement('div');
    d.className = 'rl-sup-m bot';
    var a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = text;
    d.appendChild(a); log.appendChild(d); log.scrollTop = log.scrollHeight;
  }
  function setChips(list) {
    chips.innerHTML = '';
    (list || []).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = c[0];
      b.addEventListener('click', function () { act(c[1]); });
      chips.appendChild(b);
    });
  }
  function act(id) {
    if (id === 'wa') { addMsg('Opening WhatsApp chat with us...', 'you'); addLink('Chat on WhatsApp', WA + '?text=' + encodeURIComponent('Hello Relie Motel! I have a question.')); setChips([]); return; }
    if (PAGES[id]) { window.location.href = PAGES[id]; return; }
    if (id === 'booking') { window.location.href = 'book.html'; return; }
    answer(id === 'rates' ? 'room prices' : id);
  }
  function answer(q) {
    addMsg(q, 'you');
    var m = best(q);
    if (m) {
      setTimeout(function () {
        addMsg(m.a, 'bot');
        setChips(m.c && m.c.length ? m.c : CHIPS);
      }, 320);
    } else {
      setTimeout(function () {
        addMsg('I did not quite get that. I can help with rooms, rates, facilities, booking, location, packages and payment. Or tap below to reach our team directly on WhatsApp.', 'bot');
        setChips([['Chat on WhatsApp', 'wa'], ['Rooms & rates', 'rates']]);
      }, 320);
    }
  }

  fab.addEventListener('click', function () {
    var open = box.hidden; box.hidden = !open; fab.setAttribute('aria-expanded', open);
    if (open && !log.childNodes.length) { addMsg(WELCOME, 'bot'); setChips(CHIPS); input.focus(); }
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim(); if (!q) return;
    input.value = ''; answer(q);
  });
})();
