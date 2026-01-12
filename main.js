(() => {
  "use strict";

  // ----- helpers
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  // ----- year
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ----- mobile nav
  const navToggle = qs("#navToggle");
  const mobileNav = qs("#mobileNav");

  const setNavOpen = (open) => {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute("aria-expanded", String(open));
    mobileNav.hidden = !open;
  };

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      setNavOpen(!expanded);
    });

    // close menu after click
    qsa(".mobile-link", mobileNav).forEach((a) => {
      a.addEventListener("click", () => setNavOpen(false));
    });

    // close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNavOpen(false);
    });
  }

  // ----- fade-in intersection observer
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("animate", entry.isIntersecting)),
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    qsa(".fade-in").forEach((el) => obs.observe(el));
  } else {
    qsa(".fade-in").forEach((el) => el.classList.add("animate"));
  }

  // ----- radar canvas background
  const canvas = qs("#radarCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });

  let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const center = { x: 0, y: 0 };
  let t0 = performance.now();

  const blips = Array.from({ length: 18 }, () => ({
    r: Math.random() * 0.46 + 0.08,
    a: Math.random() * Math.PI * 2,
    phase: Math.random() * Math.PI * 2,
    size: Math.random() * 2.2 + 1.2
  }));

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    center.x = w * 0.62;
    center.y = h * 0.36;
  }

  function draw(now) {
    const dt = (now - t0) / 1000;
    t0 = now;

    // clear
    ctx.clearRect(0, 0, w, h);

    // radar parameters
    const R = Math.min(w, h) * 0.48;
    const sweepSpeed = 0.55; // radians/sec (subtle)
    const sweep = (now / 1000) * sweepSpeed;

    // base glow
    const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, R * 1.1);
    glow.addColorStop(0, "rgba(255,43,43,0.10)");
    glow.addColorStop(0.5, "rgba(255,43,43,0.04)");
    glow.addColorStop(1, "rgba(255,43,43,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // rings
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, (R * i) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // cross lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.moveTo(center.x - R, center.y);
    ctx.lineTo(center.x + R, center.y);
    ctx.moveTo(center.x, center.y - R);
    ctx.lineTo(center.x, center.y + R);
    ctx.stroke();

    // sweep wedge
    const sweepGrad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, R);
    sweepGrad.addColorStop(0, "rgba(255,43,43,0.22)");
    sweepGrad.addColorStop(0.35, "rgba(255,43,43,0.10)");
    sweepGrad.addColorStop(1, "rgba(255,43,43,0)");
    ctx.fillStyle = sweepGrad;

    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    const wedge = 0.45; // radians
    ctx.arc(center.x, center.y, R, sweep - wedge, sweep);
    ctx.closePath();
    ctx.fill();

    // blips (pulse when near sweep)
    for (const b of blips) {
      const bx = center.x + Math.cos(b.a) * (R * b.r);
      const by = center.y + Math.sin(b.a) * (R * b.r);

      // angular distance to sweep (normalize)
      let da = Math.atan2(Math.sin(b.a - sweep), Math.cos(b.a - sweep));
      const hit = Math.max(0, 1 - Math.abs(da) / 0.35);

      const pulse = 0.35 + 0.65 * Math.max(0, Math.sin((now / 1000) * 2.2 + b.phase));
      const alpha = 0.05 + hit * 0.55 * pulse;

      ctx.fillStyle = `rgba(255,43,43,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(bx, by, b.size + hit * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // subtle vignette
    const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  requestAnimationFrame(draw);
})();
