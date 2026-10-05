# MEATXPERT — homepage drafts

Homepage directions for MEATXPERT, a Malaysian butcher selling premium beef and wagyu.
Plain HTML, CSS and JavaScript. No build step, no dependencies. Open `index.html` to
compare them, or open any version directly.

```
index.html          the client selector: option G or option F               ← round 4
version-g/          "Market Hall" — homepage, product, cart, checkout, order received
version-f/          "Storefront" — homepage, product, cart, checkout, order received
assets/shop/        catalogue, cart/checkout engine and WooCommerce CSS shared by F and G
assets/products/    the client's product photographs, cropped to 4:3 (+ thumb/)
assets/brand/       the client's logo (trimmed) and the JAKIM halal mark
assets/media/       the client's two videos, compressed, with poster frames
tools/              scripts that build the assets and the F/G pages
_archive/           F, G and the old comparison page as they were before round 4
version-h/ … a/     earlier drafts, no longer linked from index.html
```

D, E and F all carry version C's content — the same cuts, codes, copy and sections.
D and E are the two premium directions, taken in opposite ways: D is premium by
restraint, E is premium by provenance. F is a separate exercise: the same content
fitted to the Ekommart home-8 theme the client sent as a reference.

G and H are both built from F and keep all of its machinery — the same twelve cuts, the
same generated cut-outs, the same cart, saved cuts and countdown. They pull the same
storefront in opposite directions: G merchandises it harder, H warms it up and slows it
down.

## Round 4 — F and G with the client's material (2026-10-05)

The client chose G and F to take forward and sent their raw files (`WEBSITE RAW FILES/`).
Both versions now run on that material and have the full WooCommerce page set.

**What came from the client and where it went**

- **41 products** — one per folder in `website jenis daging`, with their photographs
  (`tools/build-assets.py` crops each to 4:3 around the cut). They replace the twelve
  invented cuts and the generated SVG cut-outs. Data lives in `assets/shop/catalogue.js`.
- **Logo** — `LOGO MXP.png`, trimmed, in `assets/brand/`.
- **Company profile** (`PROFIL MX.pdf`) — real address, phone, email and socials; opened
  September 2019; cattle raised by the KEKAL cooperative at LSN Tanah Merah, Kelantan
  (132 head; Brahman, Charolais, Limousin, Black Angus, wagyu); JAKIM halal (MS 1500);
  supplies cafés, restaurants, hotels and caterers. These drive the new **Our farm**,
  **For businesses** and **Visit the shop** sections and the footer. The copyright line now
  names the operator, Koperasi Pendidikan Usahawan Berhad (D-5-0275), instead of the
  invented Sdn Bhd. Sales figures in the profile were left out on purpose.
- **Videos** — the brand film plays in Our farm; the vertical "Beli online" reel plays in
  Visit the shop. The reel shows they already use **OnPay**, so checkout offers it.
- Not used: the cooperative registration certificate, `MAKLUMAT KOPERASI.pdf` (a mineral
  water business of the same cooperative), the `.ai` and `.ARW` source files.
  `GAMBAR DAGING & PRODUK` was empty.

**Pages per version** — `index.html`, `product.html?p=<id>`, `cart.html`, `checkout.html`,
`order-received.html`. The flow works end to end: pack-size variations, quantity, mini-cart
drawer, coupon (`MEATXPERT30`: RM 30 off over RM 250), three shipping methods with free
Klang Valley delivery over RM 350, field validation with WooCommerce's own error notices,
payment choice, and an order-received page. Nothing is sent anywhere.

**Built to convert to a WooCommerce theme**

- The product, cart, checkout and thank-you markup follows WooCommerce's **classic
  templates** — class names, ids and field names (`billing_first_name`,
  `shipping_method[0]`, `payment_method`, `#place_order`, `.woocommerce-error` …).
  `assets/shop/woo.css` styles those selectors and can move into the theme as is.
- Use the classic `[woocommerce_cart]` and `[woocommerce_checkout]` shortcodes, not the
  Cart/Checkout **blocks**, or these styles will not apply.
- Each catalogue entry is a variable product with a "Pack size" attribute; product cards
  add the first pack directly.
- The delivery-slot field and the swatch buttons for pack size need a plugin or a small
  template override in WordPress. The Malaysian state list matches WooCommerce's codes.
