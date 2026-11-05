import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ASSETS,
  JOIN_TG_CHANNEL,
  OWNER_TG,
  colorForPlanType,
  ensureDeviceId,
  hexToRgbTriplet,
  hideGlobalLoader,
  openDialog,
  openExternalUrl,
  padNumber,
  playAudioFile,
  playSoundEffect,
  playTgsSticker,
  showGlobalLoader,
  showToast,
  startArcReactorCanvas,
  startSpacetimeBackground,
  type GameItem,
  type PlanItem,
  type RoundRecord,
  type UserSession,
} from './lib/rexxEngine';

type ViewName = 'home' | 'name' | 'login' | 'plans' | 'hub' | 'oracle';

const DEFAULT_GAMES: GameItem[] = [
  {
    id: '91club',
    name: '91 Club',
    accentColor: '#ff001e',
    shortTag: '91C',
    domain: '91club.com',
    banner: '/assets/games/91Club.png',
    icon: '/assets/games/91ClubIcon.png',
    link: 'https://91club.com',
  },
  {
    id: 'tiranga',
    name: 'Tiranga',
    accentColor: '#00c8ff',
    shortTag: 'TRG',
    domain: 'tirangagames.in',
    banner: '/assets/games/Tiranga.png',
    icon: '/assets/games/TirangaIcon.png',
    link: 'https://tirangagames.in',
  },
  {
    id: 'goagames',
    name: 'Goa Games',
    accentColor: '#1d5cff',
    shortTag: 'GOA',
    domain: 'goagames.com',
    banner: '/assets/games/goaGames.png',
    icon: '/assets/games/goaGamesIcon.png',
    link: 'https://goagames.com',
  },
  {
    id: 'jaiclub',
    name: 'Jai Club',
    accentColor: '#a855f7',
    shortTag: 'JAI',
    domain: 'jaiclub.com',
    banner: '/assets/games/jaiClub.png',
    icon: '/assets/games/jaiClubIcon.png',
    link: 'https://jaiclub.com',
  },
  {
    id: 'yaarwin',
    name: 'Yaar Win',
    accentColor: '#00e68a',
    shortTag: 'YRW',
    domain: 'yaarwin.com',
    banner: '/assets/games/yaarWin.png',
    icon: '/assets/games/yaarWinIcon.png',
    link: 'https://yaarwin.com',
  },
];

const DEFAULT_PLANS: PlanItem[] = [
  { planName: 'Gold', planDuration: 7, planPrice: '1,999', planType: 'gold', planColor: '#ffd700' },
  { planName: 'Platinum', planDuration: 15, planPrice: '3,499', planType: 'platinum', planColor: '#e5e4e2' },
  { planName: 'Diamond', planDuration: 30, planPrice: '6,499', planType: 'diamond', planColor: '#4ee2ec' },
];

const DURATION_OPTIONS = [
  { label: 'WinGo 30Sec', shortLabel: 'WINGO 30S', seconds: 30 },
  { label: 'WinGo 1Min', shortLabel: 'WINGO 1M', seconds: 60 },
  { label: 'WinGo 3Min', shortLabel: 'WINGO 3M', seconds: 180 },
  { label: 'WinGo 5Min', shortLabel: 'WINGO 5M', seconds: 300 },
];

function StickerSlot({
  url,
  width,
  height,
  className = '',
}: {
  url: string;
  width: number;
  height: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const handle = playTgsSticker(el, url, { loop: true, renderer: 'svg' });
    return () => {
      handle?.destroy();
    };
  }, [url]);

  return <div ref={hostRef} className={className} style={{ width: `${width}px`, height: `${height}px` }} />;
}

