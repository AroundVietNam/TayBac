/* ---------- Hero video ----------
   Use DIRECT video files: a path in your repo ("videos/clip-1.mp4")
   or a full link ending in .mp4 / .webm.
   One file loops forever; several files play one after another, then start over.

   A YouTube link also works, but only as the single entry in the list
   (YouTube pages are not video files, so they can't go in a normal <video>). */
const HERO_VIDEOS = [
  // "videos/clip-1.mp4",
  // "videos/clip-2.mp4",
  "https://www.youtube.com/watch?v=SlQR9iu09bQ",
];

function youTubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : null;
}

// YouTube mode: a muted, looping, cover-fit iframe in place of the <video>.
function useYouTube(video, id) {
  const box = video.parentElement;
  const frame = document.createElement('iframe');
  frame.src =
    'https://www.youtube-nocookie.com/embed/' + id +
    '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + id +
    '&playsinline=1&rel=0&modestbranding=1&disablekb=1';
  frame.allow = 'autoplay; encrypted-media';
  frame.tabIndex = -1;
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText =
    'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;pointer-events:none;';

  // Make the 16:9 frame cover the whole hero, like object-fit: cover.
  function fit() {
    const scale = Math.max(box.clientWidth / 16, box.clientHeight / 9);
    frame.style.width = scale * 16 + 'px';
    frame.style.height = scale * 9 + 'px';
  }
  new ResizeObserver(fit).observe(box);
  fit();

  video.replaceWith(frame);
}

(function setupHeroVideo() {
  const video = document.getElementById('hero-video');
  if (!video) {
    console.error('Hero: #hero-video not found in index.html');
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // No URLs yet (or motion reduced): remove the video and let the gradient show.
  if (HERO_VIDEOS.length === 0 || prefersReducedMotion) {
    video.remove();
    return;
  }

  // A single YouTube link
  const ytId = youTubeId(HERO_VIDEOS[0]);
  if (HERO_VIDEOS.length === 1 && ytId) {
    useYouTube(video, ytId);
    return;
  }

  // Direct video files (YouTube links are skipped here)
  const files = HERO_VIDEOS.filter((url) => {
    if (youTubeId(url)) {
      console.warn('Hero: YouTube links only work as the single entry. Skipped:', url);
      return false;
    }
    return true;
  });
  if (files.length === 0) {
    video.remove();
    return;
  }

  let current = 0;
  let failures = 0;
  video.muted = true;       // required for autoplay in most browsers
  video.controls = false;   // no progress bar
  video.loop = files.length === 1;

  function playCurrent() {
    video.src = files[current];
    video.play().catch(() => {});
  }

  video.addEventListener('playing', () => { failures = 0; });

  // A broken link used to freeze the playlist. Now it logs why and moves on.
  video.addEventListener('error', () => {
    console.error('Hero: could not load', files[current], video.error);
    failures += 1;
    if (failures >= files.length) {
      video.remove(); // every file failed: show the gradient instead
      return;
    }
    current = (current + 1) % files.length;
    playCurrent();
  });

  video.addEventListener('ended', () => {
    current = (current + 1) % files.length;
    playCurrent();
  });

  playCurrent();
})();

/* ---------- Photo links (parts) ----------
   Desktop: hover or keyboard focus fades the text in, a click follows the link.
   Touch screens: the first tap shows the text, the second tap follows the link. */
(function setupTouchReveal() {
  if (!window.matchMedia('(hover: none)').matches) return;

  const links = document.querySelectorAll('[data-reveal]');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (link.classList.contains('is-active')) return; // second tap: go to the link
      event.preventDefault();
      links.forEach((other) => other.classList.remove('is-active'));
      link.classList.add('is-active');
    });
  });
})();
