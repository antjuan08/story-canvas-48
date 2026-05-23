"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Premium dark-gradient card with subtle 3D tilt, purple glow, and noise overlay.
 * Wrap any content inside — keeps the look consistent across Vault and Stage.
 */
export const GradientCard = React.forwardRef<HTMLDivElement, GradientCardProps>(
  ({ children, className, onClick, ...rest }, ref) => {
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
      const el = innerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setRotation({ x: -(y / rect.height) * 4, y: (x / rect.width) * 4 });
    };

    const reset = () => {
      setHovered(false);
      setRotation({ x: 0, y: 0 });
    };

    return (
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        style={{ perspective: "1000px" }}
        className={cn("group relative", className)}
        {...rest}
      >
        <motion.div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={reset}
          onMouseMove={handleMouseMove}
          onClick={onClick}
          animate={{
            rotateX: rotation.x,
            rotateY: rotation.y,
            scale: hovered ? 1.01 : 1,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 22, mass: 0.6 }}
          style={{ transformStyle: "preserve-3d" }}
          className={cn(
            "relative h-full overflow-hidden rounded-2xl border border-white/10",
            "bg-[radial-gradient(120%_120%_at_50%_0%,#1a1430_0%,#0c0a1a_55%,#06050d_100%)]",
            "shadow-[0_10px_40px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)_inset]",
            onClick && "cursor-pointer"
          )}
        >
          {/* glass top-edge reflection */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* central purple/blue glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,0.35),transparent_70%)] blur-2xl" />

          {/* bottom border glow */}
          <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

          {/* noise overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
            }}
          />

          {/* hover sheen */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(600px_circle_at_var(--mx,50%)_var(--my,0%),rgba(168,139,250,0.08),transparent_40%)]" />

          {/* content (forced light for contrast on dark bg) */}
          <div className="relative z-10 text-white">{children}</div>
        </motion.div>
      </div>
    );
  }
);
GradientCard.displayName = "GradientCard";
