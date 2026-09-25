import { derive, mezVyrazeni, postihBojeschopnosti } from '../src/rules/derived';
import { sance, urovenInfo, magenergieZTabulky, stopovani, uspechKouzelnika } from '../src/rules/abilities';
import { rollVlastnosti, rozsahVlastnosti, rollRange } from '../src/rules/dice';
import { catalogFor, fromTemplate } from '../src/data/catalog';
import { SCHOPNOSTI } from '../src/data/abilities';
import { KOUZLA } from '../src/data/spells';
import { RECEPTY } from '../src/data/recipes';
import { createCharacter } from '../src/state/defaultCharacter';
import { proctoNeovlada } from '../src/rules/restrictions';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('FAIL: ' + msg); console.log('ok  ', msg); };

// Krwell example (str. 73): barbar válečník, Sil 16(+2)? Book: ÚČ 8 = meč bastard 6 + Sil +1 + rodová +1 → Sil 13–14.
const c = createCharacter();
c.identity.rasa = 'barbar'; c.identity.povolani = 'bojovnik';
c.vlastnosti = { sil: 14, obr: 13, odl: 16, int: 10, chs: 10 };
c.hp = { current: 7, max: 12 };
const cat = catalogFor('B');
const mec = fromTemplate(cat.find(t => t.templateId === 'mec-bastard')!); (mec as any).equipped = true;
const krouz = fromTemplate(cat.find(t => t.templateId === 'krouzkova-zbroj')!); (krouz as any).equipped = true;
const stit = fromTemplate(cat.find(t => t.templateId === 'stit')!); (stit as any).equipped = true;
c.inventory = [mec, krouz, stit];
let d = derive(c);
assert(d.uc === 8, `Krwell ÚČ 8 (got ${d.uc})`);
assert(d.oc === 6, `Krwell OČ 6 (got ${d.oc})`);
assert(d.oz === 1 && d.stitBonus === 1, `Krwell OZ +1, štít +1`);
assert(d.mezVyrazeni === 2, `Krwell mez vyřazení 2 (12:8=1.5→2) got ${d.mezVyrazeni}`);
assert(d.rodovaZbran, 'meč bastard je rodová zbraň barbara');
assert(mezVyrazeni(13, 7) === 1 && mezVyrazeni(13, 12) === 2, 'Emanuel: mez 1 při 7 žt, 2 při 12 žt');
assert(postihBojeschopnosti(13, { current: 3, max: 12 }) === -1 && postihBojeschopnosti(13, { current: 4, max: 12 }) === 0, 'postih pod třetinou');

// Hrun: barbar Sil 19 (+4), Obr 9 (−1) → pohyblivost 19, nosnost 480, 4× = 1920
const h = createCharacter(); h.identity.rasa = 'barbar'; h.vlastnosti = { sil: 19, obr: 9, odl: 15, int: 10, chs: 10 };
d = derive(h);
assert(d.pohyblivostZakladni === 19 && d.nosnost === 480, `Hrun pohyblivost 19, nosnost 480 (got ${d.pohyblivostZakladni}/${d.nosnost})`);
h.inventory = [{ id: 'x', kind: 'ostatni', name: 'náklad', weight: 1540, qty: 1 }];
d = derive(h);
assert(d.zatizeni === 'tezce' && d.pohyblivost === 5 && d.postihNalozeni === -1, `Hrun velké naložení → pohyblivost 5 (got ${d.pohyblivost})`);
h.inventory = [{ id: 'x', kind: 'ostatni', name: 'náklad', weight: 555, qty: 1 }];
d = derive(h);
assert(d.zatizeni === 'lehce' && d.pohyblivost === 15, `Hrun mírné naložení → 15 (got ${d.pohyblivost})`);

