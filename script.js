"use strict";

/*
 * Evan Explains Watches: a student’s guide to watches
 * -------------------------------------------------------------------------
 * Data APIs     Wikimedia Commons (watch photos and their credits)
 *               Wikipedia REST (Hong Kong area notes in "City notes")
 *               Frankfurter (exchange rates for the price converter)
 *               Open-Meteo Geocoding (city search in "Try one on")
 *               Google Places, through the CSE 2004 class proxy (stores near you)
 *               Overpass / OpenStreetMap (the backup shop search)
 * Browser APIs  Geolocation ("Use my location" in Try one on)
 *               Web Speech, speech synthesis ("Say it" in Watch basics and the details)
 *
 * All the content lives in data.js.
 */

/* ===================== Constants ===================== */

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WIKI_SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const FRANKFURTER_API = "https://api.frankfurter.dev/v1/latest";
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const PLACES_API = "https://cse2004.com/api/places/search";
// The CSE 2004 class key. The course proxy adds the real Google key, and allows
// 20 searches a minute and 300 a day, so results are saved in placesCache below.
const CLASS_API_KEY = "3mpffpn2uikw";
const FETCH_TIMEOUT_MS = 15000; // the shop search can take a few seconds
const PHOTO_WIDTH = 800;
const SHOP_RADIUS_M = 15000;
const MAX_SHOPS = 6;
const KM_PER_MILE = 1.609344;
const TIER_ORDER = ["entry", "mid", "grail"];
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const SPEECH_RATE = 0.85; // a little slower than normal, so each syllable is clear
const LANGUAGE_NAMES = { en: "English", fr: "French", it: "Italian", de: "German", ja: "Japanese" };
const MOVEMENT_EXAMPLES = 3; // example watches under each movement: one per price band
const OCCASION_EXAMPLES = 2; // and under each dress code
const MAX_SHOP_DISTANCE_KM = 50; // Google may suggest a far-away boutique; leave those out
const COORDINATE_DECIMALS = 2; // about 1 km


/* ===================== Elements & state ===================== */

const els = {
    movementGrid: document.querySelector("#movement-grid"),
    occasionList: document.querySelector("#occasion-list"),
    specialtyList: document.querySelector("#specialty-list"),
    nameList: document.querySelector("#name-list"),
    watchesSection: document.querySelector("#watches"),
    typeFilter: document.querySelector("#type-filter"),
    typeChips: document.querySelector("#type-chips"),
    typeNote: document.querySelector("#type-note"),
    brandSelect: document.querySelector("#brand-select"),
    watchGrid: document.querySelector("#watch-grid"),
    emptyState: document.querySelector("#empty-state"),
    watchMore: document.querySelector("#watch-more"),
    basicsTabs: document.querySelector("#basics-tabs"),
    lessons: document.querySelectorAll(".lesson"),
    cityTabs: document.querySelectorAll(".city-tab"),
    cityPanels: document.querySelectorAll(".city-note"),
    areaList: document.querySelector("#area-list"),
    converter: document.querySelector("#converter"),
    priceAmount: document.querySelector("#price-amount"),
    priceCurrency: document.querySelector("#price-currency"),
    converterError: document.querySelector("#converter-error"),
    converterResult: document.querySelector("#converter-result"),
    dialog: document.querySelector("#watch-dialog"),
    dialogClose: document.querySelector("#dialog-close"),
    dialogFrame: document.querySelector("#dialog-frame"),
    dialogCredit: document.querySelector("#dialog-credit"),
    dialogBrand: document.querySelector("#dialog-brand"),
    dialogSay: document.querySelector("#dialog-say"),
    dialogTitle: document.querySelector("#dialog-title"),
    dialogTier: document.querySelector("#dialog-tier"),
    dialogWhy: document.querySelector("#dialog-why"),
    dialogCase: document.querySelector("#dialog-case"),
    dialogThickness: document.querySelector("#dialog-thickness"),
    dialogMovement: document.querySelector("#dialog-movement"),
    dialogStrap: document.querySelector("#dialog-strap"),
    dialogMaker: document.querySelector("#dialog-maker"),
    dialogStores: document.querySelector("#dialog-stores"),
    storesSection: document.querySelector("#stores"),
    shopBrand: document.querySelector("#shop-brand"),
    dialogOccasions: document.querySelector("#dialog-occasions"),
    shopSearch: document.querySelector("#shop-search"),
    shopCity: document.querySelector("#shop-city"),
    geoBtn: document.querySelector("#geo-btn"),
    shopStatus: document.querySelector("#shop-status"),
    shopList: document.querySelector("#shop-list"),
    watchTemplate: document.querySelector("#watch-template"),
    sayTemplate: document.querySelector("#say-template")
};

const state = {
    watchId: null, // the watch open in the details dialog
    lastTrigger: null, // the button that opened it, so focus can return there
    shopSearchId: 0, // lets us ignore answers to older shop searches
    showAllWatches: false // false: only the first rows of the gallery
};

// Commons file title → Promise of { src, width, height, pageUrl, artist, license } (or null)
const photoCache = new Map();

