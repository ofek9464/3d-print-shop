/* ============================================
   ADMIN PANEL CONTROLLER
   ============================================ */

// ---------- Simple Auth (Development Only) ----------
// In production, replace with server-side auth (JWT + bcrypt)
const DEFAULT_CREDENTIALS = {
    username: 'admin',
    // SHA-256 hash of 'admin123' — NOT secure for production!
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
};

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------- MODEL TYPES for new products ----------
const MODEL_TYPES = [
    'torusKnot', 'robot', 'castle', 'stand', 'organizer', 'toolHolder',
    'vase', 'hexShelf', 'lampShade', 'controllerStand', 'diceTower',
    'terrain', 'gear', 'bearing', 'bracket', 'wave', 'geodesic', 'spiral'
];

class AdminPanel {
    constructor() {
        this.isAuthenticated = false;
        this.editingProductId = null;
    }

    init() {
        this.adminUploadedFiles = []; // [{ dataUrl, name, type, kind: 'image'|'3d' }]
        this.loadCustomProducts();
        this.checkSession();
        this.setupLoginForm();
        this.setupLogout();
        this.setupTabs();
        this.initAdminTheme();
    }

    // ---------- Theme Toggle ----------
    initAdminTheme() {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved || (prefersDark ? 'dark' : 'light');
        if (theme === 'light') document.documentElement.dataset.theme = 'light';

        const btn = document.getElementById('admin-theme-toggle');
        if (btn) {
            btn.textContent = theme === 'light' ? '☀️' : '🌙';
            btn.addEventListener('click', () => {
                const isLight = document.documentElement.dataset.theme === 'light';
                const next = isLight ? 'dark' : 'light';
                document.documentElement.dataset.theme = next === 'dark' ? '' : 'light';
                localStorage.setItem('theme', next);
                btn.textContent = next === 'light' ? '☀️' : '🌙';
            });
        }
    }

    // ---------- Custom Products Persistence ----------
    loadCustomProducts() {
        const saved = localStorage.getItem('admin_custom_products');
        if (saved) {
            try {
                const custom = JSON.parse(saved);
                // Add custom products that aren't already in PRODUCTS
                custom.forEach(cp => {
                    if (!PRODUCTS.find(p => p.id === cp.id)) {
                        PRODUCTS.push(cp);
                    }
                });
            } catch (e) { }
        }

        // Load category overrides
        const catOverrides = localStorage.getItem('admin_category_overrides');
        if (catOverrides) {
            try {
                const overrides = JSON.parse(catOverrides);
                Object.entries(overrides).forEach(([id, cat]) => {
                    const product = PRODUCTS.find(p => p.id === parseInt(id));
                    if (product) product.category = cat;
                });
            } catch (e) { }
        }

        // Load price overrides
        const priceOverrides = localStorage.getItem('admin_product_prices');
        if (priceOverrides) {
            try {
                const prices = JSON.parse(priceOverrides);
                Object.entries(prices).forEach(([id, price]) => {
                    const product = PRODUCTS.find(p => p.id === parseInt(id));
                    if (product) product.basePrice = price;
                });
            } catch (e) { }
        }
    }

    saveCustomProducts() {
        // Save only products with id > 100 (custom added)
        const custom = PRODUCTS.filter(p => p.id > 100);
        localStorage.setItem('admin_custom_products', JSON.stringify(custom));
    }

    saveCategoryOverrides() {
        const overrides = {};
        PRODUCTS.forEach(p => {
            overrides[p.id] = p.category;
        });
        localStorage.setItem('admin_category_overrides', JSON.stringify(overrides));
    }

    // ---------- Auth ----------
    checkSession() {
        const session = sessionStorage.getItem('admin_session');
        if (session) {
            try {
                const data = JSON.parse(session);
                if (data.expires > Date.now()) {
                    this.isAuthenticated = true;
                    this.showDashboard();
                    return;
                }
            } catch (e) { }
        }
        this.showLogin();
    }

    showLogin() {
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-dashboard').classList.remove('active');
    }

