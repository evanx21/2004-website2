"use strict";

/*
 * Wrist Notes: a student’s guide to watches
 * -------------------------------------------------------------------------
 * Data APIs    Wikimedia Commons (watch photos and their credits)
 *              Wikipedia REST (place notes in "Notes from Europe")
 *              Frankfurter (exchange rates for the price converter)
 *              Open-Meteo Geocoding (city search in "Try it on near you")
 *              Overpass / OpenStreetMap (watch shops and jewelers nearby)
 * Browser API  Geolocation ("Use my location" in each watch’s details)
 *
 * All content, including Evan’s own notes, lives in data.js.
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
const MAX_SHOPS = 6;
const KM_PER_MILE = 1.609344;
const TIER_ORDER = ["entry", "mid", "grail"];
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

const DRAFT_STORY = "Draft: your own memory of this place, what you saw, and how it felt.";

/* ===================== Elements & state ===================== */

const els = {
    houseGroups: document.querySelector("#house-groups"),
    watchesSection: document.querySelector("#watches"),
    typeFilter: document.querySelector("#type-filter"),
    typeChips: document.querySelector("#type-chips"),
    typeNote: document.querySelector("#type-note"),
    brandSelect: document.querySelector("#brand-select"),
    watchGrid: document.querySelector("#watch-grid"),
    emptyState: document.querySelector("#empty-state"),
    stopGrid: document.querySelector("#stop-grid"),
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
    dialogTitle: document.querySelector("#dialog-title"),
    dialogTier: document.querySelector("#dialog-tier"),
    dialogWhy: document.querySelector("#dialog-why"),
    dialogCase: document.querySelector("#dialog-case"),
    dialogThickness: document.querySelector("#dialog-thickness"),
    dialogMovement: document.querySelector("#dialog-movement"),
    dialogStrap: document.querySelector("#dialog-strap"),
    dialogOccasions: document.querySelector("#dialog-occasions"),
    shopSearch: document.querySelector("#shop-search"),
    shopCity: document.querySelector("#shop-city"),
    geoBtn: document.querySelector("#geo-btn"),
    shopStatus: document.querySelector("#shop-status"),
    shopList: document.querySelector("#shop-list"),
    watchTemplate: document.querySelector("#watch-template"),
    stopTemplate: document.querySelector("#stop-template")
};

const state = {
    watchId: null, // the watch open in the details dialog
    lastTrigger: null, // the button that opened it, so focus can return there
    shopSearchId: 0 // lets us ignore answers to older shop searches
};

// Commons file title → Promise of { src, width, height, pageUrl, artist, license } (or null)
const photoCache = new Map();

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

function hasText(text) {
    return Boolean(text && text.trim());
}

