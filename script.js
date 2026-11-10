"use strict";

/*
 * Wrist Notes: a student's guide to watches
 * -------------------------------------------------------------------------
 * Data APIs    Wikimedia Commons (watch photos and their credits)
 *              Wikipedia REST (place summaries in "Notes from Europe")
 *              Frankfurter (exchange rates in "Buying abroad")
 *              Open-Meteo Geocoding (city search in "Try one on")
 *              Overpass / OpenStreetMap (watch shops and jewelers nearby)
 * Browser API  Geolocation ("Use my location")
 *
 * All content, including Evan's own notes, lives in data.js.
 */

/* ===================== Constants ===================== */

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const WIKI_SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const FRANKFURTER_API = "https://api.frankfurter.dev/v1/latest";
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const FETCH_TIMEOUT_MS = 15000; // the shop search can take a few seconds
const PHOTO_WIDTH = 800;
const SHOP_RADIUS_M = 15000;
const MAX_SHOPS = 20;
const KM_PER_MILE = 1.609344;
const TIER_ORDER = ["entry", "mid", "grail"];
const CUFF_GAUGE_MAX_MM = 15;
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const COLLECTION_BRANDS = [...new Set(Object.values(WATCHES).map(watch => watch.brand))];

const DRAFT_TAKE = "Draft: a line or two in your own words. Why this watch, who it's for, and whether a student should save up for it.";
const DRAFT_STORY = "Draft: your own memory of this place, what you saw, and how it felt.";

/* ===================== Elements & state ===================== */

const els = {
    heroPhotos: document.querySelector("#hero-photos"),
    typeCards: document.querySelector("#type-cards"),
    movementCards: document.querySelector("#movement-cards"),
    filters: document.querySelector("#filters"),
    collection: document.querySelector("#collection"),
    collectionCount: document.querySelector("#collection-count"),
    occasionNote: document.querySelector("#occasion-note"),
    watchGrid: document.querySelector("#watch-grid"),
    emptyState: document.querySelector("#empty-state"),
    stopGrid: document.querySelector("#stop-grid"),
    converter: document.querySelector("#converter"),
    priceAmount: document.querySelector("#price-amount"),
    priceCurrency: document.querySelector("#price-currency"),
    converterError: document.querySelector("#converter-error"),
    converterResult: document.querySelector("#converter-result"),
    shopSearch: document.querySelector("#shop-search"),
    shopCity: document.querySelector("#shop-city"),
    geoBtn: document.querySelector("#geo-btn"),
    shopStatus: document.querySelector("#shop-status"),
    placeOptions: document.querySelector("#place-options"),
    shopList: document.querySelector("#shop-list"),
    watchTemplate: document.querySelector("#watch-template"),
    stopTemplate: document.querySelector("#stop-template")
};

const FILTER_GROUPS = ["type", "movement", "tier", "occasion"];

const state = {
    shopSearchId: 0 // lets us ignore answers to older shop searches
};

// Commons file title → Promise of { src, width, height, pageUrl, artist, license } (or null)
const photoCache = new Map();

// Watch id → the occasions it suits, built once from DRESS_CODES.
const occasionsByWatch = buildOccasionIndex();

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

function scrollToElement(element) {
    element.scrollIntoView({ behavior: REDUCED_MOTION.matches ? "auto" : "smooth", block: "start" });
}

// Evan's own words, or a clearly marked draft box until he writes them.
function fillTake(container, text, draftText) {
    const hasText = Boolean(text && text.trim());
    container.classList.toggle("take--draft", !hasText);
    container.querySelector(".take__text").textContent = hasText ? text : draftText;
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

// Returns photos in the same order as `titles`, asking Commons only for ones we haven't fetched.
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
    frame.style.removeProperty("--photo");
    frame.replaceChildren(createElement("p", "photo__placeholder", message));
    credit.replaceChildren();
}

