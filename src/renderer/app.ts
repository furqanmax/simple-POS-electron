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
    <h2 class="mb-4">Dashboard Overview</h2>
    
    <!-- Quick Stats Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="card" style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: white;">
        <h3 style="color: white; opacity: 0.9;">Today's Orders</h3>
        <div id="today-orders" style="font-size: 2.5rem; font-weight: bold;">-</div>
        <div id="today-orders-change" style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;"></div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, var(--color-success), #27ae60); color: white;">
        <h3 style="color: white; opacity: 0.9;">Today's Revenue</h3>
        <div id="today-revenue" style="font-size: 2.5rem; font-weight: bold;">-</div>
        <div id="today-revenue-change" style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;"></div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, var(--color-info), #2980b9); color: white;">
        <h3 style="color: white; opacity: 0.9;">This Month</h3>
        <div id="month-revenue" style="font-size: 2.5rem; font-weight: bold;">-</div>
        <div id="month-orders" style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;"></div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white;">
        <h3 style="color: white; opacity: 0.9;">Top Customer</h3>
        <div id="top-customer" style="font-size: 1.3rem; font-weight: bold; word-break: break-word;">-</div>
        <div id="top-customer-total" style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;"></div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white;">
        <h3 style="color: white; opacity: 0.9;">Avg Order Value</h3>
        <div id="avg-order-value" style="font-size: 2.5rem; font-weight: bold;">-</div>
        <div id="avg-order-items" style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;"></div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, var(--color-danger), #c0392b); color: white;">
        <h3 style="color: white; opacity: 0.9;">Pending Orders</h3>
        <div id="pending-orders" style="font-size: 2.5rem; font-weight: bold;">-</div>
        <div id="pending-value" style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.5rem;"></div>
      </div>
    </div>
    
    <!-- Charts Row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <!-- Revenue Chart -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Revenue Trend (Last 7 Days)</h3>
        </div>
        <div style="padding: 1rem; position: relative; height: 300px;">
          <canvas id="revenue-chart"></canvas>
        </div>
      </div>
      
      <!-- Orders by Category -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Sales Distribution</h3>
        </div>
        <div style="padding: 1rem; position: relative; height: 300px;">
          <canvas id="category-chart"></canvas>
        </div>
      </div>
    </div>
    
    <!-- Additional Stats Row -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <!-- Peak Hours Chart -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Peak Business Hours</h3>
        </div>
        <div style="padding: 1rem; position: relative; height: 250px;">
          <canvas id="hourly-chart"></canvas>
        </div>
      </div>
      
      <!-- Top Products -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Top Selling Items</h3>
        </div>
        <div id="top-products-list" style="padding: 1rem;">
          <div style="text-align: center; padding: 2rem; color: var(--color-text-tertiary);">Loading...</div>
        </div>
      </div>
    </div>
    
    <!-- Recent Orders & Customer Activity -->
    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1rem;">
      <!-- Recent Orders -->
      <div class="card">
        <div class="card-header">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 class="card-title">Recent Orders</h3>
            <button class="btn btn-sm btn-secondary" onclick="renderHistory()">View All</button>
          </div>
        </div>
        <div id="recent-orders-list" style="max-height: 400px; overflow-y: auto;">Loading...</div>
      </div>
      
      <!-- Customer Activity -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Recent Customers</h3>
        </div>
        <div id="recent-customers-list" style="max-height: 400px; overflow-y: auto;">
          <div style="text-align: center; padding: 2rem; color: var(--color-text-tertiary);">Loading...</div>
        </div>
      </div>
    </div>
  `;
  
  // Load all dashboard data
  loadDashboardData();
}

// Chart storage for cleanup
let dashboardCharts: any = {};

async function loadDashboardData() {
  try {
    // Load stats
    const todayStats = await window.posAPI.dashboard.getStats('today');
    const yesterdayStats = await window.posAPI.dashboard.getStats('yesterday');
    const weekStats = await window.posAPI.dashboard.getStats('7days');
    const monthStats = await window.posAPI.dashboard.getStats('30days');
    
    // Update cards with animations
    updateStatCard('today-orders', todayStats.orderCount, 
                   `vs yesterday: ${todayStats.orderCount - (yesterdayStats?.orderCount || 0) >= 0 ? '+' : ''}${todayStats.orderCount - (yesterdayStats?.orderCount || 0)}`);
    
    updateStatCard('today-revenue', `₹${todayStats.revenue.toFixed(2)}`,
                   `vs yesterday: ₹${(todayStats.revenue - (yesterdayStats?.revenue || 0)).toFixed(2)}`);
    
    updateStatCard('month-revenue', `₹${monthStats.revenue.toFixed(2)}`,
                   `${monthStats.orderCount} orders this month`);
    
    // Calculate and display average order value
    const avgOrderValue = monthStats.orderCount > 0 ? monthStats.revenue / monthStats.orderCount : 0;
    updateStatCard('avg-order-value', `₹${avgOrderValue.toFixed(2)}`,
                   `Based on ${monthStats.orderCount} orders`);
    
    // Load all orders for analysis
    const allOrders = await window.posAPI.orders.getAll();
    
    // Calculate pending orders
    const pendingOrders = allOrders.filter((o: any) => o.status === 'draft');
    const pendingValue = pendingOrders.reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0);
    updateStatCard('pending-orders', pendingOrders.length.toString(),
                   `Value: ₹${pendingValue.toFixed(2)}`);
    
    // Find top customer
    const customerTotals: { [key: string]: { name: string, total: number, count: number } } = {};
    allOrders.forEach((order: any) => {
      if (order.customer?.name) {
        if (!customerTotals[order.customer.name]) {
          customerTotals[order.customer.name] = { name: order.customer.name, total: 0, count: 0 };
        }
        customerTotals[order.customer.name].total += order.grand_total || 0;
        customerTotals[order.customer.name].count++;
      }
    });
    
    const topCustomer = Object.values(customerTotals)
      .sort((a, b) => b.total - a.total)[0];
    
    if (topCustomer) {
      updateStatCard('top-customer', topCustomer.name,
                     `₹${topCustomer.total.toFixed(2)} (${topCustomer.count} orders)`);
    } else {
      updateStatCard('top-customer', 'No data', '');
    }
    
    // Load recent orders
    const recentOrders = await window.posAPI.dashboard.getRecentOrders(10);
    displayRecentOrders(recentOrders);
    
    // Load recent customers
    const customers = await window.posAPI.customers.getAll();
    displayRecentCustomers(customers.slice(0, 10));
    
    // Load and display charts
    await loadChartData(allOrders);
    
    // Load top products
    await loadTopProducts(allOrders);
    
  } catch (error: any) {
    showToast('Failed to load dashboard data: ' + error.message, 'error');
  }
}

function updateStatCard(elementId: string, mainValue: string | number, subValue: string) {
  const mainElement = document.getElementById(elementId);
  const subElement = document.getElementById(elementId + '-change') || 
                     document.getElementById(elementId + '-total') ||
                     document.getElementById(elementId + '-orders') ||
                     document.getElementById(elementId + '-items') ||
                     document.getElementById(elementId + '-value');
  
  if (mainElement) {
    mainElement.textContent = mainValue.toString();
    // Add animation
    mainElement.style.transform = 'scale(0.95)';
    setTimeout(() => {
      mainElement.style.transform = 'scale(1)';
    }, 100);
  }
  
  if (subElement) {
    subElement.textContent = subValue;
  }
}

function displayRecentOrders(orders: any[]) {
  const recentOrdersList = document.getElementById('recent-orders-list');
  if (!recentOrdersList) return;
  
  if (orders.length === 0) {
    recentOrdersList.innerHTML = '<p style="text-align: center; padding: 2rem;">No recent orders</p>';
  } else {
    recentOrdersList.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Time</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${orders.slice(0, 10).map((order: any) => `
            <tr>
              <td><strong>#${order.id}</strong></td>
              <td>${order.customer?.name || 'Walk-in'}</td>
              <td>${formatTimeAgo(new Date(order.created_at))}</td>
              <td><strong>₹${order.grand_total.toFixed(2)}</strong></td>
              <td>
                <span class="badge badge-${order.status === 'finalized' ? 'success' : 'secondary'}">
                  ${order.status}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="previewOrder(${order.id})">View</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

