import React, { useMemo } from 'react';

type AvatarSpriteProps = {
  name: string;
  size?: number; // pixel size of the avatar (square)
  animate?: boolean; // bobbing animation
};

// Deterministic hash from string -> 32-bit int
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

// Clamp helper
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// HSL utilities
function hsl(h: number, s: number, l: number) {
  return `hsl(${(h % 360 + 360) % 360}, ${clamp(s, 0, 100)}%, ${clamp(l, 0, 100)}%)`;
}

// Derive a palette reminiscent of retro fighter sprites
function paletteFromSeed(seed: number) {
  // Skin tone from warm hues / lightness
  const skinHue = (seed % 30) + 20; // 20-50
  const skinLight = 60 - ((seed >> 3) % 20); // 40-60
  const skin = hsl(skinHue, 45, skinLight);
  const skinShadow = hsl(skinHue, 45, skinLight - 12);

  // Hair can be dark, light, or bald
  const hairRoll = (seed >> 7) % 5; // 0..4
  let hair = 'transparent';
  let hairShadow = 'transparent';
  if (hairRoll !== 0) {
    const hairHue = 30 + ((seed >> 11) % 60); // brownish range
    const dark = 18 + ((seed >> 13) % 10);
    hair = hsl(hairHue, 35, dark + 5);
    hairShadow = hsl(hairHue, 35, dark);
  }

  // Gloves: bright accent
  const gloveHue = (seed * 7) % 360;
  const glove = hsl(gloveHue, 75, 50);
  const gloveShadow = hsl(gloveHue, 75, 38);

  // Outfit: cooler hue band
  const outfitHue = ((seed >> 5) * 11) % 360;
  const outfit = hsl(outfitHue, 70, 45);
  const outfitShadow = hsl(outfitHue, 70, 35);

  const eye = '#111';
  const outline = '#1b1b1b';
  const highlight = 'rgba(255,255,255,0.75)';

  return { skin, skinShadow, hair, hairShadow, glove, gloveShadow, outfit, outfitShadow, eye, outline, highlight };
}

// Draw a retro boxer-like sprite in a 16x16 pixel grid using SVG rects
export const AvatarSprite: React.FC<AvatarSpriteProps> = ({ name, size = 48, animate = true }) => {
  const seed = hashString((name || '').trim().toLowerCase());
  const px = Math.max(1, Math.floor(size / 16));
  const s = px; // cell size
  const svgSize = s * 16;
  const pal = useMemo(() => paletteFromSeed(seed), [seed]);

  // Optional unique animation id per seed
  const animName = useMemo(() => `bob_${seed % 10007}`, [seed]);

  // Helper to draw a pixel block
  const R = (x: number, y: number, w: number, h: number, fill: string, key?: string) => (
    <rect key={key ?? `${x}_${y}_${w}_${h}_${fill}`} x={x * s} y={y * s} width={w * s} height={h * s} fill={fill} />
  );

  // Build pixels. The coordinates form a stylized boxer: head, eyes, gloves, torso, belt, legs.
  const pixels: React.ReactNode[] = [];

  // Head (with slight shading)
  pixels.push(R(5, 2, 6, 4, pal.skin)); // face main
  pixels.push(R(5, 6, 6, 1, pal.skinShadow)); // chin shadow
  // Hair cap/back depending on seed
  if (pal.hair !== 'transparent') {
    pixels.push(R(5, 1, 6, 1, pal.hair));
    pixels.push(R(4, 2, 1, 3, pal.hairShadow));
    pixels.push(R(11, 2, 1, 3, pal.hairShadow));
  }
  // Eyes
  pixels.push(R(7, 3, 1, 1, pal.eye));
  pixels.push(R(9, 3, 1, 1, pal.eye));
  // Nose bridge
  pixels.push(R(8, 4, 1, 1, pal.skinShadow));

  // Torso
  pixels.push(R(4, 7, 8, 4, pal.outfit));
  pixels.push(R(4, 10, 8, 1, pal.outfitShadow)); // lower torso shading
  // Belt / highlight
  pixels.push(R(6, 9, 4, 1, pal.highlight));

  // Gloves
  pixels.push(R(2, 8, 3, 3, pal.glove));
  pixels.push(R(2, 11, 3, 1, pal.gloveShadow));
  pixels.push(R(13, 8, 3, 3, pal.glove));
  pixels.push(R(13, 11, 3, 1, pal.gloveShadow));

  // Arms (skin)
  pixels.push(R(5, 8, 1, 2, pal.skinShadow));
  pixels.push(R(11, 8, 1, 2, pal.skinShadow));

  // Legs
  pixels.push(R(6, 12, 2, 3, pal.outfitShadow));
  pixels.push(R(8, 12, 2, 3, pal.outfitShadow));

  // Simple outline accents (few darker pixels)
  pixels.push(R(5, 2, 1, 1, pal.outline));
  pixels.push(R(10, 2, 1, 1, pal.outline));
  pixels.push(R(4, 7, 1, 1, pal.outline));
  pixels.push(R(11, 7, 1, 1, pal.outline));

  // Ground shadow (subtle)
  pixels.push(R(4, 15, 8, 1, 'rgba(0,0,0,0.15)'));

  return (
    <div
      aria-label={`avatar for ${name}`}
      role="img"
      style={{
        width: svgSize,
        height: svgSize,
        imageRendering: 'pixelated',
        userSelect: 'none',
        display: 'inline-block',
        overflow: 'hidden',
        borderRadius: 4,
        animation: animate ? `${animName} 1.1s ease-in-out infinite` : undefined,
      }}
      title={name}
    >
      {animate && (
        <style>{`
@keyframes ${animName} { 0% { transform: translateY(0px) } 50% { transform: translateY(-2px) } 100% { transform: translateY(0px) } }
        `}</style>
      )}
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        {/* Transparent background to preserve rounded corners */}
        <rect x={0} y={0} width={svgSize} height={svgSize} fill="transparent" />
        {pixels}
      </svg>
    </div>
  );
};

export default AvatarSprite;
