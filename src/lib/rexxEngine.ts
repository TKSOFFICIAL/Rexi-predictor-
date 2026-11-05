declare global {
  interface Window {
    lottie?: {
      loadAnimation: (params: {
        container: HTMLElement;
        renderer: 'svg' | 'canvas' | 'html';
        loop: boolean;
        autoplay: boolean;
        animationData: unknown;
      }) => { destroy: () => void };
    };
    pako?: {
      ungzip: (data: Uint8Array, options: { to: 'string' }) => string;
    };
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface GameItem {
  id: string;
  name: string;
  accentColor: string;
  shortTag: string;
  domain: string;
  banner: string;
  icon: string;
  link: string;
}

export interface PlanItem {
  planName: string;
  planDuration: number;
  planPrice: string;
  planType: string;
  planColor: string;
}

export interface UserSession {
  name: string;
  accessKey: string;
  deviceId: string;
  planName: string;
  daysLeft: number;
}

export interface RoundRecord {
  period: string;
  number: number;
  size: 'BIG' | 'SMALL';
  colors: string[];
}

export const ASSETS = {
  clipart: '/assets/logo/clipart.png',
  logo: '/assets/logo/logo.png',
  curved: '/assets/logo/curved.png',
  homeClickSound: '/assets/sound/click.wav',
  homePetSticker: '/assets/stickers/Home_Pet.tgs',
  namePetSticker: '/assets/stickers/Duck_1.tgs',
  loginPetSticker: '/assets/stickers/Duck_2_Key.tgs',
  winSticker: '/assets/stickers/Rich_Robo.tgs',
  loseSticker: '/assets/stickers/Sorry.tgs',
  idleSticker: '/assets/stickers/Result.tgs',
  planImage: (typeOrName: string) =>
    `/assets/plans/${String(typeOrName || '')
      .toLowerCase()
      .replace(/[^a-z]/g, '')}.png`,
  resultImage: (digit: number | string) => `/assets/wingo/wingo_${digit}.png`,
  resultImageBig: '/assets/wingo/wingo_big.png',
  resultImageSmall: '/assets/wingo/wingo_small.png',
};

export const OWNER_TG = 'https://t.me/ReXxTraderr';
export const JOIN_TG_CHANNEL = 'https://t.me/+fzOzXs3kOMFlZDZl';

export function openExternalUrl(url: string): void {
  if (!url) return;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => anchor.remove(), 100);
}

export function padNumber(value: number | string, minLength = 2): string {
  return String(value).padStart(minLength, '0');
}

export function hexToRgbTriplet(hex: string): string {
  const clean = (hex || '#E3011A').replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16) || 227;
  const g = parseInt(full.slice(2, 4), 16) || 1;
  const b = parseInt(full.slice(4, 6), 16) || 26;
  return `${r}, ${g}, ${b}`;
}

export function colorTagsFor(n: number): string[] {
  if (n === 0) return ['red', 'violet'];
  if (n === 5) return ['green', 'violet'];
  return n % 2 === 0 ? ['red'] : ['green'];
}

export function resultAccentFor(n: number): string {
  return n % 2 === 0 ? '#ff3e3e' : '#00ff88';
}

export function colorForPlanType(type: string): string {
  switch (String(type).toLowerCase()) {
    case 'bronze':
      return '#cd7f32';
    case 'silver':
      return '#c0c0c0';
    case 'gold':
      return '#ffd700';
    case 'platinum':
      return '#e5e4e2';
    case 'diamond':
      return '#4ee2ec';
    default:
      return '#E3011A';
  }
}

export function generateDeviceId(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'DGDV-';
  for (let i = 0; i < 24; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * 36));
  }
  return id;
}

export function ensureDeviceId(): string {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = generateDeviceId();
    localStorage.setItem('device_id', id);
  }
  return id;
}

// --- WebAudio Sound Synthesizer ---
let audioContext: AudioContext | null = null;

function playTone(frequency: number, durationMs = 100, waveform: OscillatorType = 'sine'): void {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioContext = audioContext || new Ctx();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = waveform;
    osc.frequency.value = frequency;
    const startAt = audioContext.currentTime;
    const endAt = startAt + durationMs / 1000;
    const attack = Math.min(0.003, durationMs / 3000);
    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.35, startAt + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, endAt);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start(startAt);
    osc.stop(endAt);
  } catch {
    // Ignore audio context restrictions
  }
}

const SOUND_RECIPES = {
  click() {
    playTone(2400, 10, 'square');
    setTimeout(() => playTone(1400, 16, 'triangle'), 4);
    setTimeout(() => {
      playTone(1900, 8, 'triangle');
      setTimeout(() => playTone(2800, 5, 'sine'), 3);
    }, 55);
  },
  success() {
    playTone(880, 140);
    playTone(1760, 140, 'triangle');
    setTimeout(() => {
      playTone(1174, 160);
      playTone(2348, 160, 'triangle');
    }, 90);
    setTimeout(() => {
      playTone(1568, 220);
      playTone(3136, 220, 'triangle');
    }, 190);
  },
  error() {
    playTone(880, 80);
    setTimeout(() => playTone(690, 100, 'triangle'), 65);
    setTimeout(() => playTone(520, 140), 140);
  },
  warning() {
    playTone(920, 70, 'triangle');
    setTimeout(() => playTone(760, 90), 85);
  },
  tick() {
    playTone(1320, 45, 'triangle');
  },
};

export function playSoundEffect(name: keyof typeof SOUND_RECIPES): void {
  const fn = SOUND_RECIPES[name];
  if (fn) fn();
}

export function playAudioFile(url: string, times = 1, delayMs = 0): void {
  try {
    const audio = new Audio(url);
    audio.load();
    let count = 0;
    const playNext = () => {
      if (count >= times) return;
      const a = count === 0 ? audio : new Audio(url);
      a.onended = () => {
        count++;
        if (delayMs > 0) setTimeout(playNext, delayMs);
        else playNext();
      };
      a.currentTime = 0;
      a.play().catch(() => {
        playSoundEffect('click');
      });
    };
    playNext();
  } catch {
    playSoundEffect('click');
  }
}

// --- Toast Portal ---
let toastRoot: HTMLDivElement | null = null;
const toastStacks: { top: HTMLDivElement | null; bottom: HTMLDivElement | null } = {
  top: null,
  bottom: null,
};
let toastIdCounter = 0;

const TOAST_ICONS: Record<string, string> = {
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>',
  error:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  warn:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  info:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
};

function ensureToastRoot(): void {
  if (toastRoot && document.body.contains(toastRoot)) return;
  toastRoot = document.createElement('div');
  toastRoot.className = 'vs_toast-root';
  toastRoot.id = 'vs_toast-portal';

  const topStack = document.createElement('div');
  topStack.className = 'vs_toast-stack vs_toast-stack--top';
  topStack.dataset.position = 'top';
  toastRoot.appendChild(topStack);
  toastStacks.top = topStack;

  const bottomStack = document.createElement('div');
  bottomStack.className = 'vs_toast-stack vs_toast-stack--bottom';
  bottomStack.dataset.position = 'bottom';
  toastRoot.appendChild(bottomStack);
  toastStacks.bottom = bottomStack;

  document.body.appendChild(toastRoot);
}

