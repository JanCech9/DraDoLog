import type { Character } from '../types/character';

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function createCharacter(): Character {
  return {
    version: 3,
    identity: {
      name: '',
      rasa: 'clovek',
      povolani: 'bojovnik',
      uroven: 1,
      presvedceni: 'neutralni',
    },
    pribeh: '',
    vlastnosti: { sil: 10, obr: 10, odl: 10, int: 10, chs: 10 },
    hp: { current: 10, max: 10 },
    magenergie: { current: 0, max: 0 },
    xp: 0,
    money: 0,
    inventory: [],
    log: [],
    kouzla: [],
    recepty: [],
    schopnostiMod: {},
  };
}