- The hero slides of both F and G, and one of G's promo tiles, use **cut-outs** (`assets/cutouts/*.webp`): the subject
  lifted off its photo background with Apple's Vision framework, so it sits straight on the
  slide colour. Make more with `swiftc -O tools/cutout.swift -o tools/cutout` (once), then
  `tools/cutout <photo> <out.png> [maxWidth]`, and convert to WebP. Full-size PNG masters
  are in `_archive/cutout-png/`.
- Page shells come from `tools/partials/<v>/` via `python3 tools/build-pages.py`
  (header.php / footer.php / front-page.php in WordPress). Edit the partials, not the
  generated HTML.

**Still placeholder — needs the client before launch**

- Every **price and pack size**, the **BBQ box** contents and price, the **delivery rates**,
  the free-delivery threshold and the Sunday-closed delivery slots.
- **Meat codes**: none of the 41 products has a confirmed code (44 and 45 are not in this
  photo set), so G's code chips became category tiles. `code` in the catalogue brings the
  red chip back the moment real codes arrive.
- Facebook page URL (footer links to `#`), bank details for transfer, opening hours,
  terms and privacy pages, and the "confirm by WhatsApp" step on the thank-you page.
- The product descriptions (where the cut sits, what it is like, how to cook it) are
  general butchery knowledge written for this draft; the client should check them.
- The trade section's promises (whole primals, standing orders) and "packed cold".

## Running

Double-click `index.html`. Everything works from `file://`.

To serve it over HTTP instead:

```
python3 -m http.server 8080
```

## What every version shares

Same content model (navigation, hero, trust signals, product range, education, delivery,
newsletter, footer) and the same working cart: add, change quantity, remove,
free-delivery progress toward RM 350, surviving reload via `localStorage`. Each version
uses its own storage key so the carts don't interfere. Search accepts a meat code in every
version — typing `45` returns rump steak alone, not everything priced RM 145. Checkout is deliberately not wired
up — the button reports that in the drawer rather than firing a browser dialog.

## Version G — Market Hall

Version F run as a shop with real stock rather than a lookbook. Everything F does is still
here; there is simply more of the counter on screen at once.

- Palette: F's exactly — `#FFFFFF` page, `#F7F4F0` bands, `#171310` ink, `#C0262B` red
- Type: F's exactly — Poppins over Nunito, Anton on the eyebrow, one step tighter
- Two header decks: brand, a full-width search and the tools on top, the department list
  underneath, plus a trust strip under the hero
- The hero gives up a third of its width to a block of four promo tiles
- **Shop by meat code**: every code is a chip that filters the counter and scrolls to it.
  This is the section that most needs the real code chart — see the note further down
- The scrolling rail becomes a grid showing all twelve cuts at once, behind a sticky filter
  column: category, what the cut is best for, price band. Filters combine, `Clear all`
  resets them, and a live count reports what is showing
- A sort control orders by price, meat code or rating
- Hairlines and a light hover shadow instead of F's card shadows; denser type throughout
- On a narrow screen the filter column becomes a row of pill chips above the grid

## Version H — Counter Warm

Version F read softly — the neighbourhood butcher rather than the supermarket aisle. The
same sections in the same order, given room.

- Palette: `#FBF6F0` warm paper as the field, white cards on top, `#F0E3D2` and `#F6E9DC`
  for warm blocks, `#241D18` ink, `#C0262B` red
- Type: Anton carries every display line, over Nunito for everything else. Poppins is gone,
  which is what makes H read differently from F and G at a glance
- A whisper of paper grain over the whole field, at 3.5% — the texture their printed labels
  have, kept well below the point where it reads as a filter
- 20px radii, low soft shadows, wider gutters, and a slower vertical rhythm
- The hero is **one large still, not a slider** — the cut-out sits on a soft cream field with
  the spec underneath. F's other two slides become two of the three cards below it
- The counter sits three across, not four, with a line on each card about what the cut is
  actually for
- The deal band is inset in the paper rather than running edge to edge, so red never
  becomes the field. It is still the only filled band on the page
- Halal gets the most air of any section, because it is what decides the sale in this market

## Version F — Storefront

