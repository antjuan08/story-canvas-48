import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Minimal typing for the Web Speech API which TS doesn't ship by default.
type SRConstructor = new () => any;

function getSpeechRecognition(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) ?? null;
}

export interface DictationOptions {
  /** Called every time we get a new chunk of finalized transcript text. */
  onTranscript: (chunk: string) => void;
  /** BCP-47 language tag. Defaults to browser language. */
  lang?: string;
}

/**
 * Wraps the browser Web Speech API and explicit getUserMedia permission
 * prompt so we always trigger the OS/browser mic-permission flow before
 * starting recognition.
 */
export function useDictation({ onTranscript, lang }: DictationOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setSupported(!!getSpeechRecognition() && typeof navigator !== "undefined" && !!navigator.mediaDevices);
    return () => {
      try { recognitionRef.current?.stop?.(); } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop?.(); } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error("Voice dictation isn't supported in this browser. Try Chrome or Safari.");
      return;
    }

    // Explicitly request mic permission so the browser prompt always appears.
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e: any) {
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        toast.error("Microphone blocked. Allow mic access in your browser settings.");
      } else {
        toast.error("Couldn't access the microphone.");
      }
      return;
    }

    const recognition = new SR();
    recognition.lang = lang || (typeof navigator !== "undefined" ? navigator.language : "en-US");
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) chunk += res[0].transcript;
      }
      if (chunk.trim()) onTranscript(chunk);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast.error("Microphone permission denied.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error(`Mic error: ${event.error}`);
      }
      stop();
    };

    recognition.onend = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      toast.success("Listening — speak your story");
    } catch {
      stop();
    }
  }, [lang, onTranscript, stop]);

  const toggle = useCallback(() => {
    if (listening) stop(); else start();
  }, [listening, start, stop]);

  return { listening, supported, start, stop, toggle };
}
