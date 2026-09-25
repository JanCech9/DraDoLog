// Zvláštní schopnosti podle povolání (str. 34–65).
import type { SchopnostTemplate } from '../types/character';

export const SCHOPNOSTI: readonly SchopnostTemplate[] = [
  // --- válečník (str. 34–36) --------------------------------------------------
  { id: 'zastraseni', name: 'Zastrašení', povolani: 'bojovnik', odUrovne: 1, kind: 'pasivni', popis: 'Hoď k%, vynásob počtem nepřátel a odečti 3 % za každou svou úroveň; PJ porovná s Tabulkou zastrašení (charisma × bojovnost). Stojí jeden útok v kole. Nestvůry s Int > 8 nelze zastrašit; od 3. úrovně lze vybrat jednoho protivníka.' },
  { id: 'poznavani-artefaktu', name: 'Poznávání artefaktů', povolani: 'bojovnik', odUrovne: 1, kind: 'pasivni', popis: 'PJ hází past Žvt + Int + věhlas – 8 (10): proti 8 zbraň poznáš, proti 10 znáš i její zvláštní vlastnosti.' },
  { id: 'presnost', name: 'Přesnost', povolani: 'bojovnik', odUrovne: 1, kind: 'pasivni', popis: 'Za 1 000 zt získaných jednou konkrétní zbraní +1 k útoku touto zbraní, po dalších 3 000 zt +2. Platí i pro střelné a vrhací zbraně.' },
  { id: 'sehranost', name: 'Sehranost', povolani: 'bojovnik', odUrovne: 1, kind: 'pasivni', popis: 'Po 4 společných výcvicích na vyšší úroveň mají sehraní válečníci +1 k útoku, útočí-li v jednom kole na téhož soupeře.' },
  { id: 'lecba-vlastnich-zraneni', name: 'Léčba vlastních zranění', povolani: 'bojovnik', odUrovne: 2, kind: 'pasivni', popis: 'Denně si vyléčíš 2 životy za každou úroveň nad první (léčení 3 životů = 1 směna, vždy alespoň 1 směna). I zranění jedem a psychickými kouzly.' },
  { id: 'odhad-zbrane', name: 'Odhad zbraně', povolani: 'bojovnik', odUrovne: 2, kind: 'pasivni', popis: '2.–3. úroveň: po hodině zkoušení znáš SZ, útočnost a OZ zbraně. 4.–5. úroveň: stačí směna zkoušení nebo hodina pozorování cizího boje.' },
  { id: 'odhad-soupere', name: 'Odhad soupeře', povolani: 'bojovnik', odUrovne: 4, kind: 'pasivni', popis: 'Během boje odhadneš ÚČ, OČ nebo zranitelnost nestvůry (1 parametr za kolo, ohlas PJ předem).' },
  { id: 'vicenasobne-utoky', name: 'Vícenásobné útoky', povolani: 'bojovnik', odUrovne: 5, kind: 'pasivni', popis: 'Tváří v tvář 3 útoky za 2 kola (2 v prvním, 1 ve druhém). V rozšířeném souboji +3 k iniciativě.' },

  // --- hraničář (str. 37–43) --------------------------------------------------
  { id: 'boj-proti-zviratum', name: 'Boj proti zvířatům', povolani: 'hranicar', odUrovne: 1, kind: 'pasivni', popis: '+1 k útoku i obraně proti zvířatům (ne magickým tvorům).' },
  { id: 'stopovani', name: 'Stopování', povolani: 'hranicar', odUrovne: 1, kind: 'pasivni', popis: 'Venku lehký terén 80 %, těžký 50 %; uvnitř 60 % / 40 %; +2 % za úroveň, +3 % za každého tvora navíc, −10 % za každých 24 h stáří stopy. Ověřuj každé 3 směny (+10 %).' },
  { id: 'pes', name: 'Pes', povolani: 'hranicar', odUrovne: 1, kind: 'pasivni', popis: 'Šance 40 % mít psa (k%: 1–20 hlídací, 21–34 lovecký, 35–40 válečný). Hod opakuj při každém postupu, dokud psa nemáš.' },
  { id: 'hranicarska-kouzla', name: 'Hraničářská kouzla', povolani: 'hranicar', odUrovne: 2, kind: 'pasivni', popis: 'Magenergii získáš meditací (3 směny) po důkladném spánku. Kouzlit lze nepřetržitě jen 2× Odl kol, pak 3 směny odpočinku.' },
  { id: 'mimosmyslove-schopnosti', name: 'Mimosmyslová schopnost', povolani: 'hranicar', odUrovne: 4, kind: 'pasivni', popis: 'k%: 1–40 telekineze, 41–75 pyrokineze, 76–100 telepatie. 1 směna soustředění, nejvýše 1× za 7 hodin. Stupeň znalosti = úroveň − 3.' },

  // --- alchymista (str. 43–53) ------------------------------------------------
  { id: 'odolnost-vuci-jedum', name: 'Odolnost vůči jedům', povolani: 'alchymista', odUrovne: 1, kind: 'pasivni', popis: 'K hodům proti jedu si přičítáš dvojnásobek bonusu za odolnost (postih jen poloviční), vždy alespoň o 1 lépe než ostatní.' },
  { id: 'videni-magenergie', name: 'Vidění magenergie', povolani: 'alchymista', odUrovne: 1, kind: 'pasivni', popis: 'Zkoumání předmětu trvá 1 směnu; šance podle množství magenergie a úrovně (2–9 % na 1. úrovni do 400 magů). Neúspěch nelze opakovat do postupu.' },
  { id: 'lucba', name: 'Lučba', povolani: 'alchymista', odUrovne: 1, kind: 'pasivni', popis: 'Výroba předmětů z magenergie (od učitele při každém postupu, neobnovuje se) a surovin (10 zl = 1 mn) v truhle na 100 mn. V boji −10 % za každého nepřítele do 2 sáhů.' },

  // --- kouzelník (str. 54–62) -------------------------------------------------
  { id: 'kouzelnicka-kouzla', name: 'Kouzelnická kouzla', povolani: 'kouzelnik', odUrovne: 1, kind: 'pasivni', popis: 'Magenergii získáš zaostřením vůle (3 směny) po důkladném spánku. Bez gestikulace nebo mluvení dvojnásobná magenergie a −10 % (bez obojího −20 %).' },
  { id: 'odvraceni-nevidenych', name: 'Odvracení neviděných', povolani: 'kouzelnik', odUrovne: 1, kind: 'pasivni', popis: 'Jedno kolo soustředění, hoď 2k6 ≥ číslo z tabulky (1. úroveň: spící hrůza 11; 2.: spící 9, plíživá 11; 3.: 9/9/11/11; 4.: 6/9/9/11/11; 5.: 6/6/9/9/11/11). Neviděné do 6 sáhů utečou (1k6 kusů).' },
  { id: 'vyvolani-pritele', name: 'Vyvolání přítele', povolani: 'kouzelnik', odUrovne: 3, kind: 'pasivni', popis: '3× za život, 13 směn a 11 magů: černá kočka (3 kouzla/den), havran (2, létá) nebo ďáblík (1, teleportace do 20 sáhů). Zda přijde, rozhodne PJ.' },

  // --- zloděj (str. 63–65): Pravděpodobnost úspěchu zloděje -------------------
  { id: 'prevleky', name: 'Převleky', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [5, 10, 15, 20, 25], zavisiNa: [['chs', 3]], popis: 'Jen za stejnou nebo podobnou rasu; zvyšuje šanci na získání důvěry.' },
  { id: 'ziskani-duvery', name: 'Získání důvěry', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [7, 11, 15, 19, 23], zavisiNa: [['chs', 3]], popis: 'Nutný kontakt s obětí alespoň 10 kol.' },
  { id: 'objeveni-mechanismu', name: 'Objevení mechanismů', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [10, 15, 20, 25, 30], zavisiNa: [['obr', 2]], popis: 'Přičítá se k postřehu na mechanismy.' },
  { id: 'objeveni-objektu', name: 'Objevení objektů', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [15, 20, 25, 30, 35], zavisiNa: [['obr', 3]], popis: 'Přičítá se k postřehu na objekty (i při naslouchání).' },
  { id: 'zneskodneni-mechanismu', name: 'Zneškodnění mechanismů', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [15, 20, 25, 30, 35], zavisiNa: [['obr', 2]], popis: 'Vyžaduje zlodějské náčiní; každý pokus trvá 1 směnu. Jen nemagické mechanismy.' },
  { id: 'otevreni-objektu', name: 'Otevření objektů', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [25, 30, 35, 40, 45], zavisiNa: [['obr', 3]], popis: 'Jako zneškodnění mechanismů, ale pro objekty.' },
  { id: 'splhani-po-zdech', name: 'Šplhání po zdech', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [70, 72, 74, 76, 78], zavisiNa: [['obr', 1]], popis: 'Kolmá zeď se spárami; ověřuj každých 10 sáhů, 1 sáh za kolo.' },
  { id: 'skok-z-vysky', name: 'Skok z výšky', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [65, 68, 71, 74, 77], zavisiNa: [['obr', 1]], popis: 'Při úspěchu se zranění počítá z výšky o 5 sáhů nižší.' },
  { id: 'tichy-pohyb', name: 'Tichý pohyb', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [15, 18, 21, 23, 26], zavisiNa: [['obr', 1]], popis: '2 sáhy za kolo, ověřuje se každé kolo; hází PJ.' },
  { id: 'schovani-ve-stinu', name: 'Schování se ve stínu', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [30, 35, 40, 45, 50], zavisiNa: [['obr', 2]], popis: 'Trvá 1 kolo; ve stínu se lze pohybovat, ne útočit; hází PJ.' },
  { id: 'vybirani-kapes', name: 'Vybírání kapes', povolani: 'zlodej', odUrovne: 1, kind: 'procentni', sanceUrovne: [10, 13, 16, 19, 22], zavisiNa: [['chs', 1], ['obr', 1]], popis: 'Nejčastěji 1× za kolo; PJ upravuje podle ostražitosti oběti.' },
  { id: 'probodnuti-ze-zalohy', name: 'Probodnutí ze zálohy', povolani: 'zlodej', odUrovne: 1, kind: 'pasivni', popis: 'Při útoku zezadu zraníš za dvojnásobek rozdílu hodů. Jen zbraně tváří v tvář.' },
];
