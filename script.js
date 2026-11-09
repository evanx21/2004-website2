"use strict";

/*
 * The Wrist Concierge
 * -------------------------------------------------------------------------
 * Data APIs    Wikimedia Commons (watch photos and their credits)
 *              Open-Meteo (city search and the daily forecast)
 * Browser API  Geolocation ("Use my location")
 *
 * Watches, dress codes and sample invitations live in data.js.
 */

/* ===================== Constants ===================== */

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const FETCH_TIMEOUT_MS = 9000;
const DAY_MS = 24 * 60 * 60 * 1000;
const FORECAST_RANGE_DAYS = 15;
const PHOTO_WIDTH = 800;
const BROWSER_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const TIER_ORDER = ["entry", "mid", "grail"];
const CUFF_GAUGE_MAX_MM = 15;
const NUMBER_WORDS = ["no", "one", "two", "three"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// WMO weather codes used by Open-Meteo, grouped into plain-language labels.
const WEATHER_TYPES = [
    { codes: [0], label: "Clear sky" },
    { codes: [1, 2], label: "Partly cloudy" },
    { codes: [3], label: "Overcast" },
    { codes: [45, 48], label: "Fog" },
    { codes: [51, 53, 55, 56, 57], label: "Drizzle", wet: true },
    { codes: [61, 63, 65, 66, 67, 80, 81, 82], label: "Rain", wet: true },
    { codes: [71, 73, 75, 77, 85, 86], label: "Snow", snowy: true },
    { codes: [95, 96, 99], label: "Thunderstorms", wet: true }
];

/* ===================== Elements & state ===================== */

const els = {
    heroPhotos: document.querySelector("#hero-photos"),
    form: document.querySelector("#finder"),
    inviteText: document.querySelector("#invite-text"),
    sampleBtn: document.querySelector("#sample-btn"),
    detected: document.querySelector("#detected"),
    dressCodeError: document.querySelector("#dress-code-error"),
    cityInput: document.querySelector("#city-input"),
    citySearchBtn: document.querySelector("#city-search-btn"),
    geoBtn: document.querySelector("#geo-btn"),
    cityResults: document.querySelector("#city-results"),
    locationStatus: document.querySelector("#location-status"),
    eventDate: document.querySelector("#event-date"),
    results: document.querySelector("#results"),
    resultsEyebrow: document.querySelector("#results-eyebrow"),
    resultsTitle: document.querySelector("#results-title"),
    resultsDecoded: document.querySelector("#results-decoded"),
    resultsRule: document.querySelector("#results-rule"),
    strapTip: document.querySelector("#strap-tip"),
    watchGrid: document.querySelector("#watch-grid"),
    noWatch: document.querySelector("#no-watch"),
    pocketFrame: document.querySelector("#pocket-frame"),
    pocketCredit: document.querySelector("#pocket-credit"),
    watchTemplate: document.querySelector("#watch-template")
};

const state = {
    location: null, // { label, latitude, longitude, timeZone }
    sampleIndex: 0,
    lastAutoCity: "",
    citySearchId: 0,
    forecastId: 0
};

// Commons file title → Promise of { src, width, height, pageUrl, artist, license } (or null)
const photoCache = new Map();

/* ===================== Small helpers ===================== */

async function fetchJSON(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
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

function setStatus(element, message, tone = "") {
    element.textContent = message;
    element.classList.toggle("is-warning", tone === "warning");
    element.classList.toggle("is-success", tone === "success");
}

function debounce(callback, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
    };
}

function pad(number) {
    return String(number).padStart(2, "0");
}

function lowerFirst(text) {
    return text.charAt(0).toLowerCase() + text.slice(1);
}

function upperFirst(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function shorten(text, maxLength) {
    return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
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

function toISODate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayISO() {
    return toISODate(new Date());
}

function formatShortDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    });
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
    const unique = [...new Set(titles)];
    const missing = unique.filter(title => !photoCache.has(title));

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

    const link = createElement("a", "", "Wikimedia Commons");
    link.href = photo.pageUrl;
    link.target = "_blank";
    link.rel = "noopener";
    const pictureNote = compact ? "" : `Pictured: ${lowerFirst(pictured)}. `;
    credit.replaceChildren(`${pictureNote}Photo: ${photo.artist}, ${photo.license}, via `, link);
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

/* ===================== Reading the invitation ===================== */

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function findDressCode(text) {
    const match = DRESS_CODE_PATTERNS.find(({ pattern }) => pattern.test(text));
    return match ? match.code : null;
}

function findDate(text) {
    const named = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/i);
    const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/);
    let month;
    let day;
    let year = null;

    if (named) {
        month = MONTHS.indexOf(named[1].toLowerCase()) + 1;
        day = Number(named[2]);
        year = named[3] ? Number(named[3]) : null;
    } else if (numeric) {
        month = Number(numeric[1]);
        day = Number(numeric[2]);
        year = Number(numeric[3]) < 100 ? 2000 + Number(numeric[3]) : Number(numeric[3]);
    } else {
        return null;
    }

    if (!year) {
        // No year written: assume the next time that date comes around.
        year = new Date().getFullYear();
        if (new Date(year, month - 1, day) < startOfToday()) {
            year += 1;
        }
    }

    const candidate = new Date(year, month - 1, day);
    if (candidate.getMonth() !== month - 1 || candidate.getDate() !== day) {
        return null;
    }
    return toISODate(candidate);
}

