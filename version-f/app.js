/* ============================================================
   MEATXPERT — Version F "Storefront", homepage only
   Built to the Ekommart home-8 reference. The cart, saved cuts
   and product cards come from the shared ../assets/shop/store.js;
   this file runs the homepage itself.
   1. Product rail: tabs, search, arrows and dots
   2. Hero slider  3. Deal countdown  4. Newsletter
   ============================================================ */

(function () {
  'use strict';

  var C = MX.catalogue;
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. The rail
  ---------------------------------------------------------- */

  var rail = document.querySelector('[data-rail]');
  rail.innerHTML = C.products.map(function (p) { return MX.card(p); }).join('');
  var cards = Array.prototype.slice.call(rail.querySelectorAll('.card'));

  var railDots = document.querySelector('[data-rail-dots]');
  var railEmpty = document.querySelector('[data-rail-empty]');
  var tabsEl = document.querySelector('[data-tabs]');
  var state = { cat: 'all', term: '' };

  tabsEl.innerHTML = '<button class="tab is-on" role="tab" aria-selected="true" data-cat="all">All cuts</button>' +
    Object.keys(C.cats).map(function (k) {
      return '<button class="tab" role="tab" aria-selected="false" data-cat="' + k + '">' + C.cats[k] + '</button>';
    }).join('');
  var tabButtons = Array.prototype.slice.call(tabsEl.querySelectorAll('.tab'));

  /* The haystack is the name and category only — not the price. */
  var rows = cards.map(function (card) {
    var p = C.get(card.getAttribute('data-id'));
    return { el: card, p: p, text: (p.name + ' ' + C.cats[p.cat] + ' ' + (p.code || '')).toLowerCase() };
  });

  function step() {
    var visible = cards.filter(function (c) { return !c.hidden; });
    return visible.length ? visible[0].getBoundingClientRect().width + 20 : 0;
  }
  function perView() {
    var s = step();
    return s ? Math.max(1, Math.round(rail.clientWidth / s)) : 1;
  }

  function buildDots() {
    var visible = cards.filter(function (c) { return !c.hidden; }).length;
    var pages = Math.max(1, Math.ceil(visible / perView()));
    railDots.innerHTML = '';
    if (pages < 2) return;
    for (var p = 0; p < pages; p++) {
      (function (page) {
        var b = document.createElement('button');
        b.className = 'dot';
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Page ' + (page + 1) + ' of ' + pages);
        b.addEventListener('click', function () { rail.scrollLeft = page * perView() * step(); });
        railDots.appendChild(b);
      })(p);
    }
    syncDots();
  }

  function syncDots() {
    var dots = Array.prototype.slice.call(railDots.children);
    if (!dots.length) return;
    var s = step() * perView();
    var page = s ? Math.round(rail.scrollLeft / s) : 0;
    dots.forEach(function (d, i) {
      var on = i === Math.min(page, dots.length - 1);
      d.classList.toggle('is-on', on);
      d.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function apply() {
    var shown = 0;
    rows.forEach(function (row) {
      var ok = (state.cat === 'all' || row.p.cats.indexOf(state.cat) > -1) &&
        (!state.term || row.text.indexOf(state.term) > -1);
      row.el.hidden = !ok;
      if (ok) shown++;
    });
    railEmpty.hidden = shown > 0;
    rail.scrollLeft = 0;
    buildDots();
  }

  function setCat(k) {
    state.cat = k;
    tabButtons.forEach(function (t) {
      var on = t.getAttribute('data-cat') === k;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    apply();
  }

  tabButtons.forEach(function (tab) {
    tab.addEventListener('click', function () { setCat(tab.getAttribute('data-cat')); });
  });

  document.querySelector('[data-rail-prev]').addEventListener('click', function () { rail.scrollLeft -= step() * perView(); });
  document.querySelector('[data-rail-next]').addEventListener('click', function () { rail.scrollLeft += step() * perView(); });
  rail.addEventListener('scroll', syncDots);
  window.addEventListener('resize', buildDots);

  var searchForm = document.querySelector('[data-search]');
  var input = searchForm.querySelector('input');
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
    if (m && C.cats[m[1]]) {
      setCat(m[1]);
      document.getElementById('shop').scrollIntoView({ block: 'start' });
    }
  }
  window.addEventListener('hashchange', fromHash);
  var q = MX.param('q');
  if (q) { input.value = q; sync(); }

  apply();
  fromHash();

  /* ----------------------------------------------------------
     2. Hero slider
     Advances on its own, like the reference, but stops while the
     pointer or keyboard focus is inside it, and never starts at
     all if the visitor asked for reduced motion.
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
