// ─── SEED DATA — Farmer J ProMap ─────────────────────────────────────────────
// Brand: Forest #1B361D | Peach #F5B47A | Rust #CC593B | Off-White #F3DFD1
//
// DATA FLOW (critical — must be preserved):
//   SQL → AvgTable (excl. Buffet6/Bundles) → MenuDatabase → Calculations
//   → Manager confirms Breakfast + Lunch → drives PCR / FOH / Sections / OrderSheet / PAR
//
// WEEK MODEL: locked (prev) / current / next
//   Week auto-locks Sunday midnight. Carry-overs with remaining shelf life flow forward.
//   Catering orders do NOT auto-clear — must be cleared manually.
//
// AVERAGES include ALL sales channels EXCEPT: Buffet for 6, Bundles categories
//
// prepTiming: 'TODAY'|'TOMORROW'|'2-DAY'|'3-DAY'
// pcrPage: 1=production today | 2=preparation today | 3=breakfast
// prepGroup: 1|2|3 for dressings (Smart Kitchen schedule)
//   1: Mon→Tue/Wed, Wed→Thu/Fri, Fri→Sat/Sun/Mon  (2-3 day shelf life)
//   2: Mon→Mon-Wed, Wed→Thu/Fri, Fri→Sat/Sun       (3-4 day shelf life)
//   3: Tue→Wed-Fri, Fri→Sat-Tue                    (5-7 day shelf life)

export const BRAND = {
  forest:   '#1B361D',
  peach:    '#F5B47A',
  rust:     '#CC593B',
  offWhite: '#F3DFD1',
  darkRust: '#8B3A1E',
  mustard:  '#C89B3C',
  khaki:    '#7A8C5A',
  lightPink:'#F2D5C8',
  darkForest:'#0F1F10',
};

export const SHOPS = [
  {shopNo:1,  name:'Finsbury Avenue',     region:'City',    active:true, hasSecondLine:true,  floors:1},
  {shopNo:2,  name:'Canada Place',        region:'East',    active:true, hasSecondLine:false, floors:1},
  {shopNo:4,  name:'King William',        region:'City',    active:true, hasSecondLine:false, floors:1},
  {shopNo:5,  name:'Jubilee Place',       region:'East',    active:true, hasSecondLine:true,  floors:1},
  {shopNo:6,  name:"St Paul's",           region:'City',    active:true, hasSecondLine:true,  floors:1},
  {shopNo:7,  name:'Regent St',           region:'West',    active:true, hasSecondLine:true,  floors:2},
  {shopNo:8,  name:'London Bridge',       region:'South',   active:true, hasSecondLine:true,  floors:1},
  {shopNo:10, name:'Orchard Place',       region:'East',    active:true, hasSecondLine:false, floors:1},
  {shopNo:11, name:'Fenchurch',           region:'City',    active:true, hasSecondLine:true,  floors:1},
  {shopNo:12, name:'Piccadilly',          region:'West',    active:true, hasSecondLine:true,  floors:2},
  {shopNo:13, name:'Hammersmith',         region:'West',    active:true, hasSecondLine:false, floors:1},
  {shopNo:14, name:'Holborn',             region:'Central', active:true, hasSecondLine:true,  floors:1},
  {shopNo:15, name:'Russell Square',      region:'Central', active:true, hasSecondLine:false, floors:1},
  {shopNo:17, name:'Farringdon',          region:'City',    active:true, hasSecondLine:true,  floors:1},
  {shopNo:18, name:'Marylebone',          region:'Central', active:true, hasSecondLine:false, floors:2},
  {shopNo:19, name:'Tottenham Court Road',region:'Central', active:true, hasSecondLine:true,  floors:1},
  {shopNo:20, name:'Coleman Street',      region:'City',    active:true, hasSecondLine:true,  floors:1},
  {shopNo:21, name:'Old Broad Street',    region:'City',    active:true, hasSecondLine:false, floors:1},
];