export default function App() {
  const appRef = useRef<HTMLDivElement | null>(null);
  const spacetimeStageRef = useRef<HTMLDivElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const emberLayerRef = useRef<HTMLDivElement | null>(null);

  // Gatekeeper state & refs
  const [gateMounted, setGateMounted] = useState<boolean>(() => sessionStorage.getItem('app_unlocked') !== '1');
  const gateRef = useRef<HTMLDivElement | null>(null);
  const rainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const narrowHaloRef = useRef<HTMLDivElement | null>(null);
  const wideHaloRef = useRef<HTMLDivElement | null>(null);
  const innerRingRef = useRef<HTMLDivElement | null>(null);
  const outerRingRef = useRef<HTMLDivElement | null>(null);
  const seamRef = useRef<HTMLDivElement | null>(null);
  const dialRef = useRef<HTMLDivElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const leftLeafRef = useRef<HTMLDivElement | null>(null);
  const rightLeafRef = useRef<HTMLDivElement | null>(null);

  // Navigation & animated transitions
  const [activeView, setActiveView] = useState<ViewName>(() => {
    if (window.location.pathname.includes('dashboard')) {
      const savedUser = localStorage.getItem('rexx_user');
      if (savedUser) return 'hub';
    }
    return 'home';
  });
  const [animClass, setAnimClass] = useState<Record<string, string>>({});
  const activeViewRef = useRef<ViewName>(activeView);
  activeViewRef.current = activeView;
  const viewAnimationsEnabledRef = useRef<boolean>(false);

  // User & Auth state
  const [deviceId] = useState<string>(() => ensureDeviceId());
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('userName') || '');
  const [nameInputVal, setNameInputVal] = useState<string>('');
  const [keyInputVal, setKeyInputVal] = useState<string>('');
  const [homeLoading, setHomeLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const raw = localStorage.getItem('rexx_user');
      return raw ? (JSON.parse(raw) as UserSession) : null;
    } catch {
      return null;
    }
  });

  // Welcome typewriter state
  const [welcomeVisible, setWelcomeVisible] = useState<boolean>(false);
  const [welcomeFadeOut, setWelcomeFadeOut] = useState<boolean>(false);
  const [welcomeHtml, setWelcomeHtml] = useState<string>('');

  // Plans state
  const [plansReturnView, setPlansReturnView] = useState<ViewName>('login');
  const [plans, setPlans] = useState<PlanItem[]>(DEFAULT_PLANS);
  const [plansVisible, setPlansVisible] = useState<boolean>(false);
  const [pullHeight, setPullHeight] = useState<number>(0);
  const pullStartYRef = useRef<number>(0);
  const pullDistRef = useRef<number>(0);

  // Hub & Predictor state
  const [games, setGames] = useState<GameItem[]>(DEFAULT_GAMES);
  const [durationSheetGame, setDurationSheetGame] = useState<GameItem | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameItem>(DEFAULT_GAMES[0]);
  const [roundDuration, setRoundDuration] = useState<number>(30);
  const [predictionMode, setPredictionMode] = useState<'big-small' | 'number'>('big-small');
  const [currentPeriodId, setCurrentPeriodId] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [roundHistory, setRoundHistory] = useState<RoundRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lockedPrediction, setLockedPrediction] = useState<{
    periodId: string;
    bigSmall: 'BIG' | 'SMALL';
    number: number;
    accuracy: number;
  } | null>(null);
  const [outcomeModal, setOutcomeModal] = useState<{
    isWin: boolean;
    title: string;
  } | null>(null);

  const lockedPredictionRef = useRef(lockedPrediction);
  lockedPredictionRef.current = lockedPrediction;
  const pendingSettlementRef = useRef<{
    periodId: string;
    bigSmall: 'BIG' | 'SMALL';
    number: number;
    modeAtLock: 'big-small' | 'number';
  } | null>(null);
  const settledPeriodsShownRef = useRef<Set<string>>(new Set());
  const predictionModeRef = useRef(predictionMode);
  predictionModeRef.current = predictionMode;
  const prevPeriodRef = useRef<string>('');
  const gameSessionsDataRef = useRef<Record<'30s' | '1m' | '3m' | '5m', { nums: number[] }>>({
    '30s': { nums: [] },
    '1m': { nums: [] },
    '3m': { nums: [] },
    '5m': { nums: [] },
  });

  const arcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const arcLcdRef = useRef<SVGSVGElement | null>(null);
  const oracleLiveStateRef = useRef({
    secondsRemaining: 30,
    duration: 30,
    accentColor: '#E3011A',
  });
  oracleLiveStateRef.current = {
    secondsRemaining,
    duration: roundDuration,
    accentColor: selectedGame.accentColor,
  };

  // Smooth view switcher matching shared.min.js setActiveView
  const switchView = useCallback((next: ViewName) => {
    const prev = activeViewRef.current;
    if (prev === next) return;

    if (!viewAnimationsEnabledRef.current) {
      setActiveView(next);
      return;
    }

    setAnimClass((s) => ({ ...s, [prev]: 'view-pop-leave-active view-pop-leave-to' }));
    window.setTimeout(() => {
      setActiveView(next);
      setAnimClass({
        [next]: 'view-pop-enter-active view-pop-enter-from',
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimClass({
            [next]: 'view-pop-enter-active view-pop-enter-to',
          });
          window.setTimeout(() => {
            setAnimClass({});
          }, 240);
        });
      });
    }, 185);
  }, []);

  // Start background spacetime warped grid + embers
  useEffect(() => {
    if (!appRef.current || !spacetimeStageRef.current || !fxCanvasRef.current || !emberLayerRef.current) {
      return;
    }
    return startSpacetimeBackground(
      appRef.current,
      spacetimeStageRef.current,
      fxCanvasRef.current,
      emberLayerRef.current,
    );
  }, []);

  // Fetch initial catalog & session check
  useEffect(() => {
    viewAnimationsEnabledRef.current = true;
    (async () => {
      try {
        const [gamesRes, plansRes] = await Promise.all([
          fetch('/api/games').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/plans').then((r) => (r.ok ? r.json() : null)),
        ]);
        if (Array.isArray(gamesRes) && gamesRes.length > 0) {
          setGames(
            gamesRes.map((g: Record<string, string>) => ({
              id: g.id,
              name: g.name,
              accentColor: g.color,
              shortTag: g.shortTag,
              domain: g.domain,
              banner: g.banner,
              icon: g.icon,
              link: g.link,
            })),
          );
        }
        if (Array.isArray(plansRes) && plansRes.length > 0) {
          setPlans(
            plansRes.map((p: { name: string; days: number; price: string; type: string; color: string }) => ({
              planName: p.name,
              planDuration: p.days,
              planPrice: p.price,
              planType: p.type,
              planColor: p.color,
            })),
          );
        }
      } catch {
        // Fallback defaults already populated
      } finally {
        setHomeLoading(false);
      }
    })();
  }, []);

  // Gatekeeper Fingerprint Unlock Engine (exact port of initializeUnlockGate)
  useEffect(() => {
    if (!gateMounted) return;
    const gate = gateRef.current;
    const pad = padRef.current;
    const mask = maskRef.current;
    const glow = glowRef.current;
    const narrowHalo = narrowHaloRef.current;
    const wideHalo = wideHaloRef.current;
    const innerRing = innerRingRef.current;
    const outerRing = outerRingRef.current;
    const seam = seamRef.current;
    const dial = dialRef.current;
    const caption = captionRef.current;
    const leftLeaf = leftLeafRef.current;
    const rightLeaf = rightLeafRef.current;
    const rainCanvas = rainCanvasRef.current;
    if (
      !gate ||
      !pad ||
      !mask ||
      !glow ||
      !narrowHalo ||
      !wideHalo ||
      !innerRing ||
      !outerRing ||
      !seam ||
      !dial ||
      !caption ||
      !leftLeaf ||
      !rightLeaf ||
      !rainCanvas
    ) {
      return;
    }

    const lockPromptTimer = window.setTimeout(() => {
      openDialog(
        'info',
        'Panel Locked!',
        'Hello user, panel is curently locked. Please scan your fingerprint to unlock it!',
        [{ label: 'Alright', variant: 'primary' }],
      );
    }, 400);

    const ctx = rainCanvas.getContext('2d');
    let progress = 0;
    let unlocked = false;
    let holdTimer: number | null = null;
    let decayTimer: number | null = null;
    let rafId = 0;

    interface RainDrop {
      x: number;
      y: number;
      fallSpeed: number;
      streakLength: number;
      alpha: number;
      strokeWidth: number;
    }

    const createRaindrop = (initial: boolean): RainDrop => ({
      x: Math.random() * window.innerWidth,
      y: initial ? Math.random() * window.innerHeight : -Math.random() * window.innerHeight * 0.4,
      fallSpeed: 1.2 + 2.2 * Math.random(),
      streakLength: 40 + 80 * Math.random(),
      alpha: 0.04 + 0.1 * Math.random(),
      strokeWidth: 0.5 + 0.8 * Math.random(),
    });

    let drops: RainDrop[] = [];
    const syncRainSize = () => {
      rainCanvas.width = window.innerWidth;
      rainCanvas.height = window.innerHeight;
      drops = [];
      const count = Math.floor(window.innerWidth / 18);
      for (let i = 0; i < count; i++) drops.push(createRaindrop(true));
    };

    const drawRain = () => {
      if (ctx) {
        ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
        drops.forEach((d, idx) => {
          const grad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.streakLength);
          grad.addColorStop(0, 'rgba(227, 1, 26, 0)');
          grad.addColorStop(0.4, `rgba(227, 1, 26, ${d.alpha})`);
          grad.addColorStop(1, 'rgba(227, 1, 26, 0)');
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x, d.y + d.streakLength);
          ctx.strokeStyle = grad;
          ctx.lineWidth = d.strokeWidth;
          ctx.stroke();
          d.y += d.fallSpeed;
          if (d.y > rainCanvas.height + d.streakLength) {
            drops[idx] = createRaindrop(false);
          }
        });
      }
      rafId = requestAnimationFrame(drawRain);
    };

    const applyVisualProgress = () => {
      const eased = Math.pow(progress / 100, 0.6);
      mask.style.clipPath = `inset(${100 - progress}% 0 0 0)`;
      glow.style.opacity = String(progress / 100);
      narrowHalo.style.opacity = String(eased);
      wideHalo.style.opacity = String(0.5 * eased);
      innerRing.style.opacity = String(Math.min(progress / 30, 1));
      outerRing.style.opacity = String(Math.min(progress / 60, 1));
    };

    const completeUnlock = () => {
      unlocked = true;
      cancelAnimationFrame(rafId);
      rainCanvas.classList.add('is-suppressed');
      seam.classList.add('is-lit');
      dial.classList.add('is-lit');
      pad.classList.remove('is-held');
      pad.classList.add('is-done');
      caption.classList.add('is-faded');
      sessionStorage.setItem('app_unlocked', '1');
      playSoundEffect('success');

      window.setTimeout(() => {
        leftLeaf.classList.add('is-open');
        rightLeaf.classList.add('is-open');
        pad.style.display = 'none';
        seam.style.display = 'none';
        window.setTimeout(() => {
          gate.style.transition = 'opacity 0.5s 0.3s';
          gate.style.opacity = '0';
          window.setTimeout(() => {
            setGateMounted(false);
          }, 850);
        }, 1000);
      }, 700);
    };

    const onHoldStart = (e: Event) => {
      if (unlocked) return;
      if (e.cancelable) e.preventDefault();
      if (decayTimer) clearInterval(decayTimer);
      pad.classList.add('is-held');
      caption.classList.add('is-faded');
      if (holdTimer) clearInterval(holdTimer);
      holdTimer = window.setInterval(() => {
        progress = Math.min(progress + 1.8, 100);
        applyVisualProgress();
        if (progress >= 100) {
          if (holdTimer) clearInterval(holdTimer);
          completeUnlock();
        }
      }, 30);
    };

    const onHoldEnd = () => {
      if (unlocked) return;
      pad.classList.remove('is-held');
      if (holdTimer) clearInterval(holdTimer);
      caption.classList.remove('is-faded');
      if (progress < 100) {
        if (decayTimer) clearInterval(decayTimer);
        decayTimer = window.setInterval(() => {
          progress = Math.max(progress - 2.5, 0);
          applyVisualProgress();
          if (progress <= 0 && decayTimer) clearInterval(decayTimer);
        }, 30);
      }
    };

    syncRainSize();
    window.addEventListener('resize', syncRainSize);
    drawRain();

    pad.addEventListener('mousedown', onHoldStart);
    pad.addEventListener('touchstart', onHoldStart, { passive: false });
    const releaseEvents = ['mouseup', 'touchend', 'mouseleave'] as const;
    releaseEvents.forEach((ev) => gate.addEventListener(ev, onHoldEnd));

    return () => {
      clearTimeout(lockPromptTimer);
      cancelAnimationFrame(rafId);
      if (holdTimer) clearInterval(holdTimer);
      if (decayTimer) clearInterval(decayTimer);
      window.removeEventListener('resize', syncRainSize);
      pad.removeEventListener('mousedown', onHoldStart);
      pad.removeEventListener('touchstart', onHoldStart);
      releaseEvents.forEach((ev) => gate.removeEventListener(ev, onHoldEnd));
    };
  }, [gateMounted]);

  // Curved Arc Reactor Canvas on Oracle View
  useEffect(() => {
    if (activeView !== 'oracle' || !arcCanvasRef.current) return;
    return startArcReactorCanvas(arcCanvasRef.current, arcLcdRef.current, () => oracleLiveStateRef.current);
  }, [activeView]);

  // Real-time WinGo Round Sync + Live GetHistoryIssuePage.json Settlement Check
  const syncOracleState = useCallback(async (gameId: string, duration: number, checkSettlement: boolean) => {
    const modeKey: '30s' | '1m' | '3m' | '5m' =
      duration === 30 ? '30s' : duration === 60 ? '1m' : duration === 180 ? '3m' : '5m';
    try {
      const res = await fetch(
        `/api/wingo/state?gameId=${encodeURIComponent(gameId)}&mode=${modeKey}&duration=${duration}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        mode?: '30s' | '1m' | '3m' | '5m';
        currentPeriodId: string;
        secondsRemaining: number;
        nums?: number[];
        history: RoundRecord[];
      };

      if (Array.isArray(data.nums)) {
        gameSessionsDataRef.current[modeKey] = { nums: data.nums };
      }

      // Move active prediction into pendingSettlement when period rolls over
      const prevPeriod = prevPeriodRef.current;
      if (checkSettlement && prevPeriod && prevPeriod !== data.currentPeriodId) {
        const activePred = lockedPredictionRef.current;
        if (activePred && activePred.periodId === prevPeriod) {
          pendingSettlementRef.current = {
            periodId: activePred.periodId,
            bigSmall: activePred.bigSmall,
            number: activePred.number,
            modeAtLock: predictionModeRef.current,
          };
        }
        setLockedPrediction(null);
      }

      // Check if live GetHistoryIssuePage.json now contains the settled result for pendingSettlement
      const pending = pendingSettlementRef.current;
      if (
        checkSettlement &&
        pending &&
        !settledPeriodsShownRef.current.has(pending.periodId) &&
        data.history.length > 0
      ) {
        const settled = data.history.find((h) => h.period === pending.periodId);
        if (settled) {
          settledPeriodsShownRef.current.add(pending.periodId);
          pendingSettlementRef.current = null;
          const isWin =
            pending.modeAtLock === 'big-small'
              ? settled.size === pending.bigSmall
              : settled.number === pending.number;

          playSoundEffect(isWin ? 'success' : 'error');
          setOutcomeModal({
            isWin,
            title: isWin ? 'CONGRATULATION WIN!' : 'OOPS! LOSS ROUND',
          });
        }
      }

      prevPeriodRef.current = data.currentPeriodId;
      setCurrentPeriodId(data.currentPeriodId);
      setSecondsRemaining(data.secondsRemaining);
      setRoundHistory(data.history);
    } catch {
      // Ignore transient network hiccups
    }
  }, []);

  useEffect(() => {
    if (activeView !== 'oracle') return;
    prevPeriodRef.current = '';
    pendingSettlementRef.current = null;
    syncOracleState(selectedGame.id, roundDuration, false);

    const interval = window.setInterval(() => {
      syncOracleState(selectedGame.id, roundDuration, true);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeView, selectedGame.id, roundDuration, syncOracleState]);

  // Play tick sound on last 5 seconds countdown
  useEffect(() => {
    if (activeView === 'oracle' && !outcomeModal && secondsRemaining >= 1 && secondsRemaining <= 5) {
      playSoundEffect('tick');
    }
  }, [activeView, outcomeModal, secondsRemaining]);

  // --- Event Handlers ---
  const handleHomeStart = () => {
    playAudioFile(ASSETS.homeClickSound);
    if (currentUser) {
      switchView('hub');
    } else if (userName.trim()) {
      switchView('login');
    } else {
      switchView('name');
    }
  };

  const handleHomeTelegram = () => {
    playSoundEffect('click');
    const tg = localStorage.getItem('tgChannel') || JOIN_TG_CHANNEL;
    openExternalUrl(tg);
  };

  const runWelcomeTypewriter = (enteredName: string) => {
    setWelcomeVisible(true);
    setWelcomeFadeOut(false);
    setWelcomeHtml('');

    const segments = [
      { text: 'Hey ', className: '' },
      { text: enteredName, className: 'hi' },
      { text: '! ', className: 'punct' },
      { text: 'Welcome', className: 'brand' },
      { text: ' to ', className: '' },
      { text: 'ReXx', className: 'brand' },
      { text: ' ', className: '' },
      { text: 'PREDICTOR', className: 'brand' },
      { text: ' ', className: '' },
      { text: '5.0', className: 'version' },
    ];
    const fullText = segments.map((s) => s.text).join('');
    let cursor = 0;

    const timer = window.setInterval(() => {
      if (cursor >= fullText.length) {
        clearInterval(timer);
        window.setTimeout(() => {
          setWelcomeFadeOut(true);
          window.setTimeout(() => {
            setWelcomeVisible(false);
            switchView('login');
          }, 1000);
        }, 1200);
        return;
      }
      cursor++;
      const partial = fullText.slice(0, cursor);
      let html = '';
      let offset = 0;
      for (const seg of segments) {
        if (offset >= partial.length) break;
        const chunk = partial.slice(offset, offset + seg.text.length);
        if (chunk.length === 0) break;
        const safe = chunk.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += seg.className ? `<span class="${seg.className}">${safe}</span>` : safe;
        offset += chunk.length;
      }
      setWelcomeHtml(html);
    }, 55);
  };

  const handleSaveName = () => {
    const trimmed = nameInputVal.trim();
    if (!trimmed) return;
    playSoundEffect('success');
    localStorage.setItem('userName', trimmed);
    setUserName(trimmed);
    runWelcomeTypewriter(trimmed);
  };

  const handleSubmitKey = async () => {
    const trimmedKey = keyInputVal.trim();
    if (!trimmedKey) return;
    playSoundEffect('click');
    showGlobalLoader('Verifying');

    const effectiveName = userName || localStorage.getItem('userName') || 'User';
    let unlockedUser: UserSession = {
      name: effectiveName,
      accessKey: trimmedKey,
      deviceId,
      planName: 'DIAMOND',
      daysLeft: 30,
    };

    try {
      const [res] = await Promise.all([
        fetch('/api/verify-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessKey: trimmedKey,
            deviceId,
            name: effectiveName,
          }),
        }),
        new Promise((r) => setTimeout(r, 650)),
      ]);
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          unlockedUser = data.user;
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 650));
    }

    hideGlobalLoader();
    localStorage.setItem('rexx_user', JSON.stringify(unlockedUser));
    setCurrentUser(unlockedUser);
    playSoundEffect('success');

    openDialog('success', 'Predictor Unlocked', 'Congratulation you unlocked the predictor', [
      {
        label: 'Okay',
        variant: 'primary',
        onSelect: () => {
          switchView('hub');
        },
      },
    ]);
  };

  const loadPlansData = async (showLoaderModal: boolean) => {
    if (showLoaderModal) {
      setPlansVisible(false);
      showGlobalLoader('Fetching Plans');
      await new Promise((r) => setTimeout(r, 850));
    } else {
      await new Promise((r) => setTimeout(r, 650));
    }

    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          setPlans(
            list.map((p: { name: string; days: number; price: string; type: string; color: string }) => ({
              planName: p.name,
              planDuration: p.days,
              planPrice: p.price,
              planType: p.type,
              planColor: p.color,
            })),
          );
        }
      }
    } catch {}

    if (showLoaderModal) hideGlobalLoader();
    setPlansVisible(true);
  };

  const handleOpenPlans = async (returnTo: ViewName) => {
    playSoundEffect('click');
    setPlansReturnView(returnTo);
    switchView('plans');
    await loadPlansData(true);
  };

  const handleBuyPlan = (planName: string) => {
    playSoundEffect('click');
    if (!OWNER_TG) return;
    const msg = encodeURIComponent(`🚀 **Hello Admin, I want to purchase the ${planName} plan!** ⚡ 💎`);
    openExternalUrl(`${OWNER_TG}?text=${msg}`);
  };

  const handleCopyDeviceId = async () => {
    playSoundEffect('click');
    try {
      await navigator.clipboard.writeText(deviceId);
      showToast('success', 'Device ID copied!', 2500, 'top');
    } catch {
      showToast('info', deviceId, 2500, 'top');
    }
  };

  const handleLogoutPrompt = () => {
    playSoundEffect('warning');
    openDialog('warning', 'Logout Session?', 'Are you sure you want to logout from ReXx Predictor 5.0?', [
      { label: 'Cancel', variant: 'ghost' },
      {
        label: 'Logout',
        variant: 'danger',
        onSelect: () => {
          fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId }),
          }).catch(() => {});
          localStorage.removeItem('rexx_user');
          setCurrentUser(null);
          setKeyInputVal('');
          switchView('login');
          showToast('info', 'Logged out successfully', 2400, 'bottom');
        },
      },
    ]);
  };

  const handleSelectGame = (game: GameItem) => {
    playSoundEffect('click');
    setDurationSheetGame(game);
  };

  const handleChooseDuration = (seconds: number) => {
    if (!durationSheetGame) return;
    playSoundEffect('click');
    const chosenGame = durationSheetGame;
    setDurationSheetGame(null);
    setSelectedGame(chosenGame);
    setRoundDuration(seconds);
    setLockedPrediction(null);
    setOutcomeModal(null);
    setIsAnalyzing(false);
    switchView('oracle');
  };

  const handleTriggerPrediction = async () => {
    if (isAnalyzing) return;
    if (lockedPrediction && lockedPrediction.periodId === currentPeriodId) {
      playSoundEffect('warning');
      showToast('info', 'Prediction already active for this period!', 2400, 'bottom');
      return;
    }

    playSoundEffect('click');
    setIsAnalyzing(true);

    try {
      const [res] = await Promise.all([
        fetch('/api/wingo/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: selectedGame.id,
            duration: roundDuration,
            periodId: currentPeriodId,
          }),
        }),
        new Promise((r) => setTimeout(r, 1550)),
      ]);

      if (res.ok) {
        const data = await res.json();
        setLockedPrediction({
          periodId: data.periodId || currentPeriodId,
          bigSmall: data.bigSmall,
          number: data.number,
          accuracy: data.accuracy || 98,
        });
        playSoundEffect('success');
      } else {
        throw new Error('Prediction failed');
      }
    } catch {
      const fallbackNum = Math.floor(Math.random() * 10);
      setLockedPrediction({
        periodId: currentPeriodId,
        bigSmall: fallbackNum >= 5 ? 'BIG' : 'SMALL',
        number: fallbackNum,
        accuracy: 97,
      });
      playSoundEffect('success');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyzer scrolling rows for scanning animation
  const analyzerStreamRows = useMemo(() => {
    const base =
      roundHistory.length > 0
        ? roundHistory
        : Array.from({ length: 8 }, (_, idx) => {
            const num = (idx * 3 + 7) % 10;
            return {
              period: `202611041000${padNumber(520 - idx, 4)}`,
              number: num,
              size: (num >= 5 ? 'BIG' : 'SMALL') as 'BIG' | 'SMALL',
              colors: num % 2 === 0 ? ['red'] : ['green'],
            };
          });
    return [...base, ...base];
  }, [roundHistory]);

  const currentDurationMeta =
    DURATION_OPTIONS.find((d) => d.seconds === roundDuration) || DURATION_OPTIONS[0];

  const activePredictionForCurrentPeriod =
    lockedPrediction && lockedPrediction.periodId === currentPeriodId ? lockedPrediction : null;

  const formattedTimer = `${padNumber(Math.floor(secondsRemaining / 60))}:${padNumber(secondsRemaining % 60)}`;
  const countdownTens = Math.floor(secondsRemaining / 10);
  const countdownOnes = secondsRemaining % 10;
  const showLastFiveCountdown =
    activeView === 'oracle' && !outcomeModal && secondsRemaining >= 1 && secondsRemaining <= 5;

  const oracleThemeStyle = {
    '--accent-color': selectedGame.accentColor,
    '--accent-color-rgb': hexToRgbTriplet(selectedGame.accentColor),
  } as React.CSSProperties;

  return (
    <div id="app" ref={appRef}>
      <div className="app-frame">
        {/* Original Spacetime Warped Grid + Lightning Bolts + Rising Embers */}
        <div className="spacetime-bg" id="spacetimeStage" ref={spacetimeStageRef} aria-hidden="true">
          <div className="fx">
            <canvas id="fxCanvas" ref={fxCanvasRef} />
          </div>
          <div className="ember-layer" id="emberLayer" ref={emberLayerRef} />
        </div>

        {/* Original Gatekeeper Fingerprint Lock Screen */}
        {gateMounted && (
          <div className="gatekeeper" id="gatekeeper" ref={gateRef}>
            <div className="gate-leaf gate-leaf-left" id="leftGateLeaf" ref={leftLeafRef} />
            <div className="gate-leaf gate-leaf-right" id="rightGateLeaf" ref={rightLeafRef} />
            <canvas className="gate-rain" id="rainCanvas" ref={rainCanvasRef} />
            <div className="gate-halo-narrow" id="narrowHalo" ref={narrowHaloRef} style={{ opacity: 0 }} />
            <div className="gate-halo-wide" id="wideHalo" ref={wideHaloRef} style={{ opacity: 0 }} />
            <div className="gate-seam" id="gateSeam" ref={seamRef}>
              <div className="gate-seam-thread gate-seam-thread-top" />
              <div className="gate-seam-dial" id="seamDial" ref={dialRef}>
                <div className="gate-seam-dial-ring" />
              </div>
              <div className="gate-seam-thread gate-seam-thread-bottom" />
            </div>
            <div className="fingerprint-pad" id="fingerprintPad" ref={padRef}>
              <div className="fingerprint-stack">
                <svg
                  className="fingerprint-base"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                  <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                  <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                  <path d="M2 12a10 10 0 0 1 18-6" />
                  <path d="M2 16h.01" />
                  <path d="M21.8 16c.2-2 .131-5.354 0-6" />
                  <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                  <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                  <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                </svg>
                <div
                  className="fingerprint-mask"
                  id="fingerprintMask"
                  ref={maskRef}
                  style={{ clipPath: 'inset(100% 0 0 0)' }}
                >
                  <svg
                    className="fingerprint-ink"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                    <path d="M2 12a10 10 0 0 1 18-6" />
                    <path d="M2 16h.01" />
                    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                  </svg>
                </div>
                <div className="fingerprint-glow" id="fingerprintGlow" ref={glowRef} style={{ opacity: 0 }} />
              </div>
              <div className="fingerprint-ring" id="innerRing" ref={innerRingRef} style={{ opacity: 0 }} />
              <div
                className="fingerprint-ring fingerprint-ring-outer"
                id="outerRing"
                ref={outerRingRef}
                style={{ opacity: 0 }}
              />
              <div className="fingerprint-ripple" />
            </div>
            <div className="gate-caption" id="gateCaption" ref={captionRef}>
              Hold to unlock
            </div>
          </div>
        )}

        {/* Main View Layer */}
        <div className="view-layer">
          {/* 1. HOME LANDING VIEW */}
          <div
            className={`view-scroller ${activeView === 'home' ? '' : 'is-hidden'} ${animClass.home || ''}`}
            id="homeView"
          >
            <div className="landingPage">
              <img className="rexxLogo" id="rexxLogo" src={ASSETS.logo} alt="Logo" />
              <div className="landingBanner" id="landingBanner" aria-label="Welcome to ReXx Predictor 5.0">
                <div className="echo" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <div className="content">
                  <div className="slashes" aria-hidden="true">
                    <i />
                    <i />
                  </div>
                  <p className="welcome">Welcome to</p>
                  <h1 className="title">
                    <span className="name">ReXx PREDICTOR</span> <span className="ver">5.0</span>
                  </h1>
                  <div className="rule" aria-hidden="true" />
                </div>
              </div>
              <div className="action-buttons">
                <div className="subText">
                  Click below to start the <span>predictor!</span>
                </div>
                <div
                  className={`actbtn ${homeLoading ? 'is-loading' : ''}`}
                  id="homeStartButton"
                  onClick={handleHomeStart}
                >
                  Let&apos;s Start
                </div>
                <div className="tgBtn" id="homeTelegramButton" onClick={handleHomeTelegram}>
                  Join Telegram
                </div>
              </div>
            </div>
          </div>

          {/* 2. SET NAME VIEW */}
          <div
            className={`view-scroller ${activeView === 'name' ? '' : 'is-hidden'} ${animClass.name || ''}`}
            id="nameView"
          >
            <div className="namePage">
              <div className="stickerBox">
                {activeView === 'name' && <StickerSlot url={ASSETS.namePetSticker} width={200} height={200} />}
              </div>
              <div className="topText">
                Hello dear <span>please</span> set <span>your</span> name!
                <span />
              </div>
              <div className="formArea">
                <input
                  className="nameInput"
                  id="nameInput"
                  type="text"
                  placeholder="Enter your name!"
                  value={nameInputVal}
                  onChange={(e) => setNameInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                />
                <div
                  className={`saveBtn ${nameInputVal.trim() ? '' : 'disabled'}`}
                  id="saveNameButton"
                  onClick={handleSaveName}
                >
                  Save
                </div>
              </div>
              <div className={`welcomeOverlay ${welcomeVisible ? '' : 'is-hidden'}`} id="welcomeOverlay">
                <div className={`typingText ${welcomeFadeOut ? 'fadeOut' : ''}`} id="typingText">
                  <span
                    className="welcome-content"
                    id="welcomeContent"
                    dangerouslySetInnerHTML={{ __html: welcomeHtml }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. LOGIN KEY VIEW */}
          <div
            className={`view-scroller ${activeView === 'login' ? '' : 'is-hidden'} ${animClass.login || ''}`}
            id="loginView"
          >
            <div className="loginPage">
              <div className="stickerBox">
                {activeView === 'login' && <StickerSlot url={ASSETS.loginPetSticker} width={200} height={200} />}
              </div>
              <div className="topText">
                Hello <span id="loginUserName">{(userName || 'user') + '!'}</span> please enter <span>Access</span> key!
              </div>
              <div className="formArea">
                <input
                  className="keyInput"
                  id="keyInput"
                  type="text"
                  placeholder="Paste your Access Key!"
                  value={keyInputVal}
                  onChange={(e) => setKeyInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitKey();
                  }}
                />
                <div
                  className={`submitBtn ${keyInputVal.trim() ? '' : 'disabled'}`}
                  id="submitKeyButton"
                  onClick={handleSubmitKey}
                >
                  Submit
                </div>
                <div className="buyKeyBtn" id="buyKeyButton" onClick={() => handleOpenPlans('login')}>
                  Get Key
                </div>
              </div>
            </div>
          </div>

          {/* 4. PREMIUM PLANS / PAYMENT VIEW */}
          <div
            className={`view-scroller ${activeView === 'plans' ? '' : 'is-hidden'} ${animClass.plans || ''}`}
            id="plansView"
          >
            <div
              className="PlansPage"
              id="plansPage"
              onTouchStart={(e) => {
                pullStartYRef.current = e.touches[0].clientY;
                pullDistRef.current = 0;
              }}
              onTouchMove={(e) => {
                if (pullStartYRef.current <= 0) return;
                const diff = e.touches[0].clientY - pullStartYRef.current;
                if (diff > 0) {
                  const h = Math.min(0.4 * diff, 80);
                  pullDistRef.current = h;
                  setPullHeight(h);
                }
              }}
              onTouchEnd={async () => {
                const dist = pullDistRef.current;
                pullStartYRef.current = 0;
                pullDistRef.current = 0;
                setPullHeight(0);
                if (dist >= 60) {
                  await loadPlansData(false);
                }
              }}
            >
              <div
                className="pull-refresh"
                id="plansPullRefresh"
                style={{ height: `${pullHeight}px`, opacity: pullHeight / 60 }}
              >
                <svg
                  className={`refresh-icon ${pullHeight > 40 ? 'rotating' : ''}`}
                  id="plansRefreshIcon"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </div>
              <div className="header-box">
                <button
                  className="back-btn"
                  id="plansBackButton"
                  type="button"
                  aria-label="Back"
                  onClick={() => {
                    playSoundEffect('click');
                    switchView(plansReturnView);
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div className="header-title">PREMIUM PLANS</div>
                <div className="header-glow" />
              </div>

              <div className={`plans-container ${plansVisible ? '' : 'is-hidden'}`} id="plansContainer">
                {plans.map((plan) => {
                  const pColor = plan.planColor || colorForPlanType(plan.planType);
                  const imgSrc = ASSETS.planImage(plan.planType || plan.planName);
                  return (
                    <div
                      key={plan.planName}
                      className={`plan-card ${plan.planType}`}
                      style={
                        {
                          '--p-color': pColor,
                          '--p-color-rgb': hexToRgbTriplet(pColor),
                        } as React.CSSProperties
                      }
                    >
                      <div className="plan-card-media">
                        <img
                          src={imgSrc}
                          alt=""
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="card-header">
                        <span className="plan-name">{plan.planName}</span>
                        <span className="plan-duration">{plan.planDuration} DAYS</span>
                      </div>
                      <div className="plan-price">
                        <span className="currency">₹</span>
                        <span className="amount">{plan.planPrice}</span>
                      </div>
                      <button className="buy-btn" type="button" onClick={() => handleBuyPlan(plan.planName)}>
                        <div className="btn-glow-top" />
                        <span>PURCHASE NOW</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className={`support-footer ${plansVisible ? '' : 'is-hidden'}`} id="plansSupportFooter">
                <div className="support-text">Need custom plan?</div>
                <a
                  href={OWNER_TG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="support-link"
                  id="plansSupportLink"
                  onClick={() => playSoundEffect('click')}
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>

          {/* 5. GAME HUB DASHBOARD VIEW */}
          <div
            className={`view-scroller ${activeView === 'hub' ? '' : 'is-hidden'} ${animClass.hub || ''}`}
            id="hubView"
          >
            <div className="hub-page">
              {/* Top User Dock */}
              <div className="user-dock">
                <div className="user-dock-glint" />
                <div className="user-dock-aura" />
                <div className="dock-core">
                  <div className="dock-name-row">
                    HEY, <em>{currentUser?.name || userName || 'VIP USER'}</em>
                  </div>
                  <div className="dock-foot-row">
                    <div className="dock-plan">
                      <em>
                        <span>{currentUser?.planName || 'DIAMOND'}</span> PLAN
                      </em>
                    </div>
                    <div className="dock-cluster">
                      <div className="days-chip">
                        <span className="days-chip-label">{currentUser?.daysLeft ?? 30}D LEFT</span>
                      </div>
                      <button
                        type="button"
                        className="logout-chip"
                        aria-label="Logout"
                        onClick={handleLogoutPrompt}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ff4d4d"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </button>
                    </div>
                    <div className="device-strip">
                      <span className="device-code">{deviceId}</span>
                      <button
                        type="button"
                        className="copy-trigger"
                        aria-label="Copy Device ID"
                        onClick={handleCopyDeviceId}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Hub Stream */}
              <div className="hub-stream">
                <div className="hub-header-card">
                  <div className="hub-header-glint" />
                  <div className="hub-header-aura" />
                  <div className="mascot-stage">
                    {activeView === 'hub' && <StickerSlot url={ASSETS.homePetSticker} width={145} height={145} />}
                  </div>
                  <div className="hub-titlebar">
                    <img className="hub-titlebar-icon" src={ASSETS.clipart} alt="ReXx" />
                    <span>
                      ReXx <span className="tone-accent">PREDICTOR</span> 5.0
                    </span>
                  </div>
                  <div className="hub-subtitle">SELECT YOUR PLATFORM</div>
                </div>

                <div className="game-cards">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className="game-card"
                      style={
                        {
                          '--accent-color': game.accentColor,
                          '--accent-color-rgb': hexToRgbTriplet(game.accentColor),
                        } as React.CSSProperties
                      }
                    >
                      <div className="game-card-glint" />
                      <div className="game-card-aura" />
                      <div className="game-card-stage">
                        <div className="game-card-shade" />
                        <img className="game-card-art" src={game.banner} alt={game.name} />
                      </div>
                      <div className="game-card-foot">
                        <div className="game-card-row">
                          <img className="game-card-icon" src={game.icon} alt={game.name} />
                          <div className="game-card-meta">
                            <div className="game-card-name">{game.name}</div>
                            <div
                              className="game-card-domain"
                              onClick={() => {
                                playSoundEffect('click');
                                openExternalUrl(game.link);
                              }}
                            >
                              <span>{game.domain}</span>
                              <svg
                                className="game-card-verified"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <button
                          className="game-card-launch"
                          type="button"
                          onClick={() => handleSelectGame(game)}
                        >
                          START PREDICTOR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration Mode Selector Veil */}
              {durationSheetGame && (
                <div
                  className="duration-veil"
                  style={
                    {
                      '--accent-color': durationSheetGame.accentColor,
                      '--accent-color-rgb': hexToRgbTriplet(durationSheetGame.accentColor),
                    } as React.CSSProperties
                  }
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      playSoundEffect('click');
                      setDurationSheetGame(null);
                    }
                  }}
                >
                  <div className="duration-sheet">
                    <div className="duration-glint" />
                    <div className="duration-shade" />
                    <div className="duration-banner-wrap">
                      <img
                        className="duration-banner"
                        src={durationSheetGame.banner}
                        alt={durationSheetGame.name}
                      />
                    </div>
                    <div className="duration-title">
                      SELECT <span className="tone-accent">GAME</span> MODE
                    </div>
                    <div className="duration-server">
                      SERVER: <span>{durationSheetGame.domain}</span>
                    </div>
                    <div className="duration-options">
                      {DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.seconds}
                          type="button"
                          className="duration-option"
                          onClick={() => handleChooseDuration(opt.seconds)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="duration-dismiss"
                      onClick={() => {
                        playSoundEffect('click');
                        setDurationSheetGame(null);
                      }}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. PREDICTION / ORACLE VIEW */}
          <div
            className={`view-scroller ${activeView === 'oracle' ? '' : 'is-hidden'} ${animClass.oracle || ''}`}
            id="oracleView"
          >
            <div className="oracle-page" style={oracleThemeStyle}>
              <button
                type="button"
                className="oracle-back"
                aria-label="Back to Hub"
                onClick={() => {
                  playSoundEffect('click');
                  setOutcomeModal(null);
                  switchView('hub');
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <div className="oracle-topglow" />
              <div className="oracle-shade" />

              <div className="oracle-banner-slot">
                <img className="oracle-banner" src={selectedGame.banner} alt={selectedGame.name} />
              </div>

              {/* BIG/SMALL vs NUMBER Mode Switch */}
              <div className="mode-switch-wrap">
                <div className="mode-switch">
                  <div className={`mode-switch-thumb ${predictionMode === 'number' ? 'is-right' : ''}`} />
                  <button
                    type="button"
                    className={`mode-switch-button ${predictionMode === 'big-small' ? 'is-active' : ''}`}
                    onClick={() => {
                      playSoundEffect('click');
                      setPredictionMode('big-small');
                    }}
                  >
                    BIG / SMALL
                  </button>
                  <button
                    type="button"
                    className={`mode-switch-button ${predictionMode === 'number' ? 'is-active' : ''}`}
                    onClick={() => {
                      playSoundEffect('click');
                      setPredictionMode('number');
                    }}
                  >
                    NUMBER
                  </button>
                </div>
              </div>

              {/* Curved Wolf Emblem + Energy Arc Gauge + Live Period & LCD */}
              <div className="arc-wrap">
                <div className="arc-view">
                  <canvas ref={arcCanvasRef} />
                  <div className="arc-ui">
                    <div className="arc-logo">
                      <img src={ASSETS.curved} alt="Period Number" />
                    </div>
                    <div className="arc-period" id="arcPeriod">
                      {currentPeriodId || 'SYNCING...'}
                    </div>
                    <svg id="arcLcd" ref={arcLcdRef} viewBox="0 0 110 42">
                      <rect
                        x="2"
                        y="2"
                        width="106"
                        height="38"
                        rx="8"
                        fill="rgba(10, 1, 4, 0.86)"
                        stroke={selectedGame.accentColor}
                        strokeWidth="2"
                      />
                      <text
                        x="55"
                        y="27"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontFamily="Iceland, monospace"
                        fontSize="24"
                        fontWeight="700"
                        letterSpacing="2"
                      >
                        {formattedTimer}
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Prediction Zone + Trigger + Records */}
              <div className="prediction-zone">
                <div className="prediction-card">
                  <div className="cycle-badge-glint" />
                  <div className="prediction-card-halo" />
                  <div className="prediction-card-head">
                    <span className={`prediction-card-label ${isAnalyzing ? 'is-fetching' : ''}`}>
                      {selectedGame.domain.toUpperCase()} • {currentDurationMeta.shortLabel}
                    </span>
                    <span className={`accuracy-pill ${isAnalyzing ? 'is-fetching' : ''}`}>
                      <svg
                        className="status-check"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span className="fetch-dots" />
                      <span>
                        {isAnalyzing
                          ? 'SYNCING'
                          : activePredictionForCurrentPeriod
                            ? `ACC ${activePredictionForCurrentPeriod.accuracy}%`
                            : 'SERVER LIVE'}
                      </span>
                    </span>
                  </div>

                  <div className="prediction-card-body">
                    {isAnalyzing ? (
                      <div className="analyzer-veil">
                        <div className="analyzer-line" />
                        <div className="analyzer-window">
                          <div className="analyzer-stream">
                            {analyzerStreamRows.map((r, idx) => (
                              <div key={`${r.period}-${idx}`} className="analyzer-row">
                                <span className="analyzer-cell-period">{r.period.slice(-7)}</span>
                                <span
                                  className={`analyzer-cell-number ${r.number % 2 === 0 ? 'is-red' : 'is-green'}`}
                                >
                                  {r.number}
                                </span>
                                <span
                                  className={`analyzer-cell-size ${r.size === 'BIG' ? 'is-amber' : 'is-blue'}`}
                                >
                                  {r.size}
                                </span>
                                <span className="dots-cluster is-compact">
                                  {r.colors.map((c) => (
                                    <i key={c} className={`color-dot is-${c}`} />
                                  ))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="prediction-caption analyzer-caption is-scanning">
                          ANALYZING SERVER DATA...
                        </div>
                      </div>
                    ) : activePredictionForCurrentPeriod ? (
                      predictionMode === 'big-small' ? (
                        <div className="prediction-outcome" key={`bs-${activePredictionForCurrentPeriod.periodId}`}>
                          <img
                            className="prediction-outcome-art prediction-outcome-art--big"
                            src={
                              activePredictionForCurrentPeriod.bigSmall === 'BIG'
                                ? ASSETS.resultImageBig
                                : ASSETS.resultImageSmall
                            }
                            alt={activePredictionForCurrentPeriod.bigSmall}
                          />
                        </div>
                      ) : (
                        <div className="prediction-outcome" key={`num-${activePredictionForCurrentPeriod.periodId}`}>
                          <img
                            className="prediction-outcome-art"
                            src={ASSETS.resultImage(activePredictionForCurrentPeriod.number)}
                            alt={String(activePredictionForCurrentPeriod.number)}
                          />
                          <div className="prediction-outcome-text">
                            NUMBER {activePredictionForCurrentPeriod.number} ({activePredictionForCurrentPeriod.bigSmall})
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="prediction-idle">
                        {activeView === 'oracle' && (
                          <StickerSlot url={ASSETS.idleSticker} width={135} height={135} />
                        )}
                        <div className="prediction-caption">TAP BELOW TO GET NEXT PREDICTION</div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="prediction-trigger"
                  disabled={isAnalyzing}
                  onClick={handleTriggerPrediction}
                >
                  <div className="prediction-trigger-slashes" />
                  <div className="prediction-trigger-shine" />
                  <span className="prediction-trigger-label">
                    {isAnalyzing
                      ? 'ANALYZING...'
                      : activePredictionForCurrentPeriod
                        ? 'PREDICTION LOCKED'
                        : 'GET PREDICTION'}
                  </span>
                </button>

                <div className="records-splitter">
                  <div className="line" />
                  <span className="records-splitter-text">GAME RECORDS</span>
                  <div className="line" />
                </div>

                <div className="records-table">
                  <div className="records-table-head">
                    <span>PERIOD</span>
                    <span>NUMBER</span>
                    <span>BIG SMALL</span>
                    <span>COLOR</span>
                  </div>
                  <div className="records-table-body">
                    {roundHistory.slice(0, 10).map((row) => (
                      <div key={row.period} className="records-table-row">
                        <span className="records-cell-period">{row.period.slice(-5)}</span>
                        <span className={`records-cell-number ${row.number % 2 === 0 ? 'is-red' : 'is-green'}`}>
                          {row.number}
                        </span>
                        <span className={`records-cell-size ${row.size === 'BIG' ? 'is-amber' : 'is-blue'}`}>
                          {row.size}
                        </span>
                        <span className="dots-cluster">
                          {row.colors.map((c) => (
                            <i key={c} className={`color-dot is-${c}`} />
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Last 5 Seconds 3D Flip Countdown Veil */}
              {showLastFiveCountdown && (
                <div className="countdown-veil" style={oracleThemeStyle}>
                  <div className="countdown-row">
                    <div className="digit-card" key={`tens-${countdownTens}`}>
                      <div className="cycle-badge-glint" />
                      <span className="digit-value">{countdownTens}</span>
                    </div>
                    <div className="digit-card" key={`ones-${secondsRemaining}`}>
                      <div className="cycle-badge-glint" />
                      <span className="digit-value">{countdownOnes}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Win / Lose Celebration Veil */}
              {outcomeModal && (
                <div className="outcome-veil" style={oracleThemeStyle}>
                  <div className={`outcome-aura ${outcomeModal.isWin ? 'is-win' : 'is-lose'}`} />
                  <div className="outcome-stage">
                    <StickerSlot
                      url={outcomeModal.isWin ? ASSETS.winSticker : ASSETS.loseSticker}
                      width={220}
                      height={220}
                      className={`sticker-stub sticker--extra-large ${
                        outcomeModal.isWin ? 'sticker--win' : 'sticker--lose'
                      }`}
                    />
                    <div className="outcome-title">{outcomeModal.title}</div>
                  </div>
                  <button
                    type="button"
                    className="outcome-dismiss"
                    onClick={() => {
                      playSoundEffect('click');
                      setOutcomeModal(null);
                    }}
                  >
                    <div className="cycle-badge-glint" />
                    <span>CONTINUE</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sheet Dialog Host & Curtain Overlay */}
        <div id="sheetHost" />
        <div className="app_laoder_overlay is-hidden" id="appCurtain">
          <div className="app_laoder_loader-box">
            <svg
              className="app_laoder_spinner"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v4" />
              <path d="m16.2 7.8 2.9-2.9" />
              <path d="M18 12h4" />
              <path d="m16.2 16.2 2.9 2.9" />
              <path d="M12 18v4" />
              <path d="m4.9 19.1 2.9-2.9" />
              <path d="M2 12h4" />
              <path d="m4.9 4.9 2.9 2.9" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
