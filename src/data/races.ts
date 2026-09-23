// ⚠ Every number here is a PLACEHOLDER (0). Copy the real values out of
// Pravidla DrD 1.6 - the ids and kinds are what the rest of the code uses.

import type { Rasa, RysTemplate } from '../types/character';

export const VELIKOST: Record<Rasa, 'A' | 'B' | 'C'> = {
  clovek: 'B',
  trpaslik: 'A',
  elf: 'B',
  hobit: 'A',
  kroll: 'C',
  barbar: 'B',
};

export const RYSY: readonly RysTemplate[] = [
  // Trpaslík
  { id: 'trpaslik-infra', name: 'Infravidění', rasa: 'trpaslik', kind: 'dosah', hodnota: 0 },
  { id: 'trpaslik-nerosty', name: 'Rozpoznání nerostů', rasa: 'trpaslik', kind: 'procentni', hodnota: 0 },
  { id: 'trpaslik-smer', name: 'Určení směru pod zemí', rasa: 'trpaslik', kind: 'procentni', hodnota: 0 },

  // Hobit
  { id: 'hobit-cich', name: 'Čich', rasa: 'hobit', kind: 'procentni', hodnota: 0 },
  { id: 'hobit-sluch', name: 'Sluch', rasa: 'hobit', kind: 'procentni', hodnota: 0 },
  { id: 'hobit-vrh', name: 'Vrhací zbraně', rasa: 'hobit', kind: 'pasivni', popis: 'Bonus k ÚČ - doplň podle pravidel' },

  // Elf
  { id: 'elf-zrak', name: 'Noční vidění', rasa: 'elf', kind: 'dosah', hodnota: 0 },
  { id: 'elf-tajne-dvere', name: 'Odhalení tajných dveří', rasa: 'elf', kind: 'procentni', hodnota: 0 },

  // Kroll
  { id: 'kroll-infra', name: 'Infravidění', rasa: 'kroll', kind: 'dosah', hodnota: 0 },

  // Barbar
  { id: 'barbar-orientace', name: 'Orientace v přírodě', rasa: 'barbar', kind: 'procentni', hodnota: 0 },
];