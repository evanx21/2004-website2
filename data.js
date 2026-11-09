"use strict";

/*
 * data.js: the concierge's knowledge base.
 *
 * WATCHES      Real watches. Specs describe the current model named in `model`
 *              (makers' published data; Rolex doesn't publish thickness, so
 *              those figures come from reviews and are marked approximate).
 *              `photo` is a Wikimedia Commons file title, and `pictured` says
 *              exactly what that photo shows. It is sometimes an older or
 *              slightly different reference of the same watch.
 * DRESS_CODES  What the dress code means, the watch etiquette, and three
 *              picks for each wardrobe (menswear / womenswear).
 * HERO_WATCHES Watches whose photos appear at the top of the page.
 * POCKET_WATCH The photo shown for White Tie, where wristwatches aren't worn.
 * DRESS_CODE_PATTERNS, SAMPLE_INVITATIONS  For reading pasted invitations.
 */

const PRICE_TIERS = {
    entry: "Entry · under $1k",
    mid: "Mid · $1k–10k",
    grail: "Grail · $10k+"
};

// strapType drives the weather tip: leather | bracelet | textile | resin
const WATCHES = {
    bambino: {
        brand: "Orient",
        model: "Bambino",
        caseMm: "40.5",
        thicknessMm: 11.8,
        movement: "Automatic",
        strap: "Leather strap",
        strapType: "leather",
        tier: "entry",
        photo: "File:Orient Watch - Bambino (ER24005W) (29121883374).jpg",
        pictured: "An Orient Bambino, ref. ER24005W",
        why: "A domed crystal and an in-house automatic movement give a vintage dress-watch look at an entry price."
    },
    "tank-must-large": {
        brand: "Cartier",
        model: "Tank Must, large",
        caseMm: "25.5 × 33.7",
        thicknessMm: 6.6,
        movement: "Quartz",
        strap: "Leather strap",
        strapType: "leather",
        tier: "mid",
        photo: "File:Cartier Tank.jpg",
        pictured: "A vintage Les Must de Cartier Tank",
        why: "Louis Cartier designed the Tank in 1917. At 6.6 mm thin, it disappears under a shirt cuff."
    },
    "tank-must-small": {
        brand: "Cartier",
        model: "Tank Must, small",
        caseMm: "22 × 29.5",
        thicknessMm: 6.6,
        movement: "Quartz",
        strap: "Leather strap",
        strapType: "leather",
        tier: "mid",
        photo: "File:Cartier Tank.jpg",
        pictured: "A vintage Les Must de Cartier Tank",
        why: "The 1917 Tank in its smaller size: discreet on a slim wrist, and just as at home on a large one."
    },
    calatrava: {
        brand: "Patek Philippe",
        model: "Calatrava 6119",
        caseMm: "39",
        thicknessMm: 8.08,
        movement: "Manual-wind",
        strap: "Leather strap",
        strapType: "leather",
        tier: "grail",
        photo: "File:Calatrava1.jpg",
        pictured: "A Patek Philippe Calatrava, ref. 3944, from about 1999",
        why: "Introduced in 1932 as Ref. 96, the plain, round Calatrava is the archetypal dress watch."
    },
    "prx-40": {
        brand: "Tissot",
        model: "PRX Powermatic 80, 40mm",
        caseMm: "40",
        thicknessMm: 10.93,
        movement: "Automatic",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "entry",
        photo: "File:Tissot PRX.jpg",
        pictured: "A Tissot PRX",
        why: "Revives a 1978 Tissot design with an integrated steel bracelet; the automatic runs for 80 hours."
    },
    "prx-35": {
        brand: "Tissot",
        model: "PRX 35mm",
        caseMm: "35",
        thicknessMm: 9.6,
        movement: "Quartz",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "entry",
        photo: "File:Tissot PRX.jpg",
        pictured: "A Tissot PRX",
        why: "The 1978-inspired PRX at 35 mm, with a quartz movement and the same integrated steel bracelet."
    },
    santos: {
        brand: "Cartier",
        model: "Santos de Cartier, medium",
        caseMm: "35.1 × 41.9",
        thicknessMm: 8.83,
        movement: "Automatic",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:Cartier Santos wristwatch.jpg",
        pictured: "A Santos de Cartier on display in Cartier's Prague boutique",
        why: "Designed in 1904 for aviator Alberto Santos-Dumont, who wanted to read the time mid-flight."
    },
    "datejust-36": {
        brand: "Rolex",
        model: "Datejust 36",
        caseMm: "36",
        thicknessMm: 11.8,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:Rolex Datejust 126234.jpg",
        pictured: "A Rolex Datejust 36, ref. 126234, on a Jubilee bracelet",
        why: "Launched in 1945 as the first self-winding chronometer wristwatch with a date window on the dial."
    },
    "lady-datejust": {
        brand: "Rolex",
        model: "Datejust 31",
        caseMm: "31",
        thicknessMm: null,
        movement: "Automatic",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:Rolex watch ladies Datejust 1987.jpg",
        pictured: "A 1987 Rolex Lady-Datejust in steel and gold",
        why: "The Datejust's date window, magnifying Cyclops lens and Oyster bracelet, scaled to 31 mm."
    },
    "grand-seiko": {
        brand: "Grand Seiko",
        model: "Snowflake SBGA211",
        caseMm: "41",
        thicknessMm: 12.5,
        movement: "Spring Drive",
        strap: "Titanium bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:Grand Seiko SBGA011.jpg",
        pictured: "A Grand Seiko Snowflake, ref. SBGA011, the model before the SBGA211",
        why: "Its white dial is textured like wind-swept snow, and its Spring Drive seconds hand glides instead of ticking."
    },
    "khaki-field": {
        brand: "Hamilton",
        model: "Khaki Field Mechanical 38mm",
        caseMm: "38",
        thicknessMm: 9.5,
        movement: "Manual-wind",
        strap: "Textile strap",
        strapType: "textile",
        tier: "entry",
        photo: "File:Hamilton Khaki Field Mechanical 39.jpg",
        pictured: "A Hamilton Khaki Field Mechanical",
        why: "Hamilton supplied over a million watches to US forces in 1942–45; this hand-wound field watch keeps that look."
    },
    speedmaster: {
        brand: "Omega",
        model: "Speedmaster Moonwatch Professional",
        caseMm: "42",
        thicknessMm: 13.58,
        movement: "Manual-wind",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:OMEGA-Speedmaster-Professional-Front.jpg",
        pictured: "An Omega Speedmaster Professional from 2005",
        why: "NASA qualified it for spaceflight in March 1965, and it became the first watch worn on the Moon."
    },
    "black-bay-54": {
        brand: "Tudor",
        model: "Black Bay 54",
        caseMm: "37",
        thicknessMm: 11.2,
        movement: "Automatic",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:Tudor Black Bay 54 ref. m79000n-0001.jpg",
        pictured: "A Tudor Black Bay 54, ref. M79000N-0001",
        why: "A 2023 tribute to Tudor's first dive watch, the 1954 ref. 7922, in a compact 37 mm case."
    },
    submariner: {
        brand: "Rolex",
        model: "Submariner No-Date",
        caseMm: "41",
        thicknessMm: 12.5,
        thicknessApprox: true,
        movement: "Automatic",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "grail",
        photo: "File:Rolex Submariner diving watch.jpg",
        pictured: "A Rolex Submariner Date, ref. 116610LN",
        why: "Introduced in 1953 as a 100 m dive watch; today's no-date version is rated to 300 m."
    },
    f91w: {
        brand: "Casio",
        model: "F-91W",
        caseMm: "35.2 × 38.2",
        thicknessMm: 8.5,
        movement: "Quartz",
        strap: "Resin strap",
        strapType: "resin",
        tier: "entry",
        photo: "File:Casio F-91W 82T38575.jpg",
        pictured: "A Casio F-91W",
        why: "Introduced in 1989, it weighs 21 g and runs about seven years on one battery."
    },
    reverso: {
        brand: "Jaeger-LeCoultre",
        model: "Reverso Classic Medium Thin",
        caseMm: "24.4 × 40.1",
        thicknessMm: 7.56,
        movement: "Manual-wind",
        strap: "Leather strap",
        strapType: "leather",
        tier: "mid",
        photo: "File:Jaeger-LeCoultre Reverso, anni 2000.jpg",
        pictured: "A Jaeger-LeCoultre Reverso from the 2000s",
        why: "Patented in 1931, its case flips over to protect the crystal, an idea prompted by polo players breaking watch glass."
    },
    panthere: {
        brand: "Cartier",
        model: "Panthère de Cartier, small",
        caseMm: "22 × 30",
        thicknessMm: 6,
        movement: "Quartz",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:Cartier Panthere lady's 2 tone watch.jpg",
        pictured: "A Panthère de Cartier in steel and gold",
        why: "Launched in 1983 and revived in 2017, its supple link bracelet wears like jewelry."
    },
    serpenti: {
        brand: "Bulgari",
        model: "Serpenti Tubogas",
        caseMm: "35",
        thicknessMm: null,
        movement: "Quartz",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:BVLGARI watch.jpg",
        pictured: "A Bulgari Serpenti watch",
        why: "A coiled steel Tubogas bracelet wraps the wrist like a bangle: part watch, part jewelry."
    },
    constellation: {
        brand: "Omega",
        model: "Constellation 28mm",
        caseMm: "28",
        thicknessMm: 8.48,
        movement: "Quartz",
        strap: "Steel bracelet",
        strapType: "bracelet",
        tier: "mid",
        photo: "File:Omega constellation quartz day-date Manhattan.jpg",
        pictured: "An Omega Constellation “Manhattan” from the 1980s",
        why: "The Constellation line dates to 1952; the bezel “claws” at 3 and 9 come from the 1982 Manhattan."
    }
};

