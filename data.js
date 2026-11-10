"use strict";

/*
 * data.js: everything the page knows.
 *
 * EVAN’S NOTES  Each Europe stop’s `story` is for Evan’s own words. An empty
 *               string shows a "draft" box on the page.
 * HOUSES        The brand guide: four groups, each brand with where and when
 *               it was founded and what it’s known for. Names match `brand`.
 * WATCHES       Real watches. Specs describe the current model named in
 *               `model` (makers’ published data; Rolex doesn’t publish
 *               thickness, so those figures come from reviews and are marked
 *               approximate). `photo` is a Wikimedia Commons file and
 *               `pictured` says exactly what that photo shows.
 * WATCH_TYPES  The one filter above the watches, with a one-line explanation.
 * MOVEMENTS    Plain-English explanations shown in each watch’s details.
 * DRESS_CODES  Which occasions each watch suits ("Wear it to" in the details).
 * EUROPE_STOPS Places with a watch story. The three below are examples to
 *              replace with places Evan actually visited.
 * CURRENCIES   Currencies offered by the price converter.
 */

const PRICE_TIERS = {
    entry: "Under $1,000",
    mid: "$1,000–$10,000",
    grail: "Over $10,000"
};

const HOUSES = [
    {
        title: "The Holy Trinity",
        summary: "The three Swiss houses collectors rank above all others for history and hand-finishing.",
        brands: [
            {
                name: "Patek Philippe",
                origin: "Geneva, 1839",
                note: "Family-owned since 1932 and best known for grand complications, the Calatrava and the Nautilus."
            },
            {
                name: "Audemars Piguet",
                origin: "Le Brassus, 1875",
                note: "Still owned by its founding families; its 1972 Royal Oak helped create the luxury steel sports watch."
            },
            {
                name: "Vacheron Constantin",
                origin: "Geneva, 1755",
                note: "Says it has made watches without interruption since 1755, longer than any other maker."
            }
        ]
    },
    {
        title: "Fine watchmaking",
        summary: "Historic makers and jewelers known for craft, complications and design.",
        brands: [
            {
                name: "Jaeger-LeCoultre",
                origin: "Le Sentier, 1833",
                note: "Called “the watchmaker’s watchmaker” for supplying movements to other houses; maker of the Reverso."
            },
            {
                name: "Breguet",
                origin: "Paris, 1775",
                note: "Founded by Abraham-Louis Breguet, who patented the tourbillon in 1801."
            },
            {
                name: "Blancpain",
                origin: "Villeret, 1735",
                note: "Claims to be the oldest watch brand; its 1953 Fifty Fathoms helped define the dive watch."
            },
            {
                name: "Piaget",
                origin: "La Côte-aux-Fées, 1874",
                note: "Famous for ultra-thin movements and for watches that double as jewelry."
            },
            {
                name: "Cartier",
                origin: "Paris, 1847",
                note: "The Paris jeweler whose Santos (1904) and Tank (1917) helped make the wristwatch fashionable."
            },
            {
                name: "Bulgari",
                origin: "Rome, 1884",
                note: "A Roman jeweler known for bold Italian design, from the Serpenti to record-thin Octo Finissimo watches."
            },
            {
                name: "Grand Seiko",
                origin: "Japan, 1960",
                note: "Seiko’s luxury line, known for mirror-like Zaratsu polishing and the gliding Spring Drive."
            }
        ]
    },
    {
        title: "Sports watches",
        summary: "The names behind the dive, pilot and racing watches everyone recognizes.",
        brands: [
            {
                name: "Rolex",
                origin: "Geneva, 1905",
                note: "Founded in London and based in Geneva since 1919; its 1926 Oyster case made wristwatches waterproof."
            },
            {
                name: "Omega",
                origin: "Biel/Bienne, 1848",
                note: "The Speedmaster went to the Moon, and Omega has timed the Olympic Games since 1932."
            },
            {
                name: "Tudor",
                origin: "Geneva, 1926",
                note: "Founded by Rolex’s Hans Wilsdorf as a more affordable sister brand."
            },
            {
                name: "Breitling",
                origin: "Saint-Imier, 1884",
                note: "Built its name on pilot’s chronographs such as the Navitimer."
            },
            {
                name: "TAG Heuer",
                origin: "Saint-Imier, 1860",
                note: "Edouard Heuer’s company, a pioneer of racing chronographs and stopwatches."
            },
            {
                name: "Zenith",
                origin: "Le Locle, 1865",
                note: "Launched the El Primero in 1969, one of the first automatic chronograph movements."
            },
            {
                name: "IWC",
                origin: "Schaffhausen, 1868",
                note: "Founded by an American, F. A. Jones; known for pilot’s watches and the Portugieser."
            },
            {
                name: "Panerai",
                origin: "Florence, 1860",
                note: "A Florentine workshop that supplied the Italian navy with diving instruments and watches."
            }
        ]
    },
    {
        title: "Great first watches",
        summary: "Honest, well-made watches that won’t empty a student’s wallet.",
        brands: [
            {
                name: "Seiko",
                origin: "Tokyo, 1881",
                note: "Launched the world’s first quartz wristwatch, the Astron, in 1969."
            },
            {
                name: "Orient",
                origin: "Tokyo, 1950",
                note: "Japanese maker known for automatic movements it builds itself, at friendly prices."
            },
            {
                name: "Tissot",
                origin: "Le Locle, 1853",
                note: "One of the most affordable ways into Swiss mechanical watches."
            },
            {
                name: "Hamilton",
                origin: "Lancaster, Pennsylvania, 1892",
                note: "An American name, now Swiss-made, still known for military-style field watches."
            },
            {
                name: "Nomos Glashütte",
                origin: "Glashütte, 1990",
                note: "Founded just after the fall of the Berlin Wall; known for clean, Bauhaus-style dials."
            },
            {
                name: "Casio",
                origin: "Tokyo, 1946",
                note: "An electronics maker whose watches began with the 1974 Casiotron; home of the G-Shock and F-91W."
            },
            {
                name: "Swatch",
                origin: "Biel/Bienne, 1983",
                note: "Its cheap, colorful plastic watches helped rescue Swiss watchmaking from the quartz crisis."
            }
        ]
    }
];