    showDashboard() {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').classList.add('active');
        this.loadProductsTable();
        this.loadMaterialsTable();
        this.loadCatalogTab();
        this.updateStats();
    }

    setupLoginForm() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value.trim();
            const password = document.getElementById('admin-password').value;
            const hash = await hashPassword(password);

            const stored = localStorage.getItem('admin_credentials');
            let creds = DEFAULT_CREDENTIALS;
            if (stored) {
                try { creds = JSON.parse(stored); } catch (e) { }
            }

            if (username === creds.username && hash === creds.passwordHash) {
                this.isAuthenticated = true;
                sessionStorage.setItem('admin_session', JSON.stringify({
                    user: username,
                    expires: Date.now() + 60 * 60 * 1000
                }));
                document.getElementById('login-error').classList.remove('visible');
                this.showDashboard();
                showAdminToast('✅', 'Welcome back, Admin!');
            } else {
                document.getElementById('login-error').classList.add('visible');
                document.getElementById('login-btn').disabled = true;
                setTimeout(() => {
                    document.getElementById('login-btn').disabled = false;
                }, 2000);
            }
        });
    }

    setupLogout() {
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.isAuthenticated = false;
            sessionStorage.removeItem('admin_session');
            this.showLogin();
            showAdminToast('👋', 'Logged out successfully.');
        });
    }

    // ---------- Tabs ----------
    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
                document.getElementById(`section-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Button handlers
        document.getElementById('save-products-btn')?.addEventListener('click', () => this.saveProducts());
        document.getElementById('reset-products-btn')?.addEventListener('click', () => this.resetProducts());
        document.getElementById('save-materials-btn')?.addEventListener('click', () => this.saveMaterials());
        document.getElementById('reset-materials-btn')?.addEventListener('click', () => this.resetMaterials());
        document.getElementById('change-password-btn')?.addEventListener('click', () => this.changePassword());
        document.getElementById('add-product-btn')?.addEventListener('click', () => this.showAddProductForm());
        document.getElementById('add-product-cancel')?.addEventListener('click', () => this.hideAddProductForm());
        document.getElementById('add-product-save')?.addEventListener('click', () => this.saveNewProduct());
        document.getElementById('save-catalog-btn')?.addEventListener('click', () => this.saveCatalog());
        document.getElementById('add-color-btn')?.addEventListener('click', () => {
            document.getElementById('add-color-form').style.display = 'block';
        });
        document.getElementById('cancel-add-color')?.addEventListener('click', () => {
            document.getElementById('add-color-form').style.display = 'none';
        });
        document.getElementById('confirm-add-color')?.addEventListener('click', () => this.addNewColor());
        this.setupAdminFileUpload();
    }

    // ---------- Colors & Materials Catalog ----------
    loadCatalogTab() {
        this.renderMaterialsCatalog();
        this.renderColorsCatalog();
    }

    renderMaterialsCatalog() {
        const container = document.getElementById('materials-catalog-list');
        if (!container) return;

        container.innerHTML = Object.values(MATERIALS).map(mat => {
            const enabled = mat.enabled !== false;
            return `
            <div class="catalog-row" data-mat-id="${mat.id}" style="display:grid;grid-template-columns:auto 56px 1fr 1fr auto;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:var(--radius-md);margin-bottom:8px;border:1px solid var(--border-subtle);opacity:${enabled ? 1 : 0.5};transition:opacity 0.2s;">
                <span style="font-size:1.4rem;">${mat.icon}</span>
                <label class="toggle-switch" title="${enabled ? 'Disable' : 'Enable'}" style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                    <input type="checkbox" class="mat-toggle" data-mat-id="${mat.id}" ${enabled ? 'checked' : ''} style="display:none;">
                    <div class="toggle-track" style="width:40px;height:22px;border-radius:11px;background:${enabled ? 'var(--accent-primary)' : 'var(--border-light)'};position:relative;transition:background 0.2s;flex-shrink:0;">
                        <div style="position:absolute;top:3px;left:${enabled ? '21px' : '3px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;"></div>
                    </div>
                </label>
                <input type="text" class="mat-name-input" data-mat-id="${mat.id}" value="${mat.name}" placeholder="Material name"
                    style="padding:7px 10px;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);color:var(--text-primary);font-size:0.85rem;">
                <input type="text" class="mat-desc-input" data-mat-id="${mat.id}" value="${mat.description}" placeholder="Description"
                    style="padding:7px 10px;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);color:var(--text-primary);font-size:0.85rem;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:0.75rem;color:var(--text-muted);">×</span>
                    <input type="number" class="mat-mult-input" data-mat-id="${mat.id}" value="${mat.multiplier.toFixed(2)}" min="0.1" step="0.05"
                        style="width:72px;padding:7px 8px;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);color:var(--text-primary);font-size:0.85rem;">
                </div>
            </div>`;
        }).join('');

        // Toggle handler — live visual feedback
        container.querySelectorAll('.mat-toggle').forEach(chk => {
            chk.addEventListener('change', () => {
                const row = chk.closest('.catalog-row');
                const track = row.querySelector('.toggle-track');
                const thumb = track.querySelector('div');
                if (chk.checked) {
                    track.style.background = 'var(--accent-primary)';
                    thumb.style.left = '21px';
                    row.style.opacity = '1';
                } else {
                    track.style.background = 'var(--border-light)';
                    thumb.style.left = '3px';
                    row.style.opacity = '0.5';
                }
            });
        });
    }

    renderColorsCatalog() {
        const container = document.getElementById('colors-catalog-list');
        if (!container) return;

        container.innerHTML = COLOR_PALETTE.map((color, i) => {
            const enabled = color.enabled !== false;
            return `
            <div class="color-catalog-row" data-color-index="${i}" style="display:grid;grid-template-columns:40px auto 1fr auto;align-items:center;gap:12px;padding:10px 16px;background:var(--bg-secondary);border-radius:var(--radius-md);margin-bottom:6px;border:1px solid var(--border-subtle);opacity:${enabled ? 1 : 0.5};transition:opacity 0.2s;">
                <div style="width:36px;height:36px;border-radius:var(--radius-md);background:${color.hex};border:2px solid var(--border-light);"></div>
                <label style="cursor:pointer;">
                    <input type="checkbox" class="color-toggle" data-color-index="${i}" ${enabled ? 'checked' : ''} style="display:none;">
                    <div class="toggle-track" style="width:40px;height:22px;border-radius:11px;background:${enabled ? 'var(--accent-primary)' : 'var(--border-light)'};position:relative;transition:background 0.2s;">
                        <div style="position:absolute;top:3px;left:${enabled ? '21px' : '3px'};width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;"></div>
                    </div>
                </label>
                <input type="text" class="color-name-input" data-color-index="${i}" value="${color.name}" placeholder="Color name"
                    style="padding:7px 10px;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);color:var(--text-primary);font-size:0.85rem;">
                <button class="btn btn-danger btn-sm remove-color-btn" data-color-index="${i}" style="padding:6px 10px;">🗑️</button>
            </div>`;
        }).join('');

        // Toggle
        container.querySelectorAll('.color-toggle').forEach(chk => {
            chk.addEventListener('change', () => {
                const row = chk.closest('.color-catalog-row');
                const track = row.querySelector('.toggle-track');
                const thumb = track.querySelector('div');
                if (chk.checked) {
                    track.style.background = 'var(--accent-primary)';
                    thumb.style.left = '21px';
                    row.style.opacity = '1';
                } else {
                    track.style.background = 'var(--border-light)';
                    thumb.style.left = '3px';
                    row.style.opacity = '0.5';
                }
            });
        });

        // Remove
        container.querySelectorAll('.remove-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.dataset.colorIndex);
                if (confirm(`Remove "${COLOR_PALETTE[i].name}"?`)) {
                    COLOR_PALETTE.splice(i, 1);
                    this.saveCatalog();
                    this.renderColorsCatalog();
                    showAdminToast('🗑️', 'Color removed.');
                }
            });
        });
    }

    saveCatalog() {
        // --- Materials ---
        const matState = {};
        document.querySelectorAll('.catalog-row').forEach(row => {
            const id = row.dataset.matId;
            if (!id || !MATERIALS[id]) return;
            const enabled = row.querySelector('.mat-toggle')?.checked ?? true;
            const name = row.querySelector('.mat-name-input')?.value.trim() || MATERIALS[id].name;
            const desc = row.querySelector('.mat-desc-input')?.value.trim() || MATERIALS[id].description;
            const mult = parseFloat(row.querySelector('.mat-mult-input')?.value) || MATERIALS[id].multiplier;
            MATERIALS[id].enabled = enabled;
            MATERIALS[id].name = name;
            MATERIALS[id].description = desc;
            MATERIALS[id].multiplier = mult;
            matState[id] = { enabled, name, description: desc, multiplier: mult };
        });
        localStorage.setItem('admin_material_state', JSON.stringify(matState));

        // --- Colors ---
        // Sync name/enabled from the rendered rows first
        document.querySelectorAll('.color-catalog-row').forEach(row => {
            const i = parseInt(row.dataset.colorIndex);
            if (i >= 0 && i < COLOR_PALETTE.length) {
                COLOR_PALETTE[i].enabled = row.querySelector('.color-toggle')?.checked ?? true;
                const nameInput = row.querySelector('.color-name-input')?.value.trim();
                if (nameInput) COLOR_PALETTE[i].name = nameInput;
            }
        });
        localStorage.setItem('admin_color_state', JSON.stringify(COLOR_PALETTE));

        showAdminToast('✅', 'Colors & Materials saved! Changes are live on the storefront.');
        // Re-render to reflect any UI changes
        this.renderMaterialsCatalog();
        this.renderColorsCatalog();
    }

    addNewColor() {
        const hex = document.getElementById('new-color-hex').value;
        const name = document.getElementById('new-color-name').value.trim();
        if (!name) { showAdminToast('⚠️', 'Please enter a color name.'); return; }
        if (COLOR_PALETTE.find(c => c.hex.toLowerCase() === hex.toLowerCase())) {
            showAdminToast('⚠️', 'That color already exists.'); return;
        }
        COLOR_PALETTE.push({ name, hex, enabled: true });
        document.getElementById('add-color-form').style.display = 'none';
        document.getElementById('new-color-name').value = '';
        this.saveCatalog();
        showAdminToast('✅', `"${name}" added to the palette!`);
    }

    // ---------- Admin File Upload (multi-file) ----------
    setupAdminFileUpload() {
        const zone = document.getElementById('admin-upload-zone');
        const input = document.getElementById('new-product-file');
        if (!zone || !input) return;

        // Init storage
        this.adminUploadedFiles = []; // { dataUrl, name, type, kind: 'image'|'3d' }

        zone.addEventListener('click', () => input.click());

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--accent-primary)';
            zone.style.background = 'rgba(0,212,255,0.04)';
        });
        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = 'var(--border-light)';
            zone.style.background = '';
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--border-light)';
            zone.style.background = '';
            Array.from(e.dataTransfer.files).forEach(f => this.handleAdminFile(f));
        });

        input.addEventListener('change', () => {
            Array.from(input.files).forEach(f => this.handleAdminFile(f));
            input.value = '';
        });
    }

    handleAdminFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            showAdminToast('⚠️', `${file.name} is too large (max 50MB).`);
            return;
        }
        const ext = file.name.split('.').pop().toLowerCase();
        const imageExts = ['jpg', 'jpeg', 'png', 'webp'];
        const modelExts = ['stl', 'obj', 'step', 'stp', '3mf'];
        const isImage = imageExts.includes(ext);
        const is3D = modelExts.includes(ext);

        if (!isImage && !is3D) {
            showAdminToast('⚠️', `Unsupported file type: .${ext}`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const entry = {
                dataUrl: e.target.result,
                name: file.name,
                type: file.type,
                kind: isImage ? 'image' : '3d'
            };
            if (!this.adminUploadedFiles) this.adminUploadedFiles = [];
            this.adminUploadedFiles.push(entry);
            this.renderAdminFilePreviews();
            showAdminToast('✅', `${file.name} added.`);
        };
        reader.readAsDataURL(file);
    }

    renderAdminFilePreviews() {
        const files = this.adminUploadedFiles || [];
        const images = files.filter(f => f.kind === 'image');
        const models = files.filter(f => f.kind === '3d');

        // Images grid
        const imgSection = document.getElementById('admin-images-preview');
        const imgGrid = document.getElementById('admin-images-grid');
        if (imgSection && imgGrid) {
            imgSection.style.display = images.length ? 'block' : 'none';
            imgGrid.innerHTML = images.map((f, i) => `
                <div style="position:relative;">
                    <img src="${f.dataUrl}" alt="${f.name}"
                        style="width:80px;height:80px;object-fit:cover;border-radius:var(--radius-md);border:1px solid var(--border-light);"
                        title="${f.name}">
                    <button type="button" data-file-index="${files.indexOf(f)}"
                        style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:var(--color-error);color:#fff;border:none;cursor:pointer;font-size:0.7rem;line-height:1;"
                        onclick="adminPanel.removeAdminFile(${files.indexOf(f)})">✕</button>
                </div>`).join('');
        }

        // 3D file chips
        const d3Section = document.getElementById('admin-3d-preview');
        const d3Chips = document.getElementById('admin-3d-chips');
        if (d3Section && d3Chips) {
            d3Section.style.display = models.length ? 'block' : 'none';
            d3Chips.innerHTML = models.map((f) => `
                <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;background:var(--bg-secondary);border:1px solid var(--border-light);border-radius:var(--radius-full);font-size:0.78rem;">
                    🖨️ ${f.name}
                    <button type="button" onclick="adminPanel.removeAdminFile(${files.indexOf(f)})"
                        style="background:none;border:none;color:var(--color-error);cursor:pointer;font-size:0.8rem;padding:0;">✕</button>
                </div>`).join('');
        }
    }

    removeAdminFile(index) {
        if (this.adminUploadedFiles) {
            this.adminUploadedFiles.splice(index, 1);
            this.renderAdminFilePreviews();
        }
    }

    clearAdminFile() {
        this.adminUploadedFiles = [];
        const imgSection = document.getElementById('admin-images-preview');
        const d3Section = document.getElementById('admin-3d-preview');
        if (imgSection) imgSection.style.display = 'none';
        if (d3Section) d3Section.style.display = 'none';
        const zone = document.getElementById('admin-upload-zone');
        if (zone) zone.style.borderColor = 'var(--border-light)';
    }

    // ---------- Products Table (with category edit + delete) ----------
    loadProductsTable() {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        const categoryOptions = CATEGORIES.filter(c => c.id !== 'all')
            .map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        tbody.innerHTML = PRODUCTS.map(product => {
            const thumb = product.previewImage
                ? `<img src="${product.previewImage}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px;">`
                : '';
            return `
        <tr data-product-id="${product.id}">
          <td>
            <div style="display:flex;align-items:center;">
              ${thumb}
              <div>
                <strong>${product.name}</strong>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${product.description.substring(0, 55)}...</div>
              </div>
            </div>
          </td>
          <td>
            <select class="product-category-select" data-product-id="${product.id}" style="padding:6px 30px 6px 8px;font-size:0.82rem;">
              ${CATEGORIES.filter(c => c.id !== 'all').map(c =>
                `<option value="${c.id}" ${c.id === product.category ? 'selected' : ''}>${c.icon} ${c.name}</option>`
            ).join('')}
            </select>
          </td>
          <td>
            <input type="number"
                   class="product-price-input"
                   data-product-id="${product.id}"
                   value="${product.basePrice.toFixed(2)}"
                   min="0.01"
                   step="0.01"
                   style="width:90px;">
          </td>
          <td>${product.weight}g</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-sm btn-danger delete-product-btn" data-product-id="${product.id}" title="Delete">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
        }).join('');

        // Delete handlers
        tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.productId);
                this.deleteProduct(id);
            });
        });
    }

    saveProducts() {
        // Save prices
        const priceOverrides = {};
        document.querySelectorAll('.product-price-input').forEach(input => {
            const id = parseInt(input.dataset.productId);
            const price = parseFloat(input.value);
            if (price > 0) {
                priceOverrides[id] = price;
                const product = PRODUCTS.find(p => p.id === id);
                if (product) product.basePrice = price;
            }
        });
        localStorage.setItem('admin_product_prices', JSON.stringify(priceOverrides));

        // Save category changes
        document.querySelectorAll('.product-category-select').forEach(select => {
            const id = parseInt(select.dataset.productId);
            const category = select.value;
            const product = PRODUCTS.find(p => p.id === id);
            if (product) product.category = category;
        });
        this.saveCategoryOverrides();
        this.saveCustomProducts();

        this.updateStats();
        showAdminToast('✅', 'All product changes saved!');
    }

    resetProducts() {
        localStorage.removeItem('admin_product_prices');
        localStorage.removeItem('admin_category_overrides');
        localStorage.removeItem('admin_custom_products');
        // Reload page to reset in-memory data
        showAdminToast('↩', 'Products reset. Reloading...');
        setTimeout(() => location.reload(), 1000);
    }

    deleteProduct(id) {
        const product = PRODUCTS.find(p => p.id === id);
        if (!product) return;

        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

        const idx = PRODUCTS.findIndex(p => p.id === id);
        if (idx >= 0) PRODUCTS.splice(idx, 1);

        this.saveCustomProducts();
        this.saveCategoryOverrides();
        this.loadProductsTable();
        this.updateStats();
        showAdminToast('🗑️', `"${product.name}" deleted.`);
    }

    // ---------- Add New Product ----------
    showAddProductForm() {
        const form = document.getElementById('add-product-form');
        if (form) {
            form.style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }

    hideAddProductForm() {
        const form = document.getElementById('add-product-form');
        if (form) form.style.display = 'none';
        // Clear text inputs
        ['new-product-name', 'new-product-desc', 'new-product-price',
            'new-product-weight', 'new-product-w', 'new-product-h', 'new-product-d'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        // Clear file upload
        this.clearAdminFile();
    }

    saveNewProduct() {
        const name = document.getElementById('new-product-name').value.trim();
        const desc = document.getElementById('new-product-desc').value.trim();
        const category = document.getElementById('new-product-category').value;
        const price = parseFloat(document.getElementById('new-product-price').value);
        const weight = parseInt(document.getElementById('new-product-weight').value);
        const modelType = document.getElementById('new-product-model').value;
        const w = parseFloat(document.getElementById('new-product-w').value) || 10;
        const h = parseFloat(document.getElementById('new-product-h').value) || 10;
        const d = parseFloat(document.getElementById('new-product-d').value) || 10;
        const defaultColor = document.getElementById('new-product-color').value || '#2196F3';

        if (!name) { showAdminToast('⚠️', 'Product name is required.'); return; }
        if (!desc) { showAdminToast('⚠️', 'Description is required.'); return; }
        if (!price || price <= 0) { showAdminToast('⚠️', 'Valid price is required.'); return; }
        if (!weight || weight <= 0) { showAdminToast('⚠️', 'Valid weight is required.'); return; }

        const newId = Math.max(100, ...PRODUCTS.map(p => p.id)) + 1;

        const files = this.adminUploadedFiles || [];
        const imageFiles = files.filter(f => f.kind === 'image');
        const modelFiles = files.filter(f => f.kind === '3d');

        const newProduct = {
            id: newId,
            name,
            category,
            description: desc,
            basePrice: price,
            defaultColor,
            modelType,
            dimensions: { w, h, d },
            weight,
            badge: 'new',
            // First image = main thumbnail shown in product table & card
            previewImage: imageFiles[0]?.dataUrl || null,
            // All images (for future gallery)
            previewImages: imageFiles.map(f => ({ dataUrl: f.dataUrl, name: f.name })),
            // All 3D files (stored as base64 for now)
            modelFiles: modelFiles.map(f => ({ dataUrl: f.dataUrl, name: f.name, type: f.type }))
        };


        PRODUCTS.push(newProduct);
        this.saveCustomProducts();
        this.saveCategoryOverrides();
        this.loadProductsTable();
        this.updateStats();
        this.hideAddProductForm();
        showAdminToast('✅', `"${name}" added successfully!`);
    }

    // ---------- Materials Table ----------
    loadMaterialsTable() {
        const tbody = document.getElementById('materials-tbody');
        if (!tbody) return;

        const savedMultipliers = localStorage.getItem('admin_material_multipliers');
        let multiplierOverrides = {};
        if (savedMultipliers) {
            try { multiplierOverrides = JSON.parse(savedMultipliers); } catch (e) { }
        }

        tbody.innerHTML = Object.values(MATERIALS).map(mat => {
            const currentMultiplier = multiplierOverrides[mat.id] || mat.multiplier;
            const examplePrice = (10 * currentMultiplier).toFixed(2);
            return `
        <tr>
          <td><strong>${mat.icon} ${mat.name}</strong></td>
          <td style="color:var(--text-secondary)">${mat.description}</td>
          <td>
            <input type="number" class="material-multiplier-input"
                   data-material-id="${mat.id}" data-original="${mat.multiplier}"
                   value="${currentMultiplier.toFixed(2)}" min="0.1" step="0.05">
          </td>
          <td class="material-example" data-material-id="${mat.id}">$${examplePrice}</td>
        </tr>
      `;
        }).join('');

        tbody.querySelectorAll('.material-multiplier-input').forEach(input => {
            input.addEventListener('input', () => {
                const val = parseFloat(input.value);
                if (val > 0) {
                    const example = tbody.querySelector(`.material-example[data-material-id="${input.dataset.materialId}"]`);
                    if (example) example.textContent = `$${(10 * val).toFixed(2)}`;
                }
            });
        });
    }

    saveMaterials() {
        const inputs = document.querySelectorAll('.material-multiplier-input');
        const overrides = {};
        inputs.forEach(input => {
            const id = input.dataset.materialId;
            const multiplier = parseFloat(input.value);
            if (multiplier > 0) {
                overrides[id] = multiplier;
                if (MATERIALS[id]) MATERIALS[id].multiplier = multiplier;
            }
        });
        localStorage.setItem('admin_material_multipliers', JSON.stringify(overrides));
        showAdminToast('✅', 'Material multipliers saved successfully!');
    }

    resetMaterials() {
        localStorage.removeItem('admin_material_multipliers');
        this.loadMaterialsTable();
        showAdminToast('↩', 'Material multipliers reset to defaults.');
    }

    // ---------- Password Change ----------
    async changePassword() {
        const currentPw = document.getElementById('current-password').value;
        const newPw = document.getElementById('new-password').value;
        const confirmPw = document.getElementById('confirm-password').value;

        if (!currentPw || !newPw || !confirmPw) {
            showAdminToast('⚠️', 'Please fill in all password fields.'); return;
        }
        if (newPw.length < 8) {
            showAdminToast('⚠️', 'New password must be at least 8 characters.'); return;
        }
        if (newPw !== confirmPw) {
            showAdminToast('⚠️', 'New passwords do not match.'); return;
        }

        const currentHash = await hashPassword(currentPw);
        const stored = localStorage.getItem('admin_credentials');
        let creds = DEFAULT_CREDENTIALS;
        if (stored) {
            try { creds = JSON.parse(stored); } catch (e) { }
        }

        if (currentHash !== creds.passwordHash) {
            showAdminToast('❌', 'Current password is incorrect.'); return;
        }

        const newHash = await hashPassword(newPw);
        localStorage.setItem('admin_credentials', JSON.stringify({
            username: creds.username,
            passwordHash: newHash
        }));

        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        showAdminToast('✅', 'Password updated successfully!');
    }

    // ---------- Stats ----------
    updateStats() {
        document.getElementById('stat-products').textContent = PRODUCTS.length;
        document.getElementById('stat-categories').textContent = CATEGORIES.length - 1;
        document.getElementById('stat-materials').textContent = Object.keys(MATERIALS).length;
    }
}

// ---------- Toast ----------
function showAdminToast(icon, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---------- Initialize ----------
document.addEventListener('DOMContentLoaded', () => {
    const admin = new AdminPanel();
    admin.init();
});
