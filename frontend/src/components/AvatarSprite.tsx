import React, { useMemo } from 'react';

type AvatarSpriteProps = {
  name: string;
  size?: number; // pixel size of the avatar (square)
  animate?: boolean; // bobbing animation
  theme?: string; // category/theme (e.g., "nba", "baseball")
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

// Derive a palette for person sprites
function paletteFromSeed(seed: number) {
  const skinHue = (seed % 30) + 20; // 20-50
  const skinLight = 60 - ((seed >> 3) % 20); // 40-60
  const skin = hsl(skinHue, 45, skinLight);
  const skinShadow = hsl(skinHue, 45, skinLight - 12);

  const hairRoll = (seed >> 7) % 5; // 0..4
  let hair = 'transparent';
  let hairShadow = 'transparent';
  if (hairRoll !== 0) {
    const hairHue = 30 + ((seed >> 11) % 60); // brownish range
    const dark = 18 + ((seed >> 13) % 10);
    hair = hsl(hairHue, 35, dark + 5);
    hairShadow = hsl(hairHue, 35, dark);
  }

  const gloveHue = (seed * 7) % 360;
  const glove = hsl(gloveHue, 75, 50);
  const gloveShadow = hsl(gloveHue, 75, 38);

  const outfitHue = ((seed >> 5) * 11) % 360;
  const outfit = hsl(outfitHue, 70, 45);
  const outfitShadow = hsl(outfitHue, 70, 35);

  const eye = '#111';
  const outline = '#1b1b1b';
  const highlight = 'rgba(255,255,255,0.75)';

  return { skin, skinShadow, hair, hairShadow, glove, gloveShadow, outfit, outfitShadow, eye, outline, highlight };
}

// 16x16 pixel sprite using SVG rects
export const AvatarSprite: React.FC<AvatarSpriteProps> = ({ name, size = 48, animate = true, theme }) => {
  const normName = (name || '').trim().toLowerCase();
  const seed = hashString(normName);
  const px = Math.max(1, Math.floor(size / 16));
  const s = px; // cell size
  const svgSize = s * 16;
  const pal = useMemo(() => paletteFromSeed(seed), [seed]);
  const canonicalTheme = useMemo(() => {
    const t = (theme || '').toLowerCase().replace(/\s+/g, '_');
    if (!t) return '';
    if (['nba', 'basketball', 'hoops'].includes(t)) return 'basketball';
    if (['mlb', 'baseball', 'base_ball'].includes(t)) return 'baseball';
    return t;
  }, [theme]);

  // Map themes to sprite types; allow name-based overrides
  const spriteType = useMemo(() => {
    if (normName === 'albert einstein' || /\beinstein\b/.test(normName)) return 'einstein';
    if (/\blebron\b/.test(normName)) return 'lebron';
    if (/\bstephen\s+hawking\b|\bhawking\b/.test(normName)) return 'hawking';
    if (/\bariana\s+grande\b|\bariana\b/.test(normName)) return 'ariana';

    const t = canonicalTheme;
    if (!t) return 'person';

    const sportTopics = new Set(['basketball', 'baseball', 'nfl', 'soccer', 'hockey', 'golf', 'tennis', 'olympics']);
    if (sportTopics.has(t)) return t; // keep specific sport where possible

    const personTopics = new Set(['famous_figures', 'world_leaders', 'us_politicians']);
    if (personTopics.has(t)) return 'person';

    // Books / theories / philosophy
    if (
      t.includes('theory') ||
      t.includes('philosophy') ||
      t.includes('political') ||
      t === 'political_theory'
    ) return 'book';

    // Places / history
    if (
      ['landmarks','natural_wonders','islands','capitals','cities','countries','continents'].includes(t) ||
      t.includes('history') || t.includes('wars') || t.includes('revolutions')
    ) return 'landmark';

    // Technology / CS
    if (
      ['programming_languages','web_development','ai_ml','operating_systems','databases','cybersecurity','data_structures','algorithms'].includes(t) ||
      t.includes('program') || t.includes('web') || t.includes('ai')
    ) return 'computer';

    // Elections / democracy
    if (t.includes('elections') || t.includes('democracy')) return 'ballot';

    return 'person';
  }, [canonicalTheme]);

  const animName = useMemo(() => `bob_${seed % 10007}`, [seed]);

  // Helper to draw a pixel block
  const R = (x: number, y: number, w: number, h: number, fill: string, key?: string) => (
    <rect key={key ?? `${x}_${y}_${w}_${h}_${fill}`} x={x * s} y={y * s} width={w * s} height={h * s} fill={fill} />
  );

  const pixels: React.ReactNode[] = [];

  if (
    spriteType === 'person' ||
    spriteType === 'basketball' ||
    spriteType === 'baseball' ||
    spriteType === 'einstein' ||
    spriteType === 'lebron' ||
    spriteType === 'ariana'
  ) {
    const personSkin = spriteType === 'lebron' ? '#6b4a37' : pal.skin; // darker tone
    const personSkinShadow = spriteType === 'lebron' ? '#4b3326' : pal.skinShadow;
    // Head
    pixels.push(R(5, 2, 6, 4, personSkin));
    pixels.push(R(5, 6, 6, 1, personSkinShadow));
    if (spriteType === 'einstein') {
      const hairMain = '#e5e7eb';
      const hairShade = '#cbd5e1';
      pixels.push(R(4, 0, 8, 1, hairMain));
      pixels.push(R(3, 1, 10, 1, hairShade));
      pixels.push(R(3, 2, 1, 3, hairMain));
      pixels.push(R(12, 2, 1, 3, hairMain));
      pixels.push(R(2, 3, 1, 2, hairShade));
      pixels.push(R(13, 3, 1, 2, hairShade));
      pixels.push(R(5, 1, 6, 1, hairMain));
    } else if (spriteType === 'ariana') {
      const hair = '#3b2f2f';
      const shine = '#5b4545';
      pixels.push(R(7, 0, 2, 1, hair));
      pixels.push(R(7, 1, 2, 1, hair));
      pixels.push(R(11, 2, 1, 4, hair));
      pixels.push(R(10, 3, 1, 3, shine));
      pixels.push(R(6, 1, 1, 1, shine));
      pixels.push(R(9, 1, 1, 1, shine));
    } else if (spriteType === 'lebron') {
      const hair = '#2b2b2b';
      pixels.push(R(5, 1, 6, 1, hair));
    } else if (pal.hair !== 'transparent') {
      pixels.push(R(5, 1, 6, 1, pal.hair));
      pixels.push(R(4, 2, 1, 3, pal.hairShadow));
      pixels.push(R(11, 2, 1, 3, pal.hairShadow));
    }
    pixels.push(R(7, 3, 1, 1, pal.eye));
    pixels.push(R(9, 3, 1, 1, pal.eye));
  pixels.push(R(8, 4, 1, 1, personSkinShadow));
    if (spriteType === 'einstein') {
      const stache = '#a3a3a3';
      pixels.push(R(7, 5, 3, 1, stache));
    } else if (spriteType === 'lebron') {
      const beard = '#1f1f1f';
      pixels.push(R(6, 5, 4, 1, beard));
      pixels.push(R(6, 6, 4, 1, beard));
    }

    if (spriteType === 'einstein') {
      const coat = '#7a7d72';
      const coatShadow = '#5e6159';
      pixels.push(R(4, 7, 8, 4, coat));
      pixels.push(R(4, 10, 8, 1, coatShadow));
      pixels.push(R(4, 7, 2, 1, coatShadow));
      pixels.push(R(10, 7, 2, 1, coatShadow));
      pixels.push(R(8, 10, 1, 1, '#2b2b2b'));
    } else if (spriteType === 'lebron') {
      const gold = '#FDB927';
      const purple = '#552583';
      pixels.push(R(4, 7, 8, 4, gold));
      pixels.push(R(4, 7, 1, 2, purple));
      pixels.push(R(11, 7, 1, 2, purple));
      pixels.push(R(7, 7, 3, 1, purple));
      pixels.push(R(4, 10, 8, 1, '#b2891a'));
    } else if (spriteType === 'ariana') {
      const dress = '#c4b5fd';
      const shadow = '#a78bfa';
      pixels.push(R(4, 7, 8, 4, dress));
      pixels.push(R(4, 10, 8, 1, shadow));
      pixels.push(R(6, 9, 4, 1, 'rgba(255,255,255,0.7)'));
    } else {
      pixels.push(R(4, 7, 8, 4, pal.outfit));
      pixels.push(R(4, 10, 8, 1, pal.outfitShadow));
      pixels.push(R(6, 9, 4, 1, pal.highlight));
    }

    if (spriteType === 'basketball') {
      const trim = '#ffffff';
      const trim2 = 'rgba(255,255,255,0.6)';
      pixels.push(R(4, 7, 1, 2, trim));
      pixels.push(R(11, 7, 1, 2, trim));
      pixels.push(R(7, 7, 3, 1, trim));
      pixels.push(R(8, 8, 1, 1, trim2));
      pixels.push(R(7, 8, 1, 1, pal.highlight));
      pixels.push(R(9, 8, 1, 1, pal.highlight));
      pixels.push(R(5, 11, 6, 1, pal.outfit));
      pixels.push(R(5, 11, 1, 1, trim));
      pixels.push(R(10, 11, 1, 1, trim));
      pixels.push(R(6, 15, 1, 1, '#111'));
      pixels.push(R(9, 15, 1, 1, '#111'));
    } else if (spriteType === 'baseball') {
      const cap = '#1e3a8a';
      const brim = '#0f2557';
      pixels.push(R(5, 1, 6, 1, cap));
      pixels.push(R(5, 2, 3, 1, brim));
      const stripe = 'rgba(255,255,255,0.35)';
      [5, 7, 9].forEach((x) => pixels.push(R(x, 7, 1, 4, stripe)));
    }

    if (spriteType === 'einstein') {
      const sleeve = '#6b6e64';
      pixels.push(R(2, 9, 2, 2, sleeve));
      pixels.push(R(14, 9, 2, 2, sleeve));
      pixels.push(R(2, 11, 3, 1, '#4b4b4b'));
      pixels.push(R(13, 11, 3, 1, '#4b4b4b'));
    } else {
      pixels.push(R(2, 8, 3, 3, pal.glove));
      pixels.push(R(2, 11, 3, 1, pal.gloveShadow));
      pixels.push(R(13, 8, 3, 3, pal.glove));
      pixels.push(R(13, 11, 3, 1, pal.gloveShadow));
    }

    // Accessories
    if (spriteType === 'basketball') {
      const ball = '#f39c12';
      const seam = '#7a4a00';
      pixels.push(R(13, 9, 3, 3, ball));
      pixels.push(R(13, 9, 1, 1, pal.outline));
      pixels.push(R(15, 9, 1, 1, pal.outline));
      pixels.push(R(13, 11, 1, 1, pal.outline));
      pixels.push(R(15, 11, 1, 1, pal.outline));
      pixels.push(R(14, 9, 1, 3, seam));
      pixels.push(R(13, 10, 3, 1, seam));
    } else if (spriteType === 'lebron') {
      const ball = '#f39c12';
      const seam = '#7a4a00';
      pixels.push(R(13, 9, 3, 3, ball));
      pixels.push(R(14, 9, 1, 3, seam));
      pixels.push(R(13, 10, 3, 1, seam));
    } else if (spriteType === 'baseball') {
      const gloveBrown = '#8b5a2b';
      pixels.push(R(2, 8, 3, 3, gloveBrown));
      const batLight = '#d2a679';
      const batMid = '#c29566';
      const batDark = '#a47246';
      pixels.push(R(12, 8, 1, 1, batLight));
      pixels.push(R(13, 9, 2, 1, batLight));
      pixels.push(R(14, 10, 1, 1, batMid));
      pixels.push(R(15, 11, 1, 1, batDark));
      const ball = '#ffffff';
      const seam = '#d32f2f';
      pixels.push(R(3, 9, 1, 1, ball));
      pixels.push(R(3, 9, 1, 1, seam));
      const pants = '#e5e7eb';
      pixels.push(R(5, 11, 6, 1, pants));
      pixels.push(R(6, 9, 4, 1, '#2d2d2d'));
      pixels.push(R(6, 15, 1, 1, '#111'));
      pixels.push(R(9, 15, 1, 1, '#111'));
    }

  pixels.push(R(5, 8, 1, 2, personSkinShadow));
  pixels.push(R(11, 8, 1, 2, personSkinShadow));
    if (spriteType === 'einstein') {
      const pants = '#4b5563';
      pixels.push(R(6, 12, 2, 3, pants));
      pixels.push(R(8, 12, 2, 3, pants));
    } else {
      pixels.push(R(6, 12, 2, 3, pal.outfitShadow));
      pixels.push(R(8, 12, 2, 3, pal.outfitShadow));
    }

    // Outline accents
    pixels.push(R(5, 2, 1, 1, pal.outline));
    pixels.push(R(10, 2, 1, 1, pal.outline));
    pixels.push(R(4, 7, 1, 1, pal.outline));
    pixels.push(R(11, 7, 1, 1, pal.outline));
  } else {
    // Iconic non-person sprites
    if (spriteType === 'hawking') {
      // Wheelchair with device and small head
      const chair = '#2f2f2f';
      const wheel = '#9ca3af';
      const tire = '#6b7280';
      const device = '#111827';
      const screen = '#0b1226';
      // Wheels
      pixels.push(R(3, 12, 3, 2, wheel));
      pixels.push(R(4, 12, 1, 2, tire));
      pixels.push(R(10, 12, 3, 2, wheel));
      pixels.push(R(11, 12, 1, 2, tire));
      // Seat and frame
      pixels.push(R(4, 7, 7, 2, chair));
      pixels.push(R(3, 9, 2, 3, chair));
      pixels.push(R(9, 9, 2, 3, chair));
      pixels.push(R(6, 9, 3, 1, chair));
      // Device mount
      pixels.push(R(9, 6, 4, 2, device));
      pixels.push(R(10, 7, 2, 1, screen));
      // Head (small)
      const skin = pal.skin;
      pixels.push(R(6, 5, 2, 2, skin));
      pixels.push(R(6, 7, 2, 1, pal.skinShadow));
      // Eye
      pixels.push(R(7, 6, 1, 1, pal.eye));
    } else if (spriteType === 'book') {
      const cover = pal.outfit;
      const page = 'rgba(255,255,255,0.95)';
      const spine = pal.outline;
      pixels.push(R(4, 4, 8, 6, cover));
      pixels.push(R(5, 5, 6, 4, page));
      pixels.push(R(4, 4, 1, 6, spine));
      pixels.push(R(9, 7, 1, 2, pal.highlight));
    } else if (spriteType === 'computer') {
      const screen = '#0b1226';
      const bezel = pal.outline;
      pixels.push(R(3, 4, 10, 6, screen));
      pixels.push(R(3, 3, 10, 1, bezel));
      pixels.push(R(6, 10, 4, 1, bezel));
      pixels.push(R(3, 12, 10, 1, '#444'));
      pixels.push(R(4, 13, 8, 1, '#666'));
    } else if (spriteType === 'landmark') {
      const stone = '#bfbfbf';
      const shadow = '#9a9a9a';
      pixels.push(R(6, 4, 4, 1, stone));
      pixels.push(R(5, 5, 1, 6, stone));
      pixels.push(R(10, 5, 1, 6, stone));
      pixels.push(R(6, 11, 4, 1, shadow));
      pixels.push(R(4, 12, 8, 1, '#777'));
    } else if (spriteType === 'ballot') {
      const box = '#d1d5db';
      const slot = '#111';
      const paper = '#ffffff';
      pixels.push(R(5, 6, 6, 6, box));
      pixels.push(R(6, 5, 4, 1, slot));
      pixels.push(R(7, 4, 2, 1, paper));
      pixels.push(R(5, 12, 6, 1, pal.outline));
    } else {
      // Fallback badge
      pixels.push(R(5, 5, 6, 4, pal.outfit));
      pixels.push(R(7, 9, 2, 4, pal.highlight));
      pixels.push(R(4, 11, 8, 1, pal.outline));
    }
  }

  // Ground shadow (subtle)
  const shadowY = 15;
  pixels.push(R(4, shadowY, 8, 1, 'rgba(0,0,0,0.15)'));

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
      >
        {/* Transparent background to preserve rounded corners */}
        <rect x={0} y={0} width={svgSize} height={svgSize} fill="transparent" />
        {pixels}
      </svg>
    </div>
  );
};

export default AvatarSprite;
