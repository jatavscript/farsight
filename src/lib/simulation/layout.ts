// Station layout helpers. The canvas is normalized 0..1000 x 0..600.
export const MAP_W = 1000;
export const MAP_H = 600;

export const ENTRY_GATE = { x: 60, y: 300 };
export const EXIT_GATE = { x: 940, y: 300 };
export const TICKET = { x: 160, y: 120 };
export const WAITING = { x: 500, y: 80 };

export function platformY(platform: number, total: number): number {
  // platforms stacked vertically in the middle band
  const top = 180;
  const bottom = 560;
  const span = bottom - top;
  if (total <= 1) return (top + bottom) / 2;
  return top + ((platform - 1) / (total - 1)) * span;
}

export function platformLine(platform: number, total: number) {
  return {
    x1: 220,
    x2: 880,
    y: platformY(platform, total),
  };
}

export function platformBoardingPoint(platform: number, total: number) {
  const line = platformLine(platform, total);
  return { x: (line.x1 + line.x2) / 2, y: line.y };
}
