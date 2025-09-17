# Cookie Banner Integration & Configuration

**A highly customizable, privacy-compliant cookie consent banner.**

This library provides a ready-to-use solution for TTDSG/DSGVO-compliant cookie management, including:
- Dynamic consent banner with site-blocking until user choice.
- Multilingual support (English, German, and easily extendable).
- Configuration via a single `cookie.json` file for all banner text, categories, and details.
- Google Tag Manager (GTM) integration for analytics out-of-the-box (just set your GTM ID in `cookie.json`).
- Easy styling and layout customization via CSS.
- Simple integration: just add the CSS, JS, and a container to your page.


## Usage Overview

The cookie banner system provides:
- A customizable consent banner for cookies and tracking.
- Site interaction blocking until user consent is given.
- Easy configuration via `cookie.json`.
- Multilingual support through `cookie.json` (e.g., English and German).
- Support for Essential, Analytics and Marketing cookies.

## Integration Steps

1. **Add cookie folder to base project route**

    Example folder structure:
    ```
    project-root/
    ├── index.html
    ├── style.css
    ├── app.js
    ├── cookie/
    │   ├── cookie.js
    │   ├── cookie.css
    │   ├── cookie.html
    │   └── cookie.json
    ```

3. **Include Styles and Script in `<head>`**

	 Add the following to your page's `<head>`:
	 ```html
	 <link rel="stylesheet" href="cookie/cookie.css">
	 <script src="cookie/cookie.js"></script>
	 ```

4. **Add Cookie Banner Container as First Element in `<body>`**

	 Place this at the very top of your `<body>`:
	 ```html
	 <div class="cookie-container"></div>
	 ```
	 This is where the banner HTML will be injected.

5. **Site Block Overlay**

	 Wrap all content that should be blocked while the banner is up in this div:
	 ```html
	 <div id="cookie-block-overlay">
        <!-- YOUR PAGE CODE HERE -->
     </div>
	 ```
     The CSS will block pointer events for everything except the banner and overlay.

6. **GTM ID**

	Replace `GTM-XXXXXXXX` in `cookie/cookie.json` with your actual Google Tag Manager ID

## Configuration via `cookie.json` 

The `cookie/cookie.json` file controls:
- Language strings and descriptions for each category.
- Which cookie categories are shown (NEEDED, ANALYTICS, MARKETING, etc.).
- Button labels, ARIA attributes, and banner text.

**Example structure:**
```json
{
	"GTM_ID": "GTM-XXXXXXX",
	"type_description": [
		{ "lang": "en", ...},
		{ "lang": "ger", ...}
	],
	"descriptions": {
		"en": [ { "NEEDED": [...], "ANALYTICS": [...], "MARKETING": [...] } ],
		"ger": [ { "NEEDED": [...], "ANALYTICS": [...], "MARKETING": [...] } ]
	}
}
```

You can add or remove categories, update text, and provide cookie details for each language.

## Multilingual Support

The banner automatically selects the language based on the `<html lang="...">` attribute. Make sure your page sets the correct language.

## Accessibility & Compliance

- All buttons and toggles have ARIA labels for accessibility.
- Banner blocks site interaction until consent is given, as required by TTDSG/DSGVO.
- Consent is stored in `localStorage`.

## Example Minimal Page Structure

```html
<html lang="en">
<head>
	<link rel="stylesheet" href="cookie/cookie.css">
	<script src="cookie/cookie.js"></script>
	...
</head>
<body>
	<div class="cookie-container"></div>
	<div id="cookie-block-overlay"></div>
	<div class="main-content">
		...
	</div>
</body>
</html>
```

## Customization

- Edit `cookie/cookie.css` for banner appearance.
- Edit `cookie/cookie.json` for categories, text, and details.
- The script automatically handles consent logic, blocking, and analytics loading.

## Troubleshooting

- If the banner does not appear, check that `.cookie-container` exists and is not hidden.
- If site interaction is not blocked, ensure the overlay and CSS are present.
- For language issues, verify the `<html lang>` attribute and `cookie.json` language objects.
