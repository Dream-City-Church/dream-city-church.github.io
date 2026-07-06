////
// Phoenix Cafe Menu Board - Admin
// Edit menus/sections/items, control all styling, define physical screen
// locations, and schedule which menu each location shows (Outlook-style
// week calendar). Changes save locally right away and sync to a zero-setup
// cloud channel automatically so every board updates on its own.
////

(function () {
  'use strict';

  var SYNC_META_KEY = 'phoenixCafe.syncMeta.v1';
  var ASPECT_KEY = 'phoenixCafe.previewAspect';
  var SAVE_DEBOUNCE_MS = 500;
  var SYNC_DEBOUNCE_MS = 2500;
  var PULL_INTERVAL_MS = 60000;
  var HOUR_H = 40; // calendar pixels per hour

  //// ---------- Tiny DOM helpers ----------

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function h(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function button(className, label, title, onClick) {
    var b = h('button', className, label);
    if (title) b.title = title;
    b.addEventListener('click', function (ev) {
      ev.stopPropagation();
      onClick(ev);
    });
    return b;
  }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function moveInArray(arr, index, delta) {
    var to = index + delta;
    if (to < 0 || to >= arr.length) return false;
    var tmp = arr[index];
    arr[index] = arr[to];
    arr[to] = tmp;
    return true;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  //// ---------- App state ----------

  var state = PC.load();
  var seededFresh = false;
  if (!state || !state.menus.length) {
    state = state || PC.seedState();
    seededFresh = true;
  }

  var sel = {
    kind: 'menu',                 // 'menu' | 'location'
    id: state.menus.length ? state.menus[0].id : null,
    tab: 'content'
  };
  var openItems = {};             // itemId -> true (expanded editor cards)
  var saveTimer = null;
  var syncTimer = null;
  var syncing = false;
  var creatingChannel = false;
  var syncError = '';
  var previewAspect = '16:9';
  try { previewAspect = localStorage.getItem(ASPECT_KEY) || '16:9'; } catch (e) {}

  // Start of the week currently shown in the schedule calendar (Sunday)
  var calWeekStart = startOfWeek(new Date());

  function startOfWeek(d) {
    var s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    s.setDate(s.getDate() - s.getDay());
    return s;
  }

  function currentMenu() {
    if (sel.kind !== 'menu') return null;
    return PC.menuById(state, sel.id);
  }

  function currentLocation() {
    if (sel.kind !== 'location') return null;
    for (var i = 0; i < state.locations.length; i++) {
      if (state.locations[i].id === sel.id) return state.locations[i];
    }
    return null;
  }

  //// ---------- Saving (local) ----------

  function scheduleSave() {
    setStatus('Saving…', 'dirty');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, SAVE_DEBOUNCE_MS);
  }

  function doSave() {
    // A user edit turns starter data into real data — real data always wins
    // over any freshly-deployed data/menus.json starter copy.
    state.seed = false;
    PC.save(state);
    refreshStatus();
    scheduleSync();
  }

  function setStatus(text, cls) {
    var s = $('#save-status');
    s.textContent = text;
    s.className = cls || '';
  }

  function loadSyncMeta() {
    try {
      var raw = localStorage.getItem(SYNC_META_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function saveSyncMeta(meta) {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  }

  function refreshStatus() {
    if (syncing || creatingChannel) { setStatus('Syncing to boards…', 'dirty'); return; }
    if (syncError) { setStatus('Sync problem — boards may be behind (' + syncError + ')', 'error'); return; }
    if (!state.syncId) { setStatus('Saved here · board sync starting…', 'dirty'); return; }
    var meta = loadSyncMeta();
    if (meta.syncedUpdatedAt !== state.updatedAt) {
      setStatus('Saved · syncing shortly…', 'dirty');
    } else {
      var when = meta.at ? new Date(meta.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
      setStatus('Synced to boards' + (when ? ' · ' + when : ''), 'ok');
    }
  }

  //// ---------- Cloud sync (automatic, zero setup) ----------

  function ensureChannel() {
    if (state.syncId) return Promise.resolve(state.syncId);
    if (creatingChannel) return Promise.resolve(null);
    creatingChannel = true;
    refreshStatus();
    return PC.sync.create(state).then(function (id) {
      creatingChannel = false;
      syncError = '';
      state.syncId = id;
      PC.save(state);
      saveSyncMeta({ syncedUpdatedAt: state.updatedAt, at: new Date().toISOString() });
      refreshStatus();
      renderEditor(); // display URLs now include the sync id
      return id;
    }).catch(function (err) {
      creatingChannel = false;
      syncError = err.message || 'offline';
      refreshStatus();
      return null;
    });
  }

  function scheduleSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(doSync, SYNC_DEBOUNCE_MS);
  }

  function doSync(opts) {
    if (!state.syncId) {
      return ensureChannel().then(function (id) { return !!id; });
    }
    if (syncing) { scheduleSync(); return Promise.resolve(false); }
    syncing = true;
    refreshStatus();
    var syncedUpdatedAt = state.updatedAt;
    return PC.sync.put(state.syncId, state, opts).then(function () {
      syncing = false;
      syncError = '';
      saveSyncMeta({ syncedUpdatedAt: syncedUpdatedAt, at: new Date().toISOString() });
      refreshStatus();
      return true;
    }).catch(function (err) {
      syncing = false;
      if (err.status === 404) {
        // Channel expired/vanished - make a new one and warn loudly,
        // because TVs pointed at the old sync id need their URL updated.
        state.syncId = '';
        return ensureChannel().then(function (id) {
          if (id) {
            toast('Sync channel was recreated — re-copy the display URLs onto your TVs.');
            openSyncInfo();
          }
          return !!id;
        });
      }
      syncError = err.message || 'offline';
      refreshStatus();
      return false;
    });
  }

  // Adopt whatever is newer between what we have and the channel's copy
  // (e.g. edits made from another computer).
  function pullFromChannel() {
    if (!state.syncId) return Promise.resolve(false);
    var id = state.syncId;
    return PC.sync.get(id).then(function (remote) {
      if (!remote || !remote.menus) return false;
      remote.syncId = id;
      // Adopt the channel copy when it's newer — or whenever what we have is
      // only starter data (the channel always holds real, user-edited data).
      if ((state.seed && remote.menus.length) ||
          String(remote.updatedAt || '') > String(state.updatedAt || '')) {
        state = remote;
        ensureValidSelection();
        PC.save(state);
        saveSyncMeta({ syncedUpdatedAt: state.updatedAt, at: new Date().toISOString() });
        renderAll();
        return true;
      }
      return false;
    }).catch(function () { return false; });
  }

  function ensureValidSelection() {
    if (sel.kind === 'menu' && !currentMenu()) {
      sel.id = state.menus.length ? state.menus[0].id : null;
    }
    if (sel.kind === 'location' && !currentLocation()) {
      sel.kind = 'menu';
      sel.id = state.menus.length ? state.menus[0].id : null;
    }
  }

  //// ---------- Sync info modal ----------

  function adminSyncUrl() {
    var base = window.location.href.split('?')[0];
    return base + (state.syncId ? '?sync=' + encodeURIComponent(state.syncId) : '');
  }

  function openSyncInfo() {
    var meta = loadSyncMeta();
    $('#sync-state').textContent = state.syncId
      ? (syncError ? 'Sync problem: ' + syncError : 'Connected — boards update automatically.')
      : 'Setting up… (needs internet)';
    $('#sync-admin-link').textContent = adminSyncUrl();
    $('#sync-last').textContent = meta.at ? new Date(meta.at).toLocaleString() : 'never';
    $('#sync-modal').classList.add('open');
  }

  //// ---------- Sidebar ----------

  function renderMenuList() {
    var list = $('#menu-list');
    list.innerHTML = '';
    state.menus.forEach(function (menu) {
      var active = sel.kind === 'menu' && menu.id === sel.id;
      var row = h('button', 'menu-item' + (active ? ' active' : ''));
      row.appendChild(h('span', 'name', menu.name));
      row.addEventListener('click', function () {
        sel.kind = 'menu';
        sel.id = menu.id;
        renderAll();
      });
      list.appendChild(row);
    });

    var locList = $('#location-list');
    locList.innerHTML = '';
    state.locations.forEach(function (loc) {
      var active = sel.kind === 'location' && loc.id === sel.id;
      var row = h('button', 'menu-item' + (active ? ' active' : ''));
      row.appendChild(h('span', 'name', '📺 ' + loc.name));
      row.addEventListener('click', function () {
        sel.kind = 'location';
        sel.id = loc.id;
        renderAll();
      });
      locList.appendChild(row);
    });
  }

  //// ---------- URLs ----------

  function baseUrl() {
    return window.location.href.replace(/admin\.html.*$/, '');
  }

  function withSync(url) {
    if (state.syncId) url += '&sync=' + encodeURIComponent(state.syncId);
    return url;
  }

  function displayUrlFor(menu) {
    return withSync(baseUrl() + 'display.html?menu=' + encodeURIComponent(menu.slug || menu.id));
  }

  function displayUrlForLocation(loc) {
    return withSync(baseUrl() + 'display.html?location=' + encodeURIComponent(loc.slug || loc.id));
  }

  function copyText(text, doneMsg) {
    navigator.clipboard.writeText(text).then(function () {
      toast(doneMsg || 'Copied');
    }, function () {
      prompt('Copy this URL:', text);
    });
  }

  //// ---------- Content tab (menus) ----------

  function renderContent(root, menu) {
    // --- menu meta bar ---
    var meta = h('div', 'menu-meta');

    var nameField = h('label', 'field grow');
    nameField.appendChild(h('span', null, 'Menu name'));
    var nameInput = h('input');
    nameInput.type = 'text';
    nameInput.value = menu.name;
    nameInput.addEventListener('input', function () {
      menu.name = nameInput.value;
      menu.slug = PC.slugify(nameInput.value);
      scheduleSave();
      renderMenuList();
      linkCode.textContent = displayUrlFor(menu);
    });
    nameField.appendChild(nameInput);
    meta.appendChild(nameField);

    meta.appendChild(button('', 'Duplicate', 'Copy this menu, including its design', function () {
      var copy = PC.clone(menu);
      copy.id = PC.uid('menu');
      copy.name = menu.name + ' (copy)';
      copy.slug = PC.slugify(copy.name);
      copy.sections.forEach(function (s) {
        s.id = PC.uid('sec');
        s.items.forEach(function (it) { it.id = PC.uid('item'); });
      });
      state.menus.push(copy);
      sel.id = copy.id;
      scheduleSave();
      renderAll();
    }));

    meta.appendChild(button('danger-ghost', 'Delete menu', null, function () {
      if (!confirm('Delete the menu "' + menu.name + '"? This cannot be undone.')) return;
      state.menus = state.menus.filter(function (m) { return m.id !== menu.id; });
      // Clean up any location references to this menu.
      state.locations.forEach(function (loc) {
        if (loc.defaultMenuId === menu.id) loc.defaultMenuId = '';
        loc.schedule = loc.schedule.filter(function (ev) { return ev.menuId !== menu.id; });
      });
      ensureValidSelection();
      scheduleSave();
      renderAll();
    }));

    var link = h('div', 'display-link');
    link.appendChild(h('span', null, 'Display URL:'));
    var linkCode = h('code', null, displayUrlFor(menu));
    link.appendChild(linkCode);
    link.appendChild(button('icon', 'Copy', 'Copy the display URL for this menu', function () {
      copyText(displayUrlFor(menu), 'Display URL copied');
    }));
    meta.appendChild(link);
    root.appendChild(meta);

    // --- sections ---
    menu.sections.forEach(function (section, sIdx) {
      root.appendChild(renderSection(menu, section, sIdx));
    });

    var addSec = button('primary', '+ Add Section', null, function () {
      menu.sections.push(PC.newSection());
      scheduleSave();
      renderEditor();
    });
    root.appendChild(addSec);
  }

  function renderSection(menu, section, sIdx) {
    var card = h('div', 'section-card');

    var head = h('div', 'section-head');
    var nameInput = h('input', 'section-name');
    nameInput.type = 'text';
    nameInput.value = section.name;
    nameInput.placeholder = 'Section name';
    nameInput.addEventListener('input', function () {
      section.name = nameInput.value;
      scheduleSave();
    });
    head.appendChild(nameInput);

    head.appendChild(button('icon', '▲', 'Move section up', function () {
      if (moveInArray(menu.sections, sIdx, -1)) { scheduleSave(); renderEditor(); }
    }));
    head.appendChild(button('icon', '▼', 'Move section down', function () {
      if (moveInArray(menu.sections, sIdx, 1)) { scheduleSave(); renderEditor(); }
    }));
    head.appendChild(button('icon danger-ghost', '✕', 'Delete section', function () {
      if (!confirm('Delete the section "' + section.name + '" and its ' + section.items.length + ' item(s)?')) return;
      menu.sections.splice(sIdx, 1);
      scheduleSave();
      renderEditor();
    }));
    card.appendChild(head);

    var itemsWrap = h('div', 'section-items');
    section.items.forEach(function (item, iIdx) {
      itemsWrap.appendChild(renderItem(section, item, iIdx));
    });

    var addRow = h('div', 'add-row');
    addRow.appendChild(button('', '+ Add Item', null, function () {
      var item = PC.newItem();
      section.items.push(item);
      openItems[item.id] = true;
      scheduleSave();
      renderEditor();
    }));
    itemsWrap.appendChild(addRow);
    card.appendChild(itemsWrap);
    return card;
  }

  function pricesSummary(item) {
    var parts = [];
    (item.prices || []).forEach(function (p) {
      if (!String(p.price || '').trim()) return;
      parts.push((p.size ? p.size + ' ' : '') + p.price);
    });
    return parts.join(' · ');
  }

  function renderItem(section, item, iIdx) {
    var card = h('div', 'item-card');

    // --- collapsed header ---
    var head = h('div', 'item-head');
    head.appendChild(h('span', null, openItems[item.id] ? '▾' : '▸'));
    var label = h('span', 'item-label');
    label.appendChild(h('span', null, item.title || '(untitled item)'));
    var sum = pricesSummary(item);
    if (sum) label.appendChild(h('span', 'prices-summary', sum));
    head.appendChild(label);
    if (item.featured) head.appendChild(h('span', 'featured-chip', '★ FEATURED'));
    if (item.soldOut) head.appendChild(h('span', 'soldout-chip', 'SOLD OUT'));

    head.appendChild(button('icon', '▲', 'Move item up', function () {
      if (moveInArray(section.items, iIdx, -1)) { scheduleSave(); renderEditor(); }
    }));
    head.appendChild(button('icon', '▼', 'Move item down', function () {
      if (moveInArray(section.items, iIdx, 1)) { scheduleSave(); renderEditor(); }
    }));
    head.appendChild(button('icon danger-ghost', '✕', 'Delete item', function () {
      if (!confirm('Delete "' + (item.title || 'this item') + '"?')) return;
      section.items.splice(iIdx, 1);
      scheduleSave();
      renderEditor();
    }));

    head.addEventListener('click', function () {
      openItems[item.id] = !openItems[item.id];
      renderEditor();
    });
    card.appendChild(head);

    if (!openItems[item.id]) return card;

    // --- expanded editor ---
    var body = h('div', 'item-body');
    body.addEventListener('click', function (ev) { ev.stopPropagation(); });

    var titleField = h('label', 'field');
    titleField.appendChild(h('span', null, 'Title'));
    var titleInput = h('input');
    titleInput.type = 'text';
    titleInput.value = item.title;
    titleInput.addEventListener('input', function () {
      item.title = titleInput.value;
      label.firstChild.textContent = item.title || '(untitled item)';
      scheduleSave();
    });
    titleField.appendChild(titleInput);
    body.appendChild(titleField);

    var descField = h('label', 'field');
    descField.appendChild(h('span', null, 'Description'));
    var descInput = h('textarea');
    descInput.value = item.description;
    descInput.addEventListener('input', function () {
      item.description = descInput.value;
      scheduleSave();
    });
    descField.appendChild(descInput);
    body.appendChild(descField);

    var pricesField = h('div', 'field');
    pricesField.appendChild(h('span', null, 'Prices (leave size blank for a single price)'));
    var pricesWrap = h('div');
    pricesField.appendChild(pricesWrap);
    body.appendChild(pricesField);

    function renderPriceRows() {
      pricesWrap.innerHTML = '';
      item.prices.forEach(function (pr, pIdx) {
        var row = h('div', 'price-row');
        var sizeInput = h('input', 'size-input');
        sizeInput.type = 'text';
        sizeInput.placeholder = 'Size (e.g. 12oz)';
        sizeInput.value = pr.size;
        sizeInput.addEventListener('input', function () { pr.size = sizeInput.value; scheduleSave(); });
        var priceInput = h('input', 'price-input');
        priceInput.type = 'text';
        priceInput.placeholder = 'Price (e.g. 4.50)';
        priceInput.value = pr.price;
        priceInput.addEventListener('input', function () { pr.price = priceInput.value; scheduleSave(); });
        row.appendChild(sizeInput);
        row.appendChild(priceInput);
        if (item.prices.length > 1) {
          row.appendChild(button('icon danger-ghost', '✕', 'Remove this price', function () {
            item.prices.splice(pIdx, 1);
            scheduleSave();
            renderPriceRows();
          }));
        }
        pricesWrap.appendChild(row);
      });
      var add = button('', '+ Add size/price', null, function () {
        item.prices.push({ size: '', price: '' });
        scheduleSave();
        renderPriceRows();
      });
      pricesWrap.appendChild(add);
    }
    renderPriceRows();

    var soldOut = h('label', 'check');
    var soldOutInput = h('input');
    soldOutInput.type = 'checkbox';
    soldOutInput.checked = item.soldOut;
    soldOutInput.addEventListener('change', function () {
      item.soldOut = soldOutInput.checked;
      scheduleSave();
      renderEditor();
    });
    soldOut.appendChild(soldOutInput);
    soldOut.appendChild(h('span', null, 'Sold out'));
    body.appendChild(soldOut);

    var featured = h('label', 'check');
    var featuredInput = h('input');
    featuredInput.type = 'checkbox';
    featuredInput.checked = !!item.featured;
    featuredInput.addEventListener('change', function () {
      item.featured = featuredInput.checked;
      scheduleSave();
      renderEditor();
    });
    featured.appendChild(featuredInput);
    featured.appendChild(h('span', null, 'Featured (highlighted on the board)'));
    body.appendChild(featured);

    card.appendChild(body);
    return card;
  }

  //// ---------- Design tab ----------

  // Design sections are collapsible so the page stays tidy; which ones are
  // open is remembered per browser.
  var DESIGN_OPEN_KEY = 'phoenixCafe.designOpen.v1';
  var designOpen = null;
  try { designOpen = JSON.parse(localStorage.getItem(DESIGN_OPEN_KEY)); } catch (e) {}
  if (!designOpen || typeof designOpen !== 'object') designOpen = { Layout: true };

  function designGroup(title) {
    var g = h('details', 'design-group');
    g.appendChild(h('summary', null, title));
    g.open = !!designOpen[title];
    g.addEventListener('toggle', function () {
      designOpen[title] = g.open;
      try { localStorage.setItem(DESIGN_OPEN_KEY, JSON.stringify(designOpen)); } catch (e) {}
    });
    return g;
  }

  function colorField(theme, key, label) {
    var row = h('label', 'color-field');
    row.appendChild(h('span', null, label));
    var input = h('input');
    input.type = 'color';
    input.value = /^#[0-9a-fA-F]{6}$/.test(theme[key]) ? theme[key] : '#000000';
    input.addEventListener('input', function () {
      theme[key] = input.value;
      scheduleSave();
    });
    row.appendChild(input);
    return row;
  }

  function rangeField(theme, key, label, min, max, step, format) {
    var wrap = h('div', 'range-field');
    var head = h('div', 'range-head');
    head.appendChild(h('span', null, label));
    var out = h('output', null, format ? format(theme[key]) : String(theme[key]));
    head.appendChild(out);
    wrap.appendChild(head);
    var input = h('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step;
    input.value = theme[key];
    input.addEventListener('input', function () {
      theme[key] = parseFloat(input.value);
      out.textContent = format ? format(theme[key]) : String(theme[key]);
      scheduleSave();
    });
    wrap.appendChild(input);
    return wrap;
  }

  function selectField(theme, key, label, options) {
    var field = h('label', 'field');
    field.appendChild(h('span', null, label));
    var select = h('select');
    options.forEach(function (opt) {
      var o = h('option', null, opt.label);
      o.value = opt.value;
      select.appendChild(o);
    });
    select.value = String(theme[key]);
    select.addEventListener('change', function () {
      var v = select.value;
      theme[key] = (typeof theme[key] === 'number') ? parseFloat(v) : v;
      scheduleSave();
    });
    field.appendChild(select);
    return field;
  }

  function checkField(theme, key, label) {
    var row = h('label', 'check');
    var input = h('input');
    input.type = 'checkbox';
    input.checked = !!theme[key];
    input.addEventListener('change', function () {
      theme[key] = input.checked;
      scheduleSave();
    });
    row.appendChild(input);
    row.appendChild(h('span', null, label));
    return row;
  }

  function textField(theme, key, label, placeholder) {
    var field = h('label', 'field');
    field.appendChild(h('span', null, label));
    var input = h('input');
    input.type = 'text';
    input.placeholder = placeholder || '';
    input.value = theme[key] || '';
    input.addEventListener('input', function () {
      theme[key] = input.value;
      scheduleSave();
    });
    field.appendChild(input);
    return field;
  }

  // All design controls for one theme object. Shared by the per-menu Design
  // tab and a location's custom design, so the two can never drift apart.
  function appendDesignControls(grid, t, onReset) {
    // Layout
    var layout = designGroup('Layout');
    layout.appendChild(selectField(t, 'columns', 'Columns', [
      { value: '1', label: '1 column' },
      { value: '2', label: '2 columns' },
      { value: '3', label: '3 columns' },
      { value: '4', label: '4 columns' }
    ]));
    layout.appendChild(selectField(t, 'align', 'Text alignment', [
      { value: 'left', label: 'Left (prices on the right)' },
      { value: 'center', label: 'Centered' }
    ]));
    layout.appendChild(selectField(t, 'priceLayout', 'Price layout', [
      { value: 'inline', label: 'Sizes side by side' },
      { value: 'stacked', label: 'Sizes stacked (one per line)' }
    ]));
    layout.appendChild(rangeField(t, 'baseSize', 'Base text size', 12, 48, 1, function (v) { return v + 'px'; }));
    layout.appendChild(rangeField(t, 'padding', 'Screen padding', 0.5, 5, 0.1, function (v) { return v.toFixed(1) + 'em'; }));
    layout.appendChild(rangeField(t, 'sectionGap', 'Space between sections', 0.4, 4, 0.1, function (v) { return v.toFixed(1) + 'em'; }));
    layout.appendChild(rangeField(t, 'itemGap', 'Space between items', 0.2, 2.5, 0.05, function (v) { return v.toFixed(2) + 'em'; }));
    layout.appendChild(rangeField(t, 'columnGap', 'Space between columns', 1, 6, 0.1, function (v) { return v.toFixed(1) + 'em'; }));
    layout.appendChild(checkField(t, 'autoFit', 'Auto-fit text to fill the screen (no scrolling)'));
    grid.appendChild(layout);

    // Background
    var bg = designGroup('Background');
    bg.appendChild(colorField(t, 'background', 'Background color'));
    bg.appendChild(textField(t, 'backgroundImage', 'Background image URL (optional)', 'https://...'));
    bg.appendChild(rangeField(t, 'overlay', 'Image darkness overlay', 0, 0.9, 0.05, function (v) { return Math.round(v * 100) + '%'; }));
    grid.appendChild(bg);

    // Typography: per element — size, weight, line height — under one roof
    var type = designGroup('Typography');
    var fontOptions = PC.FONTS.map(function (f) { return { value: f.name, label: f.name }; });
    var sizeFmt = function (v) { return v.toFixed(2) + 'x'; };
    var wFmt = function (v) { return String(v); };
    var lFmt = function (v) { return v.toFixed(2); };
    type.appendChild(selectField(t, 'headingFont', 'Heading font (titles & sections)', fontOptions));
    type.appendChild(selectField(t, 'bodyFont', 'Body font (items & prices)', fontOptions));
    [
      { label: 'Menu title', size: ['menuTitleSize', 1, 6, 0.1], weight: 'menuTitleWeight', line: 'menuTitleLine' },
      { label: 'Section titles', size: ['sectionTitleSize', 0.8, 3.5, 0.05], weight: 'sectionTitleWeight', line: 'sectionTitleLine' },
      { label: 'Item titles', size: ['itemTitleSize', 0.6, 2.5, 0.05], weight: 'itemTitleWeight', line: 'itemTitleLine' },
      { label: 'Descriptions', size: ['descSize', 0.4, 1.5, 0.02], weight: 'descWeight', line: 'descLine' },
      { label: 'Prices', size: ['priceSize', 0.5, 2.5, 0.05], weight: 'priceWeight', line: 'priceLine' }
    ].forEach(function (row) {
      type.appendChild(h('h4', null, row.label));
      type.appendChild(rangeField(t, row.size[0], 'Size', row.size[1], row.size[2], row.size[3], sizeFmt));
      // Variable fonts render every weight step; single-weight fonts like
      // Bebas Neue synthesize bolder/lighter as best the browser can.
      type.appendChild(rangeField(t, row.weight, 'Weight', 100, 900, 10, wFmt));
      type.appendChild(rangeField(t, row.line, 'Line height', 0.8, 2.2, 0.05, lFmt));
    });
    grid.appendChild(type);

    // Colors
    var colors = designGroup('Colors');
    colors.appendChild(colorField(t, 'menuTitleColor', 'Menu title'));
    colors.appendChild(colorField(t, 'sectionTitleColor', 'Section titles'));
    colors.appendChild(colorField(t, 'accentColor', 'Accent / dividers'));
    colors.appendChild(colorField(t, 'itemTitleColor', 'Item titles'));
    colors.appendChild(colorField(t, 'descColor', 'Descriptions'));
    colors.appendChild(colorField(t, 'priceColor', 'Prices'));
    colors.appendChild(colorField(t, 'sizeLabelColor', 'Size labels (12oz, 16oz…)'));
    colors.appendChild(colorField(t, 'badgeColor', 'Sold out badge'));
    colors.appendChild(colorField(t, 'badgeTextColor', 'Sold out badge text'));
    grid.appendChild(colors);

    // Items — boxes, featured highlight, descriptions, leaders, sold out
    var items = designGroup('Items');
    items.appendChild(checkField(t, 'itemBox', 'Show each item in a rounded box'));
    items.appendChild(colorField(t, 'itemBoxColor', 'Item box color'));
    items.appendChild(rangeField(t, 'itemBoxRadius', 'Box corner radius', 0, 1.5, 0.05, function (v) { return v.toFixed(2) + 'em'; }));
    items.appendChild(colorField(t, 'featuredColor', 'Featured item highlight'));
    items.appendChild(checkField(t, 'showDescriptions', 'Show item descriptions'));
    items.appendChild(checkField(t, 'dotLeaders', 'Dotted line between item and price'));
    items.appendChild(selectField(t, 'soldOutStyle', 'Sold out items', [
      { value: 'badge', label: 'Show a SOLD OUT badge' },
      { value: 'strike', label: 'Strike through' },
      { value: 'hide', label: 'Hide from the board' }
    ]));
    items.appendChild(textField(t, 'soldOutText', 'Sold out badge text', 'SOLD OUT'));
    grid.appendChild(items);

    // Options
    var opts = designGroup('Options');
    opts.appendChild(checkField(t, 'showMenuTitle', 'Show the menu title'));
    opts.appendChild(checkField(t, 'uppercaseSections', 'Uppercase section titles'));
    opts.appendChild(checkField(t, 'sectionDivider', 'Show section divider lines'));
    opts.appendChild(textField(t, 'currency', 'Currency symbol', '$'));
    opts.appendChild(button('danger-ghost', 'Reset design to defaults', null, onReset));
    grid.appendChild(opts);
  }

  function renderDesign(root, menu) {
    var grid = h('div', 'design-grid');

    // Global (stored on the whole state, not this menu's theme)
    var globalGroup = designGroup('Global — applies to every menu');
    globalGroup.appendChild(textField(state.settings, 'menuTitle', 'Board title on all menus', "Leave blank to use each menu's name"));
    grid.appendChild(globalGroup);

    appendDesignControls(grid, menu.theme, function () {
      if (!confirm('Reset all design settings for this menu to the defaults?')) return;
      menu.theme = PC.clone(PC.DEFAULT_THEME);
      scheduleSave();
      renderEditor();
    });
    root.appendChild(grid);
  }

  // A location's Design tab: optionally style this physical screen once and
  // have every menu it shows use that design (handy for portrait TVs or a
  // screen that needs bigger text).
  function renderLocationDesign(root, loc) {
    var toggleWrap = h('div', 'menu-meta');
    var toggle = h('label', 'check');
    var input = h('input');
    input.type = 'checkbox';
    input.checked = !!loc.customDesign;
    input.addEventListener('change', function () {
      loc.customDesign = input.checked;
      if (loc.customDesign && !loc.theme) {
        // Start from the design of the menu this screen usually shows.
        var src = PC.menuById(state, loc.defaultMenuId);
        loc.theme = PC.clone(src ? src.theme : PC.DEFAULT_THEME);
      }
      scheduleSave();
      renderEditor();
    });
    toggle.appendChild(input);
    toggle.appendChild(h('span', null, 'Use a custom design for this screen (overrides the design of every menu it shows)'));
    toggleWrap.appendChild(toggle);
    root.appendChild(toggleWrap);

    if (!loc.customDesign) {
      root.appendChild(h('p', 'loc-help',
        'This screen currently uses each menu’s own design. Turn on the custom design to style this screen once — every menu it shows will use these settings.'));
      return;
    }

    var grid = h('div', 'design-grid');
    appendDesignControls(grid, loc.theme, function () {
      if (!confirm('Reset this screen’s design to the defaults?')) return;
      loc.theme = PC.clone(PC.DEFAULT_THEME);
      scheduleSave();
      renderEditor();
    });
    root.appendChild(grid);
  }

  //// ---------- Location editor + schedule calendar ----------

  function menuColor(menuId) {
    var idx = 0;
    for (var i = 0; i < state.menus.length; i++) {
      if (state.menus[i].id === menuId) { idx = i; break; }
    }
    return 'hsl(' + Math.round(idx * 137.5 % 360) + ', 48%, 42%)';
  }

  function menuSelectOptions(select, includeNone, noneLabel) {
    select.innerHTML = '';
    if (includeNone) {
      var none = h('option', null, noneLabel || '— none (screen goes to setup page) —');
      none.value = '';
      select.appendChild(none);
    }
    state.menus.forEach(function (m) {
      var o = h('option', null, m.name);
      o.value = m.id;
      select.appendChild(o);
    });
  }

  function renderLocationEditor(root, loc) {
    var meta = h('div', 'menu-meta');

    var nameField = h('label', 'field grow');
    nameField.appendChild(h('span', null, 'Location name (a physical screen)'));
    var nameInput = h('input');
    nameInput.type = 'text';
    nameInput.value = loc.name;
    nameInput.addEventListener('input', function () {
      loc.name = nameInput.value;
      loc.slug = PC.slugify(nameInput.value);
      scheduleSave();
      renderMenuList();
      linkCode.textContent = displayUrlForLocation(loc);
    });
    nameField.appendChild(nameInput);
    meta.appendChild(nameField);

    var defField = h('label', 'field');
    defField.appendChild(h('span', null, 'Default menu (when nothing is scheduled)'));
    var defSelect = h('select');
    menuSelectOptions(defSelect, true);
    defSelect.value = loc.defaultMenuId || '';
    defSelect.addEventListener('change', function () {
      loc.defaultMenuId = defSelect.value;
      scheduleSave();
      updatePreview(true);
    });
    defField.appendChild(defSelect);
    meta.appendChild(defField);

    meta.appendChild(button('danger-ghost', 'Delete location', null, function () {
      if (!confirm('Delete the location "' + loc.name + '"? Any TV pointed at it will show the setup page.')) return;
      state.locations = state.locations.filter(function (l) { return l.id !== loc.id; });
      ensureValidSelection();
      scheduleSave();
      renderAll();
    }));

    var link = h('div', 'display-link');
    link.appendChild(h('span', null, 'Display URL for this screen:'));
    var linkCode = h('code', null, displayUrlForLocation(loc));
    link.appendChild(linkCode);
    link.appendChild(button('icon', 'Copy', 'Copy the display URL for this screen', function () {
      copyText(displayUrlForLocation(loc), 'Display URL copied');
    }));
    meta.appendChild(link);
    root.appendChild(meta);

    var help = h('p', 'loc-help',
      'Schedule which menu this screen shows and when. Click an empty time slot to add a scheduled menu, or click an existing block to edit it. ' +
      'Weekly menus repeat every week; single-date menus (dashed outline) override weekly ones on that day. Outside all scheduled times the default menu shows.');
    root.appendChild(help);

    root.appendChild(renderCalendar(loc));
  }

  function renderCalendar(loc) {
    var cal = h('div', 'calendar');

    // --- toolbar ---
    var bar = h('div', 'cal-toolbar');
    var weekEnd = new Date(calWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    var fmt = function (d) { return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); };
    bar.appendChild(button('icon', '‹', 'Previous week', function () {
      calWeekStart.setDate(calWeekStart.getDate() - 7);
      renderEditor();
    }));
    bar.appendChild(button('icon', '›', 'Next week', function () {
      calWeekStart.setDate(calWeekStart.getDate() + 7);
      renderEditor();
    }));
    bar.appendChild(button('icon', 'Today', null, function () {
      calWeekStart = startOfWeek(new Date());
      renderEditor();
    }));
    bar.appendChild(h('h3', null, fmt(calWeekStart) + ' – ' + fmt(weekEnd)));
    bar.appendChild(button('primary', '+ Schedule menu', null, function () {
      openEventModal(loc, null, { days: [new Date().getDay()], start: '06:00', end: '11:00' });
    }));
    cal.appendChild(bar);

    // --- day-name header ---
    var head = h('div', 'cal-head');
    head.appendChild(h('div'));
    var todayStr = PC.localDateStr(new Date());
    var colDates = [];
    for (var d = 0; d < 7; d++) {
      var date = new Date(calWeekStart);
      date.setDate(date.getDate() + d);
      colDates.push(PC.localDateStr(date));
      var name = h('div', 'cal-day-name',
        date.toLocaleDateString([], { weekday: 'short' }) + ' ' + date.getDate());
      if (colDates[d] === todayStr) name.style.color = 'var(--accent)';
      head.appendChild(name);
    }
    cal.appendChild(head);

    // --- scrollable week grid ---
    var scroll = h('div', 'cal-scroll');
    var grid = h('div', 'cal-grid');
    var totalH = 24 * HOUR_H;

    var gutter = h('div', 'cal-gutter');
    gutter.style.height = totalH + 'px';
    for (var hr = 1; hr < 24; hr++) {
      var lbl = h('span', 'cal-hour-label',
        (hr % 12 === 0 ? 12 : hr % 12) + (hr < 12 ? 'am' : 'pm'));
      lbl.style.top = (hr * HOUR_H) + 'px';
      gutter.appendChild(lbl);
    }
    grid.appendChild(gutter);

    for (var day = 0; day < 7; day++) {
      grid.appendChild(renderCalDay(loc, day, colDates[day], totalH));
    }

    scroll.appendChild(grid);
    cal.appendChild(scroll);

    // --- legend ---
    var legend = h('div', 'cal-legend');
    legend.appendChild(h('span', null, 'Menus:'));
    state.menus.forEach(function (m) {
      var chip = h('span', 'chip');
      var sw = h('span', 'swatch');
      sw.style.background = menuColor(m.id);
      chip.appendChild(sw);
      chip.appendChild(h('span', null, m.name));
      legend.appendChild(chip);
    });
    cal.appendChild(legend);

    // Scroll to early morning once the calendar is in the document.
    requestAnimationFrame(function () { scroll.scrollTop = 5.5 * HOUR_H; });
    return cal;
  }

  function minutesOf(hm) {
    var parts = String(hm || '0:0').split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  function renderCalDay(loc, day, dateStr, totalH) {
    var col = h('div', 'cal-col');
    col.style.height = totalH + 'px';
    col.style.background =
      'repeating-linear-gradient(to bottom, transparent 0, transparent ' + (HOUR_H - 1) + 'px, rgba(255,255,255,0.05) ' + (HOUR_H - 1) + 'px, rgba(255,255,255,0.05) ' + HOUR_H + 'px)';

    // Click an empty slot to schedule a menu at that time/day.
    col.addEventListener('click', function (ev) {
      if (ev.target !== col) return; // clicks on event blocks handled below
      var hour = Math.max(0, Math.min(23, Math.floor(ev.offsetY / HOUR_H)));
      openEventModal(loc, null, {
        days: [day],
        date: dateStr,
        start: pad2(hour) + ':00',
        end: hour >= 23 ? '23:59' : pad2(hour + 1) + ':00'
      });
    });

    (loc.schedule || []).forEach(function (evt) {
      var applies = evt.date ? evt.date === dateStr : (evt.days || []).indexOf(day) !== -1;
      if (!applies) return;
      var startMin = minutesOf(evt.start);
      var endMin = Math.max(startMin + 15, minutesOf(evt.end));
      var block = h('div', 'cal-event' + (evt.date ? ' cal-event-date' : ''));
      block.style.top = (startMin / 60 * HOUR_H) + 'px';
      block.style.height = Math.max(18, (endMin - startMin) / 60 * HOUR_H - 2) + 'px';
      block.style.background = menuColor(evt.menuId);
      var m = PC.menuById(state, evt.menuId);
      block.appendChild(h('div', null, (m ? m.name : '(deleted menu)') + (evt.date ? ' · ' + evt.date : '')));
      block.appendChild(h('div', 'cal-event-time', evt.start + ' – ' + evt.end));
      block.title = 'Click to edit';
      block.addEventListener('click', function (e) {
        e.stopPropagation();
        openEventModal(loc, evt, null);
      });
      col.appendChild(block);
    });

    return col;
  }

  //// ---------- Schedule event modal ----------

  var eventCtx = null; // { loc, evt (null = creating), defaultDate }

  function openEventModal(loc, evt, defaults) {
    eventCtx = { loc: loc, evt: evt, defaultDate: (defaults && defaults.date) || PC.localDateStr(new Date()) };
    var isNew = !evt;
    $('#event-modal-title').textContent = isNew ? 'Schedule a menu' : 'Edit scheduled menu';
    $('#btn-evt-delete').style.visibility = isNew ? 'hidden' : 'visible';

    menuSelectOptions($('#evt-menu'), false);
    var src = evt || {
      menuId: state.menus.length ? state.menus[0].id : '',
      days: (defaults && defaults.days) || [1, 2, 3, 4, 5],
      date: '',
      start: (defaults && defaults.start) || '06:00',
      end: (defaults && defaults.end) || '11:00'
    };
    $('#evt-menu').value = src.menuId || (state.menus.length ? state.menus[0].id : '');
    $all('#evt-days input').forEach(function (cb) {
      cb.checked = (src.days || []).indexOf(parseInt(cb.value, 10)) !== -1;
    });
    $('#evt-single-date').checked = !!src.date;
    $('#evt-date').value = src.date || eventCtx.defaultDate;
    $('#evt-start').value = src.start;
    $('#evt-end').value = src.end;
    $('#evt-error').textContent = '';
    syncEventModalMode();
    $('#event-modal').classList.add('open');
  }

  function syncEventModalMode() {
    var single = $('#evt-single-date').checked;
    $('#evt-date-field').hidden = !single;
    $('#evt-days').parentElement.hidden = single;
  }

  function saveEventFromModal() {
    if (!eventCtx) return;
    var loc = eventCtx.loc;
    var single = $('#evt-single-date').checked;
    var days = $all('#evt-days input')
      .filter(function (cb) { return cb.checked; })
      .map(function (cb) { return parseInt(cb.value, 10); });
    var date = single ? $('#evt-date').value : '';
    var start = $('#evt-start').value;
    var end = $('#evt-end').value;
    var menuId = $('#evt-menu').value;

    var err = '';
    if (!menuId) err = 'Pick a menu to show.';
    else if (single && !date) err = 'Pick the date.';
    else if (!single && !days.length) err = 'Pick at least one day of the week.';
    else if (!start || !end || end <= start) err = 'The end time must be after the start time.';
    if (err) {
      $('#evt-error').textContent = err;
      return;
    }

    var evt = eventCtx.evt;
    if (!evt) {
      evt = PC.newScheduleEvent(menuId);
      loc.schedule.push(evt);
    }
    evt.menuId = menuId;
    evt.days = single ? [] : days;
    evt.date = date;
    evt.start = start;
    evt.end = end;

    $('#event-modal').classList.remove('open');
    eventCtx = null;
    scheduleSave();
    renderEditor();
    updatePreview(true);
  }

  //// ---------- Editor + preview ----------

  function renderEditor() {
    var root = $('#editor-body');
    root.innerHTML = '';

    if (sel.kind === 'location') {
      $('#menu-tabs').style.display = '';
      $('#tab-content').textContent = 'Screen & Schedule';
      var loc = currentLocation();
      if (!loc) return;
      if (sel.tab === 'content') renderLocationEditor(root, loc);
      else renderLocationDesign(root, loc);
      return;
    }

    $('#menu-tabs').style.display = '';
    $('#tab-content').textContent = 'Content';
    var menu = currentMenu();
    if (!menu) {
      root.appendChild(h('div', 'empty-note', 'No menus yet. Click "+ New Menu" to create your first menu.'));
      return;
    }
    if (sel.tab === 'content') renderContent(root, menu);
    else renderDesign(root, menu);
  }

  var lastPreviewSrcKey = null;
  function updatePreview(force) {
    var frame = $('#preview-frame');
    var srcKey = sel.kind + ':' + sel.id;
    if (!force && srcKey === lastPreviewSrcKey) return;
    lastPreviewSrcKey = srcKey;
    if (sel.kind === 'location') {
      var loc = currentLocation();
      if (loc) { frame.src = 'display.html?preview=1&location=' + encodeURIComponent(loc.id) + '&r=' + Date.now(); return; }
    } else {
      var menu = currentMenu();
      if (menu) { frame.src = 'display.html?preview=1&menu=' + encodeURIComponent(menu.id) + '&r=' + Date.now(); return; }
    }
    lastPreviewSrcKey = null;
    frame.removeAttribute('src');
    // Content/design edits reach the iframe automatically through
    // PC.save() -> BroadcastChannel -> display.js re-render.
  }

  function sizePreview() {
    var wrap = $('.preview-frame-wrap');
    var stage = $('#preview-stage');
    var frame = $('#preview-frame');
    var maxW = wrap.clientWidth - 24;
    var maxH = wrap.clientHeight - 24;
    if (maxW <= 0 || maxH <= 0) return;
    var land = previewAspect !== '9:16';
    var nativeW = land ? 1920 : 1080;
    var nativeH = land ? 1080 : 1920;
    var aspect = nativeW / nativeH;
    var w = Math.min(maxW, maxH * aspect);
    stage.style.width = w + 'px';
    stage.style.height = (w / aspect) + 'px';
    frame.style.width = nativeW + 'px';
    frame.style.height = nativeH + 'px';
    frame.style.transform = 'scale(' + (w / nativeW) + ')';
  }

  function setAspect(aspect) {
    previewAspect = aspect;
    try { localStorage.setItem(ASPECT_KEY, aspect); } catch (e) {}
    $('#btn-aspect-landscape').classList.toggle('active', aspect === '16:9');
    $('#btn-aspect-portrait').classList.toggle('active', aspect === '9:16');
    sizePreview();
  }

  function renderAll() {
    renderMenuList();
    renderEditor();
    updatePreview();
    sizePreview();
    refreshStatus();
  }

  //// ---------- Wire up chrome ----------

  $('#tab-content').addEventListener('click', function () {
    sel.tab = 'content';
    $('#tab-content').classList.add('active');
    $('#tab-design').classList.remove('active');
    renderEditor();
  });
  $('#tab-design').addEventListener('click', function () {
    sel.tab = 'design';
    $('#tab-design').classList.add('active');
    $('#tab-content').classList.remove('active');
    renderEditor();
  });

  $('#btn-add-menu').addEventListener('click', function () {
    var name = prompt('Name for the new menu:', 'New Menu');
    if (name === null) return;
    var menu = PC.newMenu(name || 'New Menu');
    state.menus.push(menu);
    sel.kind = 'menu';
    sel.id = menu.id;
    sel.tab = 'content';
    scheduleSave();
    renderAll();
  });

  $('#btn-add-location').addEventListener('click', function () {
    var name = prompt('Name for the new location (a physical screen):', 'Cafe Screen');
    if (name === null) return;
    var loc = PC.newLocation(name || 'New Location');
    loc.defaultMenuId = state.menus.length ? state.menus[0].id : '';
    state.locations.push(loc);
    sel.kind = 'location';
    sel.id = loc.id;
    scheduleSave();
    renderAll();
  });

  $('#btn-sync-now').addEventListener('click', function () {
    clearTimeout(saveTimer);
    PC.save(state);
    clearTimeout(syncTimer);
    doSync().then(function (ok) {
      if (ok) toast('Synced — boards update within ~30 seconds.');
    });
  });

  $('#btn-sync-info').addEventListener('click', openSyncInfo);
  $('#btn-sync-close').addEventListener('click', function () {
    $('#sync-modal').classList.remove('open');
  });
  $('#sync-modal').addEventListener('click', function (ev) {
    if (ev.target === $('#sync-modal')) $('#sync-modal').classList.remove('open');
  });
  $('#btn-copy-admin-link').addEventListener('click', function () {
    copyText(adminSyncUrl(), 'Admin link copied');
  });
  $('#btn-new-channel').addEventListener('click', function () {
    if (!confirm('Start a NEW sync channel? Every TV will need its display URL re-copied. Only do this if the current channel is broken or was tampered with.')) return;
    state.syncId = '';
    saveSyncMeta({});
    ensureChannel().then(function (id) {
      if (id) {
        toast('New sync channel created — re-copy the display URLs.');
        openSyncInfo();
        renderEditor();
      }
    });
  });

  // Schedule event modal
  $('#evt-single-date').addEventListener('change', function () {
    if (this.checked && !$('#evt-date').value && eventCtx) {
      $('#evt-date').value = eventCtx.defaultDate;
    }
    syncEventModalMode();
  });
  $('#btn-evt-save').addEventListener('click', saveEventFromModal);
  $('#btn-evt-cancel').addEventListener('click', function () {
    $('#event-modal').classList.remove('open');
    eventCtx = null;
  });
  $('#btn-evt-delete').addEventListener('click', function () {
    if (!eventCtx || !eventCtx.evt) return;
    var loc = eventCtx.loc;
    loc.schedule = loc.schedule.filter(function (e) { return e.id !== eventCtx.evt.id; });
    $('#event-modal').classList.remove('open');
    eventCtx = null;
    scheduleSave();
    renderEditor();
    updatePreview(true);
  });
  $('#event-modal').addEventListener('click', function (ev) {
    if (ev.target === $('#event-modal')) {
      $('#event-modal').classList.remove('open');
      eventCtx = null;
    }
  });

  // Preview aspect toggle
  $('#btn-aspect-landscape').addEventListener('click', function () { setAspect('16:9'); });
  $('#btn-aspect-portrait').addEventListener('click', function () { setAspect('9:16'); });

  $('#btn-open-display').addEventListener('click', function () {
    if (sel.kind === 'location') {
      var loc = currentLocation();
      if (loc) window.open(displayUrlForLocation(loc), '_blank');
      return;
    }
    var menu = currentMenu();
    if (menu) window.open(displayUrlFor(menu), '_blank');
  });

  $('#btn-export').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'phoenix-cafe-menus.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('#btn-import').addEventListener('click', function () {
    $('#import-file').click();
  });
  $('#import-file').addEventListener('change', function () {
    var file = this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = PC.normalizeState(JSON.parse(reader.result));
        if (!imported || !imported.menus) throw new Error('bad format');
        if (!confirm('Replace ALL current menus with the ' + imported.menus.length + ' menu(s) from this file?')) return;
        // Keep our existing sync channel so TVs don't need new URLs,
        // unless we don't have one and the file does.
        imported.syncId = state.syncId || imported.syncId || '';
        state = imported;
        sel.kind = 'menu';
        sel.id = state.menus.length ? state.menus[0].id : null;
        scheduleSave();
        renderAll();
        toast('Menus imported');
      } catch (e) {
        alert('That file is not a valid Phoenix Cafe menu export.');
      }
    };
    reader.readAsText(file);
  });

  window.addEventListener('resize', sizePreview);

  // Pull remote edits (from another admin computer) periodically and on focus.
  setInterval(pullFromChannel, PULL_INTERVAL_MS);
  window.addEventListener('focus', function () { pullFromChannel(); });

  // Last-ditch flush if the tab closes with unsynced changes.
  window.addEventListener('beforeunload', function (ev) {
    var meta = loadSyncMeta();
    if (state.syncId && meta.syncedUpdatedAt !== state.updatedAt) {
      clearTimeout(syncTimer);
      doSync({ keepalive: true });
      ev.preventDefault();
      ev.returnValue = '';
    }
  });

  //// ---------- Boot ----------

  function boot() {
    setAspect(previewAspect);
    var urlSync = new URLSearchParams(window.location.search).get('sync');

    if (urlSync) {
      // Opened from a shared admin link: adopt that sync channel.
      PC.sync.get(urlSync).then(function (remote) {
        if (remote && remote.menus && remote.menus.length &&
            (seededFresh || state.seed || String(remote.updatedAt || '') > String(state.updatedAt || ''))) {
          state = remote;
        }
        state.syncId = urlSync;
        ensureValidSelection();
        sel.id = sel.id || (state.menus.length ? state.menus[0].id : null);
        PC.save(state);
        saveSyncMeta({ syncedUpdatedAt: state.updatedAt, at: new Date().toISOString() });
        renderAll();
      }).catch(function () {
        renderAll();
        toast('Could not reach the sync channel from this link.');
      });
      return;
    }

    if (state.syncId) {
      renderAll();
      pullFromChannel();
      return;
    }

    if (seededFresh) {
      // Brand-new browser with no sync link: prefer the repo's published
      // data over the built-in sample, then start a sync channel. If the
      // published file names a sync channel, pull it BEFORE saving anything
      // locally — saving re-stamps updatedAt, which would make a stale file
      // beat the live channel and push old data over everyone's boards.
      PC.fetchPublished().then(function (published) {
        if (published && published.menus.length) {
          state = published;
          ensureValidSelection();
          sel.id = state.menus[0].id;
        }
        renderAll();
        if (state.syncId) {
          pullFromChannel().then(function (adopted) {
            if (!adopted) PC.save(state);
          });
        } else {
          PC.save(state);
          ensureChannel();
        }
      }).catch(function () {
        PC.save(state);
        renderAll();
        ensureChannel();
      });
    } else {
      renderAll();
      ensureChannel();
    }
  }

  boot();
})();