function displayRecentCustomers(customers: any[]) {
  const customersList = document.getElementById('recent-customers-list');
  if (!customersList) return;
  
  if (customers.length === 0) {
    customersList.innerHTML = '<p style="text-align: center; padding: 2rem;">No customers yet</p>';
  } else {
    customersList.innerHTML = `
      <div style="padding: 0.5rem;">
        ${customers.map((customer: any) => `
          <div style="padding: 0.75rem; border-bottom: 1px solid var(--color-border);">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <div style="font-weight: bold;">${escapeHtml(customer.name)}</div>
                <div style="font-size: 0.85rem; color: var(--color-text-secondary);">
                  ${customer.phone || 'No phone'}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.85rem; color: var(--color-text-tertiary);">
                  ${formatTimeAgo(new Date(customer.created_at))}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

async function loadChartData(orders: any[]) {
  // Destroy existing charts
  Object.values(dashboardCharts).forEach((chart: any) => {
    if (chart) chart.destroy();
  });
  dashboardCharts = {};
  
  // Prepare data for last 7 days revenue chart
  const last7Days = [];
  const revenueData = [];
  const ordersData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const dayOrders = orders.filter((o: any) => {
      const orderDate = new Date(o.created_at);
      return orderDate >= date && orderDate < nextDate && o.status === 'finalized';
    });
    
    const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0);
    
    last7Days.push(date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }));
    revenueData.push(dayRevenue);
    ordersData.push(dayOrders.length);
  }
  
  // Create revenue trend chart
  const revenueCtx = (document.getElementById('revenue-chart') as HTMLCanvasElement)?.getContext('2d');
  if (revenueCtx) {
    dashboardCharts.revenue = new (window as any).Chart(revenueCtx, {
      type: 'line',
      data: {
        labels: last7Days,
        datasets: [{
          label: 'Revenue (₹)',
          data: revenueData,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          tension: 0.3,
          fill: true
        }, {
          label: 'Orders',
          data: ordersData,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          tension: 0.3,
          fill: true,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              callback: function(value: any) {
                return '₹' + value.toFixed(0);
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            }
          }
        }
      }
    });
  }
  
  // Create hourly distribution chart
  const hourlyData = new Array(24).fill(0);
  orders.forEach((order: any) => {
    if (order.status === 'finalized') {
      const hour = new Date(order.created_at).getHours();
      hourlyData[hour]++;
    }
  });
  
  const hourlyCtx = (document.getElementById('hourly-chart') as HTMLCanvasElement)?.getContext('2d');
  if (hourlyCtx) {
    dashboardCharts.hourly = new (window as any).Chart(hourlyCtx, {
      type: 'bar',
      data: {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [{
          label: 'Orders by Hour',
          data: hourlyData,
          backgroundColor: 'rgba(155, 89, 182, 0.8)',
          borderColor: '#9b59b6',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
  
  // Create category/sales distribution chart
  const customerTypes = { 'Walk-in': 0, 'Registered': 0 };
  const statusTypes = { 'Completed': 0, 'Pending': 0 };
  
  orders.forEach((order: any) => {
    if (order.customer?.name) {
      customerTypes['Registered'] += order.grand_total || 0;
    } else {
      customerTypes['Walk-in'] += order.grand_total || 0;
    }
    
    if (order.status === 'finalized') {
      statusTypes['Completed'] += order.grand_total || 0;
    } else {
      statusTypes['Pending'] += order.grand_total || 0;
    }
  });
  
  const categoryCtx = (document.getElementById('category-chart') as HTMLCanvasElement)?.getContext('2d');
  if (categoryCtx) {
    dashboardCharts.category = new (window as any).Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['Walk-in Sales', 'Registered Customer Sales'],
        datasets: [{
          data: [customerTypes['Walk-in'], customerTypes['Registered']],
          backgroundColor: ['#f39c12', '#3498db'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label || '';
                const value = '₹' + context.parsed.toFixed(2);
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
}

async function loadTopProducts(orders: any[]) {
  const productSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
  
  orders.forEach((order: any) => {
    if (order.items && order.status === 'finalized') {
      order.items.forEach((item: any) => {
        const key = item.name;
        if (!productSales[key]) {
          productSales[key] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[key].quantity += item.quantity || 0;
        productSales[key].revenue += item.line_total || 0;
      });
    }
  });
  
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  
  const topProductsList = document.getElementById('top-products-list');
  if (!topProductsList) return;
  
  if (topProducts.length === 0) {
    topProductsList.innerHTML = '<p style="text-align: center; padding: 2rem;">No sales data yet</p>';
  } else {
    topProductsList.innerHTML = `
      <div>
        ${topProducts.map((product, index) => `
          <div style="display: flex; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--color-border);">
            <div style="width: 30px; height: 30px; background: ${['#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#e74c3c'][index]}; 
                        color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                        font-weight: bold; margin-right: 1rem;">
              ${index + 1}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: bold;">${escapeHtml(product.name)}</div>
              <div style="font-size: 0.85rem; color: var(--color-text-secondary);">
                Sold: ${product.quantity} units
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: bold; color: var(--color-success);">₹${product.revenue.toFixed(2)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// POS page
async function renderPOS() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <h2 class="mb-4">Point of Sale</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 380px; gap: 1.5rem;">
      <!-- Left Side: Main POS Workflow -->
      <div>
        <!-- Customer Selection at Top -->
        <div class="card mb-3">
          <div class="card-header">
            <h3 class="card-title">Customer Information</h3>
          </div>
          <div style="padding: 1rem;">
            <div class="form-group" style="position: relative;">
              <label>Customer Name</label>
              <input type="text" id="customer-search" placeholder="Search existing customer or type new name..." autocomplete="off">
              <div id="customer-suggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; z-index: 1000;"></div>
            </div>
            
            <div id="selected-customer" style="display: none; margin-top: 1rem; padding: 1rem; background: var(--color-bg-tertiary); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong id="customer-name-display" style="font-size: 1.1rem;"></strong>
                  <div id="customer-details" style="font-size: 0.9rem; color: var(--color-text-secondary); margin-top: 0.25rem;"></div>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="clearCustomer()">Change</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Entry -->
        <div class="card mb-3">
          <div class="card-header">
            <h3 class="card-title">Add Items</h3>
          </div>
          <div style="padding: 1rem;">
            <form id="add-item-form" class="mb-3">
              <div style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.75rem; align-items: end;">
                <div class="form-group">
                  <label>Item Name</label>
                  <input type="text" id="item-name" placeholder="Enter item name" required autocomplete="off">
                </div>
                <div class="form-group">
                  <label>Quantity</label>
                  <input type="number" id="item-quantity" min="0.01" step="0.01" value="1" required>
                </div>
                <div class="form-group">
                  <label>Unit Price (₹)</label>
                  <input type="number" id="item-price" min="0" step="0.01" placeholder="0.00" required>
                </div>
                <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1.5rem;">+ Add</button>
              </div>
            </form>
            
            <div id="items-list">
              <p class="text-center" style="color: var(--color-text-tertiary); padding: 2rem;">
                No items added yet. Start by adding items above.
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Access Panels -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <!-- Frequent Items -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Frequent Items</h3>
            </div>
            <div style="padding: 1rem;">
              <form id="save-frequent-form" class="mb-2" style="display:flex; gap:.5rem;">
                <input type="text" id="frequent-label" placeholder="Save current as..." style="flex:1;" autocomplete="off">
                <button type="submit" class="btn btn-sm btn-secondary">Save</button>
              </form>
              <div id="frequent-orders-list" style="max-height: 200px; overflow-y: auto;">
                <p class="text-center" style="color: var(--color-text-tertiary); padding: 1rem;">No saved templates yet</p>
              </div>
            </div>
          </div>

          <!-- Open Orders -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Open Orders</h3>
            </div>
            <div style="padding: 1rem;">
              <form id="save-open-form" style="display:flex; gap:.5rem; margin-bottom:.5rem;">
                <input id="open-name" type="text" placeholder="Save as draft..." style="flex:1;" autocomplete="off" />
                <button class="btn btn-sm btn-secondary" type="submit">Save</button>
              </form>
              <div id="open-orders-list" style="max-height: 200px; overflow-y: auto;">
                <p class="text-center" style="color: var(--color-text-tertiary); padding: 1rem;">No open orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right Side: Order Summary & Actions -->
      <div style="position: sticky; top: 1rem; height: fit-content;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Order Summary</h3>
          </div>
          
          <div style="padding: 1.5rem;">
            <!-- Order Totals -->
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 1rem;">
                <span>Subtotal:</span>
                <strong id="order-subtotal">₹0.00</strong>
              </div>
              <div id="tax-row" style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 1rem;">
                <span>Tax (<span id="tax-rate">0</span>%):</span>
                <strong id="order-tax">₹0.00</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.5rem; padding-top: 1rem; margin-top: 1rem; border-top: 2px solid var(--color-border);">
                <strong>Total:</strong>
                <strong id="order-total" style="color: var(--color-primary);">₹0.00</strong>
              </div>
            </div>
            
            <!-- Order Stats -->
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--color-bg-tertiary); border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="color: var(--color-text-secondary);">Items:</span>
                <strong id="item-count">0</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--color-text-secondary);">Total Quantity:</span>
                <strong id="total-quantity">0</strong>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <button id="finalize-btn" class="btn btn-success btn-block mb-2" onclick="finalizeOrder()" style="font-size: 1.1rem; padding: 0.75rem;">
              <strong>Finalize & Print</strong>
            </button>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <button class="btn btn-secondary" onclick="printPreview()">
                Preview
              </button>
              <button class="btn btn-secondary" onclick="clearOrder()">
                Clear All
              </button>
            </div>
          </div>
        </div>

        <!-- Keyboard Shortcuts Help -->
        <div class="card mt-3">
          <div style="padding: 1rem; font-size: 0.85rem;">
            <strong style="display: block; margin-bottom: 0.5rem;">Shortcuts:</strong>
            <div style="color: var(--color-text-secondary);">
              <div>Alt+N - New Item</div>
              <div>Alt+C - Customer Search</div>
              <div>Alt+P - Print & Finalize</div>
              <div>Esc - Clear Form</div>
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

  // Customer search with debounce and add new functionality
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
    
    // Handle Enter key to add new customer if no selection
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !selectedCustomer) {
        e.preventDefault();
        const name = searchInput.value.trim();
        if (name) {
          addNewCustomerFromPOS(name);
        }
      }
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
  
  // Setup keyboard shortcuts
  setupPOSKeyboardShortcuts();
}

// Setup keyboard shortcuts for POS
function setupPOSKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Only work when in POS page
    if (currentPage !== 'pos') return;
    
    // Alt+N - Focus on new item
    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      document.getElementById('item-name')?.focus();
    }
    
    // Alt+C - Focus on customer search
    if (e.altKey && e.key === 'c') {
      e.preventDefault();
      document.getElementById('customer-search')?.focus();
    }
    
    // Alt+P - Print & Finalize
    if (e.altKey && e.key === 'p') {
      e.preventDefault();
      finalizeOrder();
    }
    
    // Escape - Clear current form
    if (e.key === 'Escape') {
      const itemName = document.getElementById('item-name') as HTMLInputElement;
      const itemQty = document.getElementById('item-quantity') as HTMLInputElement;
      const itemPrice = document.getElementById('item-price') as HTMLInputElement;
      
      if (itemName && (itemName.value || itemQty.value !== '1' || itemPrice.value)) {
        e.preventDefault();
        itemName.value = '';
        itemQty.value = '1';
        itemPrice.value = '';
        itemName.focus();
      }
    }
  });
}

function addItemToOrder() {
  const nameInput = document.getElementById('item-name') as HTMLInputElement;
  const qtyInput = document.getElementById('item-quantity') as HTMLInputElement;
  const priceInput = document.getElementById('item-price') as HTMLInputElement;
  
  const name = nameInput.value.trim();
  const quantity = parseFloat(qtyInput.value);
  const unitPrice = parseFloat(priceInput.value);
  
  if (!name) {
    showToast('Please enter item name', 'error');
    nameInput.focus();
    return;
  }
  
  if (quantity <= 0) {
    showToast('Quantity must be greater than 0', 'error');
    qtyInput.focus();
    return;
  }
  
  if (unitPrice < 0) {
    showToast('Price cannot be negative', 'error');
    priceInput.focus();
    return;
  }
  
  if (isNaN(unitPrice) || unitPrice === 0) {
    showToast('Please enter a valid price', 'error');
    priceInput.focus();
    return;
  }
  
  const lineTotal = quantity * unitPrice;
  
  // Check if item already exists and ask to update
  const existingIndex = currentItems.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
  if (existingIndex >= 0) {
    if (confirm(`Item "${name}" already exists. Do you want to add to the existing quantity?`)) {
      currentItems[existingIndex].quantity += quantity;
      currentItems[existingIndex].line_total = currentItems[existingIndex].quantity * currentItems[existingIndex].unit_price;
    } else {
      return;
    }
  } else {
    currentItems.push({
      name,
      quantity,
      unit_price: unitPrice,
      line_total: lineTotal
    });
  }
  
  updateItemsList();
  updateOrderTotals();
  
  // Clear form and show success feedback
  nameInput.value = '';
  qtyInput.value = '1';
  priceInput.value = '';
  nameInput.focus();
  
  // Quick flash feedback
  showToast(`Added ${quantity} x ${name}`, 'success');
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
  
  // Get tax settings - using default tax rate of 18% when enabled
  const settings = await window.posAPI.settings.get();
  const DEFAULT_TAX_RATE = 18; // Default 18% GST rate
  const taxRatePercent = settings.tax_enabled ? DEFAULT_TAX_RATE : 0;
  const taxRate = taxRatePercent / 100; // Convert percentage to decimal
  const taxTotal = subtotal * taxRate;
  const grandTotal = subtotal + taxTotal;
  
  // Update totals
  document.getElementById('order-subtotal')!.textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('order-tax')!.textContent = `₹${taxTotal.toFixed(2)}`;
  document.getElementById('order-total')!.textContent = `₹${grandTotal.toFixed(2)}`;
  
  // Update tax rate display
  const taxRateElem = document.getElementById('tax-rate');
  if (taxRateElem) {
    taxRateElem.textContent = taxRatePercent.toString();
  }
  
  // Update item stats
  const itemCount = document.getElementById('item-count');
  const totalQty = document.getElementById('total-quantity');
  if (itemCount) itemCount.textContent = currentItems.length.toString();
  if (totalQty) {
    const totalQuantity = currentItems.reduce((sum, item) => sum + item.quantity, 0);
    totalQty.textContent = totalQuantity.toFixed(2);
  }
  
  // Show/hide tax row based on settings
  const taxRow = document.getElementById('tax-row');
  if (taxRow) {
    taxRow.style.display = settings.tax_enabled ? 'flex' : 'none';
  }
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
  const selectedDiv = document.getElementById('selected-customer');
  if (selectedDiv) selectedDiv.style.display = 'none';
  const searchInput = document.getElementById('customer-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus(); // Focus back on search for better UX
  }
  hideCustomerSuggestions();
}

// Print Preview function
async function printPreview() {
  if (currentItems.length === 0) {
    showToast('No items to preview', 'warning');
    return;
  }
  
  try {
    const settings = await window.posAPI.settings.get();
    const subtotal = currentItems.reduce((sum, item) => sum + item.line_total, 0);
    const DEFAULT_TAX_RATE = 18; // Default 18% GST rate
    const taxRatePercent = settings.tax_enabled ? DEFAULT_TAX_RATE : 0;
    const taxRate = taxRatePercent / 100;
    const taxTotal = subtotal * taxRate;
    const grandTotal = subtotal + taxTotal;
    
    // Create preview modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>Order Preview</h3>
          <button onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div style="margin-bottom: 1rem;">
            <h4>Customer: ${selectedCustomer?.name || 'Walk-in Customer'}</h4>
            ${selectedCustomer?.phone ? `<p>Phone: ${selectedCustomer.phone}</p>` : ''}
            ${selectedCustomer?.email ? `<p>Email: ${selectedCustomer.email}</p>` : ''}
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${currentItems.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.unit_price.toFixed(2)}</td>
                  <td>₹${item.line_total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 1.5rem; text-align: right;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Subtotal:</span>
              <strong>₹${subtotal.toFixed(2)}</strong>
            </div>
            ${settings.tax_enabled ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Tax (${taxRatePercent}%):</span>
                <strong>₹${taxTotal.toFixed(2)}</strong>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 1.25rem; padding-top: 0.5rem; border-top: 2px solid var(--color-border);">
              <strong>Total:</strong>
              <strong style="color: var(--color-primary);">₹${grandTotal.toFixed(2)}</strong>
            </div>
          </div>
          
          <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
            <button class="btn btn-primary" onclick="this.closest('.modal').remove(); finalizeOrder()">Finalize & Print</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  } catch (error: any) {
    showToast('Failed to generate preview: ' + error.message, 'error');
  }
}

async function finalizeOrder() {
  if (currentItems.length === 0) {
    showToast('Please add items to the order', 'warning');
    return;
  }
  
  try {
    // Get settings and default template
    const settings = await window.posAPI.settings.get();
    let defaultTemplate = null;
    
    try {
      defaultTemplate = await window.posAPI.templates.getDefault();
    } catch (e) {
      console.log('No default template set, using system defaults');
    }
    
    // Calculate order totals
    const subtotal = currentItems.reduce((sum, item) => sum + item.line_total, 0);
    const DEFAULT_TAX_RATE = 18; // Default 18% GST rate
    const taxRatePercent = settings.tax_enabled ? DEFAULT_TAX_RATE : 0;
    const taxRate = taxRatePercent / 100;
    const taxTotal = subtotal * taxRate;
    const grandTotal = subtotal + taxTotal;
    
    // Create order with template information
    const orderData: any = {
      user_id: currentUser.id,
      customer_id: selectedCustomer?.id,
      subtotal,
      tax_rate: taxRate,
      tax_total: taxTotal,
      grand_total: grandTotal,
      status: 'draft',
      is_installment: false
    };
    
    // Add template information if available
    if (defaultTemplate) {
      orderData.template_id = defaultTemplate.id;
      orderData.template_data = {
        header_json: defaultTemplate.header_json,
        footer_json: defaultTemplate.footer_json,
        preferred_bill_size: defaultTemplate.preferred_bill_size,
        preferred_layout: defaultTemplate.preferred_layout
      };
    }
    
    const order = await window.posAPI.orders.create(orderData, currentItems);
    
    // Finalize the order
    await window.posAPI.orders.finalize(order.id);
    
    // Print using template settings
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
      <div class="card-header">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <h3 class="card-title">Orders</h3>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <input type="date" id="filter-start-date" onchange="filterOrders()" style="padding: 0.25rem;" title="Start Date">
            <input type="date" id="filter-end-date" onchange="filterOrders()" style="padding: 0.25rem;" title="End Date">
            <select id="filter-status" onchange="filterOrders()" style="padding: 0.25rem;">
              <option value="">All Status</option>
              <option value="finalized">Finalized</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button class="btn btn-sm btn-secondary" onclick="exportOrderHistory()">Export CSV</button>
          </div>
        </div>
      </div>
      <div id="orders-list" style="overflow-x: auto;">Loading...</div>
    </div>
    
    <!-- Order Preview Modal -->
    <div id="order-preview-modal" class="modal" style="display:none;">
      <div class="modal-content" style="width: 90%; max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>Order Preview</h3>
          <span class="close" onclick="closeOrderPreview()">&times;</span>
        </div>
        <div id="order-preview-content" style="padding: 1rem;">
          <!-- Preview will be rendered here -->
        </div>
        <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; padding: 1rem; border-top: 1px solid var(--color-border);">
          <button class="btn btn-secondary" onclick="closeOrderPreview()">Close</button>
          <button class="btn btn-primary" onclick="printOrderPreview()">Print</button>
        </div>
      </div>
    </div>
  `;
  
  await loadOrderHistory();
}

async function loadOrderHistory(startDate?: string, endDate?: string, statusFilter?: string) {
  try {
    const orders = await window.posAPI.orders.getAll();
    
    // Store globally for filtering
    (window as any).allOrders = orders;
    
    // Apply filters
    let filteredOrders = orders;
    if (startDate) {
      filteredOrders = filteredOrders.filter((o: any) => new Date(o.created_at) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredOrders = filteredOrders.filter((o: any) => new Date(o.created_at) <= end);
    }
    if (statusFilter) {
      filteredOrders = filteredOrders.filter((o: any) => o.status === statusFilter);
    }
    
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    if (filteredOrders.length === 0) {
      ordersList.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--color-text-tertiary);">
          <p>No orders found</p>
          ${statusFilter || startDate || endDate ? '<p style="font-size: 0.9rem;">Try adjusting your filters</p>' : ''}
        </div>
      `;
    } else {
      ordersList.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th style="min-width: 150px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.map((order: any) => {
              const itemCount = order.items?.length || 0;
              return `
                <tr>
                  <td><strong>#${order.id}</strong></td>
                  <td>
                    <div>${new Date(order.created_at).toLocaleDateString()}</div>
                    <small style="color: var(--color-text-tertiary);">${new Date(order.created_at).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    ${order.customer ? `
                      <div>${escapeHtml(order.customer.name || 'Customer')}</div>
                      ${order.customer.phone ? `<small style="color: var(--color-text-tertiary);">${escapeHtml(order.customer.phone)}</small>` : ''}
                    ` : '<span style="color: var(--color-text-tertiary);">Walk-in</span>'}
                  </td>
                  <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                  <td><strong>₹${(order.grand_total || 0).toFixed(2)}</strong></td>
                  <td>
                    <span class="badge badge-${order.status === 'finalized' ? 'success' : order.status === 'cancelled' ? 'danger' : 'secondary'}">
                      ${order.status || 'unknown'}
                    </span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.25rem;">
                      <button class="btn btn-sm btn-secondary" onclick="previewOrder(${order.id})" title="Preview">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                        </svg>
                      </button>
                      <button class="btn btn-sm btn-primary" onclick="printOrder(${order.id})" title="Print">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
                          <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div style="padding: 1rem; text-align: center; border-top: 1px solid var(--color-border); color: var(--color-text-tertiary);">
          Showing ${filteredOrders.length} of ${orders.length} orders
        </div>
      `;
    }
  } catch (error: any) {
    showToast('Failed to load orders: ' + error.message, 'error');
    const ordersList = document.getElementById('orders-list');
    if (ordersList) {
      ordersList.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--color-text-error);">
          <p>Failed to load orders</p>
          <p style="font-size: 0.9rem;">${escapeHtml(error.message || 'Unknown error')}</p>
          <button class="btn btn-primary" onclick="loadOrderHistory()">Retry</button>
        </div>
      `;
    }
  }
}

function filterOrders() {
  const startDate = (document.getElementById('filter-start-date') as HTMLInputElement)?.value;
  const endDate = (document.getElementById('filter-end-date') as HTMLInputElement)?.value;
  const statusFilter = (document.getElementById('filter-status') as HTMLSelectElement)?.value;
  
  loadOrderHistory(startDate, endDate, statusFilter);
}

async function previewOrder(orderId: number) {
  try {
    // Validate orderId
    if (!orderId || orderId <= 0) {
      showToast('Invalid order ID', 'error');
      return;
    }
    
    let modal = document.getElementById('order-preview-modal');
    let contentDiv = document.getElementById('order-preview-content');
    
    // Create modal if it doesn't exist (e.g., when called from dashboard)
    if (!modal) {
      const modalHtml = `
        <div id="order-preview-modal" class="modal" style="display:none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;">
          <div class="modal-content" style="position: relative; width: 90%; max-width: 900px; max-height: 90vh; margin: 2rem auto; background: var(--color-bg-primary); border-radius: 8px; overflow: hidden;">
            <div class="modal-header" style="padding: 1rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0;">Order Preview</h3>
              <span class="close" onclick="closeOrderPreview()" style="cursor: pointer; font-size: 1.5rem; line-height: 1;">&times;</span>
            </div>
            <div id="order-preview-content" style="padding: 1rem; overflow-y: auto; max-height: calc(90vh - 120px);">
              <!-- Preview will be rendered here -->
            </div>
            <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; padding: 1rem; border-top: 1px solid var(--color-border);">
              <button class="btn btn-secondary" onclick="closeOrderPreview()">Close</button>
              <button class="btn btn-primary" onclick="printOrderPreview()">Print</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      modal = document.getElementById('order-preview-modal');
      contentDiv = document.getElementById('order-preview-content');
    }
    
    if (!modal || !contentDiv) {
      showToast('Failed to create preview modal', 'error');
      return;
    }
    
    contentDiv.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading order details...</div>';
    modal.style.display = 'block';
    
    // Get order details with proper error handling
    const order = await window.posAPI.orders.getById(orderId).catch((err: any) => {
      console.error('Error fetching order:', err);
      return null;
    });
    
    if (!order) {
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--color-text-error);">
          <h3>Order Not Found</h3>
          <p>Order #${orderId} could not be loaded.</p>
          <p style="font-size: 0.9rem; color: var(--color-text-tertiary);">It may have been deleted or you may not have permission to view it.</p>
          <button class="btn btn-primary" onclick="closeOrderPreview()">Close</button>
        </div>
      `;
      return;
    }
    
    // Validate order has required data
    if (!order.items || order.items.length === 0) {
      console.warn('Order has no items:', order);
    }
    
    // Get template if available
    let template = null;
    let headerData = {};
    let footerData = {};
    let assets: any[] = [];
    
    try {
      // Try to get the default template (orders don't store template_id)
      template = await window.posAPI.templates.getDefault();
      
      if (template) {
        headerData = JSON.parse(template.header_json || '{}');
        footerData = JSON.parse(template.footer_json || '{}');
        assets = await window.posAPI.templates.getAssets(template.id);
      }
    } catch (e) {
      console.log('No template available, using defaults');
    }
    
    // Generate preview based on template or default layout
    if (template) {
      const dimensions = getBillSizeDimensions(template.preferred_bill_size);
      const orderData = {
        id: order.id.toString(),
        created_at: order.created_at,
        customer: order.customer || { name: 'Walk-in', phone: '', email: '' },
        items: order.items || [],
        subtotal: order.subtotal || 0,
        tax_total: order.tax_total || 0,
        grand_total: order.grand_total || 0
      };
      
      const previewHtml = generateLayoutHTML(
        template,
        headerData,
        footerData,
        orderData,
        assets,
        dimensions
      );
      
      contentDiv.innerHTML = `
        <div style="background: #f5f5f5; padding: 1rem; overflow: auto;">
          ${previewHtml}
        </div>
      `;
    } else {
      // Fallback to simple preview with better formatting
      const statusColor = order.status === 'finalized' ? '#27ae60' : 
                          order.status === 'cancelled' ? '#e74c3c' : '#f39c12';
      
      contentDiv.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; background: white; padding: 2rem; font-family: Arial, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
            <div>
              <h2 style="margin: 0;">Order #${order.id}</h2>
              <p style="margin: 0.5rem 0; color: #666;">Date: ${new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div style="text-align: right;">
              <span style="padding: 0.25rem 0.75rem; background: ${statusColor}; color: white; border-radius: 4px; font-weight: bold;">
                ${order.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
          </div>
          
          <div style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <h4 style="margin: 0 0 0.5rem 0;">Customer Information</h4>
            <p style="margin: 0.25rem 0;"><strong>Name:</strong> ${escapeHtml(order.customer?.name || 'Walk-in Customer')}</p>
            ${order.customer?.phone ? `<p style="margin: 0.25rem 0;"><strong>Phone:</strong> ${escapeHtml(order.customer.phone)}</p>` : ''}
            ${order.customer?.email ? `<p style="margin: 0.25rem 0;"><strong>Email:</strong> ${escapeHtml(order.customer.email)}</p>` : ''}
            ${order.customer?.address ? `<p style="margin: 0.25rem 0;"><strong>Address:</strong> ${escapeHtml(order.customer.address)}</p>` : ''}
          </div>
          
          ${order.items && order.items.length > 0 ? `
            <table style="width: 100%; margin: 2rem 0; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid #dee2e6;">#</th>
                  <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid #dee2e6;">Item</th>
                  <th style="text-align: center; padding: 0.75rem; border-bottom: 2px solid #dee2e6;">Qty</th>
                  <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #dee2e6;">Unit Price</th>
                  <th style="text-align: right; padding: 0.75rem; border-bottom: 2px solid #dee2e6;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item: any, index: number) => `
                  <tr>
                    <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${index + 1}</td>
                    <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${escapeHtml(item.name || 'Unknown Item')}</td>
                    <td style="text-align: center; padding: 0.75rem; border-bottom: 1px solid #dee2e6;">${Number(item.quantity || 0).toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.75rem; border-bottom: 1px solid #dee2e6;">₹${(item.unit_price || 0).toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.75rem; border-bottom: 1px solid #dee2e6;">₹${(item.line_total || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 4px; color: #666;">
              <p>No items in this order</p>
            </div>
          `}
          
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 300px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>Subtotal:</span>
                <span>₹${(order.subtotal || 0).toFixed(2)}</span>
              </div>
              ${order.tax_total && order.tax_total > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span>Tax (${order.tax_rate ? (order.tax_rate * 100).toFixed(0) : '0'}%):</span>
                  <span>₹${order.tax_total.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: bold; padding-top: 0.5rem; border-top: 2px solid #333;">
                <span>Total:</span>
                <span style="color: ${statusColor};">₹${(order.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          ${order.user ? `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #dee2e6; color: #666; font-size: 0.9rem;">
              <p style="margin: 0;">Processed by: ${escapeHtml(order.user.username || 'Unknown User')}</p>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    // Store current order for printing
    (window as any).currentPreviewOrder = order;
    
    // Add click outside to close
    modal.onclick = function(event: any) {
      if (event.target === modal) {
        closeOrderPreview();
      }
    };
    
    // Add escape key to close
    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeOrderPreview();
      }
    };
    // Store handler for proper cleanup
    (window as any).orderPreviewEscapeHandler = escapeHandler;
    document.addEventListener('keydown', escapeHandler);
    
  } catch (error: any) {
    console.error('Preview error:', error);
    showToast('Failed to preview order: ' + (error.message || 'Unknown error'), 'error');
    
    const contentDiv = document.getElementById('order-preview-content');
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--color-text-error);">
          <h3>Error Loading Order</h3>
          <p style="margin: 1rem 0;">${escapeHtml(error.message || 'An unexpected error occurred')}</p>
          <button class="btn btn-primary" onclick="closeOrderPreview()">Close</button>
        </div>
      `;
    }
  }
}

function closeOrderPreview() {
  const modal = document.getElementById('order-preview-modal');
  if (modal) {
    modal.style.display = 'none';
    // Remove click handler to prevent memory leaks
    modal.onclick = null;
  }
  
  // Clear the stored order
  (window as any).currentPreviewOrder = null;
  
  // Remove any lingering event listeners
  document.removeEventListener('keydown', (window as any).orderPreviewEscapeHandler);
  (window as any).orderPreviewEscapeHandler = null;
}

function printOrderPreview() {
  const order = (window as any).currentPreviewOrder;
  if (order && order.id) {
    printOrder(order.id);
    closeOrderPreview();
  } else {
    showToast('No order to print', 'error');
  }
}

async function duplicateOrder(orderId: number) {
  try {
    const order = await window.posAPI.orders.getById(orderId);
    if (!order) {
      showToast('Order not found', 'error');
      return;
    }
    
    // Set items to current order and switch to POS tab
    currentItems = order.items.map((item: any) => ({
      ...item,
      id: Date.now() + Math.random() // Generate new temp IDs
    }));
    selectedCustomer = order.customer;
    
    // Switch to POS tab
    renderPOS();
    showToast('Order duplicated. Continue editing in POS.', 'success');
  } catch (error: any) {
    showToast('Failed to duplicate order: ' + error.message, 'error');
  }
}

function exportOrderHistory() {
  try {
    const orders = (window as any).allOrders || [];
    if (orders.length === 0) {
      showToast('No orders to export', 'warning');
      return;
    }
    
    // Generate CSV
    const csvRows = [
      ['Order ID', 'Date', 'Time', 'Customer', 'Phone', 'Items', 'Subtotal', 'Tax', 'Total', 'Status'],
      ...orders.map((order: any) => [
        order.id,
        new Date(order.created_at).toLocaleDateString(),
        new Date(order.created_at).toLocaleTimeString(),
        order.customer?.name || 'Walk-in',
        order.customer?.phone || '',
        order.items?.length || 0,
        (order.subtotal || 0).toFixed(2),
        (order.tax_total || 0).toFixed(2),
        (order.grand_total || 0).toFixed(2),
        order.status || 'unknown'
      ])
    ];
    
    const csvContent = csvRows.map(row => row.map((cell: any) => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Orders exported successfully', 'success');
  } catch (error: any) {
    showToast('Failed to export orders: ' + error.message, 'error');
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
  
  // Check permissions
  try {
    const hasPermission = await window.posAPI.permissions.checkPermission(
      currentUser?.id || 0, 'templates', 'read'
    );
    if (!hasPermission && currentUser?.role !== 'admin') {
      contentArea.innerHTML = `
        <div class="card">
          <h2>Access Denied</h2>
          <p>You don't have permission to manage templates.</p>
        </div>
      `;
      return;
    }
  } catch {}
  
  contentArea.innerHTML = `
    <div class="flex-between mb-4">
      <h2>Invoice Templates</h2>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary" onclick="importTemplate()" title="Import Template">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: text-bottom;">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
          </svg>
          Import
        </button>
        <button class="btn btn-primary" onclick="showCreateTemplateModal()">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: text-bottom;">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
          </svg>
          Create Template
        </button>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 450px; gap: 1.5rem;">
      <!-- Template List -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Templates</h3>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="template-search" placeholder="Search templates..." 
                   style="padding: 0.25rem 0.5rem; font-size: 0.9rem;" 
                   onkeyup="filterTemplates()">
            <select id="template-filter" onchange="filterTemplates()" 
                    style="padding: 0.25rem 0.5rem; font-size: 0.9rem;">
              <option value="all">All Templates</option>
              <option value="default">Default Only</option>
              <option value="custom">Custom Only</option>
            </select>
          </div>
        </div>
        <div id="templates-list" style="position: relative; min-height: 200px;">
          <div class="loading-spinner" style="display: flex; justify-content: center; padding: 2rem;">
            Loading templates...
          </div>
        </div>
      </div>
      
      <!-- Template Editor -->
      <div class="card" style="position: sticky; top: 1rem; height: fit-content; max-height: calc(100vh - 6rem); overflow-y: auto;">
        <div class="card-header">
          <h3 class="card-title">Template Editor</h3>
          <div id="template-actions" style="display: none;">
            <button class="btn btn-sm" onclick="duplicateCurrentTemplate()" title="Duplicate">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6Z"/>
                <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/>
              </svg>
            </button>
            <button class="btn btn-sm" onclick="exportCurrentTemplate()" title="Export">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
            </button>
          </div>
        </div>
        <div id="template-editor" style="padding: 1rem;">
          <p class="text-center" style="color: var(--color-text-tertiary);">Select a template to edit</p>
        </div>
      </div>
    </div>
    
    <!-- Create Template Modal -->
    <div id="create-template-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Create New Template</h3>
          <button onclick="closeCreateTemplateModal()">&times;</button>
        </div>
        <form id="create-template-form" style="padding: 1.5rem;">
          <div class="form-group">
            <label>Template Name <span style="color: red;">*</span></label>
            <input type="text" id="new-template-name" required 
                   placeholder="e.g., Modern Invoice Template" maxlength="100">
          </div>
          <div class="form-group">
            <label>Based On</label>
            <select id="template-base">
              <option value="blank">Blank Template</option>
              <option value="default">Copy from Default</option>
              <option value="existing">Copy from Existing</option>
            </select>
          </div>
          <div id="existing-templates-select" class="form-group" style="display: none;">
            <label>Select Template to Copy</label>
            <select id="copy-from-template"></select>
          </div>
          <div class="form-group">
            <label>Bill Size</label>
            <select id="new-bill-size">
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A5">A5 (148 × 210 mm)</option>
              <option value="Letter">Letter (8.5 × 11 in)</option>
              <option value="Thermal80">80mm Thermal</option>
              <option value="Thermal58">58mm Thermal</option>
            </select>
          </div>
          <div class="form-group">
            <label>Layout Style</label>
            <select id="new-layout">
              <option value="Classic">Classic</option>
              <option value="Minimal">Minimal</option>
              <option value="Compact">Compact</option>
              <option value="Detailed">Detailed</option>
            </select>
          </div>
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="closeCreateTemplateModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Template</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Preview Modal -->
    <div id="template-preview-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow: auto;">
        <div class="modal-header">
          <h3>Template Preview</h3>
          <button onclick="closeTemplatePreview()">&times;</button>
        </div>
        <div id="template-preview-content" style="padding: 1.5rem; background: white; min-height: 400px;"></div>
        <div style="padding: 1rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 1rem;">
          <button class="btn btn-secondary" onclick="closeTemplatePreview()">Close</button>
          <button class="btn btn-primary" onclick="printPreviewTemplate()">Print Preview</button>
        </div>
      </div>
    </div>
    
    <!-- QR Code Modal -->
    <div id="qr-code-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Add QR Code</h3>
          <button onclick="closeQRModal()">&times;</button>
        </div>
        <form id="qr-code-form" style="padding: 1.5rem;">
          <div class="form-group">
            <label>QR Code Label <span style="color: red;">*</span></label>
            <input type="text" id="qr-label" required placeholder="e.g., Payment QR" maxlength="50">
          </div>
          <div class="form-group">
            <label>QR Code Type</label>
            <select id="qr-type" onchange="updateQRDataField()">
              <option value="custom">Custom Text/URL</option>
              <option value="upi">UPI Payment</option>
              <option value="website">Website URL</option>
              <option value="email">Email</option>
              <option value="phone">Phone Number</option>
            </select>
          </div>
          <div id="qr-data-fields">
            <div class="form-group">
              <label>Data/Content <span style="color: red;">*</span></label>
              <input type="text" id="qr-data" required placeholder="Enter QR code content">
            </div>
          </div>
          <div class="form-group">
            <label>Size (pixels)</label>
            <input type="number" id="qr-size" value="150" min="50" max="500" step="10">
          </div>
          <div class="form-group">
            <label>Error Correction Level</label>
            <select id="qr-correction">
              <option value="L">Low (7% recovery)</option>
              <option value="M" selected>Medium (15% recovery)</option>
              <option value="Q">Quartile (25% recovery)</option>
              <option value="H">High (30% recovery)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Position</label>
            <select id="qr-position">
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" onclick="closeQRModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add QR Code</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  await loadTemplatesList();
}

// Store templates globally for filtering
let allTemplates: any[] = [];
let currentEditingTemplate: any = null;

async function loadTemplatesList() {
  const listDiv = document.getElementById('templates-list');
  if (!listDiv) return;
  
  try {
    // Show loading state
    listDiv.innerHTML = `
      <div style="display: flex; justify-content: center; padding: 2rem;">
        <div>Loading templates...</div>
      </div>
    `;
    
    const templates = await window.posAPI.templates.getAll();
    allTemplates = templates; // Store for filtering
    
    if (templates.length === 0) {
      listDiv.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <p style="color: var(--color-text-tertiary); margin-bottom: 1rem;">No templates found</p>
          <button class="btn btn-primary" onclick="showCreateTemplateModal()">Create Your First Template</button>
        </div>
      `;
    } else {
      renderTemplatesList(templates);
    }
  } catch (error: any) {
    listDiv.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--color-danger);">
        <p>Failed to load templates</p>
        <small>${error.message}</small>
        <br><br>
        <button class="btn btn-secondary" onclick="loadTemplatesList()">Retry</button>
      </div>
    `;
    showToast('Failed to load templates: ' + error.message, 'error');
  }
}

function renderTemplatesList(templates: any[]) {
  const listDiv = document.getElementById('templates-list');
  if (!listDiv) return;
  
  listDiv.innerHTML = `
    <div style="max-height: 600px; overflow-y: auto;">
      <table class="table">
        <thead style="position: sticky; top: 0; background: var(--color-bg-primary); z-index: 10;">
          <tr>
            <th>Name</th>
            <th style="text-align: center;">Default</th>
            <th>Size</th>
            <th>Layout</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${templates.map((t: any) => `
            <tr class="template-row" data-template-id="${t.id}" 
                onmouseover="this.style.background='var(--color-bg-secondary)'" 
                onmouseout="this.style.background='transparent'">
              <td>
                <strong>${escapeHtml(t.name)}</strong>
                <br>
                <small style="color: var(--color-text-tertiary);">
                  Created: ${new Date(t.created_at).toLocaleDateString()}
                </small>
              </td>
              <td style="text-align: center;">
                ${t.is_default ? 
                  '<span class="badge badge-success">Default</span>' : 
                  '<span style="color: var(--color-text-tertiary);">-</span>'
                }
              </td>
              <td>${formatBillSize(t.preferred_bill_size || 'A4')}</td>
              <td>
                <span class="badge badge-secondary">${t.preferred_layout || 'Classic'}</span>
              </td>
              <td style="text-align: right;">
                <div style="display: flex; gap: 0.25rem; justify-content: flex-end;">
                  <button class="btn btn-sm" onclick="editTemplate(${t.id})" title="Edit">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                    </svg>
                  </button>
                  <button class="btn btn-sm" onclick="previewTemplate(${t.id})" title="Preview">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                    </svg>
                  </button>
                  <button class="btn btn-sm" onclick="duplicateTemplate(${t.id})" title="Duplicate">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6Z"/>
                      <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/>
                    </svg>
                  </button>
                  ${!t.is_default ? `
                    <button class="btn btn-sm btn-primary" onclick="setDefaultTemplate(${t.id})" title="Set as Default">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                      </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteTemplate(${t.id}, '${escapeHtml(t.name)}')" title="Delete">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                      </svg>
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="padding: 0.5rem; text-align: center; border-top: 1px solid var(--color-border); color: var(--color-text-tertiary);">
      ${templates.length} template${templates.length !== 1 ? 's' : ''}
    </div>
  `;
}

// Helper functions for template display
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatBillSize(size: string): string {
  const sizeMap: { [key: string]: string } = {
    'A3': 'A3',
    'A4': 'A4',
    'A5': 'A5',
    'Letter': 'Letter',
    'Legal': 'Legal',
    'Thermal80': '80mm',
    'Thermal58': '58mm',
    'Thermal57': '57mm',
    'Thermal76': '76mm'
  };
  return sizeMap[size] || size;
}

// Filter templates
function filterTemplates() {
  const searchInput = document.getElementById('template-search') as HTMLInputElement;
  const filterSelect = document.getElementById('template-filter') as HTMLSelectElement;
  
  if (!searchInput || !filterSelect) return;
  
  const searchTerm = searchInput.value.toLowerCase();
  const filterType = filterSelect.value;
  
  let filtered = allTemplates;
  
  // Apply filter
  if (filterType === 'default') {
    filtered = filtered.filter(t => t.is_default);
  } else if (filterType === 'custom') {
    filtered = filtered.filter(t => !t.is_default);
  }
  
  // Apply search
  if (searchTerm) {
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(searchTerm) ||
      (t.preferred_bill_size || '').toLowerCase().includes(searchTerm) ||
      (t.preferred_layout || '').toLowerCase().includes(searchTerm)
    );
  }
  
  renderTemplatesList(filtered);
}

async function editTemplate(templateId: number) {
  try {
    const template = await window.posAPI.templates.getById(templateId);
    const assets = await window.posAPI.templates.getAssets(templateId);
    
    if (!template) {
      showToast('Template not found', 'error');
      return;
    }
    
    currentEditingTemplate = template;
    const headerData = JSON.parse(template.header_json || '{}');
    const footerData = JSON.parse(template.footer_json || '{}');
    const editorDiv = document.getElementById('template-editor');
    const templateActions = document.getElementById('template-actions');
    
    if (!editorDiv) return;
    
    // Show template actions
    if (templateActions) {
      templateActions.style.display = 'block';
    }
    
    editorDiv.innerHTML = `
      <form id="template-form" data-template-id="${templateId}">
        <div style="margin-bottom: 1rem;">
          <h4 style="margin: 0;">${escapeHtml(template.name)}</h4>
          ${template.is_default ? '<span class="badge badge-success">Default Template</span>' : ''}
        </div>
        
        <div class="form-group">
          <label>Template Name</label>
          <input type="text" id="template-name" value="${escapeHtml(template.name)}" 
                 required maxlength="100" ${template.is_default ? 'readonly' : ''}>
        </div>
        
        <fieldset style="border: 1px solid var(--color-border); padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
          <legend style="padding: 0 0.5rem; font-weight: bold;">Business Information</legend>
          
          <div class="form-group">
            <label>Business Name</label>
            <input type="text" id="business-name" value="${escapeHtml(headerData.businessName || '')}" 
                   placeholder="Your Business Name" maxlength="100">
          </div>
          
          <div class="form-group">
            <label>Business Address</label>
            <textarea id="business-address" rows="3" placeholder="123 Main Street\nCity, State 12345">${escapeHtml(headerData.businessAddress || '')}</textarea>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <div class="form-group">
              <label>Phone</label>
              <input type="tel" id="business-phone" value="${escapeHtml(headerData.businessPhone || '')}" 
                     placeholder="+91 98765 43210">
            </div>
            
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="business-email" value="${escapeHtml(headerData.businessEmail || '')}" 
                     placeholder="contact@business.com">
            </div>
          </div>
          
          <div class="form-group">
            <label>Tax ID/GSTIN</label>
            <input type="text" id="business-taxid" value="${escapeHtml(headerData.businessTaxId || '')}" 
                   placeholder="GSTIN or Tax ID">
          </div>
          
          <div class="form-group">
            <label>Website</label>
            <input type="url" id="business-website" value="${escapeHtml(headerData.businessWebsite || '')}" 
                   placeholder="https://www.yourbusiness.com">
          </div>
        </fieldset>
        
        <fieldset style="border: 1px solid var(--color-border); padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
          <legend style="padding: 0 0.5rem; font-weight: bold;">Invoice Settings</legend>
          
          <div class="form-group">
            <label>Invoice Prefix</label>
            <input type="text" id="invoice-prefix" value="${escapeHtml(headerData.invoicePrefix || 'INV-')}" 
                   placeholder="INV-" maxlength="10">
          </div>
          
          <div class="form-group">
            <label>Footer Text</label>
            <textarea id="footer-text" rows="3" placeholder="Thank you for your business!">${escapeHtml(footerData.footerText || headerData.footerText || 'Thank you for your business!')}</textarea>
          </div>
          
          <div class="form-group">
            <label>Terms & Conditions</label>
            <textarea id="terms-conditions" rows="3" placeholder="Payment due within 30 days...">${escapeHtml(footerData.termsConditions || '')}</textarea>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <div class="form-group">
              <label>Preferred Bill Size</label>
              <select id="bill-size">
                <option value="A3" ${template.preferred_bill_size === 'A3' ? 'selected' : ''}>A3 (297 × 420 mm)</option>
                <option value="A4" ${template.preferred_bill_size === 'A4' ? 'selected' : ''}>A4 (210 × 297 mm)</option>
                <option value="A5" ${template.preferred_bill_size === 'A5' ? 'selected' : ''}>A5 (148 × 210 mm)</option>
                <option value="Letter" ${template.preferred_bill_size === 'Letter' ? 'selected' : ''}>Letter (8.5 × 11 in)</option>
                <option value="Legal" ${template.preferred_bill_size === 'Legal' ? 'selected' : ''}>Legal (8.5 × 14 in)</option>
                <option value="Thermal80" ${template.preferred_bill_size === 'Thermal80' ? 'selected' : ''}>80mm Thermal</option>
                <option value="Thermal58" ${template.preferred_bill_size === 'Thermal58' ? 'selected' : ''}>58mm Thermal</option>
                <option value="Thermal57" ${template.preferred_bill_size === 'Thermal57' ? 'selected' : ''}>57mm Thermal</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Layout Style</label>
              <select id="layout">
                <option value="Classic" ${template.preferred_layout === 'Classic' ? 'selected' : ''}>Classic</option>
                <option value="Minimal" ${template.preferred_layout === 'Minimal' ? 'selected' : ''}>Minimal</option>
                <option value="Compact" ${template.preferred_layout === 'Compact' ? 'selected' : ''}>Compact</option>
                <option value="Detailed" ${template.preferred_layout === 'Detailed' ? 'selected' : ''}>Detailed</option>
              </select>
            </div>
          </div>
        </fieldset>
        
        <fieldset style="border: 1px solid var(--color-border); padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
          <legend style="padding: 0 0.5rem; font-weight: bold;">Logo & Branding</legend>
          
          <div id="logo-section" style="margin-bottom: 1rem;">
            ${(() => {
              const logoAsset = assets.find((a: any) => a.type === 'logo');
              if (logoAsset) {
                let logoPreview = '';
                if (logoAsset.blob) {
                  // blob is already base64 encoded from the backend
                  const metaData = JSON.parse(logoAsset.meta_json || '{}');
                  const mimeType = metaData.mimeType || 'image/png';
                  const logoSrc = `data:${mimeType};base64,${logoAsset.blob}`;
                  logoPreview = `<img src="${logoSrc}" alt="Logo preview" style="max-height: 60px; max-width: 150px; object-fit: contain; display: block; margin: 0 auto 0.5rem auto;">`;
                }
                return `
                  <div style="padding: 1rem; background: var(--color-bg-tertiary); border-radius: 4px; margin-bottom: 0.5rem;">
                    ${logoPreview}
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <strong>✅ Logo uploaded</strong>
                      <button type="button" class="btn btn-sm btn-danger" onclick="removeLogo(${templateId})">Remove</button>
                    </div>
                  </div>`;
              }
              return '<p style="color: var(--color-text-tertiary);">No logo uploaded</p>';
            })()}
            <button type="button" class="btn btn-sm btn-primary" onclick="uploadLogo(${templateId})">
              ${assets.find((a: any) => a.type === 'logo') ? 'Replace Logo' : 'Upload Logo'}
            </button>
          </div>
        </fieldset>
        
        <fieldset style="border: 1px solid var(--color-border); padding: 1rem; margin-bottom: 1rem; border-radius: 4px;">
          <legend style="padding: 0 0.5rem; font-weight: bold;">QR Codes</legend>
          
          <div id="qr-codes-list" style="margin-bottom: 1rem;">
            ${assets.filter((a: any) => a.type === 'qr').length > 0 ? 
              assets.filter((a: any) => a.type === 'qr').map((qr: any) => {
                const meta = JSON.parse(qr.meta_json);
                return `
                  <div class="qr-item" style="margin-bottom: 0.5rem; padding: 0.75rem; background: var(--color-bg-tertiary); border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>${escapeHtml(meta.label)}</strong><br>
                      <small style="color: var(--color-text-tertiary);">${escapeHtml(meta.data).substring(0, 50)}${meta.data.length > 50 ? '...' : ''}</small>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="removeQRCode(${qr.id}, ${templateId})">Remove</button>
                  </div>
                `;
              }).join('') :
              '<p style="color: var(--color-text-tertiary);">No QR codes added</p>'
            }
          </div>
          <button type="button" class="btn btn-sm btn-primary" onclick="showAddQRModal(${templateId})">
            + Add QR Code
          </button>
        </fieldset>
        
        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="previewTemplate(${templateId})" style="flex: 1;">
            Preview
          </button>
          <button type="submit" class="btn btn-primary" style="flex: 2;">
            Save Changes
          </button>
        </div>
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

// Users page - Enhanced with Roles & Permissions
async function renderUsers() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  // Check if user has permission to view users
  try {
    const canView = await window.posAPI.users.hasPermission(currentUser?.id || 0, 'users', 'read');
    if (!canView) {
      contentArea.innerHTML = '<h2>Unauthorized: You do not have permission to view users</h2>';
      return;
    }
  } catch {
    contentArea.innerHTML = '<h2>Unauthorized</h2>';
    return;
  }
  
  contentArea.innerHTML = `
    <div class="flex-between mb-4">
      <h2>User & Role Management</h2>
      <div>
        <button class="btn btn-secondary" onclick="showRoleManagement()">Manage Roles</button>
        <button class="btn btn-primary" onclick="showCreateUserModal()">Add User</button>
      </div>
    </div>
    
    <!-- Tabs for Users, Roles, and Audit Log -->
    <div class="tabs mb-3">
      <button class="tab-btn active" data-tab="users" onclick="switchUserTab('users')">Users</button>
      <button class="tab-btn" data-tab="roles" onclick="switchUserTab('roles')">Roles</button>
      <button class="tab-btn" data-tab="permissions" onclick="switchUserTab('permissions')">Permissions</button>
      <button class="tab-btn" data-tab="audit" onclick="switchUserTab('audit')">Audit Log</button>
    </div>
    
    <!-- Users Tab -->
    <div id="users-tab" class="tab-content active">
      <div class="card">
        <div id="users-list">Loading...</div>
      </div>
    </div>
    
    <!-- Roles Tab -->
    <div id="roles-tab" class="tab-content" style="display: none;">
      <div class="card">
        <div class="flex-between mb-3">
          <h3>System Roles</h3>
          <button class="btn btn-sm btn-primary" onclick="showCreateRoleModal()">Create Role</button>
        </div>
        <div id="roles-list">Loading...</div>
      </div>
    </div>
    
    <!-- Permissions Tab -->
    <div id="permissions-tab" class="tab-content" style="display: none;">
      <div class="card">
        <h3>System Permissions</h3>
        <div id="permissions-list">Loading...</div>
      </div>
    </div>
    
    <!-- Audit Log Tab -->
    <div id="audit-tab" class="tab-content" style="display: none;">
      <div class="card">
        <h3>Permission Changes Audit Log</h3>
        <div id="audit-list">Loading...</div>
      </div>
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
            <select id="new-user-role" required>
              <!-- Will be populated with available roles -->
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Create</button>
        </form>
      </div>
    </div>
    
    <!-- Create Role Modal -->
    <div id="create-role-modal" class="modal" style="display:none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Role</h3>
          <button onclick="closeCreateRoleModal()">&times;</button>
        </div>
        <form id="create-role-form">
          <div class="form-group">
            <label>Role Name</label>
            <input type="text" id="new-role-name" required>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="new-role-description" rows="3"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Create Role</button>
        </form>
      </div>
    </div>
    
    <!-- User Permissions Modal -->
    <div id="user-permissions-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>Manage User Permissions</h3>
          <button onclick="closeUserPermissionsModal()">&times;</button>
        </div>
        <div id="user-permissions-content">
          <!-- Will be populated when opened -->
        </div>
      </div>
    </div>
    
    <!-- Role Permissions Modal -->
    <div id="role-permissions-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3>Manage Role Permissions</h3>
          <button onclick="closeRolePermissionsModal()">&times;</button>
        </div>
        <div id="role-permissions-content">
          <!-- Will be populated when opened -->
        </div>
      </div>
    </div>
  `;
  
  // Load users list
  await loadUsersList();
  // Load roles for the dropdown
  await loadRolesForDropdown();
}

// Installments page with comprehensive functionality
async function renderInstallments() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  contentArea.innerHTML = `
    <div class="flex-between mb-4">
      <h2>Installment Management</h2>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-secondary" onclick="exportInstallments()">Export Data</button>
        <button class="btn btn-primary" onclick="showInstallmentWizard()">Create New Plan</button>
      </div>
    </div>
    
    <!-- Statistics Overview -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div class="card" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white;">
        <h4 style="color: white; margin: 0 0 0.5rem 0;">Overdue Amount</h4>
        <div id="total-overdue" style="font-size: 1.8rem; font-weight: bold;">₹0.00</div>
        <div id="overdue-count" style="font-size: 0.9rem; opacity: 0.8;">0 installments</div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, #3498db, #2980b9); color: white;">
        <h4 style="color: white; margin: 0 0 0.5rem 0;">Active Plans</h4>
        <div id="active-plans-count" style="font-size: 1.8rem; font-weight: bold;">0</div>
        <div id="active-plans-value" style="font-size: 0.9rem; opacity: 0.8;">₹0.00 total</div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, #2ecc71, #27ae60); color: white;">
        <h4 style="color: white; margin: 0 0 0.5rem 0;">Collected Today</h4>
        <div id="collected-today" style="font-size: 1.8rem; font-weight: bold;">₹0.00</div>
        <div id="collected-count" style="font-size: 0.9rem; opacity: 0.8;">0 payments</div>
      </div>
      <div class="card" style="background: linear-gradient(135deg, #f39c12, #e67e22); color: white;">
        <h4 style="color: white; margin: 0 0 0.5rem 0;">Due This Week</h4>
        <div id="due-this-week" style="font-size: 1.8rem; font-weight: bold;">₹0.00</div>
        <div id="due-week-count" style="font-size: 0.9rem; opacity: 0.8;">0 installments</div>
      </div>
    </div>
    
    <!-- Search and Filters -->
    <div class="card mb-3">
      <div style="padding: 1rem; display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
        <input type="text" id="installment-search" placeholder="Search by customer name or order ID..." 
               style="flex: 1; min-width: 200px;" onkeyup="filterInstallments()">
        <select id="installment-status-filter" onchange="filterInstallments()" style="min-width: 150px;">
          <option value="">All Status</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="active">Active Plans</option>
          <option value="completed">Completed Plans</option>
        </select>
        <input type="date" id="installment-date-from" onchange="filterInstallments()" title="From Date">
        <input type="date" id="installment-date-to" onchange="filterInstallments()" title="To Date">
        <button class="btn btn-sm btn-secondary" onclick="clearInstallmentFilters()">Clear Filters</button>
      </div>
    </div>
    
    <!-- Tabbed View -->
    <div class="card">
      <div class="card-header">
        <div class="tab-nav">
          <button class="tab-btn active" onclick="switchInstallmentTab('overdue')">Overdue</button>
          <button class="tab-btn" onclick="switchInstallmentTab('upcoming')">Upcoming</button>
          <button class="tab-btn" onclick="switchInstallmentTab('active')">Active Plans</button>
          <button class="tab-btn" onclick="switchInstallmentTab('completed')">Completed</button>
          <button class="tab-btn" onclick="switchInstallmentTab('all')">All Installments</button>
        </div>
      </div>
      <div id="installments-content">Loading...</div>
    </div>
    
    <!-- Installment Creation Wizard Modal -->
    <div id="installment-wizard-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3>Create Installment Plan</h3>
          <span class="close" onclick="closeInstallmentWizard()">&times;</span>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label>Select Order <span style="color: red;">*</span></label>
              <select id="installment-order" class="form-control" onchange="updateInstallmentPreview()">
                <option value="">Select an order...</option>
              </select>
            </div>
            <div class="form-group">
              <label>Start Date <span style="color: red;">*</span></label>
              <input type="date" id="installment-start-date" class="form-control" 
                     value="${new Date().toISOString().split('T')[0]}" onchange="updateInstallmentPreview()">
            </div>
            <div class="form-group">
              <label>Number of Installments <span style="color: red;">*</span></label>
              <input type="number" id="num-installments" min="2" max="36" value="3" 
                     class="form-control" onchange="updateInstallmentPreview()">
            </div>
            <div class="form-group">
              <label>Frequency <span style="color: red;">*</span></label>
              <select id="installment-frequency" class="form-control" onchange="updateInstallmentPreview()">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly" selected>Monthly</option>
              </select>
            </div>
            <div class="form-group">
              <label>Down Payment (₹)</label>
              <input type="number" id="down-payment" min="0" value="0" step="0.01" 
                     class="form-control" onchange="updateInstallmentPreview()">
            </div>
            <div class="form-group">
              <label>Processing Fee (₹)</label>
              <input type="number" id="processing-fee" min="0" value="0" step="0.01" 
                     class="form-control" onchange="updateInstallmentPreview()">
            </div>
          </div>
          
          <!-- Installment Preview -->
          <div id="installment-preview" style="margin-top: 1.5rem; padding: 1rem; background: var(--color-bg-tertiary); border-radius: 8px;">
            <h4>Payment Schedule Preview</h4>
            <div id="installment-schedule">Select an order to see payment schedule</div>
          </div>
          
          <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div id="installment-validation" style="color: var(--color-text-error);"></div>
            <div>
              <button class="btn btn-secondary" onclick="closeInstallmentWizard()">Cancel</button>
              <button class="btn btn-primary" onclick="createInstallmentPlan()" style="margin-left: 0.5rem;">Create Plan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Payment Recording Modal -->
    <div id="payment-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3>Record Payment</h3>
          <span class="close" onclick="closePaymentModal()">&times;</span>
        </div>
        <div class="modal-body">
          <div id="payment-installment-info" style="padding: 1rem; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 1rem;">
            <!-- Installment details will be shown here -->
          </div>
          <div class="form-group">
            <label>Payment Amount (₹) <span style="color: red;">*</span></label>
            <input type="number" id="payment-amount" step="0.01" min="0" class="form-control">
          </div>
          <div class="form-group">
            <label>Payment Method <span style="color: red;">*</span></label>
            <select id="payment-method" class="form-control">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div class="form-group">
            <label>Reference Number</label>
            <input type="text" id="payment-reference" class="form-control" placeholder="Transaction ID, Cheque No, etc.">
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea id="payment-notes" class="form-control" rows="2" placeholder="Optional notes..."></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button class="btn btn-secondary" onclick="closePaymentModal()">Cancel</button>
            <button class="btn btn-primary" onclick="submitPayment()">Record Payment</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Installment Details Modal -->
    <div id="installment-details-modal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>Installment Plan Details</h3>
          <span class="close" onclick="closeInstallmentDetails()">&times;</span>
        </div>
        <div class="modal-body" id="installment-details-content">
          <!-- Details will be loaded here -->
        </div>
      </div>
    </div>
  `;
  
  // Load initial data
  await loadInstallmentStats();
  await switchInstallmentTab('overdue');  // Show overdue tab by default
}

// Load installment statistics
async function loadInstallmentStats() {
  try {
    // Get all data for statistics
    const overdueList = await window.posAPI.installments.getOverdue();
    const activePlans = await window.posAPI.installments.getActivePlans();
    
    // Calculate statistics
    const totalOverdue = overdueList.reduce((sum: number, inst: any) => sum + (inst.amount_due || 0), 0);
    const activePlansTotal = activePlans.reduce((sum: number, plan: any) => sum + (plan.total_amount || 0), 0);
    
    // Update overdue stats
    const overdueEl = document.getElementById('total-overdue');
    const overdueCountEl = document.getElementById('overdue-count');
    if (overdueEl) overdueEl.textContent = `₹${totalOverdue.toFixed(2)}`;
    if (overdueCountEl) overdueCountEl.textContent = `${overdueList.length} installment${overdueList.length !== 1 ? 's' : ''}`;
    
    // Update active plans stats
    const activePlansCountEl = document.getElementById('active-plans-count');
    const activePlansValueEl = document.getElementById('active-plans-value');
    if (activePlansCountEl) activePlansCountEl.textContent = activePlans.length.toString();
    if (activePlansValueEl) activePlansValueEl.textContent = `₹${activePlansTotal.toFixed(2)} total`;
    
    // Calculate today's collections (would need actual payment data)
    // For now, showing placeholder
    const collectedTodayEl = document.getElementById('collected-today');
    const collectedCountEl = document.getElementById('collected-count');
    if (collectedTodayEl) collectedTodayEl.textContent = `₹0.00`;
    if (collectedCountEl) collectedCountEl.textContent = `0 payments`;
    
    // Calculate due this week
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const dueThisWeek = overdueList.filter((inst: any) => {
      const dueDate = new Date(inst.due_date);
      return dueDate <= weekFromNow;
    });
    const dueThisWeekTotal = dueThisWeek.reduce((sum: number, inst: any) => sum + (inst.amount_due || 0), 0);
    
    const dueWeekEl = document.getElementById('due-this-week');
    const dueWeekCountEl = document.getElementById('due-week-count');
    if (dueWeekEl) dueWeekEl.textContent = `₹${dueThisWeekTotal.toFixed(2)}`;
    if (dueWeekCountEl) dueWeekCountEl.textContent = `${dueThisWeek.length} installment${dueThisWeek.length !== 1 ? 's' : ''}`;
    
  } catch (error: any) {
    console.error('Failed to load statistics:', error);
  }
}

// Switch between installment tabs
async function switchInstallmentTab(tab: string) {
  // Update tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent?.toLowerCase().includes(tab.replace('_', ' '))) {
      btn.classList.add('active');
    }
  });
  
  const contentDiv = document.getElementById('installments-content');
  if (!contentDiv) return;
  
  contentDiv.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
  
  try {
    switch (tab) {
      case 'overdue':
        await loadOverdueInstallments();
        break;
      case 'upcoming':
        await loadUpcomingInstallments();
        break;
      case 'active':
        await loadActivePlans();
        break;
      case 'completed':
        await loadCompletedPlans();
        break;
      case 'all':
        await loadAllInstallments();
        break;
    }
  } catch (error: any) {
    contentDiv.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--color-text-error);">
        <p>Failed to load installments</p>
        <p style="font-size: 0.9rem;">${escapeHtml(error.message || 'Unknown error')}</p>
        <button class="btn btn-primary" onclick="switchInstallmentTab('${tab}')">Retry</button>
      </div>
    `;
  }
}

// Load overdue installments
async function loadOverdueInstallments() {
  const contentDiv = document.getElementById('installments-content');
  if (!contentDiv) return;
  
  const overdueList = await window.posAPI.installments.getOverdue();
  
  if (overdueList.length === 0) {
    contentDiv.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--color-text-tertiary);">
        <h3>No Overdue Installments</h3>
        <p>All installments are up to date!</p>
      </div>
    `;
    return;
  }
  
  contentDiv.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Due Date</th>
          <th>Days Overdue</th>
          <th>Amount</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${overdueList.map((inst: any) => {
          const daysOverdue = Math.floor((Date.now() - new Date(inst.due_date).getTime()) / (1000 * 60 * 60 * 24));
          const overdueClass = daysOverdue > 30 ? 'text-danger' : daysOverdue > 7 ? 'text-warning' : '';
          
          return `
            <tr>
              <td>#${inst.order_id || 'N/A'}</td>
              <td>${escapeHtml(inst.customer?.name || 'Walk-in')}</td>
              <td>${new Date(inst.due_date).toLocaleDateString()}</td>
              <td class="${overdueClass}"><strong>${daysOverdue} days</strong></td>
              <td><strong>₹${(inst.amount_due || 0).toFixed(2)}</strong></td>
              <td>
                <div style="display: flex; gap: 0.25rem;">
                  <button class="btn btn-sm btn-primary" onclick="recordPayment(${inst.id})">Record Payment</button>
                  <button class="btn btn-sm btn-secondary" onclick="sendReminder(${inst.id})" title="Send Reminder">
                    📧
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="viewInstallmentDetails(${inst.plan_id})">View Plan</button>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Load upcoming installments
async function loadUpcomingInstallments() {
  const contentDiv = document.getElementById('installments-content');
  if (!contentDiv) return;
  
  // For now, we'll get all plans and filter upcoming installments
  const activePlans = await window.posAPI.installments.getActivePlans();
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 3rem; color: var(--color-text-tertiary);">
      <h3>Upcoming Installments</h3>
      <p>Feature coming soon - will show installments due in the next 30 days</p>
    </div>
  `;
}

// Load active plans
async function loadActivePlans() {
  const contentDiv = document.getElementById('installments-content');
  if (!contentDiv) return;
  
  const activePlans = await window.posAPI.installments.getActivePlans();
  
  if (activePlans.length === 0) {
    contentDiv.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--color-text-tertiary);">
        <h3>No Active Plans</h3>
        <p>Create a new installment plan to get started</p>
      </div>
    `;
    return;
  }
  
  contentDiv.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Total Amount</th>
          <th>Frequency</th>
          <th>Progress</th>
          <th>Next Due</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${activePlans.map((plan: any) => {
          const progress = plan.paid_count && plan.total_count 
            ? Math.round((plan.paid_count / plan.total_count) * 100) 
            : 0;
          const progressColor = progress >= 75 ? 'success' : progress >= 50 ? 'info' : progress >= 25 ? 'warning' : 'secondary';
          
          return `
            <tr>
              <td>#${plan.order_id}</td>
              <td>${escapeHtml(plan.customer?.name || 'Walk-in')}</td>
              <td>₹${(plan.principal || 0).toFixed(2)}</td>
              <td>${plan.frequency}</td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <div style="flex: 1; height: 20px; background: var(--color-bg-tertiary); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${progress}%; height: 100%; background: var(--color-${progressColor}); transition: width 0.3s;"></div>
                  </div>
                  <span style="min-width: 60px;">${plan.paid_count || 0}/${plan.total_count || 0}</span>
                </div>
              </td>
              <td>${plan.next_due_date ? new Date(plan.next_due_date).toLocaleDateString() : 'N/A'}</td>
              <td>
                <div style="display: flex; gap: 0.25rem;">
                  <button class="btn btn-sm btn-primary" onclick="viewInstallmentDetails(${plan.id})">View</button>
                  <button class="btn btn-sm btn-success" onclick="payoffPlan(${plan.id})">Payoff</button>
                  ${plan.paid_count === 0 ? `<button class="btn btn-sm btn-danger" onclick="cancelPlan(${plan.id})">Cancel</button>` : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Load completed plans
async function loadCompletedPlans() {
  const contentDiv = document.getElementById('installments-content');
  if (!contentDiv) return;
  
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 3rem; color: var(--color-text-tertiary);">
      <h3>Completed Plans</h3>
      <p>Feature coming soon - will show fully paid installment plans</p>
    </div>
  `;
}

// Load all installments
async function loadAllInstallments() {
  const contentDiv = document.getElementById('installments-content');
  if (!contentDiv) return;
  
  const activePlans = await window.posAPI.installments.getActivePlans();
  const overdueList = await window.posAPI.installments.getOverdue();
  
  contentDiv.innerHTML = `
    <div style="padding: 1rem;">
      <h4>Summary</h4>
      <p>Total Active Plans: ${activePlans.length}</p>
      <p>Total Overdue Installments: ${overdueList.length}</p>
    </div>
  `;
}

// Filter installments
function filterInstallments() {
  // Get current tab and reload with filters
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    const tabText = activeTab.textContent?.toLowerCase() || '';
    if (tabText.includes('overdue')) switchInstallmentTab('overdue');
    else if (tabText.includes('upcoming')) switchInstallmentTab('upcoming');
    else if (tabText.includes('active')) switchInstallmentTab('active');
    else if (tabText.includes('completed')) switchInstallmentTab('completed');
    else switchInstallmentTab('all');
  }
}

// Clear installment filters
function clearInstallmentFilters() {
  (document.getElementById('installment-search') as HTMLInputElement).value = '';
  (document.getElementById('installment-status-filter') as HTMLSelectElement).value = '';
  (document.getElementById('installment-date-from') as HTMLInputElement).value = '';
  (document.getElementById('installment-date-to') as HTMLInputElement).value = '';
  filterInstallments();
}

// Export installments data
async function exportInstallments() {
  try {
    const overdueList = await window.posAPI.installments.getOverdue();
    const activePlans = await window.posAPI.installments.getActivePlans();
    
    // Create CSV content
    const csvRows = [
      ['Type', 'Order ID', 'Customer', 'Amount', 'Due Date', 'Status', 'Frequency', 'Progress'],
      ...overdueList.map((inst: any) => [
        'Overdue Installment',
        inst.order_id || '',
        inst.customer?.name || 'Walk-in',
        inst.amount_due || 0,
        inst.due_date || '',
        'Overdue',
        '',
        ''
      ]),
      ...activePlans.map((plan: any) => [
        'Active Plan',
        plan.order_id || '',
        plan.customer?.name || 'Walk-in',
        plan.principal || 0,
        plan.next_due_date || '',
        'Active',
        plan.frequency || '',
        `${plan.paid_count || 0}/${plan.total_count || 0}`
      ])
    ];
    
    const csvContent = csvRows.map(row => row.map((cell: any) => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `installments_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Installments data exported successfully', 'success');
  } catch (error: any) {
    showToast('Failed to export data: ' + error.message, 'error');
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

// History page functions
(window as any).renderHistory = renderHistory;
(window as any).loadOrderHistory = loadOrderHistory;
(window as any).filterOrders = filterOrders;
(window as any).previewOrder = previewOrder;
(window as any).closeOrderPreview = closeOrderPreview;
(window as any).printOrderPreview = printOrderPreview;
(window as any).duplicateOrder = duplicateOrder;
(window as any).exportOrderHistory = exportOrderHistory;

// Test preview function
(window as any).testOrderPreview = async () => {
  try {
    // Test with a valid order ID (usually 1 if there are orders)
    await previewOrder(1);
    console.log('Preview test: Success');
  } catch (error) {
    console.error('Preview test failed:', error);
  }
};

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
    
    // Always show the dropdown with "Add New" option
    let content = '';
    
    if (results && results.length > 0) {
      content = results.map((c: any) => `
        <div class="list-item" style="padding:.75rem 1rem; cursor:pointer; border-bottom: 1px solid var(--color-border);" 
             onclick="selectCustomer(${c.id}, '${String(c.name).replace(/'/g, "&#39;")}', '${String(c.phone || '').replace(/'/g, "&#39;")}', '${String(c.email || '').replace(/'/g, "&#39;")}')" 
             onmouseover="this.style.background='var(--color-bg-secondary)'" 
             onmouseout="this.style.background='transparent'">
          <div><strong>${c.name}</strong></div>
          <div style="font-size:.85rem; color: var(--color-text-secondary);">${c.phone || ''} ${c.email ? ' · ' + c.email : ''}</div>
        </div>
      `).join('');
    }
    
    // Add "Create New Customer" option at the bottom
    content += `
      <div class="list-item" style="padding:.75rem 1rem; cursor:pointer; background: var(--color-bg-tertiary); border-top: 2px solid var(--color-primary);" 
           onclick="addNewCustomerFromPOS('${q.replace(/'/g, "&#39;")}')" 
           onmouseover="this.style.background='var(--color-primary-light)'" 
           onmouseout="this.style.background='var(--color-bg-tertiary)'">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <strong style="color: var(--color-primary);">+ Add New Customer</strong>
          ${q ? `<span style="color: var(--color-text-secondary);">"${q}"</span>` : ''}
        </div>
        <div style="font-size:.85rem; color: var(--color-text-secondary);">Click to create new customer</div>
      </div>
    `;
    
    box.innerHTML = `
      <div class="card" style="box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid var(--color-border);">
        <div style="max-height: 300px; overflow: auto;">
          ${content}
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

function selectCustomer(id: number, name: string, phone?: string, email?: string) {
  selectedCustomer = { id, name, phone, email };
  const sec = document.getElementById('selected-customer');
  if (sec) {
    (document.getElementById('customer-name-display') as HTMLElement).textContent = name;
    const detailsElem = document.getElementById('customer-details');
    if (detailsElem) {
      const details = [];
      if (phone) details.push(phone);
      if (email) details.push(email);
      detailsElem.textContent = details.join(' · ') || 'Walk-in Customer';
    }
    sec.style.display = 'block';
  }
  hideCustomerSuggestions();
  const input = document.getElementById('customer-search') as HTMLInputElement | null;
  if (input) input.value = '';
  
  // Focus back to item name for smooth workflow
  document.getElementById('item-name')?.focus();
}

// New function to add customer directly from POS
async function addNewCustomerFromPOS(name: string) {
  if (!name.trim()) {
    showToast('Please enter a customer name', 'warning');
    return;
  }
  
  try {
    // Quick add customer with just the name
    const customer = await window.posAPI.customers.create({
      name: name.trim(),
      phone: '',
      email: '',
      gstin: '',
      address: ''
    });
    
    showToast(`Customer "${customer.name}" added successfully!`, 'success');
    selectCustomer(customer.id, customer.name, customer.phone, customer.email);
  } catch (error: any) {
    showToast('Failed to add customer: ' + error.message, 'error');
  }
}

// Frequent orders helpers
async function loadFrequentOrders() {
  try {
    const list = document.getElementById('frequent-orders-list');
    if (!list) return;
    const items = await window.posAPI.frequentOrders.getAll(currentUser?.id);
    if (!items || items.length === 0) {
      list.innerHTML = '<p class="text-center" style="color: var(--color-text-tertiary); padding: 1rem;">No saved templates yet</p>';
      return;
    }
    list.innerHTML = `
      <div style="display:flex; flex-direction: column; gap: .5rem;">
        ${items.map((fo: any) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 4px;">
            <button class="btn btn-sm btn-primary" onclick="applyFrequent(${fo.id})" style="flex: 1; margin-right: 0.5rem;">
              ${fo.label}
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteFrequent(${fo.id})" title="Delete">
              ×
            </button>
          </div>
        `).join('')}
      </div>
    `;
  } catch {}
}

// Delete frequent order
async function deleteFrequent(id: number) {
  try {
    if (!confirm('Delete this template?')) return;
    await window.posAPI.frequentOrders.delete(id);
    showToast('Template deleted', 'success');
    loadFrequentOrders();
  } catch (err: any) {
    showToast('Failed to delete template: ' + (err.message || err), 'error');
  }
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
(window as any).addNewCustomerFromPOS = addNewCustomerFromPOS;
(window as any).applyFrequent = applyFrequent;
(window as any).deleteFrequent = deleteFrequent;
(window as any).applyOpenOrder = applyOpenOrder;
(window as any).deleteOpenOrder = deleteOpenOrder;
(window as any).printPreview = printPreview;
(window as any).showCreateUserModal = showCreateUserModal;
(window as any).closeCreateUserModal = closeCreateUserModal;
(window as any).toggleUserStatus = toggleUserStatus;
(window as any).deleteUser = deleteUser;
(window as any).recordPayment = recordPayment;
(window as any).viewInstallmentDetails = viewInstallmentDetails;
// Template management function exports
(window as any).showCreateTemplateModal = showCreateTemplateModal;
(window as any).closeCreateTemplateModal = closeCreateTemplateModal;
(window as any).createNewTemplate = createNewTemplate;
(window as any).editTemplate = editTemplate;
(window as any).previewTemplate = previewTemplate;
(window as any).setDefaultTemplate = setDefaultTemplate;
(window as any).confirmDeleteTemplate = confirmDeleteTemplate;
(window as any).deleteTemplate = deleteTemplate;
(window as any).duplicateTemplate = duplicateTemplate;
(window as any).duplicateCurrentTemplate = duplicateCurrentTemplate;
(window as any).exportCurrentTemplate = exportCurrentTemplate;
(window as any).importTemplate = importTemplate;
(window as any).filterTemplates = filterTemplates;
(window as any).saveTemplate = saveTemplate;
(window as any).uploadLogo = uploadLogo;
(window as any).removeLogo = removeLogo;
(window as any).showAddQRModal = showAddQRModal;
(window as any).closeQRModal = closeQRModal;
(window as any).updateQRDataField = updateQRDataField;
(window as any).addQRCode = addQRCode;
(window as any).removeQRCode = removeQRCode;
(window as any).closeTemplatePreview = closeTemplatePreview;
(window as any).printPreviewTemplate = printPreviewTemplate;
// Installment functions
(window as any).showInstallmentWizard = showInstallmentWizard;
(window as any).closeInstallmentWizard = closeInstallmentWizard;
(window as any).createInstallmentPlan = createInstallmentPlan;
(window as any).updateInstallmentPreview = updateInstallmentPreview;
(window as any).loadInstallmentStats = loadInstallmentStats;
(window as any).switchInstallmentTab = switchInstallmentTab;
(window as any).loadOverdueInstallments = loadOverdueInstallments;
(window as any).loadUpcomingInstallments = loadUpcomingInstallments;
(window as any).loadActivePlans = loadActivePlans;
(window as any).loadCompletedPlans = loadCompletedPlans;
(window as any).loadAllInstallments = loadAllInstallments;
(window as any).filterInstallments = filterInstallments;
(window as any).clearInstallmentFilters = clearInstallmentFilters;
(window as any).exportInstallments = exportInstallments;
(window as any).closePaymentModal = closePaymentModal;
(window as any).submitPayment = submitPayment;
(window as any).closeInstallmentDetails = closeInstallmentDetails;
(window as any).sendReminder = sendReminder;
(window as any).payoffPlan = payoffPlan;
(window as any).cancelPlan = cancelPlan;
(window as any).toggleDarkMode = toggleDarkMode;
// Role and Permission Management functions
(window as any).switchUserTab = switchUserTab;
(window as any).showRoleManagement = () => switchUserTab('roles');
(window as any).showCreateRoleModal = showCreateRoleModal;
(window as any).closeCreateRoleModal = closeCreateRoleModal;
(window as any).deleteRole = deleteRole;
(window as any).editRole = (roleId: number) => console.log('Edit role:', roleId);
(window as any).showUserPermissions = showUserPermissions;
(window as any).closeUserPermissionsModal = closeUserPermissionsModal;
(window as any).showRolePermissions = showRolePermissions;
(window as any).closeRolePermissionsModal = closeRolePermissionsModal;
(window as any).toggleRolePermission = toggleRolePermission;
(window as any).addUserRole = addUserRole;
(window as any).removeUserRole = removeUserRole;
(window as any).viewRoleUsers = viewRoleUsers;
(window as any).removePermissionOverride = async (userId: number, permissionId: number) => {
  console.log('Remove permission override:', userId, permissionId);
};

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
    const roleSelect = document.getElementById('new-user-role') as HTMLSelectElement;
    const roleId = parseInt(roleSelect.value);
    
    // Create user with basic role first
    const user = await window.posAPI.users.create(username, password, 'user');
    // Then assign the selected role
    await window.posAPI.users.assignRole(user.id, roleId);
    
    showToast('User created successfully', 'success');
    closeCreateUserModal();
    await loadUsersList();
  } catch (error: any) {
    showToast('Failed to create user: ' + error.message, 'error');
  }
}

async function toggleUserStatus(userId: number, activate: boolean) {
  try {
    await window.posAPI.users.update(userId, { active: activate });
    showToast(`User ${activate ? 'activated' : 'deactivated'}`, 'success');
    await loadUsersList();
  } catch (error: any) {
    showToast('Failed to update user: ' + error.message, 'error');
  }
}

async function deleteUser(userId: number) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    await window.posAPI.users.delete(userId);
    showToast('User deleted', 'success');
    await loadUsersList();
  } catch (error: any) {
    showToast('Failed to delete user: ' + error.message, 'error');
  }
}

// Role and Permission Management Functions
async function switchUserTab(tab: string) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  const tabElement = document.getElementById(`${tab}-tab`);
  if (tabElement) {
    tabElement.style.display = 'block';
  }
  
  // Mark button as active
  const tabBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (tabBtn) {
    tabBtn.classList.add('active');
  }
  
  // Load appropriate content
  switch (tab) {
    case 'users':
      await loadUsersList();
      break;
    case 'roles':
      await loadRolesList();
      break;
    case 'permissions':
      await loadPermissionsList();
      break;
    case 'audit':
      await loadAuditLog();
      break;
  }
}

async function loadUsersList() {
  try {
    const users = await window.posAPI.users.getAll();
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
    // For each user, get their roles
    const usersWithRoles = await Promise.all(users.map(async (user: any) => {
      try {
        const userWithRoles = await window.posAPI.users.getUserWithRoles(user.id);
        return userWithRoles || user;
      } catch {
        return user;
      }
    }));
    
    usersList.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${usersWithRoles.map((user: any) => `
            <tr>
              <td>${user.username}</td>
              <td>
                ${user.roles ? user.roles.map((r: any) => 
                  `<span class="badge badge-${r.is_system ? 'primary' : 'secondary'}">${r.name}</span>`
                ).join(' ') : `<span class="badge badge-secondary">${user.role}</span>`}
              </td>
              <td><span class="badge badge-${user.active ? 'success' : 'danger'}">${user.active ? 'Active' : 'Inactive'}</span></td>
              <td>${new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-sm" onclick="showUserPermissions(${user.id})">Permissions</button>
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
    
    // Setup form handler
    const form = document.getElementById('create-user-form');
    if (form) {
      form.removeEventListener('submit', handleCreateUser);
      form.addEventListener('submit', handleCreateUser);
    }
  } catch (error: any) {
    showToast('Failed to load users: ' + error.message, 'error');
  }
}

async function loadRolesList() {
  try {
    const roles = await window.posAPI.roles.getAll();
    const rolesList = document.getElementById('roles-list');
    if (!rolesList) return;
    
    rolesList.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Description</th>
            <th>Type</th>
            <th>Users</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${roles.map((role: any) => `
            <tr>
              <td><strong>${role.name}</strong></td>
              <td>${role.description || '-'}</td>
              <td><span class="badge badge-${role.is_system ? 'warning' : 'info'}">${role.is_system ? 'System' : 'Custom'}</span></td>
              <td>
                <button class="btn btn-sm" onclick="viewRoleUsers(${role.id})">View Users</button>
              </td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="showRolePermissions(${role.id})">Permissions</button>
                ${!role.is_system ? `
                  <button class="btn btn-sm" onclick="editRole(${role.id})">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteRole(${role.id})">Delete</button>
                ` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    // Setup role form handler
    const roleForm = document.getElementById('create-role-form');
    if (roleForm) {
      roleForm.removeEventListener('submit', handleCreateRole);
      roleForm.addEventListener('submit', handleCreateRole);
    }
  } catch (error: any) {
    showToast('Failed to load roles: ' + error.message, 'error');
  }
}

async function loadPermissionsList() {
  try {
    const permissions = await window.posAPI.permissions.getAll();
    const permissionsList = document.getElementById('permissions-list');
    if (!permissionsList) return;
    
    // Group permissions by resource
    const groupedPermissions: { [key: string]: any[] } = {};
    permissions.forEach((perm: any) => {
      if (!groupedPermissions[perm.resource]) {
        groupedPermissions[perm.resource] = [];
      }
      groupedPermissions[perm.resource].push(perm);
    });
    
    permissionsList.innerHTML = `
      <div class="permissions-grid">
        ${Object.entries(groupedPermissions).map(([resource, perms]) => `
          <div class="permission-group">
            <h4>${resource.charAt(0).toUpperCase() + resource.slice(1)}</h4>
            <ul class="permission-list">
              ${perms.map((perm: any) => `
                <li>
                  <strong>${perm.action}</strong>
                  ${perm.description ? `<br><small class="text-muted">${perm.description}</small>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error: any) {
    showToast('Failed to load permissions: ' + error.message, 'error');
  }
}

async function loadAuditLog() {
  try {
    const logs = await window.posAPI.permissions.getAuditLog();
    const auditList = document.getElementById('audit-list');
    if (!auditList) return;
    
    auditList.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Action</th>
            <th>Target</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${logs.slice(0, 100).map((log: any) => {
            const details = log.details_json ? JSON.parse(log.details_json) : {};
            return `
              <tr>
                <td>${new Date(log.created_at).toLocaleString()}</td>
                <td>${log.user_id}</td>
                <td>${log.action.replace(/_/g, ' ')}</td>
                <td>${log.target_type} #${log.target_id}</td>
                <td>${JSON.stringify(details)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (error: any) {
    showToast('Failed to load audit log: ' + error.message, 'error');
  }
}

async function loadRolesForDropdown() {
  try {
    const roles = await window.posAPI.roles.getAll();
    const roleSelect = document.getElementById('new-user-role') as HTMLSelectElement;
    if (roleSelect) {
      roleSelect.innerHTML = roles.map((role: any) => 
        `<option value="${role.id}">${role.name}</option>`
      ).join('');
    }
  } catch (error: any) {
    console.error('Failed to load roles:', error);
  }
}

function showCreateRoleModal() {
  const modal = document.getElementById('create-role-modal');
  if (modal) modal.style.display = 'block';
}

function closeCreateRoleModal() {
  const modal = document.getElementById('create-role-modal');
  if (modal) modal.style.display = 'none';
}

async function handleCreateRole(e: Event) {
  e.preventDefault();
  try {
    const name = (document.getElementById('new-role-name') as HTMLInputElement).value;
    const description = (document.getElementById('new-role-description') as HTMLTextAreaElement).value;
    
    await window.posAPI.roles.create(name, description);
    showToast('Role created successfully', 'success');
    closeCreateRoleModal();
    await loadRolesList();
  } catch (error: any) {
    showToast('Failed to create role: ' + error.message, 'error');
  }
}

async function deleteRole(roleId: number) {
  if (!confirm('Are you sure you want to delete this role?')) return;
  
  try {
    await window.posAPI.roles.delete(roleId);
    showToast('Role deleted', 'success');
    await loadRolesList();
  } catch (error: any) {
    showToast('Failed to delete role: ' + error.message, 'error');
  }
}

async function showUserPermissions(userId: number) {
  const modal = document.getElementById('user-permissions-modal');
  const content = document.getElementById('user-permissions-content');
  if (!modal || !content) return;
  
  try {
    const userWithRoles = await window.posAPI.users.getUserWithRoles(userId);
    const allRoles = await window.posAPI.roles.getAll();
    const allPermissions = await window.posAPI.permissions.getAll();
    
    if (!userWithRoles) return;
    
    content.innerHTML = `
      <h4>User: ${userWithRoles.username}</h4>
      
      <div class="mb-3">
        <h5>Assigned Roles</h5>
        <div class="roles-list">
          ${userWithRoles.roles?.map((role: any) => `
            <div class="role-item">
              <span class="badge badge-primary">${role.name}</span>
              ${!role.is_system ? `
                <button class="btn btn-sm btn-danger" onclick="removeUserRole(${userId}, ${role.id})">Remove</button>
              ` : ''}
            </div>
          `).join('') || 'No roles assigned'}
        </div>
        
        <div class="mt-2">
          <select id="add-role-select">
            ${allRoles.filter((r: any) => 
              !userWithRoles.roles?.some((ur: any) => ur.id === r.id)
            ).map((role: any) => 
              `<option value="${role.id}">${role.name}</option>`
            ).join('')}
          </select>
          <button class="btn btn-sm btn-primary" onclick="addUserRole(${userId})">Add Role</button>
        </div>
      </div>
      
      <div class="mb-3">
        <h5>Effective Permissions</h5>
        <div class="permissions-grid small">
          ${userWithRoles.permissions?.map((perm: any) => 
            `<span class="permission-badge">${perm.resource}:${perm.action}</span>`
          ).join('') || 'No permissions'}
        </div>
      </div>
      
      <div class="mb-3">
        <h5>Permission Overrides</h5>
        ${userWithRoles.permission_overrides?.map((override: any) => `
          <div class="override-item">
            <span class="${override.granted ? 'text-success' : 'text-danger'}">
              ${override.granted ? '✓ Granted' : '✗ Revoked'}: 
              ${override.permission.resource}:${override.permission.action}
            </span>
            <button class="btn btn-sm" onclick="removePermissionOverride(${userId}, ${override.permission_id})">Remove</button>
          </div>
        `).join('') || 'No overrides'}
      </div>
    `;
    
    modal.style.display = 'block';
  } catch (error: any) {
    showToast('Failed to load user permissions: ' + error.message, 'error');
  }
}

function closeUserPermissionsModal() {
  const modal = document.getElementById('user-permissions-modal');
  if (modal) modal.style.display = 'none';
}

async function showRolePermissions(roleId: number) {
  const modal = document.getElementById('role-permissions-modal');
  const content = document.getElementById('role-permissions-content');
  if (!modal || !content) return;
  
  try {
    const role = await window.posAPI.roles.getById(roleId);
    const allPermissions = await window.posAPI.permissions.getAll();
    
    if (!role) return;
    
    const rolePermissionIds = role.permissions?.map((p: any) => p.id) || [];
    
    content.innerHTML = `
      <h4>Role: ${role.name}</h4>
      <p>${role.description || 'No description'}</p>
      
      <div class="permissions-checklist">
        ${allPermissions.map((perm: any) => `
          <label class="permission-checkbox">
            <input type="checkbox" 
              ${rolePermissionIds.includes(perm.id) ? 'checked' : ''}
              ${role.is_system ? 'disabled' : ''}
              onchange="toggleRolePermission(${roleId}, ${perm.id}, this.checked)">
            <span>${perm.resource}:${perm.action}</span>
            <small class="text-muted">${perm.description || ''}</small>
          </label>
        `).join('')}
      </div>
    `;
    
    modal.style.display = 'block';
  } catch (error: any) {
    showToast('Failed to load role permissions: ' + error.message, 'error');
  }
}

function closeRolePermissionsModal() {
  const modal = document.getElementById('role-permissions-modal');
  if (modal) modal.style.display = 'none';
}

async function toggleRolePermission(roleId: number, permissionId: number, grant: boolean) {
  try {
    if (grant) {
      await window.posAPI.roles.assignPermission(roleId, permissionId);
    } else {
      await window.posAPI.roles.removePermission(roleId, permissionId);
    }
    showToast('Permission updated', 'success');
  } catch (error: any) {
    showToast('Failed to update permission: ' + error.message, 'error');
  }
}

async function addUserRole(userId: number) {
  const select = document.getElementById('add-role-select') as HTMLSelectElement;
  if (!select) return;
  
  const roleId = parseInt(select.value);
  if (!roleId) return;
  
  try {
    await window.posAPI.users.assignRole(userId, roleId);
    showToast('Role assigned', 'success');
    await showUserPermissions(userId);
  } catch (error: any) {
    showToast('Failed to assign role: ' + error.message, 'error');
  }
}

async function removeUserRole(userId: number, roleId: number) {
  try {
    await window.posAPI.users.removeRole(userId, roleId);
    showToast('Role removed', 'success');
    await showUserPermissions(userId);
  } catch (error: any) {
    showToast('Failed to remove role: ' + error.message, 'error');
  }
}

async function viewRoleUsers(roleId: number) {
  try {
    const users = await window.posAPI.roles.getRoleUsers(roleId);
    alert(`Users with this role: ${users.map((u: any) => u.username).join(', ')}`);
  } catch (error: any) {
    showToast('Failed to load role users: ' + error.message, 'error');
  }
}

// Installment payment functions
async function recordPayment(installmentId: number) {
  try {
    // Get installment details first
    const overdueList = await window.posAPI.installments.getOverdue();
    const installment = overdueList.find((inst: any) => inst.id === installmentId);
    
    if (!installment) {
      showToast('Installment not found', 'error');
      return;
    }
    
    // Show payment modal
    const modal = document.getElementById('payment-modal');
    const infoDiv = document.getElementById('payment-installment-info');
    const amountInput = document.getElementById('payment-amount') as HTMLInputElement;
    
    if (!modal || !infoDiv || !amountInput) {
      showToast('Payment modal not found', 'error');
      return;
    }
    
    // Display installment info
    // Cast to any since the returned object has additional properties from SQL joins
    const inst = installment as any;
    infoDiv.innerHTML = `
      <h4>Installment Details</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
        <div><strong>Customer:</strong> ${escapeHtml(inst.customer?.name || inst.customer_name || 'Walk-in')}</div>
        <div><strong>Order #:</strong> ${inst.order_id || 'N/A'}</div>
        <div><strong>Due Date:</strong> ${new Date(inst.due_date).toLocaleDateString()}</div>
        <div><strong>Amount Due:</strong> ₹${(inst.amount_due || 0).toFixed(2)}</div>
      </div>
    `;
    
    // Set default amount
    amountInput.value = (installment.amount_due || 0).toFixed(2);
    
    // Store installment ID for submission
    (window as any).currentPaymentInstallmentId = installmentId;
    
    // Show modal
    modal.style.display = 'block';
    amountInput.focus();
    
  } catch (error: any) {
    showToast('Failed to load installment details: ' + error.message, 'error');
  }
}

function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) {
    modal.style.display = 'none';
    (window as any).currentPaymentInstallmentId = null;
  }
}

async function submitPayment() {
  try {
    const installmentId = (window as any).currentPaymentInstallmentId;
    if (!installmentId) {
      showToast('No installment selected', 'error');
      return;
    }
    
    const amountInput = document.getElementById('payment-amount') as HTMLInputElement;
    const methodSelect = document.getElementById('payment-method') as HTMLSelectElement;
    const referenceInput = document.getElementById('payment-reference') as HTMLInputElement;
    
    const amount = parseFloat(amountInput.value);
    const method = methodSelect.value;
    const reference = referenceInput.value.trim();
    
    // Validation
    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount', 'warning');
      amountInput.focus();
      return;
    }
    
    // Record payment
    await window.posAPI.installments.recordPayment(installmentId, amount, method, reference || undefined);
    
    showToast('Payment recorded successfully', 'success');
    closePaymentModal();
    
    // Refresh the current tab
    await loadInstallmentStats();
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab?.textContent?.toLowerCase().includes('overdue')) {
      await loadOverdueInstallments();
    } else {
      await loadActivePlans();
    }
    
  } catch (error: any) {
    showToast('Failed to record payment: ' + error.message, 'error');
  }
}

// View installment plan details
async function viewInstallmentDetails(planId: number) {
  try {
    const modal = document.getElementById('installment-details-modal');
    const contentDiv = document.getElementById('installment-details-content');
    
    if (!modal || !contentDiv) {
      showToast('Details modal not found', 'error');
      return;
    }
    
    contentDiv.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';
    modal.style.display = 'block';
    
    // Get plan details
    const plan = await window.posAPI.installments.getPlan(planId);
    const installments = await window.posAPI.installments.getInstallments(planId);
    
    if (!plan) {
      contentDiv.innerHTML = '<p style="text-align: center; color: red;">Plan not found</p>';
      return;
    }
    
    // Get order and customer details
    const activePlans = await window.posAPI.installments.getActivePlans();
    const planDetails = activePlans.find((p: any) => p.id === planId);
    
    // Calculate statistics
    const paidInstallments = installments.filter((inst: any) => inst.status === 'paid');
    const pendingInstallments = installments.filter((inst: any) => inst.status === 'pending');
    const overdueInstallments = installments.filter((inst: any) => inst.status === 'overdue');
    
    const totalPaid = paidInstallments.reduce((sum: number, inst: any) => sum + (inst.amount_due || 0), 0);
    const totalPending = pendingInstallments.reduce((sum: number, inst: any) => sum + (inst.amount_due || 0), 0);
    const totalOverdue = overdueInstallments.reduce((sum: number, inst: any) => sum + (inst.amount_due || 0), 0);
    
    contentDiv.innerHTML = `
      <div style="padding: 1rem;">
        <!-- Plan Overview -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
          <div>
            <h4>Plan Information</h4>
            <div style="background: var(--color-bg-tertiary); padding: 1rem; border-radius: 8px;">
              <p><strong>Order #:</strong> ${plan.order_id}</p>
              <p><strong>Customer:</strong> ${escapeHtml(planDetails?.customer?.name || 'Walk-in')}</p>
              <p><strong>Principal Amount:</strong> ₹${(plan.principal || 0).toFixed(2)}</p>
              <p><strong>Down Payment:</strong> ₹${(plan.down_payment || 0).toFixed(2)}</p>
              <p><strong>Processing Fee:</strong> ₹${(plan.fee || 0).toFixed(2)}</p>
              <p><strong>Frequency:</strong> ${plan.frequency}</p>
              <p><strong>Start Date:</strong> ${new Date(plan.start_date).toLocaleDateString()}</p>
              <p><strong>Created:</strong> ${new Date(plan.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div>
            <h4>Payment Statistics</h4>
            <div style="background: var(--color-bg-tertiary); padding: 1rem; border-radius: 8px;">
              <p><strong>Total Installments:</strong> ${installments.length}</p>
              <p><strong>Paid:</strong> ${paidInstallments.length} (₹${totalPaid.toFixed(2)})</p>
              <p><strong>Pending:</strong> ${pendingInstallments.length} (₹${totalPending.toFixed(2)})</p>
              <p><strong>Overdue:</strong> ${overdueInstallments.length} (₹${totalOverdue.toFixed(2)})</p>
              <div style="margin-top: 1rem;">
                <div style="height: 20px; background: var(--color-bg-secondary); border-radius: 10px; overflow: hidden;">
                  <div style="width: ${(paidInstallments.length / installments.length) * 100}%; height: 100%; background: var(--color-success);"></div>
                </div>
                <p style="margin-top: 0.5rem; font-size: 0.9rem;">Progress: ${Math.round((paidInstallments.length / installments.length) * 100)}%</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Installments List -->
        <h4>Installment Schedule</h4>
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Paid Date</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${installments.map((inst: any) => {
              const statusColor = inst.status === 'paid' ? 'success' : 
                                 inst.status === 'overdue' ? 'danger' : 'secondary';
              const isPaid = inst.status === 'paid';
              
              return `
                <tr>
                  <td>${inst.seq_no}</td>
                  <td>${new Date(inst.due_date).toLocaleDateString()}</td>
                  <td>₹${(inst.amount_due || 0).toFixed(2)}</td>
                  <td><span class="badge badge-${statusColor}">${inst.status}</span></td>
                  <td>${isPaid && inst.paid_at ? new Date(inst.paid_at).toLocaleDateString() : '-'}</td>
                  <td>${inst.payment_method || '-'}</td>
                  <td>
                    ${!isPaid ? `
                      <button class="btn btn-sm btn-primary" onclick="recordPayment(${inst.id})">Record Payment</button>
                    ` : `
                      <span style="color: var(--color-text-tertiary);">Paid</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <!-- Action Buttons -->
        <div style="margin-top: 2rem; display: flex; justify-content: space-between;">
          <div>
            ${pendingInstallments.length > 0 ? `
              <button class="btn btn-success" onclick="payoffPlan(${planId})">Payoff Remaining Balance</button>
            ` : ''}
            ${paidInstallments.length === 0 ? `
              <button class="btn btn-danger" onclick="cancelPlan(${planId})">Cancel Plan</button>
            ` : ''}
          </div>
          <button class="btn btn-secondary" onclick="closeInstallmentDetails()">Close</button>
        </div>
      </div>
    `;
    
  } catch (error: any) {
    showToast('Failed to load plan details: ' + error.message, 'error');
    const contentDiv = document.getElementById('installment-details-content');
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: red;">
          <p>Failed to load details</p>
          <p style="font-size: 0.9rem;">${escapeHtml(error.message || 'Unknown error')}</p>
        </div>
      `;
    }
  }
}

function closeInstallmentDetails() {
  const modal = document.getElementById('installment-details-modal');
  if (modal) modal.style.display = 'none';
}

// Send reminder (placeholder)
async function sendReminder(installmentId: number) {
  showToast('Reminder functionality coming soon', 'info');
  // In future: integrate with email/SMS service
}

// Payoff entire plan
async function payoffPlan(planId: number) {
  if (!confirm('Are you sure you want to payoff the entire remaining balance?')) return;
  
  try {
    const method = prompt('Enter payment method (cash/card/upi/bank_transfer):') || 'cash';
    const reference = prompt('Enter reference number (optional):');
    
    await window.posAPI.installments.payoff(planId, method, reference || undefined);
    
    showToast('Plan paid off successfully', 'success');
    closeInstallmentDetails();
    await loadInstallmentStats();
    await switchInstallmentTab('active');
    
  } catch (error: any) {
    showToast('Failed to payoff plan: ' + error.message, 'error');
  }
}

// Cancel installment plan
async function cancelPlan(planId: number) {
  if (!confirm('Are you sure you want to cancel this installment plan? This action cannot be undone.')) return;
  
  try {
    await window.posAPI.installments.cancelPlan(planId);
    
    showToast('Plan cancelled successfully', 'success');
    closeInstallmentDetails();
    await loadInstallmentStats();
    await switchInstallmentTab('active');
    
  } catch (error: any) {
    showToast('Failed to cancel plan: ' + error.message, 'error');
  }
}

// Template management functions - Enhanced implementation
function showCreateTemplateModal() {
  const modal = document.getElementById('create-template-modal');
  if (modal) {
    modal.style.display = 'block';
    loadTemplatesForCopy();
    setupCreateTemplateForm();
  }
}

function closeCreateTemplateModal() {
  const modal = document.getElementById('create-template-modal');
  if (modal) {
    modal.style.display = 'none';
    const form = document.getElementById('create-template-form') as HTMLFormElement;
    if (form) form.reset();
  }
}

async function loadTemplatesForCopy() {
  try {
    const templates = await window.posAPI.templates.getAll();
    const select = document.getElementById('copy-from-template') as HTMLSelectElement;
    if (select) {
      select.innerHTML = templates.map(t => 
        `<option value="${t.id}">${escapeHtml(t.name)}</option>`
      ).join('');
    }
  } catch {}
}

function setupCreateTemplateForm() {
  const form = document.getElementById('create-template-form');
  const baseSelect = document.getElementById('template-base') as HTMLSelectElement;
  const existingDiv = document.getElementById('existing-templates-select');
  
  if (baseSelect && existingDiv) {
    baseSelect.addEventListener('change', () => {
      existingDiv.style.display = baseSelect.value === 'existing' ? 'block' : 'none';
    });
  }
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await createNewTemplate();
    });
  }
}

async function createNewTemplate() {
  const nameInput = document.getElementById('new-template-name') as HTMLInputElement;
  const baseSelect = document.getElementById('template-base') as HTMLSelectElement;
  const copyFromSelect = document.getElementById('copy-from-template') as HTMLSelectElement;
  const billSizeSelect = document.getElementById('new-bill-size') as HTMLSelectElement;
  const layoutSelect = document.getElementById('new-layout') as HTMLSelectElement;
  
  const name = nameInput?.value.trim();
  if (!name) {
    showToast('Please enter a template name', 'warning');
    return;
  }
  
  // Check for duplicate names
  if (allTemplates.some(t => t.name.toLowerCase() === name.toLowerCase())) {
    showToast('A template with this name already exists', 'error');
    return;
  }
  
  try {
    let headerJson = {
      businessName: 'Your Business Name',
      businessAddress: 'Your Address',
      businessPhone: '',
      businessEmail: '',
      businessTaxId: '',
      businessWebsite: '',
      invoicePrefix: 'INV-'
    };
    
    let footerJson = {
      footerText: 'Thank you for your business!',
      termsConditions: ''
    };
    
    // Copy from existing template if selected
    if (baseSelect?.value === 'existing' && copyFromSelect?.value) {
      const sourceTemplate = await window.posAPI.templates.getById(parseInt(copyFromSelect.value));
      if (sourceTemplate) {
        headerJson = JSON.parse(sourceTemplate.header_json || '{}');
        footerJson = JSON.parse(sourceTemplate.footer_json || '{}');
      }
    } else if (baseSelect?.value === 'default') {
      const defaultTemplate = await window.posAPI.templates.getDefault();
      if (defaultTemplate) {
        headerJson = JSON.parse(defaultTemplate.header_json || '{}');
        footerJson = JSON.parse(defaultTemplate.footer_json || '{}');
      }
    }
    
    const template = await window.posAPI.templates.create({
      name,
      is_default: false,
      header_json: JSON.stringify(headerJson),
      footer_json: JSON.stringify(footerJson),
      styles_json: JSON.stringify({ fontSize: 12, fontFamily: 'Arial' }),
      preferred_bill_size: (billSizeSelect?.value || 'A4') as any,
      preferred_layout: (layoutSelect?.value || 'Classic') as any
    });
    
    showToast('Template created successfully', 'success');
    closeCreateTemplateModal();
    await loadTemplatesList();
    await editTemplate(template.id);
  } catch (error: any) {
    showToast('Failed to create template: ' + error.message, 'error');
  }
}

async function saveTemplate(templateId: number) {
  try {
    // Get template name if it's editable
    const nameInput = document.getElementById('template-name') as HTMLInputElement;
    const templateName = nameInput && !nameInput.readOnly ? nameInput.value : currentEditingTemplate?.name;
    
    // Collect all form data
    const headerData = {
      businessName: (document.getElementById('business-name') as HTMLInputElement)?.value || '',
      businessAddress: (document.getElementById('business-address') as HTMLTextAreaElement)?.value || '',
      businessPhone: (document.getElementById('business-phone') as HTMLInputElement)?.value || '',
      businessEmail: (document.getElementById('business-email') as HTMLInputElement)?.value || '',
      businessTaxId: (document.getElementById('business-taxid') as HTMLInputElement)?.value || '',
      businessWebsite: (document.getElementById('business-website') as HTMLInputElement)?.value || '',
      invoicePrefix: (document.getElementById('invoice-prefix') as HTMLInputElement)?.value || 'INV-',
      footerText: (document.getElementById('footer-text') as HTMLTextAreaElement)?.value || ''
    };
    
    const footerData = {
      footerText: (document.getElementById('footer-text') as HTMLTextAreaElement)?.value || '',
      termsConditions: (document.getElementById('terms-conditions') as HTMLTextAreaElement)?.value || ''
    };
    
    const updates: any = {
      header_json: JSON.stringify(headerData),
      footer_json: JSON.stringify(footerData),
      preferred_bill_size: (document.getElementById('bill-size') as HTMLSelectElement)?.value as any,
      preferred_layout: (document.getElementById('layout') as HTMLSelectElement)?.value as any
    };
    
    // Include name if changed and not default template
    if (templateName && templateName !== currentEditingTemplate?.name && !currentEditingTemplate?.is_default) {
      updates.name = templateName;
    }
    
    await window.posAPI.templates.update(templateId, updates);
    showToast('Template saved successfully', 'success');
    
    // Refresh the template in the current editor to show updated values
    await editTemplate(templateId);
    
    // Refresh the templates list to show any name changes
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

function confirmDeleteTemplate(templateId: number, templateName: string) {
  const message = `Are you sure you want to delete the template "${templateName}"?\n\nThis action cannot be undone.`;
  if (confirm(message)) {
    deleteTemplate(templateId);
  }
}

async function deleteTemplate(templateId: number) {
  try {
    await window.posAPI.templates.delete(templateId);
    showToast('Template deleted', 'success');
    await loadTemplatesList();
  } catch (error: any) {
    showToast('Failed to delete template: ' + error.message, 'error');
  }
}

async function duplicateTemplate(templateId: number) {
  try {
    const source = await window.posAPI.templates.getById(templateId);
    if (!source) return;
    
    const newName = prompt('Name for the duplicated template:', source.name + ' Copy');
    if (!newName) return;
    
    const template = await window.posAPI.templates.create({
      name: newName,
      is_default: false,
      header_json: source.header_json,
      footer_json: source.footer_json,
      styles_json: source.styles_json,
      preferred_bill_size: source.preferred_bill_size as any,
      preferred_layout: source.preferred_layout as any
    });
    
    // Copy assets too
    const assets = await window.posAPI.templates.getAssets(templateId);
    for (const asset of assets) {
      if (asset.type === 'qr') {
        const meta = JSON.parse(asset.meta_json);
        await window.posAPI.templates.addQRCode(template.id, {
          label: meta.label,
          data: meta.data,
          errorCorrectionLevel: meta.errorCorrectionLevel,
          size: meta.size
        });
      }
    }
    
    showToast('Template duplicated successfully', 'success');
    await loadTemplatesList();
  } catch (error: any) {
    showToast('Failed to duplicate template: ' + error.message, 'error');
  }
}

function duplicateCurrentTemplate() {
  if (currentEditingTemplate) {
    duplicateTemplate(currentEditingTemplate.id);
  }
}

async function exportCurrentTemplate() {
  if (!currentEditingTemplate) return;
  
  try {
    const assets = await window.posAPI.templates.getAssets(currentEditingTemplate.id);
    
    const exportData = {
      version: '1.0',
      template: currentEditingTemplate,
      assets: assets.map(a => ({
        type: a.type,
        meta_json: a.meta_json
      }))
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${currentEditingTemplate.name.replace(/[^a-z0-9]/gi, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Template exported successfully', 'success');
  } catch (error: any) {
    showToast('Failed to export template: ' + error.message, 'error');
  }
}

async function importTemplate() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.template || !data.version) {
        throw new Error('Invalid template file format');
      }
      
      const name = prompt('Template name:', data.template.name);
      if (!name) return;
      
      const template = await window.posAPI.templates.create({
        name,
        is_default: false,
        header_json: data.template.header_json,
        footer_json: data.template.footer_json,
        styles_json: data.template.styles_json,
        preferred_bill_size: data.template.preferred_bill_size as any,
        preferred_layout: data.template.preferred_layout as any
      });
      
      // Import assets
      for (const asset of data.assets || []) {
        if (asset.type === 'qr') {
          const meta = JSON.parse(asset.meta_json);
          await window.posAPI.templates.addQRCode(template.id, {
            label: meta.label,
            data: meta.data,
            errorCorrectionLevel: meta.errorCorrectionLevel,
            size: meta.size
          });
        }
      }
      
      showToast('Template imported successfully', 'success');
      await loadTemplatesList();
    } catch (error: any) {
      showToast('Failed to import template: ' + error.message, 'error');
    }
  };
  
  input.click();
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

// Enhanced QR Code functionality
let currentTemplateForQR: number | null = null;

function showAddQRModal(templateId: number) {
  currentTemplateForQR = templateId;
  const modal = document.getElementById('qr-code-modal');
  if (modal) {
    modal.style.display = 'block';
    setupQRCodeForm();
  }
}

function closeQRModal() {
  const modal = document.getElementById('qr-code-modal');
  if (modal) {
    modal.style.display = 'none';
    const form = document.getElementById('qr-code-form') as HTMLFormElement;
    if (form) form.reset();
  }
  currentTemplateForQR = null;
}

function setupQRCodeForm() {
  const form = document.getElementById('qr-code-form');
  if (form && !form.hasAttribute('data-initialized')) {
    form.setAttribute('data-initialized', 'true');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await addQRCode();
    });
  }
}

function updateQRDataField() {
  const typeSelect = document.getElementById('qr-type') as HTMLSelectElement;
  const dataFieldsDiv = document.getElementById('qr-data-fields');
  
  if (!typeSelect || !dataFieldsDiv) return;
  
  const type = typeSelect.value;
  
  switch (type) {
    case 'upi':
      dataFieldsDiv.innerHTML = `
        <div class="form-group">
          <label>UPI ID <span style="color: red;">*</span></label>
          <input type="text" id="qr-data" required placeholder="business@upi">
        </div>
        <div class="form-group">
          <label>Business Name</label>
          <input type="text" id="qr-upi-name" placeholder="Your Business Name">
        </div>
      `;
      break;
    case 'website':
      dataFieldsDiv.innerHTML = `
        <div class="form-group">
          <label>Website URL <span style="color: red;">*</span></label>
          <input type="url" id="qr-data" required placeholder="https://www.yourbusiness.com">
        </div>
      `;
      break;
    case 'email':
      dataFieldsDiv.innerHTML = `
        <div class="form-group">
          <label>Email Address <span style="color: red;">*</span></label>
          <input type="email" id="qr-data" required placeholder="contact@business.com">
        </div>
      `;
      break;
    case 'phone':
      dataFieldsDiv.innerHTML = `
        <div class="form-group">
          <label>Phone Number <span style="color: red;">*</span></label>
          <input type="tel" id="qr-data" required placeholder="+91 98765 43210">
        </div>
      `;
      break;
    default:
      dataFieldsDiv.innerHTML = `
        <div class="form-group">
          <label>Data/Content <span style="color: red;">*</span></label>
          <textarea id="qr-data" required placeholder="Enter QR code content" rows="3"></textarea>
        </div>
      `;
  }
}

async function addQRCode() {
  if (!currentTemplateForQR) return;
  
  const labelInput = document.getElementById('qr-label') as HTMLInputElement;
  const dataInput = document.getElementById('qr-data') as HTMLInputElement | HTMLTextAreaElement;
  const sizeInput = document.getElementById('qr-size') as HTMLInputElement;
  const correctionSelect = document.getElementById('qr-correction') as HTMLSelectElement;
  const positionSelect = document.getElementById('qr-position') as HTMLSelectElement;
  const typeSelect = document.getElementById('qr-type') as HTMLSelectElement;
  
  const label = labelInput?.value.trim();
  const data = dataInput?.value.trim();
  
  if (!label || !data) {
    showToast('Please fill all required fields', 'warning');
    return;
  }
  
  // Format data based on type
  let formattedData = data;
  if (typeSelect?.value === 'upi') {
    const upiName = (document.getElementById('qr-upi-name') as HTMLInputElement)?.value || '';
    formattedData = `upi://pay?pa=${data}&pn=${encodeURIComponent(upiName)}`;
  }
  
  try {
    await window.posAPI.templates.addQRCode(currentTemplateForQR, {
      label,
      data: formattedData,
      errorCorrectionLevel: (correctionSelect?.value || 'M') as any,
      size: parseInt(sizeInput?.value || '150')
    });
    
    showToast('QR code added successfully', 'success');
    closeQRModal();
    await editTemplate(currentTemplateForQR);
  } catch (error: any) {
    showToast('Failed to add QR code: ' + error.message, 'error');
  }
}

async function removeQRCode(assetId: number, templateId: number) {
  if (!confirm('Are you sure you want to remove this QR code?')) return;
  
  try {
    await window.posAPI.templates.removeAsset(assetId);
    showToast('QR code removed', 'success');
    await editTemplate(templateId);
  } catch (error: any) {
    showToast('Failed to remove QR code: ' + error.message, 'error');
  }
}

async function removeLogo(templateId: number) {
  if (!confirm('Are you sure you want to remove the logo?')) return;
  
  try {
    const assets = await window.posAPI.templates.getAssets(templateId);
    const logoAsset = assets.find(a => a.type === 'logo');
    
    if (logoAsset) {
      await window.posAPI.templates.removeAsset(logoAsset.id);
      showToast('Logo removed', 'success');
      await editTemplate(templateId);
    }
  } catch (error: any) {
    showToast('Failed to remove logo: ' + error.message, 'error');
  }
}

async function previewTemplate(templateId: number) {
  try {
    const modal = document.getElementById('template-preview-modal');
    const contentDiv = document.getElementById('template-preview-content');
    
    if (!modal || !contentDiv) return;
    
    contentDiv.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading preview...</div>';
    modal.style.display = 'block';
    
    // Get template data
    const template = await window.posAPI.templates.getById(templateId);
    const assets = await window.posAPI.templates.getAssets(templateId);
    
    if (!template) {
      contentDiv.innerHTML = '<p style="text-align: center; color: red;">Template not found</p>';
      return;
    }
    
    const headerData = JSON.parse(template.header_json || '{}');
    const footerData = JSON.parse(template.footer_json || '{}');
    
    // Get current tax settings
    const settings = await window.posAPI.settings.get();
    const DEFAULT_TAX_RATE = 18; // Default 18% GST rate
    const taxRate = settings.tax_enabled ? DEFAULT_TAX_RATE : 0;
    
    // Create sample data for preview with various test cases
    const sampleOrder = {
      id: '001',
      created_at: new Date().toISOString(),
      customer: { 
        name: selectedCustomer?.name || 'John Doe', 
        phone: selectedCustomer?.phone || '+91 9876543210', 
        email: selectedCustomer?.email || 'customer@example.com' 
      },
      items: [
        { name: 'Long Product Name That Might Overflow In Compact Layouts', quantity: 2.5, unit_price: 100.99, line_total: 252.48 },
        { name: 'Service Item B', quantity: 1, unit_price: 150, line_total: 150 },
        { name: 'Product C', quantity: 3, unit_price: 75.50, line_total: 226.50 },
        { name: 'Item D with Special Characters & Symbols', quantity: 0.5, unit_price: 200, line_total: 100 }
      ],
      subtotal: 728.98,
      tax_total: taxRate > 0 ? 728.98 * (taxRate / 100) : 0,
      grand_total: 728.98 * (1 + taxRate / 100)
    };
    
    // Get dimensions based on bill size
    const dimensions = getBillSizeDimensions(template.preferred_bill_size);
    
    // Generate layout-specific HTML
    const previewHtml = generateLayoutHTML(
      template,
      headerData,
      footerData,
      sampleOrder,
      assets,
      dimensions
    );
    
    // Add wrapper with background to show page boundaries
    contentDiv.innerHTML = `
      <div style="background: #f5f5f5; padding: 1rem; overflow: auto;">
        ${previewHtml}
      </div>
      <div style="text-align: center; margin-top: 1rem; color: #666;">
        <small>Preview: ${template.preferred_bill_size || 'A4'} - ${template.preferred_layout || 'Classic'} Layout</small>
      </div>
    `;
  } catch (error: any) {
    showToast('Failed to preview template: ' + error.message, 'error');
  }
}

function printPreviewTemplate() {
  const contentDiv = document.getElementById('template-preview-content');
  if (!contentDiv) return;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('Please allow popups to print', 'warning');
    return;
  }
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Template Preview</title>
        <style>
          body { font-family: Arial, sans-serif; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${contentDiv.innerHTML}
        <script>window.print(); window.close();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function closeTemplatePreview() {
  const modal = document.getElementById('template-preview-modal');
  if (modal) modal.style.display = 'none';
}

// Helper function to get bill size dimensions
function getBillSizeDimensions(billSize: string | undefined): { width: string; maxWidth: string; padding: string; fontSize: string } {
  const sizeMap: { [key: string]: { width: string; maxWidth: string; padding: string; fontSize: string } } = {
    'A3': { width: '297mm', maxWidth: '297mm', padding: '20mm', fontSize: '14pt' },
    'A4': { width: '210mm', maxWidth: '210mm', padding: '15mm', fontSize: '12pt' },
    'A5': { width: '148mm', maxWidth: '148mm', padding: '10mm', fontSize: '10pt' },
    'Letter': { width: '8.5in', maxWidth: '8.5in', padding: '0.75in', fontSize: '12pt' },
    'Legal': { width: '8.5in', maxWidth: '8.5in', padding: '0.75in', fontSize: '12pt' },
    'Thermal80': { width: '80mm', maxWidth: '80mm', padding: '5mm', fontSize: '9pt' },
    'Thermal58': { width: '58mm', maxWidth: '58mm', padding: '3mm', fontSize: '8pt' },
    'Thermal57': { width: '57mm', maxWidth: '57mm', padding: '3mm', fontSize: '8pt' }
  };
  
  return sizeMap[billSize || 'A4'] || sizeMap['A4'];
}

// Helper function to generate layout-specific HTML
function generateLayoutHTML(
  template: any, 
  headerData: any, 
  footerData: any, 
  sampleOrder: any, 
  assets: any[], 
  dimensions: any
): string {
  const layout = template.preferred_layout || 'Classic';
  const invoiceNumber = headerData.invoicePrefix || 'INV-';
  
  // Common styles based on layout
  const layoutStyles: { [key: string]: { headerBorder: string; itemBg: string; showLogo: boolean; detailed: boolean } } = {
    'Classic': { headerBorder: '2px solid #333', itemBg: '#f5f5f5', showLogo: true, detailed: true },
    'Minimal': { headerBorder: '1px solid #ddd', itemBg: '#fafafa', showLogo: false, detailed: false },
    'Compact': { headerBorder: 'none', itemBg: 'transparent', showLogo: false, detailed: false },
    'Detailed': { headerBorder: '3px double #333', itemBg: '#f0f0f0', showLogo: true, detailed: true }
  };
  
  const style = layoutStyles[layout as string] || layoutStyles['Classic'];
  
  // Handle edge cases for missing data
  const businessName = headerData.businessName || 'Business Name Not Set';
  const businessAddress = headerData.businessAddress || '';
  
  // Thermal receipt layout
  if (template.preferred_bill_size?.startsWith('Thermal')) {
    return `
      <div style="width: ${dimensions.width}; max-width: ${dimensions.maxWidth}; margin: 0 auto; background: white; padding: ${dimensions.padding}; font-family: 'Courier New', monospace; font-size: ${dimensions.fontSize};">
        <!-- Compact Header -->
        <div style="text-align: center; margin-bottom: 10px;">
          ${(() => {
            const logoAsset = assets.find((a: any) => a.type === 'logo');
            if (logoAsset && logoAsset.blob) {
              const metaData = JSON.parse(logoAsset.meta_json || '{}');
              const mimeType = metaData.mimeType || 'image/png';
              const logoSrc = `data:${mimeType};base64,${logoAsset.blob}`;
              return `<img src="${logoSrc}" alt="Logo" style="max-height: 40px; max-width: 100px; object-fit: contain; margin-bottom: 5px; display: block; margin-left: auto; margin-right: auto;"><br>`;
            }
            return '';
          })()}
          <strong style="font-size: 1.2em;">${escapeHtml(businessName)}</strong>
          ${businessAddress ? `<br><small>${escapeHtml(businessAddress).replace(/\n/g, '<br>')}</small>` : ''}
          ${headerData.businessPhone ? `<br><small>Ph: ${escapeHtml(headerData.businessPhone)}</small>` : ''}
          ${headerData.businessTaxId ? `<br><small>GSTIN: ${escapeHtml(headerData.businessTaxId)}</small>` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
        
        <!-- Invoice Info -->
        <div style="font-size: 0.9em;">
          <div>Bill No: ${invoiceNumber}${sampleOrder.id}</div>
          <div>Date: ${new Date(sampleOrder.created_at).toLocaleString()}</div>
          ${sampleOrder.customer.name !== 'Walk-in' ? `<div>Customer: ${escapeHtml(sampleOrder.customer.name)}</div>` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
        
        <!-- Items -->
        ${sampleOrder.items.map((item: any) => `
          <div style="margin-bottom: 5px;">
            <div>${escapeHtml(item.name)}</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
              <span>${item.quantity} x ₹${item.unit_price.toFixed(2)}</span>
              <span>₹${item.line_total.toFixed(2)}</span>
            </div>
          </div>
        `).join('')}
        
        <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
        
        <!-- Totals -->
        <div style="text-align: right;">
          <div>Subtotal: ₹${sampleOrder.subtotal.toFixed(2)}</div>
          ${sampleOrder.tax_total > 0 ? `<div>Tax: ₹${sampleOrder.tax_total.toFixed(2)}</div>` : ''}
          <div style="font-weight: bold; font-size: 1.1em;">Total: ₹${sampleOrder.grand_total.toFixed(2)}</div>
        </div>
        
        ${footerData.footerText ? `
          <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
          <div style="text-align: center; font-size: 0.8em;">${escapeHtml(footerData.footerText)}</div>
        ` : ''}
      </div>
    `;
  }
  
  // Regular paper layouts
  return `
    <div style="width: ${dimensions.width}; max-width: ${dimensions.maxWidth}; margin: 0 auto; background: white; padding: ${dimensions.padding}; font-family: Arial, sans-serif; font-size: ${dimensions.fontSize};">
      <!-- Header -->
      <div style="border-bottom: ${style.headerBorder}; padding-bottom: 1rem; margin-bottom: 1rem;">
        ${(() => {
          if (style.showLogo) {
            const logoAsset = assets.find((a: any) => a.type === 'logo');
            if (logoAsset && logoAsset.blob) {
              const metaData = JSON.parse(logoAsset.meta_json || '{}');
              const mimeType = metaData.mimeType || 'image/png';
              const logoSrc = `data:${mimeType};base64,${logoAsset.blob}`;
              return `<div style="text-align: center; margin-bottom: 1rem;"><img src="${logoSrc}" alt="Logo" style="max-height: 80px; max-width: 200px; object-fit: contain;"></div>`;
            }
          }
          return '';
        })()}
        <h1 style="margin: 0; color: #333; font-size: ${layout === 'Compact' ? '1.5em' : '2em'};">${escapeHtml(businessName)}</h1>
        ${businessAddress ? `<p style="margin: 0.25rem 0; color: #666;">${escapeHtml(businessAddress).replace(/\n/g, '<br>')}</p>` : ''}
        ${style.detailed ? `
          ${headerData.businessPhone ? `<p style="margin: 0.25rem 0; color: #666;">Phone: ${escapeHtml(headerData.businessPhone)}</p>` : ''}
          ${headerData.businessEmail ? `<p style="margin: 0.25rem 0; color: #666;">Email: ${escapeHtml(headerData.businessEmail)}</p>` : ''}
          ${headerData.businessTaxId ? `<p style="margin: 0.25rem 0; color: #666;">GSTIN: ${escapeHtml(headerData.businessTaxId)}</p>` : ''}
          ${headerData.businessWebsite ? `<p style="margin: 0.25rem 0; color: #666;">Web: ${escapeHtml(headerData.businessWebsite)}</p>` : ''}
        ` : ''}
      </div>
      
      <!-- Invoice Details -->
      <div style="display: ${layout === 'Compact' ? 'block' : 'flex'}; justify-content: space-between; margin-bottom: ${layout === 'Compact' ? '1rem' : '2rem'};">
        <div>
          ${sampleOrder.customer.name !== 'Walk-in' ? `
            <h3 style="margin: 0 0 0.5rem 0; font-size: ${layout === 'Compact' ? '1em' : '1.2em'};">Bill To:</h3>
            <p style="margin: 0.25rem 0;">${escapeHtml(sampleOrder.customer.name)}</p>
            ${style.detailed && sampleOrder.customer.phone ? `<p style="margin: 0.25rem 0;">${escapeHtml(sampleOrder.customer.phone)}</p>` : ''}
            ${style.detailed && sampleOrder.customer.email ? `<p style="margin: 0.25rem 0;">${escapeHtml(sampleOrder.customer.email)}</p>` : ''}
          ` : ''}
        </div>
        <div style="text-align: ${layout === 'Compact' ? 'left' : 'right'};">
          <h3 style="margin: 0 0 0.5rem 0;">Invoice #${invoiceNumber}${sampleOrder.id}</h3>
          <p style="margin: 0.25rem 0;">Date: ${new Date(sampleOrder.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      
      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
        <thead>
          <tr style="background: ${style.itemBg};">
            <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #333;">Item</th>
            <th style="padding: 0.5rem; text-align: center; border-bottom: 2px solid #333;">Qty</th>
            <th style="padding: 0.5rem; text-align: right; border-bottom: 2px solid #333;">Price</th>
            <th style="padding: 0.5rem; text-align: right; border-bottom: 2px solid #333;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${sampleOrder.items.map((item: any) => `
            <tr>
              <td style="padding: 0.5rem; border-bottom: 1px solid #ddd;">${escapeHtml(item.name)}</td>
              <td style="padding: 0.5rem; text-align: center; border-bottom: 1px solid #ddd;">${item.quantity}</td>
              <td style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #ddd;">₹${item.unit_price.toFixed(2)}</td>
              <td style="padding: 0.5rem; text-align: right; border-bottom: 1px solid #ddd;">₹${item.line_total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 2rem;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span>Subtotal:</span>
            <strong>₹${sampleOrder.subtotal.toFixed(2)}</strong>
          </div>
          ${sampleOrder.tax_total > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span>Tax:</span>
              <strong>₹${sampleOrder.tax_total.toFixed(2)}</strong>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 1.25rem; padding-top: 0.5rem; border-top: 2px solid #333;">
            <strong>Total:</strong>
            <strong>₹${sampleOrder.grand_total.toFixed(2)}</strong>
          </div>
        </div>
      </div>
      
      <!-- QR Codes -->
      ${assets.filter(a => a.type === 'qr').length > 0 ? `
        <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
          ${assets.filter(a => a.type === 'qr').map(qr => {
            const meta = JSON.parse(qr.meta_json);
            return `
              <div style="text-align: center;">
                <div style="width: 100px; height: 100px; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;">
                  QR Code
                </div>
                <small>${escapeHtml(meta.label)}</small>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      
      <!-- Footer -->
      ${(footerData.footerText || footerData.termsConditions) ? `
        <div style="text-align: center; padding-top: 1rem; border-top: 1px solid #ddd; color: #666;">
          ${footerData.footerText ? `<p>${escapeHtml(footerData.footerText)}</p>` : ''}
          ${footerData.termsConditions ? `<p style="font-size: 0.9rem;">${escapeHtml(footerData.termsConditions)}</p>` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

// Installment wizard functions
async function showInstallmentWizard() {
  const modal = document.getElementById('installment-wizard-modal');
  if (!modal) return;
  
  // Reset form
  (document.getElementById('installment-order') as HTMLSelectElement).value = '';
  (document.getElementById('num-installments') as HTMLInputElement).value = '3';
  (document.getElementById('installment-frequency') as HTMLSelectElement).value = 'monthly';
  (document.getElementById('down-payment') as HTMLInputElement).value = '0';
  (document.getElementById('processing-fee') as HTMLInputElement).value = '0';
  (document.getElementById('installment-start-date') as HTMLInputElement).value = new Date().toISOString().split('T')[0];
  
  // Clear preview
  const scheduleDiv = document.getElementById('installment-schedule');
  if (scheduleDiv) {
    scheduleDiv.innerHTML = 'Select an order to see payment schedule';
  }
  
  // Load finalized orders that aren't already installment plans
  try {
    const orders = await window.posAPI.orders.getAll();
    const eligibleOrders = orders.filter((o: any) => o.status === 'finalized' && !o.is_installment);
    
    const orderSelect = document.getElementById('installment-order') as HTMLSelectElement;
    if (orderSelect) {
      orderSelect.innerHTML = `
        <option value="">Select an order...</option>
        ${eligibleOrders.map((order: any) => `
          <option value="${order.id}" data-total="${order.grand_total}" data-customer="${escapeHtml(order.customer?.name || 'Walk-in')}">
            #${order.id} - ${escapeHtml(order.customer?.name || 'Walk-in')} - ₹${order.grand_total.toFixed(2)}
          </option>
        `).join('')}
      `;
      
      if (eligibleOrders.length === 0) {
        orderSelect.innerHTML = '<option value="">No eligible orders available</option>';
      }
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

// Update installment preview when form changes
function updateInstallmentPreview() {
  const orderSelect = document.getElementById('installment-order') as HTMLSelectElement;
  const numInstallmentsInput = document.getElementById('num-installments') as HTMLInputElement;
  const frequencySelect = document.getElementById('installment-frequency') as HTMLSelectElement;
  const downPaymentInput = document.getElementById('down-payment') as HTMLInputElement;
  const processingFeeInput = document.getElementById('processing-fee') as HTMLInputElement;
  const startDateInput = document.getElementById('installment-start-date') as HTMLInputElement;
  const scheduleDiv = document.getElementById('installment-schedule');
  const validationDiv = document.getElementById('installment-validation');
  
  if (!scheduleDiv || !validationDiv) return;
  
  // Clear validation
  validationDiv.textContent = '';
  
  // Check if order is selected
  if (!orderSelect.value) {
    scheduleDiv.innerHTML = 'Select an order to see payment schedule';
    return;
  }
  
  const selectedOption = orderSelect.options[orderSelect.selectedIndex];
  const orderTotal = parseFloat(selectedOption.getAttribute('data-total') || '0');
  const customerName = selectedOption.getAttribute('data-customer') || 'Walk-in';
  const numInstallments = parseInt(numInstallmentsInput.value) || 0;
  const downPayment = parseFloat(downPaymentInput.value) || 0;
  const processingFee = parseFloat(processingFeeInput.value) || 0;
  const frequency = frequencySelect.value;
  const startDate = new Date(startDateInput.value);
  
  // Validation
  if (numInstallments < 2 || numInstallments > 36) {
    validationDiv.textContent = 'Number of installments must be between 2 and 36';
    return;
  }
  
  if (downPayment < 0 || downPayment >= orderTotal) {
    validationDiv.textContent = 'Down payment must be less than the order total';
    return;
  }
  
  if (processingFee < 0) {
    validationDiv.textContent = 'Processing fee cannot be negative';
    return;
  }
  
  // Calculate installment schedule
  const amountToFinance = orderTotal - downPayment + processingFee;
  const installmentAmount = amountToFinance / numInstallments;
  
  let scheduleHTML = `
    <div style="margin-bottom: 1rem;">
      <p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
      <p><strong>Order Total:</strong> ₹${orderTotal.toFixed(2)}</p>
      ${downPayment > 0 ? `<p><strong>Down Payment:</strong> ₹${downPayment.toFixed(2)}</p>` : ''}
      ${processingFee > 0 ? `<p><strong>Processing Fee:</strong> ₹${processingFee.toFixed(2)}</p>` : ''}
      <p><strong>Amount to Finance:</strong> ₹${amountToFinance.toFixed(2)}</p>
      <p><strong>Per Installment:</strong> ₹${installmentAmount.toFixed(2)}</p>
    </div>
    <table class="table" style="font-size: 0.9rem;">
      <thead>
        <tr>
          <th>Installment</th>
          <th>Due Date</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  let currentDate = new Date(startDate);
  let remainingAmount = amountToFinance;
  
  for (let i = 1; i <= numInstallments; i++) {
    let amount = installmentAmount;
    
    // Last installment gets the remaining amount to handle rounding
    if (i === numInstallments) {
      amount = remainingAmount;
    } else {
      amount = Math.round(amount * 100) / 100;  // Round to 2 decimal places
      remainingAmount -= amount;
    }
    
    scheduleHTML += `
      <tr>
        <td>#${i}</td>
        <td>${currentDate.toLocaleDateString()}</td>
        <td>₹${amount.toFixed(2)}</td>
      </tr>
    `;
    
    // Calculate next due date
    switch (frequency) {
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }
  
  scheduleHTML += '</tbody></table>';
  scheduleDiv.innerHTML = scheduleHTML;
}

async function createInstallmentPlan() {
  try {
    const orderSelect = document.getElementById('installment-order') as HTMLSelectElement;
    const numInstallmentsInput = document.getElementById('num-installments') as HTMLInputElement;
    const frequencySelect = document.getElementById('installment-frequency') as HTMLSelectElement;
    const downPaymentInput = document.getElementById('down-payment') as HTMLInputElement;
    const processingFeeInput = document.getElementById('processing-fee') as HTMLInputElement;
    const startDateInput = document.getElementById('installment-start-date') as HTMLInputElement;
    const validationDiv = document.getElementById('installment-validation');
    
    // Get values
    const orderId = parseInt(orderSelect.value);
    const numInstallments = parseInt(numInstallmentsInput.value);
    const frequency = frequencySelect.value;
    const downPayment = parseFloat(downPaymentInput.value || '0');
    const processingFee = parseFloat(processingFeeInput.value || '0');
    const startDate = startDateInput.value;
    
    // Validation
    if (!orderId) {
      if (validationDiv) validationDiv.textContent = 'Please select an order';
      orderSelect.focus();
      return;
    }
    
    if (!numInstallments || numInstallments < 2 || numInstallments > 36) {
      if (validationDiv) validationDiv.textContent = 'Number of installments must be between 2 and 36';
      numInstallmentsInput.focus();
      return;
    }
    
    if (!startDate) {
      if (validationDiv) validationDiv.textContent = 'Please select a start date';
      startDateInput.focus();
      return;
    }
    
    // Get order details
    const order = await window.posAPI.orders.getById(orderId);
    if (!order) {
      showToast('Order not found', 'error');
      return;
    }
    
    const principal = order.grand_total;
    
    // Additional validation
    if (downPayment >= principal) {
      if (validationDiv) validationDiv.textContent = 'Down payment must be less than the order total';
      downPaymentInput.focus();
      return;
    }
    
    // Create the plan
    await window.posAPI.installments.createPlan({
      order_id: orderId,
      principal,
      down_payment: downPayment,
      fee: processingFee,
      frequency: frequency as any,
      count: numInstallments,
      num_installments: numInstallments,  // Support both field names
      start_date: new Date(startDate).toISOString(),
      rounding_mode: 'bankers'
    } as any);
    
    showToast('Installment plan created successfully', 'success');
    closeInstallmentWizard();
    
    // Refresh installments page
    await loadInstallmentStats();
    await switchInstallmentTab('active');
    
  } catch (error: any) {
    console.error('Create installment plan error:', error);
    showToast('Failed to create installment plan: ' + error.message, 'error');
    const validationDiv = document.getElementById('installment-validation');
    if (validationDiv) {
      validationDiv.textContent = error.message || 'Unknown error occurred';
    }
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
