////
// Phoenix Cafe Menu Board - Display
// Chromeless, non-interactive menu board for TVs / digital signage.
//
// Usage:  display.html?menu=<slug or id>
// Extras: &preview=1  (used by the admin live preview - local data only)
//
// Data sources, newest wins:
//   1. This device's localStorage (instant updates while editing here)
//   2. The published data/menus.json in this repo (polled for other devices)
////

(function () {
  'use strict';

  var POLL_MS = 20000;          // how often to check for published changes
  var RELOAD_MS = 12 * 3600e3;  // full page refresh every 12h (kiosk health)

  var board = document.getElementById('board');
  var params = new URLSearchParams(window.location.search);
  var menuKey = params.get('menu') || '';
  var isPreview = params.get('preview') === '1';

  var state = null;        // best data we've seen so far
  var lastRenderKey = '';  // avoid pointless repaints

  function currentMenu() {
    return PC.findMenu(state, menuKey);
  }

  function render() {
    var menu = currentMenu();
    if (!menu) {
      renderSetup();
      return;
    }
    var key = JSON.stringify(menu) + '|' + window.innerWidth + 'x' + window.innerHeight;
    if (key === lastRenderKey) return;
    lastRenderKey = key;
    document.title = menu.name + ' - Menu';
    board.style.cursor = '';
    PC.renderMenu(board, menu);
  }

  // Shown only when the URL has no valid ?menu= - lists what's available
  // so whoever is setting up the TV can grab the right link.
  function renderSetup() {
    var key = 'setup|' + JSON.stringify(state && state.menus ? state.menus.map(function (m) { return m.slug + m.name; }) : null);
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
    if (menuKey) {
      p.textContent = 'No menu named "' + menuKey + '" was found. Pick one of these menus:';
    } else {
      p.textContent = 'Add ?menu=... to the URL to choose which menu this screen shows:';
    }
    wrap.appendChild(p);
    var ul = document.createElement('ul');
    var menus = (state && state.menus) || [];
    if (!menus.length) {
      var li = document.createElement('li');
      li.textContent = 'No menus have been published yet. Create one in the admin.';
      ul.appendChild(li);
    }
    menus.forEach(function (m) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      var url = window.location.pathname + '?menu=' + encodeURIComponent(m.slug || m.id);
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
    board.appendChild(wrap);
  }

  function adoptLocal() {
    var local = PC.load();
    if (local) state = PC.newerOf(state, local);
  }

  function pollPublished() {
    PC.fetchPublished().then(function (published) {
      if (published) {
        state = PC.newerOf(state, published);
        render();
      }
    }).catch(function () {
      // Not published yet or offline - keep showing what we have.
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
