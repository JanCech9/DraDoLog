import type { DistributiveOmit, Item, TridaZbrane, Velikost } from '../types/character';
import { toMedaky } from '../rules/money';
import { newId } from '../state/defaultCharacter';

export type ItemTemplate = DistributiveOmit<Item, 'id' | 'qty' | 'equipped' | 'note'> & {
  templateId: string;
  /** In měďáky. 0 = the book gives no price ("cena dle PJ"). */
  price: number;
  /** Merge into an existing stack instead of adding a new row */
  stackable?: boolean;
  /** Hidden from the shop (alchemist products, loot only). */
  shop?: boolean;
};

const zl = (n: number) => toMedaky({ zl: n });
const st = (n: number) => toMedaky({ st: n });
const md = (n: number) => toMedaky({ md: n });

type ZbranT = Extract<ItemTemplate, { kind: 'zbran' }>;
type StrelnaT = Extract<ItemTemplate, { kind: 'strelna' }>;

function zbran(
  templateId: string,
  name: string,
  trida: TridaZbrane,
  sila: number,
  utocnost: number,
  obrana: number,
  delka: string,
  weight: number,
  price: number,
  opts: { obourucni?: boolean; ztraciIniciativu?: boolean } = {},
): ZbranT {
  return {
    templateId,
    kind: 'zbran',
    name,
    trida,
    sila,
    utocnost,
    obrana,
    delka,
    weight,
    price,
    obourucni: opts.obourucni ?? false,
    iniciativa: opts.ztraciIniciativu ? -2 : 0,
  };
}

function strelna(
  templateId: string,
  name: string,
  trida: TridaZbrane,
  sila: number,
  utocnost: number,
  dostrel: [number, number, number],
  weight: number,
  price: number,
  opts: { municeId?: string; vrhaci?: boolean; tezkaKuse?: boolean } = {},
): StrelnaT {
  return {
    templateId,
    kind: 'strelna',
    name,
    trida,
    sila,
    utocnost,
    dostrel,
    weight,
    price,
    vrhaci: opts.vrhaci ?? false,
    ...(opts.municeId ? { municeId: opts.municeId } : {}),
    ...(opts.tezkaKuse ? { tezkaKuse: true } : {}),
  };
}