// Evan’s own words, or a clearly marked draft box until he writes them.
function fillTake(container, text, draftText) {
    container.classList.toggle("take--draft", !hasText(text));
    container.querySelector(".take__text").textContent = hasText(text) ? text : draftText;
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
        .catch(() => showPhotoMessage(frame, credit, "The photo archive isn’t answering right now."));
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

// The brand menu lists every brand in the collection, with how many watches it has.
function renderBrandOptions() {
    const counts = {};
    Object.values(WATCHES).forEach(watch => {
        counts[watch.brand] = (counts[watch.brand] || 0) + 1;
    });
    const brands = Object.keys(counts).sort((a, b) => a.localeCompare(b));

    const allOption = createElement("option", "", `All ${brands.length} brands`);
    allOption.value = "all";
    els.brandSelect.replaceChildren(allOption, ...brands.map(brand => {
        const option = createElement("option", "", `${brand} (${counts[brand]})`);
        option.value = brand;
        return option;
    }));
}

function describeSelection(type, brand, count) {
    if (type !== "all") {
        return WATCH_TYPES[type].summary;
    }
    if (brand !== "all") {
        return `${count} ${count === 1 ? "watch" : "watches"} from ${brand}.`;
    }
    return `All ${count} watches from ${els.brandSelect.options.length - 1} brands, from under $1,000 to over $10,000.`;
}

function renderWatches() {
    const type = els.typeFilter.elements.type.value;
    const brand = els.brandSelect.value;
    const ids = Object.keys(WATCHES)
        .filter(id => (type === "all" || WATCHES[id].type === type) && (brand === "all" || WATCHES[id].brand === brand))
        .sort((a, b) => TIER_ORDER.indexOf(WATCHES[a].tier) - TIER_ORDER.indexOf(WATCHES[b].tier)
            || WATCHES[a].brand.localeCompare(WATCHES[b].brand)
            || WATCHES[a].model.localeCompare(WATCHES[b].model));

    els.typeNote.textContent = describeSelection(type, brand, ids.length);
    els.emptyState.hidden = ids.length > 0;
    if (!ids.length) {
        els.emptyState.textContent = `No ${WATCH_TYPES[type].label.toLowerCase()} watches from ${brand} here yet. Try “All” or another brand.`;
    }

    if (ids.length) {
        getPhotos(ids.map(id => WATCHES[id].photo)).catch(() => {}); // one request for every photo shown
    }
    els.watchGrid.replaceChildren(...ids.map(buildWatchCard));
}

/* ===================== The houses (brand guide) ===================== */

// Choosing a house shows all of its watches in the gallery.
function showBrand(brand) {
    els.typeFilter.elements.type.value = "all";
    els.brandSelect.value = brand;
    renderWatches();
    els.watchesSection.scrollIntoView({ behavior: REDUCED_MOTION.matches ? "auto" : "smooth", block: "start" });
}

function buildHouse(house) {
    const count = Object.values(WATCHES).filter(watch => watch.brand === house.name).length;
    const item = createElement("li", "house");
    const button = createElement("button", "house__name", house.name);
    button.type = "button";
    button.addEventListener("click", () => showBrand(house.name));

    item.append(
        button,
        createElement("p", "house__origin", house.origin),
        createElement("p", "house__count", `${count} ${count === 1 ? "watch" : "watches"}`),
        createElement("p", "house__note", house.note)
    );
    return item;
}

function renderHouses() {
    els.houseGroups.replaceChildren(...HOUSES.map(group => {
        const section = createElement("section", "house-group");
        const list = createElement("ul", "house-group__list");
        list.append(...group.brands.map(buildHouse));
        section.append(
            createElement("h3", "house-group__title", group.title),
            createElement("p", "house-group__summary", group.summary),
            list
        );
        return section;
    }));
}

/* ===================== Watch details (dialog) ===================== */

function formatThickness(watch) {
    if (watch.thicknessMm === null) {
        return "Not published by the maker";
    }
    const value = `${watch.thicknessApprox ? "≈ " : ""}${watch.thicknessMm} mm`;
    // Dress watches are thin so they slide under a shirt cuff.
    let cuff = "wants a roomier cuff";
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

    els.dialogBrand.textContent = watch.brand;
    els.dialogTitle.textContent = watch.model;
    els.dialogTier.textContent = PRICE_TIERS[watch.tier];
    els.dialogWhy.textContent = watch.why;
    els.dialogCase.textContent = `${watch.caseMm} mm`;
    els.dialogThickness.textContent = formatThickness(watch);
    els.dialogMovement.replaceChildren(
        watch.movement,
        createElement("span", "facts__note", MOVEMENTS[watch.movement].summary)
    );
    els.dialogStrap.textContent = watch.strap;
    els.dialogOccasions.textContent = occasionsFor(id).join(", ");

    // Each watch starts with a fresh shop search.
    state.shopSearchId += 1;
    els.shopList.replaceChildren();
    setStatus(els.shopStatus, `Shops whose name mentions ${watch.brand} are listed first.`);

    if (!els.dialog.open) {
        els.dialog.showModal();
    }
    els.dialog.scrollTop = 0;
}

function closeDialog() {
    els.dialog.close();
}

/* ===================== Try it on near you (Geolocation, Open-Meteo, Overpass) ===================== */

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

async function queryShops(location, brand) {
    const around = `(around:${SHOP_RADIUS_M},${location.latitude},${location.longitude})`;
    const query = `[out:json][timeout:25];(nwr["shop"="watches"]${around};nwr["shop"="jewelry"]${around};);out center;`;
    const data = await fetchJSON(OVERPASS_API, { method: "POST", body: new URLSearchParams({ data: query }) });
    const brandName = brand.toLowerCase();

    return (data.elements || [])
        .map(element => {
            const tags = element.tags || {};
            const point = element.center || element;
            return {
                name: tags.name,
                kind: tags.shop === "watches" ? "Watch shop" : "Jeweler",
                address: shopAddress(tags),
                mentionsBrand: `${tags.name || ""} ${tags.brand || ""}`.toLowerCase().includes(brandName),
                distance: distanceKm(location, { latitude: point.lat, longitude: point.lon }),
                mapUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`
            };
        })
        .filter(shop => shop.name && Number.isFinite(shop.distance))
        // Shops that name this watch’s brand first, then the nearest.
        .sort((a, b) => Number(b.mentionsBrand) - Number(a.mentionsBrand) || a.distance - b.distance)
        .slice(0, MAX_SHOPS);
}

function buildShopItem(shop, brand) {
    const item = createElement("li", "shop");
    const details = createElement("div", "shop__details");
    details.append(
        createElement("p", "shop__name", shop.name),
        createElement("p", "shop__meta", `${shop.kind}, ${formatDistance(shop.distance)} away`)
    );
    if (shop.address) {
        details.append(createElement("p", "shop__meta", shop.address));
    }
    if (shop.mentionsBrand) {
        details.append(createElement("p", "shop__brand", `Mentions ${brand}`));
    }
    item.append(details, createLink("Map", shop.mapUrl, "shop__map"));
    return item;
}

async function findShops(location) {
    const watch = WATCHES[state.watchId];
    state.shopSearchId += 1;
    const searchId = state.shopSearchId;
    els.shopList.replaceChildren();
    setStatus(els.shopStatus, `Looking near ${location.label}…`);

    try {
        const shops = await queryShops(location, watch.brand);
        if (searchId !== state.shopSearchId) {
            return; // the visitor searched again, or opened another watch
        }
        if (!shops.length) {
            setStatus(els.shopStatus, `OpenStreetMap lists no watch shops or jewelers within ${SHOP_RADIUS_M / 1000} km of ${location.label}. Try a bigger city nearby.`, "warning");
            return;
        }
        els.shopList.replaceChildren(...shops.map(shop => buildShopItem(shop, watch.brand)));
        setStatus(els.shopStatus, `Closest places near ${location.label}. Call ahead to check which brands they carry.`, "success");
    } catch (error) {
        if (searchId === state.shopSearchId) {
            const busy = error.status === 429 || error.status === 504 || error.name === "AbortError";
            setStatus(els.shopStatus, busy
                ? "The map service is busy right now. Please try again in a minute."
                : "We couldn’t reach the map service. Please try again in a moment.", "warning");
        }
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

/* ===================== Notes from Europe (Wikipedia REST API) ===================== */

async function loadPlaceSummary(card, stop) {
    const summaryElement = card.querySelector(".stop__summary");
    try {
        const summary = await fetchJSON(`${WIKI_SUMMARY_API}${encodeURIComponent(stop.wiki)}`);
        const pageUrl = summary.content_urls ? summary.content_urls.desktop.page : `https://en.wikipedia.org/wiki/${stop.wiki}`;
        summaryElement.replaceChildren(`${shorten(summary.extract, 320)} `, createLink("Read more on Wikipedia", pageUrl, "link"));
    } catch (error) {
        summaryElement.textContent = "The Wikipedia note isn’t available right now.";
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
        card.querySelector(".stop__photo-note").textContent = `Evan’s photo from ${stop.city} goes here`;
    }

    card.querySelector(".stop__where").textContent = `${stop.city}, ${stop.country}${stop.example ? " (example)" : ""}`;
    card.querySelector(".stop__place").textContent = stop.place;
    card.querySelector(".stop__link").textContent = stop.link;
    fillTake(card.querySelector(".take"), stop.story, DRAFT_STORY);

    const watchButton = card.querySelector(".stop__watch");
    watchButton.textContent = `See the ${watch.brand} ${watch.model}`;
    watchButton.addEventListener("click", () => openWatch(stop.watchId, watchButton));

    // The Wikipedia note loads the first time someone opens it.
    const about = card.querySelector(".stop__about");
    about.querySelector("summary").textContent = `About ${stop.place}`;
    about.addEventListener("toggle", () => {
        if (about.open && !about.dataset.loaded) {
            about.dataset.loaded = "true";
            loadPlaceSummary(card, stop);
        }
    });
    return card;
}

function renderStops() {
    els.stopGrid.replaceChildren(...EUROPE_STOPS.map(buildStopCard));
}

/* ===================== Price converter (Frankfurter API) ===================== */

function renderCurrencyOptions() {
    els.priceCurrency.replaceChildren(...CURRENCIES.map(({ code, name }) => {
        const option = createElement("option", "", `${name} (${code})`);
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
    els.typeFilter.addEventListener("change", renderWatches);
    els.converter.addEventListener("submit", handleConvert);
    els.shopSearch.addEventListener("submit", handleShopSearch);
    els.geoBtn.addEventListener("click", useMyLocation);

    els.dialogClose.addEventListener("click", closeDialog);
    // A click on the dimmed backdrop lands on the dialog element itself.
    els.dialog.addEventListener("click", clickEvent => {
        if (clickEvent.target === els.dialog) {
            closeDialog();
        }
    });
    els.dialog.addEventListener("close", () => {
        state.shopSearchId += 1; // ignore any shop search still running
        if (state.lastTrigger) {
            state.lastTrigger.focus();
        }
    });
}

function init() {
    renderTypeChips();
    renderBrandOptions();
    renderHouses();
    renderWatches();
    renderStops();
    renderCurrencyOptions();
    bindEvents();
}

init();
