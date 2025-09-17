// TTDSG/DSGVO compliant Cookie Management
class TTDSGCookieManager {
    GTM_ID; // Google Tag Manager ID that is set in cookie.json

    /**
     * Initializes the cookie manager with the given GTM ID.
     * @param {string} GTM_ID  Google Tag Manager ID
     */
    constructor(GTM_ID) {
        this.GTM_ID = GTM_ID;
        this.consentData = this.loadConsent();
        this.initBanner();
        this.restoreToggles();
        document.querySelector('.cookie-container').hidden = false;
    }

    /**
     * Restore the state of the UI toggle state from the consent data.
     */
    restoreToggles() {
        // Restore the UI toggle state from consentData
        const consent = this.consentData;
        const analyticsToggle = document.getElementById('analytics-toggle');
        if (analyticsToggle){
            if (consent && typeof consent.analytics === 'boolean') {
                if (consent.analytics) {
                    analyticsToggle.classList.add('active');
                    analyticsToggle.setAttribute('aria-checked', 'true');
                } else {
                    analyticsToggle.classList.remove('active');
                    analyticsToggle.setAttribute('aria-checked', 'false');
                }
            } else {
                analyticsToggle.classList.remove('active');
                analyticsToggle.setAttribute('aria-checked', 'false');
            }
        }
        const marketingToggle = document.getElementById('marketing-toggle');
        if (marketingToggle){
            if (consent && typeof consent.marketing === 'boolean') {
                if (consent.marketing) {
                    marketingToggle.classList.add('active');
                    marketingToggle.setAttribute('aria-checked', 'true');
                } else {
                    marketingToggle.classList.remove('active');
                    marketingToggle.setAttribute('aria-checked', 'false');
                }
            } else {
                marketingToggle.classList.remove('active');
                marketingToggle.setAttribute('aria-checked', 'false');
            }
        }
    }

    /**
     * Load saved consent data from localStorage.
     * @returns {Object|null} The consent data or null if not found.
     */
    loadConsent() {
        const saved = localStorage.getItem('cookie-consent');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.warn('Invalid consent data, resetting');
            }
        }
        return null;
    }

    /**
     * Save consent data to localStorage and apply settings.
     * @param {Object} consent The consent data to save.
     */
    saveConsent(consent) {
        const consentData = {
            ...consent,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        localStorage.setItem('cookie-consent', JSON.stringify(consentData));
        this.consentData = consentData;
        this.applyConsent();
    }

    /**
     * Initialize the cookie banner based on consent data.
     * Shows the banner if no consent is given, otherwise applies consent settings.
     */
    initBanner() {
        // Banner zeigen wenn keine Einwilligung vorhanden
        if (!this.consentData) {
            this.showBanner();
        } else {
            this.applyConsent();
            this.hideBanner();
        }
    }

    /**
     * Show the cookie consent banner.
     */
    showBanner() {
        document.getElementsByClassName('cookie-block-overlay')[0].id = 'cookie-block-overlay';
        document.getElementById('cookieBanner').classList.remove('hidden');
        document.getElementById('cookieBanner').focus();
    }

    /**
     * Hide the cookie consent banner.
     */
    hideBanner() {
        document.getElementById('cookieBanner').classList.add('hidden');
        // Ensure no blocking if consent already given
        document.getElementsByClassName('cookie-block-overlay')[0].id = '';
    }

    /**
     * Apply consent settings by enabling/disabling scripts based on user choices.
     */
    applyConsent() {
        const consent = this.consentData;
        if (!consent) return;

        // activate / deactivate Analytics Cookies
        if (consent.analytics) {
            this.loadGTM();
            // Add other analytics scripts here if needed
        } else {
            this.removeGTM();
            // Add other analytics removal logic here if needed
        }
        // activate / deactivate Marketing Cookies
        if (consent.marketing) {
            // Add marketing scripts here if needed
        } else {
            // Add marketing removal logic here if needed
        }
    }

    /**
     * Load Google Tag Manager script dynamically.
     * This function ensures GTM is only loaded once.
     */
    loadGTM() {
        if (window.gtm_loaded) return;
        window.gtm_loaded = true;
        (function (w, d, s, l, i) {
            w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
            var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
            j.async = true;
            j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j, f);
        })(window, document, 'script', 'dataLayer', this.GTM_ID);
    }

    /**
     * Disable Google Tag Manager by setting the appropriate flag.
     * This prevents any tracking scripts from running.
     */
    removeGTM() {
        window['ga-disable-' + this.GTM_ID] = true;
    }
}