// --- Tabulka zbraní pro boj tváří v tvář (str. 68) ---------------------------
const ZBRANE: readonly ZbranT[] = [
  // jednoruční - lehké
  zbran('dyka', 'Dýka', 'lehka', 2, 0, -2, '1', 5, zl(1)),
  zbran('tesak', 'Tesák', 'lehka', 3, -1, -2, '1', 12, zl(4)),
  zbran('kratky-mec', 'Krátký meč', 'lehka', 4, -1, -1, '1', 20, zl(16)),
  zbran('obusek', 'Obušek', 'lehka', 3, -2, -2, '1', 8, st(2)),
  zbran('palcat', 'Palcát', 'lehka', 3, 1, -1, '1', 20, zl(8)),
  // jednoruční - střední
  zbran('savle', 'Šavle', 'stredni', 4, 2, 1, '1', 25, zl(32)),
  zbran('siroky-mec', 'Široký meč', 'stredni', 5, 0, 0, '1', 30, zl(24)),
  zbran('sekera', 'Sekera', 'stredni', 3, 1, -1, '1', 30, st(10)),
  zbran('kyj', 'Kyj', 'stredni', 3, 2, -1, '1', 35, st(8)),
  // jednoruční - těžké
  zbran('mec-bastard', 'Meč bastard', 'tezka', 6, 0, 1, '1', 40, zl(32)),
  zbran('dlouhy-mec', 'Dlouhý meč', 'tezka', 7, -1, 0, '1–2', 50, zl(40)),
  zbran('valecne-kladivo', 'Válečné kladivo', 'tezka', 5, 2, -1, '1', 50, zl(2)),
  zbran('remdih', 'Řemdih', 'tezka', 4, 3, -2, '1–2', 50, zl(1)),
  // obouruční - lehké
  zbran('hul-okovana', 'Hůl okovaná', 'lehka', 5, -1, 1, '2', 20, st(7), { obourucni: true }),
  zbran('dve-dyky', 'Dvě dýky', 'lehka', 3, 1, 2, '1', 10, zl(2), { obourucni: true }),
  // obouruční - střední
  zbran('vidle', 'Vidle', 'stredni', 4, 0, 1, '2', 50, zl(1), { obourucni: true }),
  zbran('kopi', 'Kopí', 'stredni', 5, 0, 1, '1–2', 60, zl(1), { obourucni: true }),
  zbran('valecna-sekera', 'Válečná sekera', 'stredni', 4, 3, -1, '1–2', 75, zl(4), { obourucni: true, ztraciIniciativu: true }),
  zbran('sudlice', 'Sudlice', 'stredni', 5, 1, 1, '2', 75, zl(1), { obourucni: true, ztraciIniciativu: true }),
  zbran('pika', 'Píka', 'stredni', 5, 2, 1, '2–3', 70, zl(1) + st(5), { obourucni: true, ztraciIniciativu: true }),
  zbran('tesak-a-dyka', 'Tesák a dýka', 'stredni', 4, 0, 2, '1', 17, zl(5), { obourucni: true }),
  zbran('kratky-mec-a-dyka', 'Krátký meč a dýka', 'stredni', 5, 0, 3, '1', 25, zl(17), { obourucni: true }),
  // obouruční - těžké
  zbran('cep', 'Cep', 'tezka', 5, 4, -1, '2', 70, st(8), { obourucni: true, ztraciIniciativu: true }),
  zbran('halapartna', 'Halapartna', 'tezka', 4, 6, 2, '2', 85, zl(4), { obourucni: true, ztraciIniciativu: true }),
  zbran('obourucni-mec', 'Obouruční meč', 'tezka', 7, 1, -1, '1–2', 85, zl(56), { obourucni: true, ztraciIniciativu: true }),
  zbran('tezky-kyj', 'Těžký kyj', 'tezka', 5, 4, -1, '1–2', 90, zl(2), { obourucni: true, ztraciIniciativu: true }),
  zbran('trojzubec', 'Trojzubec', 'tezka', 6, 2, 2, '1–2', 95, zl(1), { obourucni: true, ztraciIniciativu: true }),
  zbran('dve-savle', 'Dvě šavle', 'tezka', 8, -2, 3, '1', 50, zl(64), { obourucni: true }),
  zbran('siroky-mec-a-dyka', 'Široký meč a dýka', 'tezka', 5, -1, 2, '1', 35, zl(25), { obourucni: true }),
  zbran('siroky-mec-a-tesak', 'Široký meč a tesák', 'tezka', 6, -2, 2, '1', 42, zl(28), { obourucni: true }),
  // improvizované
  zbran('pochoden-zbran', 'Pochodeň (jako zbraň)', 'lehka', 4, -4, -1, '1', 10, md(1)),
];

// --- Tabulka zbraní pro střelecký souboj (str. 75) ---------------------------
const STRELNE: readonly StrelnaT[] = [
  // střelné
  strelna('kratky-luk', 'Krátký luk', 'stredni', 4, 0, [10, 20, 30], 7, zl(4), { municeId: 'sipy' }),
  strelna('dlouhy-luk', 'Dlouhý luk', 'stredni', 5, 1, [15, 30, 50], 10, zl(16), { municeId: 'sipy' }),
  strelna('lehka-kuse', 'Lehká kuše', 'stredni', 4, 1, [15, 27, 40], 20, zl(32), { municeId: 'sipky' }),
  strelna('tezka-kuse', 'Těžká kuše', 'tezka', 6, 2, [19, 35, 55], 60, zl(44), { municeId: 'sipky', tezkaKuse: true }),
  strelna('prak', 'Prak', 'lehka', 4, -1, [9, 16, 25], 5, st(1), { municeId: 'kameny' }),
  // vrhací - lehké
  strelna('dyka-vrh', 'Dýka (vrhací)', 'lehka', 2, 0, [5, 9, 12], 5, zl(1), { vrhaci: true }),
  strelna('hvezdice', 'Hvězdice', 'lehka', 3, -1, [3, 7, 11], 3, st(6), { vrhaci: true }),
  strelna('kamen', 'Kámen', 'lehka', 1, 0, [7, 11, 15], 7, 0, { vrhaci: true }),
  strelna('flakonek-vrh', 'Flakónek (svěcená voda, lektvar)', 'lehka', 0, 0, [5, 9, 13], 5, 0, { vrhaci: true }),
  strelna('lahev-vrh', 'Lahev (olej, voda)', 'lehka', 0, 1, [4, 7, 10], 15, 0, { vrhaci: true }),
  strelna('pochoden-vrh', 'Pochodeň (vrhací)', 'lehka', 0, 1, [4, 7, 10], 10, md(1), { vrhaci: true }),
  // vrhací - střední
  strelna('kopi-vrh', 'Kopí (vrhací)', 'stredni', 5, 0, [5, 10, 15], 60, zl(1), { vrhaci: true }),
  strelna('ostep', 'Oštěp', 'stredni', 5, 1, [6, 14, 23], 12, st(4), { vrhaci: true }),
  strelna('sekera-vrh', 'Sekera (vrhací)', 'stredni', 3, 1, [4, 8, 12], 30, st(10), { vrhaci: true }),
  strelna('vidle-vrh', 'Vidle (vrhací)', 'stredni', 4, 0, [3, 5, 7], 50, zl(1), { vrhaci: true }),
];

