"""Stamp out the five pages of versions F and G from their partials.

Run from the project root:  python3 tools/build-pages.py

Each version has its own header, footer and homepage body in
tools/partials/<v>/. The product, cart, checkout and order-received
bodies are the same for both — the shared store.js fills them in —
so they live here. Edit the partials, not the generated HTML:
the next run overwrites version-f/*.html and version-g/*.html.

In WordPress the same split becomes header.php, footer.php,
front-page.php and the WooCommerce templates.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VERSIONS = {
    'g': {'name': 'Market Hall', 'store': 'meatxpert-g',
          'fonts': 'family=Anton&family=Poppins:wght@500;600;700&family=Nunito:wght@400;600;700;800'},
    'f': {'name': 'Storefront', 'store': 'meatxpert-f',
          'fonts': 'family=Anton&family=Poppins:wght@500;600;700&family=Nunito:wght@400;600;700;800'},
}

DESC = ('Premium beef and lamb from our own herd in Tanah Merah, Kelantan, cut and sold by MEATXPERT in '
        'Shah Alam. JAKIM halal certified. Delivery across the Klang Valley and Peninsular Malaysia.')

DRAWER = '''
<!-- ============ MINI-CART (woocommerce/cart/mini-cart.php) ============ -->
<div class="scrim" data-cart-scrim hidden></div>
<aside class="mx-drawer widget_shopping_cart" data-cart role="dialog" aria-modal="true" aria-labelledby="drawer-title" hidden>
  <header class="cart-head">
    <h2 id="drawer-title" data-drawer-title>Your cart</h2>
    <button class="cart-x" data-cart-close aria-label="Close">&times;</button>
  </header>
  <div class="cart-ship" data-cart-ship-wrap>
    <div class="cart-bar"><span data-cart-bar></span></div>
    <p data-cart-ship>Free Klang Valley delivery over RM 350.</p>
  </div>
  <div class="cart-body widget_shopping_cart_content" data-cart-body></div>
  <footer class="cart-foot" data-cart-foot>
    <p class="cart-sum woocommerce-mini-cart__total total"><span>Subtotal</span><strong data-cart-total>RM 0.00</strong></p>
    <p class="mx-mini-btns woocommerce-mini-cart__buttons buttons">
      <a href="cart.html" class="btn btn-line button wc-forward">View cart</a>
      <a href="checkout.html" class="btn btn-red button checkout wc-forward">Checkout</a>
    </p>
    <p class="cart-fine">Delivery is worked out at checkout.</p>
  </footer>
</aside>
'''


def steps(on):
    names = ['Cart', 'Checkout', 'Order complete']
    links = ['cart.html', 'checkout.html', None]
    out = []
    for i, n in enumerate(names):
        cls = 'is-on' if i == on else ('is-done' if i < on else '')
        label = f'<a href="{links[i]}"><span>{n}</span></a>' if i < on and links[i] else f'<span>{n}</span>'
        out.append(f'<li class="{cls}"' + (' aria-current="step"' if i == on else '') + f'>{label}</li>')
    return '<ol class="mx-steps" aria-label="Checkout progress">' + ''.join(out) + '</ol>'


def page_head(title, crumb, step=None):
    return f'''
  <header class="mx-page-head">
    <div>
      <nav class="woocommerce-breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span class="sep">/</span>{crumb}</nav>
      <h1 class="entry-title">{title}</h1>
    </div>
    {steps(step) if step is not None else ''}
  </header>'''


BODIES = {
    'product': ('single-product woocommerce woocommerce-page', 'Product', '''
  <div class="shell mx-page mx-page-product">
    <nav class="woocommerce-breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a></nav>
    <div class="woocommerce-notices-wrapper"></div>
    <div data-wc-product><p class="mx-muted">Loading&hellip;</p></div>
  </div>
'''),
    'cart': ('woocommerce-cart woocommerce-page', 'Cart', '''
  <div class="shell mx-page">''' + page_head('Cart', 'Cart', 0) + '''
    <div class="woocommerce">
      <div class="woocommerce-notices-wrapper"></div>
      <div data-wc-cart></div>
    </div>
  </div>
'''),
    'checkout': ('woocommerce-checkout woocommerce-page', 'Checkout', '''
  <div class="shell mx-page">''' + page_head('Checkout', '<a href="cart.html">Cart</a><span class="sep">/</span>Checkout', 1) + '''
    <div class="woocommerce">
      <div class="woocommerce-notices-wrapper"></div>
      <div data-wc-checkout></div>
    </div>
  </div>
'''),
    'received': ('woocommerce-checkout woocommerce-order-received woocommerce-page', 'Order received', '''
  <div class="shell mx-page">''' + page_head('Order received', 'Order received', 2) + '''
    <div class="woocommerce">
      <div class="woocommerce-notices-wrapper"></div>
      <div data-wc-received></div>
    </div>
  </div>
'''),
}

FILES = {'home': 'index.html', 'product': 'product.html', 'cart': 'cart.html',
         'checkout': 'checkout.html', 'received': 'order-received.html'}


def build(v, cfg):
    part = lambda n: open(os.path.join(ROOT, 'tools', 'partials', v, n + '.html')).read()
    header, footer = part('header'), part('footer')

    for page, fname in FILES.items():
        if page == 'home':
            body_class, title, body = 'home woocommerce-page', None, part('home')
            full_title = 'MEATXPERT — Premium Cut, Premium Meat. Malaysian butcher, Shah Alam.'
        else:
            body_class, title, body = BODIES[page]
            full_title = f'{title} — MEATXPERT'
        drawer = DRAWER if page in ('home', 'product') else ''
        app = '\n<script src="app.js"></script>' if page == 'home' else ''
        html = f'''<!DOCTYPE html>
<!-- Generated by tools/build-pages.py from tools/partials/{v}/ — edit those, not this file. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{full_title}</title>
<meta name="description" content="{DESC}">
<link rel="icon" href="../assets/brand/meatxpert-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{cfg['fonts']}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="../assets/shop/woo.css">
</head>
<body class="{body_class}" data-store="{cfg['store']}" data-assets="../assets/" data-page="{page}">

{header}
<main id="main">
{body}
</main>

{footer}
{drawer}
<script src="../assets/shop/catalogue.js"></script>
<script src="../assets/shop/store.js"></script>{app}
</body>
</html>
'''
        with open(os.path.join(ROOT, f'version-{v}', fname), 'w') as fh:
            fh.write(html)
        print(f'version-{v}/{fname}')


for v, cfg in VERSIONS.items():
    if os.path.exists(os.path.join(ROOT, 'tools', 'partials', v, 'home.html')):
        build(v, cfg)
