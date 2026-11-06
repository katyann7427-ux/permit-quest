// Garage cosmetics, unlocked by total XP. Visual rewards only.
export const VEHICLES = [
  { id: 'coupe', name: 'VECTOR GT', type: 'Sports coupe' },
  { id: 'muscle', name: 'HAMMERHEAD V8', type: 'Muscle car' },
  { id: 'suv', name: 'SUMMIT RS', type: 'Sport utility' },
];

export const ACCENTS = [
  { id: 'blue', hex: '#00B8FF', name: 'Electric Blue' },
  { id: 'green', hex: '#B6FF40', name: 'Neon Lime' },
  { id: 'orange', hex: '#FF7A1A', name: 'Blaze Orange' },
  { id: 'violet', hex: '#9D6BFF', name: 'Ultra Violet' },
  { id: 'silver', hex: '#C9D2E0', name: 'Liquid Silver' },
];

export const COSMETICS = {
  paint: [
    { id: 'gloss', name: 'Gloss', xp: 0 },
    { id: 'metallic', name: 'Metallic', xp: 200 },
    { id: 'matte', name: 'Stealth Matte', xp: 600 },
    { id: 'carbon', name: 'Carbon Hood', xp: 1200 },
  ],
  wheels: [
    { id: 'stock', name: 'Stock 5-Spoke', xp: 0 },
    { id: 'split', name: 'Split 10', xp: 350 },
    { id: 'turbine', name: 'Turbine', xp: 900 },
    { id: 'gold', name: 'Gold Mesh', xp: 1600 },
  ],
  lights: [
    { id: 'none', name: 'None', xp: 0 },
    { id: 'blue', name: 'Blue Underglow', xp: 450 },
    { id: 'green', name: 'Lime Underglow', xp: 1000 },
    { id: 'accent', name: 'Color-Match Glow', xp: 2000 },
  ],
  bg: [
    { id: 'concrete', name: 'Concrete Bay', xp: 0 },
    { id: 'grid', name: 'Neon Grid', xp: 500 },
    { id: 'city', name: 'Night City', xp: 1400 },
    { id: 'track', name: 'Pit Lane', xp: 2500 },
  ],
};

export const SLOT_LABELS = { paint: 'PAINT', wheels: 'WHEELS', lights: 'LIGHTING', bg: 'GARAGE' };

export function isUnlocked(item, xp) {
  return xp >= item.xp;
}

/** Next locked cosmetic across all slots (for "next unlock" teaser). */
export function nextUnlock(xp) {
  const all = Object.entries(COSMETICS).flatMap(([slot, items]) => items.map((i) => ({ ...i, slot })));
  return all.filter((i) => i.xp > xp).sort((a, b) => a.xp - b.xp)[0] || null;
}
