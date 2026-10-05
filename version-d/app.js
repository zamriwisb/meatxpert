/* ============================================================
   MEATXPERT — Version D "The Index"
   1. Cut-outs (muted palette for a white page)
   2. The number rail — picking a number changes the featured cut
   3. Filtering by category, cut name or meat number
   4. Cart
   ============================================================ */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  var money = function (n) { return 'RM ' + n.toFixed(2); };

  /* ----------------------------------------------------------
     1. Cut-outs
     Stands in for the brand's cut-out product photography. Same
     silhouettes as version C, but desaturated and rimmed against
     a white page rather than a grey tile — on this page the meat
     is an object on a plinth, not a poster.
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

  /* Strokes per 10,000 square pixels of silhouette bounding box. */
  var DENSITY = { 5: 26, 7: 52, 9: 88, 12: 142 };

  var SEED = 20260920;
  function rng() {
    SEED = (SEED * 1103515245 + 12345) % 2147483648;
    return SEED / 2147483648;
  }

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

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function cutout(host) {
    var cut = CUTS[host.getAttribute('data-cut')] || CUTS.ribeye;
    var marb = host.getAttribute('data-marb') || '7';
    var W = 320;
    var H = 230;

    var flecks = Math.round((DENSITY[marb] || DENSITY[7]) * (W * H) / 10000);
    var veins = Math.round(flecks * 0.16);

    var uid = 'd' + Math.round(rng() * 1e9);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    svg.setAttribute('aria-hidden', 'true');

    var defs = el('defs', {});

    var clip = el('clipPath', { id: 'clip' + uid });
    cut.shapes.forEach(function (d) { clip.appendChild(el('path', { d: d })); });
    defs.appendChild(clip);

    var grad = el('radialGradient', { id: 'grad' + uid, cx: '40%', cy: '32%', r: '84%' });
    [['0%', '#DA8188'], ['46%', '#BC545E'], ['100%', '#8E3A43']].forEach(function (s) {
      grad.appendChild(el('stop', { offset: s[0], 'stop-color': s[1] }));
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    /* Fat rim, underneath. A warm grey edge first so the white fat
       still reads as an edge against a white page, then the fat. */
    cut.shapes.forEach(function (d) {
      svg.appendChild(el('path', {
        d: d, fill: '#E3DCD4', stroke: '#E3DCD4',
        'stroke-width': 20, 'stroke-linejoin': 'round'
      }));
    });
    cut.shapes.forEach(function (d) {
      svg.appendChild(el('path', {
        d: d, fill: '#FFFDFB', stroke: '#FFFDFB',
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
        fill: 'none', stroke: '#FFF7F4', 'stroke-linecap': 'round',
        'stroke-width': (isVein ? 0.9 + rng() * 1.2 : 1.2 + rng() * 1.7).toFixed(2),
        opacity: (0.34 + rng() * 0.44).toFixed(2)
      }));
    }

    (cut.seams || []).forEach(function (d) {
      g.appendChild(el('path', {
        d: d, fill: 'none', stroke: '#FFF7F4',
        'stroke-width': 8, 'stroke-linecap': 'round', opacity: '.8'
      }));
    });

    svg.appendChild(g);

    (cut.bones || []).forEach(function (b) {
      svg.appendChild(el('circle', { cx: b[0], cy: b[1], r: 21, fill: '#FFF7F4' }));
      svg.appendChild(el('circle', { cx: b[0], cy: b[1], r: 9, fill: '#EADCD2' }));
    });

    host.innerHTML = '';
    host.appendChild(svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-cut]'), cutout);

  /* ----------------------------------------------------------
     2. The number rail
     Every cut on the counter, listed by its meat number. The rail
     is built from the cards themselves so there is one source of
     truth for prices and specs.
  ---------------------------------------------------------- */

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-grid] .item'));

  /* 12 before 12W before 13 — sort on the numeric part first. */
  function codeOrder(code) {
    return parseInt(code, 10) * 10 + (/\D/.test(code) ? 1 : 0);
  }

  /* The counter is an index, so it is ordered by number rather than by
     the order the cards happen to sit in the markup. */
  var grid = document.querySelector('[data-grid]');
  if (grid) {
    cards.slice()
      .sort(function (a, b) {
        return codeOrder(a.getAttribute('data-code')) - codeOrder(b.getAttribute('data-code'));
      })
      .forEach(function (card) { grid.appendChild(card); });
  }

  var rail = document.querySelector('[data-rail]');
  var feat = document.querySelector('[data-feat]');
  var featCut = document.querySelector('[data-feat-cut]');
  var featName = document.querySelector('[data-feat-name]');
  var featSpec = document.querySelector('[data-feat-spec]');
  var featPrice = document.querySelector('[data-feat-price]');
  var featUnit = document.querySelector('[data-feat-unit]');
  var featAdd = document.querySelector('[data-feat-add]');

  if (rail && feat) {
    featAdd.setAttribute('data-add', '');

    var ordered = cards.slice().sort(function (a, b) {
      return codeOrder(a.getAttribute('data-code')) - codeOrder(b.getAttribute('data-code'));
    });

    var railButtons = ordered.map(function (card) {
      var b = document.createElement('button');
      b.className = 'rail-b';
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.textContent = card.getAttribute('data-code');
      b.setAttribute('aria-label', card.getAttribute('data-code') + ', ' + card.getAttribute('data-name'));
      b.addEventListener('click', function () { show(card, b); });
      rail.appendChild(b);
      return b;
    });

    var show = function (card, button) {
      var src = card.querySelector('.cutout');

      featCut.setAttribute('data-cut', src.getAttribute('data-cut'));
      featCut.setAttribute('data-marb', src.getAttribute('data-marb'));
      if (src.hasAttribute('data-flip')) {
        featCut.setAttribute('data-flip', '');
      } else {
        featCut.removeAttribute('data-flip');
      }
      cutout(featCut);

      featName.textContent = card.getAttribute('data-name');
      featSpec.innerHTML = card.querySelector('.spec').innerHTML;
      featPrice.textContent = 'RM ' + card.getAttribute('data-price');
      featUnit.textContent = card.querySelector('.wt').textContent;

      ['data-id', 'data-name', 'data-price', 'data-unit'].forEach(function (a) {
        feat.setAttribute(a, card.getAttribute(a));
      });

      railButtons.forEach(function (b) {
        var on = b === button;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    };

    show(ordered[0], railButtons[0]);
  }

  /* ----------------------------------------------------------
     3. Filtering — by category, and by cut name or meat number
  ---------------------------------------------------------- */

  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filt[data-cat]'));
  var emptyMsg = document.querySelector('[data-grid-empty]');
  var state = { cat: 'all', term: '' };

  /* The haystack deliberately leaves out price and weight — otherwise
     searching the number 45 also returns everything priced RM 145. */
  var haystacks = cards.map(function (card) {
    var name = card.querySelector('.item-h');
    var spec = card.querySelector('.spec');
    return {
      el: card,
      cat: card.getAttribute('data-cat'),
      code: (card.getAttribute('data-code') || '').toLowerCase(),
      text: ((name ? name.textContent : '') + ' ' + (spec ? spec.textContent : '')).toLowerCase()
    };
  });

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

    if (emptyMsg) emptyMsg.hidden = shown > 0;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      state.cat = button.getAttribute('data-cat');
      filterButtons.forEach(function (b) {
        var on = b === button;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      applyFilter();
    });
  });

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
     4. Cart
  ---------------------------------------------------------- */

  var KEY = 'meatxpert-d';
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
  var barEl = document.querySelector('[data-cart-bar]');
  var shipEl = document.querySelector('[data-cart-ship]');
  var lastFocus = null;

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) { /* private browsing — the cart just won't persist */ }
  }

  function subtotal() {
    return items.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
  }

  function render() {
    var total = subtotal();

    countEl.textContent = items.reduce(function (n, it) { return n + it.qty; }, 0);
    totalEl.textContent = money(total);

    barEl.style.width = Math.min(100, (total / FREE_FROM) * 100) + '%';
    shipEl.textContent = total >= FREE_FROM
      ? 'Delivery is on us.'
      : 'Add ' + money(FREE_FROM - total) + ' for free delivery.';

    if (!items.length) {
      body.innerHTML = '<p class="cart-empty">Your cart is empty. Every cut on the counter lists what it is actually good for.</p>';
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
    render();
  }

  function openCart() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    scrim.hidden = false;
    document.body.style.overflow = 'hidden';
    drawer.querySelector('[data-cart-close]').focus();
  }

  function closeCart() {
    drawer.hidden = true;
    scrim.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
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

    if (t.closest('[data-cart-open]')) { openCart(); return; }
    if (t.closest('[data-cart-close]') || t.hasAttribute('data-cart-scrim')) { closeCart(); return; }

    var step = t.closest('[data-step]');
    if (step) {
      var sid = step.getAttribute('data-id');
      items.forEach(function (it) {
        if (it.id === sid) it.qty += parseInt(step.getAttribute('data-step'), 10);
      });
      items = items.filter(function (it) { return it.qty > 0; });
      save();
      render();
      return;
    }

    var rm = t.closest('[data-remove]');
    if (rm) {
      var rid = rm.getAttribute('data-remove');
      items = items.filter(function (it) { return it.id !== rid; });
      save();
      render();
      return;
    }

    if (t.closest('[data-checkout]')) {
      if (!items.length) return;
      flashFine('Checkout is not wired up in this draft.');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) closeCart();
  });

  render();

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
