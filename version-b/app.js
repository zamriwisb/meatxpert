/* ============================================================
   MEATXPERT — Version B
   1. Marbling swatches  2. Category tabs + search  3. Cart
   ============================================================ */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  var money = function (n) {
    return 'RM ' + n.toFixed(2);
  };

  /* ----------------------------------------------------------
     1. Marbling swatches
     Every product visual is a generated cut face. Stroke count
     tracks the marbling grade, so an A5 card reads visibly
     fattier than a grass-fed one without any photography.
  ---------------------------------------------------------- */

  var SEED = 20260918;
  function rng() {
    SEED = (SEED * 1103515245 + 12345) % 2147483648;
    return SEED / 2147483648;
  }

  /* Strokes per 10,000 square pixels, so a small hero thumbnail and a
     large card visual end up with the same fleck size, not the same count. */
  var DENSITY = { 5: 22, 7: 48, 9: 84, 12: 136 };

  function stroke(cx, cy, min, max, bowScale) {
    var angle = rng() * Math.PI;
    var len = min + rng() * (max - min);
    var dx = Math.cos(angle) * len / 2;
    var dy = Math.sin(angle) * len / 2;
    var bow = (rng() - 0.5) * bowScale;

    return 'M ' + (cx - dx).toFixed(1) + ' ' + (cy - dy).toFixed(1) +
           ' Q ' + (cx - dy * 0.4 + bow).toFixed(1) + ' ' + (cy + dx * 0.4 + bow).toFixed(1) +
           ' ' + (cx + dx).toFixed(1) + ' ' + (cy + dy).toFixed(1);
  }

  function swatch(host) {
    var w = Math.max(60, Math.round(host.clientWidth));
    var h = Math.max(48, Math.round(host.clientHeight));
    var grade = host.getAttribute('data-grade') || '7';
    var per = DENSITY[grade] || DENSITY[7];
    var flecks = Math.round(per * (w * h) / 10000);
    var veins = Math.round(flecks * 0.18);

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.width = '100%';
    svg.style.height = '100%';

    var gid = 'g' + Math.round(rng() * 1e9);
    var defs = document.createElementNS(NS, 'defs');
    var grad = document.createElementNS(NS, 'radialGradient');
    grad.setAttribute('id', gid);
    grad.setAttribute('cx', '40%');
    grad.setAttribute('cy', '34%');
    grad.setAttribute('r', '82%');
    [['0%', '#9E2630'], ['60%', '#7A1B22'], ['100%', '#571319']].forEach(function (s) {
      var stop = document.createElementNS(NS, 'stop');
      stop.setAttribute('offset', s[0]);
      stop.setAttribute('stop-color', s[1]);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    var bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', w);
    bg.setAttribute('height', h);
    bg.setAttribute('fill', 'url(#' + gid + ')');
    svg.appendChild(bg);

    var jobs = [];
    var i;
    for (i = 0; i < flecks; i++) jobs.push(false);
    for (i = 0; i < veins; i++) jobs.push(true);

    jobs.forEach(function (isVein) {
      var cx = rng() * w;
      var cy = rng() * h;
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', isVein
        ? stroke(cx, cy, 16, 46, 20)
        : stroke(cx, cy, 3, 10, 4));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#F2EDE3');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-width', (isVein ? 0.8 + rng() : 1.1 + rng() * 1.5).toFixed(2));
      path.setAttribute('opacity', (0.5 + rng() * 0.5).toFixed(2));
      svg.appendChild(path);
    });

    /* Fat cap along the bottom edge — what tells you this is a cut face. */
    var capY = h - Math.max(9, h * 0.13);
    var cap = document.createElementNS(NS, 'path');
    cap.setAttribute('d', 'M -2 ' + capY.toFixed(1) +
      ' C ' + (w * 0.3).toFixed(1) + ' ' + (capY - h * 0.07).toFixed(1) +
      ', ' + (w * 0.7).toFixed(1) + ' ' + (capY + h * 0.06).toFixed(1) +
      ', ' + (w + 2) + ' ' + (capY - h * 0.04).toFixed(1));
    cap.setAttribute('fill', 'none');
    cap.setAttribute('stroke', '#F2EDE3');
    cap.setAttribute('stroke-width', Math.max(5, h * 0.09).toFixed(1));
    cap.setAttribute('opacity', '.88');
    svg.appendChild(cap);

    host.appendChild(svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-vis]'), swatch);

  /* ----------------------------------------------------------
     2. Filtering
  ---------------------------------------------------------- */

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-grid] .prod'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-cat]'));
  var tabButtons = tabs.filter(function (el) { return el.classList.contains('tab'); });
  var emptyMsg = document.querySelector('[data-grid-empty]');
  var state = { cat: 'all', term: '' };

  function applyFilter() {
    var shown = 0;

    cards.forEach(function (card) {
      var catOk = state.cat === 'all' || card.getAttribute('data-cat') === state.cat;
      var termOk = !state.term ||
        card.textContent.toLowerCase().indexOf(state.term) > -1;
      var show = catOk && termOk;
      card.hidden = !show;
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
    var run = function (e) {
      if (e) e.preventDefault();
      state.term = input.value.trim().toLowerCase();
      applyFilter();
      if (state.term) {
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    searchForm.addEventListener('submit', run);
    input.addEventListener('input', function () {
      state.term = input.value.trim().toLowerCase();
      applyFilter();
    });
  }

  /* ----------------------------------------------------------
     3. Cart
  ---------------------------------------------------------- */

  var KEY = 'meat-expert-b';
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
    var units = items.reduce(function (n, it) { return n + it.qty; }, 0);

    countEl.textContent = units;
    totalEl.textContent = money(total);

    barEl.style.width = Math.min(100, (total / FREE_FROM) * 100) + '%';
    shipEl.textContent = total >= FREE_FROM
      ? 'Delivery is on us.'
      : 'Add ' + money(FREE_FROM - total) + ' for free delivery.';

    if (!items.length) {
      body.innerHTML = '<p class="cart-empty">Your cart is empty. Start with the counter above.</p>';
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
