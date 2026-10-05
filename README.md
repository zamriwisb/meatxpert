# MEATXPERT — website designs

Two website designs for MEATXPERT, Premium Butcher, Shah Alam. Open `index.html` to choose
between them.

| | Design | Folder |
|---|---|---|
| Option 1 | Market Hall: the whole range on screen, with filters down the side | `version-g/` |
| Option 2 | Storefront: a full-width slider and a scrolling row of products | `version-f/` |

Each design has five pages: homepage, product (`product.html?p=tomahawk`), cart,
checkout and order received. You can browse, add products to the cart and go through
checkout; no order is sent and no payment is taken.

Prices, pack sizes, delivery rates and the deal of the week are examples for the layout.

## Viewing

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8080
```

## Structure

```
index.html        the design selector
version-g/        Option 1 — Market Hall
version-f/        Option 2 — Storefront
assets/shop/      product catalogue, cart and checkout script, shop styles (shared)
assets/products/  product photographs (+ thumb/)
assets/cutouts/   hero images with the background removed
assets/brand/     logo and halal mark
assets/media/     videos and poster frames
```

## Notes for the WordPress build

- The product, cart, checkout and order-received markup follows WooCommerce's classic
  templates, including class names and field names, so `assets/shop/woo.css` can move
  into the theme.
- Use the classic `[woocommerce_cart]` and `[woocommerce_checkout]` shortcodes rather than
  the Cart and Checkout blocks, or these styles will not apply.
- Each product in `assets/shop/catalogue.js` maps to a variable product with a
  "Pack size" attribute.
