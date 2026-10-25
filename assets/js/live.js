/**
 * Relie Motel — live data from the admin dashboard.
 * Loaded on every page (defer). Applies room rates/cards and site settings.
 * If the feed is unreachable the static page content stays as-is.
 */
(function(){
  var FEED = 'https://derick-ai-775511bf.base44.app/functions/rmPublic';

  function rateText(rate){
    if (!rate) return '';
    return /^[\d,]/.test(rate) ? 'Rates from UGX ' + rate : 'Rates ' + rate.replace(/^on /i,'');
  }
  function rateTextNight(rate){
    if (!rate) return '';
    return /^[\d,]/.test(rate) ? 'Rates from UGX ' + rate + ' / night' : 'Rates ' + rate + ', call or WhatsApp';
  }
  function imgSrc(img, prefix){
    if (!img) return '';
    return img.indexOf('http') === 0 ? img : prefix + 'assets/images/' + img;
  }

  function applyRooms(rooms){
    var prefix = location.pathname.indexOf('/rooms/') === 0 ? '../' : '';

    // 1) Room detail pages: update the rate line
    var rateEl = document.querySelector('.sec .card .rate');
    var m = location.pathname.match(/rooms\/([a-z0-9-]+)\.html/);
    if (rateEl && m){
      var mine = rooms.filter(function(r){ return r.slug === m[1]; })[0];
      if (mine && mine.rate) rateEl.textContent = rateTextNight(mine.rate);
    }

    // 2) Listing pages (index.html, stay.html): update cards in place
    var cards = document.querySelectorAll('.card');
    var seenSlugs = {};
    var grid = null;
    for (var i = 0; i < cards.length; i++){
      var a = cards[i].querySelector('a[href*="rooms/"]');
      if (!a) continue;
      var href = a.getAttribute('href');
      var sm = href.match(/rooms\/([a-z0-9-]+)\.html/);
      if (!sm) continue;
      var slug = sm[1];
      seenSlugs[slug] = true;
      grid = cards[i].parentElement;
      var room = rooms.filter(function(r){ return r.slug === slug; })[0];
      if (!room){ cards[i].style.display = 'none'; continue; }  // removed/unpublished
      var h3 = cards[i].querySelector('h3');
      var rt = cards[i].querySelector('.rate');
      var im = cards[i].querySelector('img');
      var ds = cards[i].querySelector('.b p[style]');
      if (h3 && room.name) h3.textContent = room.name;
      if (rt && room.rate) rt.textContent = rateText(room.rate);
      if (im && room.img){ im.src = imgSrc(room.img, prefix); im.alt = room.name; }
      if (ds && room.desc) ds.textContent = room.desc;
    }

    // 3) New rooms added in the dashboard (no detail page yet): append cards
    var existing = {};
    document.querySelectorAll('.card a[href*="rooms/"]').forEach(function(a){
      var s = (a.getAttribute('href').match(/rooms\/([a-z0-9-]+)\.html/) || [])[1];
      if (s) existing[s] = true;
    });
    var news = rooms.filter(function(r){ return r.slug && !existing[r.slug]; });
    if (news.length && grid){
      news.forEach(function(r){
        var el = document.createElement('div');
        el.className = 'card';
        el.innerHTML =
          '<img width="900" height="700" src="' + imgSrc(r.img, prefix) + '" alt="' + r.name + '" loading="lazy" decoding="async">' +
          '<div class="b"><h3>' + r.name + '</h3>' +
          (r.desc ? '<p style="font-size:.9rem;color:#666">' + r.desc + '</p>' : '') +
          (r.rate ? '<p class="rate">' + rateText(r.rate) + '</p>' : '') +
          '<div class="links"><a href="https://wa.me/' + (window.__rmWA || '256775193137') +
          '?text=' + encodeURIComponent('Hello Relie Motel! I\'d like to book the ' + r.name + '.') + '">Book now</a></div></div>';
        grid.appendChild(el);
      });
    }
  }

  function applySettings(s){
    // WhatsApp number across every page
    if (s.waNumber){
      window.__rmWA = s.waNumber;
      document.querySelectorAll('a[href*="wa.me/"]').forEach(function(a){
        a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + s.waNumber);
      });
    }
    // Homepage hero texts (first slide caption)
    if (s.heroTitle){
      var h = document.querySelector('.slide.on .cap h2') || document.querySelector('.cap h2');
      if (h) h.textContent = s.heroTitle;
    }
    if (s.heroSub){
      var t = document.querySelector('.slide.on .cap .tag') || document.querySelector('.cap .tag');
      if (t) t.textContent = s.heroSub;
    }
    // Announcement banner
    if (s.announcement && !document.getElementById('rmAnnounce')){
      var b = document.createElement('div');
      b.id = 'rmAnnounce';
      b.style.cssText = 'background:#c9a227;color:#fff;text-align:center;font-weight:600;font-size:.92rem;padding:10px 14px;letter-spacing:.02em';
      b.textContent = s.announcement;
      document.body.prepend(b);
    }
  }

  fetch(FEED).then(function(r){ return r.json(); }).then(function(d){
    if (d.rooms && d.rooms.length) applyRooms(d.rooms);
    if (d.settings) applySettings(d.settings);
  }).catch(function(){ /* static fallback */ });
})();
