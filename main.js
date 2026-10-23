gsap.registerPlugin(ScrollTrigger);

let DATA, L, lang = 'en';
try { lang = localStorage.getItem('lang') || 'en'; } catch (e) {}

const t = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), L);

function applyLang(l) {
  lang = l; L = DATA[l];
  try { localStorage.setItem('lang', l); } catch (e) {}
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n) ?? ''; });
  const b = document.getElementById('lang');
  b.innerHTML = l === 'en' ? '<b>EN</b> | <span class="opacity-60">VI</span>' : '<span class="opacity-60">EN</span> | <b>VI</b>';
}

fetch('content.json').then((r) => r.json()).then((d) => { DATA = d; init(); })
  .catch((e) => console.error('Could not load content.json (use GitHub Pages or a local server):', e));

function init() {
  const S = DATA.shared, days = S.days, n = days.length;
  const rot = ['-6deg', '3deg', '-3deg'];

  /* ---------- hero video: name stays centered until the video is ready ---------- */
  const v = document.getElementById('heroVideo');
  if (S.heroVideo) {
    v.src = S.heroVideo;
    v.addEventListener('loadeddata', () => gsap.to('#loader', { autoAlpha: 0, duration: 1 }), { once: true });
  }

  /* ---------- build day panels ---------- */
  document.getElementById('panels').innerHTML = days.map((d, i) => `
    <article class="panel absolute inset-0" style="--accent:${d.color}">
      <div class="absolute left-[4vw] top-[1.5vh] md:left-[10vw]">
        <p class="text-sm font-semibold" style="color:${d.color}"><span data-i18n="ui.day"></span> ${i + 1}</p>
        <h2 class="font-head text-3xl font-extrabold leading-tight md:text-5xl" data-i18n="days.${i}.name"></h2>
      </div>
      <div class="absolute left-1/2 top-[11vh] h-[72vh] w-[92vw] -translate-x-1/2 md:h-[75vh] md:w-[80vw]">
        <div class="photo relative h-full w-full overflow-hidden rounded-xl" style="box-shadow:0 30px 70px -18px ${d.color}">
          <img src="${d.media}" alt="" class="h-full w-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"></div>
        </div>
        <div class="pols pointer-events-none absolute inset-x-0 -bottom-[7vh] flex justify-around px-2 md:px-[6vw]">
          ${d.pols.map((p, j) => `
            <figure class="pol group pointer-events-auto relative w-[27vw] bg-white p-2 pb-5 shadow-xl md:w-[13vw]" style="--r:${rot[j]}">
              <img src="${p}" alt="" class="aspect-square w-full object-cover">
              <figcaption class="absolute inset-2 bottom-5 flex items-end bg-black/65 p-2 text-[11px] leading-snug text-white opacity-0 transition-opacity group-hover:opacity-100 md:text-xs" data-i18n="days.${i}.pols.${j}"></figcaption>
            </figure>`).join('')}
        </div>
      </div>
    </article>`).join('');

  /* ---------- timeline labels + dot ---------- */
  document.getElementById('labels').innerHTML = days.map((_, i) =>
    `<span class="tl absolute -translate-x-1/2 whitespace-nowrap opacity-50" style="left:${(i / (n - 1)) * 100}%"><span data-i18n="ui.day"></span> ${i + 1}</span>`).join('');
  const dot = document.getElementById('dot');
  gsap.set(dot, { xPercent: -50, backgroundColor: days[0].color });
  const tls = gsap.utils.toArray('.tl');
  const setActive = (k) => tls.forEach((el, i) => { el.style.opacity = i === k ? 1 : .5; el.style.fontWeight = i === k ? 700 : 400; });
  setActive(0);

  applyLang(lang);
  document.getElementById('lang').onclick = () => applyLang(lang === 'en' ? 'vi' : 'en');

  /* ---------- pinned scroll: each scroll step moves to the next day ---------- */
  const panels = gsap.utils.toArray('.panel');
  gsap.set(panels.slice(1), { autoAlpha: 0 });
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '#days', start: 'top top', end: '+=' + (n - 1) * 100 + '%',
      pin: true, scrub: 0.6,
      snap: { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.7 }, ease: 'power1.inOut' },
      onUpdate: (self) => setActive(Math.round(self.progress * (n - 1)))
    }
  });
  for (let i = 1; i < n; i++) {
    const at = i - 1;
    tl.to(panels[i - 1], { autoAlpha: 0, yPercent: -10, duration: 1 }, at)
      .fromTo(panels[i], { autoAlpha: 0, yPercent: 10 }, { autoAlpha: 1, yPercent: 0, duration: 1 }, at)
      .fromTo(panels[i].querySelector('.photo img'), { scale: 1.18 }, { scale: 1, duration: 1 }, at)
      .fromTo(panels[i].querySelector('.pols'), { y: 70 }, { y: 0, duration: 1 }, at)
      .to(dot, { left: (i / (n - 1)) * 100 + '%', backgroundColor: days[i].color, duration: 1 }, at);
  }

  /* ---------- marquee ---------- */
  const track = document.getElementById('track'), M = S.marquee;
  track.innerHTML = [...M, ...M].map((src, i) =>
    `<div class="mq w-[220px] shrink-0 cursor-pointer md:w-[280px]" data-k="${i % M.length}"><img src="${src}" alt="" class="aspect-[3/4] w-full rounded-lg object-cover shadow-lg"></div>`).join('');
  const cards = gsap.utils.toArray('.mq');
  gsap.set(cards, { transformPerspective: 900, rotationY: 28 }); /* flip the sign to look the other way */
  const run = gsap.to(track, { xPercent: -50, duration: 45, ease: 'none', repeat: -1 });
  const box = document.getElementById('mqbox');

  cards.forEach((c) => {
    c.addEventListener('mouseenter', () => {
      gsap.to(run, { timeScale: 0, duration: 0.5 });
      gsap.to(c, { rotationY: 0, scale: 1.25, zIndex: 10, duration: 0.4 });
      const k = c.dataset.k;
      document.getElementById('mqt').textContent = t(`marquee.items.${k}.title`);
      document.getElementById('mqp').textContent = t(`marquee.items.${k}.text`);
      const r = c.getBoundingClientRect(), gap = r.width * 0.12 + 14;
      const right = r.right + gap + 260 < innerWidth;
      box.style.left = (right ? r.right + gap : Math.max(8, r.left - gap - 260)) + 'px';
      box.style.top = Math.max(8, r.top + r.height / 2 - 70) + 'px';
      box.style.opacity = 1;
    });
    c.addEventListener('mouseleave', () => {
      gsap.to(run, { timeScale: 1, duration: 0.6 });
      gsap.to(c, { rotationY: 28, scale: 1, zIndex: 0, duration: 0.4 });
      box.style.opacity = 0;
    });
  });
}