function showPhoto(frame, credit, photo, pictured, { compact = false } = {}) {
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = pictured;
    if (photo.width && photo.height) {
        image.width = photo.width;
        image.height = photo.height;
    }
    image.loading = "lazy";
    image.addEventListener("error", () => showPhotoMessage(frame, credit, "Photo unavailable"));

    // The same photo, blurred, fills the space around photos that aren't square.
    frame.style.setProperty("--photo", `url("${photo.src.replace(/"/g, "%22")}")`);
    frame.replaceChildren(image);

    const pictureNote = compact ? "" : `Pictured: ${lowerFirst(pictured)}. `;
    credit.replaceChildren(
        `${pictureNote}Photo: ${photo.artist}, ${photo.license}, via `,
        createLink("Wikimedia Commons", photo.pageUrl)
    );
}

function loadPhoto(frame, credit, title, pictured, options = {}) {
    getPhotos([title])
        .then(([photo]) => {
            if (photo) {
                showPhoto(frame, credit, photo, pictured, options);
            } else {
                showPhotoMessage(frame, credit, "Photo unavailable");
            }
        })
        .catch(() => showPhotoMessage(frame, credit, "The photo archive isn't answering right now."));
}

function renderHeroPhotos() {
    const watches = HERO_WATCHES.map(id => WATCHES[id]);
    getPhotos(watches.map(watch => watch.photo)).catch(() => {}); // one request for all three

    els.heroPhotos.replaceChildren(...watches.map(watch => {
        const figure = createElement("figure", "photo photo--hero");
        const frame = createElement("div", "photo__frame");
        const credit = createElement("figcaption", "photo__credit");
        frame.append(createElement("p", "photo__placeholder", "Loading photo…"));
        figure.append(frame, credit);
        loadPhoto(frame, credit, watch.photo, watch.pictured, { compact: true });
        return figure;
    }));
}

/* ===================== The basics ===================== */

function countWatches(key, value) {
    return Object.values(WATCHES).filter(watch => watch[key] === value).length;
}

function buildGuideCard(title, summary, count, filterGroup, filterValue) {
    const card = createElement("article", "guide-card");
    const button = createElement("button", "link-button", count === 1 ? "See the example" : `See ${count} examples`);
    button.type = "button";
    button.addEventListener("click", () => showFiltered(filterGroup, filterValue));
    card.append(createElement("h4", "guide-card__title", title), createElement("p", "guide-card__text", summary), button);
    return card;
}

function renderGuide() {
    els.typeCards.replaceChildren(...Object.entries(WATCH_TYPES).map(([key, type]) =>
        buildGuideCard(type.label, type.summary, countWatches("type", key), "type", key)
    ));
    els.movementCards.replaceChildren(...Object.entries(MOVEMENTS).map(([key, movement]) =>
        buildGuideCard(movement.label, movement.summary, countWatches("movement", key), "movement", key)
    ));
}

/* ===================== The collection ===================== */

function buildOccasionIndex() {
    const index = {};
    Object.keys(WATCHES).forEach(id => {
        index[id] = [];
    });
    Object.entries(DRESS_CODES).forEach(([code, dressCode]) => {
        dressCode.picks.forEach(id => index[id].push(code));
    });
    return index;
}

function filterOptions(group) {
    const options = {
        type: Object.entries(WATCH_TYPES).map(([value, type]) => [value, type.label]),
        movement: Object.entries(MOVEMENTS).map(([value, movement]) => [value, movement.label]),
        tier: TIER_ORDER.map(value => [value, PRICE_TIERS[value].split(" · ")[0]]),
        occasion: Object.entries(DRESS_CODES).map(([value, dressCode]) => [value, dressCode.name])
    };
    return [["all", "All"], ...options[group]];
}

