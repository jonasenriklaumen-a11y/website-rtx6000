/* ============================================================
   RTX PRO 6000 Blackwell — Interaktionen & Animationen
   - Partikel-Canvas im Hero
   - SVG Line Drawing on Scroll
   - Scroll-Reveal, animierte Zähler & Balken
   - Hover-Spotlight auf Karten, Ripple-Click, Klick-Funken
   ============================================================ */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll-Fortschrittsbalken & Nav ---------- */
  const progressBar = document.getElementById('scrollProgress');
  const nav = document.getElementById('nav');

  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    progressBar.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', doc.scrollTop > 40);
    drawOnScroll();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- SVG Line Drawing on Scroll ---------- */
  const svg = document.getElementById('gpuDrawing');
  const paths = svg ? Array.from(svg.querySelectorAll('.draw-path')) : [];
  let totalLength = 0;
  const pathData = paths.map(p => {
    const len = p.getTotalLength();
    const start = totalLength;
    totalLength += len;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    return { el: p, len, start };
  });

  function drawOnScroll() {
    if (!svg || prefersReducedMotion) return;
    const rect = svg.getBoundingClientRect();
    const vh = window.innerHeight;
    // Fortschritt 0→1, während das SVG durch den Viewport wandert
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height * 0.6)));
    const drawn = progress * totalLength;
    for (const { el, len, start } of pathData) {
      const local = Math.min(len, Math.max(0, drawn - start));
      el.style.strokeDashoffset = len - local;
    }
  }

  if (prefersReducedMotion) {
    pathData.forEach(({ el }) => { el.style.strokeDashoffset = 0; });
  }

  /* ---------- Scroll-Reveal (IntersectionObserver) ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Animierte Zähler ---------- */
  const counterObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      counterObserver.unobserve(el);
      const target = parseInt(el.dataset.target, 10);
      const duration = 1600;
      const startTime = performance.now();
      const fmt = new Intl.NumberFormat('de-DE');
      const tick = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        el.textContent = fmt.format(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      if (prefersReducedMotion) { el.textContent = fmt.format(target); }
      else requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });

  document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

  /* ---------- Performance-Balken ---------- */
  const barObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const fill = entry.target.querySelector('.bar-fill');
      fill.style.width = fill.dataset.width + '%';
      barObserver.unobserve(entry.target);
    }
  }, { threshold: 0.4 });

  document.querySelectorAll('.bar-track').forEach(el => barObserver.observe(el));

  /* ---------- Hover-Spotlight auf Stat-Karten ---------- */
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Ripple-Click auf Buttons & Karten ---------- */
  function spawnRipple(e, host, extraClass) {
    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple' + (extraClass ? ' ' + extraClass : '');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    host.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => spawnRipple(e, btn));
  });
  document.querySelectorAll('.gallery-item, .feature-card').forEach(card => {
    card.style.position = 'relative';
    card.addEventListener('click', (e) => spawnRipple(e, card, 'card-ripple'));
  });

  /* ---------- Klick-Funken überall ---------- */
  document.addEventListener('click', (e) => {
    if (prefersReducedMotion) return;
    const spark = document.createElement('span');
    spark.className = 'click-spark';
    spark.style.left = e.clientX + 'px';
    spark.style.top = e.clientY + 'px';
    document.body.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove());
  });

  /* ---------- Partikel-Canvas im Hero ---------- */
  const canvas = document.getElementById('particles');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = Math.min(90, Math.floor(w / 14));
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.6,
      });
    }

    const LINK_DIST = 130;

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(118, 185, 0, 0.55)';
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(118, 185, 0, ${0.14 * (1 - dist / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Initialer Zustand
  onScroll();
})();