// Sindor: elf kouzelník Int 18, Chr 17, Odl 8 → 9 magů, 5 životů
const s = createCharacter(); s.identity.rasa = 'elf'; s.identity.povolani = 'kouzelnik'; s.vlastnosti = { sil: 8, obr: 12, odl: 8, int: 18, chs: 17 };
assert(magenergieZTabulky(s) === 9, 'Sindor 9 magů');
assert(uspechKouzelnika(18) === 85, 'Sindor 85 % úspěch');
d = derive(s);
assert(d.oc === 1 && d.pohyblivostZakladni === 10, `Sindor OČ 1, pohyblivost 10 (got ${d.oc}/${d.pohyblivostZakladni})`);
assert(d.nosnost === 330, `Sindor nosnost 330 (got ${d.nosnost})`);

// Trn: zloděj 2. úrovně, Obr 15 (+2) → šplhání 74, skok 70
const t = createCharacter(); t.identity.povolani = 'zlodej'; t.identity.uroven = 2; t.vlastnosti = { sil: 10, obr: 15, odl: 10, int: 10, chs: 10 };
const splh = SCHOPNOSTI.find(x => x.id === 'splhani-po-zdech')!; const skok = SCHOPNOSTI.find(x => x.id === 'skok-z-vysky')!;
assert(sance(splh, t) === 74 && sance(skok, t) === 70, `Trn 74 % / 70 % (got ${sance(splh, t)}/${sance(skok, t)})`);

// Kytička: zloděj 475 zt → může na 2. úroveň (325), pak potřebuje 730
const k = createCharacter(); k.identity.povolani = 'zlodej'; k.xp = 475;
let info = urovenInfo(k); assert(info.muze && info.cena === 2 && info.dalsi === 325, 'Kytička může postoupit');
k.identity.uroven = 2; info = urovenInfo(k); assert(info.chybi === 255, `chybí 255 (got ${info.chybi})`);

// Hraničář 3. úrovně: chodba 60 + 6 = 66 (+12 za 5 skřetů řeší PJ)
assert(stopovani(3).uvnitrLehky === 66, 'stopování 66');

// Ranges: elf alchymista odolnost 8–13; barbar válečník síla 14–19; barbar charisma 1–16
assert(String(rozsahVlastnosti('elf', 'alchymista', 'odl')) === '8,13', 'elf alchymista odl 8–13');
assert(String(rozsahVlastnosti('barbar', 'bojovnik', 'sil')) === '14,19', 'barbar válečník síla 14–19');
assert(String(rozsahVlastnosti('barbar', 'bojovnik', 'chs')) === '1,16', 'barbar charisma 1–16');
for (let i = 0; i < 2000; i++) { const r = rollRange(1, 16); if (r < 1 || r > 16) throw new Error('rollRange out of bounds'); }
for (let i = 0; i < 200; i++) { const v = rollVlastnosti('kroll', 'kouzelnik'); for (const x of Object.values(v)) if (x < 1 || x > 21) throw new Error('vlastnost out of range'); }
console.log('ok   rolls within ranges');

// Restrictions
assert(proctoNeovlada('kouzelnik', cat.find(x => x.templateId === 'siroky-mec')!) !== null, 'kouzelník neovládá široký meč');
assert(proctoNeovlada('hranicar', cat.find(x => x.templateId === 'tezka-kuse')!) !== null, 'hraničář neovládá těžkou kuši');
assert(proctoNeovlada('hranicar', cat.find(x => x.templateId === 'platova-zbroj')!) !== null, 'hraničář nenosí plátovou');
assert(proctoNeovlada('bojovnik', cat.find(x => x.templateId === 'rytirska-zbroj')!) === null, 'válečník nosí rytířskou');
assert(proctoNeovlada('zlodej', cat.find(x => x.templateId === 'stit')!) !== null, 'zloděj bez štítu');

// Data integrity
const ids = new Set<string>();
for (const tpl of cat) { if (ids.has(tpl.templateId)) throw new Error('dup templateId ' + tpl.templateId); ids.add(tpl.templateId); }
for (const r of RECEPTY) if (!ids.has(r.vysledekId)) throw new Error('recipe result missing: ' + r.vysledekId);
console.log(`ok   ${cat.length} catalog items, ${KOUZLA.length} spells, ${RECEPTY.length} recipes, ${SCHOPNOSTI.length} abilities`);