// "brand|latitude,longitude" → Promise of the Google Places answer, so a repeat search costs nothing
const placesCache = new Map();

/* ===================== Small helpers ===================== */

async function fetchJSON(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (!response.ok) {
            const error = new Error(`Request failed with status ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (text !== undefined) {
        element.textContent = text;
    }
    return element;
}

function createLink(text, href, className = "") {
    const link = createElement("a", className, text);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
    return link;
}

function setStatus(element, message, tone = "") {
    element.textContent = message;
    element.classList.toggle("is-warning", tone === "warning");
    element.classList.toggle("is-success", tone === "success");
}

function lowerFirst(text) {
    return text.charAt(0).toLowerCase() + text.slice(1);
}

function shorten(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text || "";
    }
    const cut = text.slice(0, maxLength);
    const lastSentence = cut.lastIndexOf(". ");
    return lastSentence > maxLength * 0.5 ? cut.slice(0, lastSentence + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

// Commons returns photographer names as HTML (often a link). Parsing it in a
// separate, inert document gives plain text without running anything.
function htmlToText(html) {
    if (!html) {
        return "";
    }
    const text = new DOMParser().parseFromString(html, "text/html").body.textContent || "";
    return text.replace(/\s+/g, " ").trim();
}

/* ===================== Photos (Wikimedia Commons API) ===================== */

// One request fetches the thumbnail URL and credit for several files at once.
async function requestPhotos(titles) {
    const params = new URLSearchParams({
        action: "query",
        format: "json",
        formatversion: "2",
        origin: "*", // lets the browser call the API from another site
        prop: "imageinfo",
        iiprop: "url|extmetadata",
        iiurlwidth: String(PHOTO_WIDTH),
        iiextmetadatafilter: "Artist|LicenseShortName",
        titles: titles.join("|")
    });
    const data = await fetchJSON(`${COMMONS_API}?${params}`);
    const query = data.query || {};

    // Commons may tidy a title (e.g. underscores → spaces); remember the original.
    const originalTitles = new Map((query.normalized || []).map(({ from, to }) => [to, from]));
    const photos = new Map();

    (query.pages || []).forEach(page => {
        const info = page.imageinfo && page.imageinfo[0];
        if (!info) {
            return; // the file is missing or was deleted
        }
        const meta = info.extmetadata || {};
        const photo = {
            src: info.thumburl || info.url,
            width: info.thumbwidth,
            height: info.thumbheight,
            pageUrl: info.descriptionurl,
            artist: shorten(htmlToText(meta.Artist && meta.Artist.value) || "Unknown photographer", 60),
            license: htmlToText(meta.LicenseShortName && meta.LicenseShortName.value) || "see the file page"
        };
        photos.set(page.title, photo);
        if (originalTitles.has(page.title)) {
            photos.set(originalTitles.get(page.title), photo);
        }
    });
    return photos;
}

// Returns photos in the same order as `titles`, asking Commons only for ones we haven’t fetched.
function getPhotos(titles) {
    const missing = [...new Set(titles)].filter(title => !photoCache.has(title));

    if (missing.length) {
        const request = requestPhotos(missing);
        missing.forEach(title => {
            const photo = request
                .then(photos => photos.get(title) || null)
                .catch(error => {
                    photoCache.delete(title); // allow a retry next time
                    throw error;
                });
            photoCache.set(title, photo);
        });
    }
    return Promise.all(titles.map(title => photoCache.get(title)));
}

function showPhotoMessage(frame, credit, message) {
    frame.replaceChildren(createElement("p", "photo__placeholder", message));
    if (credit) {
        credit.replaceChildren();
    }
}

// `credit` is optional: the grid cards leave credits to the details dialog.
function showPhoto(frame, credit, photo, pictured) {
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = pictured;
    if (photo.width && photo.height) {
        image.width = photo.width;
        image.height = photo.height;
    }
    // Grid photos load as they scroll into view; the details photo is needed right away.
    image.loading = credit ? "eager" : "lazy";
    image.addEventListener("error", () => showPhotoMessage(frame, credit, "Photo unavailable"));
    frame.replaceChildren(image);

    if (credit) {
        // Says exactly what the photo shows, since it can be a sibling of the model named.
        credit.replaceChildren(
            `Pictured: ${lowerFirst(pictured)}. Photo by ${photo.artist}, ${photo.license}, via `,
            createLink("Wikimedia Commons", photo.pageUrl, "link"),
            "."
        );
    }
}

function loadPhoto(frame, credit, title, pictured) {
    getPhotos([title])
        .then(([photo]) => {
            if (photo) {
                showPhoto(frame, credit, photo, pictured);
            } else {
                showPhotoMessage(frame, credit, "Photo unavailable");
            }
        })
        .catch(() => showPhotoMessage(frame, credit, "Couldn’t load the photo right now."));
}

/* ===================== The watches ===================== */

function renderTypeChips() {
    const options = [["all", "All"], ...Object.entries(WATCH_TYPES).map(([value, type]) => [value, type.label])];
    els.typeChips.replaceChildren(...options.flatMap(([value, label]) => {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "type";
        input.id = `type-${value}`;
        input.value = value;
        input.checked = value === "all";
        const chip = createElement("label", "", label);
        chip.htmlFor = input.id;
        return [input, chip];
    }));
}

function buildWatchCard(id) {
    const watch = WATCHES[id];
    const card = els.watchTemplate.content.firstElementChild.cloneNode(true);
    const openButton = card.querySelector(".watch-card__open");

    card.querySelector(".watch-card__brand").textContent = watch.brand;
    openButton.textContent = watch.model;
    openButton.addEventListener("click", () => openWatch(id, openButton));
    card.querySelector(".watch-card__tier").textContent = PRICE_TIERS[watch.tier];

    loadPhoto(card.querySelector(".photo__frame"), null, watch.photo, watch.pictured);
    return card;
}

// The brand menus: the watch filter (with how many watches each brand has) and the store search.
function renderBrandOptions() {
    const counts = {};
    Object.values(WATCHES).forEach(watch => {
        counts[watch.brand] = (counts[watch.brand] || 0) + 1;
    });
    const brands = Object.keys(counts).sort((a, b) => a.localeCompare(b));
    const buildOptions = (allLabel, label) => {
        const allOption = createElement("option", "", allLabel);
        allOption.value = "all";
        return [allOption, ...brands.map(brand => {
            const option = createElement("option", "", label(brand));
            option.value = brand;
            return option;
        })];
    };

    els.brandSelect.replaceChildren(...buildOptions(`All ${brands.length} brands`, brand => `${brand} (${counts[brand]})`));
    els.shopBrand.replaceChildren(...buildOptions("Any brand", brand => brand));
}

// Cheapest price band first, then by brand and model.
function compareWatches(a, b) {
    return TIER_ORDER.indexOf(WATCHES[a].tier) - TIER_ORDER.indexOf(WATCHES[b].tier)
        || WATCHES[a].brand.localeCompare(WATCHES[b].brand)
        || WATCHES[a].model.localeCompare(WATCHES[b].model);
}

function describeSelection(type, brand, count) {
    if (type !== "all") {
        return WATCH_TYPES[type].summary;
    }
    if (brand !== "all") {
        return `${count} ${count === 1 ? "watch" : "watches"} from ${brand}.`;
    }
    return `All ${count} watches from ${els.brandSelect.options.length - 1} brands, starting with the ones under $1,000.`;
}

function renderWatches() {
    const type = els.typeFilter.elements.type.value;
    const brand = els.brandSelect.value;
    const ids = Object.keys(WATCHES)
        .filter(id => (type === "all" || WATCHES[id].type === type) && (brand === "all" || WATCHES[id].brand === brand))
        .sort(compareWatches);

    els.typeNote.textContent = describeSelection(type, brand, ids.length);
    els.emptyState.hidden = ids.length > 0;
    if (!ids.length) {
        els.emptyState.textContent = `No ${WATCH_TYPES[type].label.toLowerCase()} watches from ${brand} here yet. Try “All” or another brand.`;
    }

    // Only the first rows until the visitor asks for the rest, so the page stays short.
    const preview = previewCount();
    const shown = state.showAllWatches ? ids : ids.slice(0, preview);
    els.watchMore.hidden = ids.length <= preview;
    els.watchMore.textContent = state.showAllWatches ? "Show fewer watches" : `Show all ${ids.length} watches`;
    els.watchMore.setAttribute("aria-expanded", String(state.showAllWatches));

    if (shown.length) {
        getPhotos(shown.map(id => WATCHES[id].photo)).catch(() => {}); // one request for every photo shown
    }
    els.watchGrid.replaceChildren(...shown.map(buildWatchCard));
}

// Two full rows of cards (three on a phone, where there are only two columns).
function previewCount() {
    const columns = getComputedStyle(els.watchGrid).gridTemplateColumns.split(" ").length;
    return columns * (columns <= 2 ? 3 : 2);
}

// A new filter starts from the short list again.
function filterWatches() {
    state.showAllWatches = false;
    renderWatches();
}

function toggleAllWatches() {
    state.showAllWatches = !state.showAllWatches;
    renderWatches();
    if (!state.showAllWatches) {
        els.watchesSection.scrollIntoView({ behavior: REDUCED_MOTION.matches ? "auto" : "smooth", block: "start" });
    }
}

/* ===================== Watch basics ===================== */

// One lesson at a time: the radio buttons above the lessons choose which one shows.
function showLesson() {
    const lesson = els.basicsTabs.querySelector("input:checked").value;
    els.lessons.forEach(panel => {
        panel.hidden = panel.dataset.lesson !== lesson;
    });
}

// Choosing a brand shows all of its watches in the gallery.
function showBrand(brand) {
    els.typeFilter.elements.type.value = "all";
    els.brandSelect.value = brand;
    filterWatches();
    els.watchesSection.scrollIntoView({ behavior: REDUCED_MOTION.matches ? "auto" : "smooth", block: "start" });
}

// A few example watches, one from each price band first, so they run from affordable to grail.
function pickExamples(ids, max) {
    const sorted = [...ids].sort(compareWatches);
    const picks = TIER_ORDER
        .map(tier => sorted.find(id => WATCHES[id].tier === tier))
        .filter(Boolean);
    sorted.forEach(id => {
        if (picks.length < max && !picks.includes(id)) {
            picks.push(id);
        }
    });
    return picks.slice(0, max).sort(compareWatches);
}

// A short list of watches; each name opens that watch's details.
function buildExamples(label, ids) {
    const wrapper = createElement("div", "examples");
    const list = createElement("ul", "examples__list");
    list.append(...ids.map(id => {
        const watch = WATCHES[id];
        const item = document.createElement("li");
        const button = createElement("button", "link-button link-button--inline", `${watch.brand} ${watch.model}`);
        button.type = "button";
        button.addEventListener("click", () => openWatch(id, button));
        item.append(button);
        return item;
    }));
    wrapper.append(createElement("p", "examples__label", label), list);
    return wrapper;
}

function renderMovements() {
    els.movementGrid.replaceChildren(...Object.entries(MOVEMENTS).map(([name, movement]) => {
        const ids = Object.keys(WATCHES).filter(id => WATCHES[id].movement === name);
        const item = createElement("article", "movement");
        item.append(
            createElement("h4", "movement__name", movement.label),
            createElement("p", "movement__summary", movement.summary),
            createElement("p", "movement__tip", movement.tip),
            buildExamples(`${ids.length} on this site, including`, pickExamples(ids, MOVEMENT_EXAMPLES))
        );
        return item;
    }));
}

function renderOccasions() {
    els.occasionList.replaceChildren(...Object.values(DRESS_CODES).map(dressCode => {
        const item = createElement("article", "occasion");
        const body = createElement("div", "occasion__body");
        body.append(
            createElement("p", "occasion__decoded", dressCode.decoded),
            createElement("p", "occasion__advice", dressCode.advice)
        );
        if (dressCode.picks.length) {
            body.append(buildExamples("Try", pickExamples(dressCode.picks, OCCASION_EXAMPLES)));
        }
        item.append(createElement("h4", "occasion__name", dressCode.name), body);
        return item;
    }));
}

function buildBrandButton(name) {
    const button = createElement("button", "link-button link-button--inline", name);
    button.type = "button";
    button.append(createElement("span", "visually-hidden", " watches"));
    button.addEventListener("click", () => showBrand(name));
    return button;
}

function renderSpecialties() {
    els.specialtyList.replaceChildren(...SPECIALTIES.map(specialty => {
        const item = createElement("article", "specialty");
        const head = createElement("div", "specialty__head");
        const brands = createElement("ul", "specialty__brands");
        head.append(
            createElement("h4", "specialty__title", specialty.title),
            createElement("p", "specialty__text", specialty.text)
        );
        brands.append(...specialty.brands.map(name => {
            const brandItem = document.createElement("li");
            brandItem.append(buildBrandButton(name));
            return brandItem;
        }));
        item.append(head, brands);
        return item;
    }));
}

// Every brand whose name is easy to get wrong, with its Say it button.
function renderNames() {
    els.nameList.replaceChildren(...Object.entries(BRANDS)
        .filter(([, brand]) => brand.say)
        .map(([name, brand]) => {
            const item = createElement("li", "name");
            item.append(createElement("p", "name__brand", name), buildSay(name, brand));
            return item;
        }));
}

/* ===================== Say it (Web Speech API: speech synthesis) ===================== */

function canSpeak() {
    return Boolean(window.speechSynthesis) && typeof window.SpeechSynthesisUtterance === "function";
}

// Chrome loads its voices a moment after the page, so wait briefly if the list is still empty.
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
        return Promise.resolve(voices);
    }
    return new Promise(resolve => {
        const finish = () => resolve(window.speechSynthesis.getVoices());
        window.speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
        setTimeout(finish, 1000);
    });
}

// A voice for the exact language (fr-FR), or else any voice in that language (fr-CA, fr-CH…).
function findVoice(voices, lang) {
    const language = lang.split("-")[0];
    return voices.find(voice => voice.lang === lang)
        || voices.find(voice => voice.lang.toLowerCase().startsWith(language))
        || null;
}

async function sayName(name, brand, button, note) {
    const { lang, text = name } = brand.say;
    note.textContent = "";

    if (!canSpeak()) {
        note.textContent = "This browser can’t read names aloud. Follow the spelling instead.";
        return;
    }

    try {
        const voice = findVoice(await loadVoices(), lang);
        if (!voice) {
            const language = LANGUAGE_NAMES[lang.split("-")[0]];
            note.textContent = `This device has no ${language} voice. Follow the spelling instead.`;
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.rate = SPEECH_RATE;
        utterance.addEventListener("start", () => button.classList.add("is-speaking"));
        utterance.addEventListener("end", () => button.classList.remove("is-speaking"));
        utterance.addEventListener("error", event => {
            button.classList.remove("is-speaking");
            // "interrupted" and "canceled" only mean another name started or the details closed.
            if (event.error !== "interrupted" && event.error !== "canceled") {
                note.textContent = "The name couldn’t be played. Follow the spelling instead.";
            }
        });

        const speech = window.speechSynthesis;
        if (speech.speaking || speech.pending) {
            speech.cancel();
            setTimeout(() => speech.speak(utterance), 60); // Chrome can drop speech started right after cancel()
        } else {
            speech.speak(utterance);
        }
    } catch (error) {
        button.classList.remove("is-speaking");
        note.textContent = "The name couldn’t be played. Follow the spelling instead.";
    }
}

// The Say it button, the spelling beside it, and a line for messages if speech isn't available.
function buildSay(name, brand) {
    const say = els.sayTemplate.content.firstElementChild.cloneNode(true);
    const button = say.querySelector(".say__button");
    const note = say.querySelector(".say__note");

    say.querySelector(".visually-hidden").textContent = `: ${name}`;
    say.querySelector(".say__guide").textContent = brand.say.guide;
    button.addEventListener("click", () => sayName(name, brand, button, note));
    return say;
}

function stopSpeaking() {
    if (canSpeak()) {
        window.speechSynthesis.cancel();
    }
}

/* ===================== Watch details (dialog) ===================== */

function formatThickness(watch) {
    if (watch.thicknessMm === null) {
        return "Not published by the maker";
    }
    const value = `${watch.thicknessApprox ? "≈\u00a0" : ""}${watch.thicknessMm}\u00a0mm`;
    // Dress watches are thin so they slide under a shirt cuff.
    let cuff = "needs a looser cuff";
    if (watch.thicknessMm <= 9) {
        cuff = "slides under a shirt cuff";
    } else if (watch.thicknessMm <= 11) {
        cuff = "fits under most cuffs";
    }
    return `${value}, ${cuff}`;
}

function occasionsFor(id) {
    return Object.values(DRESS_CODES)
        .filter(dressCode => dressCode.picks.includes(id))
        .map(dressCode => dressCode.name);
}

function openWatch(id, trigger) {
    const watch = WATCHES[id];
    state.watchId = id;
    state.lastTrigger = trigger;

    els.dialogFrame.replaceChildren(createElement("p", "photo__placeholder", "Loading photo…"));
    loadPhoto(els.dialogFrame, els.dialogCredit, watch.photo, watch.pictured);

    const brand = BRANDS[watch.brand];
    els.dialogBrand.textContent = watch.brand;
    stopSpeaking();
    els.dialogSay.replaceChildren(...(brand.say ? [buildSay(watch.brand, brand)] : []));
    els.dialogMaker.textContent = `${brand.origin}. ${brand.note}`;
    els.dialogTitle.textContent = watch.model;
    els.dialogTier.textContent = PRICE_TIERS[watch.tier];
    els.dialogWhy.textContent = watch.why;
    els.dialogCase.textContent = `${watch.caseMm}\u00a0mm`;
    els.dialogThickness.textContent = formatThickness(watch);
    els.dialogMovement.replaceChildren(
        watch.movement,
        createElement("span", "facts__note", MOVEMENTS[watch.movement].summary)
    );
    els.dialogStrap.textContent = watch.strap;
    els.dialogOccasions.textContent = occasionsFor(id).join(", ");
    els.dialogStores.textContent = `Find ${watch.brand} stores near you`;

    if (!els.dialog.open) {
        els.dialog.showModal();
    }
    els.dialog.scrollTop = 0;
}

// From a watch's details to Try one on, with that watch's brand already chosen.
function goToStores() {
    const brand = WATCHES[state.watchId].brand;
    state.lastTrigger = null; // stay at the store search instead of returning to the watch card
    closeDialog();
    els.shopBrand.value = brand;
    clearShops(`Type a city or use your location to find ${brand} stores.`);
    els.storesSection.scrollIntoView({ behavior: REDUCED_MOTION.matches ? "auto" : "smooth", block: "start" });
    els.shopCity.focus({ preventScroll: true });
}

function closeDialog() {
    els.dialog.close();
}

/* ===================== Try one on (Geolocation, Open-Meteo, Google Places, Overpass) ===================== */

function placeLabel(place) {
    const parts = [place.name, place.admin1, place.country].filter(Boolean);
    return parts.filter((part, index) => parts.indexOf(part) === index).join(", ");
}

// Great-circle distance between two points, in kilometres.
function distanceKm(from, to) {
    const toRadians = degrees => (degrees * Math.PI) / 180;
    const dLat = toRadians(to.latitude - from.latitude);
    const dLon = toRadians(to.longitude - from.longitude);
    const h = Math.sin(dLat / 2) ** 2
        + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function formatDistance(km) {
    return `${(km / KM_PER_MILE).toFixed(1)} mi`;
}

function shopAddress(tags) {
    const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    return [street, tags["addr:city"]].filter(Boolean).join(", ");
}

// Coordinates sent to the shop searches are rounded to about 1 km, so a visitor's exact
// position never leaves the browser. Distances are still worked out from the exact one.
function roundCoordinate(value) {
    return Number(value.toFixed(COORDINATE_DECIMALS));
}

// `brand` is a brand name, or "all" when the visitor chose "Any brand".
function mentionsBrand(text, brand) {
    return brand !== "all" && text.toLowerCase().includes(brand.toLowerCase());
}

// Stores that sell this brand, from Google Maps through the CSE 2004 class proxy.
// Results are saved per brand and area: the class key allows 20 searches a minute.
function queryPlaces(location, brand) {
    const latitude = roundCoordinate(location.latitude);
    const longitude = roundCoordinate(location.longitude);
    const cacheKey = `${brand}|${latitude},${longitude}`;

    if (!placesCache.has(cacheKey)) {
        const params = new URLSearchParams({
            query: brand === "all" ? "watch store" : `${brand} watches`,
            latitude: String(latitude),
            longitude: String(longitude),
            radius: String(SHOP_RADIUS_M),
            limit: String(MAX_SHOPS)
        });
        const request = fetchJSON(`${PLACES_API}?${params}`, {
            headers: { Authorization: `Bearer ${CLASS_API_KEY}` }
        }).catch(error => {
            placesCache.delete(cacheKey); // allow a retry next time
            throw error;
        });
        placesCache.set(cacheKey, request);
    }

    return placesCache.get(cacheKey).then(data => (data.places || [])
        .map(place => {
            const name = place.displayName ? place.displayName.text : "";
            return {
                name,
                kind: place.primaryTypeDisplayName ? place.primaryTypeDisplayName.text : "Store",
                address: place.formattedAddress || "",
                distance: place.location ? distanceKm(location, place.location) : NaN,
                rating: place.rating,
                ratingCount: place.userRatingCount,
                openNow: place.currentOpeningHours ? place.currentOpeningHours.openNow : undefined,
                photo: place.photos && place.photos[0] ? place.photos[0].url : "",
                mentionsBrand: mentionsBrand(name, brand),
                mapUrl: place.googleMapsUri || "",
                mapLabel: "Google Maps"
            };
        })
        // Google ranks by relevance; keep that order, but drop anything far outside the area.
        .filter(shop => shop.name && shop.distance <= MAX_SHOP_DISTANCE_KM)
        .sort((a, b) => Number(b.mentionsBrand) - Number(a.mentionsBrand)));
}

// The backup: any watch shop or jeweler near the place, from OpenStreetMap.
async function queryOpenStreetMap(location, brand) {
    const around = `(around:${SHOP_RADIUS_M},${roundCoordinate(location.latitude)},${roundCoordinate(location.longitude)})`;
    const query = `[out:json][timeout:25];(nwr["shop"="watches"]${around};nwr["shop"="jewelry"]${around};);out center;`;
    const data = await fetchJSON(OVERPASS_API, { method: "POST", body: new URLSearchParams({ data: query }) });

    return (data.elements || [])
        .map(element => {
            const tags = element.tags || {};
            const point = element.center || element;
            return {
                name: tags.name,
                kind: tags.shop === "watches" ? "Watch shop" : "Jeweler",
                address: shopAddress(tags),
                mentionsBrand: mentionsBrand(`${tags.name || ""} ${tags.brand || ""}`, brand),
                distance: distanceKm(location, { latitude: point.lat, longitude: point.lon }),
                mapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
                mapLabel: "Map"
            };
        })
        .filter(shop => shop.name && Number.isFinite(shop.distance))
        // Shops that name this watch’s brand first, then the nearest.
        .sort((a, b) => Number(b.mentionsBrand) - Number(a.mentionsBrand) || a.distance - b.distance)
        .slice(0, MAX_SHOPS);
}

function describeRating(shop) {
    const parts = [];
    if (typeof shop.rating === "number") {
        const reviews = shop.ratingCount ? ` from ${shop.ratingCount.toLocaleString("en-US")} reviews` : "";
        parts.push(`${shop.rating.toFixed(1)} stars${reviews}`);
    }
    if (typeof shop.openNow === "boolean") {
        parts.push(shop.openNow ? "open now" : "closed now");
    }
    const text = parts.join(", ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildShopItem(shop, brand) {
    const item = createElement("li", "shop");
    if (shop.photo) {
        const image = document.createElement("img");
        image.className = "shop__photo";
        image.src = shop.photo;
        image.alt = ""; // the shop's name is right beside it
        image.width = 64;
        image.height = 64;
        image.loading = "lazy";
        image.addEventListener("error", () => image.remove());
        item.append(image);
    }

    const details = createElement("div", "shop__details");
    details.append(
        createElement("p", "shop__name", shop.name),
        createElement("p", "shop__meta", `${shop.kind}, ${formatDistance(shop.distance)} away`)
    );
    const rating = describeRating(shop);
    if (rating) {
        details.append(createElement("p", "shop__meta", rating));
    }
    if (shop.address) {
        details.append(createElement("p", "shop__meta", shop.address));
    }
    if (shop.mentionsBrand) {
        details.append(createElement("p", "shop__brand", `Mentions ${brand}`));
    }
    if (shop.mapUrl) {
        details.append(createLink(shop.mapLabel, shop.mapUrl, "shop__map"));
    }
    item.append(details);
    return item;
}

// Empties the results, and stops any search still running from filling them in.
function clearShops(message = "") {
    state.shopSearchId += 1;
    els.shopList.replaceChildren();
    setStatus(els.shopStatus, message);
}

// Google Places first. If it fails or finds nothing, fall back to OpenStreetMap.
async function findShops(location) {
    const brand = els.shopBrand.value;
    const stores = brand === "all" ? "watch stores" : `${brand} stores`;
    clearShops(`Looking near ${location.label}…`);
    const searchId = state.shopSearchId;

    let shops = [];
    let fallbackNote = "";
    try {
        shops = await queryPlaces(location, brand);
        if (!shops.length) {
            fallbackNote = `Google Maps found no ${stores} nearby, so these are watch shops and jewelers from OpenStreetMap.`;
        }
    } catch (error) {
        fallbackNote = error.status === 429
            ? "The class Google Places API is at its limit for now, so these are watch shops and jewelers from OpenStreetMap."
            : "Google Places isn’t answering right now, so these are watch shops and jewelers from OpenStreetMap.";
    }
    if (searchId !== state.shopSearchId) {
        return; // the visitor searched again or changed the brand
    }

    if (!shops.length) {
        try {
            shops = await queryOpenStreetMap(location, brand);
        } catch (error) {
            if (searchId === state.shopSearchId) {
                setStatus(els.shopStatus, "Neither Google Maps nor OpenStreetMap is answering right now. Please try again in a minute.", "warning");
            }
            return;
        }
        if (searchId !== state.shopSearchId) {
            return;
        }
        if (!shops.length) {
            setStatus(els.shopStatus, `No watch shops or jewelers found within ${SHOP_RADIUS_M / 1000} km of ${location.label}. Try a bigger city nearby.`, "warning");
            return;
        }
    }

    els.shopList.replaceChildren(...shops.map(shop => buildShopItem(shop, brand)));
    if (fallbackNote) {
        setStatus(els.shopStatus, `${fallbackNote} Call ahead to check which brands they carry.`, "warning");
    } else {
        const label = stores.charAt(0).toUpperCase() + stores.slice(1);
        setStatus(els.shopStatus, `${label} near ${location.label}, from Google Maps. Call ahead to check which models they have.`, "success");
    }
}

async function handleShopSearch(submitEvent) {
    submitEvent.preventDefault();
    const name = els.shopCity.value.trim();
    if (name.length < 2) {
        setStatus(els.shopStatus, "Type a city first, or choose “Use my location”.", "warning");
        els.shopCity.focus();
        return;
    }

    setStatus(els.shopStatus, `Looking up “${name}”…`);
    try {
        const params = new URLSearchParams({ name, count: "1", language: "en", format: "json" });
        const data = await fetchJSON(`${GEOCODING_API}?${params}`);
        const place = data.results && data.results[0];
        if (!place) {
            setStatus(els.shopStatus, `We couldn’t find “${name}”. Check the spelling, or try a nearby larger city.`, "warning");
            return;
        }
        findShops({ label: placeLabel(place), latitude: place.latitude, longitude: place.longitude });
    } catch (error) {
        setStatus(els.shopStatus, "The city search isn’t responding. Try again in a moment, or choose “Use my location”.", "warning");
    }
}

function useMyLocation() {
    if (!("geolocation" in navigator)) {
        setStatus(els.shopStatus, "This browser can’t share your location. Type a city instead.", "warning");
        els.shopCity.focus();
        return;
    }

    els.geoBtn.disabled = true;
    setStatus(els.shopStatus, "Finding you…");

    navigator.geolocation.getCurrentPosition(
        position => {
            els.geoBtn.disabled = false;
            findShops({
                label: "you",
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
        },
        error => {
            els.geoBtn.disabled = false;
            let message = "We couldn’t pin down your location. Type a city instead.";
            if (error.code === error.PERMISSION_DENIED) {
                message = "You didn’t allow location access, so type a city instead.";
            } else if (error.code === error.TIMEOUT) {
                message = "Finding your location took too long. Type a city instead.";
            }
            setStatus(els.shopStatus, message, "warning");
            els.shopCity.focus();
        },
        { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
}

/* ===================== City notes ===================== */

function selectCity(cityId, { focus = false, updateHash = false } = {}) {
    const selectedTab = Array.from(els.cityTabs).find(tab => tab.getAttribute("aria-controls") === cityId);
    if (!selectedTab) return;

    els.cityTabs.forEach(tab => {
        const selected = tab === selectedTab;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
    });
    els.cityPanels.forEach(panel => {
        panel.hidden = panel.id !== cityId;
    });
    if (focus) selectedTab.focus();
    // Keep city links shareable without scrolling the reader away from the tabs.
    if (updateHash) history.replaceState(null, "", `#${cityId}`);
}

function selectCityFromHash() {
    selectCity(window.location.hash.slice(1));
}

function bindCityTabs() {
    const tabs = Array.from(els.cityTabs);
    // Reveal a city before the browser follows an in-page link to its panel.
    document.querySelectorAll("[data-city-link]").forEach(link => {
        link.addEventListener("click", () => selectCity(link.hash.slice(1)));
    });
    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            selectCity(tab.getAttribute("aria-controls"), { updateHash: true });
        });
        tab.addEventListener("keydown", event => {
            let next;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            else return;
            event.preventDefault();
            selectCity(tabs[next].getAttribute("aria-controls"), { focus: true, updateHash: true });
        });
    });
    window.addEventListener("hashchange", selectCityFromHash);
    selectCityFromHash();
}

