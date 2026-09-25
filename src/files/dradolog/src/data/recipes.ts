// Alchymistické předměty (str. 46–53). surovinyCena je v měďácích.
import type { RecipeTemplate } from '../types/character';
import { toMedaky } from '../rules/money';

const zl = (n: number) => toMedaky({ zl: n });

const R = (r: Omit<RecipeTemplate, 'odUrovne'>): RecipeTemplate => ({ odUrovne: 1, ...r });

export const RECEPTY: readonly RecipeTemplate[] = [
  // --- dočasné: lektvary (základ 1/10 čtvrtky tekutiny + flakónek) --------------
  R({ id: 'antigravitacni-cloumak', name: 'Antigravitační cloumák', magCost: 10, surovinyCena: zl(25), vysledekId: 'lektvar-antigravitacni-cloumak', zaklad: 'medovina', trvani: '1 směna', vyroba: '2 směny', popis: 'Stav beztíže jako levitace (zátěž ≤ 2 000 mn). Požití.' }),
  R({ id: 'carovna-rtut', name: 'Čarovná rtuť', magCost: 4, surovinyCena: zl(20), vysledekId: 'carovna-rtut', zaklad: 'rtuť (4 zl)', trvani: '1 úspěšné použití', vyroba: '1 směna', popis: 'Kulička se kutálí k nejbližšímu zlatu, stříbru, platině či drahokamům do 5 sáhů.' }),
  R({ id: 'etericky-olej', name: 'Éterický olej', magCost: 7, surovinyCena: zl(33), vysledekId: 'etericky-olej', zaklad: 'olej', trvani: '1–2 směny', vyroba: '3 směny', popis: 'Zprůsvitnění: nezasažitelný zbraněmi, prochází předměty 1 sáh/směnu. Dotyk (ruce a obličej).' }),
  R({ id: 'lektvar-chladnych-vod', name: 'Lektvar chladných vod', magCost: 5, surovinyCena: zl(12), vysledekId: 'lektvar-chladnych-vod', zaklad: 'voda', trvani: '3 směny', vyroba: '1 směna', popis: 'Dračí oheň a láva zraní jen napůl, obyčejný oheň vůbec. Požití.' }),
  R({ id: 'lektvar-mlhovina', name: 'Lektvar mlhovina', magCost: 5, surovinyCena: zl(11), vysledekId: 'lektvar-mlhovina', zaklad: 'kravské mléko', trvani: '4 směny', vyroba: '3 kola', popis: 'Proměna v oblak mlhy: nezranitelný zbraněmi, protéká škvírami, 5 sáhů/kolo. Požití.' }),
  R({ id: 'lektvar-obri-sily', name: 'Lektvar obří síly', magCost: 25, surovinyCena: zl(35), vysledekId: 'lektvar-obri-sily', zaklad: 'víno', trvani: '1 směna', vyroba: '2 kola', popis: 'Síla +5 (nejvýše 21). Požití.' }),
  R({ id: 'lektvar-rudeho-krize', name: 'Lektvar rudého kříže', magCost: 5, surovinyCena: zl(10), vysledekId: 'lektvar-rudeho-krize', zaklad: 'červené víno', trvani: 'ihned', vyroba: '1 směna', popis: 'Vyléčí 3–8 životů. Další nejdříve za 6 směn, jinak vyřazení na 1k6 směn. Požití.' }),
  R({ id: 'lektvar-vlady-nad-lykantropy', name: 'Lektvar vlády nad lykantropy', magCost: 8, surovinyCena: zl(21), vysledekId: 'lektvar-vlady-nad-lykantropy', zaklad: 'voda', trvani: '1–3 směny', vyroba: '2 směny', popis: 'Lykantrop, který ho vypije, je jako zmámený.' }),
  R({ id: 'lektvar-zmensovani', name: 'Lektvar zmenšování', magCost: 4, surovinyCena: zl(12), vysledekId: 'lektvar-zmensovani', zaklad: 'voda', trvani: '6 směn', vyroba: '1 směna', popis: 'Zmenšení o 2 třídy velikosti (½ dávky = 1 třída). SZ a útočnost zbraní /3. Požití.' }),
  R({ id: 'megacloumak', name: 'Megacloumák', magCost: 4, surovinyCena: zl(11), vysledekId: 'megacloumak', zaklad: 'ocet', trvani: 'ihned', vyroba: '1 směna', popis: 'Odstraní mdloby a ochromení; vzkřísí vyřazenou postavu k pomalé chůzi (max 1 směna). Vdechnutí, návykový, max 1× denně.' }),
  R({ id: 'metamorfoza', name: 'Metamorfóza', magCost: 13, surovinyCena: zl(50), vysledekId: 'lektvar-metamorfoza', zaklad: 'koňská moč', trvani: '3 směny', vyroba: '4 směny', popis: 'Proměna v živou bytost do 8 sáhů (±1 třída velikosti, Int > 1). Požití.' }),
  R({ id: 'pavouci-lektvar', name: 'Pavoučí lektvar', magCost: 3, surovinyCena: zl(15), vysledekId: 'pavouci-lektvar', zaklad: 'pivo', trvani: '2 směny', vyroba: '1 směna', popis: 'Lezení po zdech 70 % (−1 % za 100 mn nákladu, −KZ %), 1 sáh/kolo. Zloděj +30 % ke své schopnosti.' }),
  R({ id: 'rychlost', name: 'Rychlost (lektvar)', magCost: 9, surovinyCena: zl(29), vysledekId: 'lektvar-rychlost', zaklad: 'voda', trvani: '5 kol', vyroba: '3 kola', popis: 'Dvojnásobná rychlost, útoky a obrany. Požití.' }),

  // --- dočasné: svitky (základ pergamen) ---------------------------------------
  R({ id: 'ochrana-pred-dably', name: 'Svitek: ochrana před ďábly', magCost: 50, surovinyCena: zl(75), vysledekId: 'svitek-ochrana-pred-dably', zaklad: 'pergamen', trvani: '2 směny', vyroba: '1 den', doma: true, popis: 'Bariéra o poloměru 3 sáhy (+½ sáhu za úroveň) proti ďáblům.' }),
  R({ id: 'ochrana-pred-nemrtvymi', name: 'Svitek: ochrana před nemrtvými', magCost: 6, surovinyCena: zl(20), vysledekId: 'svitek-ochrana-pred-nemrtvymi', zaklad: 'pergamen', trvani: '4 směny', vyroba: '10 kol', popis: 'Nemrtvý hází proti pasti Roz – 10 – projde/neprojde.' }),
  R({ id: 'ochrana-pred-nevidenymi', name: 'Svitek: ochrana před neviděnými', magCost: 8, surovinyCena: zl(40), vysledekId: 'svitek-ochrana-pred-nevidenymi', zaklad: 'pergamen', trvani: '3 směny', vyroba: '1 směna', popis: 'Neviděný hází proti pasti Roz – 8 – projde/neprojde.' }),
  R({ id: 'ochrana-pred-demony', name: 'Svitek: ochrana před démony', magCost: 10, surovinyCena: zl(60), vysledekId: 'svitek-ochrana-pred-demony', zaklad: 'pergamen', trvani: '4 směny', vyroba: '1 den', doma: true, popis: 'Chrání jen před „volnými“ démony astrálních sfér.' }),
  R({ id: 'ochrana-pred-kouzly', name: 'Svitek: ochrana před kouzly', magCost: 5, surovinyCena: zl(19), vysledekId: 'svitek-ochrana-pred-kouzly', zaklad: 'pergamen', trvani: '3 směny', vyroba: '10 kol', popis: 'Magenergie dle úvahy (zde 5). Kouzla přes bariéru selžou s pravděpodobností (magy svitku ÷ magy kouzla) × 100 %.' }),

  // --- dočasné: ostatní --------------------------------------------------------
  R({ id: 'detekcni-hulka', name: 'Detekční hůlka', magCost: 40, surovinyCena: zl(170), vysledekId: 'detekcni-hulka', zaklad: 'dřevo (1 mn)', trvani: '12 kol vyhledávání', vyroba: '4 dni', doma: true, popis: 'Tiká u východů (i tajných) do 3 sáhů; 2 magy za kolo z 24.' }),
  R({ id: 'lakmusovy-papirek', name: 'Lakmusový papírek', magCost: 2, surovinyCena: zl(5), vysledekId: 'lakmusovy-papirek', zaklad: 'pergamen (1/10 svitku)', trvani: '1 použití', vyroba: '1 směna', popis: 'Za 5 kol určí složení kapaliny, druh lektvaru nebo jedu.' }),
  R({ id: 'pistalka', name: 'Píšťalka', magCost: 30, surovinyCena: zl(25), vysledekId: 'pistalka', zaklad: 'vrbový proutek', trvani: '8 otevření', vyroba: '4 dni', doma: true, popis: 'Otevírá nemagické zámky: 3 kola a 3 magy na zámek.' }),

  // --- nemagické: jedy (1 dávka = 1/10 čtvrtky) ---------------------------------
  R({ id: 'cerna-zhouba', name: 'Jed: černá zhouba', magCost: 0, surovinyCena: zl(48), vysledekId: 'jed-cerna-zhouba', zaklad: 'olej', trvani: 'ihned / 5 kol', vyroba: '5 směn', popis: 'Nebezpečnost 5, síla: ochromení na 1–3 / 3–8 směn. Požití.' }),
  R({ id: 'jablecna-vune', name: 'Jed: jablečná vůně', magCost: 0, surovinyCena: zl(70), vysledekId: 'jed-jablecna-vune', zaklad: 'mošt', trvani: 'ihned / 1 kolo', vyroba: '24 směn', doma: true, popis: 'Nebezpečnost 7, síla —/2–7. Vdechnutí, zasáhne vše do 1,5 sáhu.' }),
  R({ id: 'kurare', name: 'Jed: kurare', magCost: 0, surovinyCena: zl(100), vysledekId: 'jed-kurare', zaklad: 'borůvková šťáva', trvani: 'ihned / 1 kolo', vyroba: '1 den', doma: true, popis: 'Nebezpečnost 4, síla —/10–100. Krev - na zbraně, účinkuje jen při prvním zásahu.' }),
  R({ id: 'melenova-pomsta', name: 'Jed: Melenova pomsta', magCost: 1, surovinyCena: zl(60), vysledekId: 'jed-melenova-pomsta', zaklad: 'voda', trvani: 'ihned / 1 směna', vyroba: '10 směn', popis: 'Nebezpečnost 7, síla 1–6/2–12. Bez chuti a zápachu, jen do nápojů.' }),

  // --- nemagické: výbušniny a zbraně --------------------------------------------
  R({ id: 'bomba', name: 'Bomba', magCost: 0, surovinyCena: zl(65), vysledekId: 'bomba', zaklad: 'železná koule, dřevo (200 mn / 5 zl)', trvani: 'ihned', vyroba: '4 hodiny', doma: true, popis: 'Doutnák 1–3 kola, zraní vše do 3 sáhů za 6–21 (3k6+3). Po 10–15 dnech zvlhne.' }),
  R({ id: 'ohniva-hlina', name: 'Ohnivá hlína', magCost: 0, surovinyCena: zl(20), vysledekId: 'ohniva-hlina', zaklad: 'hlína (10 mn)', trvani: 'ihned', vyroba: '8 kol', popis: 'Vrhá se jako olej, zásah 6–11 životů. Po 7–12 dnech samovolně vybuchne.' }),
  R({ id: 'hvezdice-bumerang', name: 'Hvězdice-bumerang', magCost: 5, surovinyCena: zl(10), vysledekId: 'hvezdice-bumerang', zaklad: 'hvězdice', trvani: 'stále', vyroba: '1 den', doma: true, popis: 'Mine-li, vrátí se v témže kole.' }),
  R({ id: 'zubate-ostri', name: 'Zubaté ostří', magCost: 1, surovinyCena: zl(10), vysledekId: 'zubate-ostri', zaklad: 'dýka', trvani: 'stále', vyroba: '1 den', doma: true, popis: 'Dýka se SZ 1 a útočností 3.' }),
];
