/* Projeto Industrial — casca compartilhada (menu + barra), v1.
   Uso (2 linhas no <head> do site):
     <link rel="stylesheet" href="/shell/pi-shell.css">
     <script src="/shell/pi-shell.js" defer data-pi-mode="full" data-pi-active="caderno"></script>
   Atributos do <script>:
     data-pi-mode    full | bar | fab   (padrão: bar)
     data-pi-pos     tl | tr | bl | br  (só no modo fab; padrão: tl)
     data-pi-offset  px acima da borda inferior (modo fab, para não cobrir menus fixos)
     data-pi-scheme  auto | dark | light (cores da casca; padrão: auto = segue o site)
     data-pi-theme   toggle | none      (botão claro/escuro da casca; padrão: none)
     data-pi-active  id do item do menu (padrão: deduzido do endereço)
   Se algo falhar (nav.json fora do ar, sem JS), o site continua funcionando sem a casca. */
(function () {
  'use strict';
  try {
    var el = document.currentScript || document.querySelector('script[src*="pi-shell.js"]');
    if (!el || document.getElementById('pi-root')) return;
    var mode = el.getAttribute('data-pi-mode') || 'bar';
    var pos = el.getAttribute('data-pi-pos') || 'tl';
    var fabB = parseInt(el.getAttribute('data-pi-offset') || '0', 10) || 0;
    var schemeAttr = el.getAttribute('data-pi-scheme') || 'auto';
    var themeBtn = el.getAttribute('data-pi-theme') === 'toggle';
    var activeId = el.getAttribute('data-pi-active') || '';
    var base = new URL(el.src, location.href);
    var navUrl = new URL('nav.json', base).href;
    var html = document.documentElement;

    var FALLBACK = { logo: { title: 'PROJETO', sub: 'INDUSTRIAL', href: '/' },
      items: [{ id: 'index', label: 'Início', href: '/', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' }], groups: [] };

    function svg(inner, s) {
      return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
    }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    function resolveScheme() {
      if (schemeAttr === 'dark' || schemeAttr === 'light') return schemeAttr;
      var dt = html.getAttribute('data-theme');
      if (dt === 'dark' || dt === 'light') return dt;
      return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function isActive(it) {
      if (activeId) return it.id === activeId;
      var u; try { u = new URL(it.href, location.origin); } catch (e) { return false; }
      if (u.search) return false;
      var p = u.pathname.replace(/index\.html$/, '');
      if (p === '/') return location.pathname === '/' || /^\/index\.html$/.test(location.pathname);
      return location.pathname.indexOf(p) === 0;
    }

    function build(nav) {
      var logo = '<a class="pi-logo" href="' + esc(nav.logo.href) + '">' +
        '<svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2l12 7v14l-12 7L4 23V9z" fill="#00C4C4"/>' +
        '<path d="M11 22V10h6a4 4 0 0 1 0 8h-3" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span>' + esc(nav.logo.title) + '<em>' + esc(nav.logo.sub) + '</em></span></a>';
      function link(it) {
        return '<a class="pi-item' + (isActive(it) ? ' pi-active' : '') + '" href="' + esc(it.href) + '"' +
          (isActive(it) ? ' aria-current="page"' : '') + '>' + svg(it.icon, 18) + esc(it.label) + '</a>';
      }
      var items = nav.items.map(link).join('');
      var groups = (nav.groups || []).map(function (g) {
        var open = g.items.some(isActive) ? ' open' : '';
        return '<details class="pi-group"' + open + '><summary>' + esc(g.label) + '</summary>' + g.items.map(link).join('') + '</details>';
      }).join('');
      var menuIcon = svg('<path d="M3 12h18M3 6h18M3 18h18"/>', 20);
      var closeIcon = svg('<path d="M18 6L6 18M6 6l12 12"/>', 20);
      var themeIcon = svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', 18);

      var root = document.createElement('div');
      root.id = 'pi-root'; root.className = 'pi-root';
      root.innerHTML =
        '<div class="pi-bar">' +
          '<button class="pi-btn" type="button" data-pi="open" aria-label="Abrir menu" aria-expanded="false">' + menuIcon + '</button>' +
          logo + '<span class="pi-spacer"></span>' +
          (themeBtn ? '<button class="pi-btn" type="button" data-pi="theme" aria-label="Alternar tema claro/escuro">' + themeIcon + '</button>' : '') +
        '</div>' +
        (mode === 'fab' ? '<button class="pi-btn pi-fab" type="button" data-pos="' + esc(pos) + '" data-pi="open" aria-label="Abrir menu do Projeto Industrial" aria-expanded="false">' + menuIcon + '</button>' : '') +
        '<div class="pi-overlay" data-pi="close"></div>' +
        '<aside class="pi-drawer" aria-label="Menu do Projeto Industrial">' +
          '<div class="pi-dhead">' + logo + '<button class="pi-btn" type="button" data-pi="close" aria-label="Fechar menu">' + closeIcon + '</button></div>' +
          '<div class="pi-search"><input class="pi-search-in" type="search" placeholder="Buscar no menu" aria-label="Buscar no menu" autocomplete="off"></div>' +
          '<nav class="pi-nav">' + items + groups + '</nav>' +
          (themeBtn ? '<div class="pi-dfoot"><span class="pi-theme-lbl">Tema claro/escuro</span><button class="pi-btn" type="button" data-pi="theme" aria-label="Alternar tema claro/escuro">' + themeIcon + '</button></div>' : '') +
        '</aside>';
      if (fabB) root.style.setProperty('--pi-fab-b', (8 + fabB) + 'px');
      document.body.appendChild(root);

      function applyScheme() { root.setAttribute('data-pi-scheme', resolveScheme()); }
      applyScheme();
      if (schemeAttr === 'auto') {
        new MutationObserver(applyScheme).observe(html, { attributes: true, attributeFilter: ['data-theme'] });
        if (window.matchMedia) { var mq = matchMedia('(prefers-color-scheme: light)'); (mq.addEventListener ? mq.addEventListener('change', applyScheme) : mq.addListener && mq.addListener(applyScheme)); }
      }

      var openers = root.querySelectorAll('[data-pi="open"]');
      function setOpen(v) {
        root.classList.toggle('pi-open', v);
        for (var i = 0; i < openers.length; i++) openers[i].setAttribute('aria-expanded', v ? 'true' : 'false');
        if (v) { var f = root.querySelector('.pi-drawer a'); if (f) f.focus(); }
      }
      root.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-pi]') : null;
        if (!t) return;
        var a = t.getAttribute('data-pi');
        if (a === 'open') setOpen(true);
        else if (a === 'close') setOpen(false);
        else if (a === 'theme') {
          var next = resolveScheme() === 'light' ? 'dark' : 'light';
          html.setAttribute('data-theme', next);
          try { localStorage.setItem('theme', next); } catch (x) {}
          applyScheme();
        }
      });
      var sIn = root.querySelector('.pi-search-in');
      if (sIn) sIn.addEventListener('input', function () {
        var q = sIn.value.trim().toLowerCase();
        var links = root.querySelectorAll('.pi-nav .pi-item');
        for (var i = 0; i < links.length; i++) links[i].style.display = (!q || links[i].textContent.toLowerCase().indexOf(q) > -1) ? '' : 'none';
        var gs = root.querySelectorAll('.pi-nav .pi-group');
        for (var g = 0; g < gs.length; g++) {
          var any = gs[g].querySelector('.pi-item:not([style*="none"])');
          gs[g].style.display = any ? '' : 'none';
          if (q && any) gs[g].setAttribute('open', '');
        }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('pi-open')) setOpen(false); });

      html.classList.add('pi-mode-' + mode);
      if (mode === 'full') html.classList.add('pi-full');
      html.classList.add('pi-ready');
    }

    function start(nav) {
      if (document.body) build(nav); else document.addEventListener('DOMContentLoaded', function () { build(nav); });
    }
    if (themeBtn) { try { var s = localStorage.getItem('theme'); if (s === 'dark' || s === 'light') html.setAttribute('data-theme', s); } catch (x) {} }
    fetch(navUrl, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(start).catch(function () { start(FALLBACK); });
  } catch (err) { if (window.console) console.warn('pi-shell:', err); }
})();
