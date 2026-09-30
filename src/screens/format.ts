// Formatting helpers shared by the player's screens and the PJ view.

/** "+2", "0", "−1" style for bonuses and modifiers. */
export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
