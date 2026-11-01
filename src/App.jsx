import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, MapPin, Compass, Navigation, Heart,
  Lock, Unlock, Settings, Check, X, Car, Clock,
  Send, Layers, Info, ArrowLeft, Copy, Gauge, Mountain,
} from 'lucide-react';
import Studio from './Studio.jsx';
import { deleteVideo, useReelSrc } from './lib/videoStore.js';

const IMG = {
  coast: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
  island: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  ruins: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
  castle: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
  terraces: 'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=800&q=80',
};

const VID = {
  cliffs: 'https://assets.mixkit.co/videos/preview/mixkit-drone-view-of-a-rocky-coast-and-cliffs-41551-large.mp4',
  waves: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-waves-crashing-on-the-rocks-42750-large.mp4',
  ruins: 'https://assets.mixkit.co/videos/preview/mixkit-ancient-ruins-of-an-amphitheater-43405-large.mp4',
};

const INITIAL_FLYTHROUGHS = [
  {
    id: 'lerici-castello',
    title: 'Castello di Lerici',
    category: 'Borghi Marinari',
    timeFromInn: '14 min',
    distance: '9.2 km',
    coordinates: '44.0761, 9.9114',
    altitudePeak: '320 m',
    speed: '48 km/h',
    bestTime: '18:30 (Tramonto su Portovenere)',
    parkingTip: 'Parcheggio Vallata (navetta per il centro)',
    description:
      'Volo a picco sul promontorio roccioso che chiude il Golfo dei Poeti. Partenza dalla campagna di Ameglia, sorvolo delle insenature di Fiascherino e virata a 360° attorno alla fortezza pisano-genovese.',
    waypoints: ['Decollo Locanda (Ameglia)', 'Foce del Magra', 'Scogliere di Tellaro', 'Orbita Castello Lerici'],
    thumbnail: IMG.coast,
    videoUrl: VID.cliffs,
    duration: 18,
    badge: 'Consigliato al Tramonto',
  },
  {
    id: 'portovenere-palmaria',
    title: 'Porto Venere & Palmaria',
    category: 'Isole & Falesie',
    timeFromInn: '35 min',
    distance: '24.5 km',
    coordinates: '44.0500, 9.8333',
    altitudePeak: '450 m',
    speed: '58 km/h',
    bestTime: "11:00 (Luce zenitale per l'acqua cristallina)",
    parkingTip: 'Parcheggio Cavo o traghetto da Bocca di Magra',
    description:
      "La maestosa Chiesa di San Pietro a picco sulla falesia. Il volo simula il passaggio nello stretto delle Bocche tra la terraferma e l'Isola Palmaria, virando sulla Grotta di Byron.",
    waypoints: ['Decollo Locanda', 'Attraversamento Golfo', 'Chiesa San Pietro', 'Falesie Palmaria'],
    thumbnail: IMG.island,
    videoUrl: VID.waves,
    duration: 22,
    badge: 'Patrimonio UNESCO',
  },
  {
    id: 'luni-archeologia',
    title: 'Anfiteatro Romano di Luni',
    category: 'Archeologia',
    timeFromInn: '6 min',
    distance: '3.8 km',
    coordinates: '44.0645, 10.0432',
    altitudePeak: '180 m',
    speed: '36 km/h',
    bestTime: 'Mattino presto (Apertura Museo)',
    parkingTip: 'Parcheggio dedicato fronte museo archeologico',
    description:
      "A pochissimi minuti dalla Locanda, l'antica colonia marittima romana da cui partivano i marmi apuani per Roma. Sorvolo geometrico dell'anfiteatro ellittico e dell'antico decumano.",
    waypoints: ['Decollo Locanda', 'Canale Lunense', 'Anfiteatro Romano', 'Tempio di Diana'],
    thumbnail: IMG.ruins,
    videoUrl: VID.ruins,
    duration: 15,
    badge: 'A 5 Minuti',
  },
  {
    id: 'montemarcello-tellaro',
    title: 'Borgo di Tellaro & Montemarcello',
    category: 'Borghi Marinari',
    timeFromInn: '16 min',
    distance: '10.5 km',
    coordinates: '44.0592, 9.9297',
    altitudePeak: '260 m',
    speed: '40 km/h',
    bestTime: 'Tardo pomeriggio per aperitivo sul molo',
    parkingTip: 'Parcheggio a monte con scalinata panoramica',
    description:
      "Uno dei borghi più belli d'Italia incastonato nella roccia. Il volo parte dai boschi di pini del Monte Caprione e scende ripido fino alla chiesetta rosa di San Giorgio bagnata dai flutti.",
    waypoints: ['Decollo Locanda', 'Parco Montemarcello', 'Sentiero delle Falesie', 'Porticciolo di Tellaro'],
    thumbnail: IMG.coast,
    videoUrl: VID.cliffs,
    duration: 19,
    badge: 'Borgo Nascosto',
  },
  {
    id: 'sarzanello-fortezza',
    title: 'Fortezza di Sarzanello',
    category: 'Castelli & Storia',
    timeFromInn: '12 min',
    distance: '7.5 km',
    coordinates: '44.1167, 9.9708',
    altitudePeak: '290 m',
    speed: '45 km/h',
    bestTime: '17:00 (Vista limpida verso le Alpi Apuane)',
    parkingTip: 'Spiazzo gratuito sotto la rocca',
    description:
      'Il capolavoro di ingegneria militare medievale e rinascimentale di Castruccio Castracani. Salita rapida dalla piana del Magra con visuale a 360° sulla Val di Magra fino al mare.',
    waypoints: ['Decollo Locanda', 'Fiume Magra', 'Cittadella di Sarzana', 'Fortezza Sarzanello'],
    thumbnail: IMG.castle,
    videoUrl: VID.ruins,
    duration: 17,
    badge: 'Panorama Storico',
  },
  {
    id: 'vernazza-cinqueterre',
    title: 'Cinque Terre: Vernazza',
    category: 'Cinque Terre',
    timeFromInn: '45 min',
    distance: '32.0 km',
    coordinates: '44.1353, 9.6833',
    altitudePeak: '520 m',
    speed: '62 km/h',
    bestTime: 'Consigliato in treno da Sarzana o battello',
    parkingTip: "Lasciare l'auto e prendere il 5 Terre Express",
    description:
      'Il gioiello delle Cinque Terre con il castello Doria e la baia naturale. Il volo simula la discesa dai vigneti verticali terrazzati fino allo specchio d\'acqua.',
    waypoints: ['Decollo Locanda', 'Crinale Ligure', 'Vigneti Terrazzati', 'Torre Doria Vernazza'],
    thumbnail: IMG.terraces,
    videoUrl: VID.waves,
    duration: 24,
    badge: 'Icona Mondiale',
  },
];

