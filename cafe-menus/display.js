////
// Phoenix Cafe Menu Board - Display
// Chromeless, non-interactive menu board for TVs / digital signage.
//
// Usage:
//   display.html?location=<slug>&sync=<channel id>   scheduled screen
//   display.html?menu=<slug>&sync=<channel id>       always one menu
//   ...&preview=1   (admin live preview - local data only)
//
// Data sources, newest wins:
//   1. This device's localStorage (instant updates while editing here)
//   2. The cloud sync channel (?sync=..., polled - updated by the admin
//      automatically after every change)
//   3. data/menus.json in this repo (fallback when no sync id is known)
//
// A location decides WHICH menu is on screen right now from its weekly /
// single-date schedule (falling back to its default menu), so one admin
// can drive many physical menu boards.
////

(function () {
  'use strict';

  var POLL_MS = 20000;          // how often to check for published changes
  var CLOCK_MS = 30000;         // how often to re-check the schedule clock
  var RELOAD_MS = 12 * 3600e3;  // full page refresh every 12h (kiosk health)

  var board = document.getElementById('board');
  var params = new URLSearchParams(window.location.search);
  var menuKey = params.get('menu') || '';
  var locationKey = params.get('location') || '';
  var syncParam = params.get('sync') || '';
  var isPreview = params.get('preview') === '1';

  var state = null;        // best data we've seen so far
  var lastRenderKey = '';  // avoid pointless repaints

  function currentMenu() {
    if (locationKey) {
      var loc = PC.findLocation(state, locationKey);
      if (!loc) return null;
      return PC.activeMenuForLocation(state, loc);
    }
    return PC.findMenu(state, menuKey);
  }

  function render() {
    var menu = currentMenu();
    if (!menu) {
      renderSetup();
      return;
    }
    var settings = (state && state.settings) || {};
    // Resolve the design: a location with its own design styles every menu it
    // shows; otherwise the menu's design (either following a shared theme or
    // its standalone custom one).
    var loc = locationKey ? PC.findLocation(state, locationKey) : null;
    var theme = (loc && loc.customDesign)
      ? PC.resolveTheme(state, loc)
      : PC.resolveTheme(state, menu);
    var key = JSON.stringify(menu) + '|' + JSON.stringify(settings) + '|' + JSON.stringify(theme) + '|' + window.innerWidth + 'x' + window.innerHeight;
    if (key === lastRenderKey) return;
    lastRenderKey = key;
    document.title = menu.name + ' - Menu';
    board.style.cursor = '';
    PC.renderMenu(board, menu, { settings: settings, theme: theme });
  }

  // Shown only when the URL has no valid ?location= / ?menu= - lists what's
  // available so whoever is setting up the TV can grab the right link.
  function renderSetup() {
    var key = 'setup|' + JSON.stringify(state ? { m: state.menus.length, l: (state.locations || []).length, u: state.updatedAt } : null);
    if (key === lastRenderKey) return;
    lastRenderKey = key;

    board.innerHTML = '';
    board.style.cursor = 'auto';
    var wrap = document.createElement('div');
    wrap.className = 'pc-setup';
    var h1 = document.createElement('h1');
    h1.textContent = 'Phoenix Cafe Menu Board';
    wrap.appendChild(h1);
    var p = document.createElement('p');
    if (locationKey) {
      p.textContent = 'No location named "' + locationKey + '" was found (or it has no menu to show right now). Pick a screen below:';
    } else if (menuKey) {
      p.textContent = 'No menu named "' + menuKey + '" was found. Pick one below:';
    } else {
      p.textContent = 'Point this screen at a location (scheduled) or a single menu:';
    }
    wrap.appendChild(p);

    function addList(title, entries, param) {
      if (!entries.length) return;
      var h2 = document.createElement('h2');
      h2.textContent = title;
      h2.style.color = '#9aa0a8';
      h2.style.fontSize = '14px';
      h2.style.textTransform = 'uppercase';
      wrap.appendChild(h2);
      var ul = document.createElement('ul');
      entries.forEach(function (m) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        var url = window.location.pathname + '?' + param + '=' + encodeURIComponent(m.slug || m.id);
        if (syncParam || (state && state.syncId)) {
          url += '&sync=' + encodeURIComponent(syncParam || state.syncId);
        }
        a.href = url;
        a.textContent = m.name;
        li.appendChild(a);
        li.appendChild(document.createTextNode(' — '));
        var code = document.createElement('code');
        code.textContent = window.location.origin + url;
        li.appendChild(code);
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
    }

    addList('Locations (scheduled screens)', (state && state.locations) || [], 'location');
    addList('Menus (always the same menu)', (state && state.menus) || [], 'menu');

    if (!state || (!state.menus.length && !(state.locations || []).length)) {
      var li = document.createElement('p');
      li.textContent = 'Nothing has been published yet. Create a menu in the admin first.';
      wrap.appendChild(li);
    }
    board.appendChild(wrap);
  }

  function adoptLocal() {
    var local = PC.load();
    if (local) state = PC.newerOf(state, local);
  }

  function syncId() {
    return syncParam || (state && state.syncId) || '';
  }

  function pollPublished() {
    var id = syncId();
    var fetching = id ? PC.sync.get(id) : PC.fetchPublished();
    fetching.then(function (published) {
      if (published) {
        state = PC.newerOf(state, published);
        render();
      }
    }).catch(function () {
      // Channel unreachable or nothing published yet - keep what we have.
    });
  }

  // --- boot ---
  adoptLocal();
  render();

  // Instant updates from an admin tab open on this same device.
  PC.subscribe(function () {
    adoptLocal();
    render();
  });

  // Re-evaluate the schedule as time passes (menu changes at boundaries).
  setInterval(render, CLOCK_MS);

  if (!isPreview) {
    pollPublished();
    setInterval(pollPublished, POLL_MS);
    setTimeout(function () { window.location.reload(); }, RELOAD_MS);
  }

  // Re-fit when the screen size changes.
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      lastRenderKey = '';
      render();
    }, 150);
  });
})();
