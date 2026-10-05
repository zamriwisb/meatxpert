/* ============================================================
   MEATXPERT — the shared shop, used by versions F and G
   Cart, saved cuts, mini-cart drawer, and the four WooCommerce
   pages: single product, cart, checkout and order received.

   The markup each page writes follows WooCommerce's classic
   templates — class names, ids and field names included — so the
   CSS carries straight into a theme:
     single-product/*.php   cart/cart.php, cart/cart-totals.php
     checkout/form-checkout.php, checkout/review-order.php,
     checkout/payment.php   checkout/thankyou.php
   In WordPress the Cart and Checkout pages must use the classic
   [woocommerce_cart] / [woocommerce_checkout] shortcodes, not the
   block versions, for these styles to apply.

   Each page sets <body data-store data-assets data-page>.
   ============================================================ */

window.MX = (function () {
  'use strict';

  var C = window.MX_CATALOGUE;
  var body = document.body;
  var KEY = body.getAttribute('data-store') || 'meatxpert';
  var ASSETS = body.getAttribute('data-assets') || '../assets/';
  var PAGE = body.getAttribute('data-page') || 'home';

  /* ---- placeholders: the client's real rates go here ---- */
  var FREE_FROM = 350;
  var SHIPPING = [
    { id: 'flat_rate:1', label: 'Klang Valley delivery', cost: 15, free: true },
    { id: 'flat_rate:2', label: 'Peninsular Malaysia, cold-chain courier', cost: 30 },
    { id: 'local_pickup:3', label: 'Pick up at our Shah Alam shop', cost: 0 }
  ];
  var COUPONS = { meatxpert30: { amount: 30, min: 250 } };
  var PAYMENTS = [
    { id: 'onpay', label: 'Online banking (FPX), card or e-wallet',
      box: 'You will be taken to OnPay to pay securely with FPX online banking, a debit or credit card, or an e-wallet.' },
    { id: 'bacs', label: 'Direct bank transfer',
      box: 'Transfer to our account and use your order number as the reference. We pack your order once the payment clears.' },
    { id: 'cod', label: 'Pay at the shop on pickup',
      box: 'Cash, card or QR at the counter when you collect from Shah Alam. Only for orders you pick up.' }
  ];
  var STATES = [
    ['JHR', 'Johor'], ['KDH', 'Kedah'], ['KTN', 'Kelantan'], ['LBN', 'Labuan'], ['MLK', 'Melaka'],
    ['NSN', 'Negeri Sembilan'], ['PHG', 'Pahang'], ['PNG', 'Penang (Pulau Pinang)'], ['PRK', 'Perak'],
    ['PLS', 'Perlis'], ['SBH', 'Sabah'], ['SWK', 'Sarawak'], ['SGR', 'Selangor'], ['TRG', 'Terengganu'],
    ['PJY', 'Putrajaya'], ['KUL', 'Kuala Lumpur']
  ];

  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */

  function money(n) {
    return 'RM ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function amount(n) {
    return '<span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">RM</span>&nbsp;' +
      n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</bdi></span>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function img(file, thumb) { return ASSETS + 'products/' + (thumb ? 'thumb/' : '') + file; }
  function url(id) { return 'product.html?p=' + encodeURIComponent(id); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
  function load(k, fallback) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  }
  function store(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private browsing */ }
  }

  /* ----------------------------------------------------------
     Cart state
     Lines keep only the product id, the pack index and the
     quantity; names and prices are read from the catalogue so a
     price change never leaves a stale cart behind.
  ---------------------------------------------------------- */

  var cart = load(KEY + '-cart', null);
  if (!cart || !cart.items) cart = { items: [], coupon: null, ship: SHIPPING[0].id };
  cart.items = cart.items.filter(function (it) { return C.get(it.id) && C.get(it.id).packs[it.pack]; });

  var wished = load(KEY + '-wish', []).filter(function (id) { return C.get(id); });

  function saveCart() { store(KEY + '-cart', cart); paintHeader(); }
  function saveWish() { store(KEY + '-wish', wished); paintHeader(); }

  function line(it) {
    var p = C.get(it.id);
    var pack = p.packs[it.pack];
    return { key: it.id + '|' + it.pack, id: it.id, pack: it.pack, qty: it.qty,
      product: p, packLabel: pack.label, price: pack.price, total: pack.price * it.qty };
  }
  function lines() { return cart.items.map(line); }
  function count() { return cart.items.reduce(function (n, it) { return n + it.qty; }, 0); }
  function subtotal() { return lines().reduce(function (s, l) { return s + l.total; }, 0); }

  function add(id, pack, qty) {
    pack = pack || 0; qty = qty || 1;
    var found = cart.items.filter(function (it) { return it.id === id && it.pack === pack; })[0];
    if (found) { found.qty += qty; } else { cart.items.push({ id: id, pack: pack, qty: qty }); }
    saveCart();
  }
  function setQty(key, qty) {
    cart.items.forEach(function (it) { if (it.id + '|' + it.pack === key) it.qty = qty; });
    cart.items = cart.items.filter(function (it) { return it.qty > 0; });
    saveCart();
  }

  function discount(sub) {
    var c = cart.coupon && COUPONS[cart.coupon];
    if (!c) return 0;
    if (sub < c.min) return 0;
    return Math.min(c.amount, sub);
  }
  function shippingCost(method, sub) {
    var m = SHIPPING.filter(function (s) { return s.id === method; })[0] || SHIPPING[0];
    return m.free && sub >= FREE_FROM ? 0 : m.cost;
  }
  function totals() {
    var sub = subtotal();
    var off = discount(sub);
    var ship = shippingCost(cart.ship, sub);
    return { sub: sub, off: off, ship: ship, total: Math.max(0, sub - off + ship) };
  }

  /* ----------------------------------------------------------
     Header — cart count, running total, saved count
  ---------------------------------------------------------- */

  function paintHeader() {
    $$('[data-cart-count]').forEach(function (n) { n.textContent = count(); });
    $$('[data-cart-mini]').forEach(function (n) { n.textContent = money(subtotal()); });
    $$('[data-wish-count]').forEach(function (n) { n.textContent = wished.length; });
    $$('[data-wish]').forEach(function (b) {
      var on = wished.indexOf(b.getAttribute('data-wish')) > -1;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (drawer && !drawer.hidden) renderDrawer();
  }

  /* ----------------------------------------------------------
     Product card — the loop item, content-product.php
  ---------------------------------------------------------- */

  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.6-7-9.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7 3.1C19 15.4 12 20 12 20Z"/></svg>';

  function card(p, opts) {
    opts = opts || {};
    var pack = p.packs[0];
    var tag = opts.tag || 'article';
    return '' +
      '<' + tag + ' class="card product type-product product-type-' + (p.packs.length > 1 ? 'variable' : 'simple') + '"' +
        ' data-id="' + p.id + '" data-cat="' + p.cats.join(' ') + '" data-use="' + p.uses.join(' ') + '"' +
        ' data-price="' + pack.price + '" data-name="' + esc(p.name) + '" data-order="' + p.order + '">' +
        '<a class="card-vis woocommerce-LoopProduct-link" href="' + url(p.id) + '" tabindex="-1" aria-hidden="true">' +
          '<img class="card-img attachment-woocommerce_thumbnail" src="' + img(p.images[0], true) + '" alt="" width="640" height="480" loading="lazy">' +
          (p.code ? '<span class="chip">' + esc(p.code) + '</span>' : '') +
        '</a>' +
        '<p class="card-cat">' + C.cats[p.cat] + '</p>' +
        '<h3 class="card-h woocommerce-loop-product__title"><a href="' + url(p.id) + '">' + esc(p.name) + '</a></h3>' +
        '<p class="card-pr price">' + money(pack.price) + ' <span>' + esc(pack.label) + '</span></p>' +
        '<button class="btn btn-dark btn-sm button add_to_cart_button" type="button" data-add="' + p.id + '" data-pack="0">Add to cart</button>' +
        '<button class="wish" type="button" data-wish="' + p.id + '" aria-pressed="false" aria-label="Save ' + esc(p.name) + '">' + HEART + '</button>' +
      '</' + tag + '>';
  }

  /* ----------------------------------------------------------
     Mini-cart drawer — woocommerce/cart/mini-cart.php
     The same drawer lists saved cuts.
  ---------------------------------------------------------- */

  var drawer = $('[data-cart]');
  var scrim = $('[data-cart-scrim]');
  var mode = 'cart';
  var lastFocus = null;

  function renderDrawer() {
    var bodyEl = $('[data-cart-body]', drawer);
    var foot = $('[data-cart-foot]', drawer);
    var shipWrap = $('[data-cart-ship-wrap]', drawer);
    var sub = subtotal();

    $('[data-drawer-title]', drawer).textContent = mode === 'cart' ? 'Your cart' : 'Saved cuts';
    shipWrap.hidden = mode !== 'cart' || !cart.items.length;
    foot.hidden = mode !== 'cart' || !cart.items.length;

    $('[data-cart-bar]', drawer).style.width = Math.min(100, sub / FREE_FROM * 100) + '%';
    $('[data-cart-ship]', drawer).textContent = sub >= FREE_FROM
      ? 'Klang Valley delivery is on us.'
      : 'Add ' + money(FREE_FROM - sub) + ' more for free Klang Valley delivery.';
    $$('[data-cart-total]', drawer).forEach(function (n) { n.innerHTML = amount(sub); });

    if (mode === 'wish') {
      bodyEl.innerHTML = wished.length ? '<ul class="woocommerce-mini-cart cart_list product_list_widget">' + wished.map(function (id) {
        var p = C.get(id);
        return '<li class="line woocommerce-mini-cart-item mini_cart_item">' +
          '<a class="line-img" href="' + url(id) + '"><img src="' + img(p.images[0], true) + '" alt="" width="640" height="480"></a>' +
          '<div class="line-main"><a class="line-n" href="' + url(id) + '">' + esc(p.name) + '</a>' +
          '<div class="line-u">' + esc(p.packs[0].label) + ' &middot; ' + money(p.packs[0].price) + '</div>' +
          '<div class="line-ctl"><button class="btn btn-dark btn-sm" type="button" data-add="' + id + '" data-pack="0">Add to cart</button>' +
          '<button class="line-x" type="button" data-unwish="' + id + '">Remove</button></div></div></li>';
      }).join('') + '</ul>'
        : '<p class="cart-empty woocommerce-mini-cart__empty-message">Nothing saved yet. Tap the heart on a cut to keep it here for later.</p>';
      return;
    }

    if (!cart.items.length) {
      bodyEl.innerHTML = '<p class="cart-empty woocommerce-mini-cart__empty-message">No products in the cart.</p>' +
        '<p><a class="btn btn-dark btn-sm" href="index.html#shop">Browse the counter</a></p>';
      return;
    }

    bodyEl.innerHTML = '<ul class="woocommerce-mini-cart cart_list product_list_widget">' + lines().map(function (l) {
      return '<li class="line woocommerce-mini-cart-item mini_cart_item">' +
        '<a class="line-img" href="' + url(l.id) + '"><img src="' + img(l.product.images[0], true) + '" alt="" width="640" height="480"></a>' +
        '<div class="line-main">' +
          '<a class="line-n" href="' + url(l.id) + '">' + esc(l.product.name) + '</a>' +
          '<div class="line-u">' + esc(l.packLabel) + ' &middot; ' + money(l.price) + '</div>' +
          '<div class="line-ctl">' +
            '<button class="qty" type="button" data-step="-1" data-key="' + l.key + '" aria-label="One less ' + esc(l.product.name) + '">&minus;</button>' +
            '<span class="qty-n">' + l.qty + '</span>' +
            '<button class="qty" type="button" data-step="1" data-key="' + l.key + '" aria-label="One more ' + esc(l.product.name) + '">+</button>' +
            '<button class="line-x remove remove_from_cart_button" type="button" data-remove="' + l.key + '">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div class="line-p">' + money(l.total) + '</div>' +
      '</li>';
    }).join('') + '</ul>';
  }

  function openDrawer(which) {
    if (!drawer) { location.href = which === 'cart' ? 'cart.html' : 'index.html#shop'; return; }
    mode = which;
    lastFocus = document.activeElement;
    renderDrawer();
    drawer.hidden = false;
    scrim.hidden = false;
    document.body.style.overflow = 'hidden';
    $('[data-cart-close]', drawer).focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.hidden = true;
    scrim.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  /* ----------------------------------------------------------
     Clicks shared by every page
  ---------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var t = e.target;

    var addBtn = t.closest('[data-add]');
    if (addBtn) {
      add(addBtn.getAttribute('data-add'), parseInt(addBtn.getAttribute('data-pack') || '0', 10), 1);
      var text = addBtn.textContent;
      addBtn.textContent = 'Added';
      addBtn.classList.add('is-done', 'added');
      setTimeout(function () { addBtn.textContent = text; addBtn.classList.remove('is-done'); }, 1100);
      if (PAGE === 'cart') renderCartPage();
      return;
    }

    var wishBtn = t.closest('[data-wish]');
    if (wishBtn) {
      var wid = wishBtn.getAttribute('data-wish');
      var at = wished.indexOf(wid);
      if (at > -1) { wished.splice(at, 1); } else { wished.push(wid); }
      saveWish();
      return;
    }

    var unwish = t.closest('[data-unwish]');
    if (unwish) {
      wished = wished.filter(function (x) { return x !== unwish.getAttribute('data-unwish'); });
      saveWish();
      return;
    }

    if (t.closest('[data-cart-open]')) { e.preventDefault(); openDrawer('cart'); return; }
    if (t.closest('[data-wish-open]')) { e.preventDefault(); openDrawer('wish'); return; }
    if (t.closest('[data-cart-close]') || t.hasAttribute('data-cart-scrim')) { closeDrawer(); return; }

    var stepBtn = t.closest('[data-step]');
    if (stepBtn && stepBtn.hasAttribute('data-key')) {
      var key = stepBtn.getAttribute('data-key');
      var it = lines().filter(function (l) { return l.key === key; })[0];
      if (it) setQty(key, it.qty + parseInt(stepBtn.getAttribute('data-step'), 10));
      return;
    }

    var rm = t.closest('[data-remove]');
    if (rm) {
      e.preventDefault();
      setQty(rm.getAttribute('data-remove'), 0);
      if (PAGE === 'cart') renderCartPage();
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && !drawer.hidden) closeDrawer();
  });

  /* Away from the homepage, the header search sends you to the
     counter with the term filled in. */
  if (PAGE !== 'home') {
    $$('[data-search]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = form.querySelector('input').value.trim();
        location.href = 'index.html' + (q ? '?q=' + encodeURIComponent(q) : '') + '#shop';
      });
    });
  }

  /* ----------------------------------------------------------
     Shared fragments
  ---------------------------------------------------------- */

  function notice(type, html) {
    var wrap = $('.woocommerce-notices-wrapper');
    if (!wrap) return;
    wrap.innerHTML = '<div class="woocommerce-' + type + '" role="' + (type === 'error' ? 'alert' : 'status') + '">' + html + '</div>';
    if (type === 'error') wrap.scrollIntoView({ block: 'center' });
  }

  function freeBar(sub) {
    return '<div class="mx-free"><div class="cart-bar"><span style="width:' + Math.min(100, sub / FREE_FROM * 100) + '%"></span></div>' +
      '<p>' + (sub >= FREE_FROM ? 'Your order qualifies for <strong>free Klang Valley delivery</strong>.'
        : 'Add <strong>' + money(FREE_FROM - sub) + '</strong> more for free Klang Valley delivery.') + '</p></div>';
  }

  function shippingRows(sub, name) {
    return '<ul id="shipping_method" class="woocommerce-shipping-methods">' + SHIPPING.map(function (m, i) {
      var cost = m.free && sub >= FREE_FROM ? 0 : m.cost;
      var id = 'shipping_method_0_' + m.id.replace(/[^a-z0-9]/gi, '');
      return '<li><input type="radio" name="' + name + '" data-index="0" id="' + id + '" value="' + m.id + '" class="shipping_method"' +
        (cart.ship === m.id ? ' checked' : '') + '>' +
        '<label for="' + id + '">' + m.label + (cost ? ': ' + amount(cost) : (m.cost || m.free ? ': <strong>Free</strong>' : '')) + '</label></li>';
    }).join('') + '</ul>';
  }

  function couponRow(sub) {
    if (!cart.coupon) return '';
    var off = discount(sub);
    return '<tr class="cart-discount coupon-' + cart.coupon + '"><th>Coupon: ' + cart.coupon + '</th>' +
      '<td data-title="Coupon: ' + cart.coupon + '">' + (off ? '&minus;' + amount(off) : '<span class="mx-muted">Spend ' + money(COUPONS[cart.coupon].min) + ' to use</span>') +
      ' <a href="#" class="woocommerce-remove-coupon" data-remove-coupon>[Remove]</a></td></tr>';
  }

  function applyCoupon(code) {
    code = (code || '').trim().toLowerCase();
    if (!code) { notice('error', 'Please enter a coupon code.'); return false; }
    if (!COUPONS[code]) { notice('error', 'Coupon "' + esc(code) + '" does not exist!'); return false; }
    if (cart.coupon === code) { notice('error', 'Coupon code already applied!'); return false; }
    cart.coupon = code;
    saveCart();
    var min = COUPONS[code].min;
    notice('message', subtotal() >= min ? 'Coupon code applied successfully.'
      : 'Coupon saved. It takes ' + money(COUPONS[code].amount) + ' off once your subtotal reaches ' + money(min) + '.');
    return true;
  }

  function quantity(id, value, label) {
    return '<div class="quantity">' +
      '<button type="button" class="qty-btn minus" data-qty="-1" aria-label="Reduce quantity">&minus;</button>' +
      '<label class="screen-reader-text" for="' + id + '">' + esc(label) + ' quantity</label>' +
      '<input type="number" id="' + id + '" class="input-text qty text" name="quantity" value="' + value + '" min="1" max="99" step="1" inputmode="numeric" autocomplete="off">' +
      '<button type="button" class="qty-btn plus" data-qty="1" aria-label="Increase quantity">+</button>' +
    '</div>';
  }

  document.addEventListener('click', function (e) {
    var q = e.target.closest('[data-qty]');
    if (!q) return;
    var input = q.parentNode.querySelector('input.qty');
    var v = Math.max(parseInt(input.min || '0', 10), Math.min(99, (parseInt(input.value, 10) || 0) + parseInt(q.getAttribute('data-qty'), 10)));
    input.value = v;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ----------------------------------------------------------
     Single product — content-single-product.php
  ---------------------------------------------------------- */

  function renderProductPage() {
    var host = $('[data-wc-product]');
    if (!host) return;
    var p = C.get(param('p')) || C.products[0];
    var packIdx = 0;
    document.title = p.name + ' — MEATXPERT';

    var crumb = $('.woocommerce-breadcrumb');
    if (crumb) crumb.innerHTML = '<a href="index.html">Home</a><span class="sep">/</span><a href="index.html#shop">' +
      C.cats[p.cat] + '</a><span class="sep">/</span>' + esc(p.name);

    var related = C.products.filter(function (r) { return r.cat === p.cat && r.id !== p.id; }).slice(0, 4);
    if (related.length < 4) related = related.concat(C.products.filter(function (r) {
      return r.id !== p.id && related.indexOf(r) < 0 && r.uses.some(function (u) { return p.uses.indexOf(u) > -1; });
    }).slice(0, 4 - related.length));

    host.innerHTML = '' +
      '<div id="product-' + p.id + '" class="product type-product product-type-' + (p.packs.length > 1 ? 'variable' : 'simple') + '">' +
        '<div class="mx-product-top">' +
          '<div class="woocommerce-product-gallery images" data-gallery>' +
            '<div class="woocommerce-product-gallery__wrapper">' +
              '<div class="woocommerce-product-gallery__image"><img class="wp-post-image" data-main src="' + img(p.images[0]) + '" alt="' + esc(p.name) + '" width="1400" height="1050"></div>' +
            '</div>' +
            (p.images.length > 1 ? '<ol class="flex-control-nav flex-control-thumbs">' + p.images.map(function (f, i) {
              return '<li><button type="button" class="' + (i ? '' : 'flex-active') + '" data-thumb="' + img(f) + '" aria-label="Photo ' + (i + 1) + ' of ' + p.images.length + '">' +
                '<img src="' + img(f, true) + '" alt="" width="640" height="480"></button></li>';
            }).join('') + '</ol>' : '') +
          '</div>' +

          '<div class="summary entry-summary">' +
            '<p class="eyebrow">' + C.cats[p.cat] + (p.code ? ' &middot; Code ' + esc(p.code) : '') + '</p>' +
            '<h1 class="product_title entry-title">' + esc(p.name) + '</h1>' +
            '<p class="price" data-price>' + (p.was ? '<del aria-hidden="true">' + amount(p.was) + '</del> <ins>' + amount(p.packs[0].price) + '</ins>' : amount(p.packs[0].price)) + '</p>' +
            '<div class="woocommerce-product-details__short-description"><p>' + esc(p.short) + '</p></div>' +

            '<form class="variations_form cart" data-product-form novalidate>' +
              (p.packs.length > 1 ?
              '<table class="variations" role="presentation"><tbody><tr>' +
                '<th class="label"><label for="pa_pack-size">Pack size</label></th>' +
                '<td class="value">' +
                  '<select id="pa_pack-size" name="attribute_pa_pack-size" class="mx-hidden-select" tabindex="-1" aria-hidden="true">' +
                    p.packs.map(function (k, i) { return '<option value="' + i + '"' + (i ? '' : ' selected') + '>' + esc(k.label) + '</option>'; }).join('') +
                  '</select>' +
                  '<div class="mx-swatches" role="radiogroup" aria-label="Pack size">' + p.packs.map(function (k, i) {
                    return '<button type="button" role="radio" class="mx-swatch' + (i ? '' : ' is-on') + '" aria-checked="' + (i ? 'false' : 'true') + '" data-pack-btn="' + i + '">' +
                      '<span>' + esc(k.label) + '</span><b>' + money(k.price) + '</b></button>';
                  }).join('') + '</div>' +
                '</td></tr></tbody></table>'
              : '<p class="mx-pack-single">' + esc(p.packs[0].label) + '</p>') +
              '<div class="single_variation_wrap">' +
                '<div class="woocommerce-variation-add-to-cart variations_button">' +
                  quantity('quantity_' + p.id, 1, p.name) +
                  '<button type="submit" class="single_add_to_cart_button button alt btn btn-red">Add to cart</button>' +
                '</div>' +
              '</div>' +
            '</form>' +

            '<ul class="mx-promise">' +
              '<li><img src="' + ASSETS + 'brand/halal-jakim.png" alt="" width="40" height="40"><span><strong>JAKIM halal certified</strong>Certified to MS 1500</span></li>' +
              '<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg><span><strong>Free delivery over RM&nbsp;350</strong>Klang Valley, packed cold</span></li>' +
              '<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20H4z"/><path d="M9.5 20v-5h5v5"/></svg><span><strong>Or collect in Shah Alam</strong>Our shop in Seksyen 9</span></li>' +
            '</ul>' +

            '<div class="product_meta">' +
              '<span class="posted_in">Category: <a href="index.html#shop" rel="tag">' + C.cats[p.cat] + '</a></span>' +
              '<span class="tagged_as">Best for: ' + p.uses.map(function (u) { return C.uses[u]; }).join(', ') + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="woocommerce-tabs wc-tabs-wrapper">' +
          '<ul class="tabs wc-tabs" role="tablist">' +
            '<li class="description_tab active" role="presentation"><a href="#tab-description" role="tab" aria-selected="true" aria-controls="tab-description" data-tab>About this cut</a></li>' +
            '<li class="additional_information_tab" role="presentation"><a href="#tab-additional_information" role="tab" aria-selected="false" aria-controls="tab-additional_information" data-tab>Storage &amp; delivery</a></li>' +
            '<li class="reviews_tab" role="presentation"><a href="#tab-reviews" role="tab" aria-selected="false" aria-controls="tab-reviews" data-tab>Reviews (0)</a></li>' +
          '</ul>' +
          '<div class="woocommerce-Tabs-panel woocommerce-Tabs-panel--description panel entry-content wc-tab" id="tab-description" role="tabpanel">' +
            '<dl class="mx-cut-notes">' +
              '<div><dt>Where it comes from</dt><dd>' + esc(p.location) + '</dd></div>' +
              '<div><dt>What it is like</dt><dd>' + esc(p.character) + '</dd></div>' +
              '<div><dt>How to cook it</dt><dd>' + esc(p.cooking) + '</dd></div>' +
            '</dl>' +
          '</div>' +
          '<div class="woocommerce-Tabs-panel woocommerce-Tabs-panel--additional_information panel entry-content wc-tab" id="tab-additional_information" role="tabpanel" hidden>' +
            '<table class="woocommerce-product-attributes shop_attributes"><tbody>' +
              '<tr class="woocommerce-product-attributes-item"><th class="woocommerce-product-attributes-item__label">Pack size</th><td class="woocommerce-product-attributes-item__value">' + p.packs.map(function (k) { return esc(k.label); }).join(', ') + '</td></tr>' +
              '<tr class="woocommerce-product-attributes-item"><th class="woocommerce-product-attributes-item__label">Halal</th><td class="woocommerce-product-attributes-item__value">JAKIM certified</td></tr>' +
              '<tr class="woocommerce-product-attributes-item"><th class="woocommerce-product-attributes-item__label">Storage</th><td class="woocommerce-product-attributes-item__value">Keep frozen. Thaw in the chiller for 24 hours before cooking.</td></tr>' +
              '<tr class="woocommerce-product-attributes-item"><th class="woocommerce-product-attributes-item__label">Delivery</th><td class="woocommerce-product-attributes-item__value">Klang Valley and Peninsular Malaysia, or collect from our Shah Alam shop.</td></tr>' +
            '</tbody></table>' +
          '</div>' +
          '<div class="woocommerce-Tabs-panel woocommerce-Tabs-panel--reviews panel entry-content wc-tab" id="tab-reviews" role="tabpanel" hidden>' +
            '<div id="reviews" class="woocommerce-Reviews"><p class="woocommerce-noreviews">There are no reviews yet.</p>' +
            '<p class="mx-muted">Only customers who have bought this product may leave a review.</p></div>' +
          '</div>' +
        '</div>' +

        '<section class="related products">' +
          '<h2 class="sec-h">You may also like</h2>' +
          '<div class="products columns-4 mx-grid">' + related.map(function (r) { return card(r); }).join('') + '</div>' +
        '</section>' +
      '</div>';

    /* gallery */
    var main = $('[data-main]', host);
    $$('[data-thumb]', host).forEach(function (b) {
      b.addEventListener('click', function () {
        main.src = b.getAttribute('data-thumb');
        $$('[data-thumb]', host).forEach(function (x) { x.classList.toggle('flex-active', x === b); });
      });
    });

    /* pack size */
    var priceEl = $('[data-price]', host);
    var select = $('#pa_pack-size', host);
    $$('[data-pack-btn]', host).forEach(function (b) {
      b.addEventListener('click', function () {
        packIdx = parseInt(b.getAttribute('data-pack-btn'), 10);
        select.value = packIdx;
        $$('[data-pack-btn]', host).forEach(function (x) {
          var on = x === b;
          x.classList.toggle('is-on', on);
          x.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        priceEl.innerHTML = amount(p.packs[packIdx].price);
      });
    });

    /* add to cart */
    $('[data-product-form]', host).addEventListener('submit', function (e) {
      e.preventDefault();
      var qty = Math.max(1, Math.min(99, parseInt($('input.qty', host).value, 10) || 1));
      add(p.id, packIdx, qty);
      notice('message', '<a href="cart.html" tabindex="1" class="button wc-forward">View cart</a> ' +
        (qty > 1 ? qty + ' &times; ' : '') + '&ldquo;' + esc(p.name) + ' &ndash; ' + esc(p.packs[packIdx].label) + '&rdquo; ' +
        (qty > 1 ? 'have' : 'has') + ' been added to your cart.');
      $('.woocommerce-notices-wrapper').scrollIntoView({ block: 'nearest' });
    });

    /* tabs */
    $$('[data-tab]', host).forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        $$('[data-tab]', host).forEach(function (x) {
          var on = x === a;
          x.parentNode.classList.toggle('active', on);
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          $(x.getAttribute('href'), host).hidden = !on;
        });
      });
    });

    paintHeader();
  }

  /* ----------------------------------------------------------
     Cart — cart/cart.php and cart/cart-totals.php
  ---------------------------------------------------------- */

  function renderCartPage() {
    var host = $('[data-wc-cart]');
    if (!host) return;

    if (!cart.items.length) {
      host.innerHTML = '<div class="wc-empty-cart-message"><div class="cart-empty woocommerce-info" role="status">Your cart is currently empty.</div></div>' +
        '<p class="return-to-shop"><a class="button wc-backward btn btn-dark" href="index.html#shop">Return to shop</a></p>' +
        '<section class="cross-sells"><h2 class="sec-h">Popular at the counter</h2><div class="products columns-4 mx-grid">' +
        ['tomahawk', 'picanha', 'short-ribs', 'lamb-rack'].map(function (id) { return card(C.get(id)); }).join('') + '</div></section>';
      return;
    }

    var t = totals();
    var inCart = cart.items.map(function (it) { return it.id; });
    var cross = C.products.filter(function (p) { return inCart.indexOf(p.id) < 0; })
      .filter(function (p) { return ['bbq', 'ready', 'pantry'].indexOf(p.cat) > -1; }).slice(0, 4);

    host.innerHTML = '' +
      '<div class="mx-cart-layout">' +
      '<form class="woocommerce-cart-form" data-cart-form novalidate>' +
        freeBar(t.sub) +
        '<table class="shop_table shop_table_responsive cart woocommerce-cart-form__contents">' +
          '<thead><tr>' +
            '<th class="product-remove"><span class="screen-reader-text">Remove item</span></th>' +
            '<th class="product-thumbnail"><span class="screen-reader-text">Thumbnail image</span></th>' +
            '<th class="product-name">Product</th>' +
            '<th class="product-price">Price</th>' +
            '<th class="product-quantity">Quantity</th>' +
            '<th class="product-subtotal">Subtotal</th>' +
          '</tr></thead><tbody>' +
          lines().map(function (l, i) {
            return '<tr class="woocommerce-cart-form__cart-item cart_item">' +
              '<td class="product-remove"><a href="#" class="remove" data-remove="' + l.key + '" aria-label="Remove ' + esc(l.product.name) + ' from cart">&times;</a></td>' +
              '<td class="product-thumbnail"><a href="' + url(l.id) + '"><img src="' + img(l.product.images[0], true) + '" alt="" width="640" height="480"></a></td>' +
              '<td class="product-name" data-title="Product"><a href="' + url(l.id) + '">' + esc(l.product.name) + '</a>' +
                '<dl class="variation"><dt class="variation-Packsize">Pack size:</dt><dd class="variation-Packsize"><p>' + esc(l.packLabel) + '</p></dd></dl></td>' +
              '<td class="product-price" data-title="Price">' + amount(l.price) + '</td>' +
              '<td class="product-quantity" data-title="Quantity">' + quantity('quantity_' + i, l.qty, l.product.name).replace('min="1"', 'min="0" data-line="' + l.key + '"') + '</td>' +
              '<td class="product-subtotal" data-title="Subtotal">' + amount(l.total) + '</td>' +
            '</tr>';
          }).join('') +
          '<tr><td colspan="6" class="actions">' +
            '<div class="coupon">' +
              '<label for="coupon_code" class="screen-reader-text">Coupon:</label>' +
              '<input type="text" name="coupon_code" class="input-text" id="coupon_code" value="" placeholder="Coupon code">' +
              '<button type="submit" class="button btn btn-dark" name="apply_coupon" value="Apply coupon">Apply coupon</button>' +
            '</div>' +
            '<a class="mx-continue" href="index.html#shop">Continue shopping</a>' +
          '</td></tr>' +
        '</tbody></table>' +
      '</form>' +

      '<div class="cart-collaterals">' +
        '<div class="cart_totals">' +
          '<h2>Cart totals</h2>' +
          '<table class="shop_table shop_table_responsive"><tbody>' +
            '<tr class="cart-subtotal"><th>Subtotal</th><td data-title="Subtotal">' + amount(t.sub) + '</td></tr>' +
            couponRow(t.sub) +
            '<tr class="woocommerce-shipping-totals shipping"><th>Shipping</th><td data-title="Shipping">' +
              shippingRows(t.sub, 'shipping_method[0]') +
              '<p class="woocommerce-shipping-destination">Delivery rates are confirmed at checkout.</p></td></tr>' +
            '<tr class="order-total"><th>Total</th><td data-title="Total"><strong>' + amount(t.total) + '</strong></td></tr>' +
          '</tbody></table>' +
          '<div class="wc-proceed-to-checkout"><a href="checkout.html" class="checkout-button button alt wc-forward btn btn-red btn-full">Proceed to checkout</a></div>' +
          '<p class="mx-fine">Prices in Malaysian Ringgit. Frozen products are packed cold for delivery.</p>' +
        '</div>' +
      '</div>' +
      '</div>' +

      (cross.length ? '<section class="cross-sells"><h2 class="sec-h">You may be interested in&hellip;</h2><div class="products columns-4 mx-grid">' +
        cross.map(function (p) { return card(p); }).join('') + '</div></section>' : '');

    paintHeader();
  }

  function bindCartPage() {
    var host = $('[data-wc-cart]');
    if (!host) return;
    host.addEventListener('change', function (e) {
      if (e.target.matches('input.qty[data-line]')) {
        setQty(e.target.getAttribute('data-line'), Math.max(0, Math.min(99, parseInt(e.target.value, 10) || 0)));
        renderCartPage();
      } else if (e.target.matches('.shipping_method')) {
        cart.ship = e.target.value; saveCart(); renderCartPage();
      }
    });
    host.addEventListener('submit', function (e) {
      e.preventDefault();
      if (applyCoupon($('#coupon_code', host).value)) renderCartPage();
    });
    host.addEventListener('click', function (e) {
      if (e.target.closest('[data-remove-coupon]')) {
        e.preventDefault(); cart.coupon = null; saveCart();
        renderCartPage(); notice('message', 'Coupon has been removed.');
      }
    });
    renderCartPage();
  }

  /* ----------------------------------------------------------
     Checkout — checkout/form-checkout.php
  ---------------------------------------------------------- */

  var FIELDS = [
    ['first_name', 'First name', 'form-row-first', true, 'given-name'],
    ['last_name', 'Last name', 'form-row-last', true, 'family-name'],
    ['company', 'Company name', 'form-row-wide', false, 'organization'],
    ['country', 'Country / Region', 'form-row-wide', true, 'country'],
    ['address_1', 'Street address', 'form-row-wide', true, 'address-line1'],
    ['address_2', 'Apartment, suite, unit, etc.', 'form-row-wide', false, 'address-line2'],
    ['city', 'Town / City', 'form-row-wide', true, 'address-level2'],
    ['state', 'State', 'form-row-first', true, 'address-level1'],
    ['postcode', 'Postcode / ZIP', 'form-row-last', true, 'postal-code'],
    ['phone', 'Phone', 'form-row-wide', true, 'tel'],
    ['email', 'Email address', 'form-row-wide', true, 'email']
  ];

  function field(group, f) {
    var name = group + '_' + f[0];
    var req = f[3];
    var label = '<label for="' + name + '"' + (f[0] === 'address_2' ? ' class="screen-reader-text"' : '') + '>' + f[1] +
      (req ? '&nbsp;<abbr class="required" title="required">*</abbr>' : '&nbsp;<span class="optional">(optional)</span>') + '</label>';
    var input;
    if (f[0] === 'country') {
      input = '<strong>Malaysia</strong><input type="hidden" name="' + name + '" id="' + name + '" value="MY" class="country_to_state" readonly>';
    } else if (f[0] === 'state') {
      input = '<select name="' + name + '" id="' + name + '" class="state_select" autocomplete="' + f[4] + '" data-placeholder="Select an option…">' +
        '<option value="">Select an option…</option>' +
        STATES.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === 'SGR' ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select>';
    } else {
      var type = f[0] === 'email' ? 'email' : (f[0] === 'phone' ? 'tel' : 'text');
      input = '<input type="' + type + '" class="input-text" name="' + name + '" id="' + name + '" autocomplete="' + f[4] + '"' +
        (f[0] === 'address_1' ? ' placeholder="House number and street name"' : '') +
        (f[0] === 'address_2' ? ' placeholder="Apartment, suite, unit, etc. (optional)"' : '') + '>';
    }
    if (group === 'shipping' && (f[0] === 'phone' || f[0] === 'email')) return '';
    return '<p class="form-row ' + f[2] + (req ? ' validate-required' : '') + (f[0] === 'email' ? ' validate-email' : '') + (f[0] === 'phone' ? ' validate-phone' : '') +
      '" id="' + name + '_field" data-priority="">' + label + '<span class="woocommerce-input-wrapper">' + input + '</span></p>';
  }

  function slotOptions() {
    var out = ['<option value="">Earliest available</option>'];
    var d = new Date();
    for (var i = 1, n = 0; n < 6; i++) {
      var day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
      if (day.getDay() === 0) continue;               /* placeholder: closed on Sundays */
      var label = day.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
      out.push('<option>' + label + ', 10am – 2pm</option><option>' + label + ', 2pm – 6pm</option>');
      n++;
    }
    return out.join('');
  }

  function reviewTable() {
    var t = totals();
    return '<table class="shop_table woocommerce-checkout-review-order-table">' +
      '<thead><tr><th class="product-name">Product</th><th class="product-total">Subtotal</th></tr></thead><tbody>' +
      lines().map(function (l) {
        return '<tr class="cart_item"><td class="product-name">' +
          '<span class="mx-review-img"><img src="' + img(l.product.images[0], true) + '" alt="" width="640" height="480"><span class="mx-review-qty">' + l.qty + '</span></span>' +
          '<span class="mx-review-name">' + esc(l.product.name) + '&nbsp;<strong class="product-quantity">&times;&nbsp;' + l.qty + '</strong>' +
          '<dl class="variation"><dt class="variation-Packsize">Pack size:</dt><dd class="variation-Packsize"><p>' + esc(l.packLabel) + '</p></dd></dl></span></td>' +
          '<td class="product-total">' + amount(l.total) + '</td></tr>';
      }).join('') + '</tbody><tfoot>' +
      '<tr class="cart-subtotal"><th>Subtotal</th><td>' + amount(t.sub) + '</td></tr>' +
      couponRow(t.sub) +
      '<tr class="woocommerce-shipping-totals shipping"><th>Shipping</th><td data-title="Shipping">' + shippingRows(t.sub, 'shipping_method[0]') + '</td></tr>' +
      '<tr class="order-total"><th>Total</th><td><strong>' + amount(t.total) + '</strong></td></tr>' +
      '</tfoot></table>';
  }

  function renderCheckoutPage() {
    var host = $('[data-wc-checkout]');
    if (!host) return;

    if (!cart.items.length) {
      host.innerHTML = '<div class="woocommerce-info" role="status">Your cart is currently empty, so there is nothing to check out yet.</div>' +
        '<p class="return-to-shop"><a class="button wc-backward btn btn-dark" href="index.html#shop">Return to shop</a></p>';
      return;
    }

    host.innerHTML = '' +
      '<div class="woocommerce-form-coupon-toggle"><div class="woocommerce-info">Have a coupon? <a href="#" class="showcoupon" data-show-coupon>Click here to enter your code</a></div></div>' +
      '<form class="checkout_coupon woocommerce-form-coupon" data-coupon-form hidden>' +
        '<p>If you have a coupon code, please apply it below.</p>' +
        '<p class="form-row form-row-first"><label for="coupon_code" class="screen-reader-text">Coupon:</label><input type="text" name="coupon_code" class="input-text" placeholder="Coupon code" id="coupon_code"></p>' +
        '<p class="form-row form-row-last"><button type="submit" class="button btn btn-dark" name="apply_coupon">Apply coupon</button></p>' +
      '</form>' +

      '<form name="checkout" class="checkout woocommerce-checkout" data-checkout-form novalidate>' +
        '<div class="col2-set" id="customer_details">' +
          '<div class="col-1">' +
            '<div class="woocommerce-billing-fields"><h3>Billing details</h3>' +
              '<div class="woocommerce-billing-fields__field-wrapper">' + FIELDS.map(function (f) { return field('billing', f); }).join('') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="col-2">' +
            '<div class="woocommerce-shipping-fields">' +
              '<h3 id="ship-to-different-address"><label class="woocommerce-form__label woocommerce-form__label-for-checkbox checkbox">' +
                '<input id="ship-to-different-address-checkbox" class="woocommerce-form__input woocommerce-form__input-checkbox input-checkbox" type="checkbox" name="ship_to_different_address" value="1"> ' +
                '<span>Deliver to a different address?</span></label></h3>' +
              '<div class="shipping_address" hidden><div class="woocommerce-shipping-fields__field-wrapper">' +
                FIELDS.map(function (f) { return field('shipping', f); }).join('') + '</div></div>' +
            '</div>' +
            '<div class="woocommerce-additional-fields"><h3>Additional information</h3>' +
              '<div class="woocommerce-additional-fields__field-wrapper">' +
                '<p class="form-row form-row-wide" id="delivery_slot_field"><label for="delivery_slot">Delivery or pickup slot&nbsp;<span class="optional">(optional)</span></label>' +
                  '<span class="woocommerce-input-wrapper"><select name="delivery_slot" id="delivery_slot">' + slotOptions() + '</select></span></p>' +
                '<p class="form-row notes" id="order_comments_field"><label for="order_comments">Order notes&nbsp;<span class="optional">(optional)</span></label>' +
                  '<span class="woocommerce-input-wrapper"><textarea name="order_comments" class="input-text" id="order_comments" placeholder="Notes about your order, e.g. how thick to cut your steaks, or a landmark for the driver." rows="3"></textarea></span></p>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="mx-order-col">' +
          '<h3 id="order_review_heading">Your order</h3>' +
          '<div id="order_review" class="woocommerce-checkout-review-order">' +
            '<div data-review>' + reviewTable() + '</div>' +
            '<div id="payment" class="woocommerce-checkout-payment">' +
              '<ul class="wc_payment_methods payment_methods methods">' + PAYMENTS.map(function (m, i) {
                return '<li class="wc_payment_method payment_method_' + m.id + '">' +
                  '<input id="payment_method_' + m.id + '" type="radio" class="input-radio" name="payment_method" value="' + m.id + '"' + (i ? '' : ' checked') + '>' +
                  '<label for="payment_method_' + m.id + '">' + m.label + '</label>' +
                  '<div class="payment_box payment_method_' + m.id + '"' + (i ? ' hidden' : '') + '><p>' + m.box + '</p></div></li>';
              }).join('') + '</ul>' +
              '<div class="form-row place-order">' +
                '<div class="woocommerce-terms-and-conditions-wrapper">' +
                  '<div class="woocommerce-privacy-policy-text"><p>Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our <a href="#" class="woocommerce-privacy-policy-link">privacy policy</a>.</p></div>' +
                  '<p class="form-row validate-required" id="terms_field"><label class="woocommerce-form__label woocommerce-form__label-for-checkbox checkbox">' +
                    '<input type="checkbox" class="woocommerce-form__input woocommerce-form__input-checkbox input-checkbox" name="terms" id="terms"> ' +
                    '<span class="woocommerce-terms-and-conditions-checkbox-text">I have read and agree to the website <a href="#" class="woocommerce-terms-and-conditions-link">terms and conditions</a></span>&nbsp;<abbr class="required" title="required">*</abbr></label></p>' +
                '</div>' +
                '<button type="submit" class="button alt btn btn-red btn-full" name="woocommerce_checkout_place_order" id="place_order" value="Place order" data-place-order>Place order</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</form>';
  }

  function placeOrderLabel() {
    var b = $('[data-place-order]');
    if (b) b.textContent = 'Place order · ' + money(totals().total);
  }

  function bindCheckoutPage() {
    var host = $('[data-wc-checkout]');
    if (!host) return;
    renderCheckoutPage();
    placeOrderLabel();

    function refreshReview() {
      var r = $('[data-review]', host);
      if (r) r.innerHTML = reviewTable();
      placeOrderLabel();
    }

    host.addEventListener('click', function (e) {
      if (e.target.closest('[data-show-coupon]')) {
        e.preventDefault();
        var f = $('[data-coupon-form]', host);
        f.hidden = !f.hidden;
        if (!f.hidden) $('#coupon_code', f).focus();
      }
      if (e.target.closest('[data-remove-coupon]')) {
        e.preventDefault(); cart.coupon = null; saveCart(); refreshReview();
        notice('message', 'Coupon has been removed.');
      }
    });

    host.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('.shipping_method')) {
        cart.ship = t.value; saveCart(); refreshReview();
        /* pay-at-pickup only makes sense when collecting */
        var cod = $('#payment_method_cod', host);
        if (cod) {
          var pickup = t.value.indexOf('local_pickup') === 0;
          cod.disabled = !pickup;
          cod.closest('li').classList.toggle('is-disabled', !pickup);
          if (!pickup && cod.checked) { $('#payment_method_onpay', host).checked = true; $('#payment_method_onpay', host).dispatchEvent(new Event('change', { bubbles: true })); }
        }
      }
      if (t.name === 'payment_method') {
        $$('.payment_box', host).forEach(function (b) { b.hidden = !b.classList.contains('payment_method_' + t.value); });
      }
      if (t.id === 'ship-to-different-address-checkbox') {
        $('.shipping_address', host).hidden = !t.checked;
      }
      var row = t.closest('.form-row');
      if (row && row.classList.contains('woocommerce-invalid') && t.value) row.classList.remove('woocommerce-invalid', 'woocommerce-invalid-required-field');
    });

    /* pickup is not the default, so cash at the counter starts off */
    var cod0 = $('#payment_method_cod', host);
    if (cod0 && cart.ship.indexOf('local_pickup') !== 0) { cod0.disabled = true; cod0.closest('li').classList.add('is-disabled'); }

    host.addEventListener('submit', function (e) {
      e.preventDefault();
      var form = e.target;

      if (form.matches('[data-coupon-form]')) {
        if (applyCoupon($('#coupon_code', form).value)) { refreshReview(); form.hidden = true; }
        return;
      }

      var errors = [];
      var groups = ['billing'];
      if ($('#ship-to-different-address-checkbox', form).checked) groups.push('shipping');
      $$('.form-row', form).forEach(function (r) { r.classList.remove('woocommerce-invalid', 'woocommerce-invalid-required-field'); });

      groups.forEach(function (g) {
        FIELDS.forEach(function (f) {
          var input = $('#' + g + '_' + f[0], form);
          if (!input) return;
          var label = (g === 'billing' ? 'Billing ' : 'Shipping ') + f[1];
          var v = input.value.trim();
          var bad = '';
          if (f[3] && !v) bad = '<strong>' + label + '</strong> is a required field.';
          else if (f[0] === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) bad = '<strong>' + label + '</strong> is not a valid email address.';
          else if (f[0] === 'phone' && v && !/^[+\d][\d\s-]{7,}$/.test(v)) bad = '<strong>' + label + '</strong> is not a valid phone number.';
          else if (f[0] === 'postcode' && v && !/^\d{5}$/.test(v)) bad = '<strong>' + label + '</strong> is not a valid postcode.';
          if (bad) {
            errors.push('<li data-id="' + input.id + '"><a href="#' + input.id + '">' + bad + '</a></li>');
            input.closest('.form-row').classList.add('woocommerce-invalid', 'woocommerce-invalid-required-field');
          }
        });
      });
      if (!$('#terms', form).checked) {
        errors.push('<li data-id="terms"><a href="#terms">Please read and accept the terms and conditions to proceed with your order.</a></li>');
        $('#terms_field', form).classList.add('woocommerce-invalid');
      }

      if (errors.length) {
        var wrap = $('.woocommerce-notices-wrapper');
        wrap.innerHTML = '<ul class="woocommerce-error" role="alert">' + errors.join('') + '</ul>';
        wrap.scrollIntoView({ block: 'center' });
        return;
      }

      var data = {};
      $$('input, select, textarea', form).forEach(function (i) {
        if (i.type === 'radio' && !i.checked) return;
        if (i.type === 'checkbox') { data[i.name] = i.checked; return; }
        data[i.name] = i.tagName === 'SELECT' && i.selectedIndex > -1 ? i.options[i.selectedIndex].text : i.value;
      });

      var t = totals();
      var method = SHIPPING.filter(function (s) { return s.id === cart.ship; })[0];
      var pay = PAYMENTS.filter(function (m) { return m.id === data.payment_method; })[0];
      var order = {
        number: 1000 + Math.floor(Math.random() * 9000),
        date: new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
        lines: lines().map(function (l) { return { name: l.product.name, id: l.id, pack: l.packLabel, qty: l.qty, total: l.total }; }),
        totals: t, coupon: cart.coupon,
        shipping: method.label, payment: pay.label, paymentId: pay.id,
        fields: data
      };
      store(KEY + '-order', order);
      cart = { items: [], coupon: null, ship: cart.ship };
      saveCart();
      location.href = 'order-received.html?order=' + order.number;
    });
  }

  /* ----------------------------------------------------------
     Order received — checkout/thankyou.php
  ---------------------------------------------------------- */

  function renderReceivedPage() {
    var host = $('[data-wc-received]');
    if (!host) return;
    var o = load(KEY + '-order', null);

    if (!o) {
      host.innerHTML = '<div class="woocommerce-info" role="status">There is no recent order to show. Orders placed on this draft appear here.</div>' +
        '<p class="return-to-shop"><a class="button wc-backward btn btn-dark" href="index.html#shop">Return to shop</a></p>';
      return;
    }

    var f = o.fields;
    var addr = [f.billing_first_name + ' ' + f.billing_last_name, f.billing_company, f.billing_address_1, f.billing_address_2,
      f.billing_postcode + ' ' + f.billing_city, f.billing_state, 'Malaysia'].filter(function (x) { return x && x.trim(); }).map(esc).join('<br>');

    host.innerHTML = '' +
      '<div class="woocommerce-order">' +
        '<p class="woocommerce-notice woocommerce-notice--success woocommerce-thankyou-order-received">Thank you, ' + esc(f.billing_first_name) + '. Your order has been received.</p>' +
        '<ul class="woocommerce-order-overview woocommerce-thankyou-order-details order_details">' +
          '<li class="woocommerce-order-overview__order order">Order number: <strong>' + o.number + '</strong></li>' +
          '<li class="woocommerce-order-overview__date date">Date: <strong>' + esc(o.date) + '</strong></li>' +
          '<li class="woocommerce-order-overview__email email">Email: <strong>' + esc(f.billing_email) + '</strong></li>' +
          '<li class="woocommerce-order-overview__total total">Total: <strong>' + amount(o.totals.total) + '</strong></li>' +
          '<li class="woocommerce-order-overview__payment-method method">Payment method: <strong>' + esc(o.payment) + '</strong></li>' +
        '</ul>' +

        (o.paymentId === 'bacs' ? '<section class="woocommerce-bacs-bank-details"><h2 class="wc-bacs-bank-details-heading">Our bank details</h2>' +
          '<ul class="wc-bacs-bank-details order_details bacs_details"><li class="bank_name">Bank: <strong>To be confirmed</strong></li>' +
          '<li class="account_number">Account number: <strong>To be confirmed</strong></li>' +
          '<li class="reference">Reference: <strong>' + o.number + '</strong></li></ul></section>' : '') +

        '<ol class="mx-next">' +
          '<li><strong>We confirm by WhatsApp</strong>The counter checks your order and messages you on ' + esc(f.billing_phone) + '.</li>' +
          '<li><strong>We cut and pack</strong>Your order is weighed, packed cold and labelled.</li>' +
          '<li><strong>' + (o.shipping.indexOf('Pick up') === 0 ? 'Collect in Shah Alam' : 'Delivered cold') + '</strong>' +
            (f.delivery_slot && f.delivery_slot !== 'Earliest available' ? esc(f.delivery_slot) + '.' : 'At the earliest available slot.') + '</li>' +
        '</ol>' +

        '<section class="woocommerce-order-details">' +
          '<h2 class="woocommerce-order-details__title">Order details</h2>' +
          '<table class="woocommerce-table woocommerce-table--order-details shop_table order_details">' +
            '<thead><tr><th class="woocommerce-table__product-name product-name">Product</th><th class="woocommerce-table__product-table product-total">Total</th></tr></thead><tbody>' +
            o.lines.map(function (l) {
              return '<tr class="woocommerce-table__line-item order_item"><td class="woocommerce-table__product-name product-name">' +
                '<a href="' + url(l.id) + '">' + esc(l.name) + '</a> <strong class="product-quantity">&times;&nbsp;' + l.qty + '</strong>' +
                '<ul class="wc-item-meta"><li><strong class="wc-item-meta-label">Pack size:</strong> <p>' + esc(l.pack) + '</p></li></ul></td>' +
                '<td class="woocommerce-table__product-total product-total">' + amount(l.total) + '</td></tr>';
            }).join('') + '</tbody><tfoot>' +
            '<tr><th scope="row">Subtotal:</th><td>' + amount(o.totals.sub) + '</td></tr>' +
            (o.totals.off ? '<tr><th scope="row">Discount:</th><td>&minus;' + amount(o.totals.off) + '</td></tr>' : '') +
            '<tr><th scope="row">Shipping:</th><td>' + (o.totals.ship ? amount(o.totals.ship) : 'Free') + ' <small class="shipped_via">via ' + esc(o.shipping) + '</small></td></tr>' +
            '<tr><th scope="row">Payment method:</th><td>' + esc(o.payment) + '</td></tr>' +
            '<tr><th scope="row">Total:</th><td>' + amount(o.totals.total) + '</td></tr>' +
            (f.order_comments ? '<tr><th>Note:</th><td>' + esc(f.order_comments) + '</td></tr>' : '') +
            '</tfoot></table>' +
        '</section>' +

        '<section class="woocommerce-customer-details">' +
          '<h2 class="woocommerce-column__title">Billing address</h2>' +
          '<address>' + addr +
            '<p class="woocommerce-customer-details--phone">' + esc(f.billing_phone) + '</p>' +
            '<p class="woocommerce-customer-details--email">' + esc(f.billing_email) + '</p>' +
          '</address>' +
        '</section>' +
      '</div>';
  }

  /* ---------------------------------------------------------- */

  if (PAGE === 'product') renderProductPage();
  if (PAGE === 'cart') bindCartPage();
  if (PAGE === 'checkout') bindCheckoutPage();
  if (PAGE === 'received') renderReceivedPage();
  paintHeader();

  return {
    catalogue: C,
    card: card,
    money: money,
    img: img,
    url: url,
    param: param,
    add: add,
    paint: paintHeader
  };
})();