// Builds each filter as a row of radio "chips".
function renderFilterChips() {
    FILTER_GROUPS.forEach(group => {
        const container = els.filters.querySelector(`[data-filter="${group}"]`);
        container.replaceChildren(...filterOptions(group).flatMap(([value, label]) => {
            const id = `filter-${group}-${value}`;
            const input = document.createElement("input");
            input.type = "radio";
            input.name = `filter-${group}`;
            input.id = id;
            input.value = value;
            input.checked = value === "all";
            const chip = createElement("label", "", label);
            chip.htmlFor = id;
            return [input, chip];
        }));
    });
}

function readFilters() {
    const filters = {};
    FILTER_GROUPS.forEach(group => {
        filters[group] = els.filters.elements[`filter-${group}`].value;
    });
    return filters;
}

function setFilter(group, value) {
    els.filters.elements[`filter-${group}`].value = value;
}

function resetFilters() {
    FILTER_GROUPS.forEach(group => setFilter(group, "all"));
}

function matchesFilters(id, watch, filters) {
    return (filters.type === "all" || watch.type === filters.type)
        && (filters.movement === "all" || watch.movement === filters.movement)
        && (filters.tier === "all" || watch.tier === filters.tier)
        && (filters.occasion === "all" || occasionsByWatch[id].includes(filters.occasion));
}

function formatThickness(watch) {
    if (watch.thicknessMm === null) {
        return "Not published";
    }
    return `${watch.thicknessApprox ? "≈ " : ""}${watch.thicknessMm} mm`;
}

// Dress watches are thin so they slide under a shirt cuff. The gauge runs from 0 to 15 mm.
function renderCuffTest(card, watch) {
    const gauge = card.querySelector(".cuff__gauge");
    const verdict = card.querySelector(".cuff__verdict");
    const thickness = watch.thicknessMm;

    if (thickness === null) {
        gauge.classList.add("is-unknown");
        verdict.textContent = "The maker doesn't publish this watch's thickness, so we can't test it.";
        return;
    }

    const position = (Math.min(thickness, CUFF_GAUGE_MAX_MM) / CUFF_GAUGE_MAX_MM) * 100;
    gauge.style.setProperty("--at", position.toFixed(1));

    let result = "wants a roomier cuff";
    if (thickness <= 9) {
        result = "slides under a dress-shirt cuff";
    } else if (thickness <= 11) {
        result = "fits under most cuffs with a tug";
    }
    verdict.textContent = `${formatThickness(watch)}: ${result}.`;
}

function buildWatchCard(id, watch) {
    const card = els.watchTemplate.content.firstElementChild.cloneNode(true);
    card.id = `watch-${id}`;

    card.querySelector(".watch__tier").textContent = PRICE_TIERS[watch.tier];
    card.querySelector(".watch__brand").textContent = watch.brand;
    card.querySelector(".watch__model").textContent = watch.model;
    card.querySelector(".watch__tags").textContent = `${WATCH_TYPES[watch.type].label} · ${MOVEMENTS[watch.movement].label}`;
    card.querySelector(".watch__why").textContent = watch.why;
    card.querySelector('[data-spec="case"]').textContent = `${watch.caseMm} mm`;
    card.querySelector('[data-spec="thickness"]').textContent = formatThickness(watch);
    card.querySelector('[data-spec="movement"]').textContent = watch.movement;
    card.querySelector('[data-spec="strap"]').textContent = watch.strap;

    const occasions = occasionsByWatch[id].map(code => DRESS_CODES[code].name);
    card.querySelector(".watch__occasions").textContent = `Wear it to: ${occasions.join(" · ")}`;

    renderCuffTest(card, watch);
    fillTake(card.querySelector(".take"), watch.take, DRAFT_TAKE);
    loadPhoto(card.querySelector(".photo__frame"), card.querySelector(".photo__credit"), watch.photo, watch.pictured);
    return card;
}

function renderOccasionNote(occasion) {
    if (occasion === "all") {
        els.occasionNote.hidden = true;
        return;
    }
    const dressCode = DRESS_CODES[occasion];
    els.occasionNote.replaceChildren(
        createElement("p", "occasion-note__title", dressCode.name),
        createElement("p", "", dressCode.decoded),
        createElement("p", "occasion-note__advice", dressCode.advice)
    );
    els.occasionNote.hidden = false;
}

