"use client";

import { useEffect, useState } from "react";

function Clock() {
  const [time, setTime] = useState("12:00 PM");
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
    const tick = () => setTime(formatter.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [hour, rest] = time.split(":");
  return <span>{hour}<span className="clock-colon">:</span>{rest}</span>;
}

export default function TopBar() {
  return (
    <header className="fixed left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] top-[max(1rem,env(safe-area-inset-top))] z-20 flex items-start justify-between gap-4 text-white/80">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Desi Bar</p>
        <div className="mt-1 text-sm font-medium tracking-wide"><Clock /></div>
      </div>
      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] backdrop-blur-xl">
        <span className="live-dot mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
        <span>0 listeners</span>
      </div>
      <nav aria-label="Social links" className="flex items-center gap-2 text-[11px] font-medium">
        <a className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 backdrop-blur-xl transition hover:bg-white/10" href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a>
        <a className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 backdrop-blur-xl transition hover:bg-white/10" href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
      </nav>
    </header>
  );
}
