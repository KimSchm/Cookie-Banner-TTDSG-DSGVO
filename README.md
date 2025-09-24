<div align="center">

# Cookie Banner (TTDSG/DSGVO compliant)

Lightweight, accessible, and privacy-first cookie consent banner. Blocks non-essential tracking by default, offers granular controls, and integrates with Google Tag Manager (GTM) while respecting user consent.

[Demo Site](https://cookie.kschm.tech/)

[![License](https://img.shields.io/github/license/KimSchm/Cookie.svg)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/KimSchm/Cookie.svg)](https://github.com/KimSchm/Cookie/commits/main)
[![Issues](https://img.shields.io/github/issues/KimSchm/Cookie.svg)](https://github.com/KimSchm/Cookie/issues)


</div>

## ✨ Features

- TTDSG/GDPR-compliant consent flow with audit-friendly storage
- Site blocking until a choice is made
- Accessible: WCAG 2.2 AA, keyboard navigation, focus trap, ARIA
- Multilingual via `cookie/cookie.json` (English, German, easy to extend)
- Granular categories: Necessary, Functional, Analytics, Marketing, Social Media
- GTM integration with consent signals (set your GTM ID and you’re done)
- Dark/light mode and CSS variables for easy theming
- Zero build, no dependencies; works on any static or dynamic site

## 🔧 Quick start

1) Copy the `cookie` folder into your web root.

2) Include the CSS and JS in your page head:

```html
<link rel="stylesheet" href="cookie/cookie.css">
<script src="cookie/cookie.js" defer></script>
```

3) Add the container as the first element inside `<body>`:

```html
<div class="cookie-container"></div>
```

4) (Optional but recommended) Wrap your page content with the block overlay so interaction is prevented until a choice is made:

```html
<div class="cookie-block-overlay">
	<!-- Your page content -->
</div>
```

5) Set your GTM ID in `cookie/cookie.json`:

```json
{ "GTM_ID": "GTM-XXXXXXX" }
```

## 📁 Project structure

```
cookie/
	cookie.css
	cookie.html
	cookie.js
	cookie.json
examples/
	minimal.html
LICENSE
README.md
```

## ⚙️ Configuration (`cookie/cookie.json`)

Key fields you’ll likely configure:

- GTM_ID: Your Google Tag Manager container ID, e.g., GTM-XXXXXXX
- consent_version: Version string for your consent texts/policy (e.g., "1.0")
- privacy_policy_url: Relative or absolute URL to your privacy policy page (used for the "Privacy policy" link in the banner). Example: `/privacy-policy` or `https://example.com/privacy-policy`.
- contact_dpo: Contact email address for your Data Protection Officer or privacy contact. This is shown in detailed info and the rights/contact section. Example: `privacy@yourcompany.com`.
- type_description: Per-language labels and UI text (buttons, headings, ARIA)
- descriptions: Per-language arrays of cookie/service descriptions per category
- legal_requirements: Toggles for compliance features (e.g., withdrawal enabled)
- technical_settings: Behavior flags (expiry, visible categories, explicit consent)

Minimal example (English only):

```json
{
	"GTM_ID": "GTM-XXXXXXX",
	"consent_version": "1.0",
	"type_description": [
		{
			"lang": "en",
			"settings": "Cookie Settings",
			"accept_all": "Accept All",
			"decline_all": "Decline All",
			"save_selected": "Save Selection",
			"details": "Show Details"
		}
	],
	"descriptions": { "en": [] },
	"technical_settings": { "require_explicit_consent": true }
}
```

See the full reference in `cookie/cookie.json` for all available keys.

## 🧩 Usage

The script auto-initializes on DOMContentLoaded, injects the banner from `cookie.html`, and manages consent.

Public helpers available globally:

- acceptAllCookies(): Accepts all non-essential categories
- rejectAllCookies(): Accepts only necessary cookies
- acceptSelectedCookies(): Applies the current toggle states
- showCookieBanner(): Re-opens the banner for changes
- showWithdrawalDialog(): Opens the withdrawal options dialog

Notes:
- Consent is stored in localStorage with a unique consent ID and timestamp.

## ♿ Accessibility & Compliance

- WCAG 2.2 AA: focus management, keyboard navigation, visible focus states
- ARIA roles/labels for dialog, buttons, and toggles
- Dark/light themes via prefers-color-scheme and `data-color-scheme`
- Blocks all tracking until explicit consent (TTDSG/DSGVO compliant design)
- Easy withdrawal: persistent "Cookie Settings" link + withdrawal dialog

Important: This library assists with compliance but doesn’t replace legal advice. Validate texts/policies for your jurisdiction.

## 📈 GTM integration

1) Set `GTM_ID` in `cookie/cookie.json`.
2) On consent, GTM is loaded and receives consent signals according to user choices.
3) On withdrawal or rejection, analytics/marketing are disabled and scripts are blocked.

No extra GTM code snippet is required on your page—this library injects GTM only after valid consent.

## 🎨 Theming

- Customize colors and sizes via CSS variables in `cookie.css`.
- Use `.btn--primary`, `.btn--secondary`, `.cookie-btn` variants for quick tweaks.
- Dark mode is automatic; force a theme with `data-color-scheme="light|dark"` on `<html>`.

## 🧪 Example

Open `examples/minimal.html` to see a self-contained integration using the files from `cookie/`.

## ❓ FAQ

- The banner doesn’t show?
	- Ensure a `<div class="cookie-container"></div>` exists in the body and `cookie.js` is loaded.
- Page isn’t blocked?
	- Add the `#cookie-block-overlay` wrapper or verify the CSS is applied.
- Texts in the wrong language?
	- Set `<html lang="en">` or `"ger"` (German) and ensure matching entries in `cookie.json`.
- How do I change button labels?
	- Edit `type_description` for your language in `cookie/cookie.json`.

## 🤝 Contributing

Contributions are welcome!

## 📜 License

Licensed under the terms of the `LICENSE` file in this repository.

## Known Bugs

- Withdraw cookie consent button does not scale. It should like the cookie setting button

---

Made with privacy in mind. If you build something with this, consider sharing it back via a PR!