// Looks for a line that is just "City, Region", e.g. "St. Louis, Missouri".
function findCity(text) {
    const match = text.match(/^\s*([A-Z][A-Za-z.'\- ]{1,40}),\s*([A-Z][A-Za-z.' ]{1,40})\s*$/m);
    return match ? { name: match[1].trim(), region: match[2].trim() } : null;
}

function readInvitation() {
    const text = els.inviteText.value;
    if (!text.trim()) {
        setStatus(els.detected, "");
        return;
    }

    const code = findDressCode(text);
    const date = findDate(text);
    const city = findCity(text);

    if (code) {
        els.form.elements.dressCode.value = code;
        els.dressCodeError.textContent = "";
    }
    if (date) {
        els.eventDate.value = date;
    }
    if (city) {
        const cityKey = `${city.name}|${city.region}`;
        if (cityKey !== state.lastAutoCity) {
            state.lastAutoCity = cityKey;
            els.cityInput.value = `${city.name}, ${city.region}`;
            searchCity(city.name, { region: city.region, autoSelect: true });
        }
    }

    const found = [code && DRESS_CODES[code].name, date && formatShortDate(date), city && city.name].filter(Boolean);
    if (!found.length) {
        setStatus(els.detected, "We couldn't spot the details yet. Choose the dress code below.", "warning");
    } else if (!code) {
        setStatus(els.detected, `We read: ${found.join(" · ")}. No dress code mentioned, so choose one below.`, "warning");
    } else {
        setStatus(els.detected, `We read: ${found.join(" · ")}`, "success");
    }

    if (code && !els.results.hidden) {
        renderResults();
    }
}

const readInvitationSoon = debounce(readInvitation, 450);

function nextWeekday(weekday) {
    const date = startOfToday();
    date.setDate(date.getDate() + 2); // at least two days out, so the forecast exists
    while (date.getDay() !== weekday) {
        date.setDate(date.getDate() + 1);
    }
    return date;
}

function useNextSample() {
    const sample = SAMPLE_INVITATIONS[state.sampleIndex % SAMPLE_INVITATIONS.length];
    state.sampleIndex += 1;

    const dateText = nextWeekday(sample.weekday).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    els.inviteText.value = sample.text.replace("{DATE}", dateText);
    els.sampleBtn.textContent = "Try another sample";
    readInvitation();
}

/* ===================== Venue location ===================== */

function placeLabel(place) {
    const parts = [place.name, place.admin1, place.country].filter(Boolean);
    return parts.filter((part, index) => parts.indexOf(part) === index).join(", ");
}

function selectLocation(location) {
    state.location = location;
    els.cityInput.value = location.label;
    els.cityResults.replaceChildren();
    setStatus(els.locationStatus, `Venue set: ${location.label}`, "success");
    if (!els.results.hidden) {
        updateStrapTip();
    }
}