// The one filter on the page. Each summary appears under the buttons when chosen.
const WATCH_TYPES = {
    dress: {
        label: "Dress",
        summary: "Thin, simple and usually on leather, so it slides under a shirt cuff."
    },
    dive: {
        label: "Dive",
        summary: "Built for water: a rotating bezel for timing, high water resistance and hands that glow in the dark."
    },
    sport: {
        label: "Sport",
        summary: "Tool watches: chronographs, pilot and GMT watches, a field watch, a digital. Tough, easy to read and easy to live with."
    },
    everyday: {
        label: "Everyday",
        summary: "Built to wear every day: smart enough for a meeting, tough enough for everything else."
    },
    jewelry: {
        label: "Jewelry",
        summary: "Designed by jewelers, where the bracelet matters as much as the dial."
    }
};

// Keys match each watch’s `movement`.
const MOVEMENTS = {
    "Quartz": {
        label: "Quartz",
        summary: "A battery and a vibrating quartz crystal keep time. It’s the most accurate and affordable kind, and the seconds hand ticks once a second."
    },
    "Automatic": {
        label: "Automatic",
        summary: "Mechanical, wound by a weighted rotor as your wrist moves. Wear it and it keeps going; leave it in a drawer for a few days and it stops."
    },
    "Manual-wind": {
        label: "Manual-wind",
        summary: "Mechanical, wound by turning the crown every day or two. Leaving out the rotor lets the watch be thinner."
    },
    "Spring Drive": {
        label: "Spring Drive",
        summary: "Grand Seiko’s hybrid: a mainspring powers it and a quartz-regulated glide wheel sets the pace, so the seconds hand glides."
    }
};

