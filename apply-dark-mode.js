const fs = require('fs');
const path = require('path');

// Map of file -> array of [find, replace] pairs
const changes = {
  'frontend/src/app/views/product-detail-page/product-detail-page.css': [
    ['background: #fafafa', 'background: var(--bg-page)'],
    ['background-color: #ffffff', 'background-color: var(--bg-card)'],
    [/color: #333(?![\d])/g, 'color: var(--text-primary)'],
    ['background-color: #f0f0f0;\n}\n\n.brand-text', 'background-color: var(--row-hover);\n}\n\n.brand-text'],
    ['.back-btn:hover {\n  background-color: #f0f0f0', '.back-btn:hover {\n  background-color: var(--row-hover)'],
    ['color: #888;\n  font-size: 1.1rem', 'color: var(--text-secondary);\n  font-size: 1.1rem'],
    [/\.loading-state mat-icon,\n\.error-state mat-icon \{[\s\S]*?color: #ccc/,
      (m) => m.replace('color: #ccc', 'color: var(--border-color)')],
    ['background: #fff;\n  box-shadow: 0 1px 6px', 'background: var(--bg-card);\n  box-shadow: 0 1px 6px'],
    ['background: #f5f5f5;\n  display: block', 'background: var(--bg-page);\n  display: block'],
    ['background: #f0f0f0;\n  border-radius: 12px', 'background: var(--bg-input);\n  border-radius: 12px'],
    ['.image-placeholder {\n  width: 100%;\n  height: 360px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background: #f0f0f0', '.image-placeholder {\n  width: 100%;\n  height: 360px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  background: var(--bg-input)'],
    ['.image-placeholder mat-icon {\n  font-size: 64px;\n  width: 64px;\n  height: 64px;\n}', '.image-placeholder mat-icon {\n  font-size: 64px;\n  width: 64px;\n  height: 64px;\n}\n'],
    ['color: #1a1a2e;\n  margin: 0;\n}\n\n.product-price', 'color: var(--text-primary);\n  margin: 0;\n}\n\n.product-price'],
    ['color: #555;\n  margin-top: 8px', 'color: var(--text-icon);\n  margin-top: 8px'],
    ['.seller-info mat-icon {\n  font-size: 20px;\n  width: 20px;\n  height: 20px;\n  color: #888', '.seller-info mat-icon {\n  font-size: 20px;\n  width: 20px;\n  height: 20px;\n  color: var(--text-secondary)'],
    ['background: #e8e8e8', 'background: var(--border-color)'],
    ['color: #1a1a2e;\n  margin: 0;\n}\n\n.product-description', 'color: var(--text-primary);\n  margin: 0;\n}\n\n.product-description'],
    ['color: #555;\n  line-height: 1.65', 'color: var(--text-icon);\n  line-height: 1.65'],
    ['background-color: #f0f0f0;\n  color: #333', 'background-color: var(--bg-input);\n  color: var(--text-primary)'],
    ['background-color: #e4e4e4', 'background-color: var(--row-hover)'],
  ],

  'frontend/src/app/views/my-listings-page/my-listings-page.css': [
    ['background-color: #f5f5f5;\n}\n\n/* ── Header', 'background-color: var(--bg-page);\n}\n\n/* ── Header'],
    ['background-color: #ffffff;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);\n}\n\n.back-btn', 'background-color: var(--bg-card);\n  box-shadow: 0 2px 8px var(--shadow-header);\n}\n\n.back-btn'],
    ['color: #555;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n\n.back-btn:hover {\n  background-color: rgba(0, 0, 0, 0.06)', 'color: var(--text-icon);\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n\n.back-btn:hover {\n  background-color: var(--row-hover)'],
    ['color: #1a1a2e;\n  margin: 0;\n}\n\n/* ── Content', 'color: var(--text-primary);\n  margin: 0;\n}\n\n/* ── Content'],
    ['.empty-state {\n  text-align: center;\n  padding: 80px 20px;\n  color: #888', '.empty-state {\n  text-align: center;\n  padding: 80px 20px;\n  color: var(--text-secondary)'],
    ['.empty-icon {\n  font-size: 64px;\n  width: 64px;\n  height: 64px;\n  color: #ccc', '.empty-icon {\n  font-size: 64px;\n  width: 64px;\n  height: 64px;\n  color: var(--border-color)'],
    ['background: #fff;\n  border-radius: 12px;\n  overflow: hidden', 'background: var(--bg-card);\n  border-radius: 12px;\n  overflow: hidden'],
    ['.listing-image-placeholder {\n  width: 100%;\n  height: 200px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #f0f0f0;\n  color: #ccc', '.listing-image-placeholder {\n  width: 100%;\n  height: 200px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: var(--bg-input);\n  color: var(--border-color)'],
    ['color: #1a1a2e;\n  margin: 0;\n}\n\n.listing-description', 'color: var(--text-primary);\n  margin: 0;\n}\n\n.listing-description'],
    ['color: #555;\n  margin: 0;\n  line-height: 1.4', 'color: var(--text-icon);\n  margin: 0;\n  line-height: 1.4'],
    ['border: 1px solid #ddd;\n  border-radius: 8px;\n  background: #fff', 'border: 1px solid var(--border-color);\n  border-radius: 8px;\n  background: var(--bg-card)'],
    ['.add-image-btn {\n  flex-shrink: 0;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  width: 80px;\n  height: 80px;\n  border: 2px dashed #ccc;\n  border-radius: 8px;\n  background: transparent;\n  color: #888', '.add-image-btn {\n  flex-shrink: 0;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  width: 80px;\n  height: 80px;\n  border: 2px dashed var(--border-color);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--text-secondary)'],
  ],

  'frontend/src/app/views/order-history-page/order-history-page.css': [
    ['background-color: #f5f5f5;\n}\n\n/* ── Header', 'background-color: var(--bg-page);\n}\n\n/* ── Header'],
    ['background-color: #ffffff;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);\n}\n\n.header-left', 'background-color: var(--bg-card);\n  box-shadow: 0 2px 8px var(--shadow-header);\n}\n\n.header-left'],
    ['color: #555;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n\n.back-btn:hover {\n  background-color: rgba(0, 0, 0, 0.06)', 'color: var(--text-icon);\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n\n.back-btn:hover {\n  background-color: var(--row-hover)'],
    ['.brand-text {\n  font-weight: 700;\n  font-size: 1.05rem;\n  color: #1a1a2e', '.brand-text {\n  font-weight: 700;\n  font-size: 1.05rem;\n  color: var(--text-primary)'],
    ['.page-title {\n  font-size: 1.85rem;\n  font-weight: 800;\n  color: #1a1a2e', '.page-title {\n  font-size: 1.85rem;\n  font-weight: 800;\n  color: var(--text-primary)'],
    ['color: #666;\n  margin: 0;\n  font-size: 0.95rem', 'color: var(--text-secondary);\n  margin: 0;\n  font-size: 0.95rem'],
    ['.loading-state,\n.empty-state {\n  text-align: center;\n  padding: 80px 20px;\n  color: #888', '.loading-state,\n.empty-state {\n  text-align: center;\n  padding: 80px 20px;\n  color: var(--text-secondary)'],
    ['.loading-state mat-icon,\n.empty-state .empty-icon {\n  font-size: 64px;\n  width: 64px;\n  height: 64px;\n  color: #ccc', '.loading-state mat-icon,\n.empty-state .empty-icon {\n  font-size: 64px;\n  width: 64px;\n  height: 64px;\n  color: var(--border-color)'],
    ['.empty-state h2 {\n  margin: 16px 0 6px;\n  color: #333', '.empty-state h2 {\n  margin: 16px 0 6px;\n  color: var(--text-primary)'],
    ['background: #fff;\n  border-radius: 14px;\n  overflow: hidden', 'background: var(--bg-card);\n  border-radius: 14px;\n  overflow: hidden'],
    ['border: 1px solid #ececec;\n  transition:', 'border: 1px solid var(--border-color);\n  transition:'],
    ['background: #f9fafb;\n  border-bottom: 1px solid #ececec', 'background: var(--bg-input);\n  border-bottom: 1px solid var(--border-color)'],
    ['.order-label {\n  font-size: 0.7rem;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: #888', '.order-label {\n  font-size: 0.7rem;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: var(--text-secondary)'],
    ['.order-date {\n  font-size: 0.9rem;\n  font-weight: 700;\n  color: #1a1a2e', '.order-date {\n  font-size: 0.9rem;\n  font-weight: 700;\n  color: var(--text-primary)'],
    ['.order-time {\n  font-size: 0.8rem;\n  color: #666', '.order-time {\n  font-size: 0.8rem;\n  color: var(--text-secondary)'],
    ['.order-id {\n  font-size: 0.85rem;\n  font-weight: 600;\n  color: #333', '.order-id {\n  font-size: 0.85rem;\n  font-weight: 600;\n  color: var(--text-primary)'],
    ['.order-image,\n.order-image-placeholder {\n  width: 140px;\n  height: 140px;\n  border-radius: 10px;\n  object-fit: cover;\n  background: #f0f0f0', '.order-image,\n.order-image-placeholder {\n  width: 140px;\n  height: 140px;\n  border-radius: 10px;\n  object-fit: cover;\n  background: var(--bg-input)'],
    ['.order-image-placeholder {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: #bbb', '.order-image-placeholder {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: var(--text-secondary)'],
    ['.order-title {\n  margin: 0;\n  font-size: 1.15rem;\n  font-weight: 700;\n  color: #1a1a2e', '.order-title {\n  margin: 0;\n  font-size: 1.15rem;\n  font-weight: 700;\n  color: var(--text-primary)'],
    ['color: #555;\n  line-height: 1.45', 'color: var(--text-icon);\n  line-height: 1.45'],
    ['.order-seller {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  color: #666', '.order-seller {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  color: var(--text-secondary)'],
    ['.secondary-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 9px 14px;\n  background: #fff;\n  color: #0021a5;\n  border: 1px solid #d1d5db', '.secondary-btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 9px 14px;\n  background: var(--bg-card);\n  color: var(--brand-accent);\n  border: 1px solid var(--border-color)'],
    ['.secondary-btn:disabled {\n  color: #aaa', '.secondary-btn:disabled {\n  color: var(--text-secondary)'],
    ['background: #eef2ff;\n  border-color: #0021a5', 'background: var(--row-hover);\n  border-color: var(--brand-accent)'],
  ],

  'frontend/src/app/views/create-listing-page/create-listing-page.css': [
    ['background-color: #f5f5f5;\n}\n\n/* ── Header', 'background-color: var(--bg-page);\n}\n\n/* ── Header'],
    ['background-color: #ffffff;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);\n}\n\n.back-btn', 'background-color: var(--bg-card);\n  box-shadow: 0 2px 8px var(--shadow-header);\n}\n\n.back-btn'],
    ['color: #555;\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n\n.back-btn:hover {\n  background-color: rgba(0, 0, 0, 0.06)', 'color: var(--text-icon);\n  cursor: pointer;\n  transition: background-color 0.2s;\n}\n\n.back-btn:hover {\n  background-color: var(--row-hover)'],
    ['color: #1a1a2e;\n  margin: 0;\n}\n\n/* ── Content', 'color: var(--text-primary);\n  margin: 0;\n}\n\n/* ── Content'],
    ['background: #fff;\n  border-radius: 12px;\n  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06)', 'background: var(--bg-card);\n  border-radius: 12px;\n  box-shadow: 0 1px 4px var(--shadow-card)'],
    ['.section-title {\n  font-size: 0.8rem;\n  font-weight: 700;\n  color: #888', '.section-title {\n  font-size: 0.8rem;\n  font-weight: 700;\n  color: var(--text-secondary)'],
    ['background: #ccc;\n  border-radius: 3px', 'background: var(--border-color);\n  border-radius: 3px'],
    ['.add-image-btn {\n  flex-shrink: 0;\n  width: 120px;\n  height: 120px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  border: 2px dashed #ccc;\n  border-radius: 10px;\n  background: transparent;\n  color: #888', '.add-image-btn {\n  flex-shrink: 0;\n  width: 120px;\n  height: 120px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  border: 2px dashed var(--border-color);\n  border-radius: 10px;\n  background: transparent;\n  color: var(--text-secondary)'],
  ],
};

let totalChanges = 0;

for (const [filePath, replacements] of Object.entries(changes)) {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  File not found, skipping: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let fileChanges = 0;

  for (const [find, replace] of replacements) {
    const before = content;
    if (find instanceof RegExp) {
      content = content.replace(find, replace);
    } else {
      content = content.split(find).join(replace);
    }
    if (content !== before) fileChanges++;
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ ${filePath} — ${fileChanges} replacement(s) applied`);
  totalChanges += fileChanges;
}

console.log(`\n🎉 Done! ${totalChanges} total replacements across ${Object.keys(changes).length} files.`);
