/* ============================================
   PRODUCT DATA & MATERIAL DEFINITIONS
   ============================================ */

// ---------- Material Definitions ----------
const MATERIALS = {
  pla: {
    id: 'pla',
    name: 'PLA',
    description: 'Standard, biodegradable plastic',
    multiplier: 1.0,
    icon: '🌱',
    enabled: true
  },
  pla_plus: {
    id: 'pla_plus',
    name: 'PLA+',
    description: 'Enhanced strength & durability',
    multiplier: 1.15,
    icon: '💪',
    enabled: true
  },
  matt_pla: {
    id: 'matt_pla',
    name: 'Matt PLA',
    description: 'Elegant matte finish, no glare',
    multiplier: 1.25,
    icon: '🎨',
    enabled: true
  },
  petg: {
    id: 'petg',
    name: 'PETG',
    description: 'Weather & UV resistant, outdoor-ready',
    multiplier: 1.35,
    icon: '☀️',
    enabled: true
  },
  abs: {
    id: 'abs',
    name: 'ABS',
    description: 'Heat resistant, industrial tough',
    multiplier: 1.45,
    icon: '🔥',
    enabled: true
  },
  tpu: {
    id: 'tpu',
    name: 'TPU',
    description: 'Flexible, rubber-like material',
    multiplier: 1.75,
    icon: '🤸',
    enabled: true
  }
};

// ---------- Color Palette ----------
const COLOR_PALETTE = [
  { name: 'Arctic White',    hex: '#F0F0F0', enabled: true },
  { name: 'Midnight Black',  hex: '#1A1A1A', enabled: true },
  { name: 'Electric Blue',   hex: '#2196F3', enabled: true },
  { name: 'Fire Red',        hex: '#F44336', enabled: true },
  { name: 'Emerald Green',   hex: '#4CAF50', enabled: true },
  { name: 'Royal Purple',    hex: '#9C27B0', enabled: true },
  { name: 'Sunset Orange',   hex: '#FF9800', enabled: true },
  { name: 'Hot Pink',        hex: '#E91E63', enabled: true },
  { name: 'Sky Blue',        hex: '#03A9F4', enabled: true },
  { name: 'Golden Yellow',   hex: '#FFC107', enabled: true },
  { name: 'Teal',            hex: '#009688', enabled: true },
  { name: 'Silver',          hex: '#9E9E9E', enabled: true },
];

// ---------- Categories ----------
const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: '🏪' },
  { id: 'toys', name: 'Toys', icon: '🧸' },
  { id: 'tools', name: 'Tools', icon: '🔧' },
  { id: 'home_decor', name: 'Home Decor', icon: '🏠' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'mechanical', name: 'Mechanical Parts', icon: '⚙️' },
  { id: 'art', name: 'Art & Sculptures', icon: '🎨' },
];