function renderCollection() {
    const filters = readFilters();
    const allIds = Object.keys(WATCHES);
    const ids = allIds
        .filter(id => matchesFilters(id, WATCHES[id], filters))
        .sort((a, b) => TIER_ORDER.indexOf(WATCHES[a].tier) - TIER_ORDER.indexOf(WATCHES[b].tier)
            || WATCHES[a].brand.localeCompare(WATCHES[b].brand));

    renderOccasionNote(filters.occasion);
    els.collectionCount.textContent = `Showing ${ids.length} of ${allIds.length} watches`;

    if (ids.length) {
        getPhotos(ids.map(id => WATCHES[id].photo)).catch(() => {}); // one request for every photo shown
    }
    els.watchGrid.replaceChildren(...ids.map(id => buildWatchCard(id, WATCHES[id])));

    els.emptyState.hidden = ids.length > 0;
    els.emptyState.textContent = filters.occasion === "white-tie"
        ? "White tie is the one dress code where the most elegant watch is the one you leave at home."
        : "No watches match all of these filters. Try resetting one of them.";
}

// Used by the guide's "See examples" buttons.
function showFiltered(group, value) {
    resetFilters();
    setFilter(group, value);
    renderCollection();
    scrollToElement(els.collection);
}

// Used by the Europe stops: show the whole collection and jump to one watch.
function showWatch(id) {
    resetFilters();
    renderCollection();
    const card = document.querySelector(`#watch-${id}`);
    if (!card) {
        return;
    }
    scrollToElement(card);
    card.classList.add("is-highlighted");
    setTimeout(() => card.classList.remove("is-highlighted"), 2500);
}

/* ===================== Notes from Europe (Wikipedia REST API) ===================== */

async function loadPlaceSummary(card, stop) {
    const summaryElement = card.querySelector(".stop__summary");
    try {
        const summary = await fetchJSON(`${WIKI_SUMMARY_API}${encodeURIComponent(stop.wiki)}`);
        const pageUrl = summary.content_urls ? summary.content_urls.desktop.page : `https://en.wikipedia.org/wiki/${stop.wiki}`;
        summaryElement.replaceChildren(
            `${shorten(summary.extract, 260)} `,
            createLink("Read more on Wikipedia", pageUrl, "text-link")
        );
    } catch (error) {
        summaryElement.textContent = "The Wikipedia summary isn't available right now.";
    }
}

function buildStopCard(stop) {
    const card = els.stopTemplate.content.firstElementChild.cloneNode(true);
    const watch = WATCHES[stop.watchId];
    const photoBox = card.querySelector(".stop__photo");

    if (stop.photo) {
        const image = document.createElement("img");
        image.src = stop.photo;
        image.alt = stop.photoAlt || `${stop.place}, ${stop.city}`;
        image.loading = "lazy";
        photoBox.replaceChildren(image);
    } else {
        photoBox.classList.add("stop__photo--empty");
        card.querySelector(".stop__photo-note").textContent = `Evan's photo from ${stop.city} goes here`;
    }

    card.querySelector(".stop__where").textContent = `${stop.city} · ${stop.country}${stop.example ? " · Example stop" : ""}`;
    card.querySelector(".stop__place").textContent = stop.place;
    card.querySelector(".stop__link-text").textContent = stop.link;

    const watchButton = card.querySelector(".stop__watch");
    watchButton.textContent = `See the ${watch.brand} ${watch.model}`;
    watchButton.addEventListener("click", () => showWatch(stop.watchId));

    fillTake(card.querySelector(".take"), stop.story, DRAFT_STORY);
    loadPlaceSummary(card, stop);
    return card;
}

function renderStops() {
    els.stopGrid.replaceChildren(...EUROPE_STOPS.map(buildStopCard));
}

