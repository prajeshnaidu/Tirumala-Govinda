"use client";

import { track as analyticsTrack } from "@vercel/analytics";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type YTPlayer = { playVideo: () => void; pauseVideo: () => void; stopVideo: () => void; seekTo: (seconds: number, allowSeekAhead: boolean) => void; getCurrentTime: () => number; getDuration: () => number; destroy: () => void };
type YTEvent = { data: number; target: YTPlayer };
type YTConstructor = new (element: HTMLElement, options: { videoId: string; playerVars?: Record<string, string | number>; events?: { onReady?: (event: YTEvent) => void; onStateChange?: (event: YTEvent) => void; onError?: (event: YTEvent) => void } }) => YTPlayer;

declare global { interface Window { YT?: { Player: YTConstructor; PlayerState: { ENDED: number; PLAYING: number; PAUSED: number } }; onYouTubeIframeAPIReady?: () => void; } }

export type Track = { id: string; title: string; artist: string; film: string; year: number; duration: number; videoId: string };

const makeTrack = (id: string, title: string): Track => ({ id, title, artist: "Add artist", film: "Add film", year: 0, duration: 0, videoId: "" });

// Titles are taken from the supplied Balaji Songs document. Other metadata and video IDs are not invented.
// Add only videos you are licensed/rightful to use, with embedding enabled.
const PLAYLISTS = [
  { id: "tirumala", name: "Tirumala Classics", tracks: [makeTrack("balaji-01", "Adivo Alladivo"), makeTrack("balaji-02", "Veyi Naamaala Vaada"), makeTrack("balaji-03", "Brahmam Okate"), makeTrack("balaji-04", "Akhilanda Koti"), makeTrack("balaji-05", "Kondalalo Nelakonna"), makeTrack("balaji-06", "Jaya Jaya Sree Venkataramana"), makeTrack("balaji-07", "Kaliyuga Vaikuntapuri"), makeTrack("balaji-08", "Brahma Kadigina Padamu"), makeTrack("balaji-09", "Govindha Hari Govindha")] },
  { id: "venkatesa", name: "Venkatesa Bhakti", tracks: [makeTrack("balaji-10", "Sriman Narayana"), makeTrack("balaji-11", "Kamaneeyam"), makeTrack("balaji-12", "Podagantimayya"), makeTrack("balaji-13", "Brahmanda Nayakuni Brahmotsavam"), makeTrack("balaji-14", "Nigama Nigamantha"), makeTrack("balaji-15", "Venkatachala Nilayam"), makeTrack("balaji-16", "Brahmothsava"), makeTrack("balaji-17", "Vinaro Bhagyamu Vishnu Katha")] },
  { id: "suprabhatam", name: "Morning & Suprabhatam", tracks: [makeTrack("balaji-18", "Adi Sesha Anantha Sayana Srinivasa"), makeTrack("balaji-19", "Thiruveedhula Merasi"), makeTrack("balaji-20", "Vedukondama Venkatagiri"), makeTrack("balaji-21", "Kalaganti Kalaganti"), makeTrack("balaji-22", "Sri Venkateswara Suprabhatam"), makeTrack("balaji-23", "Govinda Sritha"), makeTrack("balaji-24", "Shesha Sayanam Sheshadri Vaasa"), makeTrack("balaji-25", "Sri Venkatesa Suprabhatham — M. S. Subbulakshmi")] }
] as const;

