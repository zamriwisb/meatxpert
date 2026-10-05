/* ============================================================
   MEATXPERT — Version G "Market Hall", homepage only
   The cart, saved cuts and product cards come from the shared
   ../assets/shop/store.js; this file runs the homepage itself.
   1. The counter: category tiles, filter column, sort, search
   2. Hero slider  3. Deal countdown  4. Newsletter
   ============================================================ */

(function () {
  'use strict';

  var C = MX.catalogue;
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. The counter
     Every filter narrows the same set, so a category, a use and
     a price band all apply together.
  ---------------------------------------------------------- */

  var grid = document.querySelector('[data-grid]');
  grid.innerHTML = C.products.map(function (p) { return MX.card(p); }).join('');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));

  var gridEmpty = document.querySelector('[data-grid-empty]');
  var shownEl = document.querySelector('[data-shown]');
  var activeEl = document.querySelector('[data-active-label]');
  var sortSel = document.querySelector('[data-sort]');
  document.querySelector('[data-total]').textContent = C.products.length;

  var USE_NAMES = { pan: 'pan and rest', grill: 'grill and BBQ', slow: 'slow cook and braise', steamboat: 'steamboat and shabu' };
  var PRICE_NAMES = { lo: 'under RM 40', mid: 'RM 40 to RM 80', hi: 'RM 80 and above' };
  var band = function (n) { return n < 40 ? 'lo' : (n < 80 ? 'mid' : 'hi'); };

  var state = { cat: 'all', uses: [], price: null, term: '' };

  /* The haystack is the name and category only — not the price. */
  var rows = cards.map(function (card) {
    var p = C.get(card.getAttribute('data-id'));
    return {
      el: card, p: p,
      band: band(p.packs[0].price),
      text: (p.name + ' ' + C.cats[p.cat] + ' ' + p.cats.join(' ') + ' ' + (p.code || '')).toLowerCase()
    };
  });

  var counts = {};
  C.products.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });

  /* ---- category tiles, each with a photograph from the shelf ---- */
  var TILE_PHOTO = { steak: 'tomahawk-1.jpg', slow: 'short-ribs-1.jpg', lamb: 'lamb-rack-1.jpg',
    bbq: 'yakiniku-1.jpg', ready: 'beef-patties-1.jpg', pantry: 'beef-tallow-1.jpg' };
  var catRow = document.querySelector('[data-cats]');
  catRow.innerHTML = Object.keys(C.cats).map(function (k) {
    return '<button class="cat-tile" type="button" data-cat-tile="' + k + '" aria-pressed="false">' +
      '<span class="cat-img"><img src="' + MX.img(TILE_PHOTO[k], true) + '" alt="" width="640" height="480" loading="lazy"></span>' +
      '<span class="cat-name">' + C.cats[k] + '</span><span class="cat-count">' + counts[k] + ' cuts</span></button>';
  }).join('');
  var tiles = Array.prototype.slice.call(catRow.querySelectorAll('[data-cat-tile]'));

  /* ---- category buttons in the filter column ---- */
  var catSet = document.querySelector('[data-cat-filters]');
  catSet.insertAdjacentHTML('beforeend',
    '<button class="fbtn" data-cat="all" type="button" aria-pressed="true">All cuts <em>' + C.products.length + '</em></button>' +
    Object.keys(C.cats).map(function (k) {
      return '<button class="fbtn" data-cat="' + k + '" type="button" aria-pressed="false">' + C.cats[k] + ' <em>' + counts[k] + '</em></button>';
    }).join(''));

  var catButtons = Array.prototype.slice.call(document.querySelectorAll('.fbtn[data-cat]'));
  var useButtons = Array.prototype.slice.call(document.querySelectorAll('.fbtn[data-use]'));
  var priceButtons = Array.prototype.slice.call(document.querySelectorAll('.fbtn[data-price]'));

  function press(b, on) {
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function paint() {
    catButtons.forEach(function (b) { press(b, b.getAttribute('data-cat') === state.cat); });
    tiles.forEach(function (b) { press(b, b.getAttribute('data-cat-tile') === state.cat); });
    useButtons.forEach(function (b) { press(b, state.uses.indexOf(b.getAttribute('data-use')) > -1); });
    priceButtons.forEach(function (b) { press(b, b.getAttribute('data-price') === state.price); });
  }

  function label() {
    var parts = [];
    if (state.cat !== 'all') parts.push(C.cats[state.cat].toLowerCase());
    state.uses.forEach(function (u) { parts.push(USE_NAMES[u]); });
    if (state.price) parts.push(PRICE_NAMES[state.price]);
    if (state.term) parts.push('&ldquo;' + state.term.replace(/</g, '&lt;') + '&rdquo;');
    return parts.length ? parts.join(' &middot; ') : 'everything on the counter';
  }

  function apply() {
    var shown = 0;
    rows.forEach(function (row) {
      var ok =
        (state.cat === 'all' || row.p.cats.indexOf(state.cat) > -1) &&
        (!state.price || row.band === state.price) &&
        (!state.uses.length || state.uses.some(function (u) { return row.p.uses.indexOf(u) > -1; })) &&
        (!state.term || row.text.indexOf(state.term) > -1);
      row.el.hidden = !ok;
      if (ok) shown++;
    });
    gridEmpty.hidden = shown > 0;
    shownEl.textContent = shown;
    activeEl.innerHTML = label();
  }

  function setCat(k, scroll) {
    state.cat = k;
    paint(); apply();
    if (scroll) document.getElementById('shop').scrollIntoView({ block: 'start' });
  }

  catButtons.forEach(function (b) {
    b.addEventListener('click', function () { setCat(b.getAttribute('data-cat')); });
  });
  tiles.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-cat-tile');
      setCat(state.cat === k ? 'all' : k, true);
    });
  });
  useButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var use = b.getAttribute('data-use');
      var at = state.uses.indexOf(use);
      if (at > -1) { state.uses.splice(at, 1); } else { state.uses.push(use); }
      paint(); apply();
    });
  });
  priceButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.getAttribute('data-price');
      state.price = state.price === p ? null : p;
      paint(); apply();
    });
  });

  var input = document.querySelector('[data-search] input');
  document.querySelector('[data-clear]').addEventListener('click', function () {
    state = { cat: 'all', uses: [], price: null, term: '' };
    if (input) input.value = '';
    paint(); apply();
  });

  sortSel.addEventListener('change', function () {
    var how = sortSel.value;
    rows.slice().sort(function (a, b) {
      if (how === 'price-asc') return a.p.packs[0].price - b.p.packs[0].price;
      if (how === 'price-desc') return b.p.packs[0].price - a.p.packs[0].price;
      if (how === 'name') return a.p.name.localeCompare(b.p.name);
      return a.p.order - b.p.order;
    }).forEach(function (row) { grid.appendChild(row.el); });
  });

  var searchForm = document.querySelector('[data-search]');
  var sync = function () { state.term = input.value.trim().toLowerCase(); apply(); };
  searchForm.addEventListener('submit', function (e) {
    e.preventDefault();
    sync();
    document.getElementById('shop').scrollIntoView({ block: 'start' });
  });
  input.addEventListener('input', sync);

  /* Links from other pages arrive as #cat-lamb or ?q=picanha */
  function fromHash() {
    var m = /^#cat-(\w+)$/.exec(location.hash);
    if (m && C.cats[m[1]]) setCat(m[1], true);
  }
  window.addEventListener('hashchange', fromHash);
  var q = MX.param('q');
  if (q) { input.value = q; sync(); }

  paint();
  apply();
  fromHash();

  /* ----------------------------------------------------------
     2. Hero slider
     Advances on its own, but stops while the pointer or keyboard
     focus is inside it, and never starts under reduced motion.
  ---------------------------------------------------------- */

  var hero = document.querySelector('.hero');
  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-slide]'));
  var slideDots = document.querySelector('[data-slide-dots]');

  if (hero && slides.length > 1) {
    var current = 0;
    var timer = null;

    var dotButtons = slides.map(function (slide, i) {
      var b = document.createElement('button');
      b.className = 'dot';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Slide ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { goTo(i); restart(); });
      slideDots.appendChild(b);
      return b;
    });

    var goTo = function (i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.hidden = n !== current;
        s.classList.toggle('is-on', n === current);
      });
      dotButtons.forEach(function (b, n) {
        b.classList.toggle('is-on', n === current);
        b.setAttribute('aria-selected', n === current ? 'true' : 'false');
      });
    };

    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () {
      if (reduceMotion || timer) return;
      timer = setInterval(function () { goTo(current + 1); }, 6500);
    };
    var restart = function () { stop(); start(); };

    document.querySelector('[data-slide-prev]').addEventListener('click', function () { goTo(current - 1); restart(); });
    document.querySelector('[data-slide-next]').addEventListener('click', function () { goTo(current + 1); restart(); });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);

    goTo(0);
    start();
  }

  /* ----------------------------------------------------------
     3. Deal countdown — runs to the coming Sunday at midnight
  ---------------------------------------------------------- */

  var clock = document.querySelector('[data-clock]');
  if (clock) {
    var cd = clock.querySelector('[data-clock-d]');
    var ch = clock.querySelector('[data-clock-h]');
    var cm = clock.querySelector('[data-clock-m]');
    var cs = clock.querySelector('[data-clock-s]');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    var nextSunday = function () {
      var now = new Date();
      var days = (7 - now.getDay()) % 7 || 7;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days).getTime();
    };
    var target = nextSunday();

    var tick = function () {
      var left = target - Date.now();
      if (left <= 0) { target = nextSunday(); left = target - Date.now(); }
      var s = Math.floor(left / 1000);
      cd.textContent = pad(Math.floor(s / 86400));
      ch.textContent = pad(Math.floor(s / 3600) % 24);
      cm.textContent = pad(Math.floor(s / 60) % 60);
      cs.textContent = pad(s % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ----------------------------------------------------------
     4. Newsletter
  ---------------------------------------------------------- */

  var signup = document.querySelector('[data-signup]');
  if (signup) {
    signup.addEventListener('submit', function (e) {
      e.preventDefault();
      signup.querySelector('[data-signup-msg]').textContent =
        'Done. Use code MEATXPERT30 at checkout on any order over RM 250.';
      signup.querySelector('input').value = '';
    });
  }
})();