Built to the reference the client sent, <https://demo2.wpopal.com/ekommart/home-8/>. It
reproduces that theme's structure rather than its subject: announcement bar, centred nav
with an icon cluster and a running cart total, full-bleed colour hero slider, promo colour
tiles, a product carousel, numbered steps, a deal band with a countdown, and article cards.

- Palette: `#FFFFFF` page, `#F7F4F0` bands, `#171310` ink, `#C0262B` brand red,
  with `#F6E9DC` and `#F0E3D2` for the colour fields
- Type: Poppins (headings, prices) over Nunito (text), with Anton for the eyebrow line —
  the reference sets a condensed script above every heading, and Anton is the brand's own
  condensed face
- **Where it departs from the reference:** Ekommart colour-blocks the whole page. Here the
  page stays white and colour is spent on the hero slides and the one deal band, so red is
  still an accent. Dialling it up is a matter of giving more sections a field colour
- Each cut sits on a generated painted swatch, the way the reference puts every bottle on
  a brush stroke
- The hero slider advances on its own like the reference, but pauses while the pointer or
  keyboard focus is inside it, and does not start at all under `prefers-reduced-motion`
- The deal countdown is real and runs to the coming Sunday at midnight
- Saved cuts work: the heart on each card persists, the count shows in the header, and the
  same drawer switches between the cart and the saved list
- **Star ratings are placeholder numbers** and need real review data before launch

## Version D — The Index

Premium by restraint. No cards, no boxes and no container shadows anywhere: the page is
held together by hairlines and space.

- Palette: `#FFFFFF` page, `#FAF9F7` used as a tint twice, `#12110F` ink, `#C0262B` brand red
- Type: Jost (display, numerals, prices) over Instrument Sans (text)
- **The meat number is the organising device and the only boldness on the page.** It sets
  every card, and the counter is sorted by it rather than by markup order — it reads as a
  catalogue
- The hero is a rail of all twelve numbers under the headline. Choosing one swaps the cut
  on show, along with its spec table, price and add button. The rail is built from the
  product cards themselves, so prices can't diverge
- Red appears four times: the X in the wordmark, the active marker on the rail and filters,
  the cart count, and one hairline above the brand line. Version C's solid red band is that
  hairline here
- Cut-outs use the same generated silhouettes as version C, desaturated and rimmed against
  white rather than a grey tile

## Version E — Butcher's House

Premium by provenance. The page is a printed sheet: paper stock with grain, a hairline
frame, a centred masthead between double rules, and stamped seals.

- Palette: `#F6EFE3` paper, `#EFE5D5` stock and banded sections, `#FCF8F1` labels,
  `#241C13` ink, `#C0262B` brand red as the ink of the seals
- Type: Bodoni Moda (display) over EB Garamond (text)
- **The meat is drawn as engraving, not photography.** Same silhouettes as C and D, but
  hatched and cross-hatched in sepia with the fat left as unprinted paper. Marbling grade
  is carried by how much paper is left showing, so silver side and MB12 wagyu read
  differently
- **The hero is an engraved beef chart.** Click or tab to a primal and the panel beside it
  names the part, explains it, and lists the cuts that come off it with prices and an add
  button. The rows are read from the counter below, so nothing can drift. The flank is
  drawn but carries nothing, and says so
- Meat codes are stamped oval seals; the halal section is a certificate block with a
  rubber stamp
- Section heads sit centred between rules; the brand line is stamped across the footer

## Version C — Butcher's Code

Your brand language, applied as a retail site rather than a poster. Red is an accent on a
white page — the wordmark, meat-code chips, buttons, card rules and one band above the
footer — not the page field.

- Palette: `#FFFFFF` page, `#F4F2EF` bands and product tiles, `#171310` ink, `#C0262B` brand red
- Type: Anton for headings, Nunito for everything else
- **Meat codes are the organising device.** Every product card carries its code, then a
  spec table: where it is cut from, its character, and what it is best for. The header
  search accepts a code — typing `45` returns rump steak alone, not everything priced
  RM 145
- The white-box highlight from their post lockups is inverted for a light page (red box,
  white type) and used once, in the hero
- Copy is all English
- Cut-outs are generated SVG: one silhouette per cut, filled with marbling at that cut's
  grade, rimmed in fat white over a warm grey edge so it separates from the tile, and
  dropped on a soft shadow. A few silhouettes are mirrored so repeated shapes don't read
  as duplicates