function selectPlace(place) {
    selectLocation({
        label: placeLabel(place),
        latitude: place.latitude,
        longitude: place.longitude,
        timeZone: place.timezone || BROWSER_TIME_ZONE
    });
}

function renderCityOptions(places) {
    els.cityResults.replaceChildren(...places.map(place => {
        const item = document.createElement("li");
        const button = createElement("button", "city-option", placeLabel(place));
        button.type = "button";
        button.addEventListener("click", () => selectPlace(place));
        item.append(button);
        return item;
    }));
}

async function searchCity(query, { region = "", autoSelect = false } = {}) {
    const name = query.trim();
    if (name.length < 2) {
        setStatus(els.locationStatus, "Type at least two letters of the city.", "warning");
        return;
    }

    // Ignore answers to older searches if the visitor has searched again since.
    state.citySearchId += 1;
    const searchId = state.citySearchId;
    state.location = null;
    els.cityResults.replaceChildren();
    setStatus(els.locationStatus, `Looking up “${name}”…`);

    try {
        const params = new URLSearchParams({ name, count: "5", language: "en", format: "json" });
        const data = await fetchJSON(`${GEOCODING_API}?${params}`);
        if (searchId !== state.citySearchId) {
            return;
        }

        const places = data.results || [];
        if (!places.length) {
            setStatus(els.locationStatus, `We couldn't find “${name}”. Check the spelling, or try a nearby larger city.`, "warning");
            return;
        }

        if (autoSelect) {
            const wanted = region.toLowerCase();
            const best = places.find(place =>
                [place.admin1, place.country, place.country_code].some(value => value && value.toLowerCase() === wanted)
            );
            selectPlace(best || places[0]);
            return;
        }

        renderCityOptions(places);
        setStatus(els.locationStatus, "Choose the right city from the list.");
    } catch (error) {
        if (searchId === state.citySearchId) {
            setStatus(els.locationStatus, "The city lookup isn't responding. Try again in a moment, or use your location.", "warning");
        }
    }
}

