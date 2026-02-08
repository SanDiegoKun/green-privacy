// 1. Sprach-Handhabung
let currentLang = 'de';
let currentDomain = '';

const translations = {
  de: {
    privacyLabel: "Datenschutz:",
    sustainabilityLabel: "Nachhaltigkeit:",
    alternativesLabel: "Alternativen:",
    sourcesLabel: "Quellen:",
    unknownWebsite: "Unbekannte Website: ",
    noData: "Keine Daten verfügbar.",
    error: "Fehler beim Laden der Daten.",
    suggestWebsite: "Diese Website vorschlagen?",
    autoTranslated: "(automatisch übersetzt)",
    tosdr: "ToS;DR",
    greenWeb: "The Green Web Foundation"
  },
  en: {
    privacyLabel: "Privacy:",
    sustainabilityLabel: "Sustainability:",
    alternativesLabel: "Alternatives:",
    sourcesLabel: "Sources:",
    unknownWebsite: "Unknown website: ",
    noData: "No data available.",
    error: "Error loading data.",
    suggestWebsite: "Suggest this website?",
    autoTranslated: "(auto-translated)",
    tosdr: "ToS;DR",
    greenWeb: "The Green Web Foundation"
  }
};

// 2. Übersetzungsfunktion (für deine JSON-Struktur)
function translateDescription(description, targetLang) {
  if (!description) return translations[currentLang].noData;

  // Falls description ein Objekt ist (mehrsprachig)
  if (typeof description === 'object') {
    return description[targetLang] ||
           description[currentLang] ||
           description.de ||
           description.en ||
           translations[currentLang].noData;
  }

  // Falls description ein String ist (einsprachig)
  if (targetLang === 'en') {
    const enTranslations = {
      "Nachhaltige Alternativen zu Amazon mit Fokus auf faire Produktion.": "Sustainable alternatives to Amazon with a focus on fair production.",
      "Datenschutzfreundliche Suchmaschine ohne Tracking.": "Privacy-friendly search engine without tracking.",
      "Suchmaschine, die 80% ihrer Gewinne in Aufforstungsprojekte investiert.": "Search engine that invests 80% of profits in reforestation projects."
    };
    const translated = enTranslations[description] || description;
    return translated !== description
      ? `${translated} <span class="translated-note">${translations.en.autoTranslated}</span>`
      : translated;
  }
  else if (targetLang === 'de') {
    const deTranslations = {
      "Sustainable alternatives to Amazon with a focus on fair production.": "Nachhaltige Alternativen zu Amazon mit Fokus auf faire Produktion.",
      "Privacy-friendly search engine without tracking.": "Datenschutzfreundliche Suchmaschine ohne Tracking.",
      "Search engine that invests 80% of profits in reforestation projects.": "Suchmaschine, die 80% ihrer Gewinne in Aufforstungsprojekte investiert."
    };
    const translated = deTranslations[description] || description;
    return translated !== description
      ? `${translated} <span class="translated-note">${translations.de.autoTranslated}</span>`
      : translated;
  }

  return description;
}

