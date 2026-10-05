/* ============================================================
   Meat Expert — Version A
   1. Marbling generator  2. BMS rail  3. Basket
   ============================================================ */

(function () {
  'use strict';

  var money = function (n) {
    return 'RM ' + n.toFixed(2);
  };

  /* ----------------------------------------------------------
     1. Marbling
     Intramuscular fat drawn as short strokes inside the ribeye
     clip path. Strokes are bucketed into BMS tiers so raising
     the score reveals a denser layer instead of redrawing.
     A fixed seed keeps the steak identical on every load.
  ---------------------------------------------------------- */

  var SEED = 20260918;
  function rng() {
    SEED = (SEED * 1103515245 + 12345) % 2147483648;
    return SEED / 2147483648;
  }

  /* A cut face is mostly short flecks of intramuscular fat with a
     few longer veins running through them, not parallel streaks. */
  var TIERS = [
    { cls: 'm5',  flecks: 90,  veins: 20 },
    { cls: 'm7',  flecks: 130, veins: 26 },
    { cls: 'm9',  flecks: 200, veins: 34 },
    { cls: 'm12', flecks: 300, veins: 44 }
  ];

  function fleck(cx, cy) {
    var angle = rng() * Math.PI;
    var len = 4 + rng() * 9;
    var dx = Math.cos(angle) * len / 2;
    var dy = Math.sin(angle) * len / 2;
    var bow = (rng() - 0.5) * 5;

    return 'M ' + (cx - dx).toFixed(1) + ' ' + (cy - dy).toFixed(1) +
           ' Q ' + (cx - dy * 0.4 + bow).toFixed(1) + ' ' + (cy + dx * 0.4 + bow).toFixed(1) +
           ' ' + (cx + dx).toFixed(1) + ' ' + (cy + dy).toFixed(1);
  }

  function vein(cx, cy) {
    var angle = rng() * Math.PI;
    var len = 20 + rng() * 42;
    var dx = Math.cos(angle) * len / 2;
    var dy = Math.sin(angle) * len / 2;
    var bow = (rng() - 0.5) * 26;

    return 'M ' + (cx - dx).toFixed(1) + ' ' + (cy - dy).toFixed(1) +
           ' Q ' + (cx - dy * 0.35 + bow).toFixed(1) + ' ' + (cy + dx * 0.35 + bow).toFixed(1) +
           ' ' + (cx + dx).toFixed(1) + ' ' + (cy + dy).toFixed(1);
  }

  function buildMarbling(host) {
    if (!host) return;
    var NS = 'http://www.w3.org/2000/svg';
    var frag = document.createDocumentFragment();

    TIERS.forEach(function (tier) {
      var jobs = [];
      var i;
      for (i = 0; i < tier.flecks; i++) jobs.push(fleck);
      for (i = 0; i < tier.veins; i++) jobs.push(vein);

      jobs.forEach(function (make) {
        var cx = 45 + rng() * 530;
        var cy = 55 + rng() * 420;

        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', make(cx, cy));
        path.setAttribute('stroke-width',
          (make === vein ? 0.9 + rng() * 1.3 : 1.3 + rng() * 1.9).toFixed(2));
        path.setAttribute('opacity', (0.5 + rng() * 0.5).toFixed(2));
        path.setAttribute('class', tier.cls);
        frag.appendChild(path);
      });
    });

    host.appendChild(frag);
  }

  buildMarbling(document.querySelector('[data-marbling]'));

  /* ----------------------------------------------------------
     2. BMS rail
  ---------------------------------------------------------- */

  var NOTES = {
    5:  'BMS 5 is the floor for wagyu labelling in Australia and roughly where US Prime tops out. Lean enough to cook like a normal steak: hot pan, rest, slice thick.',
    7:  'BMS 7 is our everyday Australian range. Enough fat to baste itself, still a steak you can eat a whole 350&nbsp;g of.',
    9:  'BMS 9 sits at Japanese A4. The fat starts melting near body temperature, which is why it feels wet on the tongue before it feels rich.',
    12: 'BMS 12 is the top of the scale &mdash; Kagoshima and Miyazaki A5. Portion it at 100&ndash;150&nbsp;g per person and sear it thin, or it becomes hard work.'
  };

  var steak = document.querySelector('.steak');
  var note = document.querySelector('[data-bms-note]');
  var railBtns = Array.prototype.slice.call(document.querySelectorAll('[data-bms-set]'));

  function setBms(score) {
    if (steak) steak.setAttribute('data-bms', score);
    if (note) note.innerHTML = NOTES[score] || '';
    railBtns.forEach(function (b) {
      var on = b.getAttribute('data-bms-set') === String(score);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  railBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      setBms(b.getAttribute('data-bms-set'));
    });
  });

  setBms('9');

  /* ----------------------------------------------------------
     3. Basket
  ---------------------------------------------------------- */

  var KEY = 'meat-expert-a';
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
    } catch (e) { /* private browsing — the basket just won't persist */ }
  }

  function subtotal() {
    return items.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
  }

  function render() {
    var total = subtotal();
    var units = items.reduce(function (n, it) { return n + it.qty; }, 0);

    countEl.textContent = units;
    totalEl.textContent = money(total);

    var pct = Math.min(100, (total / FREE_FROM) * 100);
    barEl.style.width = pct + '%';
    shipEl.innerHTML = total >= FREE_FROM
      ? 'Delivery is on us.'
      : 'Add ' + money(FREE_FROM - total) + ' for free delivery.';

    if (!items.length) {
      body.innerHTML = '<p class="cart-empty">Nothing in the basket yet. The counter is just below the hero.</p>';
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

  document.addEventListener('click', function (e) {
    var t = e.target;

    if (t.closest('[data-add]')) {
      var row = t.closest('[data-id]');
      if (!row) return;
      add(row);

      var btn = t.closest('[data-add]');
      var label = btn.textContent;
      btn.textContent = 'Added';
      btn.classList.add('is-done');
      setTimeout(function () {
        btn.textContent = label;
        btn.classList.remove('is-done');
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
      alert_free('Checkout is not wired up in this draft.');
    }
  });

  /* Keeps the draft honest without firing a blocking browser dialog. */
  function alert_free(msg) {
    var foot = document.querySelector('.cart-fine');
    if (!foot) return;
    var original = foot.textContent;
    foot.textContent = msg;
    setTimeout(function () { foot.textContent = original; }, 2200);
  }

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
      var msg = signup.querySelector('[data-signup-msg]');
      msg.textContent = 'You are on the list. The next note goes out Thursday.';
      signup.querySelector('input').value = '';
    });
  }
})();