/*
 * type   one of the WATCH_TYPES keys
 * take   Evan’s own note on this watch (empty = draft)
 */
const WATCHES = {
    bambino: {
        brand: "Orient",
        model: "Bambino",
        type: "dress",
        caseMm: "40.5",
        thicknessMm: 11.8,
        movement: "Automatic",
        strap: "Leather strap",
        tier: "entry",
        photo: "File:Orient Watch - Bambino (ER24005W) (29121883374).jpg",
        pictured: "An Orient Bambino, ref. ER24005W",
        why: "A domed crystal and an in-house automatic movement give a vintage dress-watch look at an entry price."
    },
    "tank-must-large": {
        brand: "Cartier",
        model: "Tank Must, large",
        type: "dress",
        caseMm: "25.5 × 33.7",
        thicknessMm: 6.6,
        movement: "Quartz",
        strap: "Leather strap",
        tier: "mid",
        photo: "File:Cartier Tank.jpg",
        pictured: "A vintage Les Must de Cartier Tank",
        why: "Louis Cartier designed the Tank in 1917. At 6.6 mm thin, it disappears under a shirt cuff."
    },
    "tank-must-small": {
        brand: "Cartier",
        model: "Tank Must, small",
        type: "dress",
        caseMm: "22 × 29.5",
        thicknessMm: 6.6,
        movement: "Quartz",
        strap: "Leather strap",
        tier: "mid",
        photo: "File:Cartier Tank.jpg",
        pictured: "A vintage Les Must de Cartier Tank",
        why: "The 1917 Tank in its smaller size: discreet on a slim wrist, and just as at home on a large one."
    },
    calatrava: {
        brand: "Patek Philippe",
        model: "Calatrava 6119",
        type: "dress",
        caseMm: "39",
        thicknessMm: 8.08,
        movement: "Manual-wind",
        strap: "Leather strap",
        tier: "grail",
        photo: "File:Calatrava1.jpg",
        pictured: "A Patek Philippe Calatrava, ref. 3944, from about 1999",
        why: "Introduced in 1932 as Ref. 96, the plain, round Calatrava is the archetypal dress watch."
    },
    reverso: {
        brand: "Jaeger-LeCoultre",
        model: "Reverso Classic Medium Thin",
        type: "dress",
        caseMm: "24.4 × 40.1",
        thicknessMm: 7.56,
        movement: "Manual-wind",
        strap: "Leather strap",
        tier: "mid",
        photo: "File:Jaeger-LeCoultre Reverso, anni 2000.jpg",
        pictured: "A Jaeger-LeCoultre Reverso from the 2000s",
        why: "Patented in 1931, its case flips over to protect the crystal, an idea prompted by polo players breaking watch glass."
    },
    submariner: {
        brand: "Rolex",
        model: "Submariner No-Date",
        type: "dive",
        caseMm: "41",
        thicknessMm: 12.5,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "grail",
        photo: "File:Rolex Submariner diving watch.jpg",
        pictured: "A Rolex Submariner Date, ref. 116610LN",
        why: "Introduced in 1953 as a 100 m dive watch; today’s no-date version is rated to 300 m."
    },
    "black-bay-54": {
        brand: "Tudor",
        model: "Black Bay 54",
        type: "dive",
        caseMm: "37",
        thicknessMm: 11.2,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:Tudor Black Bay 54 ref. m79000n-0001.jpg",
        pictured: "A Tudor Black Bay 54, ref. M79000N-0001",
        why: "A 2023 tribute to Tudor’s first dive watch, the 1954 ref. 7922, in a compact 37 mm case."
    },
    speedmaster: {
        brand: "Omega",
        model: "Speedmaster Moonwatch Professional",
        type: "sport",
        caseMm: "42",
        thicknessMm: 13.58,
        movement: "Manual-wind",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:OMEGA-Speedmaster-Professional-Front.jpg",
        pictured: "An Omega Speedmaster Professional from 2005",
        why: "NASA qualified it for spaceflight in March 1965, and it became the first watch worn on the Moon."
    },
    "khaki-field": {
        brand: "Hamilton",
        model: "Khaki Field Mechanical 38mm",
        type: "sport",
        caseMm: "38",
        thicknessMm: 9.5,
        movement: "Manual-wind",
        strap: "Textile strap",
        tier: "entry",
        photo: "File:Hamilton Khaki Field Mechanical 39.jpg",
        pictured: "A Hamilton Khaki Field Mechanical",
        why: "Hamilton supplied over a million watches to US forces in 1942–45; this hand-wound field watch keeps that look."
    },
    f91w: {
        brand: "Casio",
        model: "F-91W",
        type: "sport",
        caseMm: "35.2 × 38.2",
        thicknessMm: 8.5,
        movement: "Quartz",
        strap: "Resin strap",
        tier: "entry",
        photo: "File:Casio F-91W 82T38575.jpg",
        pictured: "A Casio F-91W",
        why: "Introduced in 1989, it weighs 21 g and runs about seven years on one battery."
    },
    "prx-40": {
        brand: "Tissot",
        model: "PRX Powermatic 80, 40mm",
        type: "everyday",
        caseMm: "40",
        thicknessMm: 10.93,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "entry",
        photo: "File:Tissot PRX.jpg",
        pictured: "A Tissot PRX",
        why: "Revives a 1978 Tissot design with an integrated steel bracelet; the automatic runs for 80 hours."
    },
    "prx-35": {
        brand: "Tissot",
        model: "PRX 35mm",
        type: "everyday",
        caseMm: "35",
        thicknessMm: 9.6,
        movement: "Quartz",
        strap: "Steel bracelet",
        tier: "entry",
        photo: "File:Tissot PRX.jpg",
        pictured: "A Tissot PRX",
        why: "The 1978-inspired PRX at 35 mm, with a quartz movement and the same integrated steel bracelet."
    },
    "datejust-36": {
        brand: "Rolex",
        model: "Datejust 36",
        type: "everyday",
        caseMm: "36",
        thicknessMm: 11.8,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:Rolex Datejust 126234.jpg",
        pictured: "A Rolex Datejust 36, ref. 126234, on a Jubilee bracelet",
        why: "Launched in 1945 as the first self-winding chronometer wristwatch with a date window on the dial."
    },
    "lady-datejust": {
        brand: "Rolex",
        model: "Datejust 31",
        type: "everyday",
        caseMm: "31",
        thicknessMm: null,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:Rolex watch ladies Datejust 1987.jpg",
        pictured: "A 1987 Rolex Lady-Datejust in steel and gold",
        why: "The Datejust’s date window, magnifying Cyclops lens and Oyster bracelet, scaled to 31 mm."
    },
    "grand-seiko": {
        brand: "Grand Seiko",
        model: "Snowflake SBGA211",
        type: "everyday",
        caseMm: "41",
        thicknessMm: 12.5,
        movement: "Spring Drive",
        strap: "Titanium bracelet",
        tier: "mid",
        photo: "File:Grand Seiko SBGA011.jpg",
        pictured: "A Grand Seiko Snowflake, ref. SBGA011, the model before the SBGA211",
        why: "Its white dial is textured like wind-swept snow, and its Spring Drive seconds hand glides instead of ticking."
    },
    constellation: {
        brand: "Omega",
        model: "Constellation 28mm",
        type: "everyday",
        caseMm: "28",
        thicknessMm: 8.48,
        movement: "Quartz",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:Omega constellation quartz day-date Manhattan.jpg",
        pictured: "An Omega Constellation “Manhattan” from the 1980s",
        why: "The Constellation line dates to 1952; the bezel “claws” at 3 and 9 come from the 1982 Manhattan."
    },
    santos: {
        brand: "Cartier",
        model: "Santos de Cartier, medium",
        type: "everyday",
        caseMm: "35.1 × 41.9",
        thicknessMm: 8.83,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:Cartier Santos wristwatch.jpg",
        pictured: "A Santos de Cartier on display in Cartier’s Prague boutique",
        why: "Designed in 1904 for aviator Alberto Santos-Dumont, who wanted to read the time mid-flight."
    },
    panthere: {
        brand: "Cartier",
        model: "Panthère de Cartier, small",
        type: "jewelry",
        caseMm: "22 × 30",
        thicknessMm: 6,
        movement: "Quartz",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:Cartier Panthere lady’s 2 tone watch.jpg",
        pictured: "A Panthère de Cartier in steel and gold",
        why: "Launched in 1983 and revived in 2017, its supple link bracelet wears like jewelry."
    },
    serpenti: {
        brand: "Bulgari",
        model: "Serpenti Tubogas",
        type: "jewelry",
        caseMm: "35",
        thicknessMm: null,
        movement: "Quartz",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:BVLGARI watch.jpg",
        pictured: "A Bulgari Serpenti watch",
        why: "A coiled steel Tubogas bracelet wraps the wrist like a bangle: part watch, part jewelry."
    },
    nautilus: {
        brand: "Patek Philippe",
        model: "Nautilus 5811/1G",
        type: "everyday",
        caseMm: "41",
        thicknessMm: 8.2,
        movement: "Automatic",
        strap: "White gold bracelet",
        tier: "grail",
        photo: "File:Patek-Philippe-Nautilus-5711-1A-010-1.jpg",
        pictured: "A Patek Philippe Nautilus 5711/1A, the steel model the 5811/1G replaced",
        why: "Gérald Genta designed the first Nautilus in 1976; the white-gold 5811/1G replaced the famous steel 5711 in 2022."
    },
    "royal-oak": {
        brand: "Audemars Piguet",
        model: "Royal Oak “Jumbo” 16202ST",
        type: "everyday",
        caseMm: "39",
        thicknessMm: 8.1,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "grail",
        photo: "File:Audemars Piguet Royal Oak ref. 15202.jpg",
        pictured: "An Audemars Piguet Royal Oak 15202, the 16202’s predecessor, on the wrist",
        why: "Gérald Genta designed the 1972 Royal Oak, an early luxury sports watch in steel; this 39 mm version arrived in 2022."
    },
    "historiques-222": {
        brand: "Vacheron Constantin",
        model: "Historiques 222",
        type: "everyday",
        caseMm: "37",
        thicknessMm: 7.95,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "grail",
        photo: "File:Vacheron Constantin Historique 222.jpg",
        pictured: "A Vacheron Constantin 222, probably the gold re-edition",
        why: "A reissue of the integrated-bracelet 222 that Vacheron Constantin launched in 1977 for its 222nd anniversary."
    },
    patrimony: {
        brand: "Vacheron Constantin",
        model: "Patrimony Manual-Winding",
        type: "dress",
        caseMm: "39",
        thicknessMm: 7.72,
        movement: "Manual-wind",
        strap: "Alligator strap",
        tier: "grail",
        photo: "File:Vacheron Constantin Patrimony gold watch.jpg",
        pictured: "A gold Vacheron Constantin Patrimony from about 1990",
        why: "From a maker that has worked without interruption since 1755; its hand-wound calibre is just 2.6 mm thick."
    },
    "jlc-master": {
        brand: "Jaeger-LeCoultre",
        model: "Master Ultra Thin Moon",
        type: "dress",
        caseMm: "39",
        thicknessMm: 9.3,
        movement: "Automatic",
        strap: "Alligator strap",
        tier: "grail",
        photo: "File:Jaeger Le Coultre ultra thin moonphase Q1258420.jpg",
        pictured: "A Jaeger-LeCoultre Master Ultra Thin Moon",
        why: "A moon phase and date in a 9.3 mm case, from the Vallée de Joux maker that also builds the Reverso."
    },
    "breguet-classique": {
        brand: "Breguet",
        model: "Classique 5177",
        type: "dress",
        caseMm: "38",
        thicknessMm: 8.8,
        movement: "Automatic",
        strap: "Leather strap",
        tier: "grail",
        photo: "File:Breguet ref. 5177 con datario e secondi al centro.jpg",
        pictured: "A Breguet Classique 5177 with date and centre seconds",
        why: "Its hollow-tipped “Breguet hands” date back to Abraham-Louis Breguet in 1783; the dial is grand feu enamel."
    },
    "piaget-polo": {
        brand: "Piaget",
        model: "Polo Date",
        type: "everyday",
        caseMm: "42",
        thicknessMm: 9.4,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "grail",
        photo: "File:Piaget Polo S.jpg",
        pictured: "A Piaget Polo S, the 2016 steel Polo",
        why: "Piaget’s Polo began in 1979 as an all-gold watch; the name returned in 2016 on a steel sports model."
    },
    "tank-americaine": {
        brand: "Cartier",
        model: "Tank Américaine, large",
        type: "dress",
        caseMm: "24.4 × 44.4",
        thicknessMm: 8.6,
        movement: "Automatic",
        strap: "Alligator strap",
        tier: "mid",
        photo: "File:Cartier Tank Americaine automatico in acciaio.jpg",
        pictured: "A steel Cartier Tank Américaine automatic",
        why: "Introduced in 1989, the curved Tank Américaine stretches Louis Cartier’s 1917 Tank into a longer, slimmer shape."
    },
    tangente: {
        brand: "Nomos Glashütte",
        model: "Tangente 35",
        type: "dress",
        caseMm: "35",
        thicknessMm: 6.6,
        thicknessApprox: true,
        movement: "Manual-wind",
        strap: "Leather strap",
        tier: "mid",
        photo: "File:NOMOS Glashütte Tangente.jpg",
        pictured: "A Nomos Glashütte Tangente",
        why: "A Bauhaus-style dial from Glashütte, Germany’s watchmaking town, with a hand-wound movement in a 35 mm case."
    },
    daytona: {
        brand: "Rolex",
        model: "Cosmograph Daytona 126500LN",
        type: "sport",
        caseMm: "40",
        thicknessMm: 11.9,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "grail",
        photo: "File:Daytona116509.jpg",
        pictured: "A white-gold Rolex Daytona 116509, the previous generation",
        why: "Launched in 1963 for endurance racing drivers; the 126500LN arrived in 2023 with the updated calibre 4131."
    },
    "gmt-master": {
        brand: "Rolex",
        model: "GMT-Master II 126710BLNR",
        type: "sport",
        caseMm: "40",
        thicknessMm: null,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "grail",
        photo: "File:Rolex GMT Master II 116710BLNR Batman.jpg",
        pictured: "A Rolex GMT-Master II 116710BLNR, the 126710BLNR’s predecessor",
        why: "Descended from the 1950s GMT-Master made for airline pilots; a 24-hour hand and bezel track a second time zone."
    },
    seamaster: {
        brand: "Omega",
        model: "Seamaster Diver 300M",
        type: "dive",
        caseMm: "42",
        thicknessMm: 13.56,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "mid",
        photo: "File:Omega Seamaster chronograph watch (300 meters water resist).jpg",
        pictured: "An Omega Seamaster 300M Chrono Diver, an older chronograph version",
        why: "The 2018 generation brought back the wave-pattern dial and added Omega’s Master Chronometer calibre 8800."
    },
    "fifty-fathoms": {
        brand: "Blancpain",
        model: "Fifty Fathoms Automatique",
        type: "dive",
        caseMm: "45",
        thicknessMm: 15.5,
        movement: "Automatic",
        strap: "Textile strap",
        tier: "grail",
        photo: "File:Blancpain.jpg",
        pictured: "A Blancpain Fifty Fathoms Automatique",
        why: "Blancpain calls its 1953 Fifty Fathoms the first modern dive watch; this version runs for 120 hours on a full wind."
    },
    luminor: {
        brand: "Panerai",
        model: "Luminor Marina",
        type: "dive",
        caseMm: "44",
        thicknessMm: 13.4,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Leather strap",
        tier: "mid",
        photo: "File:Panerai MG 0593.JPG",
        pictured: "A Panerai Luminor",
        why: "Panerai, once a supplier to the Italian navy, applied in 1955 to patent the crown-protecting bridge that defines the Luminor."
    },
    "seiko-skx": {
        brand: "Seiko",
        model: "SKX007",
        type: "dive",
        caseMm: "42",
        thicknessMm: 13,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "entry",
        photo: "File:Seiko SKX007.jpg",
        pictured: "A Seiko SKX007",
        why: "A 200 m automatic dive watch with day and date, made by Seiko until about 2019."
    },
    portugieser: {
        brand: "IWC",
        model: "Portugieser Chronograph",
        type: "sport",
        caseMm: "41",
        thicknessMm: 13,
        movement: "Automatic",
        strap: "Leather strap",
        tier: "mid",
        photo: "File:IWC Portuguese Automatic.JPG",
        pictured: "An IWC Portugieser on display at a 2009 watch fair",
        why: "The Portugieser line began in the late 1930s with large, precise watches ordered by two Portuguese merchants."
    },
    navitimer: {
        brand: "Breitling",
        model: "Navitimer B01 Chronograph 43",
        type: "sport",
        caseMm: "43",
        thicknessMm: 13.69,
        movement: "Automatic",
        strap: "Leather strap",
        tier: "grail",
        photo: "File:Breitling Navitimer chronograph watch.jpg",
        pictured: "A Breitling Navitimer chronograph",
        why: "Introduced in 1952 with a slide-rule bezel for flight calculations; it became the Aircraft Owners and Pilots Association’s watch."
    },
    monaco: {
        brand: "TAG Heuer",
        model: "Monaco Chronograph",
        type: "sport",
        caseMm: "39 × 39",
        thicknessMm: 15.21,
        movement: "Automatic",
        strap: "Leather strap",
        tier: "mid",
        photo: "File:TAG Heuer Monaco, 2020.jpg",
        pictured: "A TAG Heuer Monaco",
        why: "Heuer launched the square Monaco in 1969, one of the first automatic chronographs and the first in a square water-resistant case."
    },
    chronomaster: {
        brand: "Zenith",
        model: "Chronomaster Sport",
        type: "sport",
        caseMm: "41",
        thicknessMm: 13.6,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Steel bracelet",
        tier: "grail",
        photo: "File:Zenith El Primero 36000.jpg",
        pictured: "A Zenith El Primero chronograph",
        why: "Its El Primero 3600 movement times to a tenth of a second; the chronograph hand circles the dial every 10 seconds."
    },
    swatch: {
        brand: "Swatch",
        model: "Gent “Once Again”",
        type: "everyday",
        caseMm: "34",
        thicknessMm: 8.75,
        movement: "Quartz",
        strap: "Plastic strap",
        tier: "entry",
        photo: "File:Swatch GB101.jpg",
        pictured: "A 1983 Swatch GB101 “Gent Black”",
        why: "Launched in 1983 with a plastic case and just 51 parts, Swatch helped revive Swiss watchmaking in the quartz era."
    }
};