// Load Cookie Banner HTML
fetch('cookie/cookie.html')
    .then(response => response.text())
    .then(html => {
        document.querySelector('.cookie-container').innerHTML = html;
        fetch('cookie/cookie.json')
            .then(response => response.json())
            .then(data => {
                window.cookieManager = new TTDSGCookieManager(data.GTM_ID);
                // get language from html tag
                const lang = document.documentElement.lang;
                // Get correct data for the current language
                let descriptions_data = null;
                for (const key in data.descriptions) {
                    if (key === lang) {
                        descriptions_data = data.descriptions[key];
                        break;
                    }
                }
                if (!descriptions_data) {
                    console.warn(`Data for ${lang} not found, falling back to 'en'`);
                    descriptions_data = data.descriptions['en'];
                }
                // Get correct info data for the current language
                let info = data.type_description.find(obj => obj.lang === lang);
                if (!info) {
                    console.warn(`Type description for ${lang} not found, falling back to 'en'`);
                    info = data.type_description.find(obj => obj.lang === 'en');
                }
                // Dynamically populate the cookie info section
                try {
                    // Necessary Cookies
                    if (descriptions_data[0].NEEDED === undefined) {
                        throw new Error('No NEEDED cookie data found, but base structure is required.');
                    }
                    let necessaryContainer = document.getElementById('necessary-details');
                    document.getElementById('necessary-title').innerHTML = info.NEEDED;
                    const necessaryInfo = createNecessaryCookieInfo(descriptions_data[0].NEEDED, info);
                    necessaryContainer.innerHTML += necessaryInfo;
                } catch (error) {
                    console.warn('Error populating necessary cookie info:', error);
                }
                try {
                    // Analytics Cookies
                    if (descriptions_data[0].ANALYTICS !== undefined) {
                        let analyticsContainer = document.getElementById('analytics-details');
                        document.getElementById('analytics-title').innerHTML = info.ANALYTICS;
                        const analyticsInfo = createAnalyticsCookieInfo(descriptions_data[0].ANALYTICS, info);
                        analyticsContainer.innerHTML += analyticsInfo;
                    } else adocument.getElementById('analytics-category').hidden = true;
                } catch (error) {
                    console.warn('Error populating analytics cookie info:', error);
                }
                try {
                    // Marketing Cookies
                    if (descriptions_data[0].MARKETING !== undefined) {
                        let marketingContainer = document.getElementById('marketing-details');
                        document.getElementById('marketing-title').innerHTML = info.MARKETING;
                        const marketingInfo = createMarketingCookieInfo(descriptions_data[0].MARKETING, info);
                        marketingContainer.innerHTML += marketingInfo;
                    } else document.getElementById('marketing-category').hidden = true;
                } catch (error) {
                    console.warn('Error populating marketing cookie info:', error);
                }
                // set button texts and aria-labels from info
                try {
                    document.getElementsByClassName('btn-accept-all')[0].innerText = info.accept_all;
                    document.getElementsByClassName('btn-accept-all')[0].setAttribute('aria-label', info.accept_all);
                    document.getElementsByClassName('btn-reject-all')[0].innerText = info.decline_all;
                    document.getElementsByClassName('btn-reject-all')[0].setAttribute('aria-label', info.decline_all);
                    document.getElementsByClassName('btn-accept-selected')[0].innerText = info.save_selected;
                    document.getElementsByClassName('btn-accept-selected')[0].setAttribute('aria-label', info.save_selected);
                    document.getElementsByClassName('btn-detail-settings')[0].innerText = info.details;
                    document.getElementsByClassName('btn-detail-settings')[0].setAttribute('aria-label', info.details_aria);
                    document.querySelector('.cookie-settings-link').innerText = info.settings;
                    document.querySelector('.cookie-settings-link').setAttribute('aria-label', info.settings_aria);
                    document.getElementById('cookie-title').innerText = info.title;
                    document.getElementById('cookie-desc').innerText = info.title_description;
                } catch (error) {
                    console.debug('Error setting button texts and aria-labels:', error);
                }
            });
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', function () {
                const category = this.getAttribute('data-category');
                toggleCategory(category);
            });
            header.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const category = this.getAttribute('data-category');
                    toggleCategory(category);
                }
            });

        });
        // Attach listeners to toggles
        try {
            document.getElementById('analytics-toggle').addEventListener('click', function (e) {
                e.stopPropagation();
                toggleCookieCategory('analytics');
            });
        } catch (error) {
            console.debug('Error attaching analytics toggle listener:', error);
        }
        try {
            document.getElementById('marketing-toggle').addEventListener('click', function (e) {
                e.stopPropagation();
                toggleCookieCategory('marketing');
            });
        } catch (error) {
            console.debug('Error attaching marketing toggle listener:', error);
        }

    })
    .catch(err => {
        console.error('Failed to load cookie banner HTML:', err);
    });