// ---------- Products ----------
const PRODUCTS = [
  // === TOYS ===
  {
    id: 1,
    name: 'Dragon Figurine',
    category: 'toys',
    description: 'Majestic dragon figurine with intricate scale detail and dynamic pose. Perfect for collectors and display shelves.',
    basePrice: 29.99,
    defaultColor: '#9C27B0',
    modelType: 'torusKnot',
    dimensions: { w: 12, h: 15, d: 8 },
    weight: 65,
    badge: 'popular'
  },
  {
    id: 2,
    name: 'Robot Action Figure',
    category: 'toys',
    description: 'Articulated robot with movable arms and head. Futuristic mech design with panel line details.',
    basePrice: 24.99,
    defaultColor: '#2196F3',
    modelType: 'robot',
    dimensions: { w: 8, h: 14, d: 6 },
    weight: 55,
    badge: 'new'
  },
  {
    id: 3,
    name: 'Fantasy Castle',
    category: 'toys',
    description: 'Detailed medieval castle with towers, battlements, and drawbridge. Great for tabletop games.',
    basePrice: 44.99,
    defaultColor: '#9E9E9E',
    modelType: 'castle',
    dimensions: { w: 20, h: 18, d: 20 },
    weight: 120,
    badge: null
  },

  // === TOOLS ===
  {
    id: 4,
    name: 'Universal Phone Stand',
    category: 'tools',
    description: 'Adjustable phone stand fits all sizes. Optimal viewing angle with cable management slot.',
    basePrice: 12.99,
    defaultColor: '#1A1A1A',
    modelType: 'stand',
    dimensions: { w: 8, h: 10, d: 8 },
    weight: 35,
    badge: 'popular'
  },
  {
    id: 5,
    name: 'Cable Organizer Set',
    category: 'tools',
    description: 'Set of 6 cable clips for desk organization. Self-adhesive backing included. Keep your workspace clean.',
    basePrice: 8.99,
    defaultColor: '#F0F0F0',
    modelType: 'organizer',
    dimensions: { w: 4, h: 2, d: 3 },
    weight: 12,
    badge: null
  },
  {
    id: 6,
    name: 'Precision Tool Holder',
    category: 'tools',
    description: 'Desktop organizer for screwdrivers, tweezers, and hobby tools. Features 12 slots of various sizes.',
    basePrice: 18.99,
    defaultColor: '#1A1A1A',
    modelType: 'toolHolder',
    dimensions: { w: 15, h: 8, d: 10 },
    weight: 48,
    badge: 'new'
  },

  // === HOME DECOR ===
  {
    id: 7,
    name: 'Geometric Vase',
    category: 'home_decor',
    description: 'Modern low-poly geometric vase. Watertight design suitable for fresh flowers. A statement piece.',
    basePrice: 22.99,
    defaultColor: '#009688',
    modelType: 'vase',
    dimensions: { w: 10, h: 20, d: 10 },
    weight: 75,
    badge: 'popular'
  },
  {
    id: 8,
    name: 'Hexagonal Wall Shelf',
    category: 'home_decor',
    description: 'Modular hexagonal shelf for walls. Can be combined in various patterns. Mounting hardware included.',
    basePrice: 15.99,
    defaultColor: '#F0F0F0',
    modelType: 'hexShelf',
    dimensions: { w: 25, h: 22, d: 10 },
    weight: 60,
    badge: null
  },
  {
    id: 9,
    name: 'Desk Lamp Shade',
    category: 'home_decor',
    description: 'Elegant parametric lamp shade with complex pattern. Creates beautiful light patterns on walls.',
    basePrice: 34.99,
    defaultColor: '#FFC107',
    modelType: 'lampShade',
    dimensions: { w: 16, h: 14, d: 16 },
    weight: 50,
    badge: 'new'
  },

  // === GAMING ===
  {
    id: 10,
    name: 'Controller Stand',
    category: 'gaming',
    description: 'Premium stand for gaming controllers. Fits PS5, Xbox, and Switch Pro. Anti-slip base included.',
    basePrice: 16.99,
    defaultColor: '#1A1A1A',
    modelType: 'controllerStand',
    dimensions: { w: 12, h: 10, d: 8 },
    weight: 40,
    badge: null
  },
  {
    id: 11,
    name: 'Dice Tower',
    category: 'gaming',
    description: 'Medieval-themed dice tower for tabletop RPGs. Internal baffles ensure fair rolls every time.',
    basePrice: 27.99,
    defaultColor: '#795548',
    modelType: 'diceTower',
    dimensions: { w: 8, h: 22, d: 10 },
    weight: 85,
    badge: 'popular'
  },
  {
    id: 12,
    name: 'Mini Terrain Set',
    category: 'gaming',
    description: 'Set of 5 terrain pieces for tabletop wargaming. Includes ruins, trees, and rock formations.',
    basePrice: 39.99,
    defaultColor: '#9E9E9E',
    modelType: 'terrain',
    dimensions: { w: 15, h: 8, d: 15 },
    weight: 95,
    badge: null
  },

  // === MECHANICAL PARTS ===
  {
    id: 13,
    name: 'Custom Gear Set',
    category: 'mechanical',
    description: 'Precision gear set with 3 interlocking gears. Module 1.5, ideal for hobby projects and prototypes.',
    basePrice: 14.99,
    defaultColor: '#9E9E9E',
    modelType: 'gear',
    dimensions: { w: 6, h: 2, d: 6 },
    weight: 20,
    badge: null
  },
  {
    id: 14,
    name: 'Bearing Housing',
    category: 'mechanical',
    description: 'Drop-in bearing housing for 608 bearings. PETG recommended for mechanical applications.',
    basePrice: 9.99,
    defaultColor: '#1A1A1A',
    modelType: 'bearing',
    dimensions: { w: 5, h: 4, d: 5 },
    weight: 15,
    badge: null
  },
  {
    id: 15,
    name: 'Universal Bracket Mount',
    category: 'mechanical',
    description: 'Adjustable L-bracket with multiple mounting holes. Customizable angle for various applications.',
    basePrice: 7.99,
    defaultColor: '#1A1A1A',
    modelType: 'bracket',
    dimensions: { w: 8, h: 6, d: 4 },
    weight: 18,
    badge: 'new'
  },

  // === ART & SCULPTURES ===
  {
    id: 16,
    name: 'Abstract Wave Sculpture',
    category: 'art',
    description: 'Mesmerizing parametric wave sculpture. Generated from mathematical equations. A true conversation piece.',
    basePrice: 42.99,
    defaultColor: '#E91E63',
    modelType: 'wave',
    dimensions: { w: 18, h: 12, d: 10 },
    weight: 80,
    badge: 'popular'
  },
  {
    id: 17,
    name: 'Geodesic Sphere',
    category: 'art',
    description: 'Intricate geodesic sphere with hollow interior. Light passes through creating stunning shadow patterns.',
    basePrice: 35.99,
    defaultColor: '#FFC107',
    modelType: 'geodesic',
    dimensions: { w: 14, h: 14, d: 14 },
    weight: 55,
    badge: null
  },
  {
    id: 18,
    name: 'Spiral Bloom',
    category: 'art',
    description: 'Nature-inspired Fibonacci spiral sculpture. Elegant mathematical art for your desk or shelf.',
    basePrice: 38.99,
    defaultColor: '#4CAF50',
    modelType: 'spiral',
    dimensions: { w: 12, h: 16, d: 12 },
    weight: 60,
    badge: 'new'
  }
];

