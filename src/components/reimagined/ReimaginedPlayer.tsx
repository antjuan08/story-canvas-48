import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX, Maximize2, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReimaginedPlayerProps {
  src: string;
  poster?: string | null;
  title?: string;
  className?: string;
}

export function ReimaginedPlayer({ src, poster, title, className }: ReimaginedPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => setCurrent(v.currentTime);
    const onLoaded = () => { setDuration(v.duration || 0); setLoading(false); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onErr = () => { setError(true); setLoading(false); };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("error", onErr);
    };
  }, [src]);

  const toggle = () => {
    const v = ref.current; if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };
  const toggleMute = () => {
    const v = ref.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  };
  const seek = (t: number) => {
    const v = ref.current; if (!v) return;
    v.currentTime = t; setCurrent(t);
  };
  const fullscreen = () => {
    const v = ref.current; if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  };
  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${String(ss).padStart(2, "0")}`;
  };

  return (
    <div className={cn("group relative rounded-2xl overflow-hidden bg-black/90 aspect-video", className)}>
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        playsInline
        onClick={toggle}
        className="w-full h-full object-contain cursor-pointer"
      />

      {loading && !error && (
        <div className="absolute inset-0 grid place-items-center text-white/70 pointer-events-none">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center text-white/70 text-sm">
          Couldn't load this video.
        </div>
      )}

      {!playing && !loading && !error && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play"
          className="absolute inset-0 grid place-items-center bg-black/20 hover:bg-black/30 transition-colors"
        >
          <span className="h-16 w-16 rounded-full bg-white/90 text-black grid place-items-center shadow-xl">
            <Play className="h-7 w-7 ml-0.5" />
          </span>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 text-white">
          <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="h-8 w-8 rounded-full hover:bg-white/10 grid place-items-center">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <span className="text-xs tabular-nums">{fmt(current)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 accent-white h-1"
            aria-label="Seek"
          />
          <span className="text-xs tabular-nums">{fmt(duration)}</span>
          <button onClick={toggleMute} aria-label="Mute" className="h-8 w-8 rounded-full hover:bg-white/10 grid place-items-center">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <a href={src} download={title ? `${title}.mp4` : "video.mp4"} target="_blank" rel="noreferrer" aria-label="Download" className="h-8 w-8 rounded-full hover:bg-white/10 grid place-items-center">
            <Download className="h-4 w-4" />
          </a>
          <button onClick={fullscreen} aria-label="Fullscreen" className="h-8 w-8 rounded-full hover:bg-white/10 grid place-items-center">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
