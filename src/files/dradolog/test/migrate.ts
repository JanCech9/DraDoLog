import { normalizeCharacter } from '../src/state/useCharacter';
import { derive } from '../src/rules/derived';
const v2 = {
  version: 2,
  identity: { name: 'Ghort', rasa: 'trpaslik', povolani: 'bojovnik', uroven: 3, presvedceni: 'Zákonné dobro' },
  pribeh: '', vlastnosti: { sil: 16, obr: 9, odl: 15, int: 8, chs: 5 },
  hp: { current: 20, max: 24 }, magenergie: { current: 0, max: 0 }, xp: 1000, money: 1234,
  inventory: [
    { id: 'a', kind: 'zbran', name: 'Dlouhý meč', templateId: 'dlouhy-mec', weight: 50, qty: 1, equipped: true, utocnost: 3, obrana: 1, iniciativa: 0 },
    { id: 'b', kind: 'zbran', name: 'Trollí tesák', weight: 12, qty: 1, equipped: false, utocnost: 3, obrana: -2, iniciativa: 0 },
    { id: 'c', kind: 'strelna', name: 'Krátký luk', templateId: 'kratky-luk', weight: 20, qty: 1, equipped: true, utocnost: 1, dostrel: [10, 25, 50], municeId: 'sipy' },
    { id: 'd', kind: 'zbroj', name: 'Kroužková zbroj', templateId: 'krouzkova-zbroj', weight: 300, qty: 1, equipped: true, ochrana: 3 },
    { id: 'e', kind: 'ostatni', name: 'Šípy', templateId: 'sipy', weight: 1, qty: 17 },
  ],
  log: [], kouzla: [], recepty: [], schopnostiMod: {},
};
const c = normalizeCharacter(JSON.parse(JSON.stringify(v2)))!;
const z = c.inventory[0]; if (z.kind !== 'zbran' || z.sila !== 7 || z.utocnost !== -1 || z.trida !== 'tezka' || !z.equipped) throw new Error('catalog weapon not restored: ' + JSON.stringify(z));
const t = c.inventory[1]; if (t.kind !== 'zbran' || t.sila !== 3 || t.utocnost !== 0 || t.obrana !== -2) throw new Error('custom weapon migration: ' + JSON.stringify(t));
const l = c.inventory[2]; if (l.kind !== 'strelna' || l.sila !== 4 || l.dostrel.join() !== '10,20,30' || l.municeId !== 'sipy') throw new Error('bow: ' + JSON.stringify(l));
const a = c.inventory[3]; if (a.kind !== 'zbroj' || a.ochrana !== 5 || a.weight !== 250) throw new Error('armour resized for A: ' + JSON.stringify(a));
if (c.identity.presvedceni !== 'zakonne-dobro' || c.version !== 3) throw new Error('header');
const d = derive(c);
console.log('ok   v2 → v3 migration; Ghort ÚČ', d.uc, 'OČ', d.oc, 'munice', d.munice, 'mez', d.mezVyrazeni);
if (d.uc !== 9 || d.oc !== 4 || d.munice !== 17) throw new Error('derived after migration');