// Which watches suit which dress code ("Wear it to" in each watch’s details).
const DRESS_CODES = {
    "white-tie": {
        name: "White Tie",
        decoded: "The most formal dress code there is: tailcoats and full-length gowns.",
        advice: "No wristwatch. Checking the time hints that you’d rather be elsewhere; a pocket watch is the traditional exception.",
        picks: []
    },
    "black-tie": {
        name: "Black Tie",
        decoded: "Evening formalwear: a tuxedo, or a floor-length gown or very refined dress.",
        advice: "A thin, plain dress watch that slips under the shirt cuff, or a small, slim watch with jewelry doing the talking.",
        picks: ["bambino", "tank-must-large", "calatrava", "tank-must-small", "reverso", "panthere",
            "patrimony", "jlc-master", "breguet-classique", "tank-americaine", "tangente"]
    },
    cocktail: {
        name: "Cocktail",
        decoded: "Dressy, not formal: a dark suit, or a knee- to midi-length dress.",
        advice: "Room for a little shine: a dressy steel watch on a bracelet, or a jewelry watch you can stack.",
        picks: ["prx-40", "santos", "datejust-36", "prx-35", "panthere", "serpenti",
            "nautilus", "royal-oak", "historiques-222", "piaget-polo", "daytona"]
    },
    "business-pro": {
        name: "Business Professional",
        decoded: "Interview-ready: a matched suit and tie, or a suit or tailored dress with a blazer.",
        advice: "Understated and well made: steel on leather or a bracelet, and nothing that beeps.",
        picks: ["bambino", "grand-seiko", "datejust-36", "prx-35", "tank-must-small", "lady-datejust",
            "patrimony", "jlc-master", "breguet-classique", "tank-americaine", "portugieser", "tangente"]
    },
    "business-casual": {
        name: "Business Casual",
        decoded: "Office polish without the suit: the blazer is optional and the tie comes off.",
        advice: "The sweet spot for steel: a field watch, a chronograph or a classic on a bracelet.",
        picks: ["khaki-field", "speedmaster", "santos", "constellation", "lady-datejust",
            "nautilus", "royal-oak", "historiques-222", "piaget-polo", "gmt-master", "seamaster",
            "portugieser", "navitimer", "monaco", "chronomaster", "tangente"]
    },
    "smart-casual": {
        name: "Smart Casual",
        decoded: "Relaxed but intentional: dark denim is fine, as long as everything fits.",
        advice: "Tool watches shine here: a retro digital, a dive watch, or a Santos between sport and dress.",
        picks: ["f91w", "black-bay-54", "submariner", "santos",
            "daytona", "gmt-master", "seamaster", "fifty-fathoms", "luminor", "navitimer", "monaco",
            "chronomaster", "seiko-skx", "swatch"]
    }
};

