import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recording: boolean;
  onToggle: () => void;
}

export function MicOrb({ recording, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="relative flex h-48 w-48 items-center justify-center group"
      aria-label={recording ? "Stop recording" : "Start recording"}
    >
      {/* Ambient outer glow */}
      <div className={cn(
        "absolute inset-0 rounded-full orb-glow opacity-30 blur-2xl transition-apple-long",
        recording && "opacity-60 animate-pulse-orb"
      )} />
      {/* Outer ring */}
      <div className={cn(
        "absolute inset-4 rounded-full border border-white/10 transition-apple",
        recording && "animate-pulse-orb"
      )} />
      {/* Orb */}
      <div className={cn(
        "relative flex h-32 w-32 items-center justify-center rounded-full orb-glow text-white shadow-apple-lg transition-apple group-hover:scale-105",
        recording && "scale-110"
      )}>
        {recording ? <Square className="h-10 w-10 fill-current" /> : <Mic className="h-12 w-12" />}
      </div>
    </button>
  );
}
