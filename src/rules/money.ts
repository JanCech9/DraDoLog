// 1 zlatý = 10 stříbrných = 100 měďáků. Vše je počítáno v měďácích.

export const MD_PER_ST = 10;
export const MD_PER_ZL = 100;

export interface Coins {
  zl: number;
  st: number;
  md: number;
}

export function splitMoney(total: number): Coins {
  const safe = Math.max(0, Math.trunc(total));
  return {
    zl: Math.floor(safe / MD_PER_ZL),
    st: Math.floor((safe % MD_PER_ZL) / MD_PER_ST),
    md: safe % MD_PER_ST,
  };
}

export function toMedaky({ zl, st, md }: Partial<Coins>): number {
  return (zl ?? 0) * MD_PER_ZL + (st ?? 0) * MD_PER_ST + (md ?? 0);
}

export function formatMoney(total: number): string {
  const { zl, st, md } = splitMoney(total);
  const parts: string[] = [];
  if (zl) parts.push(`${zl} zl`);
  if (st) parts.push(`${st} st`);
  if (md) parts.push(`${md} md`);
  return parts.length ? parts.join(' ') : '0 md';
}

/** Number of physical coins carried, assuming you always exchange upwards. */
export function coinCount(total: number): number {
  const { zl, st, md } = splitMoney(total);
  return zl + st + md;
}