/* ===================== Hong Kong area notes (Wikipedia REST API) ===================== */

async function loadPlaceSummary(element, wikiTitle) {
    try {
        const summary = await fetchJSON(`${WIKI_SUMMARY_API}${encodeURIComponent(wikiTitle)}`);
        const pageUrl = summary.content_urls ? summary.content_urls.desktop.page : `https://en.wikipedia.org/wiki/${wikiTitle}`;
        element.replaceChildren(`${shorten(summary.extract, 320)} `, createLink("Read more on Wikipedia", pageUrl, "link"));
    } catch (error) {
        element.textContent = "The Wikipedia note isn’t available right now.";
    }
}

// One area of the guide, with a Wikipedia note that loads the first time someone opens it.
function buildArea(area) {
    const item = createElement("li", "area");
    const name = createElement("h5", "area__name", `${area.name} `);
    const chinese = createElement("span", "area__chinese", area.chinese);
    chinese.lang = "zh-Hant";
    name.append(chinese);

    const about = createElement("details", "area__about");
    const note = createElement("p", "area__summary", "Loading…");
    about.append(createElement("summary", "", `About ${area.name}`), note);
    about.addEventListener("toggle", () => {
        if (about.open && !about.dataset.loaded) {
            about.dataset.loaded = "true";
            loadPlaceSummary(note, area.wiki);
        }
    });

    item.append(createElement("p", "area__when", area.when), name, createElement("p", "area__note", area.note), about);
    return item;
}

