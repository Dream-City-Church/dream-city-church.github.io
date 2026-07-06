////
// Phoenix Cafe Menu Board - Admin
// Edit menus/sections/items, control all styling, and publish to GitHub
// so every display updates automatically.
////

(function () {
  'use strict';

  var PUBLISH_CFG_KEY = 'phoenixCafe.publish.v1';
  var PUBLISH_META_KEY = 'phoenixCafe.publishMeta.v1';
  var SAVE_DEBOUNCE_MS = 500;
  var AUTOPUBLISH_DEBOUNCE_MS = 4000;

  //// ---------- Tiny DOM helpers ----------

  function $(sel, root) { return (root || document).querySelector(sel); }

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
    toast._timer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function moveInArray(arr, index, delta) {
    var to = index + delta;
    if (to < 0 || to >= arr.length) return false;
    var tmp = arr[index];
    arr[index] = arr[to];
    arr[to] = tmp;
    return true;
  }

  //// ---------- App state ----------

  var state = PC.load();
  var seededFresh = false;
  if (!state || !state.menus.length) {
    // First run on this device: try the published data before seeding samples.
    state = state || PC.seedState();
    seededFresh = true;
  }

  var sel = {
    menuId: state.menus.length ? state.menus[0].id : null,
    tab: 'content'
  };
  var openItems = {};      // itemId -> true (expanded editor cards)
  var saveTimer = null;
  var publishTimer = null;
  var publishing = false;

  function currentMenu() {
    for (var i = 0; i < state.menus.length; i++) {
      if (state.menus[i].id === sel.menuId) return state.menus[i];
    }
    return null;
  }

  //// ---------- Saving ----------

  function scheduleSave() {
    setStatus('Saving…', 'dirty');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, SAVE_DEBOUNCE_MS);
  }

  function doSave() {
    PC.save(state);
    refreshStatus();
    var cfg = loadPublishCfg();
    if (cfg.autoPublish && cfg.token) {
      clearTimeout(publishTimer);
      publishTimer = setTimeout(function () { publish(true); }, AUTOPUBLISH_DEBOUNCE_MS);
    }
  }

  function setStatus(text, cls) {
    var s = $('#save-status');
    s.textContent = text;
    s.className = cls || '';
  }

  function refreshStatus() {
    if (publishing) { setStatus('Publishing…', 'dirty'); return; }
    var cfg = loadPublishCfg();
    var meta = loadPublishMeta();
    if (!cfg.token) {
      setStatus('Saved on this device · publishing not set up', '');
    } else if (meta.publishedUpdatedAt !== state.updatedAt) {
      setStatus('Saved · unpublished changes', 'dirty');
    } else {
      var when = meta.lastPublishedAt ? new Date(meta.lastPublishedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
      setStatus('Published' + (when ? ' · ' + when : ''), 'ok');
    }
  }

  //// ---------- Publish config ----------

  function defaultPublishCfg() {
    var owner = '';
    var repo = '';
    var host = window.location.hostname;
    if (/\.github\.io$/.test(host)) {
      owner = host.replace(/\.github\.io$/, '');
      repo = host;
    }
    return {
      token: '',
      owner: owner,
      repo: repo,
      branch: 'master',
      path: 'phoenix-cafe/data/menus.json',
      autoPublish: true
    };
  }

  function loadPublishCfg() {
    try {
      var raw = localStorage.getItem(PUBLISH_CFG_KEY);
      if (raw) return Object.assign(defaultPublishCfg(), JSON.parse(raw));
    } catch (e) {}
    return defaultPublishCfg();
  }

  function savePublishCfg(cfg) {
    localStorage.setItem(PUBLISH_CFG_KEY, JSON.stringify(cfg));
  }

  function loadPublishMeta() {
    try {
      var raw = localStorage.getItem(PUBLISH_META_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function savePublishMeta(meta) {
    localStorage.setItem(PUBLISH_META_KEY, JSON.stringify(meta));
  }

  //// ---------- GitHub publishing ----------

  function ghHeaders(cfg) {
    return {
      'Authorization': 'Bearer ' + cfg.token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  function ghContentsUrl(cfg) {
    return 'https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' +
      encodeURIComponent(cfg.repo) + '/contents/' +
      cfg.path.split('/').map(encodeURIComponent).join('/');
  }

  function b64EncodeUtf8(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function publish(silent) {
    var cfg = loadPublishCfg();
    if (!cfg.token || !cfg.owner || !cfg.repo || !cfg.path) {
      openSettings();
      if (!silent) toast('Set up publishing first');
      return Promise.resolve(false);
    }
    if (publishing) return Promise.resolve(false);
    publishing = true;
    refreshStatus();

    var url = ghContentsUrl(cfg);
    var publishedUpdatedAt = state.updatedAt;
    var body = JSON.stringify(state, null, 2);

    // Get the current file SHA (required to update an existing file)
    return fetch(url + '?ref=' + encodeURIComponent(cfg.branch), { headers: ghHeaders(cfg) })
      .then(function (res) {
        if (res.status === 200) return res.json().then(function (j) { return j.sha; });
        if (res.status === 404) return null;
        throw new Error('GitHub read failed (HTTP ' + res.status + ')');
      })
      .then(function (sha) {
        var payload = {
          message: 'Update Phoenix Cafe menus',
          content: b64EncodeUtf8(body),
          branch: cfg.branch
        };
        if (sha) payload.sha = sha;
        return fetch(url, {
          method: 'PUT',
          headers: Object.assign({ 'Content-Type': 'application/json' }, ghHeaders(cfg)),
          body: JSON.stringify(payload)
        });
      })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (j) {
            throw new Error('GitHub publish failed (HTTP ' + res.status + ')' + (j.message ? ': ' + j.message : ''));
          });
        }
        savePublishMeta({ lastPublishedAt: new Date().toISOString(), publishedUpdatedAt: publishedUpdatedAt });
        publishing = false;
        refreshStatus();
        if (!silent) toast('Published! Boards update within a minute or two.');
        return true;
      })
      .catch(function (err) {
        publishing = false;
        setStatus('Publish error: ' + err.message, 'error');
        if (!silent) toast('Publish failed — see status bar');
        return false;
      });
  }

  function testPublishConnection() {
    var cfg = readSettingsForm();
    var out = $('#publish-test-result');
    out.className = '';
    out.textContent = 'Testing…';
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      out.className = 'error';
      out.textContent = 'Token, owner, and repository are required.';
      return;
    }
    fetch('https://api.github.com/repos/' + encodeURIComponent(cfg.owner) + '/' + encodeURIComponent(cfg.repo) +
      '/branches/' + encodeURIComponent(cfg.branch), { headers: ghHeaders(cfg) })
      .then(function (res) {
        if (res.ok) {
          out.className = 'ok';
          out.textContent = 'Connected! Repository and branch found.';
        } else if (res.status === 401) {
          throw new Error('Token was rejected (401). Check the token value.');
        } else if (res.status === 404) {
          throw new Error('Repo or branch not found (404). Check owner/repo/branch and token repository access.');
        } else {
          throw new Error('HTTP ' + res.status);
        }
      })
      .catch(function (err) {
        out.className = 'error';
        out.textContent = err.message;
      });
  }

  //// ---------- Settings modal ----------

  function openSettings() {
    var cfg = loadPublishCfg();
    $('#cfg-token').value = cfg.token;
    $('#cfg-owner').value = cfg.owner;
    $('#cfg-repo').value = cfg.repo;
    $('#cfg-branch').value = cfg.branch;
    $('#cfg-path').value = cfg.path;
    $('#cfg-autopublish').checked = !!cfg.autoPublish;
    $('#publish-test-result').textContent = '';
    $('#publish-test-result').className = '';
    $('#settings-modal').classList.add('open');
  }

  function readSettingsForm() {
    return {
      token: $('#cfg-token').value.trim(),
      owner: $('#cfg-owner').value.trim(),
      repo: $('#cfg-repo').value.trim(),
      branch: $('#cfg-branch').value.trim() || 'master',
      path: $('#cfg-path').value.trim() || 'phoenix-cafe/data/menus.json',
      autoPublish: $('#cfg-autopublish').checked
    };
  }

  //// ---------- Menu list (sidebar) ----------

  function renderMenuList() {
    var list = $('#menu-list');
    list.innerHTML = '';
    state.menus.forEach(function (menu) {
      var row = h('button', 'menu-item' + (menu.id === sel.menuId ? ' active' : ''));
      row.appendChild(h('span', 'name', menu.name));
      row.addEventListener('click', function () {
        sel.menuId = menu.id;
        renderAll();
      });
      list.appendChild(row);
    });
  }

  //// ---------- Content tab ----------

  function displayUrlFor(menu) {
    var base = window.location.href.replace(/admin\.html.*$/, '');
    return base + 'display.html?menu=' + encodeURIComponent(menu.slug || menu.id);
  }

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
      sel.menuId = copy.id;
      scheduleSave();
      renderAll();
    }));

    meta.appendChild(button('danger-ghost', 'Delete menu', null, function () {
      if (!confirm('Delete the menu "' + menu.name + '"? This cannot be undone.')) return;
      state.menus = state.menus.filter(function (m) { return m.id !== menu.id; });
      sel.menuId = state.menus.length ? state.menus[0].id : null;
      scheduleSave();
      renderAll();
    }));

    var link = h('div', 'display-link');
    link.appendChild(h('span', null, 'Display URL:'));
    var linkCode = h('code', null, displayUrlFor(menu));
    link.appendChild(linkCode);
    link.appendChild(button('icon', 'Copy', 'Copy the display URL for this menu', function () {
      navigator.clipboard.writeText(displayUrlFor(menu)).then(function () {
        toast('Display URL copied');
      }, function () {
        prompt('Copy this URL:', displayUrlFor(menu));
      });
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

    card.appendChild(body);
    return card;
  }

  //// ---------- Design tab ----------

  function designGroup(title) {
    var g = h('div', 'design-group');
    g.appendChild(h('h3', null, title));
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

  function renderDesign(root, menu) {
    var t = menu.theme;
    var grid = h('div', 'design-grid');

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
    layout.appendChild(rangeField(t, 'baseSize', 'Base text size', 12, 48, 1, function (v) { return v + 'px'; }));
    layout.appendChild(rangeField(t, 'padding', 'Screen padding', 0.5, 5, 0.1, function (v) { return v.toFixed(1) + 'em'; }));
    layout.appendChild(rangeField(t, 'sectionGap', 'Space between sections', 0.4, 4, 0.1, function (v) { return v.toFixed(1) + 'em'; }));
    layout.appendChild(rangeField(t, 'itemGap', 'Space between items', 0.2, 2.5, 0.05, function (v) { return v.toFixed(2) + 'em'; }));
    layout.appendChild(rangeField(t, 'columnGap', 'Space between columns', 1, 6, 0.1, function (v) { return v.toFixed(1) + 'em'; }));
    layout.appendChild(checkField(t, 'autoFit', 'Auto-shrink to fit the screen (no scrolling)'));
    grid.appendChild(layout);

    // Background
    var bg = designGroup('Background');
    bg.appendChild(colorField(t, 'background', 'Background color'));
    bg.appendChild(textField(t, 'backgroundImage', 'Background image URL (optional)', 'https://...'));
    bg.appendChild(rangeField(t, 'overlay', 'Image darkness overlay', 0, 0.9, 0.05, function (v) { return Math.round(v * 100) + '%'; }));
    grid.appendChild(bg);

    // Typography
    var type = designGroup('Typography');
    var fontOptions = PC.FONTS.map(function (f) { return { value: f.name, label: f.name }; });
    type.appendChild(selectField(t, 'headingFont', 'Heading font (titles & sections)', fontOptions));
    type.appendChild(selectField(t, 'bodyFont', 'Body font (items & prices)', fontOptions));
    type.appendChild(rangeField(t, 'menuTitleSize', 'Menu title size', 1, 6, 0.1, function (v) { return v.toFixed(1) + 'x'; }));
    type.appendChild(rangeField(t, 'sectionTitleSize', 'Section title size', 0.8, 3.5, 0.05, function (v) { return v.toFixed(2) + 'x'; }));
    type.appendChild(rangeField(t, 'itemTitleSize', 'Item title size', 0.6, 2.5, 0.05, function (v) { return v.toFixed(2) + 'x'; }));
    type.appendChild(rangeField(t, 'descSize', 'Description size', 0.4, 1.5, 0.02, function (v) { return v.toFixed(2) + 'x'; }));
    type.appendChild(rangeField(t, 'priceSize', 'Price size', 0.5, 2.5, 0.05, function (v) { return v.toFixed(2) + 'x'; }));
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

    // Options
    var opts = designGroup('Options');
    opts.appendChild(checkField(t, 'showMenuTitle', 'Show the menu title'));
    opts.appendChild(checkField(t, 'showDescriptions', 'Show item descriptions'));
    opts.appendChild(checkField(t, 'uppercaseSections', 'Uppercase section titles'));
    opts.appendChild(checkField(t, 'sectionDivider', 'Show section divider lines'));
    opts.appendChild(checkField(t, 'dotLeaders', 'Dotted line between item and price'));
    opts.appendChild(selectField(t, 'soldOutStyle', 'Sold out items', [
      { value: 'badge', label: 'Show a SOLD OUT badge' },
      { value: 'strike', label: 'Strike through' },
      { value: 'hide', label: 'Hide from the board' }
    ]));
    opts.appendChild(textField(t, 'soldOutText', 'Sold out badge text', 'SOLD OUT'));
    opts.appendChild(textField(t, 'currency', 'Currency symbol', '$'));
    var reset = button('danger-ghost', 'Reset design to defaults', null, function () {
      if (!confirm('Reset all design settings for this menu to the defaults?')) return;
      menu.theme = PC.clone(PC.DEFAULT_THEME);
      scheduleSave();
      renderEditor();
    });
    opts.appendChild(reset);
    grid.appendChild(opts);

    root.appendChild(grid);
  }

  //// ---------- Editor + preview ----------

  function renderEditor() {
    var root = $('#editor-body');
    root.innerHTML = '';
    var menu = currentMenu();
    if (!menu) {
      root.appendChild(h('div', 'empty-note', 'No menus yet. Click "+ New Menu" to create your first menu.'));
      return;
    }
    if (sel.tab === 'content') renderContent(root, menu);
    else renderDesign(root, menu);
  }

  var lastPreviewMenuId = null;
  function updatePreview() {
    var menu = currentMenu();
    var frame = $('#preview-frame');
    if (!menu) {
      lastPreviewMenuId = null;
      frame.removeAttribute('src');
      return;
    }
    if (menu.id !== lastPreviewMenuId) {
      lastPreviewMenuId = menu.id;
      frame.src = 'display.html?preview=1&menu=' + encodeURIComponent(menu.id);
    }
    // Content/design changes reach the iframe automatically through
    // PC.save() -> BroadcastChannel -> display.js re-render.
  }

  function sizePreview() {
    var stage = $('#preview-stage');
    var frame = $('#preview-frame');
    var w = stage.clientWidth;
    if (!w) return;
    var hpx = Math.round(w * 9 / 16);
    stage.style.height = hpx + 'px';
    frame.style.transform = 'scale(' + (w / 1920) + ')';
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
    sel.menuId = menu.id;
    sel.tab = 'content';
    scheduleSave();
    renderAll();
  });

  $('#btn-publish').addEventListener('click', function () {
    // Flush any pending save first so we publish the latest state.
    clearTimeout(saveTimer);
    PC.save(state);
    publish(false);
  });

  $('#btn-settings').addEventListener('click', openSettings);
  $('#btn-settings-cancel').addEventListener('click', function () {
    $('#settings-modal').classList.remove('open');
  });
  $('#btn-settings-save').addEventListener('click', function () {
    savePublishCfg(readSettingsForm());
    $('#settings-modal').classList.remove('open');
    refreshStatus();
    toast('Publish settings saved');
  });
  $('#btn-test-publish').addEventListener('click', testPublishConnection);
  $('#settings-modal').addEventListener('click', function (ev) {
    if (ev.target === $('#settings-modal')) $('#settings-modal').classList.remove('open');
  });

  $('#btn-open-display').addEventListener('click', function () {
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
        state = imported;
        sel.menuId = state.menus.length ? state.menus[0].id : null;
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

  // Warn before leaving if a publish is still pending
  window.addEventListener('beforeunload', function (ev) {
    var cfg = loadPublishCfg();
    var meta = loadPublishMeta();
    if (cfg.token && cfg.autoPublish && meta.publishedUpdatedAt !== state.updatedAt) {
      // Try to flush the publish; the browser may or may not wait, so also warn.
      publish(true);
      ev.preventDefault();
      ev.returnValue = '';
    }
  });

  //// ---------- Boot ----------

  function boot() {
    if (seededFresh) {
      // A brand-new browser: prefer the published data over the sample seed
      // so a second admin computer sees the real menus.
      PC.fetchPublished().then(function (published) {
        if (published && published.menus.length) {
          state = published;
          sel.menuId = state.menus[0].id;
          PC.save(state);
        } else {
          PC.save(state);
        }
        renderAll();
      }).catch(function () {
        PC.save(state);
        renderAll();
      });
    } else {
      renderAll();
    }
  }

  boot();
})();
