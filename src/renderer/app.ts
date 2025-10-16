// Main renderer application
let currentUser: any = null;
let currentPage = 'dashboard';
let isLoggedIn = false;

// Toast notification system
function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Page navigation
function navigateTo(page: string) {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === page) {
      item.classList.add('active');
    }
  });
  
  currentPage = page;
  
  // Load page content
  switch (page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'pos':
      renderPOS();
      break;
    case 'history':
      renderHistory();
      break;
    case 'customers':
      renderCustomers();
      break;
    case 'templates':
      renderTemplates();
      break;
    case 'installments':
      renderInstallments();
      break;
    case 'users':
      renderUsers();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}





// Dashboard page
async function renderDashboard() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <h2 class="mb-4">Dashboard</h2>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="card">
        <h3>Today's Orders</h3>
        <div id="today-orders" style="font-size: 2rem; font-weight: bold; color: var(--color-primary);">-</div>
      </div>
      <div class="card">
        <h3>Today's Revenue</h3>
        <div id="today-revenue" style="font-size: 2rem; font-weight: bold; color: var(--color-success);">-</div>
      </div>
      <div class="card">
        <h3>7-Day Revenue</h3>
        <div id="week-revenue" style="font-size: 2rem; font-weight: bold; color: var(--color-info);">-</div>
      </div>
      <div class="card">
        <h3>Overdue Installments</h3>
        <div id="overdue-count" style="font-size: 2rem; font-weight: bold; color: var(--color-danger);">-</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Recent Orders</h3>
      </div>
      <div id="recent-orders-list">Loading...</div>
    </div>
  `;
  
  try {
    // Load today's stats
    const todayStats = await window.posAPI.dashboard.getStats('today');
    const weekStats = await window.posAPI.dashboard.getStats('7days');
    
    document.getElementById('today-orders')!.textContent = todayStats.orderCount.toString();
    document.getElementById('today-revenue')!.textContent = `₹${todayStats.revenue.toFixed(2)}`;
    document.getElementById('week-revenue')!.textContent = `₹${weekStats.revenue.toFixed(2)}`;
    document.getElementById('overdue-count')!.textContent = todayStats.overdueInstallments.toString();
    
    // Load recent orders
    const recentOrders = await window.posAPI.dashboard.getRecentOrders(10);
    
    const recentOrdersList = document.getElementById('recent-orders-list');
    if (recentOrdersList) {
      if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = '<p>No recent orders</p>';
      } else {
        recentOrdersList.innerHTML = `
          <table class="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${recentOrders.map((order: any) => `
                <tr>
                  <td>#${order.id}</td>
                  <td>${order.customer?.name || 'Walk-in'}</td>
                  <td>${new Date(order.created_at).toLocaleDateString()}</td>
                  <td>₹${order.grand_total.toFixed(2)}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" onclick="printOrder(${order.id})">Print</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }
  } catch (error: any) {
    showToast('Failed to load dashboard: ' + error.message, 'error');
  }
}

// POS page
async function renderPOS() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <h2 class="mb-4">Point of Sale</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 400px; gap: 1.5rem;">
      <!-- Left: Items Entry -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Add Items</h3>
        </div>
        
        <form id="add-item-form" class="mb-4">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 1rem; align-items: end;">
            <div class="form-group">
              <label>Item Name</label>
              <input type="text" id="item-name" required>
            </div>
            <div class="form-group">
              <label>Quantity</label>
              <input type="number" id="item-quantity" min="0.01" step="0.01" value="1" required>
            </div>
            <div class="form-group">
              <label>Unit Price (₹)</label>
              <input type="number" id="item-price" min="0" step="0.01" required>
            </div>
            <button type="submit" class="btn btn-primary">Add</button>
          </div>
        </form>
        
        <div id="items-list">
          <p class="text-center" style="color: var(--color-text-tertiary); padding: 2rem;">
            No items added yet
          </p>
        </div>
      </div>

      <!-- Left: Frequent Orders -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Frequent Items</h3>
        </div>
        <div style="padding: 1rem;">
          <form id="save-frequent-form" class="mb-3" style="display:flex; gap:.5rem;">
            <input type="text" id="frequent-label" placeholder="Label for current items" style="flex:1;">
            <button type="submit" class="btn btn-secondary">Save</button>
          </form>
          <div id="frequent-orders-list">
            <p class="text-center" style="color: var(--color-text-tertiary);">No frequent items yet</p>
          </div>
        </div>
      </div>
      
      <!-- Right: Order Summary -->
      <div>
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="card-title">Customer</h3>
          </div>
          
          <div class="form-group">
            <label>Customer Name</label>
            <input type="text" id="customer-search" placeholder="Search or add new...">
            <div id="customer-suggestions" style="display: none;"></div>
          </div>
          
          <div id="selected-customer" style="display: none;">
            <p><strong id="customer-name-display"></strong></p>
            <button class="btn btn-sm btn-secondary" onclick="clearCustomer()">Clear</button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Order Summary</h3>
          </div>
          
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Subtotal:</span>
              <strong id="order-subtotal">₹0.00</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Tax:</span>
              <strong id="order-tax">₹0.00</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.25rem; padding-top: 0.5rem; border-top: 2px solid var(--color-border);">
              <strong>Total:</strong>
              <strong id="order-total" style="color: var(--color-primary);">₹0.00</strong>
            </div>
          </div>
          
          <button id="finalize-btn" class="btn btn-success btn-block mb-2" onclick="finalizeOrder()">
            Finalize & Print
          </button>
          <button class="btn btn-secondary btn-block" onclick="clearOrder()">
            Clear Order
          </button>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Open Orders</h3>
          </div>
          <div style="padding: 1rem;">
            <form id="save-open-form" style="display:flex; gap:.5rem; margin-bottom:.5rem;">
              <input id="open-name" type="text" placeholder="Ticket name" style="flex:1;" />
              <button class="btn btn-secondary" type="submit">Save</button>
            </form>
            <div id="open-orders-list">
              <p class="text-center" style="color: var(--color-text-tertiary);">No open orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Initialize POS
  initializePOS();
  // Load frequent and open orders
  loadFrequentOrders();
  loadOpenOrders();
}

let currentItems: any[] = [];
let selectedCustomer: any = null;

function initializePOS() {
  const form = document.getElementById('add-item-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addItemToOrder();
    });
  }

  // Customer search with debounce
  const searchInput = document.getElementById('customer-search') as HTMLInputElement | null;
  if (searchInput) {
    let timer: any = null;
    searchInput.addEventListener('input', () => {
      if (timer) clearTimeout(timer);
      const q = searchInput.value.trim();
      if (!q) {
        hideCustomerSuggestions();
        return;
      }
      timer = setTimeout(() => customerSearch(q), 250);
    });
  }

  // Save frequent
  const saveForm = document.getElementById('save-frequent-form');
  if (saveForm) {
    saveForm.addEventListener('submit', saveFrequentFromCurrent);
  }

  const saveOpenForm = document.getElementById('save-open-form');
  if (saveOpenForm) {
    saveOpenForm.addEventListener('submit', saveOpenFromCurrent);
  }
}

function addItemToOrder() {
  const name = (document.getElementById('item-name') as HTMLInputElement).value;
  const quantity = parseFloat((document.getElementById('item-quantity') as HTMLInputElement).value);
  const unitPrice = parseFloat((document.getElementById('item-price') as HTMLInputElement).value);
  
  if (quantity <= 0) {
    showToast('Quantity must be greater than 0', 'error');
    return;
  }
  
  if (unitPrice < 0) {
    showToast('Price cannot be negative', 'error');
    return;
  }
  
  const lineTotal = quantity * unitPrice;
  
  currentItems.push({
    name,
    quantity,
    unit_price: unitPrice,
    line_total: lineTotal
  });
  
  updateItemsList();
  updateOrderTotals();
  
  // Clear form
  (document.getElementById('item-name') as HTMLInputElement).value = '';
  (document.getElementById('item-quantity') as HTMLInputElement).value = '1';
  (document.getElementById('item-price') as HTMLInputElement).value = '';
  document.getElementById('item-name')?.focus();
}

