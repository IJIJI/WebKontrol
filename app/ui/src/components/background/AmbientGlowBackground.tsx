import { JSX } from "react/jsx-runtime";

import "./background.less";
import { useMemo } from "react";

interface Vector<T = number> {
  x: T;
  y: T;
}

interface Blob {
  color: string;
  size: number; // 0 - 100 relative to the entire area.
  
  position: Vector; // -100 - +100 for the entire area.
  velocity: Vector; // -100 - +100, combined with speed modifier.
  duration: number;
  
  opacity: number;
}

const DEFAULT_COLORS = ["#e85d30", "#d12e2eff", "#ed313dff"]; //TODO: Load from less variables somehow?

const generateBlobs = (count: number, colors: string[], maxSpeed: number = 50, maxSize: number = 50, seed?: number): Blob[] => {
  const rand = seed !== undefined ? Math.random : Math.random;

  return Array.from({length: count}, (_v, k): Blob => ({
    color: colors[k % colors.length],
    size: 5 + rand() * maxSize, 
    position: {
      x: (rand() - 0.5) * 95,
      y: (rand() - 0.5) * 95,
    },
    velocity:  {
      x: (rand() - 0.5) * maxSpeed,
      y: (rand() - 0.5) * maxSpeed,
    },
    duration: 20 + rand() * 40,
    opacity: 0.4 + rand() * 0.4
  }));
}

export interface AmbientGlowProps {
  /** Accent colors to draw blobs from (cycles if count > colors.length). */
  colors?: string[];
  /** Number of blobs to render. */
  count?: number;
  /** Slowly drift the blobs. Disabled automatically for prefers-reduced-motion. */
  animate?: boolean;
  /** Multiplies blob opacity, e.g. 0.5 for a subtler effect, 1.5 for stronger. */
  intensity?: number;
  /** Pass a number to get the same layout every render (useful for SSR / storybook). Omit for fresh randomness on every mount. */
  // TODO:
  seed?: number;
  className?: string;
}

export default function AmbientGlowBackground({ 
  colors = DEFAULT_COLORS, 
  count = 4, 
  animate = true, 
  intensity = 1, 
  seed,
  className
}: AmbientGlowProps): JSX.Element {
  const blobs = useMemo(
    () => generateBlobs(count, colors, seed),
    // colors is usually a stable literal; if you pass a new array each render,
    // memo it on the caller side too.
    [count, colors, seed],
  );

  return(
    <div className={["background", "ambientGlow", className].filter(Boolean).join(" ")} aria-hidden="true">
      {blobs.map((blob, i) => (
        <span
          key={i}
          className={"blob" + (animate ? " animate" : "")}
          style={
            {
              width: blob.size,
              height: blob.size,
              left: `${blob.position.x + 50}vw`,
              top: `${blob.position.y + 50}vh`,
              background: blob.color,
              opacity: blob.opacity * intensity,
              "--duration": `${blob.duration}s`,
              "--dx": `${blob.velocity.x}px`,
              "--dy": `${blob.velocity.y}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
