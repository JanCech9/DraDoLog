import type { Rasa } from '../types/character';

export const RASA_RYSY: Record<Rasa, { velikost: 'A' | 'B' | 'C'; infravideni: boolean; poznamka?: string }> = {
  clovek:   { velikost: 'B', infravideni: false },
  trpaslik: { velikost: 'A', infravideni: true },
  elf:      { velikost: 'B', infravideni: true },
  hobit:    { velikost: 'A', infravideni: false },
  kroll:    { velikost: 'C', infravideni: true },
  barbar:   { velikost: 'B', infravideni: false },
};