function renderAreas() {
    els.areaList.replaceChildren(...HK_AREAS.map(buildArea));
}

/* ===================== Price converter (Frankfurter API) ===================== */

function renderCurrencyOptions() {
    els.priceCurrency.replaceChildren(...CURRENCIES.map(({ code, name }) => {
        const option = createElement("option", "", `${name} (${code})`);
        option.value = code;
        return option;
    }));
    els.priceCurrency.value = "HKD";
}

function formatMoney(amount, currency) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

async function handleConvert(submitEvent) {
    submitEvent.preventDefault();
    const amount = Number(els.priceAmount.value);
    const from = els.priceCurrency.value;

    if (!els.priceAmount.value || !(amount > 0)) {
        els.priceAmount.setAttribute("aria-invalid", "true");
        els.converterError.textContent = "Enter the price you saw, for example 9600.";
        els.priceAmount.focus();
        return;
    }
    els.priceAmount.removeAttribute("aria-invalid");
    els.converterError.textContent = "";
    els.converterResult.replaceChildren(createElement("p", "converter-result__note", "Checking today’s rates…"));

    try {
        const targets = CURRENCIES.map(({ code }) => code).filter(code => code !== from);
        const params = new URLSearchParams({ base: from, symbols: targets.join(",") });
        const data = await fetchJSON(`${FRANKFURTER_API}?${params}`);

        const list = createElement("ul", "converter-result__list");
        list.append(...targets
            .filter(code => data.rates && data.rates[code])
            .map(code => createElement("li", "", formatMoney(amount * data.rates[code], code))));

        els.converterResult.replaceChildren(
            list,
            createElement("p", "converter-result__note", `European Central Bank rates for ${data.date}. Your card or bank will charge a little more.`)
        );
    } catch (error) {
        els.converterResult.replaceChildren(
            createElement("p", "converter-result__note is-warning", "The exchange-rate service isn’t answering right now. Please try again in a moment.")
        );
    }
}