// --- Munice (str. 75) --------------------------------------------------------
const MUNICE: readonly ItemTemplate[] = [
  { templateId: 'sipy', kind: 'ostatni', name: 'Šípy', weight: 2, price: md(1), stackable: true },
  { templateId: 'sipky', kind: 'ostatni', name: 'Šipky do kuše', weight: 2, price: md(1), stackable: true },
  { templateId: 'stribrne-sipy', kind: 'ostatni', name: 'Stříbrné šípy', weight: 2, price: zl(1), stackable: true },
  { templateId: 'kameny', kind: 'ostatni', name: 'Kameny do praku', weight: 7, price: 0, stackable: true },
  { templateId: 'toulec', kind: 'ostatni', name: 'Toulec (na 10–20 šípů)', weight: 10, price: st(5) },
];

// --- Tabulka kvality zbroje (str. 71): weight and price differ by size -------
interface ZbrojSpec {
  templateId: string;
  name: string;
  kz: number;
  weight: Record<Velikost, number>;
  price: Record<Velikost, number>;
}
const ZBROJE: readonly ZbrojSpec[] = [
  { templateId: 'vycpavana-zbroj', name: 'Vycpávaná zbroj', kz: 2, weight: { A: 35, B: 50, C: 60 }, price: { A: zl(14), B: zl(16), C: zl(18) } },
  { templateId: 'kozena-zbroj', name: 'Kožená zbroj', kz: 3, weight: { A: 55, B: 80, C: 100 }, price: { A: zl(16), B: zl(20), C: zl(24) } },
  { templateId: 'supinova-zbroj', name: 'Šupinová zbroj', kz: 4, weight: { A: 120, B: 170, C: 205 }, price: { A: zl(100), B: zl(120), C: zl(135) } },
  { templateId: 'krouzkova-zbroj', name: 'Kroužková zbroj', kz: 5, weight: { A: 250, B: 350, C: 420 }, price: { A: zl(240), B: zl(300), C: zl(340) } },
  { templateId: 'platova-zbroj', name: 'Plátová zbroj', kz: 6, weight: { A: 280, B: 400, C: 480 }, price: { A: zl(280), B: zl(350), C: zl(400) } },
  { templateId: 'rytirska-zbroj', name: 'Rytířská zbroj', kz: 7, weight: { A: 350, B: 500, C: 600 }, price: { A: zl(700), B: zl(800), C: zl(850) } },
];
const STIT_SPEC = { weight: { A: 35, B: 50, C: 60 }, price: { A: zl(4), B: zl(5), C: zl(6) } } as const;