// Keyboard navigation
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const banner = document.getElementById('cookieBanner');
        if (!banner.classList.contains('hidden')) {
            rejectAllCookies(); // ESC = Reject all
        }
    }
});

// Unhide cookie banner

/**
 * Create HTML for necessary cookie information.
 * @param {Array} neededData Array of NEEDED cookie info objects
 * @param {Object} typeDescription  Descriptions for the fields in the current language
 * @returns {string} HTML string of necessary cookie information
 */
function createNecessaryCookieInfo(neededData, typeDescription) {
    const html = [`<h3>${typeDescription.NEEDED_DESC}:</h3>`];
    neededData.forEach(element => {
        html.push(`
            <br>
            <div class="cookie-info">
                <p><strong>${typeDescription.provider}:</strong> ${element.provider}</p>
                <p><strong>${typeDescription.example}:</strong> ${element.example}</p>
                <p><strong>${typeDescription.legal_basis}:</strong> ${element.legal_basis}</p>
                <p><strong>${typeDescription.duration}:</strong> ${element.duration}</p>
            </div>
        `);
    });
    return html.join('');
}

/**
 * Create HTML for analytics cookie information.
 * @param {Array} analyticsData Array of ANALYTICS cookie info objects
 * @param {Object} typeDescription  Descriptions for the fields in the current language
 * @returns {string} HTML string of analytics cookie information
 */
function createAnalyticsCookieInfo(analyticsData, typeDescription) {
    const html = [`<h3>${typeDescription.ANALYTICS_DESC}:</h3>`];
    analyticsData.forEach(element => {
        html.push(`
            <br>
            <div class="cookie-info">
                <p><strong>${typeDescription.provider}:</strong> ${element.provider}</p>
                <p><strong>${typeDescription.data}:</strong> ${element.data}</p>
                <p><strong>${typeDescription.data_transferred}:</strong> ${element.data_transferred}</p>
                <p><strong>${typeDescription.legal_basis}:</strong> ${element.legal_basis}</p>
                <p><strong>${typeDescription.duration}:</strong> ${element.duration}</p>
                <p><strong>${typeDescription.withdrawal}:</strong> ${element.withdrawal}</p>
            </div>
        `);
    });
    return html.join('');
}

/**
 * Create HTML for marketing cookie information.
 * @param {Array} marketingData Array of MARKETING cookie info objects
 * @param {Object} typeDescription  Descriptions for the fields in the current language
 * @returns {string} HTML string of marketing cookie information
 */
function createMarketingCookieInfo(marketingData, typeDescription) {
    const html = [`<h3>${typeDescription.MARKETING_DESC}:</h3>`];
    marketingData.forEach(element => {
        html.push(`
            <br>
            <div class="cookie-info">
                <p><strong>${typeDescription.provider}:</strong> ${element.provider}</p>
                <p><strong>${typeDescription.data}:</strong> ${element.data}</p>
                <p><strong>${typeDescription.data_transferred}:</strong> ${element.data_transferred}</p>
                <p><strong>${typeDescription.legal_basis}:</strong> ${element.legal_basis}</p>
                <p><strong>${typeDescription.duration}:</strong> ${element.duration}</p>
                <p><strong>${typeDescription.withdrawal}:</strong> ${element.withdrawal}</p>
            </div>
        `);
    });
    return html.join('');
}

