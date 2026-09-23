import type { SchopnostTemplate } from '../types/character';

export const SCHOPNOSTI: readonly SchopnostTemplate[] = [
  { id: 'otevirani-zamku', name: 'Otevírání zámků', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', zakladniSance: 20 },
  { id: 'stopovani', name: 'Stopování', povolani: 'hranicar', odUrovne: 1, kind: 'pasivni' },
];