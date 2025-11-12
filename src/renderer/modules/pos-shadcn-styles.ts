// POS Shadcn Styles
export function addPOSStyles() {
  const styleId = 'pos-shadcn-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .shadcn-pos {
      height: calc(100vh - var(--header-height));
      display: flex;
      flex-direction: column;
      background: var(--color-muted);
    }

    .pos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) var(--space-6);
      background: var(--color-background);
      border-bottom: 1px solid var(--color-border);
    }

    .pos-header-left {
      display: flex;
      align-items: center;
      gap: var(--space-6);
    }

    .pos-title {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--color-foreground);
    }

    .pos-status {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--color-muted);
      border-radius: var(--radius-md);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-success);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-text {
      font-size: var(--font-size-sm);
      color: var(--color-muted-foreground);
    }

    .pos-header-right {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      font-size: var(--font-size-sm);
      color: var(--color-muted-foreground);
    }

    .pos-container {
      flex: 1;
      display: grid;
      grid-template-columns: 2fr 1.5fr 300px;
      gap: var(--space-4);
      padding: var(--space-4);
      overflow: hidden;
    }

    /* Left Panel - Products */
    .pos-left-panel {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      height: 100%;
    }

    .pos-search-section {
      background: var(--color-background);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .pos-categories {
      display: flex;
      gap: var(--space-2);
      padding: var(--space-1);
      background: var(--color-background);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
    }

    .category-tab {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-muted-foreground);
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-all);
    }

    .category-tab:hover {
      background: var(--color-muted);
    }

    .category-tab.active {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .pos-products-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--color-background);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      overflow-y: auto;
    }

    .product-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-all);
    }

    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary);
    }

    .product-image {
      width: 60px;
      height: 60px;
      background: var(--color-muted);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-2xl);
    }

    .product-name {
      font-size: var(--font-size-sm);
      font-weight: 500;
      text-align: center;
      color: var(--color-foreground);
    }

    .product-price {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-primary);
    }

    .pos-quick-add {
      padding: var(--space-3);
    }

    .quick-add-header {
      margin-bottom: var(--space-3);
    }

    .quick-add-title {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-foreground);
    }

    .quick-add-form {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: var(--space-2);
    }

    /* Center Panel - Cart */
    .pos-center-panel {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      height: 100%;
    }

    .pos-customer-section {
      padding: var(--space-4);
    }

    .customer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .section-title {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--color-foreground);
    }

    .customer-search {
      position: relative;
    }

    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: var(--space-1);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      max-height: 200px;
      overflow-y: auto;
      display: none;
      z-index: 10;
    }

    .suggestion-item {
      padding: var(--space-3);
      cursor: pointer;
      transition: var(--transition-all);
    }

    .suggestion-item:hover {
      background: var(--color-muted);
    }

    .suggestion-name {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-foreground);
    }

    .suggestion-meta {
      font-size: var(--font-size-xs);
      color: var(--color-muted-foreground);
      margin-top: 2px;
    }

    .customer-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--color-muted);
      border-radius: var(--radius-md);
      margin-top: var(--space-3);
    }

    .customer-avatar {
      width: 40px;
      height: 40px;
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
    }

    .customer-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .customer-name {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-foreground);
    }

    .customer-meta {
      font-size: var(--font-size-xs);
      color: var(--color-muted-foreground);
    }

    .pos-cart-section {
      flex: 1;
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .cart-count {
      font-size: var(--font-size-sm);
      color: var(--color-muted-foreground);
    }

    .cart-items {
      flex: 1;
      overflow-y: auto;
    }

    .empty-cart {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--color-muted-foreground);
      gap: var(--space-2);
    }

    .empty-cart p {
      font-size: var(--font-size-base);
      font-weight: 500;
    }

    .empty-cart span {
      font-size: var(--font-size-sm);
    }

    .cart-item {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3);
      border-bottom: 1px solid var(--color-border);
    }

    .cart-item:last-child {
      border-bottom: none;
    }

    .item-info {
      flex: 1;
    }

    .item-name {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-foreground);
    }

    .item-price {
      font-size: var(--font-size-xs);
      color: var(--color-muted-foreground);
    }

    .item-quantity {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .quantity-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: var(--transition-all);
    }

    .quantity-btn:hover {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .quantity-value {
      font-size: var(--font-size-sm);
      font-weight: 500;
      min-width: 30px;
      text-align: center;
    }

    .item-total {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-foreground);
    }

    .pos-payment-section {
      padding: var(--space-4);
    }

    .payment-summary {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
      color: var(--color-muted-foreground);
    }

    .total-row {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-foreground);
    }

    /* Right Panel - Actions */
    .pos-right-panel {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      height: 100%;
    }

    .payment-methods {
      padding: var(--space-3);
    }

    .payment-methods .section-title {
      margin-bottom: var(--space-3);
    }

    .payment-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);
    }

    .payment-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-3);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-all);
    }

    .payment-option:hover {
      background: var(--color-muted);
    }

    .payment-option.active {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      border-color: var(--color-primary);
    }

    .payment-option span {
      font-size: var(--font-size-xs);
      font-weight: 500;
    }

    .pos-numpad {
      padding: var(--space-3);
    }

    .numpad-display {
      margin-bottom: var(--space-3);
    }

    .numpad-display input {
      text-align: right;
      font-size: var(--font-size-lg);
      font-weight: 600;
    }

    .numpad-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
    }

    .numpad-btn {
      padding: var(--space-3);
      font-size: var(--font-size-lg);
      font-weight: 500;
      background: var(--color-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition-all);
    }

    .numpad-btn:hover {
      background: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .pos-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: 0 var(--space-3);
    }

    .btn-block {
      width: 100%;
    }

    .btn-lg {
      height: 48px;
      font-size: var(--font-size-base);
    }

    .pos-shortcuts {
      padding: var(--space-3);
    }

    .shortcuts-title {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-muted-foreground);
      margin-bottom: var(--space-2);
    }

    .shortcut-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .shortcut-item {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs);
      color: var(--color-muted-foreground);
    }

    .shortcut-item kbd {
      padding: 2px 6px;
      background: var(--color-muted);
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
    }

    @media (max-width: 1200px) {
      .pos-container {
        grid-template-columns: 1fr 1fr;
      }
      
      .pos-right-panel {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .pos-container {
        grid-template-columns: 1fr;
      }
      
      .pos-left-panel {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
}