/**
 * Toggle the visibility of a cookie category.
 * @param {string} category The category to toggle.
 */
function toggleCategory(category) {
    const details = document.getElementsByClassName('category-details');
    const selected = document.getElementById(category + '-details');
    const isExpanded = selected.classList.contains('expanded');
    // Toggle the selected category
    if (!isExpanded) {
        // Close all other categories
        Array.from(details).forEach(el => {
            if (el !== selected) {
                el.classList.remove('expanded');
            }
        });
        selected.classList.add('expanded');
    }
    else {
        selected.classList.remove('expanded');
    }
}

/**
 * Toggle the state of a cookie category.
 * @param {string} category The category of the cookie.
 */
function toggleCookieCategory(category) {
    if (category === 'necessary') return; // Necessary cookies cannot be toggled
    try {
        const toggle = document.getElementById(category + '-toggle');
        const isActive = toggle.classList.contains('active');
        if (isActive) {
            setCookieToggleElement(toggle, 'false');
        } else {
            setCookieToggleElement(toggle, 'true');
        }
    } catch (error) {
        console.error('Error toggling cookie category:', error);
    }
}

/**
 * Get the current state of a cookie toggle.
 * @param {string} category The category of the cookie.
 * @returns {boolean} The current state of the cookie toggle.
 */
function getCookieToggleState(category) {
    try {
        const toggle = document.getElementById(category + '-toggle');
        return toggle.classList.contains('active');
    } catch (error) {
        console.debug('Error getting cookie toggle state:', error);
        return false;
    }
}

/**
 * Set the visual state of a cookie toggle element.
 * @param {HTMLElement} element The toggle element to update.
 * @param {string} state The state to set ('true' or 'false').
 */
function setCookieToggleElement(element, state) {
    try {
        (state == 'true') ? element.classList.add('active') : element.classList.remove('active');
        element.setAttribute('aria-checked', state);
    } catch (error) {
        console.error('Error setting ', element.tagName, ' cookie category to state=', state, ':', error);
    }
}

/**
 * Accept all cookies including non-essential ones.
 */
function acceptAllCookies() {
    const consent = {
        necessary: true,
        analytics: true,
        marketing: true
    };
    cookieManager.saveConsent(consent);
    cookieManager.hideBanner();
    try {
        setCookieToggleElement(document.getElementById('analytics-toggle'), 'true');
    } catch (error) {
        console.debug('Error loading analytics toggle:', error);
    }
    try {
        setCookieToggleElement(document.getElementById('marketing-toggle'), 'true');
    } catch (error) {
        console.debug('Error loading marketing toggle:', error);
    }
}

/**
 * Reject all non-essential cookies.
 */
function rejectAllCookies() {
    const consent = {
        necessary: true,
        analytics: false,
        marketing: false
    };
    cookieManager.saveConsent(consent);
    cookieManager.hideBanner();
    try {
        setCookieToggleElement(document.getElementById('analytics-toggle'), 'false');
    } catch (error) {
        console.debug('Error loading analytics toggle:', error);
    }
    try {
        setCookieToggleElement(document.getElementById('marketing-toggle'), 'false');
    } catch (error) {
        console.debug('Error loading marketing toggle:', error);
    }
}

/**
 * Accept selected cookies based on user preferences.
 */
function acceptSelectedCookies() {
    const consent = {
        necessary: true,
        analytics: getCookieToggleState('analytics'),
        marketing: getCookieToggleState('marketing')
    };
    cookieManager.saveConsent(consent);
    cookieManager.hideBanner();
}

/**
 * Show detailed settings by expanding all categories.
 */
function showDetailSettings() {
    document.querySelectorAll('.category-details').forEach(el => {
        el.classList.add('expanded');
    });
}

/**
 * Show the cookie banner again for changing preferences.
 */
function showCookieBanner() {
    cookieManager.showBanner();
}