// --- Výstroj (str. 30–31). Prices the book leaves to the PJ are 0. ----------
const VYSTROJ: readonly ItemTemplate[] = [
  { templateId: 'kozena-torna', kind: 'ostatni', name: 'Kožená torna (na 800 mn)', weight: 20, price: 0 },
  { templateId: 'velky-vak', kind: 'ostatni', name: 'Velký vak (na 500 mn)', weight: 12, price: 0 },
  { templateId: 'maly-vak', kind: 'ostatni', name: 'Malý vak (na 150 mn)', weight: 7, price: 0 },
  { templateId: 'mech-na-vodu', kind: 'ostatni', name: 'Měch na vodu (plný)', weight: 25, price: 0 },
  { templateId: 'flakonek', kind: 'ostatni', name: 'Flakónek (prázdný)', weight: 3, price: 0, stackable: true },
  { templateId: 'lahev', kind: 'ostatni', name: 'Láhev (prázdná)', weight: 5, price: 0, stackable: true },
  { templateId: 'lahev-oleje', kind: 'ostatni', name: 'Láhev oleje', weight: 15, price: 0, stackable: true },
  { templateId: 'lahev-vina', kind: 'ostatni', name: 'Láhev vína / medoviny', weight: 15, price: 0, stackable: true },
  { templateId: 'jidlo-tyden', kind: 'ostatni', name: 'Jídlo na týden (trvanlivé)', weight: 175, price: 0, stackable: true },
  { templateId: 'jidlo-tyden-dehydrovane', kind: 'ostatni', name: 'Jídlo na týden (dehydrované)', weight: 35, price: 0, stackable: true },
  { templateId: 'pochoden', kind: 'ostatni', name: 'Pochodeň (6 sáhů, 3 směny)', weight: 10, price: md(1), stackable: true },
  { templateId: 'lucerna', kind: 'ostatni', name: 'Lucerna (8 sáhů)', weight: 30, price: 0 },
  { templateId: 'kresadlo', kind: 'ostatni', name: 'Křesadlo', weight: 2, price: 0 },
  { templateId: 'vlci-mor', kind: 'ostatni', name: 'Vlčí mor (svazeček)', weight: 1, price: 0, stackable: true },
  { templateId: 'svecena-voda', kind: 'ostatni', name: 'Svěcená voda (flakónek)', weight: 5, price: 0, stackable: true },
  { templateId: 'hul', kind: 'ostatni', name: 'Hůl dřevěná (1,5 sáhu)', weight: 10, price: 0 },
  { templateId: 'provaz', kind: 'ostatni', name: 'Provaz (1 sáh)', weight: 2, price: 0, stackable: true },
  { templateId: 'zrcatko', kind: 'ostatni', name: 'Zrcátko kovové', weight: 2, price: 0 },
  { templateId: 'pergamen', kind: 'ostatni', name: 'Pergamen (10 svitků)', weight: 1, price: 0, stackable: true },
  { templateId: 'kladivo', kind: 'ostatni', name: 'Kladivo', weight: 15, price: 0 },
  { templateId: 'hrebiky', kind: 'ostatni', name: 'Železné hřebíky (tucet)', weight: 2, price: 0, stackable: true },
  { templateId: 'saty', kind: 'ostatni', name: 'Šaty', weight: 80, price: 0 },
  { templateId: 'zlodejske-nacini', kind: 'ostatni', name: 'Zlodějské náčiní', weight: 20, price: zl(30) },
  { templateId: 'alchymisticka-truhla', kind: 'ostatni', name: 'Alchymistická truhla (100 mn)', weight: 15, price: zl(50) },
];

