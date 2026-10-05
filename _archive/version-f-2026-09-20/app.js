/* ============================================================
   MEATXPERT — Version F "Storefront"
   Built to the Ekommart home-8 reference.
   1. Cut-outs and painted swatches  2. Star ratings
   3. Hero slider  4. Product carousel, tabs and code search
   5. Deal countdown  6. Wishlist  7. Cart
   ============================================================ */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var money = function (n) { return 'RM ' + n.toFixed(2); };

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  var SEED = 20260920;
  function rng() {
    SEED = (SEED * 1103515245 + 12345) % 2147483648;
    return SEED / 2147483648;
  }

  /* ----------------------------------------------------------
     1. Cut-outs and painted swatches
     The reference puts every bottle on a painted brush stroke.
     Same idea here: a stroke of colour behind each cut, so a
     white product sits on something rather than floating.
  ---------------------------------------------------------- */

  var CUTS = {
    ribeye: {
      shapes: ['M 30 118 C 24 62 74 22 142 20 C 202 18 246 38 268 70 C 288 98 294 132 280 162 C 264 198 208 220 148 219 C 86 218 36 182 30 118 Z'],
      seams: ['M 26 106 C 84 164 176 162 240 112 C 262 95 278 85 298 78']
    },
    striploin: {
      shapes: ['M 26 96 C 26 64 56 48 96 46 L 222 41 C 262 39 290 58 290 92 L 290 152 C 290 186 262 204 222 204 L 94 204 C 54 204 26 186 26 152 Z'],
      seams: ['M 30 86 C 46 58 96 48 138 46 L 226 43 C 264 42 288 58 292 84']
    },
    tenderloin: {
      shapes: ['M 34 122 C 28 74 82 30 146 26 C 210 22 268 46 288 88 C 302 118 296 154 268 176 C 232 204 160 214 106 198 C 60 184 38 158 34 122 Z'],
      seams: []
    },
    rump: {
      shapes: ['M 36 84 C 46 48 92 28 148 26 C 210 24 266 48 282 92 C 296 130 278 178 226 198 C 176 217 100 210 66 176 C 40 150 30 114 36 84 Z'],
      seams: ['M 58 58 C 118 98 186 114 246 110 C 272 108 292 114 308 126']
    },
    shortrib: {
      shapes: ['M 30 58 C 30 42 42 34 62 34 L 258 34 C 278 34 290 44 290 60 L 290 172 C 290 188 278 198 258 198 L 62 198 C 42 198 30 188 30 172 Z'],
      seams: [],
      bones: [[86, 116], [160, 116], [234, 116]]
    },
    cube: {
      shapes: [
        'M 30 54 C 30 42 40 34 54 34 L 126 34 C 140 34 150 42 150 54 L 150 108 C 150 120 140 128 126 128 L 54 128 C 40 128 30 120 30 108 Z',
        'M 172 40 C 172 28 182 20 196 20 L 270 20 C 284 20 294 28 294 40 L 294 104 C 294 116 284 124 270 124 L 196 124 C 182 124 172 116 172 104 Z',
        'M 104 166 C 104 154 114 146 128 146 L 208 146 C 222 146 232 154 232 166 L 232 208 C 232 220 222 228 208 228 L 128 228 C 114 228 104 220 104 208 Z'
      ],
      seams: []
    }
  };

  var DENSITY = { 5: 26, 7: 52, 9: 88, 12: 142 };

  function marblePath(cx, cy, min, max, bowScale) {
    var angle = rng() * Math.PI;
    var len = min + rng() * (max - min);
    var dx = Math.cos(angle) * len / 2;
    var dy = Math.sin(angle) * len / 2;
    var bow = (rng() - 0.5) * bowScale;

    return 'M ' + (cx - dx).toFixed(1) + ' ' + (cy - dy).toFixed(1) +
           ' Q ' + (cx - dy * 0.4 + bow).toFixed(1) + ' ' + (cy + dx * 0.4 + bow).toFixed(1) +
           ' ' + (cx + dx).toFixed(1) + ' ' + (cy + dy).toFixed(1);
  }

  function cutout(host) {
    var cut = CUTS[host.getAttribute('data-cut')] || CUTS.ribeye;
    var marb = host.getAttribute('data-marb') || '7';
    var W = 320;
    var H = 230;

    var flecks = Math.round((DENSITY[marb] || DENSITY[7]) * (W * H) / 10000);
    var veins = Math.round(flecks * 0.16);

    var uid = 'f' + Math.round(rng() * 1e9);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    svg.setAttribute('aria-hidden', 'true');

    var defs = el('defs', {});
    var clip = el('clipPath', { id: 'clip' + uid });
    cut.shapes.forEach(function (d) { clip.appendChild(el('path', { d: d })); });
    defs.appendChild(clip);

    var grad = el('radialGradient', { id: 'grad' + uid, cx: '40%', cy: '32%', r: '84%' });
    [['0%', '#E2727A'], ['46%', '#C4434C'], ['100%', '#96242C']].forEach(function (s) {
      grad.appendChild(el('stop', { offset: s[0], 'stop-color': s[1] }));
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    /* Warm grey edge under a white fat rim, so the cut separates on a
       painted swatch, a cream slide and a red one alike. */
    cut.shapes.forEach(function (d) {
      svg.appendChild(el('path', {
        d: d, fill: '#E2DAD1', stroke: '#E2DAD1',
        'stroke-width': 20, 'stroke-linejoin': 'round'
      }));
    });
    cut.shapes.forEach(function (d) {
      svg.appendChild(el('path', {
        d: d, fill: '#FDFBF8', stroke: '#FDFBF8',
        'stroke-width': 17, 'stroke-linejoin': 'round'
      }));
    });

    var g = el('g', { 'clip-path': 'url(#clip' + uid + ')' });
    g.appendChild(el('rect', { width: W, height: H, fill: 'url(#grad' + uid + ')' }));

    var i;
    for (i = 0; i < flecks + veins; i++) {
      var isVein = i >= flecks;
      g.appendChild(el('path', {
        d: marblePath(rng() * W, rng() * H, isVein ? 18 : 3, isVein ? 52 : 11, isVein ? 22 : 4),
        fill: 'none', stroke: '#FDF4EF', 'stroke-linecap': 'round',
        'stroke-width': (isVein ? 0.9 + rng() * 1.2 : 1.2 + rng() * 1.7).toFixed(2),
        opacity: (0.45 + rng() * 0.5).toFixed(2)
      }));
    }

    (cut.seams || []).forEach(function (d) {
      g.appendChild(el('path', {
        d: d, fill: 'none', stroke: '#FDF4EF',
        'stroke-width': 8, 'stroke-linecap': 'round', opacity: '.82'
      }));
    });

    svg.appendChild(g);

    (cut.bones || []).forEach(function (b) {
      svg.appendChild(el('circle', { cx: b[0], cy: b[1], r: 21, fill: '#FDF4EF' }));
      svg.appendChild(el('circle', { cx: b[0], cy: b[1], r: 9, fill: '#E7D3C6' }));
    });

    host.innerHTML = '';
    host.appendChild(svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-cut]'), cutout);

  var SWATCHES = [
    'M 10 44 C 62 24 128 50 188 36 C 246 22 306 44 352 30 L 350 96 C 300 112 244 88 186 102 C 126 116 64 92 12 108 Z',
    'M 14 34 C 70 52 120 22 180 34 C 240 46 298 20 348 40 L 344 102 C 292 84 240 110 180 98 C 122 86 66 112 16 94 Z',
    'M 8 40 C 74 18 130 56 196 42 C 254 30 304 56 352 38 L 348 100 C 296 118 248 84 194 96 C 132 110 70 88 12 104 Z'
  ];
  var SWATCH_COLOURS = ['#F1DCC6', '#E2DACB', '#F0D7D3', '#DDE2D4', '#F4E3CD', '#E7DCD2'];

  function swatch(card, i) {
    var vis = card.querySelector('.card-vis');
    if (!vis) return;

    var svg = el('svg', { viewBox: '0 0 360 130', preserveAspectRatio: 'none' });
    svg.setAttribute('aria-hidden', 'true');
    svg.appendChild(el('path', {
      d: SWATCHES[i % SWATCHES.length],
      fill: SWATCH_COLOURS[i % SWATCH_COLOURS.length]
    }));

    var holder = document.createElement('div');
    holder.className = 'swatch';
    holder.appendChild(svg);
    vis.insertBefore(holder, vis.firstChild);
  }

  /* ----------------------------------------------------------
     2. Star ratings
     Placeholder scores — these need real review data before the
     site goes live, the same as the quotes in the other drafts.
  ---------------------------------------------------------- */

  var STAR = 'M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z';

  function stars(card, i) {
    var score = parseFloat(card.getAttribute('data-rating')) || 0;
    var wrap = document.createElement('div');
    wrap.className = 'stars';
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', 'Rated ' + score + ' out of 5');

    for (var s = 1; s <= 5; s++) {
      var fill = score >= s ? 1 : (score >= s - 0.5 ? 0.5 : 0);
      var svg = el('svg', { viewBox: '0 0 24 24' });
      svg.setAttribute('aria-hidden', 'true');

      if (fill === 0.5) {
        var gid = 'half' + i + '-' + s;
        var defs = el('defs', {});
        var grad = el('linearGradient', { id: gid });
        grad.appendChild(el('stop', { offset: '50%', 'stop-color': '#E0A32B' }));
        grad.appendChild(el('stop', { offset: '50%', 'stop-color': '#E3DED6' }));
        defs.appendChild(grad);
        svg.appendChild(defs);
        svg.appendChild(el('path', { d: STAR, fill: 'url(#' + gid + ')' }));
      } else {
        svg.appendChild(el('path', { d: STAR, fill: fill ? '#E0A32B' : '#E3DED6' }));
      }
      wrap.appendChild(svg);
    }

    card.insertBefore(wrap, card.querySelector('.card-cat'));
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-rail] .card'));
  cards.forEach(function (card, i) {
    swatch(card, i);
    stars(card, i);
  });

  /* ----------------------------------------------------------
     3. Hero slider
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
     4. The carousel — tabs, code search, arrows and dots
  ---------------------------------------------------------- */

  var rail = document.querySelector('[data-rail]');
  var railDots = document.querySelector('[data-rail-dots]');
  var railEmpty = document.querySelector('[data-rail-empty]');
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab[data-cat]'));
  var state = { cat: 'all', term: '' };

  /* The haystack deliberately leaves out price and weight — otherwise
     searching the meat code 45 also returns everything priced RM 145. */
  var haystacks = cards.map(function (card) {
    var name = card.querySelector('.card-h');
    return {
      el: card,
      cat: card.getAttribute('data-cat'),
      code: (card.getAttribute('data-code') || '').toLowerCase(),
      text: ((name ? name.textContent : '') + ' ' + card.getAttribute('data-group')).toLowerCase()
    };
  });

  function step() {
    var visible = cards.filter(function (c) { return !c.hidden; });
    if (!visible.length) return 0;
    var gap = 20;
    return visible[0].getBoundingClientRect().width + gap;
  }

  function perView() {
    var s = step();
    return s ? Math.max(1, Math.round(rail.clientWidth / s)) : 1;
  }

  function buildDots() {
    if (!railDots) return;
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
        b.addEventListener('click', function () {
          rail.scrollLeft = page * perView() * step();
        });
        railDots.appendChild(b);
      })(p);
    }
    syncDots();
  }

  function syncDots() {
    if (!railDots) return;
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

  function applyFilter() {
    var shown = 0;

    haystacks.forEach(function (card) {
      var catOk = state.cat === 'all' || card.cat === state.cat;
      var termOk = !state.term ||
        card.code.indexOf(state.term) === 0 ||
        card.text.indexOf(state.term) > -1;
      var show = catOk && termOk;
      card.el.hidden = !show;
      if (show) shown++;
    });

    if (railEmpty) railEmpty.hidden = shown > 0;
    rail.scrollLeft = 0;
    buildDots();
  }

  tabButtons.forEach(function (tab) {
    tab.addEventListener('click', function () {
      state.cat = tab.getAttribute('data-cat');
      tabButtons.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      applyFilter();
    });
  });

  var railPrev = document.querySelector('[data-rail-prev]');
  var railNext = document.querySelector('[data-rail-next]');
  if (railPrev) railPrev.addEventListener('click', function () { rail.scrollLeft -= step() * perView(); });
  if (railNext) railNext.addEventListener('click', function () { rail.scrollLeft += step() * perView(); });

  rail.addEventListener('scroll', syncDots);
  window.addEventListener('resize', buildDots);
  buildDots();

  var searchForm = document.querySelector('[data-search]');
  if (searchForm) {
    var input = searchForm.querySelector('input');
    var sync = function () {
      state.term = input.value.trim().toLowerCase();
      applyFilter();
    };
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sync();
      document.getElementById('shop').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    input.addEventListener('input', sync);
  }

  /* ----------------------------------------------------------
     5. Deal countdown — runs to the coming Sunday at midnight
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
      var t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
      return t.getTime();
    };

    var target = nextSunday();

    var tick = function () {
      var left = target - Date.now();
      if (left <= 0) {
        target = nextSunday();
        left = target - Date.now();
      }
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
     6. Wishlist
     The reference carries a saved count in the header, so this
     one does too, and the drawer shows what is in it.
  ---------------------------------------------------------- */

  var WISH_KEY = 'meatxpert-f-wish';
  var HEART = 'M12 20s-7-4.6-7-9.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7 3.1C19 15.4 12 20 12 20Z';

  var wished = [];
  try {
    wished = JSON.parse(localStorage.getItem(WISH_KEY)) || [];
  } catch (e) {
    wished = [];
  }

  var wishCount = document.querySelector('[data-wish-count]');

  function saveWish() {
    try {
      localStorage.setItem(WISH_KEY, JSON.stringify(wished));
    } catch (e) { /* private browsing — saved cuts just won't persist */ }
  }

  function renderWishCount() {
    if (wishCount) wishCount.textContent = wished.length;
  }

  cards.forEach(function (card) {
    var id = card.getAttribute('data-id');
    var b = document.createElement('button');
    b.className = 'wish';
    b.type = 'button';
    b.setAttribute('data-wish', id);

    var svg = el('svg', { viewBox: '0 0 24 24' });
    svg.setAttribute('aria-hidden', 'true');
    svg.appendChild(el('path', { d: HEART }));
    b.appendChild(svg);

    var paint = function () {
      var on = wished.indexOf(id) > -1;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + card.getAttribute('data-name'));
    };

    b.addEventListener('click', function () {
      var at = wished.indexOf(id);
      if (at > -1) { wished.splice(at, 1); } else { wished.push(id); }
      saveWish();
      paint();
      renderWishCount();
    });

    paint();
    card.appendChild(b);
  });

  renderWishCount();

  /* ----------------------------------------------------------
     7. Cart — and the same drawer, reused for saved cuts
  ---------------------------------------------------------- */

  var KEY = 'meatxpert-f';
  var FREE_FROM = 350;

  var items = [];
  try {
    items = JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {
    items = [];
  }

  var drawer = document.querySelector('[data-cart]');
  var scrim = document.querySelector('[data-cart-scrim]');
  var body = document.querySelector('[data-cart-body]');
  var totalEl = document.querySelector('[data-cart-total]');
  var countEl = document.querySelector('[data-cart-count]');
  var miniEl = document.querySelector('[data-cart-mini]');
  var barEl = document.querySelector('[data-cart-bar]');
  var shipEl = document.querySelector('[data-cart-ship]');
  var shipWrap = document.querySelector('[data-cart-ship-wrap]');
  var footEl = document.querySelector('[data-cart-foot]');
  var titleEl = document.querySelector('[data-drawer-title]');
  var lastFocus = null;
  var mode = 'cart';

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) { /* private browsing — the cart just won't persist */ }
  }

  function subtotal() {
    return items.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
  }

  function renderCart() {
    var total = subtotal();

    countEl.textContent = items.reduce(function (n, it) { return n + it.qty; }, 0);
    totalEl.textContent = money(total);
    if (miniEl) miniEl.textContent = money(total);

    barEl.style.width = Math.min(100, (total / FREE_FROM) * 100) + '%';
    shipEl.textContent = total >= FREE_FROM
      ? 'Delivery is on us.'
      : 'Add ' + money(FREE_FROM - total) + ' for free delivery.';

    if (mode !== 'cart') return;

    if (!items.length) {
      body.innerHTML = '<p class="cart-empty">Your cart is empty. The counter above lists every cut with what it is actually good for.</p>';
      return;
    }

    body.innerHTML = items.map(function (it) {
      return '' +
        '<div class="line">' +
          '<div>' +
            '<div class="line-n">' + it.name + '</div>' +
            '<div class="line-u">' + it.unit + ' &middot; ' + money(it.price) + ' each</div>' +
            '<div class="line-ctl">' +
              '<button class="qty" data-step="-1" data-id="' + it.id + '" aria-label="One less ' + it.name + '">&minus;</button>' +
              '<span class="qty-n">' + it.qty + '</span>' +
              '<button class="qty" data-step="1" data-id="' + it.id + '" aria-label="One more ' + it.name + '">+</button>' +
              '<button class="line-x" data-remove="' + it.id + '">Remove</button>' +
            '</div>' +
          '</div>' +
          '<div class="line-p">' + money(it.price * it.qty) + '</div>' +
        '</div>';
    }).join('');
  }

  function renderWishList() {
    var saved = cards.filter(function (c) { return wished.indexOf(c.getAttribute('data-id')) > -1; });

    if (!saved.length) {
      body.innerHTML = '<p class="cart-empty">Nothing saved yet. Tap the heart on a cut to keep it here for later.</p>';
      return;
    }

    body.innerHTML = saved.map(function (c) {
      return '' +
        '<div class="line" data-id="' + c.getAttribute('data-id') + '"' +
          ' data-name="' + c.getAttribute('data-name') + '"' +
          ' data-price="' + c.getAttribute('data-price') + '"' +
          ' data-unit="' + c.getAttribute('data-unit') + '">' +
          '<div>' +
            '<div class="line-n">' + c.getAttribute('data-name') + '</div>' +
            '<div class="line-u">' + c.getAttribute('data-unit') + ' &middot; code ' + c.getAttribute('data-code') + '</div>' +
            '<div class="line-ctl">' +
              '<button class="btn btn-dark btn-sm" data-add>Add to cart</button>' +
              '<button class="line-x" data-unwish="' + c.getAttribute('data-id') + '">Remove</button>' +
            '</div>' +
          '</div>' +
          '<div class="line-p">RM ' + c.getAttribute('data-price') + '</div>' +
        '</div>';
    }).join('');
  }

  function openDrawer(which) {
    mode = which;
    lastFocus = document.activeElement;
    titleEl.textContent = which === 'cart' ? 'Your cart' : 'Saved cuts';
    shipWrap.hidden = which !== 'cart';
    footEl.hidden = which !== 'cart';

    if (which === 'cart') { renderCart(); } else { renderWishList(); }

    drawer.hidden = false;
    scrim.hidden = false;
    document.body.style.overflow = 'hidden';
    drawer.querySelector('[data-cart-close]').focus();
  }

  function closeDrawer() {
    drawer.hidden = true;
    scrim.hidden = true;
    document.body.style.overflow = '';
    mode = 'cart';
    if (lastFocus) lastFocus.focus();
  }

  function add(row) {
    var id = row.getAttribute('data-id');
    var found = items.filter(function (it) { return it.id === id; })[0];

    if (found) {
      found.qty += 1;
    } else {
      items.push({
        id: id,
        name: row.getAttribute('data-name'),
        price: parseFloat(row.getAttribute('data-price')),
        unit: row.getAttribute('data-unit'),
        qty: 1
      });
    }
    save();
    renderCart();
  }

  function flashFine(msg) {
    var foot = document.querySelector('.cart-fine');
    if (!foot) return;
    var original = foot.textContent;
    foot.textContent = msg;
    setTimeout(function () { foot.textContent = original; }, 2200);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;

    var addBtn = t.closest('[data-add]');
    if (addBtn) {
      var row = addBtn.closest('[data-id]');
      if (!row) return;
      add(row);

      var label = addBtn.textContent;
      addBtn.textContent = 'Added';
      addBtn.classList.add('is-done');
      setTimeout(function () {
        addBtn.textContent = label;
        addBtn.classList.remove('is-done');
      }, 1100);
      return;
    }

    if (t.closest('[data-cart-open]')) { openDrawer('cart'); return; }
    if (t.closest('[data-wish-open]')) { openDrawer('wish'); return; }
    if (t.closest('[data-cart-close]') || t.hasAttribute('data-cart-scrim')) { closeDrawer(); return; }

    var unwish = t.closest('[data-unwish]');
    if (unwish) {
      var uid = unwish.getAttribute('data-unwish');
      wished = wished.filter(function (x) { return x !== uid; });
      saveWish();
      renderWishCount();
      var heart = document.querySelector('[data-wish="' + uid + '"]');
      if (heart) {
        heart.classList.remove('is-on');
        heart.setAttribute('aria-pressed', 'false');
      }
      renderWishList();
      return;
    }

    var stepBtn = t.closest('[data-step]');
    if (stepBtn) {
      var sid = stepBtn.getAttribute('data-id');
      items.forEach(function (it) {
        if (it.id === sid) it.qty += parseInt(stepBtn.getAttribute('data-step'), 10);
      });
      items = items.filter(function (it) { return it.qty > 0; });
      save();
      renderCart();
      return;
    }

    var rm = t.closest('[data-remove]');
    if (rm) {
      var rid = rm.getAttribute('data-remove');
      items = items.filter(function (it) { return it.id !== rid; });
      save();
      renderCart();
      return;
    }

    if (t.closest('[data-checkout]')) {
      if (!items.length) return;
      flashFine('Checkout is not wired up in this draft.');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
  });

  renderCart();

  /* ----------------------------------------------------------
     Newsletter
  ---------------------------------------------------------- */

  var signup = document.querySelector('[data-signup]');
  if (signup) {
    signup.addEventListener('submit', function (e) {
      e.preventDefault();
      signup.querySelector('[data-signup-msg]').textContent =
        'Code MEATXPERT30 is on its way to your inbox.';
      signup.querySelector('input').value = '';
    });
  }
})();
