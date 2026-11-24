// AstroBurst — small behaviours shared by every page.
(function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');

  // Header background appears after scrolling a little.
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 30); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu.
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Fade sections in as they enter the viewport.
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Publications: live list from NASA ADS (assets/data/publications.json), year filter and search.
  var pubList = document.getElementById('pub-list');
  if (pubList) {
    var search = document.getElementById('pub-search');
    var chips = document.querySelectorAll('.chip');
    var recentOnly = false;
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function apply() {
      var q = (search.value || '').toLowerCase().trim();
      var newest = 0;
      pubList.querySelectorAll('.pub').forEach(function (p) { newest = Math.max(newest, +p.dataset.year); });
      pubList.querySelectorAll('.year-group').forEach(function (g) {
        var shown = 0;
        g.querySelectorAll('.pub').forEach(function (p) {
          var ok = (!recentOnly || +p.dataset.year > newest - 3) && (!q || p.textContent.toLowerCase().indexOf(q) !== -1);
          p.hidden = !ok; if (ok) shown++;
        });
        g.hidden = shown === 0;
      });
    }
    function render(pubs) {
      var byYear = {};
      pubs.forEach(function (p) { (byYear[p.y] = byYear[p.y] || []).push(p); });
      var years = Object.keys(byYear).sort(function (a, b) { return b - a; });
      pubList.innerHTML = years.map(function (y) {
        return '<div class="year-group"><h2>' + esc(y) + '</h2><div>' + byYear[y].map(function (p) {
          var link = p.b ? 'https://ui.adsabs.harvard.edu/abs/' + encodeURIComponent(p.b) + '/abstract'
                         : 'https://ui.adsabs.harvard.edu/search/q=' + encodeURIComponent('title:"' + p.t + '"');
          var authors = (p.a || []).map(function (a) { return /^iyyani/i.test(a) ? '<b>' + esc(a) + '</b>' : esc(a); }).join(', ');
          var ref = esc(p.j || '') + (p.v ? ', ' + esc(p.v) : '') + (p.p ? ', ' + esc(p.p) : '');
          return '<article class="pub" data-year="' + esc(y) + '">' +
            '<a class="pub-title" href="' + link + '" target="_blank" rel="noopener">' + esc(p.t) + '</a>' +
            '<span class="pub-authors">' + authors + '</span>' +
            '<span class="pub-journal">' + ref + ' (' + esc(y) + ')</span></article>';
        }).join('') + '</div></div>';
      }).join('');
      document.getElementById('pub-total').textContent = pubs.length;
      document.getElementById('pub-span').textContent = years[years.length - 1] + '\u2013' + years[0];
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on'); recentOnly = c.dataset.filter === 'recent'; apply();
      });
    });
    search.addEventListener('input', apply);
    fetch('assets/data/publications.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.publications || !d.publications.length) return;
        render(d.publications); apply();
        if (d.updated) document.getElementById('pub-updated').textContent = 'Last updated ' + d.updated + '.';
      })
      .catch(function () { /* keep the list already in the page */ });
  }

  // Gallery: staggered entrance, category filter and photo viewer.
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.gallery .tile'));
  var box = document.querySelector('.lightbox');
  if (tiles.length && box) {
    // Tiles fade in as they scroll into view, a few at a time.
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (entries) {
        var n = 0;
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target; tio.unobserve(el);
          setTimeout(function () { el.classList.add('in'); }, 70 * n++);
        });
      }, { rootMargin: '0px 0px -40px 0px' });
      tiles.forEach(function (t) { tio.observe(t); });
    } else { tiles.forEach(function (t) { t.classList.add('in'); }); }

    // Category filter.
    var gchips = document.querySelectorAll('.gchip');
    function visible() { return tiles.filter(function (t) { return !t.hidden; }); }
    gchips.forEach(function (c) {
      c.addEventListener('click', function () {
        gchips.forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        tiles.forEach(function (t) { t.hidden = c.dataset.cat !== 'all' && t.dataset.cat !== c.dataset.cat; });
      });
    });

    // Photo viewer.
    var img = box.querySelector('.lb-stage img'), count = box.querySelector('.lb-count'), cat = box.querySelector('.lb-cat');
    var strip = box.querySelector('.lb-strip'), set = [], idx = 0, lastFocus = null;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function show(i) {
      idx = (i + set.length) % set.length;
      var t = set[idx];
      img.classList.add('loading');
      var next = new Image();
      next.onload = function () { img.src = next.src; img.alt = t.querySelector('img').alt; img.classList.remove('loading'); };
      next.src = t.href;
      count.textContent = pad(idx + 1) + ' / ' + pad(set.length);
      cat.textContent = t.querySelector('.tile-meta span').textContent;
      Array.prototype.forEach.call(strip.children, function (b, k) { b.classList.toggle('on', k === idx); });
      var cur = strip.children[idx];
      if (cur) strip.scrollTo({ left: cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2, behavior: 'smooth' });
      [idx - 1, idx + 1].forEach(function (k) { new Image().src = set[(k + set.length) % set.length].href; });
    }
    function open(tile) {
      set = visible(); lastFocus = tile;
      strip.innerHTML = '';
      set.forEach(function (t, k) {
        var b = document.createElement('button'), im = document.createElement('img');
        im.src = t.querySelector('img').src; im.alt = ''; b.setAttribute('aria-label', 'Photo ' + (k + 1));
        b.appendChild(im); b.addEventListener('click', function () { show(k); }); strip.appendChild(b);
      });
      box.classList.add('show'); document.body.style.overflow = 'hidden';
      show(set.indexOf(tile)); box.querySelector('.lb-close').focus();
    }
    function close() {
      box.classList.remove('show'); document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    tiles.forEach(function (t) { t.addEventListener('click', function (e) { e.preventDefault(); open(t); }); });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    box.querySelector('.lb-stage').addEventListener('click', function (e) { if (e.target !== img) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('show')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    // Swipe left or right on touch screens.
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50 && !e.target.closest('.lb-strip')) show(idx + (dx < 0 ? 1 : -1));
    });
  }
})();