function useMyLocation() {
    if (!("geolocation" in navigator)) {
        setStatus(els.locationStatus, "This browser can't share your location. Type the venue city instead.", "warning");
        els.cityInput.focus();
        return;
    }

    els.geoBtn.disabled = true;
    setStatus(els.locationStatus, "Finding you…");

    navigator.geolocation.getCurrentPosition(
        position => {
            els.geoBtn.disabled = false;
            selectLocation({
                label: "Your current location",
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timeZone: BROWSER_TIME_ZONE
            });
        },
        error => {
            els.geoBtn.disabled = false;
            let message = "We couldn't pin down your location. Type the venue city instead.";
            if (error.code === error.PERMISSION_DENIED) {
                message = "Location access was declined. No problem: type the venue city instead.";
            } else if (error.code === error.TIMEOUT) {
                message = "Finding your location took too long. Type the venue city instead.";
            }
            setStatus(els.locationStatus, message, "warning");
            els.cityInput.focus();
        },
        { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
}

/* ===================== Forecast & strap tip (Open-Meteo) ===================== */

function getWeatherType(code) {
    return WEATHER_TYPES.find(type => type.codes.includes(code)) || { label: "Mixed weather" };
}

async function fetchForecast(location, date) {
    const params = new URLSearchParams({
        latitude: location.latitude,
        longitude: location.longitude,
        daily: "weather_code,temperature_2m_max,precipitation_probability_max",
        timezone: location.timeZone || "auto",
        start_date: date,
        end_date: date
    });
    const data = await fetchJSON(`${FORECAST_API}?${params}`);
    const daily = data.daily;
    if (!daily || !daily.time || !daily.time.length) {
        throw new Error("The forecast came back empty.");
    }
    return {
        code: daily.weather_code[0],
        highC: daily.temperature_2m_max[0],
        rainChance: daily.precipitation_probability_max[0]
    };
}

function describeForecast(forecast, place, date) {
    const type = getWeatherType(forecast.code);
    const highF = Math.round((forecast.highC * 9) / 5 + 32);
    const parts = [place, formatShortDate(date), `${type.label}, high ${highF}°F / ${Math.round(forecast.highC)}°C`];
    if (forecast.rainChance !== null && forecast.rainChance !== undefined) {
        parts.push(`${forecast.rainChance}% chance of rain`);
    }
    return parts.join(" · ");
}

// Turns the forecast into advice about the straps of the watches on screen.
function adviseStrap(forecast, watches) {
    const type = getWeatherType(forecast.code);
    const wet = type.wet || (forecast.rainChance || 0) >= 40;
    const leatherCount = watches.filter(watch => watch.strapType === "leather").length;
    const allLeather = leatherCount === watches.length;
    const onLeather = allLeather
        ? `all ${NUMBER_WORDS[leatherCount]} of these watches are on leather`
        : `${NUMBER_WORDS[leatherCount]} of these watches ${leatherCount === 1 ? "is" : "are"} on leather`;
    const otherPicks = watches.length - leatherCount === 1 ? "The bracelet pick is" : "The bracelet picks are";

    if (type.snowy) {
        return "Snow is likely. Keep your watch under a long coat sleeve, and wipe any leather strap dry when you get inside.";
    }
    if (wet && allLeather) {
        return `Rain is likely, and ${onLeather}, which water can stain. Keep your cuff down over the strap and an umbrella up.`;
    }
    if (wet && leatherCount > 0) {
        return `Rain is likely, and ${onLeather}, which water can stain. ${otherPicks} the safer choice.`;
    }
    if (wet) {
        return "Rain is likely, but none of these watches is on leather, so a shower won't hurt the straps.";
    }
    if (forecast.highC >= 28 && allLeather) {
        return "It'll be hot, and leather soaks up sweat. Wear the strap a notch looser so it can breathe.";
    }
    if (forecast.highC >= 28 && leatherCount > 0) {
        return `It'll be hot, and ${onLeather}, which soaks up sweat. ${otherPicks} more comfortable today.`;
    }
    if (forecast.highC >= 28) {
        return "It'll be hot, but bracelets and fabric straps handle the heat well. You're set.";
    }
    if (forecast.highC <= 4) {
        return "It'll be cold. A slim watch slips under a coat sleeve as easily as a shirt cuff, so check the cuff tests below.";
    }
    return leatherCount > 0
        ? "Mild and dry: a perfect day for leather straps."
        : "Mild and dry: any of these straps will be comfortable.";
}

function renderStrapTip(advice, forecastLine = "") {
    const nodes = [createElement("p", "strap-tip__label", "Strap tip")];
    if (forecastLine) {
        nodes.push(createElement("p", "strap-tip__forecast", forecastLine));
    }
    nodes.push(createElement("p", "strap-tip__advice", advice));
    els.strapTip.replaceChildren(...nodes);
}

async function updateStrapTip() {
    const watches = currentPicks();
    els.strapTip.hidden = watches.length === 0; // nothing to strap on at white tie
    if (!watches.length) {
        return;
    }
    if (!state.location) {
        renderStrapTip("Add the venue city in step III, and we'll check the forecast and tell you which straps suit it.");
        return;
    }

    const date = els.eventDate.value || todayISO();
    const daysAway = (Date.parse(date) - Date.parse(todayISO())) / DAY_MS;
    const place = state.location.label === "Your current location" ? "Near you" : state.location.label.split(", ")[0];

    if (daysAway > FORECAST_RANGE_DAYS) {
        renderStrapTip(`The forecast for ${formatShortDate(date)} isn't out yet. It opens about two weeks ahead, so check back closer to the day.`);
        return;
    }
    if (daysAway < 0) {
        renderStrapTip("That date has already passed, so there's no forecast to check.");
        return;
    }

    state.forecastId += 1;
    const requestId = state.forecastId;
    renderStrapTip(`Checking the forecast for ${place}…`);

    try {
        const forecast = await fetchForecast(state.location, date);
        if (requestId === state.forecastId) {
            renderStrapTip(adviseStrap(forecast, watches), describeForecast(forecast, place, date));
        }
    } catch (error) {
        if (requestId === state.forecastId) {
            renderStrapTip("The weather service isn't answering right now. Your watches are below; try the forecast again in a moment.");
        }
    }
}

/* ===================== Watch cards ===================== */

function currentPicks() {
    const code = DRESS_CODES[els.form.elements.dressCode.value];
    if (!code) {
        return [];
    }
    return code.wrist[els.form.elements.wardrobe.value].picks
        .map(id => WATCHES[id])
        .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));
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

function buildWatchCard(watch) {
    const card = els.watchTemplate.content.firstElementChild.cloneNode(true);

    card.querySelector(".watch__tier").textContent = PRICE_TIERS[watch.tier];
    card.querySelector(".watch__brand").textContent = watch.brand;
    card.querySelector(".watch__model").textContent = watch.model;
    card.querySelector(".watch__why").textContent = watch.why;
    card.querySelector('[data-spec="case"]').textContent = `${watch.caseMm} mm`;
    card.querySelector('[data-spec="thickness"]').textContent = formatThickness(watch);
    card.querySelector('[data-spec="movement"]').textContent = watch.movement;
    card.querySelector('[data-spec="strap"]').textContent = watch.strap;

    renderCuffTest(card, watch);
    loadPhoto(card.querySelector(".photo__frame"), card.querySelector(".photo__credit"), watch.photo, watch.pictured);
    return card;
}

function renderResults() {
    const code = DRESS_CODES[els.form.elements.dressCode.value];
    const wardrobe = els.form.elements.wardrobe.value;
    const watches = currentPicks();
    const wearsWatch = watches.length > 0;

    els.resultsEyebrow.textContent = `${upperFirst(wardrobe)} · ${wearsWatch ? "three watches for" : "the watch etiquette for"}`;
    els.resultsTitle.textContent = code.name;
    els.resultsDecoded.textContent = code.decoded;
    els.resultsRule.textContent = code.wrist[wardrobe].note;

    els.watchGrid.hidden = !wearsWatch;
    els.noWatch.hidden = wearsWatch;
    if (wearsWatch) {
        getPhotos(watches.map(watch => watch.photo)).catch(() => {}); // one request for all three
        els.watchGrid.replaceChildren(...watches.map(buildWatchCard));
    } else {
        loadPhoto(els.pocketFrame, els.pocketCredit, POCKET_WATCH.photo, POCKET_WATCH.pictured);
    }

    els.results.hidden = false;
    updateStrapTip();
}

/* ===================== Events ===================== */

function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    if (!els.form.elements.dressCode.value) {
        els.dressCodeError.textContent = "Paste an invitation or choose a dress code.";
        els.form.querySelector('input[name="dressCode"]').focus();
        return;
    }

    renderResults();
    els.results.scrollIntoView({ behavior: REDUCED_MOTION.matches ? "auto" : "smooth", block: "start" });
    els.resultsTitle.focus({ preventScroll: true });
}

