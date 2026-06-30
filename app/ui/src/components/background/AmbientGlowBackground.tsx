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

type MinMax<T = number> = {
  min: T,
  max: T
}

const generateBlobs = (count: number, colors: string[], speed: MinMax = {min: 5, max: 50}, size: MinMax = {min: 5, max: 25}, opacity: MinMax = {min: 0.7, max: 0.9}, seed?: number): Blob[] => {
  const rand = seed !== undefined ? Math.random : Math.random;

  return Array.from({length: count}, (_v, k): Blob => ({
    color: colors[k % colors.length],
    size: size.min + rand() * (size.max - size.min), 
    position: {
      x: (rand() - 0.5) * 95,
      y: (rand() - 0.5) * 95,
    },
    velocity:  { // TODO: Make sure min speed is in the right direction.
      x: speed.min + (rand() - 0.5) * (speed.max - speed.min),
      y: speed.min + (rand() - 0.5) * (speed.max - speed.min),
    },
    duration: 20 + rand() * 40,
    opacity: opacity.min + rand() * (opacity.max - opacity.min)
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
  count = 8, 
  animate = true, 
  intensity = 1, 
  seed,
  className
}: AmbientGlowProps): JSX.Element {
  const blobs = useMemo(
    () => generateBlobs(count, colors), // TODO: Seed, and the rest of the vars.
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
              width: `${blob.size}vw`,
              height: `${blob.size}vw`, // TODO: Size on different measure? And vw on mobile but vh on desktop?
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