const CATEGORIES = ['Tutti', 'Borghi Marinari', 'Castelli & Storia', 'Cinque Terre', 'Archeologia', 'Isole & Falesie'];
const STUDIO_PASSWORDS = ['angelo', 'locanda2026'];

// ---------- helpers ----------
const num = (s, fallback = 0) => {
  const n = parseFloat(String(s).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

const formatMinutes = (total) => {
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function mapsUrl(coords) {
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(coords)}`;
}

export default function App() {
  const [flythroughs, setFlythroughs] = useState(() => {
    const saved = loadJSON('locanda_flythroughs', null);
    return Array.isArray(saved) && saved.length ? saved : INITIAL_FLYTHROUGHS;
  });
  const [favorites, setFavorites] = useState(() => loadJSON('locanda_favorites', []));

  const [currentIdx, setCurrentIdx] = useState(0);
  const [viewMode, setViewMode] = useState('catalog');
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('locanda_staff_auth') === 'true'
  );

  const videoRef = useRef(null);
  const gesture = useRef({ x: 0, y: 0, pressed: false, timer: null, active: false });

  const safeIdx = Math.min(currentIdx, flythroughs.length - 1);
  const active = flythroughs[safeIdx] || flythroughs[0];
  const paused = !isPlaying || isPressing || showDrawer;
  const activeSrc = useReelSrc(active);

  // ---------- persistence ----------
  useEffect(() => {
    try { localStorage.setItem('locanda_flythroughs', JSON.stringify(flythroughs)); } catch { /* quota */ }
  }, [flythroughs]);

  useEffect(() => {
    try { localStorage.setItem('locanda_favorites', JSON.stringify(favorites)); } catch { /* quota */ }
  }, [favorites]);

  // ---------- navigation ----------
  const goTo = (idx) => {
    setProgress(0);
    setCurrentIdx((idx + flythroughs.length) % flythroughs.length);
  };
  const handleNext = () => goTo(safeIdx + 1);
  const handlePrev = () => goTo(safeIdx - 1);

  // ---------- progress bar ----------
  useEffect(() => {
    if (viewMode !== 'player' || paused || !active) return;
    const step = 100 / (active.duration * 10);
    const timer = setInterval(() => setProgress((p) => Math.min(100, p + step)), 100);
    return () => clearInterval(timer);
  }, [viewMode, paused, active]);

  useEffect(() => {
    if (progress >= 100) handleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // ---------- video play/pause sync ----------
  useEffect(() => {
    const v = videoRef.current;
    if (!v || viewMode !== 'player') return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, viewMode, activeSrc]);

  // ---------- montaggio non distruttivo (taglio, velocità) ----------
  useEffect(() => {
    if (viewMode !== 'player') return undefined;
    const ed = active?.edit;
    const apply = () => {
      const v = videoRef.current;
      if (!v) return;
      v.playbackRate = ed?.speed || 1;
      if (ed && ed.out > ed.in && (v.currentTime >= ed.out - 0.04 || v.currentTime < ed.in - 0.5)) {
        v.currentTime = ed.in;
      }
    };
    apply();
    const id = setInterval(apply, 80);
    return () => clearInterval(id);
  }, [viewMode, active, activeSrc]);

  // ---------- favorites ----------
  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openPlayerAt = (index) => {
    setCurrentIdx(index);
    setProgress(0);
    setIsPlaying(true);
    setViewMode('player');
  };

  const openMaps = (coords, e) => {
    if (e) e.stopPropagation();
    window.open(mapsUrl(coords), '_blank', 'noopener');
  };

  const savedItems = useMemo(
    () => flythroughs.filter((f) => favorites.includes(f.id)),
    [flythroughs, favorites]
  );

  const tourStats = useMemo(() => {
    const oneWay = savedItems.reduce((s, f) => s + num(f.timeFromInn), 0);
    const km = savedItems.reduce((s, f) => s + num(f.distance), 0);
    return { oneWay, roundTrip: oneWay * 2, km, kmRoundTrip: km * 2 };
  }, [savedItems]);

  const itineraryText = () => {
    let text = "*Il mio itinerario dalla Locanda dell'Angelo:*\n\n";
    savedItems.forEach((item, i) => {
      text += `${i + 1}. *${item.title}* (${item.timeFromInn} - ${item.distance})\n   💡 ${item.parkingTip}\n   📍 ${mapsUrl(item.coordinates)}\n\n`;
    });
    text += `🚗 Guida totale stimata (andata e ritorno dalla Locanda per ogni tappa): ${formatMinutes(tourStats.roundTrip)}\n`;
    text += "Punto di partenza: La Locanda dell'Angelo, Ameglia";
    return text;
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(itineraryText())}`, '_blank', 'noopener');
  };

  const copyItinerary = async () => {
    try {
      await navigator.clipboard.writeText(itineraryText());
    } catch {
      const ta = document.createElement('textarea');
      ta.value = itineraryText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // ---------- gestures (pointer events: touch + mouse, un solo percorso) ----------
  const onPointerDown = (e) => {
    if (e.target.closest('button, [data-interactive]')) {
      gesture.current.active = false;
      return;
    }
    const g = gesture.current;
    g.active = true;
    g.pressed = false;
    g.x = e.clientX;
    g.y = e.clientY;
    clearTimeout(g.timer);
    g.timer = setTimeout(() => {
      g.pressed = true;
      setIsPressing(true);
    }, 180);
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    clearTimeout(g.timer);
    setIsPressing(false);
    if (g.pressed) {
      g.pressed = false;
      return; // il long-press non deve cambiare clip
    }
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dy) > 50 && Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) handleNext(); else handlePrev();
    } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (e.clientX - rect.left < rect.width * 0.35) handlePrev(); else handleNext();
    }
  };

  const onPointerCancel = () => {
    const g = gesture.current;
    g.active = false;
    g.pressed = false;
    clearTimeout(g.timer);
    setIsPressing(false);
  };

  // ---------- staff area ----------
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const pwd = password.trim();
    if (STUDIO_PASSWORDS.includes(pwd.toLowerCase())) {
      setIsAuthenticated(true);
      sessionStorage.setItem('locanda_staff_auth', 'true');
      setAuthModalOpen(false);
      setPassword('');
      setAuthError(false);
      setViewMode('studio');
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('locanda_staff_auth');
    setViewMode('catalog');
  };

  const handleSaveReel = (reel) => {
    setFlythroughs((prev) =>
      prev.some((f) => f.id === reel.id)
        ? prev.map((f) => (f.id === reel.id ? { ...f, ...reel, badge: reel.badge ?? f.badge } : f))
        : [reel, ...prev]
    );
  };

  const deleteReel = (id) => {
    if (flythroughs.length <= 1) return;
    const victim = flythroughs.find((f) => f.id === id);
    if (!victim || !window.confirm(`Eliminare "${victim.title}"?`)) return;
    if (victim.videoBlobId) deleteVideo(victim.videoBlobId);
    setFlythroughs((prev) => prev.filter((f) => f.id !== id));
    setFavorites((prev) => prev.filter((x) => x !== id));
    setCurrentIdx(0);
  };

  const resetDefaults = () => {
    if (!window.confirm('Ripristinare i voli predefiniti? I voli aggiunti verranno rimossi.')) return;
    flythroughs.forEach((f) => { if (f.videoBlobId) deleteVideo(f.videoBlobId); });
    setFlythroughs(INITIAL_FLYTHROUGHS);
    setFavorites((prev) => prev.filter((id) => INITIAL_FLYTHROUGHS.some((f) => f.id === id)));
    setCurrentIdx(0);
  };

  const playReelById = (id) => {
    const idx = flythroughs.findIndex((f) => f.id === id);
    if (idx >= 0) openPlayerAt(idx);
  };

  const filteredCatalog =
    selectedCategory === 'Tutti' ? flythroughs : flythroughs.filter((f) => f.category === selectedCategory);

  // ---------- telemetria simulata ----------
  const clipT = (progress / 100) * active.duration;
  const fadeOpacity = Math.min(1, Math.max(0, 1 - clipT / 0.8, 1 - (active.duration - clipT) / 0.8));
  const peak = num(active.altitudePeak, 300);
  const cruise = num(active.speed, 45);
  const simAltitude = Math.round(
    progress < 30 ? 40 + (peak - 40) * (progress / 30) : peak - (peak - 80) * ((progress - 30) / 70)
  );
  const simSpeed = Math.round(cruise + Math.sin(progress / 8) * 4);
  const activeWp = Math.min(active.waypoints.length - 1, Math.floor((progress / 100) * active.waypoints.length));


  return (
    <div className="w-full h-[100dvh] bg-black flex justify-center">
      <div className="relative w-full max-w-md h-full bg-stone-950 text-stone-100 flex flex-col font-sans select-none overflow-hidden">

        {/* VISTA 1: CATALOGO */}
        {viewMode === 'catalog' && (
          <div className="flex-1 flex flex-col min-h-0 bg-stone-950">
            <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-stone-800/60 bg-stone-900/40 backdrop-blur-md">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80">Drone Concierge</p>
                <h1 className="text-lg font-serif tracking-wide text-amber-100 font-semibold">
                  La Locanda dell'Angelo
                </h1>
              </div>
              <button
                onClick={() => (isAuthenticated ? setViewMode('studio') : setAuthModalOpen(true))}
                className="p-2 rounded-full bg-stone-800/80 hover:bg-amber-950/60 border border-stone-700/60 text-stone-300 hover:text-amber-300 transition-colors"
                title="Locanda Studio (Staff)"
                aria-label="Locanda Studio (Staff)"
              >
                {isAuthenticated ? <Unlock className="text-amber-400" size={16} /> : <Lock size={15} />}
              </button>
            </header>

            <div className="px-4 py-2 border-b border-stone-800/40 bg-stone-950/70 overflow-x-auto flex gap-2 no-scrollbar shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20'
                      : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredCatalog.length === 0 && (
                <p className="text-center text-sm text-stone-500 pt-10">Nessun luogo in questa categoria.</p>
              )}
              {filteredCatalog.map((item) => {
                const originalIndex = flythroughs.findIndex((f) => f.id === item.id);
                const isFav = favorites.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => openPlayerAt(originalIndex)}
                    className="group relative rounded-2xl overflow-hidden bg-stone-900/90 border border-stone-800/80 shadow-lg hover:border-amber-500/50 transition-all cursor-pointer"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-stone-800 via-amber-950 to-stone-900">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />

                      <div className="absolute top-3 left-3 right-14 flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-[10px] uppercase font-bold tracking-wider text-amber-300 border border-amber-500/30">
                          {item.category}
                        </span>
                        {item.badge && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-[10px] font-bold text-stone-950">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        aria-label={isFav ? 'Rimuovi dai salvati' : 'Salva'}
                        className="absolute top-3 right-3 p-2 rounded-full bg-stone-950/70 backdrop-blur-md text-stone-300 hover:text-rose-400 border border-stone-700/60 transition-colors"
                      >
                        <Heart
                          size={16}
                          className={isFav ? 'fill-rose-500 text-rose-500' : ''}
                        />
                      </button>

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <h3 className="text-lg font-serif font-bold text-white leading-tight drop-shadow-md">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-amber-200/90 mt-1">
                            <span className="flex items-center gap-1 font-medium bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                              <Clock className="text-amber-400" size={12} />
                              {item.timeFromInn}
                            </span>
                            <span className="flex items-center gap-1 font-medium bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                              <Car className="text-amber-400" size={12} />
                              {item.distance}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pl-3 pr-3.5 h-10 rounded-full bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform text-xs font-bold whitespace-nowrap">
                          <Play className="fill-current" size={15} />
                          Volo Drone
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-stone-900 flex flex-col gap-2.5">
                      <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">{item.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-xs gap-2">
                        <div className="flex items-center gap-1.5 text-stone-400 min-w-0">
                          <MapPin className="text-amber-400 shrink-0" size={13} />
                          <span className="truncate text-[11px]">{item.parkingTip}</span>
                        </div>
                        <button
                          onClick={(e) => openMaps(item.coordinates, e)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline shrink-0"
                        >
                          <Navigation size={12} />
                          Mappa GPS
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA 2: PLAYER REEL 9:16 */}
        {viewMode === 'player' && (
          <div
            className="relative flex-1 min-h-0 flex flex-col w-full overflow-hidden bg-black"
            style={{ touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-amber-950 to-stone-950 overflow-hidden">
              <video
                key={activeSrc || active.id}
                ref={videoRef}
                src={activeSrc || undefined}
                poster={active.thumbnail}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => {
                  const ed = active.edit;
                  e.currentTarget.playbackRate = ed?.speed || 1;
                  if (ed && ed.out > ed.in) e.currentTarget.currentTime = ed.in;
                }}
                className={`w-full h-full object-cover brightness-[0.82] transition-opacity duration-300 ${
                  isPressing ? 'opacity-80' : 'opacity-100'
                }`}
              />
              {active.edit?.fade && (
                <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: fadeOpacity }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/90 pointer-events-none" />
            </div>

            {/* Scrub bar segmentata */}
            <div className="relative z-30 pt-3 px-3 flex gap-1.5 w-full">
              {flythroughs.map((fly, idx) => {
                const fill = idx < safeIdx ? 100 : idx === safeIdx ? progress : 0;
                return (
                  <button
                    key={fly.id}
                    onClick={() => goTo(idx)}
                    aria-label={`Vai a ${fly.title}`}
                    className="flex-1 py-2 -my-2 cursor-pointer"
                  >
                    <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full"
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="relative z-30 px-4 py-2.5 flex items-center justify-between">
              <button
                onClick={() => setViewMode('catalog')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-700/60 text-xs font-semibold text-stone-200 hover:text-white"
              >
                <ArrowLeft className="text-amber-400" size={14} />
                Tutte le Schede
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
                className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-stone-300 hover:text-white border border-stone-700/60"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>

            {/* Telemetria di volo */}
            <div className="relative z-20 px-4 flex gap-2 font-mono text-[10px] text-amber-300 pointer-events-none">
              <span className="px-2 py-1 rounded-md bg-black/55 backdrop-blur-md border border-amber-500/30 flex items-center gap-1">
                <Mountain size={11} className="text-amber-400" /> ALT {simAltitude} m
              </span>
              <span className="px-2 py-1 rounded-md bg-black/55 backdrop-blur-md border border-amber-500/30 flex items-center gap-1">
                <Gauge size={11} className="text-amber-400" /> {simSpeed} km/h
              </span>
              <span className="px-2 py-1 rounded-md bg-black/55 backdrop-blur-md border border-amber-500/30 flex items-center gap-1">
                <Compass size={11} className="text-amber-400" /> WP {activeWp + 1}/{active.waypoints.length}
              </span>
            </div>

            {(isPressing || !isPlaying) && (
              <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] uppercase tracking-wider shadow-lg pointer-events-none">
                {isPressing ? 'Pausa (tieni premuto)' : 'In pausa'}
              </div>
            )}

            {/* Azioni laterali */}
            <div className="absolute right-3.5 bottom-28 z-30 flex flex-col items-center gap-4">
              <button onClick={(e) => toggleFavorite(active.id, e)} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-700/80 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Heart
                    size={22}
                    className={favorites.includes(active.id) ? 'fill-rose-500 text-rose-500' : 'text-white'}
                  />
                </div>
                <span className="text-[10px] text-stone-300 font-medium">Salva</span>
              </button>

              <button onClick={(e) => openMaps(active.coordinates, e)} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Navigation className="fill-current" size={22} />
                </div>
                <span className="text-[10px] text-amber-300 font-semibold">Portami</span>
              </button>

              <button onClick={() => setShowDrawer(true)} className="flex flex-col items-center gap-1 group">
                <div className="w-12 h-12 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-700/80 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform text-white">
                  <Info size={20} />
                </div>
                <span className="text-[10px] text-stone-300 font-medium">Consigli</span>
              </button>
            </div>

            {/* Didascalia */}
            <div className="absolute left-0 right-16 bottom-6 z-20 p-5 pointer-events-none">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-amber-500/90 text-stone-950 font-extrabold text-[10px] uppercase tracking-wider">
                  {active.category}
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                  <Car size={12} /> {active.timeFromInn} dalla Locanda
                </span>
              </div>

              <h2 className="text-2xl font-serif font-extrabold text-white leading-tight drop-shadow-md">
                {active.title}
              </h2>
              <p className="text-xs text-stone-200 mt-1 line-clamp-2 leading-relaxed drop-shadow">
                {active.description}
              </p>

              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
                {active.waypoints.map((wp, i) => (
                  <span
                    key={i}
                    className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap border ${
                      i === activeWp
                        ? 'bg-amber-400 text-stone-950 font-bold border-amber-300'
                        : 'bg-black/50 text-stone-300 border-white/20'
                    }`}
                  >
                    {i + 1}. {wp}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[9px] text-stone-400/80">Google Earth • Landsat / Copernicus</p>
            </div>
          </div>
        )}

        {/* VISTA 3: I MIEI SALVATI */}
        {viewMode === 'favorites' && (
          <div className="flex-1 flex flex-col min-h-0 bg-stone-950">
            <header className="px-5 py-4 border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md">
              <h2 className="text-lg font-serif font-bold text-amber-100">Il Tuo Itinerario</h2>
              <p className="text-xs text-stone-400">{savedItems.length} tappe salvate per il soggiorno</p>
            </header>

            {savedItems.length > 0 && (
              <div className="px-4 pt-4">
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30">
                  <div className="flex items-center gap-2 text-amber-200 text-sm font-semibold">
                    <Car size={16} className="text-amber-400" />
                    Guida totale stimata: {formatMinutes(tourStats.roundTrip)}
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                    Andata e ritorno dalla Locanda per ogni tappa ({formatMinutes(tourStats.oneWay)} solo andata ·{' '}
                    {tourStats.kmRoundTrip.toFixed(1)} km). Le tappe vicine si possono combinare nella stessa uscita.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={shareWhatsApp}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      <Send size={13} /> WhatsApp
                    </button>
                    <button
                      onClick={copyItinerary}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-semibold"
                    >
                      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {copied ? 'Copiato!' : 'Copia'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {savedItems.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-500">
                  <Heart className="mb-2 stroke-1 text-stone-600" size={36} />
                  <p className="text-sm">Non hai ancora salvato nessun volo.</p>
                  <p className="text-xs text-stone-600 mt-1">
                    Esplora la griglia o i Reel e tocca il cuore per comporre la tua giornata ideale.
                  </p>
                  <button
                    onClick={() => setViewMode('catalog')}
                    className="mt-4 px-4 py-2 rounded-full bg-amber-500 text-stone-950 text-xs font-bold"
                  >
                    Sfoglia i Luoghi
                  </button>
                </div>
              ) : (
                savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-xl bg-stone-900 border border-stone-800/80 items-center justify-between"
                  >
                    <img src={item.thumbnail} alt={item.title} loading="lazy" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{item.category}</span>
                      <h4 className="text-sm font-serif font-bold text-white truncate">{item.title}</h4>
                      <p className="text-xs text-stone-400 flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1"><Clock size={11} /> {item.timeFromInn}</span>
                        <span className="flex items-center gap-1"><Car size={11} /> {item.distance}</span>
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => openPlayerAt(flythroughs.findIndex((f) => f.id === item.id))}
                        aria-label="Guarda il volo"
                        className="p-2 rounded-full bg-amber-500 text-stone-950"
                      >
                        <Play className="fill-current ml-0.5" size={14} />
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(item.id, e)}
                        aria-label="Rimuovi"
                        className="p-2 rounded-full bg-stone-800 text-rose-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VISTA 4: LOCANDA STUDIO */}
        {viewMode === 'studio' && isAuthenticated && (
          <div className="flex-1 flex flex-col min-h-0 bg-stone-950 text-stone-200">
            <header className="px-5 py-3.5 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-amber-500/20 text-amber-400">
                  <Settings size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-serif font-bold text-white">Locanda Studio</h2>
                  <p className="text-[10px] text-amber-400/80">Gestione & Guida Voli Drone</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('catalog')}
                  className="px-3 py-1 rounded bg-stone-800 hover:bg-stone-700 text-xs font-medium"
                >
                  Chiudi
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded text-stone-400 hover:text-rose-400"
                  title="Disconnetti"
                  aria-label="Disconnetti"
                >
                  <Lock size={15} />
                </button>
              </div>
            </header>

            <Studio
              flythroughs={flythroughs}
              categories={CATEGORIES}
              fallbackThumb={IMG.coast}
              onSave={handleSaveReel}
              onDelete={deleteReel}
              onReset={resetDefaults}
              onPlay={playReelById}
            />
          </div>
        )}

        {/* BOTTOM SHEET CONSIGLI HOST */}
        {showDrawer && (
          <div
            onClick={() => setShowDrawer(false)}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-stone-900 border-t border-stone-700 rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto animate-slide-up"
            >
              <div className="w-12 h-1.5 rounded-full bg-stone-700 mx-auto mb-2" />

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{active.category}</span>
                  <h3 className="text-xl font-serif font-bold text-white">{active.title}</h3>
                </div>
                <button onClick={() => setShowDrawer(false)} aria-label="Chiudi" className="p-1.5 rounded-full bg-stone-800 text-stone-400">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[10px] text-stone-500 block mb-0.5">Tempo di Guida</span>
                  <p className="font-bold text-white flex items-center gap-1">
                    <Car className="text-amber-400 shrink-0" size={13} /> {active.timeFromInn} ({active.distance})
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <span className="text-[10px] text-stone-500 block mb-0.5">Momento Migliore</span>
                  <p className="font-bold text-white flex items-start gap-1">
                    <Clock className="text-amber-400 shrink-0 mt-0.5" size={13} /> {active.bestTime}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                  💡 Il Consiglio dell'Host per il Parcheggio
                </span>
                <p className="text-stone-300 leading-relaxed">{active.parkingTip}</p>
              </div>

              <button
                onClick={(e) => openMaps(active.coordinates, e)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Navigation className="fill-current" size={16} />
                Avvia Navigatore Google Maps
              </button>
            </div>
          </div>
        )}

        {/* MODALE PASSWORD STAFF */}
        {authModalOpen && (
          <div
            onClick={() => setAuthModalOpen(false)}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-2xl">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <Lock size={18} />
              </div>
              <h3 className="text-center font-serif font-bold text-white text-base">Area Riservata Staff</h3>
              <p className="text-center text-xs text-stone-400 mt-1 mb-4">Inserisci la password per accedere a Locanda Studio</p>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-white text-center text-sm outline-none focus:border-amber-500"
                  autoFocus
                />
                {authError && <p className="text-[11px] text-rose-400 text-center font-medium">Password non valida</p>}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setAuthModalOpen(false)} className="flex-1 py-2 rounded-lg bg-stone-800 text-stone-300 text-xs font-semibold">
                    Annulla
                  </button>
                  <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-500 text-stone-950 text-xs font-bold">
                    Accedi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NAVIGAZIONE INFERIORE */}
        <nav className="h-16 bg-stone-950/95 backdrop-blur-md border-t border-stone-800/80 flex items-center justify-around px-3 z-40 shrink-0 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={() => setViewMode('catalog')}
            className={`flex flex-col items-center gap-1 transition-colors ${viewMode === 'catalog' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
          >
            <Layers size={18} />
            <span className="text-[10px]">Esplora</span>
          </button>

          <button
            onClick={() => { setViewMode('player'); setIsPlaying(true); }}
            className={`flex flex-col items-center gap-1 transition-colors ${viewMode === 'player' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
          >
            <Play size={18} className={viewMode === 'player' ? 'fill-amber-400' : ''} />
            <span className="text-[10px]">Reel Voli</span>
          </button>

          <button
            onClick={() => setViewMode('favorites')}
            className={`relative flex flex-col items-center gap-1 transition-colors ${viewMode === 'favorites' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
          >
            <Heart size={18} className={viewMode === 'favorites' ? 'fill-amber-400' : ''} />
            <span className="text-[10px]">I Miei Salvati</span>
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-3 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setViewMode('studio')}
              className={`flex flex-col items-center gap-1 transition-colors ${viewMode === 'studio' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'}`}
            >
              <Settings size={18} />
              <span className="text-[10px]">Studio</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
