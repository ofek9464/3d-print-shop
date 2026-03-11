/* ============================================
   SHOPPING CART MANAGER
   ============================================ */

class CartManager {
    constructor() {
        this.items = [];
        this.loadFromStorage();
        this.onUpdate = null; // callback when cart changes
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('3dshop_cart');
            if (stored) {
                this.items = JSON.parse(stored);
            }
        } catch (e) {
            this.items = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('3dshop_cart', JSON.stringify(this.items));
        } catch (e) {
            console.warn('Could not save cart to localStorage');
        }
    }

    addItem(product, options) {
        const { materialId, color, quantity, customization } = options;
        const material = MATERIALS[materialId];
        const unitPrice = calculatePrice(product.basePrice, materialId, 1);

        // Don't merge items with customization — always add as new
        if (!customization) {
            const existingIndex = this.items.findIndex(item =>
                item.productId === product.id &&
                item.materialId === materialId &&
                item.color === color &&
                !item.customization
            );

            if (existingIndex >= 0) {
                this.items[existingIndex].quantity += quantity;
                this.items[existingIndex].totalPrice = parseFloat(
                    (this.items[existingIndex].quantity * this.items[existingIndex].unitPrice).toFixed(2)
                );
                this.saveToStorage();
                if (this.onUpdate) this.onUpdate();
                return true;
            }
        }

        this.items.push({
            id: Date.now() + Math.random(),
            productId: product.id,
            productName: product.name,
            materialId: materialId,
            materialName: material.name,
            color: color,
            colorName: COLOR_PALETTE.find(c => c.hex === color)?.name || 'Custom',
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: parseFloat((unitPrice * quantity).toFixed(2)),
            customization: customization || null
        });

        this.saveToStorage();
        if (this.onUpdate) this.onUpdate();
        return true;
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveToStorage();
        if (this.onUpdate) this.onUpdate();
    }

    updateQuantity(itemId, newQty) {
        const item = this.items.find(i => i.id === itemId);
        if (item && newQty > 0) {
            item.quantity = newQty;
            item.totalPrice = parseFloat((item.unitPrice * newQty).toFixed(2));
            this.saveToStorage();
            if (this.onUpdate) this.onUpdate();
        } else if (newQty <= 0) {
            this.removeItem(itemId);
        }
    }

    getItemCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    getSubtotal() {
        return parseFloat(this.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
    }

    clear() {
        this.items = [];
        this.saveToStorage();
        if (this.onUpdate) this.onUpdate();
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

window.CartManager = CartManager;