function formatTime(value: number) { if (!Number.isFinite(value) || value < 0) return "0:00"; const s = Math.floor(value); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => { const media = window.matchMedia(query); const update = () => setMatches(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, [query]);
  return matches;
}

function SeekBar({ progress, duration, onSeek }: { progress: number; duration: number; onSeek: (ratio: number) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const value = duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0;
  const pointerSeek = (event: ReactPointerEvent<HTMLInputElement>) => { if (duration <= 0 || !ref.current) return; const r = ref.current.getBoundingClientRect(); onSeek(Math.min(1, Math.max(0, (event.clientX - r.left) / r.width))); };
  return <input ref={ref} aria-label="Seek" type="range" min="0" max="100" value={value} onPointerDown={pointerSeek} onChange={() => {}} className="seek-hit h-6 w-full cursor-pointer appearance-none bg-transparent accent-accent [&::-moz-range-track]:h-[3px] [&::-moz-range-track]:bg-white/15 [&::-moz-range-progress]:h-[3px] [&::-moz-range-progress]:bg-accent [&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:bg-white/15 [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-[13px] [&::-webkit-slider-thumb]:w-[13px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(242,184,75,.7)]" />;
}

function TransportButton({ label, onClick, children, className = "" }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return <button type="button" aria-label={label} onClick={onClick} className={`flex min-h-11 min-w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95 ${className}`}>{children}</button>;
}

function Vinyl({ playing, compact = false }: { playing: boolean; compact?: boolean }) {
  return <div className={`${compact ? "h-16 w-16" : "h-20 w-20"} pointer-events-none absolute inset-0 z-10 rounded-full border border-white/20`}><div className={`vinyl-spin absolute inset-0 rounded-full ${playing ? "[animation-play-state:running]" : "[animation-play-state:paused]"}`}><div className="absolute inset-2 rounded-full border border-white/10 bg-[radial-gradient(circle_at_center,transparent_0_10%,rgba(255,255,255,.09)_10.5%,transparent_11%,transparent_28%,rgba(255,255,255,.06)_28.5%,transparent_29%,transparent_47%,rgba(255,255,255,.05)_47.5%,transparent_48%)]" /></div><div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70 ring-2 ring-white/40" /></div>;
}

export default function MusicPlayer() {
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const playerRef = useRef<YTPlayer | null>(null);
  const desktopHostRef = useRef<HTMLDivElement>(null);
  const mobileHostRef = useRef<HTMLDivElement>(null);
  const apiReadyRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const advanceRef = useRef<(direction: 1 | -1) => void>(() => {});

  const playlist = PLAYLISTS[playlistIndex];
  const current = playlist.tracks[trackIndex];
  const hostRef = isDesktop ? desktopHostRef : mobileHostRef;

  const stopProgress = useCallback(() => { if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); animationRef.current = null; }, []);
  const updateProgress = useCallback(() => { if (!playerRef.current) return; const now = playerRef.current.getCurrentTime() || 0; const total = playerRef.current.getDuration() || 0; setProgress(now); if (total > 0) setDuration(total); animationRef.current = requestAnimationFrame(updateProgress); }, []);
  const startProgress = useCallback(() => { stopProgress(); animationRef.current = requestAnimationFrame(updateProgress); }, [stopProgress, updateProgress]);

  const advance = useCallback((direction: 1 | -1) => { setTrackIndex((old) => { const next = old + direction; return next < 0 ? playlist.tracks.length - 1 : next >= playlist.tracks.length ? 0 : next; }); }, [playlist.tracks.length]);
  advanceRef.current = advance;

  const createPlayer = useCallback(() => {
    if (!window.YT?.Player || !current.videoId || !hostRef.current) return;
    playerRef.current?.destroy();
    playerRef.current = new window.YT.Player(hostRef.current, {
      videoId: current.videoId,
      playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady: (event) => { const d = event.target.getDuration(); if (d > 0) setDuration(d); },
        onStateChange: (event) => {
          const states = window.YT?.PlayerState; if (!states) return;
          if (event.data === states.PLAYING) { setPlaying(true); startProgress(); }
          else if (event.data === states.PAUSED) { setPlaying(false); stopProgress(); }
          else if (event.data === states.ENDED) { setPlaying(false); stopProgress(); advanceRef.current(1); }
        },
        onError: (event) => { analyticsTrack("youtube_player_error", { code: String(event.data), videoId: current.videoId }); setPlaying(false); stopProgress(); advanceRef.current(1); }
      }
    });
  }, [current.videoId, hostRef, startProgress, stopProgress]);

  useEffect(() => {
    const ready = () => { apiReadyRef.current = true; createPlayer(); };
    if (window.YT?.Player) { ready(); return; }
    window.onYouTubeIframeAPIReady = ready;
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) { const script = document.createElement("script"); script.src = "https://www.youtube.com/iframe_api"; script.async = true; document.body.appendChild(script); }
    return () => { if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = undefined; };
  }, [createPlayer]);

  useEffect(() => {
    if (!apiReadyRef.current) return;
    playerRef.current?.destroy(); playerRef.current = null; stopProgress(); setPlaying(false); setProgress(0); setDuration(current.duration || 0);
    if (current.videoId) createPlayer();
  }, [current.id, current.videoId, current.duration, isDesktop, createPlayer, stopProgress]);

  useEffect(() => () => { stopProgress(); playerRef.current?.destroy(); }, [stopProgress]);

  const seek = useCallback((ratio: number) => { if (!playerRef.current || duration <= 0) return; const target = duration * ratio; playerRef.current.seekTo(target, true); setProgress(target); }, [duration]);
  const togglePlay = useCallback(() => { if (!playerRef.current) return; if (playing) playerRef.current.pauseVideo(); else playerRef.current.playVideo(); }, [playing]);
  const changePlaylist = (index: number) => { setPlaylistIndex(index); setTrackIndex(0); setPlaying(false); setProgress(0); setDuration(0); };
  const subtitle = useMemo(() => `${current.artist}${current.film ? ` • ${current.film}` : ""}`, [current.artist, current.film]);

  return <>
    <div className="mb-2 flex items-center justify-center gap-1.5 overflow-x-auto rounded-full px-1 text-[10px] uppercase tracking-[0.16em] text-white/60">
      {PLAYLISTS.map((item, index) => <button key={item.id} type="button" onClick={() => changePlaylist(index)} className={`shrink-0 rounded-full px-3 py-1.5 transition ${playlistIndex === index ? "bg-white/15 text-white" : "hover:bg-white/10"}`}>{item.name}</button>)}
    </div>

    <div className="player-glass hidden items-center gap-4 rounded-full p-3 pr-5 sm:flex">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-black">
        <div ref={desktopHostRef} className="youtube-artwork absolute inset-0" aria-label="Visible YouTube video player" />
        <Vinyl playing={playing} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-end justify-between gap-3"><div className="min-w-0"><p className="truncate text-[15px] font-semibold">{current.title}</p><p className="truncate text-[12.5px] text-white/70">{subtitle}</p></div><span className="shrink-0 text-[10.5px] tabular-nums text-white/55">{formatTime(progress)} / {formatTime(duration)}</span></div>
        <SeekBar progress={progress} duration={duration} onSeek={seek} />
      </div>
      <div className="flex shrink-0 items-center">
        <TransportButton label="Previous track" onClick={() => advance(-1)}><span className="text-lg">‹</span></TransportButton>
        <TransportButton label={playing ? "Pause" : "Play"} onClick={togglePlay} className="h-12 w-12 bg-gradient-to-b from-accent-soft to-accent text-black ring-1 ring-white/25 shadow-[0_8px_24px_rgba(242,184,75,.28)]">{playing ? "Ⅱ" : "▶"}</TransportButton>
        <TransportButton label="Next track" onClick={() => advance(1)}><span className="text-lg">›</span></TransportButton>
      </div>
    </div>

    <div className="player-glass rounded-[26px] p-4 sm:hidden">
      <div className="flex items-center gap-3"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-black"><div ref={mobileHostRef} className="youtube-artwork absolute inset-0" aria-label="Visible YouTube video player" /><Vinyl compact playing={playing} /></div><div className="min-w-0"><p className="truncate text-[15px] font-semibold">{current.title}</p><p className="truncate text-[12.5px] text-white/70">{subtitle}</p></div></div>
      <div className="mt-3"><SeekBar progress={progress} duration={duration} onSeek={seek} /></div>
      <div className="mt-1 flex items-center justify-between"><span className="text-[10.5px] tabular-nums text-white/55">{formatTime(progress)} / {formatTime(duration)}</span><div className="flex items-center"><TransportButton label="Previous track" onClick={() => advance(-1)}><span className="text-lg">‹</span></TransportButton><TransportButton label={playing ? "Pause" : "Play"} onClick={togglePlay} className="h-[52px] w-[52px] bg-gradient-to-b from-accent-soft to-accent text-black ring-1 ring-white/25 shadow-[0_8px_24px_rgba(242,184,75,.32)]">{playing ? "Ⅱ" : "▶"}</TransportButton><TransportButton label="Next track" onClick={() => advance(1)}><span className="text-lg">›</span></TransportButton></div><span className="w-12" aria-hidden="true" /></div>
    </div>
  </>;
}