export function showToast(
  type: 'success' | 'error' | 'warn' | 'info' = 'info',
  message = '',
  duration = 3200,
  position: 'top' | 'bottom' = 'bottom',
): number {
  ensureToastRoot();
  const id = ++toastIdCounter;
  const item = document.createElement('div');
  item.className = `vs_toast-item vs_toast-item--${type} vs_toast-anim-enter-active`;
  item.dataset.toastId = String(id);
  item.innerHTML = `
    <span class="vs_toast-shine"></span>
    <span class="vs_toast-edge-top"></span>
    <span class="vs_toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
    <span class="vs_toast-message">${message}</span>
    <span class="vs_toast-close">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </span>`;

  const stack = toastStacks[position] || toastStacks.bottom;
  stack?.appendChild(item);
  setTimeout(() => item.classList.remove('vs_toast-anim-enter-active'), 350);

  const removeToast = () => {
    if (item.parentNode) {
      item.classList.remove('vs_toast-anim-enter-active');
      item.classList.add('vs_toast-anim-leave-active');
      setTimeout(() => {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 280);
    }
  };
  item.addEventListener('click', removeToast);
  setTimeout(removeToast, duration);
  return id;
}

// --- TGS Sticker Player (Pako + Lottie) ---
const stickerBytesCache = new Map<string, Promise<Uint8Array>>();

function fetchStickerBytes(url: string): Promise<Uint8Array> {
  const existing = stickerBytesCache.get(url);
  if (existing) return existing;
  const p = fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  });
  stickerBytesCache.set(url, p);
  return p;
}

export function playTgsSticker(
  hostElement: HTMLElement | null,
  url: string,
  options: { loop?: boolean; renderer?: 'svg' | 'canvas' } = {},
): { destroy: () => void } | null {
  if (!hostElement) return null;
  hostElement.innerHTML = '';
  const { loop = true, renderer = 'svg' } = options;
  let animationInstance: { destroy: () => void } | null = null;
  let videoEl: HTMLVideoElement | null = null;
  let blobUrl: string | null = null;
  let disposed = false;

  fetchStickerBytes(url)
    .then((bytes) => {
      if (disposed || !hostElement.isConnected) return;
      const isGzip = bytes[0] === 31 && bytes[1] === 139;
      const isWebm = bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163;
      if (isGzip && window.pako && window.lottie) {
        const jsonText = window.pako.ungzip(bytes, { to: 'string' });
        const animationData = JSON.parse(jsonText);
        animationInstance = window.lottie.loadAnimation({
          container: hostElement,
          renderer,
          loop,
          autoplay: true,
          animationData,
        });
      } else if (isWebm) {
        blobUrl = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'video/webm' }));
        videoEl = document.createElement('video');
        videoEl.src = blobUrl;
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.loop = loop;
        videoEl.style.width = '100%';
        videoEl.style.height = '100%';
        videoEl.style.objectFit = 'contain';
        hostElement.appendChild(videoEl);
      } else if (window.lottie) {
        const jsonText = new TextDecoder().decode(bytes);
        const animationData = JSON.parse(jsonText);
        animationInstance = window.lottie.loadAnimation({
          container: hostElement,
          renderer,
          loop,
          autoplay: true,
          animationData,
        });
      }
    })
    .catch(() => {
      if (hostElement.isConnected) {
        hostElement.innerHTML = '<div class="asset-fail">sticker</div>';
      }
    });

  return {
    destroy() {
      disposed = true;
      try {
        animationInstance?.destroy();
      } catch {}
      try {
        videoEl?.remove();
      } catch {}
      try {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      } catch {}
    },
  };
}

