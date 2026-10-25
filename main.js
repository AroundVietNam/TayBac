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

  const plan = document.getElementById('plan'); plan.href = S.plan || '#'; if (S.plan) plan.setAttribute('download', '');

  /* ---------- build day panels ---------- */
  document.getElementById('panels').innerHTML = days.map((d, i) => `
    <article class="panel absolute inset-0" style="--accent:${d.color}">
      <div class="absolute left-1/2 top-[12vh] h-[74vh] w-[92vw] -translate-x-1/2 md:top-[15vh] md:h-[69vh] md:w-[80vw]">
        <div class="pointer-events-none absolute inset-x-0 bottom-full z-20 mb-3 flex items-end justify-center">
          <h2 class="max-w-[56%] truncate text-center font-head text-[1.7rem] font-extrabold leading-tight md:text-[clamp(2.75rem,5vw,4.5rem)]" data-i18n="days.${i}.name"></h2>
          <p class="absolute bottom-0 left-0 font-head text-[1.35rem] font-bold leading-none md:text-[clamp(2.2rem,4vw,3.6rem)]" style="color:${d.color}"><span data-i18n="ui.day"></span> ${i + 1}</p>
        </div>
        <div class="photo relative h-full w-full overflow-hidden rounded-xl" style="box-shadow:0 20px 100px 4px ${d.color}">
          <img src="${d.media}" alt="" class="h-full w-full object-cover">
          <div class="absolute inset-0" style="background:linear-gradient(to top,rgba(0,0,0,.35) 0%,rgba(0,0,0,.2) 45%,rgba(0,0,0,0) 90%)"></div>
        </div>
        <div class="pols pointer-events-none absolute inset-x-0 -bottom-[7vh] flex justify-around px-2 md:px-[6vw]">
          ${d.pols.map((p, j) => `
            <figure class="pol group pointer-events-auto relative w-[27vw] bg-white p-2 pb-5 shadow-xl md:w-[max(13vw,150px)]" style="--r:${rot[j]}">
              <img src="${p}" alt="" class="aspect-square w-full object-cover">
              <figcaption class="absolute inset-2 bottom-5 flex items-end overflow-hidden bg-black/65 p-2 text-[10px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100 md:text-xs md:leading-snug"><p class="line-clamp-5 md:line-clamp-6 xl:line-clamp-7" data-i18n="days.${i}.pols.${j}"></p></figcaption>
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
  const setActive = (k) => {
    tls.forEach((el, i) => { el.style.opacity = i === k ? 1 : .5; el.style.fontWeight = i === k ? 700 : 400; });
    document.querySelectorAll('.panel').forEach((p, i) => p.classList.toggle('on', i === k));
  };
  setActive(0);

  applyLang(lang);
  document.getElementById('lang').onclick = () => applyLang(lang === 'en' ? 'vi' : 'en');

  /* ---------- pinned scroll: each scroll step moves to the next day ---------- */
  const panels = gsap.utils.toArray('.panel');
  gsap.set(panels.slice(1), { autoAlpha: 0 });
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '#days', start: 'top top', end: '+=' + (n - 1) * 85 + '%',
      pin: true, scrub: 0.3, anticipatePin: 1,
      snap: { snapTo: 1 / (n - 1), directional: true, inertia: false, delay: 0.06, duration: { min: 0.15, max: 0.4 }, ease: 'power3.out' },
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
  const track = document.getElementById('track'), M = S.marquee, BW = 260;
  const mob = () => matchMedia('(max-width: 767px)').matches;
  track.innerHTML = [...M, ...M].map((src, i) =>
    `<div class="mq relative w-[190px] shrink-0 cursor-pointer md:w-[280px]" data-k="${i % M.length}">
      <div class="mqb absolute inset-y-0 left-0 z-0 hidden min-w-0 flex-col justify-center overflow-hidden rounded-lg bg-white p-5 opacity-0 shadow-2xl md:flex" style="width:${BW}px;visibility:hidden">
        <h3 class="truncate font-head text-xl font-bold"></h3><p class="loc mt-0.5 truncate text-xs opacity-60"></p><p class="txt mt-2 line-clamp-6 text-sm"></p>
      </div>
      <img src="${src}" alt="" class="relative z-10 aspect-[3/4] w-full rounded-lg object-cover shadow-lg">
      <div class="mqo absolute inset-0 z-20 flex min-w-0 flex-col justify-end overflow-hidden rounded-lg bg-black/65 p-4 text-white opacity-0 md:hidden" style="visibility:hidden">
        <h3 class="truncate font-head text-base font-bold"></h3><p class="loc truncate text-[11px] opacity-70"></p><p class="txt mt-1 line-clamp-5 text-xs leading-snug"></p>
      </div>
    </div>`).join('');
  const cards = gsap.utils.toArray('.mq');
  gsap.set(cards, { transformPerspective: 900, rotationY: 28 }); /* flip the sign to look the other way */
  const run = gsap.to(track, { xPercent: -50, duration: 45, ease: 'none', repeat: -1 });
  const DIM = 0.4; /* opacity of the other cards while one is open */

  let cur = null;
  function focus(c) {
    if (cur === c) return;
    const prev = cur; cur = c;
    gsap.to(run, { timeScale: c ? 0 : 1, duration: c ? 0.5 : 0.6, overwrite: true });
    cards.forEach((x) => {
      const on = x === c, box = x.querySelector('.mqb'), ov = x.querySelector('.mqo');
      gsap.to(x, { opacity: c ? (on ? 1 : DIM) : 1, rotationY: on ? 0 : 28, scale: on ? (mob() ? 1.15 : 1.25) : 1, zIndex: on ? 10 : 0, duration: 0.4, overwrite: 'auto' });
      if (on) {
        const it = L.marquee.items[x.dataset.k] || {};
        [box, ov].forEach((el) => { el.querySelector('h3').textContent = it.username || ''; el.querySelector('.loc').textContent = it.location || ''; el.querySelector('.txt').textContent = it.text || ''; });
        if (mob()) {
          gsap.to(ov, { autoAlpha: 1, duration: 0.3, overwrite: true });
        } else {
          const r = x.getBoundingClientRect(), w = x.offsetWidth;
          const right = r.left + r.width / 2 + (w * 1.25) / 2 + BW * 1.25 < innerWidth - 8;
          box.style.left = right ? '0' : 'auto'; box.style.right = right ? 'auto' : '0';
          box.style.paddingLeft = right ? '34px' : '20px'; box.style.paddingRight = right ? '20px' : '34px';
          gsap.fromTo(box, { x: 0, autoAlpha: 0 }, { x: (right ? 1 : -1) * (w - 12), autoAlpha: 1, duration: 0.5, ease: 'power3.out', overwrite: true });
        }
      } else if (x === prev) {
        gsap.to([box, ov], { x: 0, autoAlpha: 0, duration: 0.25, overwrite: true });
      }
    });
  }
  /* switching cards never goes through "nothing selected", so the marquee can't restart in between */
  cards.forEach((c) => c.addEventListener('pointerenter', () => focus(c)));
  track.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') focus(null); });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.mq')) focus(null); }); /* tap outside on mobile */
}
