// Product Constants
export const PRODUCT_CATEGORIES = [
  'Electronics',
  'Food & Beverage',
  'Office Supplies',
  'Sports & Fitness',
  'Clothing',
  'Books',
  'Home & Garden',
  'Automotive',
  'Health & Beauty',
  'Toys & Games',
  'Other'
] as const

export const PRODUCT_STATUSES = [
  'In Stock',
  'Low Stock',
  'Out of Stock'
] as const

// UI Constants
export const SIDEBAR_VIEWS = {
  DASHBOARD: 'dashboard',
  ALL_PRODUCTS: 'all-products',
  LOW_STOCK: 'low-stock',
  OUT_OF_STOCK: 'out-of-stock',
  SALES_REPORT: 'sales-report',
  STOCK_MOVEMENT: 'stock-movement',
  SUPPLIER_REPORT: 'supplier-report',
  ADD_PRODUCT: 'add-product',
  IMPORT_DATA: 'import-data',
  EXPORT_DATA: 'export-data',
  SETTINGS: 'settings'
} as const

// Form Constants
export const FORM_MODES = {
  CREATE: 'create',
  EDIT: 'edit'
} as const

// Validation Constants
export const VALIDATION_RULES = {
  PRODUCT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100
  },
  SKU: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50
  },
  PRICE: {
    MIN: 0,
    MAX: 999999
  },
  QUANTITY: {
    MIN: 0,
    MAX: 999999
  }
} as const

// App Configuration
export const APP_CONFIG = {
  NAME: 'Stokku',
  DESCRIPTION: 'Inventory Management System',
  VERSION: '1.0.0',
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LOCALE: 'en-US'
} as const

// Table Configuration
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_DISPLAY_TEXT_LENGTH: 50
} as const

// Export all types
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]
export type ProductStatus = typeof PRODUCT_STATUSES[number]
export type SidebarView = typeof SIDEBAR_VIEWS[keyof typeof SIDEBAR_VIEWS]
export type FormMode = typeof FORM_MODES[keyof typeof FORM_MODES]