/* ===================== Buying abroad (Frankfurter API) ===================== */

function renderCurrencyOptions() {
    els.priceCurrency.replaceChildren(...CURRENCIES.map(({ code, name }) => {
        const option = createElement("option", "", `${code} · ${name}`);
        option.value = code;
        return option;
    }));
    els.priceCurrency.value = "CHF";
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
    els.converterResult.replaceChildren(createElement("p", "hint", "Checking today's rates…"));

    try {
        const targets = CURRENCIES.map(({ code }) => code).filter(code => code !== from);
        const params = new URLSearchParams({ base: from, symbols: targets.join(",") });
        const data = await fetchJSON(`${FRANKFURTER_API}?${params}`);

        const rows = targets
            .filter(code => data.rates && data.rates[code])
            .map(code => {
                const row = document.createElement("div");
                const name = CURRENCIES.find(currency => currency.code === code).name;
                row.append(createElement("dt", "", name), createElement("dd", "", formatMoney(amount * data.rates[code], code)));
                return row;
            });

        const list = createElement("dl", "converter-result__list");
        list.append(...rows);
        els.converterResult.replaceChildren(
            createElement("p", "converter-result__from", `${formatMoney(amount, from)} is about`),
            list,
            createElement("p", "fine-print", `European Central Bank reference rates for ${data.date}. Your card or bank will charge a little more.`)
        );
    } catch (error) {
        els.converterResult.replaceChildren(
            createElement("p", "is-warning", "The exchange-rate service isn't answering right now. Please try again in a moment.")
        );
    }
}

/* ===================== Try one on (Geolocation, Open-Meteo, Overpass) ===================== */

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
    return `${(km / KM_PER_MILE).toFixed(1)} mi (${km.toFixed(1)} km)`;
}

function shopAddress(tags) {
    const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
    return [street, tags["addr:city"]].filter(Boolean).join(", ");
}

// Brands from the collection that appear in the shop's name or brand tag.
function brandsMentioned(tags) {
    const text = `${tags.name || ""} ${tags.brand || ""}`.toLowerCase();
    return COLLECTION_BRANDS.filter(brand => text.includes(brand.toLowerCase()));
}

async function queryShops(location) {
    const around = `(around:${SHOP_RADIUS_M},${location.latitude},${location.longitude})`;
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
                brands: brandsMentioned(tags),
                distance: distanceKm(location, { latitude: point.lat, longitude: point.lon }),
                mapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`
            };
        })
        .filter(shop => shop.name && Number.isFinite(shop.distance))
        // Shops that name a brand from the collection first, then the nearest.
        .sort((a, b) => (b.brands.length > 0) - (a.brands.length > 0) || a.distance - b.distance)
        .slice(0, MAX_SHOPS);
}

function buildShopItem(shop) {
    const item = createElement("li", "shop");
    const details = createElement("div", "shop__details");
    details.append(
        createElement("p", "shop__name", shop.name),
        createElement("p", "shop__meta", `${shop.kind} · ${formatDistance(shop.distance)}`)
    );
    if (shop.address) {
        details.append(createElement("p", "shop__address", shop.address));
    }
    if (shop.brands.length) {
        details.append(createElement("p", "shop__brands", `Name mentions ${shop.brands.join(", ")}`));
    }
    item.append(details, createLink("Map", shop.mapUrl, "shop__map"));
    return item;
}

async function findShops(location) {
    state.shopSearchId += 1;
    const searchId = state.shopSearchId;
    els.shopList.replaceChildren();
    setStatus(els.shopStatus, `Looking for watch shops and jewelers near ${location.label}…`);

    try {
        const shops = await queryShops(location);
        if (searchId !== state.shopSearchId) {
            return;
        }
        if (!shops.length) {
            setStatus(els.shopStatus, `OpenStreetMap doesn't list any watch shops or jewelers within ${SHOP_RADIUS_M / 1000} km of ${location.label}. Try a larger city nearby.`, "warning");
            return;
        }
        els.shopList.replaceChildren(...shops.map(buildShopItem));
        setStatus(els.shopStatus, `${shops.length} places within ${SHOP_RADIUS_M / 1000} km of ${location.label}.`, "success");
    } catch (error) {
        if (searchId === state.shopSearchId) {
            const busy = error.status === 429 || error.status === 504 || error.name === "AbortError";
            setStatus(els.shopStatus, busy
                ? "The map service is busy right now. Please try again in a minute."
                : "We couldn't reach the map service. Please try again in a moment.", "warning");
        }
    }
}