// 3. DOM-Elemente sicher abfragen
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Element mit ID "${id}" nicht gefunden!`);
    return null;
  }
  return element;
}

// 4. Sprachinitialisierung (MIT NULL-PRÜFUNG)
async function initLanguage() {
  try {
    const savedLang = await browser.storage.local.get('language');
    if (savedLang.language) {
      currentLang = savedLang.language;
    } else {
      const browserLang = navigator.language.split('-')[0];
      currentLang = browserLang === 'de' ? 'de' : 'en';
      await browser.storage.local.set({ language: currentLang });
    }
    updateLanguageUI();
  } catch (error) {
    console.error("Fehler bei Sprachinitialisierung:", error);
    currentLang = 'de'; // Fallback auf Deutsch
    updateLanguageUI();
  }
}

// 5. UI aktualisieren (MIT NULL-PRÜFUNG)
function updateLanguageUI() {
  const elements = [
    { id: 'lang-toggle', text: currentLang === 'de' ? '🇩🇪' : '🇬🇧' },
    { id: 'privacy-label', text: translations[currentLang].privacyLabel },
    { id: 'sustainability-label', text: translations[currentLang].sustainabilityLabel },
    { id: 'alternatives-label', text: translations[currentLang].alternativesLabel },
    { id: 'sources', text: `${translations[currentLang].sourcesLabel} lokal` }
  ];

  elements.forEach(({ id, text }) => {
    const element = getElement(id);
    if (element) element.textContent = text;
  });

  getElement('lang-toggle').textContent = currentLang === 'de' ? '🇩🇪' : '🇬🇧';
}

// 6. Sterne-Bewertung generieren
function getStars(score) {
  if (score === "unbekannt") return '❓';
  const fullStars = Math.floor(score);
  const halfStar = score % 1 >= 0.5 ? '⭐' : '';
  const emptyStars = 5 - Math.ceil(score);
  return '⭐'.repeat(fullStars) + halfStar + '☆'.repeat(emptyStars);
}

// 7. Daten laden (MIT ROBUSTER FEHLERBEHANDLUNG)
async function loadWebsiteData() {
  try {
    // Aktiven Tab abfragen
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.url) throw new Error("Keine aktive Tab-URL gefunden.");

    // URL parsen
    let url;
    try {
      url = new URL(tabs[0].url);
    } catch (e) {
      throw new Error(`Ungültige URL: ${tabs[0].url}`);
    }

    currentDomain = url.hostname;
    const baseDomain = currentDomain.replace(/^www\./, '').split('.')[0];

    // Daten von GitHub laden
    const response = await fetch('https://raw.githubusercontent.com/SanDiegoKun/privacygreen-db/main/websites.json');
    if (!response.ok) throw new Error(`GitHub: Status ${response.status}`);

    const data = await response.json();
    const entry = data.websites.find(website =>
      website.baseDomain === baseDomain ||
      (website.domains && website.domains.includes(currentDomain))
    );

    if (entry) {
      // Daten anzeigen (MIT NULL-PRÜFUNG)
      getElement('website-name').textContent = `${entry.name} (${currentDomain})`;
      getElement('privacy-stars').innerHTML = getStars(entry.privacyScore);
      getElement('privacy-score').textContent = `${entry.privacyScore}/5`;
      getElement('sustainability-stars').innerHTML = getStars(entry.sustainabilityScore);
      getElement('sustainability-score').textContent = `${entry.sustainabilityScore}/5`;

      // Gesamtbewertung
      const totalScore = ((entry.privacyScore + entry.sustainabilityScore) / 2).toFixed(1);
      getElement('total-rating').textContent = `${totalScore}/5`;

      // Alternativen anzeigen (MIT ÜBERSETZUNG)
      const alternativesList = getElement('alternatives-list');
      if (entry.alternatives?.length > 0) {
        alternativesList.innerHTML = entry.alternatives
          .map(alt => {
            const description = typeof alt.description === 'object'
              ? alt.description[currentLang] || alt.description.de || alt.description.en || ''
              : alt.description;
            const translatedDesc = translateDescription(description, currentLang);
            return `
              <div class="alternative-item">
                <a href="${alt.url}" target="_blank">${alt.name}</a>:
                ${translatedDesc}
              </div>
            `;
          })
          .join('');
      } else {
        alternativesList.innerHTML = `<div class="alternative-item">${translations[currentLang].noData}</div>`;
      }

      // KORREKTE QUELLENANGABE (Memory #4)
      getElement('sources').textContent =
        `${translations[currentLang].sourcesLabel} ${entry.privacySource || translations[currentLang].tosdr}, ${entry.sustainabilitySource || translations[currentLang].greenWeb}`;

    } else {
      // Unbekannte Website
      getElement('website-name').textContent = `${translations[currentLang].unknownWebsite}${currentDomain}`;
      getElement('privacy-stars').innerHTML = '❓';
      getElement('privacy-score').textContent = translations[currentLang].noData;
      getElement('sustainability-stars').innerHTML = '❓';
      getElement('sustainability-score').textContent = translations[currentLang].noData;
      getElement('total-rating').textContent = translations[currentLang].noData;
      getElement('alternatives-list').innerHTML = `
        <div class="alternative-item">
          ${translations[currentLang].noData}
          <br><small><a href="https://github.com/SanDiegoKun/privacygreen-db/issues" target="_blank">${translations[currentLang].suggestWebsite}</a></small>
        </div>
      `;
    }

  } catch (error) {
    console.error('Fehler:', error);
    getElement('website-name').textContent = `${translations[currentLang].error}: ${error.message}`;
    getElement('privacy-stars').innerHTML = '❌';
    getElement('privacy-score').textContent = '–/5';
    getElement('sustainability-stars').innerHTML = '❌';
    getElement('sustainability-score').textContent = '–/5';
    getElement('total-rating').textContent = 'Fehler';
    getElement('alternatives-list').innerHTML = `<div class="alternative-item">${translations[currentLang].error}</div>`;
    getElement('sources').textContent = `${translations[currentLang].sourcesLabel} ${translations[currentLang].error}`;
  }
}

// 8. Sprachwechsel-Button
getElement('lang-toggle')?.addEventListener('click', async () => {
  currentLang = currentLang === 'de' ? 'en' : 'de';
  await browser.storage.local.set({ language: currentLang });
  updateLanguageUI();
  await loadWebsiteData();
});

// 9. Initialisierung (MIT NULL-PRÜFUNG)
document.addEventListener('DOMContentLoaded', async () => {
  // Warte bis DOM vollständig geladen ist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

  async function main() {
    await initLanguage();
    await loadWebsiteData();
  }
});