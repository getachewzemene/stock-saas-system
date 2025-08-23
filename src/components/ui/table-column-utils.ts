/**
 * Utility functions for table column sizing and configuration
 */

export interface TableColumnConfig {
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  wrap?: boolean;
}

/**
 * Predefined column configurations for common table column types
 */
export const ColumnConfigs = {
  // ID columns - typically narrow
  id: {
    width: '80px',
    minWidth: '60px',
    maxWidth: '100px',
    align: 'left' as const,
    truncate: true,
  },

  // Name/Title columns - typically wider
  name: {
    width: '200px',
    minWidth: '150px',
    maxWidth: '300px',
    align: 'left' as const,
    truncate: true,
  },

  // Email columns
  email: {
    width: '200px',
    minWidth: '180px',
    maxWidth: '250px',
    align: 'left' as const,
    truncate: true,
  },

  // Phone columns
  phone: {
    width: '140px',
    minWidth: '120px',
    maxWidth: '180px',
    align: 'left' as const,
    truncate: true,
  },

  // Status columns
  status: {
    width: '120px',
    minWidth: '100px',
    maxWidth: '150px',
    align: 'center' as const,
    truncate: false,
  },

  // Role columns
  role: {
    width: '120px',
    minWidth: '100px',
    maxWidth: '150px',
    align: 'center' as const,
    truncate: false,
  },

  // Date/Time columns
  date: {
    width: '140px',
    minWidth: '120px',
    maxWidth: '180px',
    align: 'left' as const,
    truncate: false,
  },

  // Numeric columns (price, quantity, etc.)
  numeric: {
    width: '100px',
    minWidth: '80px',
    maxWidth: '120px',
    align: 'right' as const,
    truncate: false,
  },

  // Action columns (buttons, menus)
  actions: {
    width: '120px',
    minWidth: '100px',
    maxWidth: '150px',
    align: 'center' as const,
    truncate: false,
  },

  // SKU/Product Code columns
  sku: {
    width: '120px',
    minWidth: '100px',
    maxWidth: '150px',
    align: 'left' as const,
    truncate: true,
  },

  // Category columns
  category: {
    width: '150px',
    minWidth: '120px',
    maxWidth: '200px',
    align: 'left' as const,
    truncate: true,
  },

  // Location columns
  location: {
    width: '150px',
    minWidth: '120px',
    maxWidth: '200px',
    align: 'left' as const,
    truncate: true,
  },

  // Description columns - wider, can wrap
  description: {
    width: '300px',
    minWidth: '200px',
    maxWidth: '400px',
    align: 'left' as const,
    truncate: false,
    wrap: true,
  },

  // Checkbox/Selection columns
  checkbox: {
    width: '50px',
    minWidth: '40px',
    maxWidth: '60px',
    align: 'center' as const,
    truncate: false,
  },
};

/**
 * Get column configuration based on column key/type
 */
export function getColumnConfig(key: string): TableColumnConfig {
  switch (key.toLowerCase()) {
    case 'id':
    case 'uuid':
    case '_id':
      return ColumnConfigs.id;

    case 'name':
    case 'title':
    case 'fullname':
    case 'productname':
    case 'batchnumber':
      return ColumnConfigs.name;

    case 'email':
    case 'emailaddress':
      return ColumnConfigs.email;

    case 'phone':
    case 'phonenumber':
    case 'mobile':
    case 'telephone':
      return ColumnConfigs.phone;

    case 'status':
    case 'state':
    case 'condition':
      return ColumnConfigs.status;

    case 'role':
    case 'usertype':
    case 'permission':
      return ColumnConfigs.role;

    case 'date':
    case 'createdat':
    case 'updatedat':
    case 'expirydate':
    case 'manufacturingdate':
    case 'lastlogin':
    case 'completedat':
    case 'approvedat':
    case 'requestedat':
      return ColumnConfigs.date;

    case 'price':
    case 'cost':
    case 'quantity':
    case 'amount':
    case 'total':
    case 'subtotal':
    case 'discount':
    case 'tax':
    case 'stock':
    case 'available':
    case 'threshold':
    case 'currentvalue':
    case 'minstock':
    case 'maxstock':
      return ColumnConfigs.numeric;

    case 'actions':
    case 'action':
    case 'options':
      return ColumnConfigs.actions;

    case 'sku':
    case 'barcode':
    case 'productcode':
    case 'itemcode':
      return ColumnConfigs.sku;

    case 'category':
    case 'categoryname':
    case 'productcategory':
      return ColumnConfigs.category;

    case 'location':
    case 'locationname':
    case 'fromlocation':
    case 'tolocation':
    case 'warehouse':
      return ColumnConfigs.location;

    case 'description':
    case 'notes':
    case 'details':
    case 'comment':
    case 'message':
      return ColumnConfigs.description;

    case 'type':
    case 'severity':
    case 'priority':
    case 'level':
      return ColumnConfigs.status;

    default:
      // Default configuration for unknown columns
      return {
        width: '150px',
        minWidth: '100px',
        maxWidth: '200px',
        align: 'left' as const,
        truncate: true,
      };
  }
}

/**
 * Generate CSS classes for table cells based on configuration
 */
export function getCellClasses(config: TableColumnConfig, additionalClasses = ''): string {
  const classes = ['p-4', 'align-middle'];
  
  if (config.truncate) {
    classes.push('overflow-hidden', 'text-ellipsis', 'whitespace-nowrap');
  }
  
  if (config.wrap) {
    classes.push('whitespace-normal', 'break-words');
  }
  
  if (config.align === 'center') {
    classes.push('text-center');
  } else if (config.align === 'right') {
    classes.push('text-right');
  } else {
    classes.push('text-left');
  }
  
  if (additionalClasses) {
    classes.push(additionalClasses);
  }
  
  return classes.join(' ');
}

/**
 * Generate CSS styles for table cells based on configuration
 */
export function getCellStyles(config: TableColumnConfig): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  if (config.width) {
    styles.width = config.width;
    styles.minWidth = config.width;
    styles.maxWidth = config.width;
  } else {
    if (config.minWidth) styles.minWidth = config.minWidth;
    if (config.maxWidth) styles.maxWidth = config.maxWidth;
  }
  
  return styles;
}

/**
 * Generate CSS classes for table headers based on configuration
 */
export function getHeaderClasses(config: TableColumnConfig, additionalClasses = ''): string {
  const classes = ['p-4', 'text-left', 'font-semibold', 'text-foreground', 'whitespace-nowrap'];
  
  if (config.align === 'center') {
    classes.push('text-center');
  } else if (config.align === 'right') {
    classes.push('text-right');
  } else {
    classes.push('text-left');
  }
  
  if (additionalClasses) {
    classes.push(additionalClasses);
  }
  
  return classes.join(' ');
}

/**
 * Generate CSS styles for table headers based on configuration
 */
export function getHeaderStyles(config: TableColumnConfig): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  if (config.width) {
    styles.width = config.width;
    styles.minWidth = config.width;
    styles.maxWidth = config.width;
  } else {
    if (config.minWidth) styles.minWidth = config.minWidth;
    if (config.maxWidth) styles.maxWidth = config.maxWidth;
  }
  
  return styles;
}