const DRESS_CODES = {
    "white-tie": {
        name: "White Tie",
        decoded: "The most formal dress code there is: tailcoats and full-length gowns, for state dinners, balls and opera galas.",
        wrist: {
            menswear: {
                note: "No wristwatch. At white tie, checking the time hints that you'd rather be elsewhere. A pocket watch in the waistcoat is the traditional exception.",
                picks: []
            },
            womenswear: {
                note: "No wristwatch. Evening gloves and fine jewelry take its place. If you need the time, a small pocket watch in your evening bag is the elegant workaround.",
                picks: []
            }
        }
    },
    "black-tie": {
        name: "Black Tie",
        decoded: "Evening formalwear: a tuxedo for menswear; a floor-length gown or a very refined dress for womenswear.",
        wrist: {
            menswear: {
                note: "A thin, plain dress watch on a black leather strap. It should slip under the shirt cuff and stay there until you need it.",
                picks: ["bambino", "tank-must-large", "calatrava"]
            },
            womenswear: {
                note: "A small, slim watch, or none at all. At black tie your jewelry does the talking.",
                picks: ["tank-must-small", "reverso", "panthere"]
            }
        }
    },
    cocktail: {
        name: "Cocktail",
        decoded: "Dressy, not formal: a dark suit, or a knee- to midi-length dress. Personality is welcome.",
        wrist: {
            menswear: {
                note: "Room for a little shine: a dressy steel watch on a bracelet.",
                picks: ["prx-40", "santos", "datejust-36"]
            },
            womenswear: {
                note: "Your chance for sparkle: a jewelry watch, or a bracelet watch you can stack with bangles.",
                picks: ["prx-35", "panthere", "serpenti"]
            }
        }
    },
    "business-pro": {
        name: "Business Professional",
        decoded: "Interview-ready: a matched suit and tie, or a suit or tailored dress with a blazer.",
        wrist: {
            menswear: {
                note: "Understated and well made: steel on leather or a bracelet, and nothing that beeps.",
                picks: ["bambino", "grand-seiko", "datejust-36"]
            },
            womenswear: {
                note: "Slim and quiet: a small watch that reads as polish, not jewelry.",
                picks: ["prx-35", "tank-must-small", "lady-datejust"]
            }
        }
    },
    "business-casual": {
        name: "Business Casual",
        decoded: "Office polish without the suit: the blazer is optional and the tie comes off.",
        wrist: {
            menswear: {
                note: "The sweet spot for steel: a field watch, a chronograph or a classic on a bracelet.",
                picks: ["khaki-field", "speedmaster", "santos"]
            },
            womenswear: {
                note: "Easy watches that go from a meeting to dinner: a canvas-strap field watch or steel on a bracelet.",
                picks: ["khaki-field", "constellation", "lady-datejust"]
            }
        }
    },
    "smart-casual": {
        name: "Smart Casual",
        decoded: "Relaxed but intentional: dark denim is fine, as long as everything fits and looks chosen.",
        wrist: {
            menswear: {
                note: "Tool watches shine here: a retro digital, a dive watch, or the dive watch everyone copies.",
                picks: ["f91w", "black-bay-54", "submariner"]
            },
            womenswear: {
                note: "Sporty steel or a retro digital. The Santos sits neatly between sport and dress.",
                picks: ["f91w", "black-bay-54", "santos"]
            }
        }
    }
};