function renderPlaceOptions(places) {
    if (places.length < 2) {
        els.placeOptions.replaceChildren();
        return;
    }
    const buttons = places.slice(1).map(place => {
        const button = createElement("button", "city-option", placeLabel(place));
        button.type = "button";
        button.addEventListener("click", () => {
            els.shopCity.value = placeLabel(place);
            els.placeOptions.replaceChildren();
            findShops({ label: placeLabel(place), latitude: place.latitude, longitude: place.longitude });
        });
        return button;
    });
    els.placeOptions.replaceChildren(createElement("p", "place-options__label", "Not the right city? Try:"), ...buttons);
}

async function handleShopSearch(submitEvent) {
    submitEvent.preventDefault();
    const name = els.shopCity.value.trim();
    if (name.length < 2) {
        setStatus(els.shopStatus, "Type a city name first, or use your location.", "warning");
        els.shopCity.focus();
        return;
    }

    setStatus(els.shopStatus, `Looking up “${name}”…`);
    els.placeOptions.replaceChildren();
    try {
        const params = new URLSearchParams({ name, count: "4", language: "en", format: "json" });
        const data = await fetchJSON(`${GEOCODING_API}?${params}`);
        const places = data.results || [];
        if (!places.length) {
            setStatus(els.shopStatus, `We couldn't find “${name}”. Check the spelling, or try a nearby larger city.`, "warning");
            return;
        }
        const best = places[0];
        renderPlaceOptions(places);
        findShops({ label: placeLabel(best), latitude: best.latitude, longitude: best.longitude });
    } catch (error) {
        setStatus(els.shopStatus, "The city search isn't responding. Try again in a moment, or use your location.", "warning");
    }
}

function useMyLocation() {
    if (!("geolocation" in navigator)) {
        setStatus(els.shopStatus, "This browser can't share your location. Type a city instead.", "warning");
        els.shopCity.focus();
        return;
    }

    els.geoBtn.disabled = true;
    els.placeOptions.replaceChildren();
    setStatus(els.shopStatus, "Finding you…");

    navigator.geolocation.getCurrentPosition(
        position => {
            els.geoBtn.disabled = false;
            findShops({
                label: "your location",
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
        },
        error => {
            els.geoBtn.disabled = false;
            let message = "We couldn't pin down your location. Type a city instead.";
            if (error.code === error.PERMISSION_DENIED) {
                message = "Location access was declined. No problem: type a city instead.";
            } else if (error.code === error.TIMEOUT) {
                message = "Finding your location took too long. Type a city instead.";
            }
            setStatus(els.shopStatus, message, "warning");
            els.shopCity.focus();
        },
        { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
}

/* ===================== Start ===================== */

function bindEvents() {
    els.filters.addEventListener("change", renderCollection);
    document.querySelectorAll("[data-reset-filters]").forEach(button => {
        button.addEventListener("click", () => {
            resetFilters();
            renderCollection();
        });
    });
    els.converter.addEventListener("submit", handleConvert);
    els.shopSearch.addEventListener("submit", handleShopSearch);
    els.geoBtn.addEventListener("click", useMyLocation);
}

function init() {
    renderHeroPhotos();
    renderGuide();
    renderFilterChips();
    renderCollection();
    renderStops();
    renderCurrencyOptions();
    bindEvents();
}

init();