export const USERS = [
  {id:1, email:'jana@farmerj.com',                name:'Jana',               role:'Admin',        password:'FarmerJ2026!', shops:'all', mustChangePassword:false},
  {id:2, email:'headoffice@farmerj.com',         name:'Head Office',        role:'Head Office',  password:'FarmerJ2026!', shops:'all', mustChangePassword:true},
  {id:3, email:'ops.city@farmerj.com',           name:'City Ops',           role:'Ops Manager',  password:'FarmerJ2026!', shops:[1,4,5,6,11,17,20,21], mustChangePassword:true},
  {id:4, email:'ops.west@farmerj.com',           name:'West Ops',           role:'Ops Manager',  password:'FarmerJ2026!', shops:[7,12,13], mustChangePassword:true},
  {id:5, email:'manager.holborn@farmerj.com',    name:'Holborn Manager',    role:'Shop Manager', password:'FarmerJ2026!', shops:[14], mustChangePassword:true},
  {id:6, email:'manager.coleman@farmerj.com',    name:'Coleman St Manager', role:'Shop Manager', password:'FarmerJ2026!', shops:[20], mustChangePassword:true},
  {id:7, email:'manager.farringdon@farmerj.com', name:'Farringdon Manager', role:'Shop Manager', password:'FarmerJ2026!', shops:[17], mustChangePassword:true},
];

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
// dp: B=Breakfast | L=Lunch | C=Catering
// cateringType: 'buffet6'|'bundles' = excluded from averages | 'reference' = in averages
// pcrColumn: 'mains'|'batch'|'salads'|'bases'|null
// trayCalc: 'multiply'|'divide' for PCR tray count
export const PRODUCTS = [
  // ── BREAKFAST ──────────────────────────────────────────────────────────────
  {plu:'1002043',  name:"Farmer's Egg + Bacon Roll",                   dp:'B', unit:'each',         category:'Rolls',     prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1003667',  name:'Toast Avo, Confit Tomato + Whipped Feta',     dp:'B', unit:'each',         category:'Toast',     prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002678',  name:'Toast Avo, Cucumber + Togarashi',             dp:'B', unit:'each',         category:'Toast',     prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002679',  name:'Toast Salmon and Egg',                        dp:'B', unit:'each',         category:'Toast',     prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002686',  name:'Bread and Butter',                            dp:'B', unit:'each',         category:'Bread',     prepTiming:'TODAY',    shelfLifeHours:6,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002204',  name:'Croissant',                                   dp:'B', unit:'each',         category:'Pastry',    prepTiming:'TODAY',    shelfLifeHours:6,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002774',  name:'Pain Au Chocolat',                            dp:'B', unit:'each',         category:'Pastry',    prepTiming:'TODAY',    shelfLifeHours:6,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1004183',  name:'Pot Butter Beans, Avo + Feta',                dp:'B', unit:'each',         category:'Pots',      prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002772',  name:'Pot Green Eggs',                              dp:'B', unit:'each',         category:'Pots',      prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002683',  name:'Pot Salmon Spinach',                          dp:'B', unit:'each',         category:'Pots',      prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002682',  name:'Pot Shak',                                    dp:'B', unit:'each',         category:'Pots',      prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002687',  name:'Overnight Oats Date Tahini',                  dp:'B', unit:'each',         category:'Cold Pots', prepTiming:'2-DAY',    shelfLifeHours:48, pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1004185',  name:'Mango & Strawberries Coconut Yoghurt',        dp:'B', unit:'each',         category:'Cold Pots', prepTiming:'TOMORROW', shelfLifeHours:24, pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1003134',  name:'Chia, Mango Coconut Yoghurt',                 dp:'B', unit:'each',         category:'Cold Pots', prepTiming:'2-DAY',    shelfLifeHours:48, pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1004184',  name:'Porridge Banana, Pecan, Date Tahini + Halva', dp:'B', unit:'each',         category:'Porridge',  prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002049',  name:'Porridge Berry Compote',                      dp:'B', unit:'each',         category:'Porridge',  prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1002047',  name:'Porridge Plain',                              dp:'B', unit:'each',         category:'Porridge',  prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1003021',  name:'Extra Avocado',                               dp:'B', unit:'each',         category:'Extras',    prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1003018',  name:'Extra Bacon',                                 dp:'B', unit:'each',         category:'Extras',    prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1003022',  name:'Extra Egg',                                   dp:'B', unit:'each',         category:'Extras',    prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1003019',  name:'Extra Salmon',                                dp:'B', unit:'each',         category:'Extras',    prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:3, pcrColumn:null,    fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  // ── LUNCH — Salads / Bases ──────────────────────────────────────────────────
  {plu:'98618',    name:'Kale Miso Slaw 12hr BATCH',                   dp:'L', unit:'batch',        category:'Salads',    prepTiming:'2-DAY',    shelfLifeHours:36, pcrPage:1, pcrColumn:'salads', fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1003567',  name:'Feta Caesar 12hr BATCH',                      dp:'L', unit:'batch',        category:'Salads',    prepTiming:'2-DAY',    shelfLifeHours:36, pcrPage:1, pcrColumn:'salads', fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1004175',  name:'Tomatoes, Butter Beans + Fennel 12hr BATCH',  dp:'L', unit:'batch',        category:'Salads',    prepTiming:'2-DAY',    shelfLifeHours:36, pcrPage:1, pcrColumn:'salads', fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1004177',  name:"J's Nicoise 12hr BATCH",                      dp:'L', unit:'batch',        category:'Salads',    prepTiming:'2-DAY',    shelfLifeHours:36, pcrPage:1, pcrColumn:'salads', fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'98595',    name:"Farmer's Rice",                               dp:'L', unit:'7kg kit',      category:'Bases',     prepTiming:'TOMORROW', shelfLifeHours:24, pcrPage:1, pcrColumn:'bases',  fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1001699',  name:"Farmer's Grains",                             dp:'L', unit:'tray',         category:'Bases',     prepTiming:'TOMORROW', shelfLifeHours:24, pcrPage:1, pcrColumn:'bases',  fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1003737',  name:'Sesame Cabbage 6hr BATCH',                    dp:'L', unit:'batch',        category:'Salads',    prepTiming:'TODAY',    shelfLifeHours:8,  pcrPage:1, pcrColumn:'bases',  fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'SPINWASp', name:'Spinach + Rocket Prep',                       dp:'L', unit:'bag',          category:'Salads',    prepTiming:'TODAY',    shelfLifeHours:6,  pcrPage:1, pcrColumn:null,     fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'EGGFR15s', name:'Eggs - Soft (Lunch)',                         dp:'L', unit:'each',         category:'Prep',      prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:1, pcrColumn:null,     fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  {plu:'1000974L', name:'Avocado Extra (Lunch)',                       dp:'L', unit:'each',         category:'Extras',    prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:1, pcrColumn:null,     fohGroup:null,         onSecondLine:false, traySize:null, trayCalc:null,       active:true},
  // ── LUNCH — Mains ──────────────────────────────────────────────────────────
  {plu:'1002285x', name:'Steak Cooked',                                dp:'L', unit:'portion',      category:'Mains',     prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:4,  trayCalc:'divide',   active:true},
  {plu:'1003857',  name:'Lime Leaf Tofu CAST IRON',                    dp:'L', unit:'plate',        category:'Mains',     prepTiming:'TODAY',    shelfLifeHours:2,  pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:4,  trayCalc:'multiply', active:true},
  {plu:'1002546',  name:'Gotcha Salmon',                               dp:'L', unit:'portion',      category:'Mains',     prepTiming:'TOMORROW', shelfLifeHours:24, pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:12, trayCalc:'divide',   active:true},
  {plu:'1001420',  name:'Harissa Chicken CAST IRON',                   dp:'L', unit:'plate [tray]', category:'Mains',     prepTiming:'TOMORROW', shelfLifeHours:24, pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:1,  trayCalc:'multiply', active:true},
  {plu:'1003739',  name:'Amba Chicken CAST IRON',                      dp:'L', unit:'plate [tray]', category:'Mains',     prepTiming:'TOMORROW', shelfLifeHours:24, pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:1,  trayCalc:'multiply', active:true},
  {plu:'1004054',  name:'Spiced Date Sweet Potato CAST IRON',          dp:'L', unit:'batch [bag]',  category:'Mains',     prepTiming:'TOMORROW', shelfLifeHours:24, pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:3,  trayCalc:'multiply', active:true},
  {plu:'103044',   name:'Mac & Cheese CAST IRON',                      dp:'L', unit:'plate',        category:'Mains',     prepTiming:'TOMORROW', shelfLifeHours:24, pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:4,  trayCalc:'multiply', active:true},
  {plu:'98635',    name:'Ponzu Sesame Broccoli CAST IRON',             dp:'L', unit:'bag',          category:'Sides',     prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:2,  trayCalc:'multiply', active:true},
  {plu:'1003660',  name:'Cauliflower CAST IRON',                       dp:'L', unit:'bag',          category:'Sides',     prepTiming:'TODAY',    shelfLifeHours:4,  pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:false, traySize:2,  trayCalc:'multiply', active:true},
  {plu:'1004052',  name:'Charred Greens, Shrooms + Nori CAST IRON',   dp:'L', unit:'plate',        category:'Sides',     prepTiming:'TODAY',    shelfLifeHours:2,  pcrPage:1, pcrColumn:'mains',  fohGroup:null,         onSecondLine:true,  traySize:4,  trayCalc:'multiply', active:true},
  // ── FOH ─────────────────────────────────────────────────────────────────────
  {plu:'1000961d', name:'Chimichurri Pot',         dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:48, pcrPage:null, pcrColumn:null, fohGroup:'Dressing Pots', onSecondLine:false, active:true},
  {plu:'1003909d', name:'Aioli Pot',               dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:48, pcrPage:null, pcrColumn:null, fohGroup:'Dressing Pots', onSecondLine:false, active:true},
  {plu:'1004186d', name:"J's Habanero Pot",        dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:48, pcrPage:null, pcrColumn:null, fohGroup:'Dressing Pots', onSecondLine:false, active:true},
  {plu:'1000964d', name:'Green Tahini Pot',        dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:48, pcrPage:null, pcrColumn:null, fohGroup:'Dressing Pots', onSecondLine:false, active:true},
  {plu:'1004181d', name:'Baba Ghanoush Dip Pot',   dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:48, pcrPage:null, pcrColumn:null, fohGroup:'Dressing Pots', onSecondLine:false, active:true},
  {plu:'1003766t', name:'Pickled Cucumber 40g',    dp:'L', unit:'portion', category:'FOH', prepTiming:'TODAY', shelfLifeHours:72, pcrPage:null, pcrColumn:null, fohGroup:'Toppings',      onSecondLine:false, active:true},
  {plu:'1003767t', name:'Red Onion Pickled 35g',   dp:'L', unit:'portion', category:'FOH', prepTiming:'TODAY', shelfLifeHours:72, pcrPage:null, pcrColumn:null, fohGroup:'Toppings',      onSecondLine:false, active:true},
  {plu:'1003765t', name:'Sesame Cucumber 55g',     dp:'L', unit:'portion', category:'FOH', prepTiming:'TODAY', shelfLifeHours:24, pcrPage:null, pcrColumn:null, fohGroup:'Toppings',      onSecondLine:false, active:true},
  {plu:'1000969',  name:'Chocolate Chip Cookie',   dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:72, pcrPage:null, pcrColumn:null, fohGroup:'Cookies',       onSecondLine:false, active:true},
  {plu:'1000971',  name:'Matcha Cookie',           dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:72, pcrPage:null, pcrColumn:null, fohGroup:'Cookies',       onSecondLine:false, active:true},
  {plu:'1003975',  name:'Dark Double Choc Cookie', dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:72, pcrPage:null, pcrColumn:null, fohGroup:'Cookies',       onSecondLine:false, active:true},
  {plu:'1001449',  name:'Brownie',                 dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:72, pcrPage:null, pcrColumn:null, fohGroup:'Cakes',         onSecondLine:false, active:true},
  {plu:'1001445',  name:'Banana Bread',            dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:72, pcrPage:null, pcrColumn:null, fohGroup:'Cakes',         onSecondLine:false, active:true},
  {plu:'1001843',  name:'Almond Bakewell',         dp:'L', unit:'each',    category:'FOH', prepTiming:'TODAY', shelfLifeHours:72, pcrPage:null, pcrColumn:null, fohGroup:'Cakes',         onSecondLine:false, active:true},
  // ── CATERING — Buffet for 6 (excluded from averages) ────────────────────────
  {plu:'C-BR6',  name:'Brown Rice Buffet X6',      dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-GR6',  name:'Grains Buffet X6',          dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-SC6',  name:'Sesame Cabbage X6',         dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-AM6',  name:'Amba Chicken X6',           dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-HC6',  name:'Harissa Chicken X6',        dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-SA6',  name:'Salmon X6',                 dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-ST6',  name:'Steak X6',                  dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-TF6',  name:'Tofu X6',                   dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-BRO6', name:'Broccoli X6',               dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-CA6',  name:'Cauliflower X6',            dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-MC6',  name:"Mac'n'Cheese X6",           dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  {plu:'C-SP6',  name:'Spinach X6',                dp:'C', unit:'tray',   cateringType:'buffet6', category:'Buffet for 6', active:true},
  // ── CATERING — Bundles (excluded from averages) ──────────────────────────────
  {plu:'C-JCB',  name:"J's Classic Bundle",        dp:'C', unit:'bundle', cateringType:'bundles', category:'Bundles', active:true},
  {plu:'C-MDB',  name:'The Med Bundle',            dp:'C', unit:'bundle', cateringType:'bundles', category:'Bundles', active:true},
  {plu:'C-TFB',  name:'The Tofu Bowl Bundle',      dp:'C', unit:'bundle', cateringType:'bundles', category:'Bundles', active:true},
  // ── CATERING — Reference (IN averages, large one-off orders only) ────────────
  {plu:'R-F4BB', name:"Farm of 4 — Butter Beans",  dp:'L', unit:'box',   cateringType:'reference', category:'Fam of 4',    active:true},
  {plu:'R-F4N',  name:"Farm of 4 — Nicoise",       dp:'L', unit:'box',   cateringType:'reference', category:'Fam of 4',    active:true},
  {plu:'R-FTBB', name:"Field Tray — Butter Beans",  dp:'L', unit:'tray',  cateringType:'reference', category:'Field Trays', active:true},
  {plu:'R-FTN',  name:"Field Tray — Nicoise",       dp:'L', unit:'tray',  cateringType:'reference', category:'Field Trays', active:true},
  {plu:'R-BBO',  name:"The Amba Bowl",              dp:'L', unit:'each',  cateringType:'reference', category:'Bowls',       active:true},
  {plu:'R-HBO',  name:"The Harissa Bowl",           dp:'L', unit:'each',  cateringType:'reference', category:'Bowls',       active:true},
  {plu:'R-SBO',  name:"The Salmon Bowl",            dp:'L', unit:'each',  cateringType:'reference', category:'Bowls',       active:true},
];

// ── BATCHES ───────────────────────────────────────────────────────────────────
// Confirmed finished qty × recipe → batch requirements
// gpc = g per cover | gpp = g per product unit | upp = units per product unit
// usagePerCover: for depletion model estimation (g/ml per cover served)
// prepGroup: 1|2|3 for dressings Smart Kitchen schedule
export const BATCHES = [
  // BREAKFAST — TODAY (black highlight — prep for current service)
  {plu:'98578p',    name:'Smoked Streaky Bacon Prep',      size:1000, unit:'slice',       dp:'B',  driverPlu:'1002043',  gpc:null, gpp:40,  upp:null, prepTiming:'TODAY',    shelfLifeHours:6,   pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'EGGFR15p',  name:'Eggs - Poached (Pot)',           size:1,    unit:'each',        dp:'B',  driverPlu:'1004183',  gpc:null, gpp:null,upp:2,    prepTiming:'TODAY',    shelfLifeHours:1,   pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'EGGFR15r',  name:'Eggs - Poached (Roll)',          size:1,    unit:'each',        dp:'B',  driverPlu:'1002043',  gpc:null, gpp:null,upp:1,    prepTiming:'TODAY',    shelfLifeHours:1,   pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'EGGFR15h',  name:'Eggs - Hard Boiled',             size:1,    unit:'each',        dp:'B',  driverPlu:null,       gpc:3,    gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:24,  pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1002036',   name:'Porridge BATCH',                 size:2000, unit:'g',           dp:'B',  driverPlu:null,       gpc:80,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:4,   pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1003955',   name:'Halva Crumble Batch',            size:300,  unit:'g',           dp:'B',  driverPlu:'1004184',  gpc:null, gpp:15,  upp:null, prepTiming:'TODAY',    shelfLifeHours:168, pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1002037',   name:'Date Tahini BATCH',              size:500,  unit:'g',           dp:'B',  driverPlu:null,       gpc:12,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:168, pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'98599',     name:'Egg Mayo Mix BATCH',             size:1000, unit:'g',           dp:'BL', driverPlu:null,       gpc:25,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:24,  pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1002769',   name:'Spinach Parmesan BATCH',         size:995,  unit:'g',           dp:'B',  driverPlu:null,       gpc:30,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:24,  pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1002655b',  name:'Sourdough B&B',                  size:1,    unit:'slice',       dp:'B',  driverPlu:'1002686',  gpc:null, gpp:null,upp:1,    prepTiming:'TODAY',    shelfLifeHours:6,   pcrPage:3, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  // BREAKFAST — TOMORROW (purple/coloured highlight — prep PM for tomorrow AM)
  {plu:'1002676b',  name:'Smashed Avo Breakfast',          size:1000, unit:'g',           dp:'B',  driverPlu:null,       gpc:55,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'FJSASHAKp', name:'Shakshuka Prep',                 size:1000, unit:'g',           dp:'B',  driverPlu:'1002682',  gpc:null, gpp:35,  upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1003666',   name:'Plum Tomato Confit BATCH',       size:1500, unit:'g',           dp:'B',  driverPlu:'1003667',  gpc:null, gpp:25,  upp:null, prepTiming:'TOMORROW', shelfLifeHours:48,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1003665',   name:'Whipped Feta BATCH 1.3kg',       size:1300, unit:'g',           dp:'B',  driverPlu:null,       gpc:20,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:48,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1002251p',  name:'Preserved Lemon Breakfast',      size:500,  unit:'g',           dp:'B',  driverPlu:null,       gpc:8,    gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1004178',   name:'Mango Mix Prep',                 size:500,  unit:'g',           dp:'B',  driverPlu:'1004185',  gpc:null, gpp:60,  upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1003958',   name:'Strawberry Prep',                size:500,  unit:'g',           dp:'B',  driverPlu:'1004185',  gpc:null, gpp:50,  upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1002767F',  name:'Chopped Spinach DEFROST',        size:500,  unit:'g',           dp:'B',  driverPlu:'1002769',  gpc:null, gpp:100, upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1002722p',  name:'Smoked Salmon Pot Portion',      size:250,  unit:'portion 25g', dp:'B',  driverPlu:'1002683',  gpc:null, gpp:25,  upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1002722rt', name:'Smoked Salmon Toast',            size:550,  unit:'portion 55g', dp:'B',  driverPlu:'1002679',  gpc:null, gpp:55,  upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  // BREAKFAST — 2-DAY
  {plu:'1002677',   name:'Overnight Oat BATCH 3.6kg',      size:3665, unit:'full batch',  dp:'B',  driverPlu:'1002687',  gpc:null, gpp:null,upp:1,    prepTiming:'2-DAY',    shelfLifeHours:48,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1003133',   name:'Chia Pudding BATCH 4.3kg',       size:4300, unit:'full batch',  dp:'B',  driverPlu:'1003134',  gpc:null, gpp:80,  upp:null, prepTiming:'2-DAY',    shelfLifeHours:48,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  // LUNCH BATCHES — TODAY
  {plu:'1003738',   name:'Sesame Cucumber + Wakame 1.1kg', size:1100, unit:'g',           dp:'L',  driverPlu:null,       gpc:40,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:24,  pcrPage:1, pcrColumn:'batch', prepGroup:null, usagePerCover:40,   active:true},
  {plu:'1003737b',  name:'Sesame Cabbage Batch',           size:1000, unit:'g',           dp:'L',  driverPlu:null,       gpc:50,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:8,   pcrPage:1, pcrColumn:'batch', prepGroup:null, usagePerCover:50,   active:true},
  {plu:'98635p',    name:'Broccoli Roasted Prep',          size:1000, unit:'bag',         dp:'L',  driverPlu:null,       gpc:80,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:6,   pcrPage:1, pcrColumn:'batch', prepGroup:null, usagePerCover:80,   active:true},
  {plu:'1004051',   name:'Spicy Greens Veg Mix BATCH',     size:1000, unit:'g',           dp:'L',  driverPlu:null,       gpc:40,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:6,   pcrPage:1, pcrColumn:'batch', prepGroup:null, usagePerCover:40,   active:true},
  {plu:'1003659',   name:'Cauliflower Roasted Prep',       size:1000, unit:'bag',         dp:'L',  driverPlu:null,       gpc:60,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:6,   pcrPage:1, pcrColumn:'batch', prepGroup:null, usagePerCover:60,   active:true},
  {plu:'1004164',   name:'Baby Potato Prep 1.05kg',        size:1050, unit:'g',           dp:'L',  driverPlu:null,       gpc:40,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:12,  pcrPage:1, pcrColumn:'batch', prepGroup:null, usagePerCover:40,   active:true},
  {plu:'1004165',   name:'Cabbage Roasted Prep',           size:1000, unit:'bag',         dp:'L',  driverPlu:null,       gpc:45,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:6,   pcrPage:1, pcrColumn:'batch', prepGroup:null, usagePerCover:45,   active:true},
  {plu:'SPINWASb',  name:'Spinach + Rocket Wash Prep',     size:1000, unit:'g',           dp:'L',  driverPlu:null,       gpc:30,   gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:6,   pcrPage:1, pcrColumn:null,    prepGroup:null, usagePerCover:30,   active:true},
  // LUNCH BATCHES — TOMORROW
  {plu:'1001849',   name:'Mac and Cheese Prep BATCH',      size:2000, unit:'full batch',  dp:'L',  driverPlu:'103044',   gpc:null, gpp:200, upp:null, prepTiming:'TOMORROW', shelfLifeHours:48,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1003856',   name:'Lime Leaf Tofu Prep',            size:1000, unit:'g',           dp:'L',  driverPlu:'1003857',  gpc:null, gpp:100, upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'98628',     name:'Spiced Date Sweet Potato Batch', size:1000, unit:'g',           dp:'L',  driverPlu:'1004054',  gpc:null, gpp:80,  upp:null, prepTiming:'TOMORROW', shelfLifeHours:24,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:null, active:true},
  {plu:'1003813',   name:'Butter Beans Prep 1.5kg',        size:1500, unit:'full batch',  dp:'L',  driverPlu:null,       gpc:35,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:48,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:35,   active:true},
  // LUNCH BATCHES — 2-DAY (12hr salad batches)
  {plu:'1003567b',  name:'Feta Caesar Batch 2.4kg',        size:2400, unit:'full batch',  dp:'L',  driverPlu:null,       gpc:60,   gpp:null,upp:null, prepTiming:'2-DAY',    shelfLifeHours:36,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:60,   active:true},
  {plu:'98618b',    name:'Kale Miso Slaw Batch 2.6kg',     size:2600, unit:'full batch',  dp:'L',  driverPlu:null,       gpc:70,   gpp:null,upp:null, prepTiming:'2-DAY',    shelfLifeHours:36,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:70,   active:true},
  {plu:'4175b',     name:'Tomatoes Butter Beans + Fennel', size:3200, unit:'full batch',  dp:'L',  driverPlu:null,       gpc:90,   gpp:null,upp:null, prepTiming:'2-DAY',    shelfLifeHours:36,  pcrPage:2, pcrColumn:'batch', prepGroup:null, usagePerCover:90,   active:true},
  // DRESSINGS — Smart Kitchen prep groups (depletion model)
  // Group 1: short shelf ~2-3 days — Mon→Tue/Wed, Wed→Thu/Fri, Fri→Sat/Sun/Mon
  {plu:'1002730',   name:'Caesar Dressing BATCH',          size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:15,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:72,  pcrPage:2, pcrColumn:null,    prepGroup:1, usagePerCover:15,   active:true},
  {plu:'1003994g',  name:'Green Shfika Tahini Dressing',   size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:12,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:72,  pcrPage:2, pcrColumn:null,    prepGroup:1, usagePerCover:12,   active:true},
  {plu:'1001890',   name:'Oregano Lemon Vinni Dressing',   size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:10,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:72,  pcrPage:2, pcrColumn:null,    prepGroup:1, usagePerCover:10,   active:true},
  // Group 2: medium shelf ~3-4 days — Mon→Mon-Wed, Wed→Thu/Fri, Fri→Sat/Sun
  {plu:'1003855',   name:'Lime Leaf Dressing BATCH',       size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:18,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:96,  pcrPage:2, pcrColumn:null,    prepGroup:2, usagePerCover:18,   active:true},
  {plu:'SICHDRb',   name:'Sichuan Dressing BATCH',         size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:20,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:96,  pcrPage:2, pcrColumn:null,    prepGroup:2, usagePerCover:20,   active:true},
  // Group 3: long shelf ~5-7 days — Tue→Wed-Fri, Fri→Sat-Tue
  {plu:'1003731',   name:'Amba Dressing BATCH',            size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:12,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:12,   active:true},
  {plu:'1003730',   name:'Asian Vinni Dressing BATCH',     size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:14,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:14,   active:true},
  {plu:'1002053',   name:'Cauliflower & Grains Dressing',  size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:16,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:16,   active:true},
  {plu:'1001781',   name:'Gotcha Marinade BATCH',          size:500,  unit:'kg',          dp:'L',  driverPlu:'1002546',  gpc:null, gpp:30,  upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:30,   active:true},
  {plu:'98611',     name:'Harissa Dressing BATCH',         size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:10,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:10,   active:true},
  {plu:'1002734',   name:'Sesame Garlic Oil BATCH',        size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:12,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:12,   active:true},
  {plu:'1004053',   name:'Vegan Fish Sauce Dressing',      size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:8,    gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:8,    active:true},
  {plu:'MMaioli',   name:'Marmite Mayo Aioli BATCH',       size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:10,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:10,   active:true},
  {plu:'TVINNIb',   name:'Tomato Vinni Dressing BATCH',    size:500,  unit:'kg',          dp:'L',  driverPlu:null,       gpc:10,   gpp:null,upp:null, prepTiming:'TOMORROW', shelfLifeHours:168, pcrPage:2, pcrColumn:null,    prepGroup:3, usagePerCover:10,   active:true},
  // BARISTA
  {plu:'1003966',   name:'Chocolate Syrup Batch',          size:1,    unit:'full batch',  dp:'L',  driverPlu:null,       gpc:5,    gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:168, pcrPage:1, pcrColumn:null,    prepGroup:null, usagePerCover:5,  active:true},
  {plu:'1004179',   name:'Hojicha Batch',                  size:1,    unit:'full batch',  dp:'L',  driverPlu:null,       gpc:3,    gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:168, pcrPage:1, pcrColumn:null,    prepGroup:null, usagePerCover:3,  active:true},
  {plu:'1004180',   name:'Honey Syrup Batch',              size:1,    unit:'full batch',  dp:'L',  driverPlu:null,       gpc:3,    gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:168, pcrPage:1, pcrColumn:null,    prepGroup:null, usagePerCover:3,  active:true},
  {plu:'1003965',   name:'Matcha Batch',                   size:1,    unit:'full batch',  dp:'L',  driverPlu:null,       gpc:4,    gpp:null,upp:null, prepTiming:'TODAY',    shelfLifeHours:168, pcrPage:1, pcrColumn:null,    prepGroup:null, usagePerCover:4,  active:true},
];

// ── SUPPLIERS ─────────────────────────────────────────────────────────────────
// Delivery schedule: Mon→Wed (covers Thu+Fri), Tue→Thu (covers Fri/Sat/Sun),
//                   Wed→Fri (covers Mon), Fri→Mon (covers Tue/Wed)
// No delivery: Tue, Fri, Sat, Sun
export const SUPPLIERS = [
  {id:'aubrey-allen',  name:'Aubrey Allen',               orderNote:'STEAK — order by 11AM',    cutoffTime:'11:00', products:[
    {name:'Flat Iron Steak', packSize:'Bag [1 x 5kg]', price:42.00},
  ]},
  {id:'bethnal-green', name:'Bethnal Green Fish Supplies', orderNote:'SALMON — order by 3PM',   cutoffTime:'15:00', products:[
    {name:'Salmon Fillet Side', packSize:'Side [1 x 2kg]', price:28.00},
    {name:'Hot Smoked Salmon',  packSize:'Pack [1 x 1kg]', price:18.50},
  ]},
  {id:'birtwhistles',  name:'Birtwhistles',                orderNote:'CHICKEN & BACON — order by 11AM', cutoffTime:'11:00', products:[
    {name:'Harissa Chicken Marinated Bag', packSize:'Box [8 x 2kg]', price:83.22},
    {name:'Amba Chicken Marinated Bag',    packSize:'Box [8 x 2kg]', price:81.45},
    {name:'Smoked Streaky Bacon',          packSize:'Pack [1 x 2.27kg]', price:13.05},
  ]},
  {id:'seven-seeded',  name:'Seven Seeded',                orderNote:'Order by 11AM',            cutoffTime:'11:00', products:[
    {name:'Sourdough Loaf',  packSize:'Loaf',          price:4.50},
    {name:'Pain Mie Bun x5', packSize:'Pack [5 buns]', price:3.80},
  ]},
  {id:'smith-brock',   name:'Smith & Brock',               orderNote:'Day 1 for Day 3 — order by 3PM', cutoffTime:'15:00', products:[
    {name:'Chunky Butter Bean Hummus',   packSize:'Bag [1 x 2kg]',  price:10.25},
    {name:'Green Tahini',                packSize:'Bag [1 x 2kg]',  price:13.46},
    {name:'Spicy Aubergine Baba Ghanoush',packSize:'Bag [1 x 2kg]', price:11.69},
  ]},
  {id:'oatopia',       name:'Oatopia',                     orderNote:'Order by 11AM',            cutoffTime:'11:00', products:[
    {name:'Rolled Oats', packSize:'Bag [1 x 25kg]', price:32.00},
  ]},
  {id:'loon-fung',     name:'Loon Fung / Kong Wah',        orderNote:'TOFU — order by 3PM',     cutoffTime:'15:00', products:[
    {name:'Silken Tofu Block', packSize:'Box [12 x 300g]', price:18.00},
  ]},
  {id:'coffee-origin', name:'Coffee Origin',               orderNote:'Order by 11AM',            cutoffTime:'11:00', products:[
    {name:'Coffee Beans', packSize:'Bag [1 x 3kg]', price:42.00},
  ]},
  {id:'leathams',      name:'Leathams',                    orderNote:'Order by 11AM',            cutoffTime:'11:00', products:[
    {name:'Smoked Salmon Pre-sliced', packSize:'Pack [1 x 500g]', price:14.50},
  ]},
  {id:'woods',         name:'Woods',                       orderNote:'Order by 3PM',             cutoffTime:'15:00', products:[
    {name:'Hot Smoked Salmon', packSize:'Pack [1 x 500g]', price:13.00},
  ]},
  {id:'stores',        name:'Stores',                      orderNote:'Order by 11AM',            cutoffTime:'11:00', products:[]},
  {id:'reemies',       name:'Reemies',                     orderNote:'Order by 11AM',            cutoffTime:'11:00', products:[]},
  {id:'hnb',           name:'H&B',                         orderNote:'Order by 3PM',             cutoffTime:'15:00', products:[]},
  {id:'packaging',     name:'Packaging Environmental',     orderNote:'Order by 11AM',            cutoffTime:'11:00', products:[]},
];

export const DELIVERY_SCHEDULE = [
  {orderDay:'Mon', deliveryDay:'Wed', covers:['Thu','Fri']},
  {orderDay:'Tue', deliveryDay:'Thu', covers:['Fri','Sat','Sun']},
  {orderDay:'Wed', deliveryDay:'Fri', covers:['Mon']},
  {orderDay:'Fri', deliveryDay:'Mon', covers:['Tue','Wed']},
];

// ── SECTION TEMPLATES ─────────────────────────────────────────────────────────
export const SECTION_TEMPLATES = [
  {id:'prep1',    name:'Prep 1',    defaultStart:'06:30'},
  {id:'prep2',    name:'Prep 2',    defaultStart:'06:30'},
  {id:'prep3',    name:'Prep 3',    defaultStart:'06:30'},
  {id:'raw',      name:'Raw',       defaultStart:'07:00'},
  {id:'rice',     name:'Rice',      defaultStart:'07:00'},
  {id:'salad',    name:'Salad',     defaultStart:'07:00'},
  {id:'theatre1', name:'Theatre 1', defaultStart:'09:00'},
  {id:'theatre2', name:'Theatre 2', defaultStart:'09:00'},
];

// ── HISTORICAL AVERAGES (seed data — replaced by live SQL data in Phase 2) ────
// avgSold[plu] = [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
export const AVG_SOLD = {
  '1002043': [10,18,20,17,22,16, 8],
  '1003667': [ 7,13, 8,11,14, 9, 4],
  '1002678': [12,23,25,20,25,18, 9],
  '1002679': [ 8,18,15,14,16,12, 6],
  '1002686': [ 6,12,15,14, 9,10, 5],
  '1002204': [ 3, 5, 4, 5, 4, 6, 4],
  '1002774': [ 2, 4, 3, 3, 2, 4, 3],
  '1004183': [ 4, 6, 8, 7, 7, 5, 3],
  '1002772': [ 4, 6, 9, 8, 8, 5, 3],
  '1002683': [ 5, 8, 9, 9, 9, 6, 4],
  '1002682': [11,21,24,19,22,15, 8],
  '1002687': [ 8,16,16,16,15,11, 6],
  '1004185': [ 3, 7, 3, 6, 6, 3, 2],
  '1003134': [ 3, 6, 4, 7, 8, 4, 3],
  '1004184': [ 6, 9, 6,14,19, 9, 6],
  '1002049': [ 4, 6, 6, 8, 6, 5, 3],
  '1002047': [ 1, 1, 3, 1, 2, 1, 1],
  '98618':   [ 5, 8, 8, 7, 9, 6, 3],
  '1003567': [ 3, 4, 4, 3, 4, 3, 2],
  '1004175': [ 3, 6, 5, 5, 6, 4, 2],
  '1004177': [ 2, 2, 2, 2, 2, 2, 1],
  '98595':   [ 3, 5, 5, 4, 5, 4, 2],
  '1001699': [ 4, 7, 7, 6, 7, 5, 3],
  '1003737': [ 5, 8, 7, 6, 8, 6, 3],
  'SPINWASp':[ 3, 5, 4, 4, 5, 4, 2],
  'EGGFR15s':[30,56,52,48,60,44,20],
  '1000974L':[15,32,28,26,35,25,12],
  '1002285x':[80,148,130,120,160,120,60],
  '1003857': [ 8,15,12,12,14,10, 5],
  '1002546': [150,283,250,230,300,220,100],
  '1001420': [18,33,30,28,35,26,12],
  '1003739': [13,25,22,20,26,19,10],
  '1004054': [28,53,48,44,58,44,20],
  '103044':  [ 6,12,10, 9,12, 9, 4],
  '98635':   [20,38,35,32,42,30,15],
  '1003660': [16,30,28,25,33,25,12],
  '1004052': [12,22,20,18,24,18, 9],
};

// Hourly sales profile [0-23 hours, index=hour]
export const HOURLY_PROFILE_BREAKFAST = {
  '1002043': [0,0,0,0,0,0,0.5,2,3,2,1,0.5,0,0,0,0,0,0,0,0,0,0,0,0],
  '1002678': [0,0,0,0,0,0,0.3,1.5,2.5,2,1,0.5,0,0,0,0,0,0,0,0,0,0,0,0],
  '1004184': [0,0,0,0,0,0,0.5,2,3,2.5,1.5,0.5,0,0,0,0,0,0,0,0,0,0,0,0],
  '1002047': [0,0,0,0,0,0,0.2,0.5,0.5,0.3,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
};
export const HOURLY_PROFILE_LUNCH = {
  '98618':   [0,0,0,0,0,0,0,0,0,0,0,0.5,2.9,2.2,1.2,0.5,0.6,0.5,1.3,0.9,0.3,0,0,0],
  '1003567': [0,0,0,0,0,0,0,0,0,0,0,0.3,1.8,1.5,0.8,0.4,0.4,0.3,0.8,0.6,0.2,0,0,0],
  '1001420': [0,0,0,0,0,0,0,0,0,0,0,1.1,7.7,6.1,5.6,2.4,1.1,1.5,3.2,2.1,0.6,0,0,0],
  '1002285x':[0,0,0,0,0,0,0,0,0,0,0,0,12,19,39,27,16,2,5,7,26,29,4,0],
  '1002546': [0,0,0,0,0,0,0,0,0,0,0,0.2,8,17,61,59,18,9,11,14,26,19,0,0],
};

// ── DISH CODE MAPPINGS ────────────────────────────────────────────────────────
// Maps promo/variant codes to canonical production codes
// Stored here so Admin can update without touching SQL
export const DISH_MAPPINGS = [
  {fromCode:'1003869', toCode:'1002687', note:'Overnight Oats Promo → Item'},
  {fromCode:'1003872', toCode:'1002682', note:'Pot Shak Promo → Item'},
  {fromCode:'1003870', toCode:'1002043', note:'Bacon Egg Roll Promo → Item'},
  {fromCode:'1003871', toCode:'1002678', note:'Avo Toast Promo → Item'},
  {fromCode:'1003868', toCode:'1004184', note:'Porridge Almond Modifier → Porridge Banana, Pecan'},
  {fromCode:'1002048', toCode:'1004184', note:'Porridge Almond Item → Porridge Banana, Pecan'},
  {fromCode:'1004213', toCode:'1004184', note:'Porridge Banana Modifier → Item'},
  {fromCode:'1003961', toCode:'1002049', note:'Porridge Apple → Porridge Berry Compote'},
  {fromCode:'1003668', toCode:'1004183', note:'Pot Avo Confit → Pot Butter Beans'},
  {fromCode:'1003960', toCode:'1004185', note:'Cold Pot Roasted Apple → Mango & Strawberries'},
  {fromCode:'1003583', toCode:'1004210', note:'Chickpea + Pickles → Butter Beans'},
  {fromCode:'1003693', toCode:'1004209', note:"Crunchy Greens → J's Nicoise"},
  {fromCode:'1003976', toCode:'1001449', note:'Miso Blondie → Brownie'},
  {fromCode:'102975',  toCode:'1004186', note:'Red Pepper → Habanero'},
  {fromCode:'1000963', toCode:'1004186', note:'Red Pepper Item → Habanero'},
  {fromCode:'1004208', toCode:'1004186', note:'Habanero Modifier → Item'},
  {fromCode:'1004103', toCode:'1002193', note:"Deliveroo J's Classic → Main"},
  {fromCode:'1004104', toCode:'1003835', note:'Deliveroo The Med → Main'},
];