## Version B — Fresh Counter

Light, dense, built to move stock. Split hero with a live display case, filterable
category tabs, working search, bundle promos and a halal assurance band. Updated to carry
the MEATXPERT name and the "Premium Cut • Premium Meat" line.

- Palette: `#F1F3F0` tile, `#1E2321` cold storage, `#A8232B` price-tag red, `#F6E7C5` offer paper
- Type: Fraunces (display) + Karla (text)

## Version A — Butcher's Atelier

Dark and editorial, with a hero ribeye whose marbling redraws across the Beef Marbling
Standard scale. Ruled out as too dark; kept for reference only, and still uses the old
placeholder brand name.

## Replacing the placeholder imagery

All meat visuals are drawn in SVG, so there are no image requests and nothing to license.
To swap in real photography:

- **Version C**: each `<div class="cutout" data-cut="…" data-marb="…">` becomes an `<img>`
  of a cut-out shot on transparent background — the same treatment as their posts. The
  surrounding `.tile` supplies the neutral background. Sizes: product cards 560×400, hero
  card 720×520. Remove the `[data-cut]` loop at the top of `app.js` once they are real
  photos.
- **Version B**: each `<div class="prod-vis" data-vis data-grade="…">` becomes an `<img>`.
  Sizes: product cards 520×316, hero case 152×120, grade guide 420×315.
- **Version D**: same swap as version C — each `<div class="cutout" data-cut="…"
  data-marb="…">` becomes an `<img>` of a cut-out on transparent background. Sizes:
  index cards 500×360, hero 860×620. Remove the `[data-cut]` loop at the top of `app.js`
  once they are real photos; the hero rail reads everything else from the cards, so it
  keeps working.
- **Versions G and H**: the same `<div class="cutout">` hooks again. G's grid cards want
  roughly 480 × 345, H's want 620 × 445 because they sit three across rather than four.
  H also has a hero cut-out at about 1040 × 750
- **Version F**: same `<div class="cutout">` hooks as C and D. Sizes: carousel cards
  420×300, hero 880×630, deal band 800×570, promo tile 580×420. The painted swatch behind
  each card is drawn by `swatch()` in `app.js` and should stay — it is what stops a
  cut-out photo floating on nothing.
- **Version E**: the engravings are the point of this direction, so think twice before
  replacing them. Photography sits oddly next to a hand-drawn chart. If they are swapped,
  the same `<div class="cutout">` hooks apply, and the beef chart in the hero stays drawn
  either way.

## The logo

The MEATXPERT lockup is rebuilt in type (wordmark with a red X, "Malaysian | Butcher" with
a simplified cow, and the "Premium Cut • Premium Meat" line in the footer). It approximates
the real mark but is not it — the client's actual logo file should replace it before
launch, especially whatever forms the X and the stamped treatment of the tagline.

## Content still to confirm with the client

- **Meat codes.** Only 45 (rump steak) and 44 (silver side) are taken from their own
  posts. Every other code in versions C through H is invented and must be replaced with
  their real numbering before this goes anywhere near production. Versions D, E and G lean
  on the numbering harder than C does — D sorts the whole counter by it, E maps it onto the
  carcass, and G turns the whole chart into the filter row that heads the shop — so the real
  chart matters most in those three.
- **Which cut comes off which primal.** Version E's chart places every code on a part of
  the animal. The mapping is conventional butchery, not the client's own, and should be
  checked against how they actually break down a carcass.
- **Star ratings.** Versions F, G and H show a score on every card, as the reference theme does.
  The numbers are invented and need real review data, or the ratings should come out.
- **Halal certification.** The drafts claim certification recognised by JAKIM and separate
  handling end to end. Verify the certifying body, certificate numbers and the actual
  handling process before publishing any of it.
- Company name, registration number, address and phone
- Real prices, weights and stock
- The customer reviews
- Delivery zones, cut-off times and dry-ice surcharge

## Known limits

- Fonts come from Google Fonts; offline they fall back to system faces
- Mobile navigation collapses to the cart only — a drawer menu is not built yet
- Checkout, accounts, payment and stock are not implemented; these are homepage drafts