// ---------- Helper Functions ----------
function getProductsByCategory(categoryId) {
  if (categoryId === 'all') return PRODUCTS;
  return PRODUCTS.filter(p => p.category === categoryId);
}

function getProductById(id) {
  return PRODUCTS.find(p => p.id === id);
}

function calculatePrice(basePrice, materialId, quantity = 1) {
  const material = MATERIALS[materialId];
  if (!material) return basePrice * quantity;
  return parseFloat((basePrice * material.multiplier * quantity).toFixed(2));
}

function getCategoryName(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

function getCategoryCount(categoryId) {
  if (categoryId === 'all') return PRODUCTS.length;
  return PRODUCTS.filter(p => p.category === categoryId).length;
}

// Estimate price for custom orders based on volume and material
function estimateCustomPrice(volumeCm3, materialId) {
  const basePricePerCm3 = 0.12;
  const material = MATERIALS[materialId];
  const materialCost = volumeCm3 * basePricePerCm3 * (material ? material.multiplier : 1);
  const setupFee = 5.00;
  const total = materialCost + setupFee;
  return parseFloat(Math.max(total, 8.99).toFixed(2));
}

// ---------- Enabled Helpers (respect admin overrides) ----------
function getEnabledMaterials() {
  return Object.values(MATERIALS).filter(m => m.enabled !== false);
}

function getEnabledColors() {
  return COLOR_PALETTE.filter(c => c.enabled !== false);
}

// Apply saved admin overrides so they persist across page loads
(function applyAdminOverrides() {
  // Materials: enabled state + multiplier + name
  try {
    const matState = localStorage.getItem('admin_material_state');
    if (matState) {
      const saved = JSON.parse(matState);
      Object.entries(saved).forEach(([id, data]) => {
        if (MATERIALS[id]) {
          if (data.enabled !== undefined) MATERIALS[id].enabled = data.enabled;
          if (data.multiplier !== undefined) MATERIALS[id].multiplier = data.multiplier;
          if (data.name) MATERIALS[id].name = data.name;
          if (data.description) MATERIALS[id].description = data.description;
        }
      });
    }
  } catch(e) {}

  // Colors: enabled state + custom colors added by admin
  try {
    const colorState = localStorage.getItem('admin_color_state');
    if (colorState) {
      const saved = JSON.parse(colorState);
      // saved is an array parallel to COLOR_PALETTE (+ any extras)
      saved.forEach((sc, i) => {
        if (i < COLOR_PALETTE.length) {
          if (sc.enabled !== undefined) COLOR_PALETTE[i].enabled = sc.enabled;
          if (sc.name) COLOR_PALETTE[i].name = sc.name;
        } else {
          // Extra color added by admin
          if (!COLOR_PALETTE.find(c => c.hex === sc.hex)) {
            COLOR_PALETTE.push({ name: sc.name, hex: sc.hex, enabled: sc.enabled !== false });
          }
        }
      });
    }
  } catch(e) {}
})();

// Export for use in other modules
window.MATERIALS = MATERIALS;
window.COLOR_PALETTE = COLOR_PALETTE;
window.CATEGORIES = CATEGORIES;
window.PRODUCTS = PRODUCTS;
window.getProductsByCategory = getProductsByCategory;
window.getProductById = getProductById;
window.calculatePrice = calculatePrice;
window.getCategoryName = getCategoryName;
window.getCategoryCount = getCategoryCount;
window.estimateCustomPrice = estimateCustomPrice;
window.getEnabledMaterials = getEnabledMaterials;
window.getEnabledColors = getEnabledColors;
