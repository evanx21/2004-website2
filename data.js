"use strict";

/*
 * data.js: everything the page knows.
 *
 * EVAN'S NOTES  Every `take` (on a watch) and `story` (on a Europe stop) is
 *               for Evan's own words. Empty strings show a "draft" box on the
 *               page, so it's easy to see what still needs writing.
 * WATCHES       Real watches. Specs describe the current model named in
 *               `model` (makers' published data; Rolex doesn't publish
 *               thickness, so those figures come from reviews and are marked
 *               approximate). `photo` is a Wikimedia Commons file and
 *               `pictured` says exactly what that photo shows.
 * WATCH_TYPES  The one filter above the watches, with a one-line explanation.
 * MOVEMENTS    Plain-English explanations shown in each watch's details.
 * DRESS_CODES  Which occasions each watch suits ("Wear it to" in the details).
 * INTRO_WATCH  The photo beside the introduction.
 * EUROPE_STOPS Places with a watch story. The three below are examples to
 *              replace with places Evan actually visited.
 * CURRENCIES   Currencies offered by the price converter.
 */

const PRICE_TIERS = {
    entry: "Entry · under $1k",
    mid: "Mid · $1k–10k",
    grail: "Grail · $10k+"
};

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
        summary: "Tool watches: a stopwatch, a field watch, a digital. Tough, easy to read and easy to live with."
    },
    everyday: {
        label: "Everyday",
        summary: "Steel on a bracelet: smart enough for a meeting, tough enough for every day."
    },
    jewelry: {
        label: "Jewelry",
        summary: "Designed by jewelers, where the bracelet matters as much as the dial."
    }
};

// Keys match each watch's `movement`.
const MOVEMENTS = {
    "Quartz": {
        label: "Quartz",
        summary: "A battery and a vibrating quartz crystal keep time. It's the most accurate and affordable kind, and the seconds hand ticks once a second."
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
        summary: "Grand Seiko's hybrid: a mainspring powers it and a quartz-regulated glide wheel sets the pace, so the seconds hand glides."
    }
};

/*
 * type   one of the WATCH_TYPES keys
 * take   Evan's own note on this watch (empty = draft)
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
        why: "A domed crystal and an in-house automatic movement give a vintage dress-watch look at an entry price.",
        take: ""
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
        why: "Louis Cartier designed the Tank in 1917. At 6.6 mm thin, it disappears under a shirt cuff.",
        take: ""
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
        why: "The 1917 Tank in its smaller size: discreet on a slim wrist, and just as at home on a large one.",
        take: ""
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
        why: "Introduced in 1932 as Ref. 96, the plain, round Calatrava is the archetypal dress watch.",
        take: ""
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
        why: "Patented in 1931, its case flips over to protect the crystal, an idea prompted by polo players breaking watch glass.",
        take: ""
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
        why: "Introduced in 1953 as a 100 m dive watch; today's no-date version is rated to 300 m.",
        take: ""
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
        why: "A 2023 tribute to Tudor's first dive watch, the 1954 ref. 7922, in a compact 37 mm case.",
        take: ""
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
        why: "NASA qualified it for spaceflight in March 1965, and it became the first watch worn on the Moon.",
        take: ""
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
        why: "Hamilton supplied over a million watches to US forces in 1942–45; this hand-wound field watch keeps that look.",
        take: ""
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
        why: "Introduced in 1989, it weighs 21 g and runs about seven years on one battery.",
        take: ""
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
        why: "Revives a 1978 Tissot design with an integrated steel bracelet; the automatic runs for 80 hours.",
        take: ""
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
        why: "The 1978-inspired PRX at 35 mm, with a quartz movement and the same integrated steel bracelet.",
        take: ""
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
        why: "Launched in 1945 as the first self-winding chronometer wristwatch with a date window on the dial.",
        take: ""
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
        why: "The Datejust's date window, magnifying Cyclops lens and Oyster bracelet, scaled to 31 mm.",
        take: ""
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
        why: "Its white dial is textured like wind-swept snow, and its Spring Drive seconds hand glides instead of ticking.",
        take: ""
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
        why: "The Constellation line dates to 1952; the bezel “claws” at 3 and 9 come from the 1982 Manhattan.",
        take: ""
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
        pictured: "A Santos de Cartier on display in Cartier's Prague boutique",
        why: "Designed in 1904 for aviator Alberto Santos-Dumont, who wanted to read the time mid-flight.",
        take: ""
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
        photo: "File:Cartier Panthere lady's 2 tone watch.jpg",
        pictured: "A Panthère de Cartier in steel and gold",
        why: "Launched in 1983 and revived in 2017, its supple link bracelet wears like jewelry.",
        take: ""
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
        why: "A coiled steel Tubogas bracelet wraps the wrist like a bangle: part watch, part jewelry.",
        take: ""
    }
};

// The photo beside the introduction.
const INTRO_WATCH = "calatrava";

// Which watches suit which dress code ("Wear it to" in each watch's details).
const DRESS_CODES = {
    "white-tie": {
        name: "White Tie",
        decoded: "The most formal dress code there is: tailcoats and full-length gowns.",
        advice: "No wristwatch. Checking the time hints that you'd rather be elsewhere; a pocket watch is the traditional exception.",
        picks: []
    },
    "black-tie": {
        name: "Black Tie",
        decoded: "Evening formalwear: a tuxedo, or a floor-length gown or very refined dress.",
        advice: "A thin, plain dress watch that slips under the shirt cuff, or a small, slim watch with jewelry doing the talking.",
        picks: ["bambino", "tank-must-large", "calatrava", "tank-must-small", "reverso", "panthere"]
    },
    cocktail: {
        name: "Cocktail",
        decoded: "Dressy, not formal: a dark suit, or a knee- to midi-length dress.",
        advice: "Room for a little shine: a dressy steel watch on a bracelet, or a jewelry watch you can stack.",
        picks: ["prx-40", "santos", "datejust-36", "prx-35", "panthere", "serpenti"]
    },
    "business-pro": {
        name: "Business Professional",
        decoded: "Interview-ready: a matched suit and tie, or a suit or tailored dress with a blazer.",
        advice: "Understated and well made: steel on leather or a bracelet, and nothing that beeps.",
        picks: ["bambino", "grand-seiko", "datejust-36", "prx-35", "tank-must-small", "lady-datejust"]
    },
    "business-casual": {
        name: "Business Casual",
        decoded: "Office polish without the suit: the blazer is optional and the tie comes off.",
        advice: "The sweet spot for steel: a field watch, a chronograph or a classic on a bracelet.",
        picks: ["khaki-field", "speedmaster", "santos", "constellation", "lady-datejust"]
    },
    "smart-casual": {
        name: "Smart Casual",
        decoded: "Relaxed but intentional: dark denim is fine, as long as everything fits.",
        advice: "Tool watches shine here: a retro digital, a dive watch, or a Santos between sport and dress.",
        picks: ["f91w", "black-bay-54", "submariner", "santos"]
    }
};

/*
 * EXAMPLE STOPS: replace these with places Evan actually visited.
 * wiki    English Wikipedia article for the place summary
 * watchId the watch in the collection this place connects to
 * link    one factual line on how the place and the watch connect
 * photo   Evan's own photo, e.g. "images/geneva.jpg" (null = placeholder)
 * story   Evan's own words (empty = draft)
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
        link: "Paris is Cartier's home city, where Louis Cartier designed the Tank in 1917.",
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
