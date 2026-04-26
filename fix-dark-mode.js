const fs = require('fs');
const path = require('path');

// ── Fix 1: listing.css ──────────────────────────────────────────────────────

const listingCssPath = path.resolve(
  'frontend/src/app/components/listing/listing.css'
);

const updatedListingCss = `/* ── listing card ── */
.listing-card {
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 6px var(--shadow-card);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
  cursor: pointer;
}

.listing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px var(--shadow-card);
}

.listing-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.listing-image-placeholder {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  color: var(--border-color);
}

.listing-image-placeholder mat-icon {
  font-size: 48px;
  width: 48px;
  height: 48px;
}

.listing-info {
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.listing-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.listing-description {
  font-size: 0.85rem;
  color: var(--text-icon);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.listing-price {
  font-size: 1.15rem;
  font-weight: 800;
  color: #fa4616;
  margin-top: 4px;
}

.listing-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 6px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.listing-seller,
.listing-time {
  display: flex;
  align-items: center;
  gap: 3px;
}

.meta-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}
`;

if (fs.existsSync(listingCssPath)) {
  fs.writeFileSync(listingCssPath, updatedListingCss, 'utf8');
  console.log('✅ listing.css — dark mode colors applied');
} else {
  console.warn('⚠️  listing.css not found, skipping');
}

// ── Fix 2: styles.css — Angular Material dark mode overrides ────────────────

const stylesCssPath = path.resolve('frontend/src/styles.css');

const materialDarkOverrides = `
/* ── Angular Material dark mode overrides ── */
body.theme-dark {
  color-scheme: dark;
}

/* Input text color */
body.theme-dark .mat-mdc-input-element,
body.theme-dark .mat-mdc-floating-label,
body.theme-dark .mdc-text-field__input {
  color: var(--text-primary) !important;
}

/* Outlined form field border */
body.theme-dark .mdc-notched-outline__leading,
body.theme-dark .mdc-notched-outline__notch,
body.theme-dark .mdc-notched-outline__trailing {
  border-color: var(--border-color) !important;
}

/* Form field background */
body.theme-dark .mdc-text-field--outlined:not(.mdc-text-field--disabled) {
  background-color: var(--bg-input) !important;
}

/* Floating label color */
body.theme-dark .mat-mdc-form-field-label,
body.theme-dark .mdc-floating-label {
  color: var(--text-secondary) !important;
}

/* Hint and error text */
body.theme-dark .mat-mdc-form-field-hint,
body.theme-dark .mat-mdc-form-field-error {
  color: var(--text-secondary) !important;
}

/* Select panel */
body.theme-dark .mat-mdc-select-value-text,
body.theme-dark .mat-mdc-select-arrow {
  color: var(--text-primary) !important;
}

/* mat-icon default color */
body.theme-dark mat-icon {
  color: var(--text-icon);
}

/* mat-button default text */
body.theme-dark .mat-mdc-button:not([color]),
body.theme-dark .mat-mdc-outlined-button:not([color]) {
  color: var(--text-primary) !important;
}
`;

if (fs.existsSync(stylesCssPath)) {
  let stylesContent = fs.readFileSync(stylesCssPath, 'utf8');

  if (stylesContent.includes('Angular Material dark mode overrides')) {
    console.log('ℹ️  styles.css — Material overrides already present, skipping');
  } else {
    stylesContent += materialDarkOverrides;
    fs.writeFileSync(stylesCssPath, stylesContent, 'utf8');
    console.log('✅ styles.css — Angular Material dark mode overrides added');
  }
} else {
  console.warn('⚠️  styles.css not found, skipping');
}

console.log('\n🎉 Both fixes applied! Restart your dev server if it\'s running.');