// --- Original Global Lottie Loader ---
const LOADER_LOTTIE_DATA = {
  v: '5.5.6',
  fr: 29.9700012207031,
  ip: 0,
  op: 48.0000019550801,
  w: 500,
  h: 500,
  nm: 'Comp 1',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Shape Layer 2',
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { a: 0, k: 0, ix: 10 },
        p: {
          a: 1,
          ix: 2,
          k: [
            { i: { x: 0.1, y: 1 }, o: { x: 0.9, y: 0 }, t: 0, s: [285, 250, 0], to: [-11.583, 0, 0], ti: [0, 0, 0] },
            { i: { x: 0.1, y: 1 }, o: { x: 0.9, y: 0 }, t: 24, s: [215.5, 250, 0], to: [0, 0, 0], ti: [-11.583, 0, 0] },
            { t: 48.0000019550801, s: [285, 250, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0], ix: 1 },
        s: {
          a: 1,
          ix: 6,
          k: [
            { i: { x: [0.833, 0.833, 0.833], y: [0.833, 0.833, -9.606] }, o: { x: [0.9, 0.9, 0.9], y: [0, 0, 0] }, t: 0, s: [50, 50, 100] },
            { i: { x: [0.1, 0.1, 0.1], y: [1, 1, 1] }, o: { x: [0.167, 0.167, 0.167], y: [0.167, 0.167, -10.606] }, t: 12, s: [85, 85, 100] },
            { i: { x: [0.833, 0.833, 0.833], y: [0.833, 0.833, 2.263] }, o: { x: [0.9, 0.9, 0.9], y: [0, 0, 0] }, t: 24, s: [50, 50, 100] },
            { i: { x: [0.1, 0.1, 0.1], y: [1, 1, 1] }, o: { x: [0.167, 0.167, 0.167], y: [0.167, 0.167, 1.263] }, t: 36, s: [25, 25, 100] },
            { t: 48.0000019550801, s: [50, 50, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { d: 1, ty: 'el', s: { a: 0, k: [114, 114], ix: 2 }, p: { a: 0, k: [0, 0], ix: 3 }, nm: 'Ellipse Path 1', mn: 'ADBE Vector Shape - Ellipse', hd: false },
            { ty: 'st', c: { a: 0, k: [1, 0.6235, 0.6235, 1], ix: 3 }, o: { a: 0, k: 100, ix: 4 }, w: { a: 0, k: 0, ix: 5 }, lc: 1, lj: 1, ml: 4, bm: 0, nm: 'Stroke 1', mn: 'ADBE Vector Graphic - Stroke', hd: false },
            { ty: 'fl', c: { a: 0, k: [0.9882, 0.2824, 0.1882, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: 'Fill 1', mn: 'ADBE Vector Graphic - Fill', hd: false },
            { ty: 'tr', p: { a: 0, k: [0.5, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 }, nm: 'Transform' },
          ],
          nm: 'Ellipse 1',
          np: 3,
          cix: 2,
          bm: 0,
          ix: 1,
          mn: 'ADBE Vector Group',
          hd: false,
        },
      ],
      ip: 0,
      op: 24.00000097754,
      st: 0,
      bm: 1,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Shape Layer 1',
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { a: 0, k: 0, ix: 10 },
        p: {
          a: 1,
          ix: 2,
          k: [
            { i: { x: 0.1, y: 1 }, o: { x: 0.9, y: 0 }, t: 0, s: [215, 250, 0], to: [11.667, 0, 0], ti: [0, 0, 0] },
            { i: { x: 0.1, y: 1 }, o: { x: 0.9, y: 0 }, t: 24, s: [285, 250, 0], to: [0, 0, 0], ti: [11.667, 0, 0] },
            { t: 48.0000019550801, s: [215, 250, 0] },
          ],
        },
        a: { a: 0, k: [0, 0, 0], ix: 1 },
        s: {
          a: 1,
          ix: 6,
          k: [
            { i: { x: [0.833, 0.833, 0.833], y: [0.833, 0.833, 2.263] }, o: { x: [0.9, 0.9, 0.9], y: [0, 0, 0] }, t: 0, s: [50, 50, 100] },
            { i: { x: [0.1, 0.1, 0.1], y: [1, 1, 1] }, o: { x: [0.167, 0.167, 0.167], y: [0.167, 0.167, 1.263] }, t: 12, s: [25, 25, 100] },
            { i: { x: [0.833, 0.833, 0.833], y: [0.833, 0.833, -9.606] }, o: { x: [0.9, 0.9, 0.9], y: [0, 0, 0] }, t: 24, s: [50, 50, 100] },
            { i: { x: [0.1, 0.1, 0.1], y: [1, 1, 1] }, o: { x: [0.167, 0.167, 0.167], y: [0.167, 0.167, -10.606] }, t: 36, s: [85, 85, 100] },
            { t: 48.0000019550801, s: [50, 50, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { d: 1, ty: 'el', s: { a: 0, k: [114, 114], ix: 2 }, p: { a: 0, k: [0, 0], ix: 3 }, nm: 'Ellipse Path 1', mn: 'ADBE Vector Shape - Ellipse', hd: false },
            { ty: 'st', c: { a: 0, k: [1, 0.9216, 0.6275, 1], ix: 3 }, o: { a: 0, k: 100, ix: 4 }, w: { a: 0, k: 0, ix: 5 }, lc: 1, lj: 1, ml: 4, bm: 0, nm: 'Stroke 1', mn: 'ADBE Vector Graphic - Stroke', hd: false },
            { ty: 'fl', c: { a: 0, k: [1, 0.8471, 0.1137, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: 'Fill 1', mn: 'ADBE Vector Graphic - Fill', hd: false },
            { ty: 'tr', p: { a: 0, k: [0.5, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 }, nm: 'Transform' },
          ],
          nm: 'Ellipse 1',
          np: 3,
          cix: 2,
          bm: 0,
          ix: 1,
          mn: 'ADBE Vector Group',
          hd: false,
        },
      ],
      ip: 0,
      op: 453.000018451068,
      st: 0,
      bm: 1,
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Shape Layer 3',
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { a: 0, k: 0, ix: 10 },
        p: { a: 0, k: [243.24, 249.75, 0], ix: 2 },
        a: { a: 0, k: [0, 0, 0], ix: 1 },
        s: { a: 0, k: [61.435, 61.435, 100], ix: 6 },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            { d: 1, ty: 'el', s: { a: 0, k: [114, 114], ix: 2 }, p: { a: 0, k: [0, 0], ix: 3 }, nm: 'Ellipse Path 1', mn: 'ADBE Vector Shape - Ellipse', hd: false },
            { ty: 'st', c: { a: 0, k: [1, 0.6314, 0.5843, 1], ix: 3 }, o: { a: 0, k: 100, ix: 4 }, w: { a: 0, k: 0, ix: 5 }, lc: 1, lj: 1, ml: 4, bm: 0, nm: 'Stroke 1', mn: 'ADBE Vector Graphic - Stroke', hd: false },
            { ty: 'fl', c: { a: 0, k: [0.9882, 0.2824, 0.1882, 1], ix: 4 }, o: { a: 0, k: 100, ix: 5 }, r: 1, bm: 0, nm: 'Fill 1', mn: 'ADBE Vector Graphic - Fill', hd: false },
            { ty: 'tr', p: { a: 0, k: [0.5, 0], ix: 2 }, a: { a: 0, k: [0, 0], ix: 1 }, s: { a: 0, k: [100, 100], ix: 3 }, r: { a: 0, k: 0, ix: 6 }, o: { a: 0, k: 100, ix: 7 }, sk: { a: 0, k: 0, ix: 4 }, sa: { a: 0, k: 0, ix: 5 }, nm: 'Transform' },
          ],
          nm: 'Ellipse 1',
          np: 3,
          cix: 2,
          bm: 0,
          ix: 1,
          mn: 'ADBE Vector Group',
          hd: false,
        },
      ],
      ip: 24.00000097754,
      op: 453.000018451068,
      st: 0,
      bm: 1,
    },
  ],
  markers: [],
};

let loaderInstance: HTMLDivElement | null = null;
let loaderAnimation: { destroy: () => void } | null = null;

export function showGlobalLoader(text = ''): void {
  if (loaderInstance) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'va_loader-wrapper';
  const overlay = document.createElement('div');
  overlay.className = 'va_loader-overlay';
  const contentBox = document.createElement('div');
  contentBox.className = 'va_loader-content-box';
  const animBox = document.createElement('div');
  animBox.className = 'va_loader-box';
  contentBox.appendChild(animBox);

  if (text) {
    const textEl = document.createElement('div');
    textEl.className = 'va_loader-text';
    textEl.innerText = text;
    contentBox.appendChild(textEl);
  }

  overlay.appendChild(contentBox);
  wrapper.appendChild(overlay);
  document.body.appendChild(wrapper);
  loaderInstance = wrapper;

  if (window.lottie) {
    loaderAnimation = window.lottie.loadAnimation({
      container: animBox,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: JSON.parse(JSON.stringify(LOADER_LOTTIE_DATA)),
    });
  }
}

export function hideGlobalLoader(): void {
  if (!loaderInstance) return;
  if (loaderAnimation) {
    try {
      loaderAnimation.destroy();
    } catch {}
    loaderAnimation = null;
  }
  loaderInstance.remove();
  loaderInstance = null;
}

// --- Original Sheet Dialogs + Lottie Emblem Animations ---
const lottieTransform = (position = [0, 0], scale = [100, 100]) => ({
  ty: 'tr',
  p: { a: 0, k: position, ix: 2 },
  a: { a: 0, k: [0, 0], ix: 1 },
  s: { a: 0, k: scale, ix: 3 },
  r: { a: 0, k: 0, ix: 6 },
  o: { a: 0, k: 100, ix: 7 },
  sk: { a: 0, k: 0, ix: 4 },
  sa: { a: 0, k: 0, ix: 5 },
  nm: 'Transform',
});

const lottieStroke = (color: number[], width: number, lineCap = 1, lineJoin = 1, miterLimit = 4) => ({
  ty: 'st',
  c: { a: 0, k: color, ix: 3 },
  o: { a: 0, k: 100, ix: 4 },
  w: { a: 0, k: width, ix: 5 },
  lc: lineCap,
  lj: lineJoin,
  ml: miterLimit,
  bm: 0,
  nm: 'Stroke 1',
  mn: 'ADBE Vector Graphic - Stroke',
  hd: false,
});

const lottieFill = (color: number[]) => ({
  ty: 'fl',
  c: { a: 0, k: color, ix: 4 },
  o: { a: 0, k: 100, ix: 5 },
  r: 1,
  bm: 0,
  nm: 'Fill 1',
  mn: 'ADBE Vector Graphic - Fill',
  hd: false,
});

const lottieEllipse = (size: number) => ({
  d: 1,
  ty: 'el',
  s: { a: 0, k: [size, size], ix: 2 },
  p: { a: 0, k: [0, 0], ix: 3 },
  nm: 'Ellipse Path 1',
  mn: 'ADBE Vector Shape - Ellipse',
  hd: false,
});

const lottieGroup = (items: unknown[], name = 'Group') => ({
  ty: 'gr',
  it: items,
  nm: name,
  np: items.length,
  cix: 2,
  bm: 0,
  ix: 1,
  mn: 'ADBE Vector Group',
  hd: false,
});

const staticValue = (value: unknown, ix: number) => ({ a: 0, k: value, ix });

const propertyValue = (value: unknown, ix: number) =>
  value && typeof value === 'object' && !Array.isArray(value) && 'a' in (value as Record<string, unknown>)
    ? { ...(value as Record<string, unknown>), ix }
    : { a: 0, k: value, ix };

const lottieLayer = (
  name: string,
  index: number,
  keyframeState: { o?: unknown; r?: unknown; p?: unknown; a?: unknown; s?: unknown },
  shapes: unknown[],
  extra: Record<string, unknown> = {},
) => ({
  ddd: 0,
  ind: index,
  ty: 4,
  nm: name,
  sr: 1,
  ks: {
    o: propertyValue(keyframeState.o ?? 100, 11),
    r: propertyValue(keyframeState.r ?? 0, 10),
    p: propertyValue(keyframeState.p, 2),
    a: propertyValue(keyframeState.a ?? [0, 0, 0], 1),
    s: propertyValue(keyframeState.s ?? [100, 100, 100], 6),
  },
  ao: 0,
  shapes,
  ip: 0,
  op: 666,
  st: 0,
  bm: 0,
  ...extra,
});

const DIALOG_ANIMATIONS: Record<string, unknown> = {
  success: {
    nm: 'Main Scene',
    ddd: 0,
    h: 512,
    w: 512,
    v: '5.7.0',
    fr: 60,
    ip: 0,
    op: 130,
    assets: [],
    layers: [
      {
        ty: 4,
        nm: 'check',
        sr: 1,
        st: 0,
        op: 240,
        ip: 0,
        hd: false,
        ddd: 0,
        bm: 0,
        hasMask: false,
        ao: 0,
        ind: 1,
        ks: {
          a: staticValue([0, 0, 0], 1),
          s: staticValue([100, 100, 100], 6),
          sk: { a: 0, k: 0 },
          p: staticValue([256, 256, 0], 2),
          r: staticValue(0, 10),
          sa: { a: 0, k: 0 },
          o: staticValue(100, 11),
        },
        shapes: [
          lottieGroup(
            [
              {
                ty: 'sh',
                bm: 0,
                hd: false,
                mn: 'ADBE Vector Shape - Group',
                nm: 'Path 1',
                ix: 1,
                d: 1,
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    i: [
                      [0, 0],
                      [0, 0],
                      [0, 0],
                    ],
                    o: [
                      [0, 0],
                      [0, 0],
                      [0, 0],
                    ],
                    v: [
                      [-82.5, 4.5],
                      [-31, 55],
                      [73, -52.5],
                    ],
                  },
                  ix: 2,
                },
              },
              {
                ty: 'tm',
                bm: 0,
                hd: false,
                mn: 'ADBE Vector Filter - Trim',
                nm: 'Trim Paths 1',
                ix: 2,
                e: {
                  a: 1,
                  k: [
                    { o: { x: 1, y: 0.076 }, i: { x: 0.667, y: 1 }, s: [0], t: 60 },
                    { s: [100], t: 85 },
                  ],
                  ix: 2,
                },
                o: { a: 0, k: 0, ix: 3 },
                s: { a: 0, k: 0, ix: 1 },
                m: 1,
              },
              lottieStroke([1, 1, 1], 30, 2, 2, 1),
              lottieTransform(),
            ],
            'Shape 1',
          ),
        ],
      },
      {
        ty: 4,
        nm: 'Shape Layer 2',
        sr: 1,
        st: 0,
        op: 240,
        ip: 0,
        hd: false,
        ddd: 0,
        bm: 0,
        hasMask: false,
        ao: 0,
        ind: 2,
        ks: {
          a: staticValue([0, 0, 0], 1),
          s: {
            a: 1,
            k: [
              { o: { x: 0.656, y: 0.872 }, i: { x: 0, y: 0.98 }, s: [0, 0, 100], t: 20 },
              { s: [150, 150, 100], t: 60 },
            ],
            ix: 6,
          },
          sk: { a: 0, k: 0 },
          p: staticValue([256, 257.86, 0], 2),
          r: staticValue(0, 10),
          sa: { a: 0, k: 0 },
          o: staticValue(100, 11),
        },
        shapes: [lottieGroup([lottieEllipse(236), lottieFill([0.1725, 0.8549, 0.5804]), lottieTransform([0, -3])], 'Ellipse 1')],
      },
      {
        ty: 4,
        nm: 'Shape Layer 1',
        sr: 1,
        st: 0,
        op: 240,
        ip: 0,
        hd: false,
        ddd: 0,
        bm: 0,
        hasMask: false,
        ao: 0,
        ind: 3,
        ks: {
          a: staticValue([0, 0, 0], 1),
          s: {
            a: 1,
            k: [
              { o: { x: 0.477, y: 0.587 }, i: { x: 0, y: 0.999 }, s: [0, 0, 100], t: 10 },
              { o: { x: 0.167, y: 0.167 }, i: { x: 0.833, y: 0.833 }, s: [150, 150, 100], t: 50 },
              { o: { x: 0.167, y: 0 }, i: { x: 0.833, y: 1 }, s: [150, 150, 100], t: 76 },
              { s: [210, 210, 100], t: 123 },
            ],
            ix: 6,
          },
          sk: { a: 0, k: 0 },
          p: staticValue([256, 257.86, 0], 2),
          r: staticValue(0, 10),
          sa: { a: 0, k: 0 },
          o: {
            a: 1,
            k: [
              { o: { x: 0.912, y: 0.073 }, i: { x: 0.626, y: 0.729 }, s: [100], t: 76 },
              { s: [0], t: 119 },
            ],
            ix: 11,
          },
        },
        shapes: [
          lottieGroup(
            [lottieEllipse(236), lottieStroke([1, 1, 1], 2, 1, 1), lottieFill([0.7843, 0.9451, 0.8784]), lottieTransform([0, -3])],
            'Ellipse 1',
          ),
        ],
      },
    ],
  },
};

// Info & Warning Dialog Lottie builders matching shared.min.js
(() => {
  const BLUE = [0.8902, 0.0039, 0.102, 1];
  const scaleKeyframes = (t0: number, a: number[], t1: number, b: number[], easing = [0.48, 0.48, 0.333]) => ({
    a: 1,
    k: [
      { i: { x: [0.471, 0.471, 0.667], y: [1, 1, 1] }, o: { x: easing, y: [0, 0, 0] }, t: t0, s: a },
      { t: t1, s: b },
    ],
  });
  const easeInOut = (x: number) => ({
    i: { x: [0.833, 0.833, 0.833], y: [1, 1, 1] },
    o: { x: [x, x, x], y: [0, 0, 0] },
  });

  DIALOG_ANIMATIONS.info = {
    v: '5.5.10',
    fr: 29.97,
    ip: 0,
    op: 75,
    w: 300,
    h: 335,
    nm: 'Comp 1',
    ddd: 0,
    assets: [],
    layers: [
      lottieLayer(
        'Shape Layer 6',
        1,
        {
          p: {
            a: 1,
            k: [
              { i: { x: 0.667, y: 1 }, o: { x: 0.333, y: 0 }, t: 25, s: [148, 190.571, 0], to: [0, 1.667, 0], ti: [0, -1.667, 0] },
              { t: 32, s: [148, 200.571, 0] },
            ],
          },
          a: [0, 31.75, 0],
          s: {
            a: 1,
            k: [
              { ...easeInOut(0.333), t: 25, s: [0, 0, 100] },
              { ...easeInOut(0.167), t: 32, s: [119.25, 136.286, 100] },
              { ...easeInOut(0.167), t: 34, s: [86, 98.286, 100] },
              { t: 36, s: [100, 114.286, 100] },
            ],
          },
        },
        [lottieGroup([lottieEllipse(20), lottieFill([1, 1, 1, 1]), lottieTransform([0, 40.5])], 'Ellipse 1')],
        { ip: 25, op: 372, st: -6 },
      ),
      lottieLayer(
        'Shape Layer 5',
        2,
        {
          p: [149, 187.5, 0],
          a: [0, 78.156, 0],
          s: {
            a: 1,
            k: [
              { ...easeInOut(0.333), t: 19, s: [52.459, 2.459, 100] },
              { ...easeInOut(0.167), t: 27, s: [52.459, 61.459, 100] },
              { ...easeInOut(0.167), t: 30.5, s: [52.459, 45.459, 100] },
              { t: 34, s: [52.459, 52.459, 100] },
            ],
          },
        },
        [
          lottieGroup(
            [
              { ty: 'rc', d: 1, s: { a: 0, k: [234, 260], ix: 2 }, p: { a: 0, k: [0, 0], ix: 3 }, r: { a: 0, k: 0, ix: 4 }, nm: 'Rectangle Path 1', mn: 'ADBE Vector Shape - Rect', hd: false },
              lottieFill([1, 1, 1, 1]),
              lottieTransform([5, 1.5]),
            ],
            'Rectangle 1',
          ),
        ],
        {
          ip: 19,
          op: 374,
          st: -4,
          hasMask: true,
          masksProperties: [
            {
              inv: false,
              mode: 'f',
              pt: {
                a: 0,
                k: {
                  i: [
                    [-3.805, 13.022],
                    [-0.092, 37.927],
                    [0, -49.691],
                    [-4.587, -15.298],
                  ],
                  o: [
                    [3.996, -13.582],
                    [0, -49.932],
                    [0, 37.689],
                    [4.06, 13.26],
                  ],
                  v: [
                    [10.277, 74.31],
                    [31.587, -36.638],
                    [-30.587, -36.638],
                    [-9.624, 74.31],
                  ],
                  c: true,
                },
                ix: 1,
              },
              o: { a: 0, k: 100, ix: 3 },
              x: { a: 0, k: 0, ix: 4 },
              nm: 'Mask 1',
            },
          ],
        },
      ),
      lottieLayer('Shape Layer 3', 5, { p: [150, 167, 0], a: [-4, -8.5, 0], s: scaleKeyframes(7, [0, 0, 100], 25, [78.151, 78.151, 100]) }, [lottieGroup([lottieEllipse(238), lottieFill(BLUE), lottieTransform([-4, -8.5])], 'Ellipse 1')], { ip: 7, op: 385, st: 7 }),
      lottieLayer('Shape Layer 2', 6, { o: 20, p: [150, 167, 0], a: [-4, -8.5, 0], s: scaleKeyframes(3, [0, 0, 100], 21, [96.639, 96.639, 100]) }, [lottieGroup([lottieEllipse(238), lottieFill(BLUE), lottieTransform([-4, -8.5])], 'Ellipse 1')], { ip: 3, op: 381, st: 3 }),
      lottieLayer('Shape Layer 1', 7, { o: 10, p: [150, 167, 0], a: [-4, -8.5, 0], s: scaleKeyframes(0, [0, 0, 100], 18, [110.084, 110.084, 100]) }, [lottieGroup([lottieEllipse(238), lottieFill(BLUE), lottieTransform([-4, -8.5])], 'Ellipse 1')], { ip: 0, op: 378, st: 0 }),
    ],
  };

  DIALOG_ANIMATIONS.warning = DIALOG_ANIMATIONS.info;
  DIALOG_ANIMATIONS.error = DIALOG_ANIMATIONS.info;
})();

const DIALOG_PALETTES: Record<string, { border: string; glow: string }> = {
  success: { border: '#22c55e59', glow: '#22c55e40' },
  warning: { border: '#eab30859', glow: '#eab30840' },
  error: { border: '#ef444459', glow: '#ef444440' },
  info: { border: '#E3011A59', glow: '#E3011A40' },
};

let dialogAnimationHandle: { destroy: () => void } | null = null;
let dialogCloseTimer: number | null = null;

export function destroyDialogAnimation(): void {
  const host = document.getElementById('sheetHost');
  if (!host) return;
  const backdrop = host.querySelector('.sheet-backdrop');
  if (!backdrop) {
    try {
      dialogAnimationHandle?.destroy();
    } catch {}
    dialogAnimationHandle = null;
    host.innerHTML = '';
    return;
  }
  if (dialogCloseTimer) window.clearTimeout(dialogCloseTimer);
  backdrop.classList.add('is-closing');
  dialogCloseTimer = window.setTimeout(() => {
    try {
      dialogAnimationHandle?.destroy();
    } catch {}
    dialogAnimationHandle = null;
    host.innerHTML = '';
  }, 180);
}

export interface DialogButtonSpec {
  label: string;
  variant?: 'primary' | 'danger' | 'ghost';
  onSelect?: () => void;
}

export function openDialog(
  variant: 'success' | 'warning' | 'error' | 'info',
  heading: string,
  message: string,
  actionButtons: DialogButtonSpec[],
): void {
  const palette = DIALOG_PALETTES[variant] || DIALOG_PALETTES.info;
  const host = document.getElementById('sheetHost');
  if (!host) return;
  if (dialogCloseTimer) window.clearTimeout(dialogCloseTimer);
  try {
    dialogAnimationHandle?.destroy();
  } catch {}
  dialogAnimationHandle = null;

  host.innerHTML = `
    <div class="sheet-backdrop">
      <div class="sheet-scrim">
        <div class="sheet-panel" style="--sheet-border:${palette.border};--sheet-glow:${palette.glow}">
          <div class="sheet-edge-top"></div>
          <div class="sheet-aura"></div>
          <div class="sheet-inner">
            <div class="sheet-emblem" id="dialogStickerHost"></div>
            <h2 class="sheet-title">${heading}</h2>
            <p class="sheet-message">${message}</p>
            <div class="sheet-actions" id="sheetActions"></div>
          </div>
          <div class="sheet-edge-bottom"></div>
        </div>
      </div>
    </div>`;

  try {
    const stickerContainer = host.querySelector('#dialogStickerHost') as HTMLElement | null;
    const animationData = DIALOG_ANIMATIONS[variant] || DIALOG_ANIMATIONS.info;
    if (stickerContainer && window.lottie) {
      dialogAnimationHandle = window.lottie.loadAnimation({
        container: stickerContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: JSON.parse(JSON.stringify(animationData)),
      });
    }
  } catch {}

  const actionHost = host.querySelector('#sheetActions');
  actionButtons.forEach((spec) => {
    const btn = document.createElement('button');
    btn.className = `sheet-button sheet-button--${spec.variant || 'ghost'}`;
    btn.innerHTML = `<span class="sheet-button-label">${spec.label}</span>`;
    btn.onclick = () => {
      playSoundEffect('click');
      destroyDialogAnimation();
      spec.onSelect?.();
    };
    actionHost?.appendChild(btn);
  });

  const scrim = host.querySelector('.sheet-scrim') as HTMLElement | null;
  if (scrim) {
    scrim.onclick = (event) => {
      if ((event.target as HTMLElement).classList.contains('sheet-scrim')) {
        destroyDialogAnimation();
      }
    };
  }
}

// --- Original Spacetime Warped Grid + Twin Lightning Bolts + Rising Embers Background ---
export function startSpacetimeBackground(
  app: HTMLElement,
  stage: HTMLElement,
  canvas: HTMLCanvasElement,
  emberLayer: HTMLElement,
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RED = '227,1,26';
  const emberR = (a: number, b: number) => a + Math.random() * (b - a);
  let disposed = false;
  let rafId = 0;

  const emberTimer = window.setInterval(() => {
    if (!document.hidden && !disposed) {
      const e = document.createElement('div');
      const t = emberR(2.2, 3.4);
      e.className = 'ember';
      e.style.left = `${emberR(0, app.clientWidth)}px`;
      e.style.top = `${emberR(0.1, 0.8) * app.clientHeight * 0.6}px`;
      e.style.setProperty('--s', `${emberR(2, 5).toFixed(1)}px`);
      e.style.setProperty('--dx', `${emberR(-18, 18).toFixed(0)}px`);
      e.style.setProperty('--dy', `${-emberR(50, 110).toFixed(0)}px`);
      e.style.setProperty('--t', `${t.toFixed(2)}s`);
      emberLayer.appendChild(e);
      window.setTimeout(() => e.remove(), 1000 * t);
    }
  }, 260);

  const G = 40;
  const LEN = 90;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
  const phase = (t: number) => (t % 2000) * 0.02;
  let W = 0;
  let H = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stage.clientWidth || 400;
    H = stage.clientHeight || 450;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const visible = (y: number) => 0.5 + 0.5 * Math.max(0, 1 - y / (H || 1));
  const defs = [
    { ax: 0.5, bx: 0.28, fx: 0.00042, px: 0, ay: 0.34, by: 0.14, fy: 0.00031, py: 1, s: 130, k: 0.28 },
    { ax: 0.5, bx: 0.32, fx: 0.00066, px: 2.4, ay: 0.3, by: 0.12, fy: 0.00047, py: 4.1, s: 90, k: 0.22 },
  ];
  let wells: { x: number; y: number; s2: number; s: number; k: number }[] = [];
  const tri = (u: number) => (u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75);
  const pos: [number, number, number][] = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  let wx = 0;
  let wy = 0;

  function warp(x: number, y: number): [number, number] {
    for (let i = 0; i < wells.length; i++) {
      const w = wells[i];
      const dx = x - w.x;
      const dy = y - w.y;
      const f = 1 - w.k * Math.exp(-(dx * dx + dy * dy) / w.s2);
      x = w.x + dx * f;
      y = w.y + dy * f;
    }
    return [x, y];
  }

  function warpXY(x: number, y: number): void {
    const res = warp(x, y);
    wx = res[0];
    wy = res[1];
  }

  function makeMover(
    id: 0 | 1,
    fx: number,
    fy: number,
    heading: number,
    ph: number,
    cruise: number,
    homePh: number,
  ) {
    let x = 0;
    let y = 0;
    let hd = heading;
    let sp = cruise;
    let last: number | null = null;
    const me = pos[id];
    const other = pos[(1 - id) as 0 | 1];

    return (t: number) => {
      if (last === null) {
        x = W * fx;
        y = H * fy;
        last = t;
      }
      const dt = Math.min(3, (t - last) / 16.667);
      last = t;
      hd += (0.03 * Math.sin(0.0011 * t + ph) + 0.022 * Math.sin(0.0029 * t + 2.3 * ph)) * dt;
      let ax = 0;
      let ay = 0;
      for (let i = 0; i < wells.length; i++) {
        const w = wells[i];
        const dx = w.x - x;
        const dy = w.y - y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2) + 1;
        const f = 0.02 * Math.exp(-r2 / (w.s * w.s * 4.5));
        ax += (dx / r) * f;
        ay += (dy / r) * f;
      }
      ax += 0.0004 * (W * (0.5 + 0.3 * Math.sin(0.00023 * t + homePh)) - x);
      ay += 0.0004 * (H * (0.33 + 0.12 * Math.sin(0.00031 * t + 1.7 * homePh)) - y);
      if (other[2]) {
        const odx = x - other[0];
        const ody = y - other[1];
        const od = Math.hypot(odx, ody) || 1;
        if (od < 260) {
          const kk = 1 - od / 260;
          const ff = 0.3 * kk * kk;
          ax += (odx / od) * ff;
          ay += (ody / od) * ff;
        }
      }
      const ox = (x - 0.5 * W) / (0.4 * (W || 1));
      const oy = (y - 0.34 * H) / (0.24 * (H || 1));
      ax -= Math.sign(ox) * Math.pow(Math.max(0, Math.abs(ox) - 0.6), 2) * 0.9;
      ay -= Math.sign(oy) * Math.pow(Math.max(0, Math.abs(oy) - 0.6), 2) * 0.9;
      const vx = Math.cos(hd) * sp + ax * dt;
      const vy = Math.sin(hd) * sp + ay * dt;
      sp = Math.hypot(vx, vy);
      hd = Math.atan2(vy, vx);
      sp += 0.012 * (cruise - sp) * dt;
      if (sp > 4.6) sp = 4.6;
      x += Math.cos(hd) * sp * dt;
      y += Math.sin(hd) * sp * dt;
      me[0] = x;
      me[1] = y;
      me[2] = 1;
      return me;
    };
  }

  function makeBolt(mover: (t: number) => [number, number, number]) {
    const ht = new Float64Array(256);
    const hx = new Float32Array(256);
    const hy = new Float32Array(256);
    let hs = 0;
    let hn = 0;
    let rx = 0;
    let ry = 0;
    const ptx = new Float32Array(23);
    const pty = new Float32Array(23);
    const pdx = new Float32Array(23);
    const pdy = new Float32Array(23);
    let jitOld = new Float32Array(23);
    let jitNew = new Float32Array(23);
    let fork: { i: number; s: number; a: number } | null = null;
    let flickOld = 1;
    let flickNew = 1;
    let lastJit = -1e9;
    const segCol: string[] = [];
    const segW: number[] = [];

    for (let i = 0; i <= 22; i++) {
      const q = i / 22;
      const c = Math.round(255 * q * q * q);
      const al = (0.2 + 0.8 * Math.pow(q, 0.9)).toFixed(3);
      segCol.push(`rgba(${227 + Math.round(28 * q)},${c},${c},${al})`);
      segW.push(1.6 + 2.2 * q);
    }

    const headGrad = ctx!.createRadialGradient(0, 0, 0, 0, 0, 28);
    headGrad.addColorStop(0, 'rgba(255,255,255,.9)');
    headGrad.addColorStop(0.25, `rgba(${RED},.5)`);
    headGrad.addColorStop(1, `rgba(${RED},0)`);

    function posAt(tt: number) {
      const a0 = 255 & hs;
      const lastIdx = (hs + hn - 1) & 255;
      if (tt <= ht[a0]) {
        rx = hx[a0];
        ry = hy[a0];
        return;
      }
      if (tt >= ht[lastIdx]) {
        rx = hx[lastIdx];
        ry = hy[lastIdx];
        return;
      }
      let lo = 0;
      let hi = hn - 1;
      while (hi - lo > 1) {
        const m = (lo + hi) >> 1;
        if (ht[(hs + m) & 255] <= tt) lo = m;
        else hi = m;
      }
      const i0 = (hs + lo) & 255;
      const i1 = (hs + hi) & 255;
      const u = (tt - ht[i0]) / (ht[i1] - ht[i0] || 1);
      rx = hx[i0] + (hx[i1] - hx[i0]) * u;
      ry = hy[i0] + (hy[i1] - hy[i0]) * u;
    }

    return (t: number) => {
      const h0 = mover(t);
      const w = (hs + hn) & 255;
      ht[w] = t;
      hx[w] = h0[0];
      hy[w] = h0[1];
      if (hn < 256) hn++;
      else hs = (hs + 1) & 255;
      while (hn > 2 && t - ht[255 & hs] > 940) {
        hs = (hs + 1) & 255;
        hn--;
      }
      if (hn < 3) return;

      if (t - lastJit > 80) {
        lastJit = t;
        const tmp = jitOld;
        jitOld = jitNew;
        jitNew = tmp;
        flickOld = flickNew;
        for (let i = 0; i <= 22; i++) jitNew[i] = 2 * Math.random() - 1;
        flickNew = 0.8 + 0.2 * Math.random();
        fork = Math.random() < 0.6 ? { i: rnd(4, 17), s: Math.random() < 0.5 ? 1 : -1, a: rand(0.7, 1) } : null;
      }
      const rawU = Math.min(1, (t - lastJit) / 80);
      const u = rawU * rawU * (3 - 2 * rawU);
      const flick = flickOld + (flickNew - flickOld) * u;
      let ldx = 1;
      let ldy = 0;

      for (let i = 0; i <= 22; i++) {
        const q = i / 22;
        const tt = t - 820 * (1 - q);
        posAt(tt - 35);
        const ax = rx;
        const ay = ry;
        posAt(tt + 35);
        let dx = rx - ax;
        let dy = ry - ay;
        posAt(tt);
        const cx = rx;
        const cy = ry;
        const m = Math.hypot(dx, dy);
        if (m > 0.01) {
          dx /= m;
          dy /= m;
          ldx = dx;
          ldy = dy;
        } else {
          dx = ldx;
          dy = ldy;
        }
        const off = 10 * (jitOld[i] + (jitNew[i] - jitOld[i]) * u) * (1 - q) * Math.min(1, 5 * q);
        warpXY(cx - dy * off, cy + dx * off);
        ptx[i] = wx;
        pty[i] = wy;
        pdx[i] = dx;
        pdy[i] = dy;
      }

      ctx!.save();
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';
      ctx!.globalAlpha = flick;
      ctx!.beginPath();
      ctx!.moveTo(ptx[0], pty[0]);
      for (let j = 1; j <= 22; j++) ctx!.lineTo(ptx[j], pty[j]);
      ctx!.strokeStyle = `rgba(${RED},.09)`;
      ctx!.lineWidth = 13;
      ctx!.stroke();
      ctx!.strokeStyle = `rgba(${RED},.16)`;
      ctx!.lineWidth = 7;
      ctx!.stroke();

      for (let k = 1; k <= 22; k++) {
        ctx!.strokeStyle = segCol[k];
        ctx!.lineWidth = segW[k];
        ctx!.beginPath();
        ctx!.moveTo(ptx[k - 1], pty[k - 1]);
        ctx!.lineTo(ptx[k], pty[k]);
        ctx!.stroke();
      }

      if (fork) {
        const fk = fork.i;
        const nx = -pdy[fk] * fork.s;
        const ny = pdx[fk] * fork.s;
        const m1x = ptx[fk] + 9 * nx + 5 * pdx[fk];
        const m1y = pty[fk] + 9 * ny + 5 * pdy[fk];
        ctx!.globalAlpha = flick * fork.a * Math.sin(Math.PI * u);
        ctx!.strokeStyle = 'rgba(255,138,148,.9)';
        ctx!.lineWidth = 1.6;
        ctx!.beginPath();
        ctx!.moveTo(ptx[fk], pty[fk]);
        ctx!.lineTo(m1x, m1y);
        ctx!.lineTo(m1x + 4 * nx + 9 * pdx[fk], m1y + 4 * ny + 9 * pdy[fk]);
        ctx!.stroke();
        ctx!.globalAlpha = flick;
      }

      ctx!.translate(ptx[22], pty[22]);
      const sc = 0.93 + 0.07 * Math.sin(0.012 * t);
      ctx!.scale(sc, sc);
      ctx!.fillStyle = headGrad;
      ctx!.beginPath();
      ctx!.arc(0, 0, 28, 0, 7);
      ctx!.fill();
      ctx!.fillStyle = '#fff';
      ctx!.beginPath();
      ctx!.arc(0, 0, 3.2, 0, 7);
      ctx!.fill();
      ctx!.restore();
    };
  }

  interface PulseItem {
    h: boolean;
    steps: number;
    dur: number;
    t0: number;
    x: number;
    y: number;
  }

  const bolts = [
    makeBolt(makeMover(0, 0.28, 0.3, 0.5, 0, 2, 0)),
    makeBolt(makeMover(1, 0.72, 0.4, Math.PI - 0.5, 3.4, 2.7, 2.7)),
  ];
  const pulses: PulseItem[] = [];
  const cells: { x: number; y: number; t0: number }[] = [];
  const pings: { t0: number; x: number; y: number }[] = [];
  let bal = 0;

  function head(p: PulseItem, s: number): [number, number] {
    return [p.x + (p.h ? 0.13 : 0.02) * s, p.y + (p.h ? 0.02 : 0.13) * s];
  }

  function body(p: PulseItem, s: number): [number, number][] {
    const [hx, hy] = head(p, s);
    return [0, LEN / 2, LEN].map((k) => (p.h ? [hx - k, hy] : [hx, hy - k]));
  }

  function clearance(c: PulseItem, now: number): number {
    let best = Infinity;
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      for (let j = 0; j <= 4; j++) {
        const s = (c.dur * j) / 4;
        const ps = now + s - p.t0;
        if (ps <= p.dur) {
          const A = body(c, s);
          const B = body(p, ps);
          for (let m = 0; m < A.length; m++) {
            for (let n = 0; n < B.length; n++) {
              best = Math.min(best, Math.hypot(A[m][0] - B[n][0], A[m][1] - B[n][1]));
            }
          }
        }
      }
    }
    return best;
  }

  function pickLine(d: number, lo: number, hi: number): number | null {
    const a = Math.ceil((lo - d) / G);
    const b = Math.floor((hi - d) / G);
    return b >= a ? rnd(a, b) * G + d : null;
  }

  function sweep(now: number) {
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      const end = p.t0 + p.dur;
      if (now > end) {
        pulses.splice(i, 1);
        if (now - end < 250) {
          const m = p.steps * G;
          const sl = 0.02 * p.dur;
          pings.push({ t0: end, x: p.x + (p.h ? m + sl : sl), y: p.y + (p.h ? sl : m + sl) });
        }
      }
    }
    for (let i = cells.length - 1; i >= 0; i--) {
      if (now - cells[i].t0 > 2400) cells.splice(i, 1);
    }
    for (let i = pings.length - 1; i >= 0; i--) {
      if (now - pings[i].t0 > 900) pings.splice(i, 1);
    }
  }

  function drawCell(c: { x: number; y: number; t0: number }, t: number) {
    const s = t - c.t0;
    if (s < 0) return;
    const a = tri(s / 2400);
    const o = 0.02 * s;
    const x = c.x + o;
    const y = c.y + o;
    const S = 41;
    const pts: [number, number][] = [];
    for (let i = 0; i < 4; i++) pts.push([x + (S * i) / 4, y]);
    for (let i = 0; i < 4; i++) pts.push([x + S, y + (S * i) / 4]);
    for (let i = 0; i < 4; i++) pts.push([x + S - (S * i) / 4, y + S]);
    for (let i = 0; i < 4; i++) pts.push([x, y + S - (S * i) / 4]);

    ctx!.save();
    ctx!.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const q = warp(pts[i][0], pts[i][1]);
      if (i) ctx!.lineTo(q[0], q[1]);
      else ctx!.moveTo(q[0], q[1]);
    }
    ctx!.closePath();
    ctx!.fillStyle = `rgba(${RED},${0.14 * a})`;
    ctx!.fill();
    ctx!.shadowColor = '#E3011A';
    ctx!.shadowBlur = 10;
    ctx!.strokeStyle = `rgba(${RED},${0.5 * a})`;
    ctx!.lineWidth = 1.5;
    ctx!.stroke();
    ctx!.restore();
  }

  function frame(t: number) {
    if (disposed) return;
    ctx!.clearRect(0, 0, W, H);
    wells = defs.map((d) => ({
      x: W * (d.ax + d.bx * Math.sin(t * d.fx + d.px)),
      y: H * (d.ay + d.by * Math.sin(t * d.fy + d.py)),
      s2: d.s * d.s,
      s: d.s,
      k: d.k * (1 + 0.08 * Math.sin(t / 900 + d.px)),
    }));
    sweep(t);

    const d = phase(t);
    ctx!.beginPath();
    for (let x = d - G; x <= W + G; x += G) {
      let first = true;
      for (let y = -G; y <= H + G; y += 12) {
        const p = warp(x, y);
        if (first) ctx!.moveTo(p[0], p[1]);
        else ctx!.lineTo(p[0], p[1]);
        first = false;
      }
    }
    for (let y = d - G; y <= H + G; y += G) {
      let first = true;
      for (let x = -G; x <= W + G; x += 12) {
        const p = warp(x, y);
        if (first) ctx!.moveTo(p[0], p[1]);
        else ctx!.lineTo(p[0], p[1]);
        first = false;
      }
    }
    ctx!.lineJoin = 'round';
    ctx!.strokeStyle = `rgba(${RED},.16)`;
    ctx!.lineWidth = 4;
    ctx!.stroke();
    ctx!.strokeStyle = `rgba(${RED},.9)`;
    ctx!.lineWidth = 1;
    ctx!.stroke();

    cells.forEach((c) => drawCell(c, t));

    pulses.forEach((p) => {
      const s = t - p.t0;
      if (s < 0 || s > p.dur) return;
      const u = s / p.dur;
      const fade = u < 0.15 ? u / 0.15 : u > 0.85 ? (1 - u) / 0.15 : 1;
      const [hx, hy] = head(p, s);
      const at = (i: number) => {
        const k = LEN * (1 - i / 14);
        return warp(p.h ? hx - k : hx, p.h ? hy : hy - k);
      };
      ctx!.save();
      ctx!.shadowColor = '#E3011A';
      ctx!.shadowBlur = 8;
      ctx!.lineCap = 'round';
      ctx!.lineWidth = 2.5;
      let prev = at(0);
      for (let i = 1; i <= 14; i++) {
        const cur = at(i);
        const q = i / 14;
        const c = Math.round(255 * q * q * q);
        ctx!.strokeStyle = `rgba(${227 + Math.round(28 * q)},${c},${c},${fade * Math.pow(q, 1.4)})`;
        ctx!.beginPath();
        ctx!.moveTo(prev[0], prev[1]);
        ctx!.lineTo(cur[0], cur[1]);
        ctx!.stroke();
        prev = cur;
      }
      ctx!.fillStyle = `rgba(255,255,255,${fade})`;
      ctx!.beginPath();
      ctx!.arc(prev[0], prev[1], 2, 0, 7);
      ctx!.fill();
      ctx!.restore();
    });

    pings.forEach((g) => {
      const s = t - g.t0;
      if (s < 0 || s > 900) return;
      const u = s / 900;
      const r = 22 * (0.2 + 0.8 * (1 - (1 - u) * (1 - u)));
      const o = 0.02 * s;
      const [x, y] = warp(g.x + o + 0.5, g.y + o + 0.5);
      const gr = ctx!.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(255,255,255,${0.95 * tri(u)})`);
      gr.addColorStop(0.18, `rgba(${RED},${0.55 * tri(u)})`);
      gr.addColorStop(0.68, `rgba(${RED},0)`);
      ctx!.fillStyle = gr;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, 7);
      ctx!.fill();
    });

    for (let i = 0; i < bolts.length; i++) bolts[i](t);
    if (!reduce) rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  let pulseTimer = 0;
  let cellTimer = 0;
  if (!reduce) {
    const tickPulse = () => {
      if (disposed) return;
      if (!document.hidden) {
        const now = performance.now();
        sweep(now);
        if (pulses.length < 4) {
          const d0 = phase(now);
          const h = Math.random() < Math.min(0.85, Math.max(0.15, 0.5 - 0.15 * bal));
          let best: PulseItem | null = null;
          let bestScore = 0;
          for (let n = 0; n < 10; n++) {
            const steps = rnd(3, 6);
            const dur = (steps * G) / 0.11;
            const slide = 0.02 * dur;
            const across = pickLine(d0, G, (h ? H : W) - G - slide);
            const start = pickLine(d0, G, (h ? W : H) - G - steps * G - slide);
            if (across != null && start != null) {
              const cand: PulseItem = { h, steps, dur, t0: now, x: h ? start : across, y: h ? across : start };
              const clr = clearance(cand, now);
              if (clr >= 70) {
                const score = Math.min(clr, 400) * visible(h ? cand.y : cand.y + (steps * G) / 2);
                if (score > bestScore) {
                  best = cand;
                  bestScore = score;
                }
              }
            }
          }
          if (best) {
            pulses.push(best);
            bal += best.h ? 1 : -1;
          }
        }
      }
      pulseTimer = window.setTimeout(tickPulse, rand(400, 800));
    };

    const tickCell = () => {
      if (disposed) return;
      if (!document.hidden) {
        const now = performance.now();
        sweep(now);
        if (cells.length < 4) {
          const d0 = phase(now);
          let best: { x: number; y: number; t0: number } | null = null;
          let bestScore = 0;
          for (let n = 0; n < 8; n++) {
            const x = pickLine(d0, G, W - 80 - 48);
            const y = pickLine(d0, G, H - 80 - 48);
            if (x != null && y != null) {
              let clr = 300;
              for (let i = 0; i < cells.length; i++) {
                const c = cells[i];
                const k = 0.02 * (now - c.t0);
                clr = Math.min(clr, Math.hypot(x - c.x - k, y - c.y - k));
              }
              if (clr >= 90) {
                const score = clr * visible(y);
                if (score > bestScore) {
                  best = { x, y, t0: now };
                  bestScore = score;
                }
              }
            }
          }
          if (best) cells.push(best);
        }
      }
      cellTimer = window.setTimeout(tickCell, rand(600, 1100));
    };

    tickPulse();
    tickCell();
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    clearInterval(emberTimer);
    clearTimeout(pulseTimer);
    clearTimeout(cellTimer);
    ro.disconnect();
  };
}

// --- Curved Energy Arc Gauge for Oracle Page (.arc-view canvas + #arcLcd) ---
export function startArcReactorCanvas(
  canvas: HTMLCanvasElement,
  lcdEl: SVGSVGElement | null,
  getState: () => { secondsRemaining: number; duration: number; accentColor: string },
): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let disposed = false;
  let rafId = 0;
  let W = 0;
  let H = 0;

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = parent.clientWidth || 360;
    H = parent.clientHeight || 120;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  resize();

  function renderFrame(t: number) {
    if (disposed) return;
    ctx!.clearRect(0, 0, W, H);

    const { secondsRemaining, duration, accentColor } = getState();
    const rgb = hexToRgbTriplet(accentColor);
    const ratio = Math.max(0, Math.min(1, secondsRemaining / Math.max(1, duration)));

    // Gentle arch sweeping above the wolf & PERIOD NUMBER crest
    const cx = W * 0.52;
    const cy = H * 1.95;
    const radius = H * 1.78;
    const startAngle = -Math.PI * 0.685;
    const endAngle = -Math.PI * 0.315;
    const activeEnd = startAngle + (endAngle - startAngle) * ratio;

    // Subtle background track arc
    ctx!.save();
    ctx!.lineCap = 'round';
    ctx!.beginPath();
    ctx!.arc(cx, cy, radius, startAngle, endAngle);
    ctx!.strokeStyle = `rgba(${rgb}, 0.22)`;
    ctx!.lineWidth = 5;
    ctx!.stroke();

    // Tick marks along outer rim
    const ticks = 24;
    for (let i = 0; i <= ticks; i++) {
      const ang = startAngle + ((endAngle - startAngle) * i) / ticks;
      const lit = i / ticks <= ratio;
      const r1 = radius + 7;
      const r2 = radius + (i % 4 === 0 ? 13 : 10);
      ctx!.beginPath();
      ctx!.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx!.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
      ctx!.strokeStyle = lit ? `rgba(${rgb}, 0.85)` : 'rgba(255,255,255,0.12)';
      ctx!.lineWidth = i % 4 === 0 ? 1.8 : 1;
      ctx!.stroke();
    }

    // Active glowing neon energy arc
    if (ratio > 0.005) {
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, startAngle, activeEnd);
      ctx!.shadowColor = accentColor;
      ctx!.shadowBlur = 18;
      ctx!.strokeStyle = `rgba(${rgb}, 0.5)`;
      ctx!.lineWidth = 9;
      ctx!.stroke();

      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, startAngle, activeEnd);
      ctx!.strokeStyle = accentColor;
      ctx!.lineWidth = 4;
      ctx!.stroke();

      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, startAngle, activeEnd);
      ctx!.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx!.lineWidth = 1.4;
      ctx!.stroke();

      // Leading white-hot spark head
      const tipX = cx + Math.cos(activeEnd) * radius;
      const tipY = cy + Math.sin(activeEnd) * radius;
      const pulse = 1 + 0.16 * Math.sin(t * 0.012);
      const grad = ctx!.createRadialGradient(tipX, tipY, 0, tipX, tipY, 16 * pulse);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, `rgba(${rgb},0.9)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      ctx!.fillStyle = grad;
      ctx!.beginPath();
      ctx!.arc(tipX, tipY, 16 * pulse, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.restore();

    if (lcdEl) {
      lcdEl.style.left = '88%';
      lcdEl.style.top = '30%';
      lcdEl.style.transform = 'translate(-50%, -50%)';
    }

    rafId = requestAnimationFrame(renderFrame);
  }

  rafId = requestAnimationFrame(renderFrame);

  return () => {
    disposed = true;
    cancelAnimationFrame(rafId);
    ro.disconnect();
  };
}
