////
// Phoenix Cafe Menu Board - Shared Core
// Data model, local storage/sync, and the menu render engine.
// Used by both the admin (admin.js) and the display (display.js).
////

var PC = (function () {
  'use strict';

  var LS_KEY = 'phoenixCafe.menus.v1';
  var CHANNEL_NAME = 'phoenix-cafe-menus';
  var DATA_URL = 'data/menus.json'; // published copy, relative to this folder

  //// ---------- Utilities ----------

  function uid(prefix) {
    return (prefix || 'id') + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function slugify(text) {
    return String(text || '').toLowerCase().trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'menu';
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  //// ---------- Fonts ----------
  // Fonts available in the Design tab. "g" is the Google Fonts family query
  // (null = system font, nothing to load).

  var FONTS = [
    { name: 'Bebas Neue',       css: "'Bebas Neue', sans-serif",       g: 'Bebas+Neue' },
    { name: 'Oswald',           css: "'Oswald', sans-serif",           g: 'Oswald:wght@400;500;600' },
    { name: 'Anton',            css: "'Anton', sans-serif",            g: 'Anton' },
    { name: 'Montserrat',       css: "'Montserrat', sans-serif",       g: 'Montserrat:wght@400;600;700' },
    { name: 'Lato',             css: "'Lato', sans-serif",             g: 'Lato:wght@400;700' },
    { name: 'Poppins',          css: "'Poppins', sans-serif",          g: 'Poppins:wght@400;600;700' },
    { name: 'Playfair Display', css: "'Playfair Display', serif",      g: 'Playfair+Display:wght@400;600;700' },
    { name: 'Cormorant Garamond', css: "'Cormorant Garamond', serif",  g: 'Cormorant+Garamond:wght@400;600;700' },
    { name: 'Lobster',          css: "'Lobster', cursive",             g: 'Lobster' },
    { name: 'Pacifico',         css: "'Pacifico', cursive",            g: 'Pacifico' },
    { name: 'Courier Prime',    css: "'Courier Prime', monospace",     g: 'Courier+Prime:wght@400;700' },
    { name: 'System Sans',      css: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", g: null },
    { name: 'Georgia (Serif)',  css: "Georgia, 'Times New Roman', serif", g: null }
  ];

  function fontByName(name) {
    for (var i = 0; i < FONTS.length; i++) {
      if (FONTS[i].name === name) return FONTS[i];
    }
    return FONTS[0];
  }

  var loadedFontKey = '';
  function ensureFonts(names) {
    var families = [];
    names.forEach(function (n) {
      var f = fontByName(n);
      if (f.g && families.indexOf(f.g) === -1) families.push(f.g);
    });
    if (!families.length) return;
    var key = families.join('|');
    if (key === loadedFontKey) return;
    loadedFontKey = key;
    var href = 'https://fonts.googleapis.com/css2?family=' + families.join('&family=') + '&display=swap';
    var link = document.getElementById('pc-fonts');
    if (!link) {
      link = document.createElement('link');
      link.id = 'pc-fonts';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  //// ---------- Default theme (every visual knob lives here) ----------

  var DEFAULT_THEME = {
    // Layout
    columns: 2,            // 1-4 columns on the board
    baseSize: 26,          // base font size in px (everything scales from this)
    autoFit: true,         // shrink to fit the screen with no scrolling
    align: 'left',         // left | center
    padding: 2.2,          // board padding, em
    maxWidth: 0,           // content max width in px, 0 = full screen
    sectionGap: 1.5,       // gap between sections, em
    itemGap: 0.85,         // gap between items, em
    columnGap: 2.4,        // gap between columns, em

    // Background
    background: '#161311',
    backgroundImage: '',   // URL, optional
    overlay: 0.55,         // darkness over the background image, 0-0.9

    // Typography
    headingFont: 'Bebas Neue',
    bodyFont: 'Montserrat',
    menuTitleSize: 2.8,    // em, relative to baseSize
    sectionTitleSize: 1.55,
    itemTitleSize: 1.0,
    descSize: 0.7,
    priceSize: 1.0,

    // Colors
    menuTitleColor: '#f6ecd9',
    sectionTitleColor: '#e8b95c',
    accentColor: '#e8b95c',      // section underline + accents
    itemTitleColor: '#f6ecd9',
    descColor: '#b3a68f',
    priceColor: '#f6ecd9',
    sizeLabelColor: '#93876f',   // size labels (12oz, 16oz) next to prices
    badgeColor: '#c0392b',       // sold out badge background
    badgeTextColor: '#ffffff',

    // Options
    showMenuTitle: true,
    showDescriptions: true,
    uppercaseSections: true,
    sectionDivider: true,        // accent underline below section titles
    dotLeaders: true,            // dotted line between item name and price
    soldOutStyle: 'badge',       // badge | strike | hide
    soldOutText: 'SOLD OUT',
    currency: '$'
  };

  //// ---------- Factories ----------

  function newItem(title) {
    return {
      id: uid('item'),
      title: title || 'New Item',
      description: '',
      prices: [{ size: '', price: '' }],
      soldOut: false
    };
  }

  function newSection(name) {
    return {
      id: uid('sec'),
      name: name || 'New Section',
      items: []
    };
  }

  function newMenu(name) {
    return {
      id: uid('menu'),
      name: name || 'New Menu',
      slug: slugify(name || 'new-menu'),
      theme: clone(DEFAULT_THEME),
      sections: []
    };
  }

  function normalizeState(state) {
    // Fill in anything missing so old/hand-edited data never breaks the app.
    if (!state || typeof state !== 'object') return null;
    if (!Array.isArray(state.menus)) state.menus = [];
    state.version = state.version || 1;
    state.menus.forEach(function (m) {
      m.id = m.id || uid('menu');
      m.name = m.name || 'Menu';
      m.slug = m.slug || slugify(m.name);
      m.theme = Object.assign(clone(DEFAULT_THEME), m.theme || {});
      if (!Array.isArray(m.sections)) m.sections = [];
      m.sections.forEach(function (s) {
        s.id = s.id || uid('sec');
        s.name = s.name || 'Section';
        if (!Array.isArray(s.items)) s.items = [];
        s.items.forEach(function (it) {
          it.id = it.id || uid('item');
          it.title = it.title || '';
          it.description = it.description || '';
          it.soldOut = !!it.soldOut;
          if (!Array.isArray(it.prices) || !it.prices.length) it.prices = [{ size: '', price: '' }];
        });
      });
    });
    return state;
  }

  //// ---------- Seed data ----------

  function seedState() {
    var menu = newMenu('Phoenix Cafe');
    menu.slug = 'phoenix-cafe';
    menu.theme.columns = 2;

    var espresso = newSection('Espresso Drinks');
    var latte = newItem('Latte');
    latte.description = 'Double shot of espresso with velvety steamed milk';
    latte.prices = [{ size: '12oz', price: '4.00' }, { size: '16oz', price: '4.75' }, { size: '20oz', price: '5.50' }];
    var mocha = newItem('Mocha');
    mocha.description = 'Espresso, house chocolate, and steamed milk topped with whip';
    mocha.prices = [{ size: '12oz', price: '4.50' }, { size: '16oz', price: '5.25' }, { size: '20oz', price: '6.00' }];
    var caramel = newItem('Caramel Macchiato');
    caramel.description = 'Vanilla, steamed milk, espresso, and caramel drizzle';
    caramel.prices = [{ size: '12oz', price: '4.75' }, { size: '16oz', price: '5.50' }, { size: '20oz', price: '6.25' }];
    var americano = newItem('Americano');
    americano.description = 'Espresso over hot water';
    americano.prices = [{ size: '12oz', price: '3.00' }, { size: '16oz', price: '3.50' }];
    espresso.items = [latte, mocha, caramel, americano];

    var brewed = newSection('Coffee & Tea');
    var drip = newItem('Drip Coffee');
    drip.description = 'Locally roasted, brewed fresh all morning';
    drip.prices = [{ size: '12oz', price: '2.25' }, { size: '16oz', price: '2.75' }];
    var coldBrew = newItem('Cold Brew');
    coldBrew.description = 'Steeped 18 hours, smooth and bold';
    coldBrew.prices = [{ size: '16oz', price: '4.25' }, { size: '20oz', price: '5.00' }];
    var chai = newItem('Chai Latte');
    chai.description = 'Spiced black tea with steamed milk';
    chai.prices = [{ size: '12oz', price: '4.25' }, { size: '16oz', price: '5.00' }];
    var hotTea = newItem('Hot Tea');
    hotTea.description = 'Ask about our rotating selection';
    hotTea.prices = [{ size: '', price: '2.50' }];
    brewed.items = [drip, coldBrew, chai, hotTea];

    var smoothies = newSection('Smoothies');
    var berry = newItem('Berry Blast');
    berry.description = 'Strawberry, blueberry, banana, and apple juice';
    berry.prices = [{ size: '16oz', price: '6.00' }, { size: '20oz', price: '7.00' }];
    var mango = newItem('Mango Sunrise');
    mango.description = 'Mango, pineapple, and orange juice';
    mango.prices = [{ size: '16oz', price: '6.00' }, { size: '20oz', price: '7.00' }];
    smoothies.items = [berry, mango];

    var pastries = newSection('Pastries');
    var muffin = newItem('Blueberry Muffin');
    muffin.prices = [{ size: '', price: '3.25' }];
    var croissant = newItem('Butter Croissant');
    croissant.description = 'Baked fresh daily';
    croissant.prices = [{ size: '', price: '3.75' }];
    var cinnamonRoll = newItem('Cinnamon Roll');
    cinnamonRoll.description = 'House favorite with cream cheese icing';
    cinnamonRoll.prices = [{ size: '', price: '4.25' }];
    cinnamonRoll.soldOut = true;
    pastries.items = [muffin, croissant, cinnamonRoll];

    menu.sections = [espresso, brewed, smoothies, pastries];

    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      menus: [menu]
    };
  }

  //// ---------- Local storage + cross-tab sync ----------

  var channel = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) { /* older browser - storage events still work */ }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return normalizeState(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  }

  function save(state) {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) { /* storage full or blocked */ }
    if (channel) {
      try { channel.postMessage({ type: 'update', updatedAt: state.updatedAt }); } catch (e) {}
    }
    return state;
  }

  // cb() is called whenever another tab/window on this device saves changes.
  function subscribe(cb) {
    if (channel) {
      channel.addEventListener('message', function (ev) {
        if (ev.data && ev.data.type === 'update') cb();
      });
    }
    window.addEventListener('storage', function (ev) {
      if (ev.key === LS_KEY) cb();
    });
  }

  //// ---------- Published data (cross-device) ----------

  function fetchPublished() {
    var url = DATA_URL + '?v=' + Date.now();
    return fetch(url, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (json) {
      return normalizeState(json);
    });
  }

  function newerOf(a, b) {
    if (!a) return b;
    if (!b) return a;
    return String(a.updatedAt || '') >= String(b.updatedAt || '') ? a : b;
  }

  function findMenu(state, key) {
    if (!state || !state.menus || !state.menus.length) return null;
    if (!key) return null;
    var k = String(key).toLowerCase();
    for (var i = 0; i < state.menus.length; i++) {
      var m = state.menus[i];
      if (m.id.toLowerCase() === k || (m.slug || '').toLowerCase() === k || slugify(m.name) === k) return m;
    }
    return null;
  }

  //// ---------- Render engine ----------
  // Renders a menu into a container. The exact same code paints the TV
  // display and the admin live preview, so what you see is what you get.

  function priceText(theme, raw) {
    var p = String(raw == null ? '' : raw).trim();
    if (!p) return '';
    // Prefix the currency symbol only when the value starts with a number
    // (so "Market Price" or "€4" pass through untouched).
    if (/^[\d.]/.test(p)) return (theme.currency || '') + p;
    return p;
  }

  function renderMenu(board, menu, opts) {
    opts = opts || {};
    var t = Object.assign(clone(DEFAULT_THEME), (menu && menu.theme) || {});
    ensureFonts([t.headingFont, t.bodyFont]);

    board.classList.add('pc-board');
    board.style.setProperty('--pc-bg', t.background);
    board.style.setProperty('--pc-overlay', String(t.overlay));
    board.style.setProperty('--pc-heading-font', fontByName(t.headingFont).css);
    board.style.setProperty('--pc-body-font', fontByName(t.bodyFont).css);
    board.style.setProperty('--pc-menu-title-color', t.menuTitleColor);
    board.style.setProperty('--pc-section-title-color', t.sectionTitleColor);
    board.style.setProperty('--pc-accent', t.accentColor);
    board.style.setProperty('--pc-item-title-color', t.itemTitleColor);
    board.style.setProperty('--pc-desc-color', t.descColor);
    board.style.setProperty('--pc-price-color', t.priceColor);
    board.style.setProperty('--pc-size-label-color', t.sizeLabelColor);
    board.style.setProperty('--pc-badge-color', t.badgeColor);
    board.style.setProperty('--pc-badge-text-color', t.badgeTextColor);
    board.style.setProperty('--pc-columns', String(t.columns));
    board.style.setProperty('--pc-column-gap', t.columnGap + 'em');
    board.style.setProperty('--pc-section-gap', t.sectionGap + 'em');
    board.style.setProperty('--pc-item-gap', t.itemGap + 'em');
    board.style.setProperty('--pc-padding', t.padding + 'em');
    board.style.setProperty('--pc-max-width', t.maxWidth > 0 ? t.maxWidth + 'px' : 'none');
    board.style.setProperty('--pc-menu-title-size', t.menuTitleSize + 'em');
    board.style.setProperty('--pc-section-title-size', t.sectionTitleSize + 'em');
    board.style.setProperty('--pc-item-title-size', t.itemTitleSize + 'em');
    board.style.setProperty('--pc-desc-size', t.descSize + 'em');
    board.style.setProperty('--pc-price-size', t.priceSize + 'em');
    board.style.setProperty('--pc-align', t.align === 'center' ? 'center' : 'left');
    board.style.backgroundImage = t.backgroundImage ? 'url("' + encodeURI(t.backgroundImage) + '")' : 'none';
    board.classList.toggle('pc-center', t.align === 'center');
    board.classList.toggle('pc-uppercase-sections', !!t.uppercaseSections);
    board.classList.toggle('pc-section-divider', !!t.sectionDivider);
    board.classList.toggle('pc-has-bg-image', !!t.backgroundImage);
    board.style.fontSize = t.baseSize + 'px';

    board.innerHTML = '';
    var overlay = el('div', 'pc-overlay');
    board.appendChild(overlay);

    var inner = el('div', 'pc-inner');
    board.appendChild(inner);

    if (!menu) {
      var msg = el('div', 'pc-empty', 'Menu not found');
      inner.appendChild(msg);
      return;
    }

    if (t.showMenuTitle) {
      inner.appendChild(el('h1', 'pc-menu-title', menu.name));
    }

    var cols = el('div', 'pc-columns');
    inner.appendChild(cols);

    (menu.sections || []).forEach(function (section) {
      var visibleItems = (section.items || []).filter(function (it) {
        return !(it.soldOut && t.soldOutStyle === 'hide');
      });

      var secEl = el('section', 'pc-section');
      secEl.appendChild(el('h2', 'pc-section-title', section.name));

      var itemsEl = el('div', 'pc-items');
      visibleItems.forEach(function (item) {
        var itemEl = el('div', 'pc-item');
        if (item.soldOut) {
          itemEl.classList.add('pc-soldout');
          itemEl.classList.add(t.soldOutStyle === 'strike' ? 'pc-soldout-strike' : 'pc-soldout-badge');
        }

        var line = el('div', 'pc-item-line');
        var titleWrap = el('div', 'pc-item-title-wrap');
        titleWrap.appendChild(el('span', 'pc-item-title', item.title));
        if (item.soldOut && t.soldOutStyle === 'badge') {
          titleWrap.appendChild(el('span', 'pc-badge', t.soldOutText || 'SOLD OUT'));
        }
        line.appendChild(titleWrap);

        if (t.dotLeaders && t.align !== 'center') {
          line.appendChild(el('span', 'pc-leader'));
        }

        var prices = el('div', 'pc-prices');
        (item.prices || []).forEach(function (pr) {
          var txt = priceText(t, pr.price);
          if (!txt) return;
          var priceEl = el('span', 'pc-price');
          if (pr.size) priceEl.appendChild(el('span', 'pc-size', pr.size));
          priceEl.appendChild(el('span', 'pc-amount', txt));
          prices.appendChild(priceEl);
        });
        line.appendChild(prices);
        itemEl.appendChild(line);

        if (t.showDescriptions && item.description) {
          itemEl.appendChild(el('div', 'pc-item-desc', item.description));
        }
        itemsEl.appendChild(itemEl);
      });

      secEl.appendChild(itemsEl);
      cols.appendChild(secEl);
    });

    if (t.autoFit && !opts.noFit) {
      fitBoard(board, inner, t.baseSize);
    }
  }

  // Shrink the base font size until the content fits the board with no
  // scrolling. Never grows beyond the configured base size.
  function fitBoard(board, inner, baseSize) {
    var size = baseSize;
    var minSize = 8;
    var guard = 40;
    while (guard-- > 0 && size > minSize) {
      var overflows = inner.scrollHeight > board.clientHeight + 1 || inner.scrollWidth > board.clientWidth + 1;
      if (!overflows) break;
      size = size * 0.94;
      board.style.fontSize = size + 'px';
    }
  }

  //// ---------- Public API ----------

  return {
    LS_KEY: LS_KEY,
    DATA_URL: DATA_URL,
    FONTS: FONTS,
    DEFAULT_THEME: DEFAULT_THEME,
    uid: uid,
    slugify: slugify,
    clone: clone,
    ensureFonts: ensureFonts,
    newItem: newItem,
    newSection: newSection,
    newMenu: newMenu,
    normalizeState: normalizeState,
    seedState: seedState,
    load: load,
    save: save,
    subscribe: subscribe,
    fetchPublished: fetchPublished,
    newerOf: newerOf,
    findMenu: findMenu,
    renderMenu: renderMenu
  };
})();