// Once the watches are showing, changing a choice updates them straight away.
function handleFormChange(changeEvent) {
    const { name } = changeEvent.target;
    if (name === "dressCode") {
        els.dressCodeError.textContent = "";
    }
    if (els.results.hidden) {
        return;
    }
    if (name === "dressCode" || name === "wardrobe") {
        renderResults();
    } else if (name === "eventDate") {
        updateStrapTip();
    }
}

function bindEvents() {
    els.form.addEventListener("submit", handleSubmit);
    els.form.addEventListener("change", handleFormChange);
    els.inviteText.addEventListener("input", readInvitationSoon);
    els.sampleBtn.addEventListener("click", useNextSample);

    els.citySearchBtn.addEventListener("click", () => searchCity(els.cityInput.value));
    els.cityInput.addEventListener("keydown", keyEvent => {
        if (keyEvent.key === "Enter") {
            keyEvent.preventDefault(); // search for the city instead of submitting the form
            searchCity(els.cityInput.value);
        }
    });
    els.cityInput.addEventListener("input", () => {
        if (state.location && els.cityInput.value !== state.location.label) {
            state.location = null;
            setStatus(els.locationStatus, "Press Find (or Enter) to confirm this city.");
        }
    });
    els.geoBtn.addEventListener("click", useMyLocation);
}

function init() {
    els.eventDate.value = todayISO();
    renderHeroPhotos();
    bindEvents();
}

init();
