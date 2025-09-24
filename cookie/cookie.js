class TTDSGCookieManager {
    constructor(GTM_ID) {
        this.GTM_ID = GTM_ID;
        this.consentVersion = '2.0';
        this.scriptsBlocked = true;
        this.consentData = this.loadConsent();

        // Initialize accessibility features
        this.setupAccessibilityFeatures();

        // Block all tracking initially
        this.blockAllTracking();

        this.initBanner();
        this.restoreToggles();
        document.querySelector('.cookie-container').hidden = false;

        // Setup withdrawal mechanisms
        this.setupWithdrawalMechanisms();
    }

    /**
     * Enhanced consent storage with comprehensive audit trail
     */
    loadConsent() {
        const saved = localStorage.getItem('cookie-consent');
        if (saved) {
            try {
                const consent = JSON.parse(saved);
                // Validate consent structure and version
                if (this.isValidConsent(consent)) {
                    return consent;
                } else {
                    console.warn('Outdated consent format, requiring new consent');
                    this.clearConsent();
                }
            } catch (e) {
                console.warn('Invalid consent data, resetting');
                this.clearConsent();
            }
        }
        return null;
    }

    /**
     * Validate consent data structure
     */
    isValidConsent(consent) {
        return consent &&
            consent.version &&
            consent.timestamp &&
            consent.consentId &&
            typeof consent.necessary === 'boolean';
    }

    /**
     * Enhanced consent saving with comprehensive documentation
     */
    saveConsent(consent) {
        try {
            const consentData = {
                ...consent,
                timestamp: new Date().toISOString(),
                version: this.consentVersion,
                consentId: this.generateConsentId(),
                userAgent: navigator.userAgent,
                pageUrl: window.location.href,
                language: this.getPageLanguage(),
                services: this.buildServiceConsent(consent),
                withdrawalHistory: this.consentData?.withdrawalHistory || [],
                lastModified: new Date().toISOString()
            };

            // Store consent with error handling
            localStorage.setItem('cookie-consent', JSON.stringify(consentData));
            this.consentData = consentData;
            this.scriptsBlocked = false;
            this.applyConsent();

            this.showSuccessMessage("Your cookie preferences have been saved successfully.");
            this.logConsentEvent('consent_given', consentData);

        } catch (error) {
            console.error('Failed to save consent:', error);
            this.showErrorMessage("Failed to save your preferences. Please try again.");
        }
    }

    /**
     * Generate unique consent ID for tracking
     */
    generateConsentId() {
        return 'consent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Build detailed service consent mapping
     */
    buildServiceConsent(consent) {
        const services = {};
        const timestamp = new Date().toISOString();

        if (consent.analytics) {
            services.googleAnalytics = {
                consented: true,
                timestamp: timestamp,
                purpose: 'Website analytics and performance monitoring'
            };
            services.gtm = {
                consented: true,
                timestamp: timestamp,
                purpose: 'Tag management for analytics and marketing tools'
            };
        }

        if (consent.marketing) {
            services.marketingCookies = {
                consented: true,
                timestamp: timestamp,
                purpose: 'Personalized advertising and remarketing'
            };
        }

        services.essential = {
            consented: true,
            timestamp: timestamp,
            purpose: 'Essential website functionality and security'
        };

        return services;
    }

    /**
     * Clean cyclic data for JSON serialization
     */
    cleanCyclicData(obj, seen = new WeakSet()) {
        if (obj && typeof obj === 'object') {
            if (seen.has(obj)) {
                return undefined; // Remove cyclic reference
            }
            seen.add(obj);
            for (const key in obj) {
                obj[key] = this.cleanCyclicData(obj[key], seen);
            }
        }
        return obj;
    }

    /**
     * Enhanced consent withdrawal mechanism
     */
    withdrawConsent(categories = ['analytics', 'marketing']) {
        if (!this.consentData) return;
        delete this.consentData.withdrawalHistory;

        // Create withdrawal record
        const withdrawalRecord = {
            timestamp: new Date().toISOString(),
            withdrawnCategories: categories,
            previousConsent: { ...this.consentData },
            method: 'user_initiated'
        };

        // Create new consent with withdrawn categories
        const newConsent = { ...this.consentData };
        categories.forEach(category => {
            if (category !== 'necessary') {
                newConsent[category] = false;
            }
        });
        newConsent.withdrawalHistory = withdrawalRecord;
        newConsent.lastModified = new Date().toISOString();
        console.log('Withdrawing consent for categories:', categories);
        console.log('New consent state:', newConsent);
        try {
            // TODO: Fix "cyclic object value" error for JSON.stringify
            const cleanedConsent = this.cleanCyclicData(newConsent);
            localStorage.setItem('cookie-consent', JSON.stringify(cleanedConsent));
            this.consentData = newConsent;
            this.applyConsent();

            this.showSuccessMessage("Your consent has been withdrawn successfully.");
            this.logConsentEvent('consent_withdrawn', withdrawalRecord);

        } catch (error) {
            console.error('Failed to withdraw consent:', error);
            this.showErrorMessage("Failed to withdraw consent. Please try again.");
        }
    }

    /**
     * Complete consent withdrawal (reset to essential only)
     */
    withdrawAllConsent() {
        this.withdrawConsent(['analytics', 'marketing', 'functional', 'social_media']);

        // Update UI toggles
        this.updateToggleStates({
            necessary: true,
            analytics: false,
            marketing: false,
            functional: false,
            social_media: false
        });

        this.hideBanner();
    }

    /**
     * Clear all consent data
     */
    clearConsent() {
        localStorage.removeItem('cookie-consent');
        this.consentData = null;
        this.scriptsBlocked = true;
        this.blockAllTracking();
    }

    /**
     * Enhanced script blocking before consent
     */
    blockAllTracking() {
        // Block Google Tag Manager
        window['ga-disable-' + this.GTM_ID] = true;

        // Block Google Analytics
        if (typeof window.gtag !== 'undefined') {
            window.gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'personalization_storage': 'denied',
                'functionality_storage': 'denied'
            });
        }

        // Block other common tracking scripts
        window.disableGoogleAnalytics = true;
        window.ga_debug = false;
    }

    /**
     * Enhanced consent application with proper unblocking
     */
    applyConsent() {
        const consent = this.consentData;
        if (!consent) return;

        // Apply analytics consent
        if (consent.analytics) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }

        // Apply marketing consent  
        if (consent.marketing) {
            this.enableMarketing();
        } else {
            this.disableMarketing();
        }

        // Log consent application
        this.logConsentEvent('consent_applied', {
            analytics: consent.analytics,
            marketing: consent.marketing
        });
    }

    /**
     * Enable analytics with proper consent signals
     */
    enableAnalytics() {
        if (!window.gtm_loaded && this.GTM_ID) {
            this.loadGTM();
        }

        // Update Google consent mode
        if (typeof window.gtag !== 'undefined') {
            window.gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    /**
     * Disable analytics completely
     */
    disableAnalytics() {
        window['ga-disable-' + this.GTM_ID] = true;

        if (typeof window.gtag !== 'undefined') {
            window.gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
    }

    /**
     * Enable marketing cookies
     */
    enableMarketing() {
        if (typeof window.gtag !== 'undefined') {
            window.gtag('consent', 'update', {
                'ad_storage': 'granted',
                'personalization_storage': 'granted'
            });
        }
    }

    /**
     * Disable marketing cookies
     */
    disableMarketing() {
        if (typeof window.gtag !== 'undefined') {
            window.gtag('consent', 'update', {
                'ad_storage': 'denied',
                'personalization_storage': 'denied'
            });
        }
    }

    /**
     * Enhanced GTM loading with consent validation
     */
    loadGTM() {
        if (window.gtm_loaded || !this.consentData?.analytics) return;

        window.gtm_loaded = true;

        // Initialize GTM with consent mode
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${this.GTM_ID}`;

        script.onload = () => {
            this.logConsentEvent('gtm_loaded', { gtm_id: this.GTM_ID });
        };

        document.head.appendChild(script);
    }

    /**
     * Setup comprehensive accessibility features
     */
    setupAccessibilityFeatures() {
        // Keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const banner = document.getElementById('cookieBanner');
                if (banner && !banner.classList.contains('hidden')) {
                    this.rejectAllCookies();
                }
            }
        });

        // Focus management
        this.setupFocusManagement();
    }

    /**
     * Setup focus management for accessibility
     */
    setupFocusManagement() {
        // Store previously focused element
        this.previouslyFocused = null;

        // Focus trap implementation
        this.setupFocusTrap();
    }

    setupFocusTrap() {
        const banner = document.getElementById('cookieBanner');
        if (!banner) return;

        const focusableElements = banner.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        banner.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else { // Tab
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }


    /**
     * Setup withdrawal mechanisms
     */
    setupWithdrawalMechanisms() {
        // Add withdrawal link if consent exists
        if (this.consentData) {
            this.addWithdrawalLink();
        }
    }

    /**
     * Add withdrawal link to page
     */
    addWithdrawalLink() {
        const existingLink = document.querySelector('.cookie-withdrawal-link');
        if (existingLink) return;

        const withdrawalLink = document.createElement('a');
        withdrawalLink.className = 'cookie-withdrawal-link';
        withdrawalLink.href = '#';
        withdrawalLink.textContent = 'Withdraw Cookie Consent';
        withdrawalLink.setAttribute('aria-label', 'Withdraw your cookie consent');

        withdrawalLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showWithdrawalDialog();
        });

        // Position withdrawal link
        withdrawalLink.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 12px;
            z-index: 9998;
            opacity: 0.8;
            transition: opacity 0.3s;
        `;

        document.body.appendChild(withdrawalLink);
    }

    /**
     * Show withdrawal confirmation dialog
     */
    showWithdrawalDialog() {
        const dialog = this.createWithdrawalDialog();
        document.body.appendChild(dialog);
        dialog.focus();
    }

    /**
     * Create withdrawal dialog
     */
    createWithdrawalDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'cookie-withdrawal-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'withdrawal-title');
        dialog.setAttribute('aria-modal', 'true');

        dialog.innerHTML = `
            <div class="withdrawal-backdrop"></div>
            <div class="withdrawal-content">
                <h3 id="withdrawal-title">Withdraw Cookie Consent</h3>
                <p>You can withdraw your consent for cookie categories at any time.</p>
                <div class="withdrawal-options">
                    <label>
                        <input type="checkbox" checked id="withdraw-analytics"> Analytics Cookies
                    </label>
                    <label>
                        <input type="checkbox" checked id="withdraw-marketing"> Marketing Cookies
                    </label>
                </div>
                <div class="withdrawal-buttons">
                    <button onclick="this.parentNode.parentNode.parentNode.remove()" 
                            class="btn-cancel">Cancel</button>
                    <button onclick="window.cookieManager.processWithdrawal()" 
                            class="btn-withdraw">Withdraw Consent</button>
                </div>
            </div>
        `;

        return dialog;
    }

    /**
     * Process withdrawal based on user selection
     */
    processWithdrawal() {
        const categories = [];
        if (document.getElementById('withdraw-analytics')?.checked) {
            categories.push('analytics');
        }
        if (document.getElementById('withdraw-marketing')?.checked) {
            categories.push('marketing');
        }

        this.withdrawConsent(categories);

        // Remove dialog
        document.querySelector('.cookie-withdrawal-dialog')?.remove();

        // Update UI
        this.updateToggleStates(this.consentData);
    }

    /**
     * Enhanced language detection with fallbacks
     */
    getPageLanguage() {
        let lang = document.documentElement.lang || navigator.language || 'en';
        // Normalize language codes
        const langMapping = {
            'de': 'ger',
            'de-DE': 'ger',
            'de-AT': 'ger',
            'de-CH': 'ger',
            'de-LU': 'ger',
            'en': 'en',
            'en-US': 'en',
            'en-GB': 'en',
            'en-AU': 'en'
        };

        return langMapping[lang] || langMapping[lang.split('-')[0]] || 'en';
    }

    /**
     * Update toggle states in UI
     */
    updateToggleStates(consent) {
        const categories = ['analytics', 'marketing', 'functional', 'social_media'];

        categories.forEach(category => {
            const toggle = document.getElementById(`${category}-toggle`);
            if (toggle) {
                const isActive = consent[category] || false;
                this.setCookieToggleElement(toggle, isActive.toString());
            }
        });
    }

    /**
     * Show success message to user
     */
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show error message to user  
     */
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Display user feedback messages
     */
    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `cookie-message cookie-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.setAttribute('role', 'alert');

        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 4px;
            color: white;
            z-index: 10001;
            max-width: 300px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;

        document.body.appendChild(messageDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    /**
     * Log consent events for debugging and compliance
     */
    logConsentEvent(eventType, data) {
        if (console && typeof console.log === 'function') {
            console.log(`[Cookie Consent] ${eventType}:`, {
                timestamp: new Date().toISOString(),
                event: eventType,
                data: data
            });
        }
    }

    // Restore existing methods with enhancements
    restoreToggles() {
        const consent = this.consentData;
        if (!consent) return;

        this.updateToggleStates(consent);
    }

    initBanner() {
        if (!this.consentData) {
            this.showBanner();
        } else {
            this.applyConsent();
            this.hideBanner();
        }
    }

    showBanner() {
        const overlay = document.querySelector('.cookie-block-overlay');
        if (overlay) overlay.id = 'cookie-block-overlay';

        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.remove('hidden');
            // Focus management for accessibility
            const firstButton = banner.querySelector('button');
            if (firstButton) {
                setTimeout(() => firstButton.focus(), 100);
            }
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.add('hidden');
        }

        const overlay = document.querySelector('.cookie-block-overlay');
        if (overlay) overlay.id = '';
    }

    setCookieToggleElement(element, state) {
        try {
            const isActive = state === 'true';
            element.classList.toggle('active', isActive);
            element.setAttribute('aria-checked', state);
        } catch (error) {
            console.error('Error setting cookie toggle:', error);
        }
    }
}

// Enhanced global functions with error handling
function acceptAllCookies() {
    if (!window.cookieManager) return;

    const consent = {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
        social_media: true
    };

    window.cookieManager.saveConsent(consent);
    window.cookieManager.hideBanner();
    window.cookieManager.updateToggleStates(consent);
}

function rejectAllCookies() {
    if (!window.cookieManager) return;

    const consent = {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
        social_media: false
    };

    window.cookieManager.saveConsent(consent);
    window.cookieManager.hideBanner();
    window.cookieManager.updateToggleStates(consent);
}

function acceptSelectedCookies() {
    if (!window.cookieManager) return;

    const consent = {
        necessary: true,
        analytics: getCookieToggleState('analytics'),
        marketing: getCookieToggleState('marketing'),
        functional: getCookieToggleState('functional'),
        social_media: getCookieToggleState('social_media')
    };

    window.cookieManager.saveConsent(consent);
    window.cookieManager.hideBanner();
}

function getCookieToggleState(category) {
    try {
        const toggle = document.getElementById(category + '-toggle');
        return toggle ? toggle.classList.contains('active') : false;
    } catch (error) {
        console.error('Error getting toggle state:', error);
        return false;
    }
}

function toggleCookieCategory(category) {
    if (category === 'necessary') return;

    try {
        const toggle = document.getElementById(category + '-toggle');
        const isActive = toggle.classList.contains('active');
        window.cookieManager.setCookieToggleElement(toggle, (!isActive).toString());
    } catch (error) {
        console.error('Error toggling category:', error);
    }
}

function showCookieBanner() {
    if (window.cookieManager) {
        window.cookieManager.showBanner();
    }
}

function showWithdrawalDialog() {
    if (window.cookieManager) {
        window.cookieManager.showWithdrawalDialog();
    }
}

// Enhanced initialization with error handling
document.addEventListener('DOMContentLoaded', function () {
    // Load banner HTML and initialize
    fetch('cookie/cookie.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load banner HTML');
            return response.text();
        })
        .then(html => {
            const container = document.querySelector('.cookie-container');
            if (!container) {
                console.error('Cookie container not found');
                return;
            }

            container.innerHTML = html;

            // Load configuration and initialize manager
            return fetch('cookie/cookie.json');
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to load cookie configuration');
            return response.json();
        })
        .then(data => {
            // Initialize cookie manager
            window.cookieManager = new TTDSGCookieManager(data.GTM_ID);

            // Setup UI based on configuration
            setupCookieInterface(data);
        })
        .catch(error => {
            console.error('Failed to initialize cookie banner:', error);
            // Show fallback message
            document.querySelector('.cookie-container').innerHTML =
                '<div class="cookie-error">Failed to load cookie banner. Please refresh the page.</div>';
        });
});

function setupCookieInterface(data) {
    const lang = window.cookieManager.getPageLanguage();

    // Get language-specific data
    let descriptions_data = data.descriptions[lang] || data.descriptions['en'];
    let info = data.type_description.find(obj => obj.lang === lang) ||
        data.type_description.find(obj => obj.lang === 'en');

    if (!descriptions_data || !info) {
        console.error('Missing language data for:', lang);
        return;
    }

    // Setup UI elements with error handling
    try {
        setupCookieCategories(descriptions_data[0], info);
        setupButtonTexts(info);
        setupEventListeners();
    } catch (error) {
        console.error('Error setting up cookie interface:', error);
    }
}

function setupCookieCategories(descriptions, info) {
    // Setup necessary cookies
    if (descriptions.NEEDED) {
        const container = document.getElementById('necessary-details');
        const title = document.getElementById('necessary-title');
        if (container && title) {
            title.textContent = info.NEEDED;
            container.innerHTML = createCookieInfo(descriptions.NEEDED, info, 'NEEDED');
        }
    }

    // Setup analytics cookies
    if (descriptions.ANALYTICS) {
        const container = document.getElementById('analytics-details');
        const title = document.getElementById('analytics-title');
        if (container && title) {
            title.textContent = info.ANALYTICS;
            container.innerHTML = createCookieInfo(descriptions.ANALYTICS, info, 'ANALYTICS');
        }
    } else {
        const category = document.getElementById('analytics-category');
        if (category) category.hidden = true;
    }

    // Setup marketing cookies
    if (descriptions.MARKETING) {
        const container = document.getElementById('marketing-details');
        const title = document.getElementById('marketing-title');
        if (container && title) {
            title.textContent = info.MARKETING;
            container.innerHTML = createCookieInfo(descriptions.MARKETING, info, 'MARKETING');
        }
    } else {
        const category = document.getElementById('marketing-category');
        if (category) category.hidden = true;
    }
}

function createCookieInfo(cookieData, typeDescription, category) {
    const descKey = category + '_DESC';
    const html = [`<h4>${typeDescription[descKey] || 'Cookie Information'}:</h4>`];

    cookieData.forEach(element => {
        html.push(`
            <div class="cookie-info">
                <p><strong>${typeDescription.provider || 'Provider'}:</strong> ${element.provider || 'Not specified'}</p>
                <p><strong>${typeDescription.purpose || 'Purpose'}:</strong> ${element.purpose || element.example || 'Not specified'}</p>
                <p><strong>${typeDescription.legal_basis || 'Legal Basis'}:</strong> ${element.legal_basis || 'Not specified'}</p>
                <p><strong>${typeDescription.duration || 'Duration'}:</strong> ${element.duration || 'Not specified'}</p>
                ${element.data_transferred ? `<p><strong>${typeDescription.data_transferred || 'Data Transfer'}:</strong> ${element.data_transferred}</p>` : ''}
                ${element.withdrawal ? `<p><strong>${typeDescription.withdrawal || 'Withdrawal'}:</strong> ${element.withdrawal}</p>` : ''}
            </div>
        `);
    });

    return html.join('');
}

function setupButtonTexts(info) {
    const elements = [
        { selector: '.btn-accept-all', text: info.accept_all, aria: info.accept_all_aria || info.accept_all },
        { selector: '.btn-reject-all', text: info.decline_all, aria: info.decline_all_aria || info.decline_all },
        { selector: '.btn-accept-selected', text: info.save_selected, aria: info.save_selected_aria || info.save_selected },
        { selector: '.btn-detail-settings', text: info.details, aria: info.details_aria || info.details },
        { selector: '.cookie-settings-link', text: info.settings, aria: info.settings_aria || info.settings },
        { selector: '#cookie-title', text: info.title, aria: null },
        { selector: '#cookie-desc', text: info.title_description, aria: null }
    ];

    elements.forEach(({ selector, text, aria }) => {
        const element = document.querySelector(selector);
        if (element && text) {
            if (element.tagName === 'INPUT') {
                element.value = text;
            } else {
                element.textContent = text;
            }
            if (aria) {
                element.setAttribute('aria-label', aria);
            }
        }
    });
}

function setupEventListeners() {
    // Category header listeners
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

    // Toggle listeners
    ['analytics', 'marketing', 'functional', 'social_media'].forEach(category => {
        const toggle = document.getElementById(`${category}-toggle`);
        if (toggle) {
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleCookieCategory(category);
            });
        }
    });
}

function toggleCategory(category) {
    const details = document.querySelectorAll('.category-details');
    const selected = document.getElementById(category + '-details');

    if (!selected) return;

    const isExpanded = selected.classList.contains('expanded');

    if (!isExpanded) {
        // Close all other categories
        details.forEach(el => {
            if (el !== selected) {
                el.classList.remove('expanded');
            }
        });
        selected.classList.add('expanded');
    } else {
        selected.classList.remove('expanded');
    }
}

function showDetailSettings() {
    document.querySelectorAll('.category-details').forEach(el => {
        el.classList.add('expanded');
    });
}