const HERO_WATCHES = ["tank-must-large", "calatrava", "serpenti"];

const POCKET_WATCH = {
    photo: "File:Vintage Waltham 14 kt. Gold Pocket Watch, Roman Numeral Dial (8458964903).jpg",
    pictured: "A Waltham 14-karat gold pocket watch with a Roman-numeral dial"
};

// Checked in order, so the more specific phrases come first.
// "Black tie optional" uses the black tie picks.
const DRESS_CODE_PATTERNS = [
    { code: "white-tie", pattern: /white[\s-]tie/i },
    { code: "black-tie", pattern: /black[\s-]tie|tuxedo|formal attire/i },
    { code: "cocktail", pattern: /cocktail[\s-](attire|dress|chic)|(attire|dress code)\s*[:\-–]?\s*cocktail|semi[\s-]?formal/i },
    { code: "business-pro", pattern: /business[\s-](professional|formal|attire)|professional attire/i },
    { code: "business-casual", pattern: /business[\s-]casual/i },
    { code: "smart-casual", pattern: /smart[\s-]casual|dressy[\s-]casual|(attire|dress code)\s*[:\-–]?\s*casual/i }
];

// {DATE} becomes an upcoming date. The city sits on its own "City, Region" line.
// weekday: 0 = Sunday … 6 = Saturday
const SAMPLE_INVITATIONS = [
    {
        weekday: 6,
        text: "The Lindell Arts Foundation\ninvites you to its Autumn Gala\n\n{DATE}\nCocktails at 7:00 PM, dinner to follow\nThe Grand Hall\nSt. Louis, Missouri\n\nBlack Tie"
    },
    {
        weekday: 5,
        text: "You're invited to Skyline Fridays!\nDrinks, a DJ and the best view in town.\n\n{DATE}, 8:00 PM\nThe Terrace on 34th\nNew York, New York\n\nCocktail attire"
    },
    {
        weekday: 3,
        text: "Engineering & Technology Career Fair\nMeet more than 120 employers.\n\n{DATE}, 10:00 AM – 3:00 PM\nThe Athletic Complex\nSt. Louis, Missouri\n\nBusiness professional attire required."
    },
    {
        weekday: 6,
        text: "The Ringstrasse Society\nrequests the pleasure of your company\nat its Winter Ball\n\n{DATE} at 9:00 PM\nThe Imperial Ballroom\nVienna, Austria\n\nWhite Tie"
    },
    {
        weekday: 1,
        text: "Q4 Strategy Offsite\nA day of planning, lunch on us.\n\n{DATE} at 9:30 AM\nPier 70 Studios\nSeattle, Washington\n\nDress code: business casual"
    },
    {
        weekday: 4,
        text: "Opening reception: \"Light Years\"\nNew paintings by R. Alvarez\n\n{DATE}, 6:30 PM\nGallery Nine\nLos Angeles, California\n\nSmart casual"
    }
];