/*
 * EXAMPLE STOPS: replace these with places Evan actually visited.
 * wiki    English Wikipedia article for the place summary
 * watchId the watch in the collection this place connects to
 * link    one factual line on how the place and the watch connect
 * photo   Evan’s own photo, e.g. "images/geneva.jpg" (null = placeholder)
 * story   Evan’s own words (empty = draft)
 */
const EUROPE_STOPS = [
    {
        city: "Geneva",
        country: "Switzerland",
        place: "Geneva",
        wiki: "Geneva",
        watchId: "calatrava",
        link: "Patek Philippe has been based in Geneva since it was founded in 1839.",
        photo: null,
        photoAlt: "",
        story: "",
        example: true
    },
    {
        city: "Paris",
        country: "France",
        place: "Place Vendôme",
        wiki: "Place_Vendôme",
        watchId: "tank-must-large",
        link: "Paris is Cartier’s home city, where Louis Cartier designed the Tank in 1917.",
        photo: null,
        photoAlt: "",
        story: "",
        example: true
    },
    {
        city: "London",
        country: "United Kingdom",
        place: "Bond Street",
        wiki: "Bond_Street",
        watchId: "submariner",
        link: "Hans Wilsdorf founded the company that became Rolex in London in 1905.",
        photo: null,
        photoAlt: "",
        story: "",
        example: true
    }
];

const CURRENCIES = [
    { code: "CHF", name: "Swiss franc" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "British pound" },
    { code: "USD", name: "US dollar" },
    { code: "CNY", name: "Chinese yuan" },
    { code: "HKD", name: "Hong Kong dollar" },
    { code: "JPY", name: "Japanese yen" }
];
