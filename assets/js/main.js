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

  // Gallery lightbox.
  var links = Array.prototype.slice.call(document.querySelectorAll('.gallery a'));
  var box = document.querySelector('.lightbox');
  if (links.length && box) {
    var img = box.querySelector('img'), idx = 0;
    function show(i) { idx = (i + links.length) % links.length; img.src = links[idx].href; box.classList.add('show'); }
    function hide() { box.classList.remove('show'); img.removeAttribute('src'); }
    links.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); }); });
    box.querySelector('.close').addEventListener('click', hide);
    box.querySelector('.prev').addEventListener('click', function () { show(idx - 1); });
    box.querySelector('.next').addEventListener('click', function () { show(idx + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) hide(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('show')) return;
      if (e.key === 'Escape') hide();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }
})();