// --- Alchymistické předměty (str. 46–53): made with recipes, not bought ------
const ALCHYMIE: readonly ItemTemplate[] = [
  // lektvary (flakónek, 5 mn)
  { templateId: 'lektvar-antigravitacni-cloumak', kind: 'ostatni', name: 'Antigravitační cloumák', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'carovna-rtut', kind: 'ostatni', name: 'Čarovná rtuť', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'etericky-olej', kind: 'ostatni', name: 'Éterický olej', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'lektvar-chladnych-vod', kind: 'ostatni', name: 'Lektvar chladných vod', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'lektvar-mlhovina', kind: 'ostatni', name: 'Lektvar mlhovina', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'lektvar-obri-sily', kind: 'ostatni', name: 'Lektvar obří síly', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'lektvar-rudeho-krize', kind: 'ostatni', name: 'Lektvar rudého kříže', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'lektvar-vlady-nad-lykantropy', kind: 'ostatni', name: 'Lektvar vlády nad lykantropy', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'lektvar-zmensovani', kind: 'ostatni', name: 'Lektvar zmenšování', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'megacloumak', kind: 'ostatni', name: 'Megacloumák', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'lektvar-metamorfoza', kind: 'ostatni', name: 'Metamorfóza (lektvar)', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'pavouci-lektvar', kind: 'ostatni', name: 'Pavoučí lektvar', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'lektvar-rychlost', kind: 'ostatni', name: 'Rychlost (lektvar)', weight: 5, price: 0, stackable: true, shop: false },
  // svitky (10 ks = 1 mn)
  { templateId: 'svitek-ochrana-pred-dably', kind: 'ostatni', name: 'Svitek: ochrana před ďábly', weight: 1, price: 0, stackable: true, shop: false },
  { templateId: 'svitek-ochrana-pred-nemrtvymi', kind: 'ostatni', name: 'Svitek: ochrana před nemrtvými', weight: 1, price: 0, stackable: true, shop: false },
  { templateId: 'svitek-ochrana-pred-nevidenymi', kind: 'ostatni', name: 'Svitek: ochrana před neviděnými', weight: 1, price: 0, stackable: true, shop: false },
  { templateId: 'svitek-ochrana-pred-demony', kind: 'ostatni', name: 'Svitek: ochrana před démony', weight: 1, price: 0, stackable: true, shop: false },
  { templateId: 'svitek-ochrana-pred-kouzly', kind: 'ostatni', name: 'Svitek: ochrana před kouzly', weight: 1, price: 0, stackable: true, shop: false },
  // ostatní dočasné
  { templateId: 'detekcni-hulka', kind: 'ostatni', name: 'Detekční hůlka', weight: 1, price: 0, shop: false },
  { templateId: 'lakmusovy-papirek', kind: 'ostatni', name: 'Lakmusový papírek', weight: 1, price: 0, stackable: true, shop: false },
  { templateId: 'pistalka', kind: 'ostatni', name: 'Píšťalka (8 otevření)', weight: 1, price: 0, shop: false },
  // nemagické
  { templateId: 'jed-cerna-zhouba', kind: 'ostatni', name: 'Jed: černá zhouba', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'jed-jablecna-vune', kind: 'ostatni', name: 'Jed: jablečná vůně', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'jed-kurare', kind: 'ostatni', name: 'Jed: kurare', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'jed-melenova-pomsta', kind: 'ostatni', name: 'Jed: Melenova pomsta', weight: 5, price: 0, stackable: true, shop: false },
  { templateId: 'bomba', kind: 'ostatni', name: 'Bomba', weight: 200, price: 0, stackable: true, shop: false },
  { templateId: 'ohniva-hlina', kind: 'ostatni', name: 'Ohnivá hlína', weight: 10, price: 0, stackable: true, shop: false },
  { ...strelna('hvezdice-bumerang', 'Hvězdice-bumerang', 'lehka', 3, -1, [3, 7, 11], 3, 0, { vrhaci: true }), shop: false },
  { ...zbran('zubate-ostri', 'Zubaté ostří', 'lehka', 1, 3, -2, '1', 5, 0), shop: false },
];

/** Full catalog with armour and shield sized for the given size class. */
export function catalogFor(velikost: Velikost): readonly ItemTemplate[] {
  const zbroje: ItemTemplate[] = ZBROJE.map((z) => ({
    templateId: z.templateId,
    kind: 'zbroj',
    name: z.name,
    ochrana: z.kz,
    weight: z.weight[velikost],
    price: z.price[velikost],
  }));
  const stit: ItemTemplate = {
    templateId: 'stit',
    kind: 'stit',
    name: 'Štít',
    obrana: 1,
    weight: STIT_SPEC.weight[velikost],
    price: STIT_SPEC.price[velikost],
  };
  return [...ZBRANE, ...STRELNE, ...MUNICE, ...zbroje, stit, ...VYSTROJ, ...ALCHYMIE];
}

/** Catalog for a size-B character (weights for A/C differ only for armour). */
export const CATALOG: readonly ItemTemplate[] = catalogFor('B');

const AMMO_IDS = new Set(
  CATALOG.flatMap((t) => (t.kind === 'strelna' && t.municeId ? [t.municeId] : [])),
);

/** Catalog items that some ranged weapon uses as ammo. */
export const AMMO_TEMPLATES = CATALOG.filter((t) => AMMO_IDS.has(t.templateId));

export function findTemplate(templateId: string | undefined, velikost: Velikost = 'B'): ItemTemplate | undefined {
  if (!templateId) return undefined;
  return catalogFor(velikost).find((t) => t.templateId === templateId);
}

export function fromTemplate(t: ItemTemplate, qty = 1): Item {
  const { price: _p, stackable: _s, shop: _h, ...rest } = t;
  const base = { ...rest, id: newId(), qty };
  return (rest.kind === 'ostatni' ? base : { ...base, equipped: false }) as Item;
}
