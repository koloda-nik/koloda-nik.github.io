(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealTargets = document.querySelectorAll(".home-case, .case-content > section, .case-links");
  const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.replace("reveal-pending", "reveal-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: "0px 0px -24px 0px" }) : null;

  // No-JS and reduced-motion users always see the complete content.
  if (observer && !reducedMotion.matches) {
    revealTargets.forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.classList.add("reveal-pending");
      observer.observe(element);
    });
  }

  const grid = document.querySelector(".dot-grid");
  if (!grid) return;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;
  canvas.setAttribute("aria-hidden", "true");
  grid.append(canvas);
  grid.classList.add("is-animated");

  const finePointer = window.matchMedia("(pointer: fine)");
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, strength: 0 };
  let width = 0;
  let height = 0;
  let dots = [];
  let frame = 0;
  let previousTime = 0;
  const startedAt = performance.now();

  function draw(time) {
    frame = 0;
    const dt = Math.min((time - (previousTime || time)) / 1000, .05);
    previousTime = time;
    const ease = 1 - Math.exp(-dt * 12);
    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;
    pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * ease;
    const animated = !reducedMotion.matches;
    const introProgress = (time - startedAt) / 2200;
    const intro = animated && introProgress < 1 ? Math.sin(Math.PI * Math.max(0, introProgress)) * .48 : 0;
    context.clearRect(0, 0, width, height);

    for (const dot of dots) {
      let energy = 0;
      if (animated) {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const envelope = Math.exp(-(dx * dx + dy * dy) / (2 * 155 * 155));
        const wave = .55 + .45 * Math.sin((dx + dy * .65) / 65 - time / 680);
        energy = envelope * wave * pointer.strength;
        const introX = width * (.25 + introProgress * .5);
        const introY = height * (.15 + introProgress * .38);
        energy = Math.max(energy, intro * Math.exp(-((dot.x - introX) ** 2 + (dot.y - introY) ** 2) / 80000));
      }
      context.beginPath();
      context.arc(dot.x, dot.y, .8 + energy * 2.5, 0, Math.PI * 2);
      context.fillStyle = `rgba(80, 94, 98, ${.3 + energy * .28})`;
      context.fill();
    }
    if (animated && !document.hidden && window.scrollY < height && (pointer.active || pointer.strength > .002 || introProgress < 1)) schedule();
  }

  function schedule() {
    if (!frame && !document.hidden && window.scrollY < height) frame = requestAnimationFrame(draw);
  }

  function resize() {
    width = grid.clientWidth;
    const hero = document.querySelector(".home-hero");
    if (hero) grid.style.height = `${hero.offsetHeight + (width <= 600 ? 180 : 300)}px`;
    height = grid.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = 15; y < height; y += 30) {
      for (let x = 15; x < width; x += 30) dots.push({ x, y });
    }
    if (frame) cancelAnimationFrame(frame);
    draw(performance.now());
  }

  window.addEventListener("pointermove", event => {
    if (!finePointer.matches || reducedMotion.matches || event.pointerType === "touch") return;
    if (!pointer.active) {
      pointer.x = event.clientX;
      pointer.y = event.pageY;
    }
    pointer.targetX = event.clientX;
    pointer.targetY = event.pageY;
    pointer.active = event.pageY < height;
    schedule();
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { pointer.active = false; schedule(); });
  window.addEventListener("blur", () => { pointer.active = false; schedule(); });
  window.addEventListener("scroll", () => { pointer.active = false; schedule(); }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; pointer.active = false; }
    else schedule();
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      observer?.disconnect();
      revealTargets.forEach(element => element.classList.remove("reveal-pending"));
      pointer.active = false;
      pointer.strength = 0;
    }
    resize();
  });
  window.addEventListener("pageshow", () => {
    revealTargets.forEach(element => {
      if (element.getBoundingClientRect().top < window.innerHeight) element.classList.remove("reveal-pending");
    });
    resize();
  });
  window.addEventListener("resize", resize, { passive: true });
  document.fonts?.ready.then(resize);
  resize();
})();