/* ===================== Start ===================== */

function bindEvents() {
    bindCityTabs();
    els.typeFilter.addEventListener("change", filterWatches);
    els.watchMore.addEventListener("click", toggleAllWatches);
    els.basicsTabs.addEventListener("change", showLesson);
    els.converter.addEventListener("submit", handleConvert);
    els.shopSearch.addEventListener("submit", handleShopSearch);
    els.shopBrand.addEventListener("change", () => clearShops());
    els.geoBtn.addEventListener("click", useMyLocation);

    els.dialogClose.addEventListener("click", closeDialog);
    els.dialogStores.addEventListener("click", goToStores);
    // A click on the dimmed backdrop lands on the dialog element itself.
    els.dialog.addEventListener("click", clickEvent => {
        if (clickEvent.target === els.dialog) {
            closeDialog();
        }
    });
    els.dialog.addEventListener("close", () => {
        stopSpeaking();
        if (state.lastTrigger) {
            state.lastTrigger.focus();
        }
    });
}

function init() {
    renderTypeChips();
    renderBrandOptions();
    renderMovements();
    renderOccasions();
    renderSpecialties();
    renderNames();
    renderWatches();
    renderAreas();
    renderCurrencyOptions();
    bindEvents();
    if (canSpeak()) {
        window.speechSynthesis.getVoices(); // starts loading the voices before the first Say it
    }
}

init();