function updateItemsList() {
  const itemsList = document.getElementById('items-list');
  if (!itemsList) return;
  
  if (currentItems.length === 0) {
    itemsList.innerHTML = '<p class="text-center" style="color: var(--color-text-tertiary); padding: 2rem;">No items added yet</p>';
    return;
  }
  
  itemsList.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${currentItems.map((item, index) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.unit_price.toFixed(2)}</td>
            <td>₹${item.line_total.toFixed(2)}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="removeItem(${index})">×</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function removeItem(index: number) {
  currentItems.splice(index, 1);
  updateItemsList();
  updateOrderTotals();
}

async function updateOrderTotals() {
  const subtotal = currentItems.reduce((sum, item) => sum + item.line_total, 0);
  
  // Get tax settings
  const settings = await window.posAPI.settings.get();
  const taxRate = settings.tax_enabled ? 0 : 0; // Tax disabled by default
  const taxTotal = subtotal * taxRate;
  const grandTotal = subtotal + taxTotal;
  
  document.getElementById('order-subtotal')!.textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('order-tax')!.textContent = `₹${taxTotal.toFixed(2)}`;
  document.getElementById('order-total')!.textContent = `₹${grandTotal.toFixed(2)}`;
}

function clearOrder() {
  currentItems = [];
  selectedCustomer = null;
  updateItemsList();
  updateOrderTotals();
  showToast('Order cleared', 'info');
}

function clearCustomer() {
  selectedCustomer = null;
  document.getElementById('selected-customer')!.style.display = 'none';
  (document.getElementById('customer-search') as HTMLInputElement).value = '';
  hideCustomerSuggestions();
}

async function finalizeOrder() {
  if (currentItems.length === 0) {
    showToast('Please add items to the order', 'warning');
    return;
  }
  
  try {
    const settings = await window.posAPI.settings.get();
    const subtotal = currentItems.reduce((sum, item) => sum + item.line_total, 0);
    const taxRate = settings.tax_enabled ? 0 : 0;
    const taxTotal = subtotal * taxRate;
    const grandTotal = subtotal + taxTotal;
    
    const order = await window.posAPI.orders.create({
      user_id: currentUser.id,
      customer_id: selectedCustomer?.id,
      subtotal,
      tax_rate: taxRate,
      tax_total: taxTotal,
      grand_total: grandTotal,
      status: 'draft',
      is_installment: false
    }, currentItems);
    
    // Finalize the order
    await window.posAPI.orders.finalize(order.id);
    
    // Print
    const printed = await window.posAPI.print.printDirect(order.id);
    if (!printed) {
      const pdfPath = await window.posAPI.print.generatePDF(order.id);
      showToast(`Print failed. PDF saved to: ${pdfPath}`, 'warning');
    } else {
      showToast('Order finalized and printed successfully!', 'success');
    }
    
    clearOrder();
  } catch (error: any) {
    showToast('Failed to finalize order: ' + error.message, 'error');
  }
}

async function printOrder(orderId: number) {
  try {
    const printed = await window.posAPI.print.printDirect(orderId);
    if (!printed) {
      const pdfPath = await window.posAPI.print.generatePDF(orderId);
      showToast(`Print failed. PDF saved to: ${pdfPath}`, 'warning');
    } else {
      showToast('Order printed successfully!', 'success');
    }
  } catch (error: any) {
    showToast('Print failed: ' + error.message, 'error');
  }
}

// History page
async function renderHistory() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <h2 class="mb-4">Order History</h2>
    
    <div class="card">
      <div id="orders-list">Loading...</div>
    </div>
  `;
  
  try {
    const orders = await window.posAPI.orders.getAll();
    
    const ordersList = document.getElementById('orders-list');
    if (ordersList) {
      if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found</p>';
      } else {
        ordersList.innerHTML = `
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map((order: any) => `
                <tr>
                  <td>#${order.id}</td>
                  <td>${new Date(order.created_at).toLocaleString()}</td>
                  <td>${order.customer?.name || 'Walk-in'}</td>
                  <td>₹${order.grand_total.toFixed(2)}</td>
                  <td><span class="badge badge-${order.status === 'finalized' ? 'success' : 'secondary'}">${order.status}</span></td>
                  <td>
                    <button class="btn btn-sm btn-primary" onclick="printOrder(${order.id})">Print</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }
  } catch (error: any) {
    showToast('Failed to load orders: ' + error.message, 'error');
  }
}

// Customers page
async function renderCustomers() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <div class="flex-between mb-4">
      <h2>Customers</h2>
    </div>
    
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">Add Customer</h3>
      </div>
      <div style="padding: 1rem;">
        <form id="add-customer-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
          <div class="form-group">
            <label>Name</label>
            <input id="cust-name" type="text" required>
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input id="cust-phone" type="text">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input id="cust-email" type="email">
          </div>
          <div class="form-group">
            <label>GSTIN</label>
            <input id="cust-gstin" type="text">
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Address</label>
            <input id="cust-address" type="text">
          </div>
          <div style="grid-column: 1 / -1;">
            <button class="btn btn-primary" type="submit">Create Customer</button>
          </div>
        </form>
      </div>
    </div>
    
    <div class="card">
      <div id="customers-list">Loading...</div>
    </div>
  `;
  
  try {
    const customers = await window.posAPI.customers.getAll();
    
    const customersList = document.getElementById('customers-list');
    if (customersList) {
      if (customers.length === 0) {
        customersList.innerHTML = '<p>No customers found</p>';
      } else {
        customersList.innerHTML = `
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>GSTIN</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map((customer: any) => `
                <tr>
                  <td>${customer.name}</td>
                  <td>${customer.phone || '-'}</td>
                  <td>${customer.email || '-'}</td>
                  <td>${customer.gstin || '-'}</td>
                  <td>${new Date(customer.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }
    // Wire up create form
    const addForm = document.getElementById('add-customer-form');
    if (addForm) {
      addForm.addEventListener('submit', handleCreateCustomer);
    }
  } catch (error: any) {
    showToast('Failed to load customers: ' + error.message, 'error');
  }
}

function showAddCustomerModal() {
  showToast('Customer creation modal - to be implemented', 'info');
}

// Templates page
async function renderTemplates() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  if (currentUser?.role !== 'admin') {
    contentArea.innerHTML = '<h2>Unauthorized</h2>';
    return;
  }
  
  contentArea.innerHTML = `
    <div class="flex-between mb-4">
      <h2>Invoice Templates</h2>
      <button class="btn btn-primary" onclick="createNewTemplate()">Create Template</button>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 400px; gap: 1.5rem;">
      <!-- Template List -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Templates</h3>
        </div>
        <div id="templates-list">Loading...</div>
      </div>
      
      <!-- Template Editor -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Template Editor</h3>
        </div>
        <div id="template-editor" style="padding: 1rem;">
          <p class="text-center" style="color: var(--color-text-tertiary);">Select a template to edit</p>
        </div>
      </div>
    </div>
    
    <!-- Preview Modal -->
    <div id="template-preview-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
          <h3>Template Preview</h3>
          <button onclick="closeTemplatePreview()">&times;</button>
        </div>
        <div id="template-preview-content"></div>
      </div>
    </div>
  `;
  
  await loadTemplatesList();
}

async function loadTemplatesList() {
  try {
    const templates = await window.posAPI.templates.getAll();
    const listDiv = document.getElementById('templates-list');
    if (!listDiv) return;
    
    if (templates.length === 0) {
      listDiv.innerHTML = '<p>No templates found</p>';
    } else {
      listDiv.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Default</th>
              <th>Size</th>
              <th>Layout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${templates.map((t: any) => `
              <tr>
                <td>${t.name}</td>
                <td>${t.is_default ? '✓ Default' : ''}</td>
                <td>${t.preferred_bill_size || 'A4'}</td>
                <td>${t.preferred_layout || 'Classic'}</td>
                <td>
                  <button class="btn btn-sm" onclick="editTemplate(${t.id})">Edit</button>
                  <button class="btn btn-sm" onclick="previewTemplate(${t.id})">Preview</button>
                  ${!t.is_default ? `
                    <button class="btn btn-sm" onclick="setDefaultTemplate(${t.id})">Set Default</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${t.id})">Delete</button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } catch (error: any) {
    showToast('Failed to load templates: ' + error.message, 'error');
  }
}

async function editTemplate(templateId: number) {
  try {
    const template = await window.posAPI.templates.getById(templateId);
    const assets = await window.posAPI.templates.getAssets(templateId);
    
    if (!template) return;
    
    const headerData = JSON.parse(template.header_json || '{}');
    const footerData = JSON.parse(template.footer_json || '{}');
    const editorDiv = document.getElementById('template-editor');
    
    if (!editorDiv) return;
    
    editorDiv.innerHTML = `
      <form id="template-form">
        <h4>${template.name}</h4>
        
        <div class="form-group">
          <label>Business Name</label>
          <input type="text" id="business-name" value="${headerData.businessName || ''}">
        </div>
        
        <div class="form-group">
          <label>Business Address</label>
          <textarea id="business-address" rows="2">${headerData.businessAddress || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label>Phone</label>
          <input type="text" id="business-phone" value="${headerData.businessPhone || ''}">
        </div>
        
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="business-email" value="${headerData.businessEmail || ''}">
        </div>
        
        <div class="form-group">
          <label>Tax ID/GSTIN</label>
          <input type="text" id="business-taxid" value="${headerData.businessTaxId || ''}">
        </div>
        
        <div class="form-group">
          <label>Footer Text</label>
          <textarea id="footer-text" rows="2">${headerData.footerText || 'Thank you for your business!'}</textarea>
        </div>
        
        <div class="form-group">
          <label>Preferred Bill Size</label>
          <select id="bill-size">
            <option value="A3" ${template.preferred_bill_size === 'A3' ? 'selected' : ''}>A3</option>
            <option value="A4" ${template.preferred_bill_size === 'A4' ? 'selected' : ''}>A4</option>
            <option value="A5" ${template.preferred_bill_size === 'A5' ? 'selected' : ''}>A5</option>
            <option value="Letter" ${template.preferred_bill_size === 'Letter' ? 'selected' : ''}>Letter</option>
            <option value="Legal" ${template.preferred_bill_size === 'Legal' ? 'selected' : ''}>Legal</option>
            <option value="Thermal80" ${template.preferred_bill_size === 'Thermal80' ? 'selected' : ''}>80mm Thermal</option>
            <option value="Thermal58" ${template.preferred_bill_size === 'Thermal58' ? 'selected' : ''}>58mm Thermal</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Layout</label>
          <select id="layout">
            <option value="Classic" ${template.preferred_layout === 'Classic' ? 'selected' : ''}>Classic</option>
            <option value="Minimal" ${template.preferred_layout === 'Minimal' ? 'selected' : ''}>Minimal</option>
            <option value="Compact" ${template.preferred_layout === 'Compact' ? 'selected' : ''}>Compact</option>
            <option value="Detailed" ${template.preferred_layout === 'Detailed' ? 'selected' : ''}>Detailed</option>
          </select>
        </div>
        
        <hr>
        <h5>Logo</h5>
        <div id="logo-section">
          ${assets.find((a: any) => a.type === 'logo') ? 
            '<p>Logo uploaded ✓</p>' : 
            '<p>No logo</p>'
          }
          <button type="button" class="btn btn-sm" onclick="uploadLogo(${templateId})">Upload Logo</button>
        </div>
        
        <hr>
        <h5>QR Codes</h5>
        <div id="qr-codes-list">
          ${assets.filter((a: any) => a.type === 'qr').map((qr: any) => {
            const meta = JSON.parse(qr.meta_json);
            return `
              <div class="qr-item" style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                <strong>${meta.label}</strong><br>
                <small>${meta.data}</small><br>
                <button class="btn btn-sm btn-danger" onclick="removeQRCode(${qr.id})">Remove</button>
              </div>
            `;
          }).join('') || '<p>No QR codes</p>'}
        </div>
        <button type="button" class="btn btn-sm" onclick="addQRCode(${templateId})">Add QR Code</button>
        
        <hr>
        <button type="submit" class="btn btn-primary btn-block">Save Template</button>
      </form>
    `;
    
    // Setup form handler
    const form = document.getElementById('template-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveTemplate(templateId);
      });
    }
  } catch (error: any) {
    showToast('Failed to load template: ' + error.message, 'error');
  }
}

// Users page
async function renderUsers() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  if (currentUser?.role !== 'admin') {
    contentArea.innerHTML = '<h2>Unauthorized</h2>';
    return;
  }
  
  contentArea.innerHTML = `
    <div class="flex-between mb-4">
      <h2>Users</h2>
      <button class="btn btn-primary" onclick="showCreateUserModal()">Add User</button>
    </div>
    
    <div class="card">
      <div id="users-list">Loading...</div>
    </div>
    
    <!-- Create User Modal -->
    <div id="create-user-modal" class="modal" style="display:none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create User</h3>
          <button onclick="closeCreateUserModal()">&times;</button>
        </div>
        <form id="create-user-form">
          <div class="form-group">
            <label>Username</label>
            <input type="text" id="new-username" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="new-password" required>
          </div>
          <div class="form-group">
            <label>Role</label>
            <select id="new-role" required>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Create</button>
        </form>
      </div>
    </div>
  `;
  
  try {
    const users = await window.posAPI.users.getAll();
    const usersList = document.getElementById('users-list');
    if (usersList) {
      usersList.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((user: any) => `
              <tr>
                <td>${user.username}</td>
                <td><span class="badge badge-${user.role === 'admin' ? 'primary' : 'secondary'}">${user.role}</span></td>
                <td><span class="badge badge-${user.active ? 'success' : 'danger'}">${user.active ? 'Active' : 'Inactive'}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  ${user.id !== currentUser?.id ? `
                    <button class="btn btn-sm" onclick="toggleUserStatus(${user.id}, ${!user.active})">
                      ${user.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                  ` : '<span class="text-muted">Current User</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
    
    // Setup form handler
    const form = document.getElementById('create-user-form');
    if (form) {
      form.addEventListener('submit', handleCreateUser);
    }
  } catch (error: any) {
    showToast('Failed to load users: ' + error.message, 'error');
  }
}

// Installments page with enhanced creation wizard
async function renderInstallments() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <div class="flex-between mb-4">
      <h2>Installments</h2>
      <button class="btn btn-primary" onclick="showInstallmentWizard()">Create Installment Plan</button>
    </div>
    
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">Overdue Installments</h3>
      </div>
      <div id="overdue-installments">Loading...</div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Active Plans</h3>
      </div>
      <div id="active-plans">Loading...</div>
    </div>
    
    <!-- Installment Creation Wizard Modal -->
    <div id="installment-wizard-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3>Create Installment Plan</h3>
          <button onclick="closeInstallmentWizard()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Order</label>
            <select id="installment-order" class="form-control">
              <option value="">Select an order...</option>
            </select>
          </div>
          <div class="form-group">
            <label>Number of Installments</label>
            <input type="number" id="num-installments" min="2" max="36" value="3" class="form-control">
          </div>
          <div class="form-group">
            <label>Frequency</label>
            <select id="installment-frequency" class="form-control">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="monthly" selected>Monthly</option>
            </select>
          </div>
          <div class="form-group">
            <label>Down Payment (₹)</label>
            <input type="number" id="down-payment" min="0" value="0" class="form-control">
          </div>
          <button class="btn btn-primary" onclick="createInstallmentPlan()">Create Plan</button>
        </div>
      </div>
    </div>
  `;
  
  try {
    // Load overdue installments
    const overdueList = await window.posAPI.installments.getOverdue();
    const overdueDiv = document.getElementById('overdue-installments');
    if (overdueDiv) {
      if (overdueList.length === 0) {
        overdueDiv.innerHTML = '<p>No overdue installments</p>';
      } else {
        overdueDiv.innerHTML = `
          <table class="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Days Overdue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${overdueList.map((inst: any) => `
                <tr>
                  <td>${inst.customer?.name || 'Unknown'}</td>
                  <td>${new Date(inst.due_date).toLocaleDateString()}</td>
                  <td>₹${inst.amount_due.toFixed(2)}</td>
                  <td>${Math.floor((Date.now() - new Date(inst.due_date).getTime()) / (1000 * 60 * 60 * 24))} days</td>
                  <td>
                    <button class="btn btn-sm btn-primary" onclick="recordPayment(${inst.id})">Record Payment</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }
    
    // Load active plans
    const activePlans = await window.posAPI.installments.getActivePlans();
    const plansDiv = document.getElementById('active-plans');
    if (plansDiv) {
      if (activePlans.length === 0) {
        plansDiv.innerHTML = '<p>No active installment plans</p>';
      } else {
        plansDiv.innerHTML = `
          <table class="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Principal</th>
                <th>Frequency</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${activePlans.map((plan: any) => `
                <tr>
                  <td>#${plan.order_id}</td>
                  <td>${plan.customer?.name || 'Unknown'}</td>
                  <td>₹${plan.principal.toFixed(2)}</td>
                  <td>${plan.frequency}</td>
                  <td>${plan.paid_count}/${plan.total_count}</td>
                  <td>
                    <button class="btn btn-sm" onclick="viewInstallmentDetails(${plan.id})">View Details</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }
  } catch (error: any) {
    showToast('Failed to load installments: ' + error.message, 'error');
  }
}


// Settings page
async function renderSettings() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <h2 class="mb-4">Settings</h2>
    
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">General Settings</h3>
      </div>
      <div id="settings-form">Loading...</div>
    </div>
    
    <div class="card mb-4">
      <div class="card-header">
        <h3 class="card-title">License Management</h3>
      </div>
      <div id="license-management">
        <div id="license-info-display">Loading license information...</div>
        <div style="margin-top: 20px;">
          <button class="btn btn-primary" onclick="showLicenseActivation()">Activate New License</button>
          <button class="btn btn-secondary" onclick="importLicenseFile()">Import License File</button>
          <button class="btn btn-secondary" onclick="checkLicenseUpdates()">Check for Updates</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Backups</h3>
      </div>
      <div>
        <p id="last-backup-time">Last backup: Never</p>
        <button class="btn btn-primary" onclick="createBackup()">Create Backup Now</button>
        <button class="btn btn-secondary" onclick="restoreBackup()" style="margin-left: 10px;">Restore from Backup</button>
      </div>
    </div>
  `;
  
  try {
    const settings = await window.posAPI.settings.get();
    const lastBackup = await window.posAPI.backups.getLastBackupTime();
    
    // Load license info
    const licenseInfo = await window.posAPI.license.getInfo();
    const licenseDisplay = document.getElementById('license-info-display');
    if (licenseDisplay && licenseInfo) {
      licenseDisplay.innerHTML = `
        <div class="license-details">
          <p><strong>Plan:</strong> ${licenseInfo.plan}</p>
          <p><strong>Status:</strong> <span class="${licenseInfo.isValid ? 'text-success' : 'text-danger'}">${licenseInfo.status}</span></p>
          <p><strong>Expires:</strong> ${licenseInfo.expiryDate ? new Date(licenseInfo.expiryDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Days Remaining:</strong> ${licenseInfo.daysRemaining}</p>
          ${licenseInfo.status === 'grace' ? `<p class="text-warning"><strong>Grace Period:</strong> ${licenseInfo.graceRemaining} days</p>` : ''}
          
          <details style="margin-top: 10px;">
            <summary style="cursor: pointer;"><strong>Features</strong></summary>
            <ul style="font-size: 0.9em; margin-top: 10px;">
              <li>Max Users: ${licenseInfo.features.maxUsers === -1 ? 'Unlimited' : licenseInfo.features.maxUsers}</li>
              <li>Max Orders: ${licenseInfo.features.maxOrders === -1 ? 'Unlimited' : licenseInfo.features.maxOrders}</li>
              <li>Export Data: ${licenseInfo.features.canExport ? '✓' : '✗'}</li>
              <li>Multiple Templates: ${licenseInfo.features.multipleTemplates ? '✓' : '✗'}</li>
              <li>Advanced Reports: ${licenseInfo.features.advancedReports ? '✓' : '✗'}</li>
              <li>Support: ${licenseInfo.features.phoneSupport ? 'Phone + Email' : licenseInfo.features.emailSupport ? 'Email Only' : 'None'}</li>
            </ul>
          </details>
        </div>
      `;
      // Update global license info
      globalLicenseInfo = licenseInfo;
    }
    
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.innerHTML = `
        <form id="update-settings-form">
          <div class="form-group">
            <label>Currency</label>
            <input type="text" value="${settings.default_currency}" readonly>
          </div>
          <div class="form-group">
            <label>Locale</label>
            <input type="text" value="${settings.locale}" readonly>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="tax-enabled" ${settings.tax_enabled ? 'checked' : ''}> Enable Tax
            </label>
          </div>
          <p style="color: var(--color-text-secondary); font-size: 0.875rem;">
            Settings management - to be fully implemented
          </p>
        </form>
      `;
      // Wire tax toggle update
      const taxToggle = document.getElementById('tax-enabled') as HTMLInputElement | null;
      if (taxToggle) {
        taxToggle.addEventListener('change', async () => {
          try {
            await window.posAPI.settings.update({ tax_enabled: taxToggle.checked });
            showToast('Tax setting updated', 'success');
            updateOrderTotals();
          } catch (err: any) {
            showToast('Failed to update settings: ' + (err.message || err), 'error');
            taxToggle.checked = !taxToggle.checked;
          }
        });
      }
    }
    
    if (lastBackup) {
      document.getElementById('last-backup-time')!.textContent = 
        `Last backup: ${new Date(lastBackup).toLocaleString()}`;
    }
    
  } catch (error: any) {
    showToast('Failed to load settings: ' + error.message, 'error');
  }
}

async function createBackup() {
  try {
    const backupPath = await window.posAPI.backups.create();
    showToast(`Backup created: ${backupPath}`, 'success');
    renderSettings(); // Refresh to show new backup time
  } catch (error: any) {
    showToast('Backup failed: ' + error.message, 'error');
  }
}

async function restoreBackup() {
  const warning = `WARNING: Restoring a backup will replace ALL current data!\n\nThis action cannot be undone.\n\nDo you want to continue?`;
  
  if (!confirm(warning)) return;
  
  const backupFile = prompt('Enter the full path to the backup file:');
  if (!backupFile) return;
  
  try {
    await window.posAPI.backups.restore(backupFile);
    showToast('Backup restored successfully. The application will reload.', 'success');
    
    // Reload the application after a short delay
    setTimeout(() => {
      location.reload();
    }, 2000);
  } catch (error: any) {
    showToast('Restore failed: ' + error.message, 'error');
  }
}

// Login functionality
async function showLoginPage() {
  const app = document.getElementById('app-page');
  if (!app) return;
  
  app.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <h1 class="login-title">Welcome back</h1>
        <p class="login-subtitle">Enter your credentials to access SimplePOS</p>
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label for="login-username" class="form-label">Username</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input type="text" id="login-username" class="form-input with-icon" placeholder="Enter username" required autofocus>
            </div>
          </div>
          <div class="form-group">
            <label for="login-password" class="form-label">Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input type="password" id="login-password" class="form-input with-icon" placeholder="Enter password" required>
              <button type="button" class="password-toggle" onclick="togglePassword()">
                <svg id="eye-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">
            Sign in
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </form>
        <div class="login-footer">
          <p class="login-hint">Demo credentials: admin / admin</p>
        </div>
      </div>
      <div class="login-bg-pattern"></div>
    </div>
  `;
  
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', handleLogin);
  }
}

function togglePassword() {
  const passwordInput = document.getElementById('login-password') as HTMLInputElement;
  const eyeIcon = document.getElementById('eye-icon');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
    }
  } else {
    passwordInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  }
}

async function handleLogin(e: Event) {
  e.preventDefault();
  const username = (document.getElementById('login-username') as HTMLInputElement).value;
  const password = (document.getElementById('login-password') as HTMLInputElement).value;
  
  try {
    const user = await window.posAPI.auth.login(username, password);
    if (user) {
      currentUser = user;
      isLoggedIn = true;
      showMainApp();
      navigateTo('dashboard');
      showToast(`Welcome, ${user.username}!`, 'success');
    } else {
      showToast('Invalid username or password', 'error');
    }
  } catch (error: any) {
    showToast('Login failed: ' + error.message, 'error');
  }
}

function showMainApp() {
  const app = document.getElementById('app-page');
  if (!app) return;
  
  app.innerHTML = `
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <h1 class="app-title">SimplePOS</h1>
      </div>
      <div class="header-right">
        <span class="user-info">User: ${currentUser?.username} (${currentUser?.role})</span>
        <span id="license-status" class="license-status" style="margin: 0 10px; font-size: 0.9em;">
          ${globalLicenseInfo ? `${globalLicenseInfo.plan}: ${globalLicenseInfo.daysRemaining > 0 ? globalLicenseInfo.daysRemaining + ' days' : 'Expired'}` : ''}
        </span>
        <button class="btn btn-sm" onclick="logout()">Logout</button>
      </div>
    </header>
    
    <!-- Navigation -->
    <nav class="app-nav">
      <a href="#dashboard" class="nav-item active" data-page="dashboard" data-role="all">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </span>
        <span class="nav-label">Dashboard</span>
      </a>
      <a href="#pos" class="nav-item" data-page="pos" data-role="all">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </span>
        <span class="nav-label">POS</span>
      </a>
      <a href="#history" class="nav-item" data-page="history" data-role="admin,user">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </span>
        <span class="nav-label">History</span>
      </a>
      <a href="#customers" class="nav-item" data-page="customers" data-role="all">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </span>
        <span class="nav-label">Customers</span>
      </a>
      <a href="#templates" class="nav-item" data-page="templates" data-role="admin">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="9"></line>
            <line x1="9" y1="13" x2="15" y2="13"></line>
            <line x1="9" y1="17" x2="13" y2="17"></line>
          </svg>
        </span>
        <span class="nav-label">Templates</span>
      </a>
      <a href="#installments" class="nav-item" data-page="installments" data-role="admin,user">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </span>
        <span class="nav-label">Installments</span>
      </a>
      <a href="#users" class="nav-item" data-page="users" data-role="admin">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
        <span class="nav-label">Users</span>
      </a>
      <a href="#settings" class="nav-item" data-page="settings" data-role="admin">
        <span class="nav-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24"></path>
          </svg>
        </span>
        <span class="nav-label">Settings</span>
      </a>
    </nav>
    
    <!-- Main Content -->
    <main class="app-main">
      <div id="content-area"></div>
    </main>
    
    <!-- Status Bar -->
    <footer class="app-footer">
      <div class="footer-left">
        <span id="db-status">Database: Connected</span>
      </div>
      <div class="footer-right">
        <span>Powered by YourBrand</span>
      </div>
    </footer>
  `;
  
  // Setup navigation handlers
  document.querySelectorAll('.nav-item').forEach(item => {
    const role = item.getAttribute('data-role');
    if (role && role !== 'all') {
      const roles = role.split(',');
      if (!roles.includes(currentUser?.role)) {
        (item as HTMLElement).style.display = 'none';
      }
    }
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page');
      if (page) {
        navigateTo(page);
      }
    });
  });
}

async function logout() {
  await window.posAPI.auth.logout();
  currentUser = null;
  isLoggedIn = false;
  showLoginPage();
  showToast('Logged out successfully', 'info');
}

// Global license info
let globalLicenseInfo: any = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[RENDERER] App initializing...');
  
  // Initialize dark mode
  initializeDarkMode();
  
  // Check if user is already logged in (session restoration)
  try {
    const user = await window.posAPI.auth.getCurrentUser();
    if (user) {
      currentUser = user;
      isLoggedIn = true;
      
      // Check license before showing main app
      const licenseValid = await checkLicense();
      if (!licenseValid) {
        showLicenseExpiredPage();
      } else {
        showMainApp();
        navigateTo('dashboard');
        startLicenseMonitoring();
      }
    } else {
      showLoginPage();
    }
  } catch (error) {
    console.error('Failed to check current user:', error);
    showLoginPage();
  }
  
  console.log('[RENDERER] App initialized');
});

// Check license validity
async function checkLicense(): Promise<boolean> {
  try {
    globalLicenseInfo = await window.posAPI.license.getInfo();
    
    if (!globalLicenseInfo.isValid) {
      if (globalLicenseInfo.status === 'tampered') {
        alert('License validation failed: System clock manipulation detected.\n\nPlease correct your system time and restart the application.');
        return false;
      }
      return false;
    }
    
    // Show warnings for expiring licenses
    if (globalLicenseInfo.daysRemaining <= 7 && globalLicenseInfo.daysRemaining > 0) {
      showToast(`⚠️ License expires in ${globalLicenseInfo.daysRemaining} days`, 'warning');
    }
    
    // Show grace period warning
    if (globalLicenseInfo.status === 'grace') {
      showToast(`⚠️ License expired! ${globalLicenseInfo.graceRemaining} days grace period remaining`, 'warning');
    }
    
    return true;
  } catch (error: any) {
    console.error('License check failed:', error);
    return false;
  }
}

// Start periodic license monitoring
function startLicenseMonitoring() {
  // Check every hour
  setInterval(async () => {
    const valid = await checkLicense();
    if (!valid) {
      showLicenseExpiredPage();
    }
  }, 60 * 60 * 1000);
  
  // Update license display every minute
  setInterval(() => {
    updateLicenseDisplay();
  }, 60 * 1000);
}

// Show license expired page
function showLicenseExpiredPage() {
  const app = document.getElementById('app-page');
  if (!app) return;
  
  app.innerHTML = `
    <div class="license-expired-container">
      <div class="license-card">
        <h1 class="text-danger">License ${globalLicenseInfo?.status === 'grace' ? 'Grace Period' : 'Expired'}</h1>
        <div class="license-message">
          ${globalLicenseInfo ? `
            <p>${globalLicenseInfo.message}</p>
            ${globalLicenseInfo.status === 'grace' ? 
              `<p class="text-warning">Grace period: ${globalLicenseInfo.graceRemaining} days remaining</p>` :
              '<p class="text-danger">Your license has fully expired.</p>'
            }
          ` : '<p>Unable to verify license status.</p>'}
        </div>
        
        <div class="license-actions">
          <button class="btn btn-primary" onclick="showLicenseActivation()">Activate License</button>
          <button class="btn btn-secondary" onclick="importLicenseFile()">Import License File</button>
          ${globalLicenseInfo?.status === 'grace' ? 
            '<button class="btn btn-warning" onclick="continueWithGrace()">Continue (Limited)</button>' : ''
          }
        </div>
        
        <div class="license-help">
          <p>Need help? Contact support at support@yourbrand.com</p>
          <button class="btn btn-link" onclick="exportLicenseDebug()">Export Debug Info</button>
        </div>
      </div>
    </div>
  `;
}

// Update license display in UI
function updateLicenseDisplay() {
  const licenseStatus = document.getElementById('license-status');
  if (!licenseStatus || !globalLicenseInfo) return;
  
  const statusClass = globalLicenseInfo.isValid ? 
    (globalLicenseInfo.daysRemaining <= 7 ? 'text-warning' : 'text-success') : 
    'text-danger';
  
  licenseStatus.className = `license-status ${statusClass}`;
  licenseStatus.textContent = globalLicenseInfo.message;
}

// License Management Functions
async function showLicenseActivation() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3>Activate License</h3>
        <button onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Enter License Key:</label>
          <textarea id="license-key-input" class="form-control" rows="4" 
            placeholder="Paste your license key here..."></textarea>
        </div>
        <button class="btn btn-primary" onclick="activateLicenseKey()">Activate</button>
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function activateLicenseKey() {
  const keyInput = document.getElementById('license-key-input') as HTMLTextAreaElement;
  if (!keyInput) return;
  
  const licenseKey = keyInput.value.trim();
  if (!licenseKey) {
    showToast('Please enter a license key', 'error');
    return;
  }
  
  try {
    const result = await window.posAPI.license.activate(licenseKey);
    
    if (result.success) {
      showToast('License activated successfully!', 'success');
      document.querySelector('.modal')?.remove();
      
      // Refresh license and reload app
      const valid = await checkLicense();
      if (valid) {
        showMainApp();
        navigateTo('dashboard');
        startLicenseMonitoring();
      }
    } else {
      showToast('Activation failed: ' + result.message, 'error');
    }
  } catch (error: any) {
    showToast('Activation error: ' + error.message, 'error');
  }
}

async function importLicenseFile() {
  try {
    const result = await window.posAPI.license.importFromFile();
    
    if (result.success) {
      showToast('License imported successfully!', 'success');
      
      // Refresh license and reload app
      const valid = await checkLicense();
      if (valid) {
        showMainApp();
        navigateTo('dashboard');
        startLicenseMonitoring();
      }
    } else {
      showToast('Import failed: ' + result.message, 'error');
    }
  } catch (error: any) {
    showToast('Import error: ' + error.message, 'error');
  }
}

async function exportLicenseDebug() {
  try {
    await window.posAPI.license.exportDebug();
    showToast('Debug info exported to desktop', 'success');
  } catch (error: any) {
    showToast('Export failed: ' + error.message, 'error');
  }
}

async function continueWithGrace() {
  showMainApp();
  navigateTo('dashboard');
  startLicenseMonitoring();
  showToast('⚠️ Running in grace period with limited features', 'warning');
}

async function checkLicenseUpdates() {
  try {
    const result = await window.posAPI.license.checkUpdates();
    
    if (result.available) {
      showToast(result.message, 'warning');
    } else {
      showToast(result.message, 'success');
    }
  } catch (error: any) {
    showToast('Failed to check for updates: ' + error.message, 'error');
  }
}

// Make functions globally available
(window as any).printOrder = printOrder;
(window as any).removeItem = removeItem;
(window as any).clearOrder = clearOrder;
(window as any).clearCustomer = clearCustomer;
(window as any).finalizeOrder = finalizeOrder;
(window as any).showAddCustomerModal = showAddCustomerModal;
(window as any).createBackup = createBackup;
(window as any).restoreBackup = restoreBackup;
(window as any).logout = logout;
(window as any).showLicenseActivation = showLicenseActivation;
(window as any).activateLicenseKey = activateLicenseKey;
(window as any).importLicenseFile = importLicenseFile;
(window as any).exportLicenseDebug = exportLicenseDebug;
(window as any).continueWithGrace = continueWithGrace;
(window as any).checkLicenseUpdates = checkLicenseUpdates;
(window as any).togglePassword = togglePassword;


// Customers: create
async function handleCreateCustomer(e: Event) {
  e.preventDefault();
  try {
    const name = (document.getElementById('cust-name') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('cust-phone') as HTMLInputElement).value.trim();
    const email = (document.getElementById('cust-email') as HTMLInputElement).value.trim();
    const gstin = (document.getElementById('cust-gstin') as HTMLInputElement).value.trim();
    const address = (document.getElementById('cust-address') as HTMLInputElement).value.trim();
    if (!name) { showToast('Name is required', 'warning'); return; }
    await window.posAPI.customers.create({ name, phone, email, gstin, address });
    showToast('Customer created', 'success');
    renderCustomers();
  } catch (err: any) {
    showToast('Failed to create customer: ' + (err.message || err), 'error');
  }
}


// POS: customer search and selection helpers
async function customerSearch(q: string) {
  try {
    const results = await window.posAPI.customers.search(q);
    const box = document.getElementById('customer-suggestions');
    if (!box) return;
    if (!results || results.length === 0) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }
    box.innerHTML = `
      <div class="card" style="position: absolute; z-index: 10; width: 100%;">
        <div style="max-height: 220px; overflow: auto;">
          ${results.map((c: any) => `
            <div class="list-item" style="padding:.5rem 1rem; cursor:pointer;" onclick="selectCustomer(${c.id}, '${String(c.name).replace(/'/g, "&#39;")}')">
              <div><strong>${c.name}</strong></div>
              <div style="font-size:.85rem; color: var(--color-text-secondary);">${c.phone || ''} ${c.email ? ' · ' + c.email : ''}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    box.style.display = 'block';
  } catch {}
}

function hideCustomerSuggestions() {
  const box = document.getElementById('customer-suggestions');
  if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}

function selectCustomer(id: number, name: string) {
  selectedCustomer = { id, name };
  const sec = document.getElementById('selected-customer');
  if (sec) {
    (document.getElementById('customer-name-display') as HTMLElement).textContent = name;
    sec.style.display = 'block';
  }
  hideCustomerSuggestions();
  const input = document.getElementById('customer-search') as HTMLInputElement | null;
  if (input) input.value = '';
}

// Frequent orders helpers
async function loadFrequentOrders() {
  try {
    const list = document.getElementById('frequent-orders-list');
    if (!list) return;
    const items = await window.posAPI.frequentOrders.getAll(currentUser?.id);
    if (!items || items.length === 0) {
      list.innerHTML = '<p class="text-center" style="color: var(--color-text-tertiary);">No frequent items yet</p>';
      return;
    }
    list.innerHTML = `
      <div style="display:flex; flex-wrap: wrap; gap: .5rem;">
        ${items.map((fo: any) => `
          <button class="btn btn-sm" onclick="applyFrequent(${fo.id})">${fo.label}</button>
        `).join('')}
      </div>
    `;
  } catch {}
}

async function applyFrequent(id: number) {
  try {
    const fo = await window.posAPI.frequentOrders.getById(id);
    if (!fo) return;
    const items = JSON.parse(fo.items_json || '[]');
    if (!Array.isArray(items)) return;
    currentItems = items.map((it: any) => ({
      name: it.name,
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
      line_total: Number(it.line_total) || 0
    }));
    updateItemsList();
    updateOrderTotals();
  } catch (err: any) {
    showToast('Failed to apply frequent: ' + (err.message || err), 'error');
  }
}

async function saveFrequentFromCurrent(e: Event) {
  e.preventDefault();
  try {
    const label = (document.getElementById('frequent-label') as HTMLInputElement).value.trim();
    if (!label) { showToast('Label required', 'warning'); return; }
    if (!currentItems.length) { showToast('No items to save', 'warning'); return; }
    await window.posAPI.frequentOrders.create(label, currentItems, currentUser?.id);
    (document.getElementById('frequent-label') as HTMLInputElement).value = '';
    showToast('Saved to frequent items', 'success');
    loadFrequentOrders();
  } catch (err: any) {
    showToast('Failed to save frequent: ' + (err.message || err), 'error');
  }
}

// Open orders helpers
async function loadOpenOrders() {
  try {
    const list = document.getElementById('open-orders-list');
    if (!list) return;
    const opens = await window.posAPI.openOrders.getAll();
    if (!opens || opens.length === 0) {
      list.innerHTML = '<p class="text-center" style="color: var(--color-text-tertiary);">No open orders</p>';
      return;
    }
    list.innerHTML = `
      <div>
        ${opens.map((o: any) => `
          <div class="list-item" style="display:flex; justify-content:space-between; align-items:center; padding:.5rem 0; border-bottom:1px solid var(--color-border);">
            <div>
              <div><strong>${o.name}</strong></div>
              <div style="font-size:.8rem; color: var(--color-text-secondary);">${new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div style="display:flex; gap:.5rem;">
              <button class="btn btn-sm" onclick="applyOpenOrder(${o.id})">Load</button>
              <button class="btn btn-sm btn-danger" onclick="deleteOpenOrder(${o.id})">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch {}
}

async function applyOpenOrder(id: number) {
  try {
    const opens = await window.posAPI.openOrders.getAll();
    const o = opens.find((x: any) => x.id === id);
    if (!o) return;
    const state = o.state_json ? JSON.parse(o.state_json) : {};
    const items = Array.isArray(state.items) ? state.items : [];
    currentItems = items.map((it: any) => ({
      name: it.name,
      quantity: Number(it.quantity) || 0,
      unit_price: Number(it.unit_price) || 0,
      line_total: Number(it.line_total) || 0
    }));
    if (o.customer_id) {
      try {
        const cust = await window.posAPI.customers.getById(o.customer_id);
        if (cust) {
          selectedCustomer = { id: cust.id, name: cust.name };
          const sec = document.getElementById('selected-customer');
          if (sec) {
            (document.getElementById('customer-name-display') as HTMLElement).textContent = cust.name;
            sec.style.display = 'block';
          }
        }
      } catch {}
    }
    updateItemsList();
    updateOrderTotals();
    showToast('Loaded open order', 'success');
  } catch (err: any) {
    showToast('Failed to load open order: ' + (err.message || err), 'error');
  }
}

async function saveOpenFromCurrent(e: Event) {
  e.preventDefault();
  try {
    const name = (document.getElementById('open-name') as HTMLInputElement).value.trim();
    if (!name) { showToast('Ticket name required', 'warning'); return; }
    const subtotal = currentItems.reduce((s, it) => s + (Number(it.line_total) || 0), 0);
    const settings = await window.posAPI.settings.get();
    const taxRate = settings.tax_enabled ? 0 : 0;
    const taxTotal = subtotal * taxRate;
    const grand_total = subtotal + taxTotal;
    const state = { items: currentItems, subtotal, grand_total };
    const created = await window.posAPI.openOrders.create(name, selectedCustomer?.id);
    await window.posAPI.openOrders.update(created.id, state, selectedCustomer?.id);
    (document.getElementById('open-name') as HTMLInputElement).value = '';
    showToast('Saved as open order', 'success');
    loadOpenOrders();
  } catch (err: any) {
    showToast('Failed to save open order: ' + (err.message || err), 'error');
  }
}

async function deleteOpenOrder(id: number) {
  try {
    if (!confirm('Delete this open order?')) return;
    await window.posAPI.openOrders.delete(id);
    showToast('Open order deleted', 'success');
    loadOpenOrders();
  } catch (err: any) {
    showToast('Failed to delete open order: ' + (err.message || err), 'error');
  }
}

(window as any).selectCustomer = selectCustomer;
(window as any).applyFrequent = applyFrequent;
(window as any).applyOpenOrder = applyOpenOrder;
(window as any).deleteOpenOrder = deleteOpenOrder;
(window as any).showCreateUserModal = showCreateUserModal;
(window as any).closeCreateUserModal = closeCreateUserModal;
(window as any).toggleUserStatus = toggleUserStatus;
(window as any).deleteUser = deleteUser;
(window as any).recordPayment = recordPayment;
(window as any).viewInstallmentDetails = viewInstallmentDetails;
(window as any).createNewTemplate = createNewTemplate;
(window as any).editTemplate = editTemplate;
(window as any).previewTemplate = previewTemplate;
(window as any).setDefaultTemplate = setDefaultTemplate;
(window as any).deleteTemplate = deleteTemplate;
(window as any).saveTemplate = saveTemplate;
(window as any).uploadLogo = uploadLogo;
(window as any).addQRCode = addQRCode;
(window as any).removeQRCode = removeQRCode;
(window as any).closeTemplatePreview = closeTemplatePreview;
(window as any).showInstallmentWizard = showInstallmentWizard;
(window as any).closeInstallmentWizard = closeInstallmentWizard;
(window as any).createInstallmentPlan = createInstallmentPlan;
(window as any).toggleDarkMode = toggleDarkMode;

// User management functions
function showCreateUserModal() {
  const modal = document.getElementById('create-user-modal');
  if (modal) modal.style.display = 'block';
}

function closeCreateUserModal() {
  const modal = document.getElementById('create-user-modal');
  if (modal) modal.style.display = 'none';
}

async function handleCreateUser(e: Event) {
  e.preventDefault();
  try {
    const username = (document.getElementById('new-username') as HTMLInputElement).value;
    const password = (document.getElementById('new-password') as HTMLInputElement).value;
    const role = (document.getElementById('new-role') as HTMLSelectElement).value;
    
    await window.posAPI.users.create(username, password, role as any);
    showToast('User created successfully', 'success');
    closeCreateUserModal();
    renderUsers();
  } catch (error: any) {
    showToast('Failed to create user: ' + error.message, 'error');
  }
}

async function toggleUserStatus(userId: number, activate: boolean) {
  try {
    await window.posAPI.users.update(userId, { active: activate });
    showToast(`User ${activate ? 'activated' : 'deactivated'}`, 'success');
    renderUsers();
  } catch (error: any) {
    showToast('Failed to update user: ' + error.message, 'error');
  }
}

async function deleteUser(userId: number) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    await window.posAPI.users.delete(userId);
    showToast('User deleted', 'success');
    renderUsers();
  } catch (error: any) {
    showToast('Failed to delete user: ' + error.message, 'error');
  }
}

// Installment functions
async function recordPayment(installmentId: number) {
  const amount = prompt('Enter payment amount:');
  if (!amount) return;
  
  try {
    await window.posAPI.payments.recordInstallmentPayment(installmentId, parseFloat(amount), 'cash');
    showToast('Payment recorded successfully', 'success');
    renderInstallments();
  } catch (error: any) {
    showToast('Failed to record payment: ' + error.message, 'error');
  }
}

function viewInstallmentDetails(planId: number) {
  // TODO: Implement installment details view
  showToast('Installment details view coming soon', 'info');
}

// Template management functions
async function createNewTemplate() {
  const name = prompt('Enter template name:');
  if (!name) return;
  
  try {
    const template = await window.posAPI.templates.create({
      name,
      is_default: false,
      header_json: JSON.stringify({
        businessName: 'Your Business Name',
        businessAddress: 'Your Address',
        businessPhone: '',
        businessEmail: '',
        businessTaxId: ''
      }),
      footer_json: JSON.stringify({ text: 'Thank you for your business!' }),
      styles_json: JSON.stringify({ fontSize: 12, fontFamily: 'Arial' }),
      preferred_bill_size: 'A4',
      preferred_layout: 'Classic'
    });
    
    showToast('Template created successfully', 'success');
    await loadTemplatesList();
    await editTemplate(template.id);
  } catch (error: any) {
    showToast('Failed to create template: ' + error.message, 'error');
  }
}

async function saveTemplate(templateId: number) {
  try {
    const headerData = {
      businessName: (document.getElementById('business-name') as HTMLInputElement).value,
      businessAddress: (document.getElementById('business-address') as HTMLTextAreaElement).value,
      businessPhone: (document.getElementById('business-phone') as HTMLInputElement).value,
      businessEmail: (document.getElementById('business-email') as HTMLInputElement).value,
      businessTaxId: (document.getElementById('business-taxid') as HTMLInputElement).value,
      footerText: (document.getElementById('footer-text') as HTMLTextAreaElement).value
    };
    
    const footerData = {
      text: headerData.footerText
    };
    
    const updates = {
      header_json: JSON.stringify(headerData),
      footer_json: JSON.stringify(footerData),
      preferred_bill_size: (document.getElementById('bill-size') as HTMLSelectElement).value as any,
      preferred_layout: (document.getElementById('layout') as HTMLSelectElement).value as any
    };
    
    await window.posAPI.templates.update(templateId, updates);
    showToast('Template saved successfully', 'success');
    await loadTemplatesList();
  } catch (error: any) {
    showToast('Failed to save template: ' + error.message, 'error');
  }
}

async function setDefaultTemplate(templateId: number) {
  try {
    await window.posAPI.templates.setDefault(templateId);
    showToast('Default template updated', 'success');
    await loadTemplatesList();
  } catch (error: any) {
    showToast('Failed to set default template: ' + error.message, 'error');
  }
}

async function deleteTemplate(templateId: number) {
  if (!confirm('Are you sure you want to delete this template?')) return;
  
  try {
    await window.posAPI.templates.delete(templateId);
    showToast('Template deleted', 'success');
    await loadTemplatesList();
  } catch (error: any) {
    showToast('Failed to delete template: ' + error.message, 'error');
  }
}

async function uploadLogo(templateId: number) {
  try {
    const result = await window.posAPI.templates.uploadLogo(templateId);
    if (result) {
      showToast('Logo uploaded successfully', 'success');
      await editTemplate(templateId);
    }
  } catch (error: any) {
    showToast('Failed to upload logo: ' + error.message, 'error');
  }
}

async function addQRCode(templateId: number) {
  const label = prompt('QR Code label:');
  if (!label) return;
  
  const data = prompt('QR Code data (URL, text, etc.):');
  if (!data) return;
  
  try {
    await window.posAPI.templates.addQRCode(templateId, {
      label,
      data,
      errorCorrectionLevel: 'M',
      size: 150
    });
    
    showToast('QR code added successfully', 'success');
    await editTemplate(templateId);
  } catch (error: any) {
    showToast('Failed to add QR code: ' + error.message, 'error');
  }
}

async function removeQRCode(assetId: number) {
  if (!confirm('Remove this QR code?')) return;
  
  try {
    await window.posAPI.templates.removeAsset(assetId);
    showToast('QR code removed', 'success');
    // Refresh the current template editor
    const templateId = parseInt((document.querySelector('#template-form h4') as HTMLElement)?.getAttribute('data-template-id') || '0');
    if (templateId) {
      await editTemplate(templateId);
    }
  } catch (error: any) {
    showToast('Failed to remove QR code: ' + error.message, 'error');
  }
}

async function previewTemplate(templateId: number) {
  try {
    const modal = document.getElementById('template-preview-modal');
    const contentDiv = document.getElementById('template-preview-content');
    
    if (!modal || !contentDiv) return;
    
    // Generate a sample invoice preview
    contentDiv.innerHTML = '<p>Loading preview...</p>';
    modal.style.display = 'block';
    
    // Create sample data for preview
    const sampleOrder = {
      id: 'SAMPLE-001',
      created_at: new Date().toISOString(),
      customer: { name: 'John Doe', phone: '+91 9876543210' },
      items: [
        { name: 'Sample Item 1', quantity: 2, unit_price: 100, line_total: 200 },
        { name: 'Sample Item 2', quantity: 1, unit_price: 150, line_total: 150 }
      ],
      subtotal: 350,
      tax_total: 0,
      grand_total: 350
    };
    
    // TODO: Generate actual preview HTML using the template
    contentDiv.innerHTML = `
      <iframe style="width: 100%; height: 600px; border: 1px solid #ddd;" 
              srcdoc="<html><body><h2>Invoice Preview</h2><p>Template preview will be rendered here with sample data</p></body></html>">
      </iframe>
    `;
  } catch (error: any) {
    showToast('Failed to preview template: ' + error.message, 'error');
  }
}

function closeTemplatePreview() {
  const modal = document.getElementById('template-preview-modal');
  if (modal) modal.style.display = 'none';
}

// Installment wizard functions
async function showInstallmentWizard() {
  const modal = document.getElementById('installment-wizard-modal');
  if (!modal) return;
  
  // Load finalized orders for selection
  try {
    const orders = await window.posAPI.orders.getAll({ startDate: '2024-01-01' });
    const orderSelect = document.getElementById('installment-order') as HTMLSelectElement;
    if (orderSelect) {
      const eligibleOrders = orders.filter(o => o.status === 'finalized' && !o.is_installment);
      orderSelect.innerHTML = '<option value="">Select an order...</option>' +
        eligibleOrders.map(o => `
          <option value="${o.id}">
            #${o.id} - ${o.customer?.name || 'Walk-in'} - ₹${o.grand_total.toFixed(2)}
          </option>
        `).join('');
    }
  } catch (error: any) {
    showToast('Failed to load orders: ' + error.message, 'error');
  }
  
  modal.style.display = 'block';
}

function closeInstallmentWizard() {
  const modal = document.getElementById('installment-wizard-modal');
  if (modal) modal.style.display = 'none';
}

async function createInstallmentPlan() {
  const orderId = parseInt((document.getElementById('installment-order') as HTMLSelectElement).value);
  const numInstallments = parseInt((document.getElementById('num-installments') as HTMLInputElement).value);
  const frequency = (document.getElementById('installment-frequency') as HTMLSelectElement).value;
  const downPayment = parseFloat((document.getElementById('down-payment') as HTMLInputElement).value) || 0;
  
  if (!orderId) {
    showToast('Please select an order', 'error');
    return;
  }
  
  try {
    const order = await window.posAPI.orders.getById(orderId);
    if (!order) {
      showToast('Order not found', 'error');
      return;
    }
    
    const principal = order.grand_total - downPayment;
    
    const plan = await window.posAPI.installments.createPlan({
      order_id: orderId,
      principal: principal,
      num_installments: numInstallments,
      frequency: frequency as any,
      start_date: new Date().toISOString().split('T')[0],
      down_payment: downPayment,
      fee: 0,
      count: numInstallments,
      rounding_mode: 'bankers'
    } as any);
    
    showToast('Installment plan created successfully', 'success');
    closeInstallmentWizard();
    await renderInstallments();
  } catch (error: any) {
    showToast('Failed to create installment plan: ' + error.message, 'error');
  }
}

// Dark mode functionality
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
  updateDarkModeButton();
}

function updateDarkModeButton() {
  const button = document.querySelector('.dark-mode-toggle');
  if (button) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    button.textContent = isDarkMode ? '☀️' : '🌙';
  }
}

function initializeDarkMode() {
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
  }
  updateDarkModeButton();
}
