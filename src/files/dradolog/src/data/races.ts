import type { Rasa, Velikost } from '../types/character';

export interface RasaRysy {
  velikost: Velikost;
  /** Tabulka pohyblivosti ras (str. 83). */
  pohyblivost: number;
  /** +5 % to postřeh na objekty (kroll, barbar, trpaslík) - not for naslouchání. */
  postrehObjekty: number;
  /** +5 % to postřeh na mechanismy (elf, hobit, kudůk). */
  postrehMechanismy: number;
  /** Zvláštní schopnost podle rasy (str. 33). */
  schopnost?: { name: string; popis: string };
  poznamka?: string;
}

export const RASA_RYSY: Record<Rasa, RasaRysy> = {
  hobit: {
    velikost: 'A',
    pohyblivost: 10,
    postrehObjekty: 0,
    postrehMechanismy: 5,
    schopnost: {
      name: 'Čich',
      popis:
        'Vycítí většinu živých tvorů do 12 sáhů (−1 sáh za 30 coulů dřeva, 10 coulů kamene nebo 1 coul kovu). Pozná třídu velikosti, ne druh ani přesnou vzdálenost. Nefunguje ve spánku; necítí kostlivce, rostliny ani tvory A0.',
    },
  },
  kuduk: {
    velikost: 'A',
    pohyblivost: 9,
    postrehObjekty: 0,
    postrehMechanismy: 5,
    poznamka: 'Bez zvláštní schopnosti.',
  },
  trpaslik: {
    velikost: 'A',
    pohyblivost: 8,
    postrehObjekty: 5,
    postrehMechanismy: 0,
    schopnost: {
      name: 'Infravidění',
      popis:
        'Vidí teplo do 20 sáhů - teplokrevné tvory jako červené skvrny. Nefunguje ve slunečním světle, v mlze ani skrz vodní hladinu; studenokrevné a magické tvory (kostlivce) nevidí. Používá se automaticky.',
    },
  },
  elf: {
    velikost: 'B',
    pohyblivost: 12,
    postrehObjekty: 0,
    postrehMechanismy: 5,
    poznamka: 'Bez zvláštní schopnosti.',
  },
  clovek: {
    velikost: 'B',
    pohyblivost: 11,
    postrehObjekty: 0,
    postrehMechanismy: 0,
    poznamka: 'Bez zvláštní schopnosti.',
  },
  barbar: {
    velikost: 'B',
    pohyblivost: 12,
    postrehObjekty: 5,
    postrehMechanismy: 0,
    poznamka: 'Bez zvláštní schopnosti.',
  },
  kroll: {
    velikost: 'C',
    pohyblivost: 11,
    postrehObjekty: 5,
    postrehMechanismy: 0,
    schopnost: {
      name: 'Ultrasluch',
      popis:
        'Sonar do 50 sáhů: určí vzdálenost, tvar a velikost, ne druh tvora. Funguje v mlze i pod vodou, ne v hluku větším než běžný hovor. Musíš ohlásit PJ, že ho používáš.',
    },
  },
};
