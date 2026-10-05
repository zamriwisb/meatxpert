/* ============================================================
   MEATXPERT — Version E "Butcher's House"
   1. Engraved illustrations  2. The beef chart
   3. Tabs and search by cut or meat code  4. Cart
   ============================================================ */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  var money = function (n) { return 'RM ' + n.toFixed(2); };

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  /* ----------------------------------------------------------
     1. Engraved illustrations
     The same silhouettes the other drafts use, but drawn the way
     a butchery manual would: hatched in sepia, cross-hatched into
     shadow, with the fat left as unprinted paper. Replace these
     with cut-out photography and the page still holds, though the
     engraving is the reason this direction looks old.
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

  var INK = '#3E2F1E';
  var FAT = '#FCF8EE';

  /* Fat strokes per 10,000 square pixels. Lower than the photographic
     drafts — hatching is already busy, so the marbling has to be
     sparser to stay legible as fat rather than noise. */
  var DENSITY = { 5: 26, 7: 48, 9: 78, 12: 122 };

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

  function engrave(host) {
    var cut = CUTS[host.getAttribute('data-cut')] || CUTS.ribeye;
    var marb = host.getAttribute('data-marb') || '7';
    var W = 320;
    var H = 230;

    var flecks = Math.round((DENSITY[marb] || DENSITY[7]) * (W * H) / 10000);
    var veins = Math.round(flecks * 0.2);

    var uid = 'e' + Math.round(rng() * 1e9);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    svg.setAttribute('aria-hidden', 'true');

    var defs = el('defs', {});
    var clip = el('clipPath', { id: 'clip' + uid });
    cut.shapes.forEach(function (d) { clip.appendChild(el('path', { d: d })); });
    defs.appendChild(clip);
    svg.appendChild(defs);

    var g = el('g', { 'clip-path': 'url(#clip' + uid + ')' });

    /* Paper, then the hatch, then the cross-hatch, then a highlight
       lifted off the top left so the shape reads as a solid. */
    g.appendChild(el('rect', { width: W, height: H, fill: '#F2E7D2' }));
    g.appendChild(el('rect', { width: W, height: H, fill: 'url(#hatch)' }));
    g.appendChild(el('rect', { width: W, height: H, fill: 'url(#hatch-cross)', opacity: '.42' }));
    g.appendChild(el('rect', { width: W, height: H, fill: 'url(#lift)' }));

    var i;
    for (i = 0; i < flecks + veins; i++) {
      var isVein = i >= flecks;
      g.appendChild(el('path', {
        d: marblePath(rng() * W, rng() * H, isVein ? 20 : 4, isVein ? 56 : 13, isVein ? 24 : 5),
        fill: 'none', stroke: FAT, 'stroke-linecap': 'round',
        'stroke-width': (isVein ? 2 + rng() * 2.2 : 2.2 + rng() * 2.4).toFixed(2),
        opacity: (0.84 + rng() * 0.16).toFixed(2)
      }));
    }

    (cut.seams || []).forEach(function (d) {
      g.appendChild(el('path', {
        d: d, fill: 'none', stroke: FAT,
        'stroke-width': 9, 'stroke-linecap': 'round'
      }));
      g.appendChild(el('path', {
        d: d, fill: 'none', stroke: INK,
        'stroke-width': 0.8, 'stroke-linecap': 'round', opacity: '.45'
      }));
    });

    svg.appendChild(g);

    (cut.bones || []).forEach(function (b) {
      svg.appendChild(el('circle', { cx: b[0], cy: b[1], r: 21, fill: FAT, stroke: INK, 'stroke-width': 1.4 }));
      svg.appendChild(el('circle', { cx: b[0], cy: b[1], r: 9, fill: 'none', stroke: '#8A6F4E', 'stroke-width': 1 }));
    });

    /* The plate line last, over everything, as an engraver would. */
    cut.shapes.forEach(function (d) {
      svg.appendChild(el('path', {
        d: d, fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'
      }));
    });

    host.innerHTML = '';
    host.appendChild(svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-cut]'), engrave);

  /* ----------------------------------------------------------
     2. The beef chart
     Choosing a primal lists what comes off it. The cuts are read
     from the counter below, so prices never diverge.
  ---------------------------------------------------------- */

  var PRIMALS = {
    chuck: { name: 'Chuck', desc: 'The shoulder. It works hard all its life, so it carries the most beef flavour of any primal — but it needs slicing thin or cooking long.' },
    rib: { name: 'Rib', desc: 'Between the shoulder and the loin, and the best marbled part of the animal. This is where a steak earns its price.' },
    loin: { name: 'Loin', desc: 'Along the back, barely worked. Every tender steak on the counter comes off this stretch.' },
    rump: { name: 'Rump', desc: 'Top of the hindquarter. Firm, lean and the cut most Malaysian kitchens are actually reaching for.' },
    round: { name: 'Round', desc: 'The outer hind leg. Very lean and a little sinewy, which is exactly what dendeng and serunding want.' },
    brisket: { name: 'Brisket', desc: 'The chest. Long grain and full of collagen, so give it hours and it turns to silk.' },
    shortrib: { name: 'Short rib', desc: 'The lower rib cage. Fatty, bone-in, and the reason a bone soup tastes of anything at all.' },
    flank: { name: 'Flank', desc: 'The belly wall. Coarse grain and a strong flavour — we only cut it to order.' }
  };

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-grid] .prod'));

  var regions = Array.prototype.slice.call(document.querySelectorAll('.rg[data-primal]'));
  var panelName = document.querySelector('[data-panel-name]');
  var panelDesc = document.querySelector('[data-panel-desc]');
  var panelCuts = document.querySelector('[data-panel-cuts]');

  function selectPrimal(key) {
    var info = PRIMALS[key];
    if (!info) return;

    regions.forEach(function (r) {
      r.classList.toggle('is-on', r.getAttribute('data-primal') === key);
    });

    panelName.textContent = info.name;
    panelDesc.textContent = info.desc;

    var matching = cards.filter(function (c) { return c.getAttribute('data-primal') === key; });

    if (!matching.length) {
      panelCuts.innerHTML = '<p class="panel-none">Nothing off this primal is on the counter today.</p>';
      return;
    }

    panelCuts.innerHTML = matching.map(function (c) {
      return '' +
        '<div class="panel-row" data-id="' + c.getAttribute('data-id') + '"' +
          ' data-name="' + c.getAttribute('data-name') + '"' +
          ' data-price="' + c.getAttribute('data-price') + '"' +
          ' data-unit="' + c.getAttribute('data-unit') + '">' +
          '<span class="panel-code">' + c.getAttribute('data-code') + '</span>' +
          '<span class="panel-name">' + c.getAttribute('data-name') + '</span>' +
          '<span class="panel-price">RM ' + c.getAttribute('data-price') + '</span>' +
          '<button class="btn btn-red btn-sm" data-add>Add</button>' +
        '</div>';
    }).join('');
  }

  regions.forEach(function (r) {
    r.addEventListener('click', function () { selectPrimal(r.getAttribute('data-primal')); });
    r.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPrimal(r.getAttribute('data-primal'));
      }
    });
  });

  if (regions.length) selectPrimal('rib');

  /* ----------------------------------------------------------
     3. Filtering — by tab, and by cut name or meat code
  ---------------------------------------------------------- */

  var tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab[data-cat]'));
  var emptyMsg = document.querySelector('[data-grid-empty]');
  var state = { cat: 'all', term: '' };

  /* The haystack deliberately leaves out price and weight — otherwise
     searching the meat code 45 also returns everything priced RM 145. */
  var haystacks = cards.map(function (card) {
    var name = card.querySelector('.prod-h');
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

  var KEY = 'meatxpert-e';
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
      body.innerHTML = '<p class="cart-empty">Your cart is empty. Start at the chart if you are not sure which cut you want.</p>';
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
