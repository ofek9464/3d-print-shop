/* ============================================
   MAIN APPLICATION CONTROLLER
   ============================================ */

class App {
    constructor() {
        this.cart = new CartManager();
        this.customOrder = new CustomOrderManager();
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.sortBy = 'default';
        this.cardViewers = [];
        this.modalViewer = null;
        this.currentProduct = null;
        this.selectedColor = null;
        this.selectedMaterial = 'pla';
        this.selectedQuantity = 1;
        this.customizationFiles = [];
        this.selectedPlacement = 'front';
    }

    init() {
        this.setupNavbar();
        this.renderCategories();
        this.renderProducts();
        this.setupModal();
        this.setupCustomization();
        this.setupCustomModal();
        this.setupCart();
        this.customOrder.init();
        this.updateCartBadge();

        // Cart update callback
        this.cart.onUpdate = () => {
            this.updateCartBadge();
            this.renderCartItems();
        };
    }

    // ========================
    // NAVBAR
    // ========================
    setupNavbar() {
        const navbar = document.querySelector('.navbar');
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');

        // Scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Search
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchTerm = searchInput.value.trim().toLowerCase();
                    this.renderProducts();
                }, 300);
            });
        }

        // Sort
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortBy = sortSelect.value;
                this.renderProducts();
            });
        }
    }

    // ========================
    // CATEGORIES
    // ========================
    renderCategories() {
        const filterBar = document.getElementById('filter-bar');
        if (!filterBar) return;

        filterBar.innerHTML = CATEGORIES.map(cat => `
      <button class="filter-chip ${cat.id === 'all' ? 'active' : ''}"
              data-category="${cat.id}"
              id="filter-${cat.id}">
        <span class="chip-icon">${cat.icon}</span>
        <span>${cat.name}</span>
        <span class="chip-count">${getCategoryCount(cat.id)}</span>
      </button>
    `).join('');

        // Click handlers
        filterBar.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentCategory = chip.dataset.category;
                this.renderProducts();
            });
        });
    }

    // ========================
    // PRODUCTS
    // ========================
    getFilteredProducts() {
        let products = this.currentCategory === 'all'
            ? [...PRODUCTS]
            : PRODUCTS.filter(p => p.category === this.currentCategory);

        // Search filter
        if (this.searchTerm) {
            products = products.filter(p =>
                p.name.toLowerCase().includes(this.searchTerm) ||
                p.description.toLowerCase().includes(this.searchTerm) ||
                p.category.toLowerCase().includes(this.searchTerm)
            );
        }

        // Sort
        switch (this.sortBy) {
            case 'price-low':
                products.sort((a, b) => a.basePrice - b.basePrice);
                break;
            case 'price-high':
                products.sort((a, b) => b.basePrice - a.basePrice);
                break;
            case 'name':
                products.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        return products;
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        const countEl = document.getElementById('product-count');
        if (!grid) return;

        // Clean up existing card viewers
        this.cardViewers.forEach(v => v.destroy());
        this.cardViewers = [];

        const products = this.getFilteredProducts();

        if (countEl) {
            countEl.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;
        }

        // Build HTML
        let html = products.map(product => {
            const badgeHTML = product.badge
                ? `<span class="product-card-badge badge-${product.badge}">${product.badge}</span>`
                : '';

            return `
        <div class="product-card animate-in" data-product-id="${product.id}">
          ${badgeHTML}
          <div class="product-card-preview" id="preview-${product.id}">
            <div class="preview-overlay"></div>
          </div>
          <div class="product-card-info">
            <div class="product-card-category">${getCategoryName(product.category)}</div>
            <h3 class="product-card-name">${product.name}</h3>
            <p class="product-card-desc">${product.description}</p>
            <div class="product-card-footer">
              <div class="product-card-price">
                $${product.basePrice.toFixed(2)}
                <span class="price-label">from</span>
              </div>
              <span class="product-card-action">View Details</span>
            </div>
          </div>
        </div>
      `;
        }).join('');

        // Add custom order card
        html += `
      <div class="custom-order-card" id="custom-order-trigger">
        <span class="custom-icon">🛠️</span>
        <h3>Custom <span class="gradient-text">3D Print</span> Request</h3>
        <p>Upload your own 3D model file and get an instant price estimate. We print your designs!</p>
        <button class="btn btn-primary">
          Upload Your Model
          <span>→</span>
        </button>
      </div>
    `;

        grid.innerHTML = html;

        // Initialize card 3D previews
        requestAnimationFrame(() => {
            products.forEach(product => {
                const container = document.getElementById(`preview-${product.id}`);
                if (container) {
                    try {
                        const viewer = new CardPreviewViewer(container, product.modelType, product.defaultColor);
                        this.cardViewers.push(viewer);
                    } catch (e) {
                        console.warn(`Failed to create preview for ${product.name}:`, e);
                    }
                }
            });
        });

        // Card click handlers
        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = parseInt(card.dataset.productId);
                this.openProductModal(productId);
            });
        });

        // Custom order click
        const customTrigger = document.getElementById('custom-order-trigger');
        if (customTrigger) {
            customTrigger.addEventListener('click', () => this.openCustomModal());
        }
    }

    // ========================
    // PRODUCT MODAL
    // ========================
    setupModal() {
        const backdrop = document.getElementById('modal-backdrop');
        const modal = document.getElementById('product-modal');
        const closeBtn = document.getElementById('modal-close');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeProductModal());
        }
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeProductModal());
        }

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProductModal();
                this.closeCustomModal();
                this.closeCart();
            }
        });
    }

    openProductModal(productId) {
        const product = getProductById(productId);
        if (!product) return;

        this.currentProduct = product;
        this.selectedColor = product.defaultColor;
        this.selectedMaterial = 'pla';
        this.selectedQuantity = 1;

        // Update modal content
        document.getElementById('modal-category').textContent = getCategoryName(product.category);
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-dim-w').textContent = `${product.dimensions.w} cm`;
        document.getElementById('modal-dim-h').textContent = `${product.dimensions.h} cm`;
        document.getElementById('modal-dim-d').textContent = `${product.dimensions.d} cm`;
        document.getElementById('modal-qty-value').textContent = '1';

        // Reset customization panel
        const customPanel = document.getElementById('customization-panel');
        if (customPanel) customPanel.style.display = 'none';
        const customArrow = document.getElementById('custom-toggle-arrow');
        if (customArrow) customArrow.textContent = '▼';
        const customNotes = document.getElementById('modal-custom-notes');
        if (customNotes) customNotes.value = '';
        this.customizationFiles = [];
        this.selectedPlacement = 'front';
        const attachedList = document.getElementById('modal-attached-files');
        if (attachedList) attachedList.innerHTML = '';
        // Reset placement buttons
        document.querySelectorAll('.placement-btn').forEach(btn => {
            btn.style.borderColor = 'var(--border-subtle)';
            btn.style.background = 'var(--bg-secondary)';
            btn.style.color = 'var(--text-secondary)';
            btn.classList.remove('active');
        });
        const frontBtn = document.querySelector('.placement-btn[data-placement="front"]');
        if (frontBtn) {
            frontBtn.classList.add('active');
            frontBtn.style.borderColor = 'var(--accent-primary)';
            frontBtn.style.background = 'rgba(0,212,255,0.1)';
            frontBtn.style.color = 'var(--accent-primary)';
        }

        // Render color swatches
        this.renderColorOptions();

        // Render material options
        this.renderMaterialOptions();

        // Update price
        this.updateModalPrice();

        // Show modal
        document.getElementById('modal-backdrop').classList.add('active');
        document.getElementById('product-modal').classList.add('active');
        document.body.style.overflow = 'hidden';

        // Initialize 3D viewer
        setTimeout(() => {
            if (this.modalViewer) {
                this.modalViewer.destroy();
            }
            const viewerContainer = document.getElementById('modal-viewer-container');
            this.modalViewer = new ModelViewer(viewerContainer, {
                backgroundColor: 0x0B0D17,
                autoRotate: true,
                interactive: true
            });
            this.modalViewer.loadModel(product.modelType, this.selectedColor);
        }, 100);
    }

    closeProductModal() {
        document.getElementById('modal-backdrop').classList.remove('active');
        document.getElementById('product-modal').classList.remove('active');
        document.body.style.overflow = '';

        if (this.modalViewer) {
            this.modalViewer.destroy();
            this.modalViewer = null;
        }
    }

    renderColorOptions() {
        const container = document.getElementById('color-options');
        const selectedLabel = document.getElementById('selected-color-name');
        if (!container) return;

        const enabledColors = getEnabledColors();

        // If current selected color is disabled, fall back to first enabled
        if (!enabledColors.find(c => c.hex === this.selectedColor) && enabledColors.length > 0) {
            this.selectedColor = enabledColors[0].hex;
        }

        container.innerHTML = enabledColors.map(color => `
      <button class="color-swatch ${color.hex === this.selectedColor ? 'active' : ''}"
              style="background-color: ${color.hex}"
              data-color="${color.hex}"
              title="${color.name}"
              aria-label="Select ${color.name}">
      </button>
    `).join('');

        if (selectedLabel) {
            const currentColor = enabledColors.find(c => c.hex === this.selectedColor);
            selectedLabel.textContent = currentColor ? currentColor.name : '';
        }

        container.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                this.selectedColor = swatch.dataset.color;
                container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');

                const colorName = enabledColors.find(c => c.hex === this.selectedColor);
                if (selectedLabel) selectedLabel.textContent = colorName ? colorName.name : '';

                if (this.modalViewer) {
                    this.modalViewer.setColor(this.selectedColor);
                }
            });
        });
    }

    renderMaterialOptions() {
        const container = document.getElementById('material-options');
        if (!container) return;

        const enabledMaterials = getEnabledMaterials();

        // If current selected material is disabled, fall back to first enabled
        if (!enabledMaterials.find(m => m.id === this.selectedMaterial) && enabledMaterials.length > 0) {
            this.selectedMaterial = enabledMaterials[0].id;
        }

        container.innerHTML = enabledMaterials.map(mat => {
            const price = calculatePrice(this.currentProduct.basePrice, mat.id, 1);
            return `
        <div class="material-option ${mat.id === this.selectedMaterial ? 'active' : ''}"
             data-material="${mat.id}">
          <div class="material-radio"></div>
          <div class="material-info">
            <div class="material-name">${mat.icon} ${mat.name}</div>
            <div class="material-desc">${mat.description}</div>
          </div>
          <div class="material-price">$${price.toFixed(2)}</div>
        </div>
      `;
        }).join('');

        container.querySelectorAll('.material-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectedMaterial = option.dataset.material;
                container.querySelectorAll('.material-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.updateModalPrice();
            });
        });
    }

    updateModalPrice() {
        const priceEl = document.getElementById('modal-total-price');
        if (!priceEl || !this.currentProduct) return;

        const total = calculatePrice(
            this.currentProduct.basePrice,
            this.selectedMaterial,
            this.selectedQuantity
        );
        priceEl.textContent = `$${total.toFixed(2)}`;
    }

    // ========================
    // CUSTOMIZATION PANEL
    // ========================
    setupCustomization() {
        // Toggle panel
        const toggle = document.getElementById('customization-toggle');
        const panel = document.getElementById('customization-panel');
        const arrow = document.getElementById('custom-toggle-arrow');
        if (toggle && panel) {
            toggle.addEventListener('click', () => {
                const isOpen = panel.style.display !== 'none';
                panel.style.display = isOpen ? 'none' : 'block';
                if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
                if (!isOpen) {
                    toggle.style.borderColor = 'var(--accent-primary)';
                    toggle.style.background = 'rgba(0,212,255,0.06)';
                } else {
                    toggle.style.borderColor = 'var(--border-subtle)';
                    toggle.style.background = 'var(--bg-card)';
                }
            });
        }

        // Attachment upload
        const attachZone = document.getElementById('modal-attach-zone');
        const attachInput = document.getElementById('modal-attach-input');
        if (attachZone && attachInput) {
            attachZone.addEventListener('click', () => attachInput.click());
            attachZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                attachZone.style.borderColor = 'var(--accent-primary)';
            });
            attachZone.addEventListener('dragleave', () => {
                attachZone.style.borderColor = 'var(--border-light)';
            });
            attachZone.addEventListener('drop', (e) => {
                e.preventDefault();
                attachZone.style.borderColor = 'var(--border-light)';
                Array.from(e.dataTransfer.files).forEach(f => this.addAttachment(f));
            });
            attachInput.addEventListener('change', () => {
                Array.from(attachInput.files).forEach(f => this.addAttachment(f));
                attachInput.value = '';
            });
        }

        // Placement buttons
        document.querySelectorAll('.placement-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedPlacement = btn.dataset.placement;
                document.querySelectorAll('.placement-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.borderColor = 'var(--border-subtle)';
                    b.style.background = 'var(--bg-secondary)';
                    b.style.color = 'var(--text-secondary)';
                });
                btn.classList.add('active');
                btn.style.borderColor = 'var(--accent-primary)';
                btn.style.background = 'rgba(0,212,255,0.1)';
                btn.style.color = 'var(--accent-primary)';
            });
        });
    }

    addAttachment(file) {
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('⚠️', `${file.name} too large. Max 20MB.`);
            return;
        }
        this.customizationFiles.push(file);
        this.renderAttachments();
    }

    removeAttachment(index) {
        this.customizationFiles.splice(index, 1);
        this.renderAttachments();
    }

    renderAttachments() {
        const container = document.getElementById('modal-attached-files');
        if (!container) return;

        container.innerHTML = this.customizationFiles.map((file, i) => {
            const isImage = file.type.startsWith('image/');
            return `
            <div style="display:flex; align-items:center; gap:8px; padding:6px 10px; background:var(--bg-secondary); border-radius:var(--radius-md); margin-bottom:4px; font-size:0.82rem;">
                <span>${isImage ? '🖼️' : '📎'}</span>
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-primary);">${file.name}</span>
                <span style="color:var(--text-muted); font-size:0.72rem;">${(file.size / 1024).toFixed(0)}KB</span>
                <button type="button" onclick="appInstance.removeAttachment(${i})" style="background:none; border:none; color:var(--color-error); cursor:pointer; font-size:0.9rem; padding:2px 4px;">✕</button>
            </div>
            `;
        }).join('');
    }

    // ========================
    // QUANTITY CONTROLS
    // ========================
    setupQuantityControls() {
        // These are called from HTML onclick attributes
    }

    // ========================
    // CUSTOM ORDER MODAL
    // ========================
    setupCustomModal() {
        const closeBtn = document.getElementById('custom-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCustomModal());
        }
    }

    openCustomModal() {
        document.getElementById('modal-backdrop').classList.add('active');
        document.getElementById('custom-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeCustomModal() {
        const customModal = document.getElementById('custom-modal');
        if (customModal) customModal.classList.remove('active');
        // Only remove backdrop if product modal is also closed
        const productModal = document.getElementById('product-modal');
        if (!productModal.classList.contains('active')) {
            document.getElementById('modal-backdrop').classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // ========================
    // CART
    // ========================
    setupCart() {
        const cartBtn = document.getElementById('cart-btn');
        const cartClose = document.getElementById('cart-drawer-close');
        const cartBackdrop = document.getElementById('cart-backdrop');

        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCart();
            });
        }

        if (cartClose) {
            cartClose.addEventListener('click', () => this.closeCart());
        }

        if (cartBackdrop) {
            cartBackdrop.addEventListener('click', () => this.closeCart());
        }

        this.renderCartItems();
    }

    toggleCart() {
        const drawer = document.getElementById('cart-drawer');
        drawer.classList.toggle('open');
    }

    closeCart() {
        document.getElementById('cart-drawer').classList.remove('open');
    }

    updateCartBadge() {
        const count = this.cart.getItemCount();
        const badge = document.getElementById('cart-count');
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('visible', count > 0);
        }
    }

    renderCartItems() {
        const container = document.getElementById('cart-items');
        const subtotalEl = document.getElementById('cart-subtotal-value');
        const footerEl = document.querySelector('.cart-drawer-footer');

        if (!container) return;

        if (this.cart.isEmpty()) {
            container.innerHTML = `
        <div class="cart-empty">
          <span class="empty-icon">🛒</span>
          <h4>Your cart is empty</h4>
          <p class="text-muted">Browse our catalog and add some incredible 3D prints!</p>
        </div>
      `;
            if (footerEl) footerEl.style.display = 'none';
            return;
        }

        if (footerEl) footerEl.style.display = 'block';

        container.innerHTML = this.cart.items.map(item => {
            const customBadge = item.customization
                ? `<div style="font-size:0.72rem; color:var(--accent-primary); margin-top:2px;">🎨 Custom: ${item.customization.notes ? item.customization.notes.substring(0, 40) + (item.customization.notes.length > 40 ? '...' : '') : 'Placement: ' + item.customization.placement}${item.customization.fileCount ? ` · ${item.customization.fileCount} file(s)` : ''}</div>`
                : '';
            return `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-color" style="background: ${item.color}; border-radius: var(--radius-md);"></div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.productName}</div>
          <div class="cart-item-meta">${item.materialName} · ${item.colorName} · Qty: ${item.quantity}</div>
          ${customBadge}
          <div class="cart-item-bottom">
            <span class="cart-item-price">$${item.totalPrice.toFixed(2)}</span>
            <span class="cart-item-remove" data-remove-id="${item.id}">✕ Remove</span>
          </div>
        </div>
      </div>
    `;
        }).join('');

        // Remove handlers
        container.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cart.removeItem(parseFloat(btn.dataset.removeId));
            });
        });

        if (subtotalEl) {
            subtotalEl.textContent = `$${this.cart.getSubtotal().toFixed(2)}`;
        }
    }

    addToCart() {
        if (!this.currentProduct) return;

        // Gather customization data
        const customNotes = document.getElementById('modal-custom-notes')?.value?.trim() || '';
        const hasCustomization = customNotes || this.customizationFiles.length > 0;

        this.cart.addItem(this.currentProduct, {
            materialId: this.selectedMaterial,
            color: this.selectedColor,
            quantity: this.selectedQuantity,
            customization: hasCustomization ? {
                notes: customNotes,
                placement: this.selectedPlacement,
                fileCount: this.customizationFiles.length,
                fileNames: this.customizationFiles.map(f => f.name)
            } : null
        });

        const msg = hasCustomization
            ? `${this.currentProduct.name} added to cart with customization!`
            : `${this.currentProduct.name} added to cart!`;
        showToast('✅', msg);
        this.closeProductModal();
    }
}

// ========================
// GLOBAL FUNCTIONS
// ========================
let appInstance = null;

function changeQuantity(delta) {
    if (!appInstance) return;
    appInstance.selectedQuantity = Math.max(1, appInstance.selectedQuantity + delta);
    document.getElementById('modal-qty-value').textContent = appInstance.selectedQuantity;
    appInstance.updateModalPrice();
}

function addToCart() {
    if (!appInstance) return;
    appInstance.addToCart();
}

function showToast(icon, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// Initialize app with global reference

(function () {
    const originalDCL = document.addEventListener;
    let initDone = false;

    document.addEventListener('DOMContentLoaded', () => {
        if (initDone) return;
        initDone = true;
        appInstance = new App();
        appInstance.init();
    });
})();
