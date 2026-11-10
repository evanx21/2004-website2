"use strict";

/*
 * data.js: everything the page knows.
 *
 * EVAN’S NOTES  Each Europe stop’s `story` is for Evan’s own words. An empty
 *               string shows a "draft" box on the page.
 * BRANDS        Every brand on the site: where and when it was founded and
 *               what it’s known for (the "Maker" line in a watch’s details).
 *               Names match `brand`. `say` (hard names only): the language
 *               to read the name in, `text` when the voice needs a respelling
 *               to get it right, and `guide`, the English spelling shown
 *               beside the Say it button.
 * SPECIALTIES   "Who’s best at what" in Watch basics.
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
    mid: "$1,000 to $10,000",
    grail: "Over $10,000"
};

const BRANDS = {
    "Patek Philippe": {
        origin: "Geneva, 1839",
        note: "Owned by the Stern family since 1932, and known above all for complicated watches.",
        say: { lang: "fr-FR", guide: "pah-TEK fee-LEEP" }
    },
    "Audemars Piguet": {
        origin: "Le Brassus, 1875",
        note: "Still owned by the Audemars and Piguet families, in the village where it started.",
        say: { lang: "fr-FR", text: "Audemar Piguet", guide: "oh-duh-MAR pee-GAY" }
    },
    "Vacheron Constantin": {
        origin: "Geneva, 1755",
        note: "Says it has made watches without a break since 1755, longer than anyone else.",
        say: { lang: "fr-FR", guide: "vash-uh-RON kon-stahn-TAN" }
    },
    "Jaeger-LeCoultre": {
        origin: "Le Sentier, 1833",
        note: "Other brands used to buy its movements, which is why people call it the watchmaker’s watchmaker. It also makes the Reverso.",
        say: { lang: "fr-FR", text: "Jégère Lecoultre", guide: "zhay-ZHAIR luh-KOO-truh" }
    },
    "Breguet": {
        origin: "Paris, 1775",
        note: "Founded by Abraham-Louis Breguet, who patented the tourbillon in 1801.",
        say: { lang: "fr-FR", guide: "bruh-GAY" }
    },
    "Blancpain": {
        origin: "Villeret, 1735",
        note: "Says it’s the oldest watch brand still in business.",
        say: { lang: "fr-FR", guide: "blahn-PAN" }
    },
    "Piaget": {
        origin: "La Côte-aux-Fées, 1874",
        note: "Known for very thin movements and for watches that are also jewelry.",
        say: { lang: "fr-FR", guide: "pyah-ZHAY" }
    },
    "Cartier": {
        origin: "Paris, 1847",
        note: "The Paris jeweler. Louis Cartier was designing wristwatches in the early 1900s, when most men still carried pocket watches.",
        say: { lang: "fr-FR", guide: "kar-tee-AY" }
    },
    "Bulgari": {
        origin: "Rome, 1884",
        note: "A jeweler from Rome. Besides the snake-shaped Serpenti, it makes the Octo Finissimo, which has set several records for thinness.",
        say: { lang: "it-IT", text: "Bùlgari", guide: "BOOL-gah-ree" }
    },
    "Grand Seiko": {
        origin: "Japan, 1960",
        note: "Seiko’s luxury line, known for its mirror-like Zaratsu polishing.",
        say: { lang: "ja-JP", text: "グランドセイコー", guide: "grand SAY-koh" }
    },
    "Rolex": {
        origin: "Geneva, 1905",
        note: "Started in London and moved to Geneva in 1919. Its 1926 Oyster was one of the first waterproof watch cases."
    },
    "Omega": {
        origin: "Biel/Bienne, 1848",
        note: "The official timekeeper of the Olympic Games since 1932."
    },
    "Tudor": {
        origin: "Geneva, 1926",
        note: "Hans Wilsdorf, who founded Rolex, started Tudor as a cheaper sister brand."
    },
    "Breitling": {
        origin: "Saint-Imier, 1884",
        note: "Best known for pilot’s chronographs like the Navitimer."
    },
    "TAG Heuer": {
        origin: "Saint-Imier, 1860",
        note: "Edouard Heuer started it in 1860, and it made its name with racing stopwatches and chronographs.",
        say: { lang: "en-US", text: "Tag Hoyer", guide: "tag HOY-er" }
    },
    "Zenith": {
        origin: "Le Locle, 1865",
        note: "Its El Primero, from 1969, was one of the first automatic chronograph movements."
    },
    "IWC": {
        origin: "Schaffhausen, 1868",
        note: "Started by an American, F. A. Jones. Known for pilot’s watches, like mine, and the Portugieser."
    },
    "Panerai": {
        origin: "Florence, 1860",
        note: "Started as a watch shop and workshop in Florence.",
        say: { lang: "it-IT", guide: "pah-neh-RYE" }
    },
    "Seiko": {
        origin: "Tokyo, 1881",
        note: "Sold the world’s first quartz wristwatch, the Astron, in 1969.",
        say: { lang: "ja-JP", text: "セイコー", guide: "SAY-koh" }
    },
    "Orient": {
        origin: "Tokyo, 1950",
        note: "A Japanese brand that makes its own automatic movements and keeps its prices low."
    },
    "Tissot": {
        origin: "Le Locle, 1853",
        note: "One of the cheapest ways to get a Swiss mechanical watch.",
        say: { lang: "fr-FR", guide: "tee-SOH" }
    },
    "Hamilton": {
        origin: "Lancaster, Pennsylvania, 1892",
        note: "Started in Pennsylvania and is now made in Switzerland. Still known for military-style field watches."
    },
    "Nomos Glashütte": {
        origin: "Glashütte, 1990",
        note: "Founded in 1990, right after the Berlin Wall came down. Its dials are clean and Bauhaus-style.",
        say: { lang: "de-DE", guide: "NOH-moss GLAHS-hoo-tuh" }
    },
    "Casio": {
        origin: "Tokyo, 1946",
        note: "An electronics company that made its first watch, the Casiotron, in 1974. It also makes the G-Shock and the F-91W."
    },
    "Swatch": {
        origin: "Biel/Bienne, 1983",
        note: "Colorful plastic watches, still made in Switzerland."
    }
};

// "Who’s best at what" in Watch basics. Brand names match BRANDS.
const SPECIALTIES = [
    {
        title: "Thin dress watches",
        text: "Plain dials and slim cases, often wound by hand.",
        brands: ["Patek Philippe", "Vacheron Constantin", "Jaeger-LeCoultre", "Piaget", "Nomos Glashütte"]
    },
    {
        title: "Dive watches",
        text: "The modern dive watch dates from the early 1950s.",
        brands: ["Rolex", "Blancpain", "Omega", "Tudor", "Seiko", "Panerai"]
    },
    {
        title: "Chronographs",
        text: "Watches with a stopwatch built in. Racing drivers and pilots wore them, and an Omega went to the Moon.",
        brands: ["Omega", "Rolex", "Zenith", "TAG Heuer", "Breitling"]
    },
    {
        title: "Pilot’s watches",
        text: "Big, clear dials made to be read in a cockpit, like my IWC.",
        brands: ["IWC", "Breitling"]
    },
    {
        title: "Steel sports watches",
        text: "Expensive watches made in steel, with the bracelet built into the case. The idea took off in the 1970s.",
        brands: ["Audemars Piguet", "Patek Philippe", "Vacheron Constantin", "Piaget", "Tissot"]
    },
    {
        title: "Jewelry watches",
        text: "Watches where the design matters as much as the movement.",
        brands: ["Cartier", "Bulgari", "Piaget"]
    },
    {
        title: "Complications and hand-finishing",
        text: "The most complicated movements, like tourbillons and perpetual calendars, finished by hand.",
        brands: ["Patek Philippe", "Vacheron Constantin", "Audemars Piguet", "Breguet", "Jaeger-LeCoultre"]
    },
    {
        title: "Japanese watchmaking",
        text: "Seiko sold the first quartz wristwatch in 1969 and later came up with Spring Drive.",
        brands: ["Grand Seiko", "Seiko", "Casio", "Orient"]
    },
    {
        title: "Great first watches",
        text: "Well-made watches for under $1,000.",
        brands: ["Tissot", "Hamilton", "Seiko", "Orient", "Casio", "Swatch"]
    }
];

// The one filter on the page. Each summary appears under the buttons when chosen.
const WATCH_TYPES = {
    dress: {
        label: "Dress",
        summary: "Thin and plain, usually on a leather strap, so it fits under a shirt cuff."
    },
    dive: {
        label: "Dive",
        summary: "Made for swimming and diving, with a rotating bezel to time a dive and hands that glow in the dark."
    },
    sport: {
        label: "Sport",
        summary: "Tool watches: chronographs, pilot’s watches, GMTs, a field watch and a digital. They’re tough and easy to read."
    },
    everyday: {
        label: "Everyday",
        summary: "Watches you can wear every day, to a meeting or anywhere else."
    },
    jewelry: {
        label: "Jewelry",
        summary: "Made by jewelers, so the shape and the bracelet get as much attention as the dial."
    }
};

// Keys match each watch’s `movement`. `tip` appears in Watch basics only.
const MOVEMENTS = {
    "Quartz": {
        label: "Quartz",
        summary: "Runs on a battery and a small quartz crystal that vibrates at a steady rate. It’s cheaper and more accurate than a mechanical watch, and the seconds hand ticks once a second.",
        tip: "A new battery every few years is about all it needs."
    },
    "Automatic": {
        label: "Automatic",
        summary: "A mechanical watch that winds itself: a weighted rotor spins when you move your wrist. Wear it and it keeps going. Leave it in a drawer for a couple of days and it stops.",
        tip: "Most luxury watches are automatic. Plan on a service every five to ten years."
    },
    "Manual-wind": {
        label: "Manual-wind",
        summary: "Mechanical, and you wind it yourself by turning the crown every day or two. There’s no rotor inside, so the watch can be thinner.",
        tip: "Wind it each morning until you feel it resist, then stop."
    },
    "Spring Drive": {
        label: "Spring Drive",
        summary: "Seiko’s mix of the two. A mainspring powers it and a quartz crystal controls the speed, so the seconds hand glides instead of ticking.",
        tip: "Only Seiko makes it, mostly for Grand Seiko."
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
        why: "Orient makes the automatic movement itself, and the domed crystal gives it a vintage dress-watch look for not much money."
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
        why: "Louis Cartier designed the Tank in 1917. This one is 6.6 mm thick, thin enough to disappear under a shirt cuff."
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
        why: "The same 1917 Tank, smaller. It looks right on a slim wrist and still works on a bigger one."
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
        why: "First made in 1932 as the Ref. 96. It’s about as plain and round as a dress watch gets."
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
        why: "The case flips over so the glass faces your wrist. It was patented in 1931 for polo players who kept breaking their watches."
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
        why: "The first one, in 1953, was rated to 100 m. Today’s no-date version goes to 300 m."
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
        why: "Tudor’s first dive watch was the ref. 7922 from 1954. This 2023 model is based on it, in a small 37 mm case."
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
        why: "NASA approved it for spaceflight in March 1965, and four years later it was the first watch worn on the Moon."
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
        why: "Hamilton made more than a million watches for US forces between 1942 and 1945. This hand-wound field watch still looks like them."
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
        why: "Out since 1989. It weighs 21 g and one battery lasts about seven years."
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
        why: "A comeback of a 1978 Tissot with the bracelet built into the case. The automatic movement runs for 80 hours."
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
        why: "The same PRX in a 35 mm size, with a quartz movement and the same built-in bracelet."
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
        why: "When it came out in 1945, it was the first self-winding chronometer wristwatch to show the date in a window."
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
        why: "Everything from the Datejust, including the magnifying Cyclops lens over the date, in a 31 mm case on the Oyster bracelet."
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
        why: "The white dial is textured to look like snow blown by the wind, which is why people call it the Snowflake. The Spring Drive seconds hand glides instead of ticking."
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
        why: "Omega started the Constellation line in 1952. The little “claws” on the bezel at 3 and 9 come from the 1982 Manhattan model."
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
        why: "Made in 1904 for the pilot Alberto Santos-Dumont, who couldn’t check a pocket watch while flying."
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
        why: "First made in 1983 and brought back in 2017. The soft link bracelet feels more like jewelry than a watch strap."
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
        why: "The coiled steel Tubogas bracelet wraps around the wrist like a bangle."
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
        why: "Gérald Genta designed the first Nautilus in 1976. In 2022 this white-gold 5811/1G replaced the steel 5711, which had a waiting list of years."
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
        why: "Gérald Genta designed the Royal Oak in 1972 as a luxury watch made of steel. This 39 mm version came out in 2022."
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
        why: "Vacheron Constantin made the original 222 in 1977 for its 222nd anniversary. This is the reissue, with the bracelet built in like the first."
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
        why: "Its hand-wound movement is only 2.6 mm thick, so the whole watch stays slim."
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
        why: "Shows the moon phase and the date in a case only 9.3 mm thick. Same maker as the Reverso."
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
        why: "The hands with hollow tips are called Breguet hands, after Abraham-Louis Breguet, who first made them in 1783. The dial is grand feu enamel, fired in a kiln."
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
        why: "The first Polo, in 1979, was solid gold. Piaget brought the name back in 2016 for this steel sports watch."
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
        why: "A 1989 version of the Tank that’s longer, narrower and curved to fit the wrist."
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
        why: "Made in Glashütte, Germany’s watchmaking town, with a clean Bauhaus-style dial and a hand-wound movement in a 35 mm case."
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
        why: "Rolex made it for endurance racing drivers in 1963. This 126500LN came out in 2023 with the newer calibre 4131."
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
        why: "The first GMT-Master was made for airline pilots in the 1950s. The extra 24-hour hand and the bezel show a second time zone."
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
        why: "The 2018 version brought back the wave pattern on the dial and got Omega’s Master Chronometer calibre 8800."
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
        why: "Blancpain calls the 1953 original the first modern dive watch. This one runs for 120 hours, five days, when fully wound."
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
        why: "Panerai made watches for the Italian navy, and in 1955 it applied to patent the bridge that protects the crown. It’s still the Luminor’s best-known feature."
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
        why: "An automatic dive watch rated to 200 m, with the day and date. Seiko made it until about 2019."
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
        why: "It started in the late 1930s, when two Portuguese merchants asked IWC for large, accurate watches."
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
        why: "It came out in 1952 with a slide rule around the dial for flight math, and became the official watch of the Aircraft Owners and Pilots Association."
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
        why: "Heuer launched the square Monaco in 1969. It was one of the first automatic chronographs and the first in a square water-resistant case."
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
        why: "The El Primero 3600 movement measures tenths of a second, so the chronograph hand goes around the dial every 10 seconds."
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
        why: "The first Swatch, in 1983, had a plastic case and only 51 parts. It sold in the millions while Swiss watchmaking was losing ground to Japanese quartz."
    }
};


// Which watches suit which dress code ("Wear it to" in each watch’s details).
const DRESS_CODES = {
    "white-tie": {
        name: "White Tie",
        decoded: "The most formal dress code there is: tailcoats and full-length gowns.",
        advice: "Traditionally, no wristwatch at all, since checking the time suggests you’d rather be somewhere else. A pocket watch is the old exception.",
        picks: []
    },
    "black-tie": {
        name: "Black Tie",
        decoded: "A tuxedo, or a floor-length gown or a very formal dress.",
        advice: "A thin, plain dress watch that slides under the cuff. With a gown, wear a small, slim watch and let your jewelry stand out.",
        picks: ["bambino", "tank-must-large", "calatrava", "tank-must-small", "reverso", "panthere",
            "patrimony", "jlc-master", "breguet-classique", "tank-americaine", "tangente"]
    },
    cocktail: {
        name: "Cocktail",
        decoded: "Dressy but not formal: a dark suit, or a knee- to midi-length dress.",
        advice: "You can wear a bit of shine here, like a dressy steel watch on a bracelet or a jewelry watch.",
        picks: ["prx-40", "santos", "datejust-36", "prx-35", "panthere", "serpenti",
            "nautilus", "royal-oak", "historiques-222", "piaget-polo", "daytona"]
    },
    "business-pro": {
        name: "Business Professional",
        decoded: "What you’d wear to an interview: a suit and tie, or a suit or tailored dress.",
        advice: "Something simple and well made in steel, on leather or a bracelet. Leave anything that beeps at home.",
        picks: ["bambino", "grand-seiko", "datejust-36", "prx-35", "tank-must-small", "lady-datejust",
            "patrimony", "jlc-master", "breguet-classique", "tank-americaine", "portugieser", "tangente"]
    },
    "business-casual": {
        name: "Business Casual",
        decoded: "Office clothes without the suit. The blazer is optional and you can skip the tie.",
        advice: "Almost any steel watch works here: a field watch, a chronograph or a classic on a bracelet.",
        picks: ["khaki-field", "speedmaster", "santos", "constellation", "lady-datejust",
            "nautilus", "royal-oak", "historiques-222", "piaget-polo", "gmt-master", "seamaster",
            "portugieser", "navitimer", "monaco", "chronomaster", "tangente"]
    },
    "smart-casual": {
        name: "Smart Casual",
        decoded: "Relaxed but put together. Dark jeans are fine if everything fits.",
        advice: "This is where tool watches fit best: a dive watch, a chronograph, even a cheap digital.",
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
