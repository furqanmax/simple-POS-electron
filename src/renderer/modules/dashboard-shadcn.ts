// Modern Shadcn-styled Dashboard for SimplePOS
import { MetricCard, Card, Badge, Table, Button, Progress, Alert } from './shadcn-components';

export async function renderModernDashboard() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;
  
  // Create dashboard HTML with shadcn components
  contentArea.innerHTML = `
    <div class="shadcn-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Dashboard</h1>
          <p class="dashboard-subtitle">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <div class="dashboard-actions">
          <button class="shadcn-btn shadcn-btn-outline" onclick="refreshDashboard()">
            <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
              <path d="M21 12a9 9 0 11-6.219-8.56" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Refresh
          </button>
          <button class="shadcn-btn shadcn-btn-primary" onclick="navigateTo('pos')">
            <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor">
              <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"/>
            </svg>
            New Sale
          </button>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="shadcn-grid shadcn-grid-4" id="metrics-grid">
        <!-- Metrics will be loaded here -->
      </div>

      <!-- Charts and Activity Section -->
      <div class="dashboard-content-grid">
        <!-- Sales Overview Chart -->
        <div class="shadcn-card">
          <div class="card-header">
            <h3 class="card-title">Sales Overview</h3>
            <div class="card-actions">
              <select class="shadcn-select" id="chart-period">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
          <div class="card-content">
            <div id="sales-chart" class="chart-container">
              <!-- Chart will be rendered here -->
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="shadcn-card">
          <div class="card-header">
            <h3 class="card-title">Top Products</h3>
            <span class="shadcn-badge">Today</span>
          </div>
          <div class="card-content">
            <div id="top-products-list">
              <!-- Products will be loaded here -->
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="shadcn-card">
        <div class="card-header">
          <h3 class="card-title">Recent Transactions</h3>
          <button class="shadcn-btn shadcn-btn-ghost shadcn-btn-sm" onclick="navigateTo('history')">
            View all
          </button>
        </div>
        <div class="card-content">
          <div id="recent-transactions">
            <!-- Transactions table will be loaded here -->
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="shadcn-grid shadcn-grid-4">
        <button class="quick-action-card" onclick="navigateTo('pos')">
          <div class="quick-action-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
              <path d="M9 9h6M9 12h6M9 15h2" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="quick-action-label">New Order</div>
        </button>
        <button class="quick-action-card" onclick="navigateTo('customers')">
          <div class="quick-action-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="quick-action-label">Add Customer</div>
        </button>
        <button class="quick-action-card" onclick="navigateTo('inventory')">
          <div class="quick-action-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="quick-action-label">Inventory</div>
        </button>
        <button class="quick-action-card" onclick="showReportsModal()">
          <div class="quick-action-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor">
              <path d="M9 11l3 3 8-8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="quick-action-label">Reports</div>
        </button>
      </div>
    </div>
  `;

  // Add custom styles
  addDashboardStyles();
  
  // Load dashboard data
  loadMetrics();
  loadSalesChart();
  loadTopProducts();
  loadRecentTransactions();
}

function addDashboardStyles() {
  const styleId = 'dashboard-shadcn-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .shadcn-dashboard {
      padding: var(--space-6);
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
    }

    .dashboard-title {
      font-size: var(--font-size-3xl);
      font-weight: 700;
      color: var(--color-foreground);
      margin-bottom: var(--space-1);
    }

    .dashboard-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-muted-foreground);
    }

    .dashboard-actions {
      display: flex;
      gap: var(--space-3);
    }

    .btn-icon {
      margin-right: var(--space-2);
    }

    .dashboard-content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-6);
      margin: var(--space-6) 0;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    .card-title {
      font-size: var(--font-size-lg);
      font-weight: 600;
      color: var(--color-foreground);
    }

    .card-actions {
      display: flex;
      gap: var(--space-2);
    }

    .card-content {
      min-height: 200px;
    }

    .shadcn-select {
      height: 32px;
      padding: 0 var(--space-3);
      font-size: var(--font-size-sm);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-foreground);
      outline: none;
      cursor: pointer;
    }

    .chart-container {
      width: 100%;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-muted);
      border-radius: var(--radius-md);
      position: relative;
    }

    .quick-action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-3);
      padding: var(--space-6);
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: var(--transition-all);
    }

    .quick-action-card:hover {
      background: var(--color-accent);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .quick-action-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      border-radius: var(--radius-md);
    }

    .quick-action-label {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-foreground);
    }

    .product-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--color-border);
    }

    .product-item:last-child {
      border-bottom: none;
    }

    .product-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .product-icon {
      width: 40px;
      height: 40px;
      background: var(--color-muted);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--font-size-lg);
    }

    .product-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .product-name {
      font-size: var(--font-size-sm);
      font-weight: 500;
      color: var(--color-foreground);
    }

    .product-quantity {
      font-size: var(--font-size-xs);
      color: var(--color-muted-foreground);
    }

    .product-revenue {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-foreground);
    }

    @media (max-width: 1024px) {
      .dashboard-content-grid {
        grid-template-columns: 1fr;
      }
      
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }
    }
  `;
  document.head.appendChild(style);
}

async function loadMetrics() {
  const metricsGrid = document.getElementById('metrics-grid');
  if (!metricsGrid) return;

  try {
    const stats = await (window as any).posAPI.orders.getDashboardStats();
    
    // Calculate trends
    const todayOrdersTrend = stats.yesterday_orders > 0 
      ? ((stats.today_orders - stats.yesterday_orders) / stats.yesterday_orders * 100).toFixed(1)
      : '0';
    const todayRevenueTrend = stats.yesterday_revenue > 0 
      ? ((stats.today_revenue - stats.yesterday_revenue) / stats.yesterday_revenue * 100).toFixed(1) 
      : '0';
    const monthRevenueTrend = stats.last_month_revenue > 0 
      ? ((stats.month_revenue - stats.last_month_revenue) / stats.last_month_revenue * 100).toFixed(1) 
      : '0';

    metricsGrid.innerHTML = `
      ${MetricCard({
        title: "Today's Sales",
        value: `₹${stats.today_revenue.toFixed(2)}`,
        description: `${stats.today_orders} orders`,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6" stroke-width="2" stroke-linecap="round"/></svg>`,
        trend: {
          value: `${Math.abs(parseFloat(todayRevenueTrend))}% from yesterday`,
          isPositive: parseFloat(todayRevenueTrend) >= 0
        }
      })}
      ${MetricCard({
        title: "Total Orders",
        value: stats.today_orders.toString(),
        description: "Today",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/><path d="M9 9h6M9 12h6M9 15h2" stroke-width="2" stroke-linecap="round"/></svg>`,
        trend: {
          value: `${Math.abs(parseFloat(todayOrdersTrend))}% from yesterday`,
          isPositive: parseFloat(todayOrdersTrend) >= 0
        }
      })}
      ${MetricCard({
        title: "Monthly Revenue",
        value: `₹${stats.month_revenue.toFixed(2)}`,
        description: `${stats.month_orders} orders`,
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        trend: {
          value: `${Math.abs(parseFloat(monthRevenueTrend))}% from last month`,
          isPositive: parseFloat(monthRevenueTrend) >= 0
        }
      })}
      ${MetricCard({
        title: "Active Customers",
        value: stats.active_customers.toString(),
        description: "This month",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" stroke-width="2" stroke-linecap="round"/></svg>`
      })}
    `;
  } catch (error) {
    console.error('Error loading metrics:', error);
    metricsGrid.innerHTML = Alert({
      description: 'Failed to load dashboard metrics',
      variant: 'destructive'
    });
  }
}

async function loadSalesChart() {
  const chartContainer = document.getElementById('sales-chart');
  if (!chartContainer) return;

  try {
    // Simulated chart data - replace with actual chart library implementation
    const chartData = await (window as any).posAPI.orders.getSalesData('7d');
    
    // For now, display a placeholder
    chartContainer.innerHTML = `
      <div class="chart-placeholder">
        <svg viewBox="0 0 400 200" width="100%" height="100%" preserveAspectRatio="none">
          <polyline
            points="0,180 50,150 100,120 150,140 200,80 250,100 300,60 350,40 400,20"
            fill="none"
            stroke="var(--color-primary)"
            stroke-width="2"
          />
          <polyline
            points="0,180 50,150 100,120 150,140 200,80 250,100 300,60 350,40 400,20 400,200 0,200"
            fill="var(--color-primary)"
            fill-opacity="0.1"
          />
        </svg>
        <div class="chart-overlay">
          <p class="chart-value">₹24,560</p>
          <p class="chart-label">Last 7 days</p>
        </div>
      </div>
      <style>
        .chart-placeholder {
          width: 100%;
          height: 100%;
          position: relative;
          background: transparent;
        }
        .chart-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .chart-value {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--color-foreground);
        }
        .chart-label {
          font-size: var(--font-size-sm);
          color: var(--color-muted-foreground);
        }
      </style>
    `;
  } catch (error) {
    console.error('Error loading sales chart:', error);
    chartContainer.innerHTML = '<p class="text-center">Unable to load chart</p>';
  }
}

async function loadTopProducts() {
  const container = document.getElementById('top-products-list');
  if (!container) return;

  try {
    const topProducts = await (window as any).posAPI.orders.getTopProducts();
    
    if (topProducts.length === 0) {
      container.innerHTML = '<p class="text-center">No sales data available</p>';
      return;
    }

    container.innerHTML = topProducts.slice(0, 5).map((product: any, index: number) => `
      <div class="product-item">
        <div class="product-info">
          <div class="product-icon">${index + 1}</div>
          <div class="product-details">
            <span class="product-name">${product.name}</span>
            <span class="product-quantity">${product.quantity} sold</span>
          </div>
        </div>
        <span class="product-revenue">₹${product.revenue.toFixed(2)}</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading top products:', error);
    container.innerHTML = '<p class="text-center">Failed to load products</p>';
  }
}

async function loadRecentTransactions() {
  const container = document.getElementById('recent-transactions');
  if (!container) return;

  try {
    const orders = await (window as any).posAPI.orders.getAll({ limit: 5 });
    
    if (orders.length === 0) {
      container.innerHTML = '<p class="text-center">No recent transactions</p>';
      return;
    }

    const headers = ['Order ID', 'Customer', 'Items', 'Total', 'Time', 'Status'];
    const rows = orders.map((order: any) => [
      `#${order.id.toString().padStart(4, '0')}`,
      order.customer_name || 'Walk-in',
      order.item_count,
      `₹${order.total.toFixed(2)}`,
      new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      `<span class="shadcn-badge ${order.status === 'finalized' ? 'shadcn-badge-success' : 'shadcn-badge-secondary'}">${order.status}</span>`
    ]);

    container.innerHTML = Table({
      headers,
      rows,
      className: 'transactions-table'
    });
  } catch (error) {
    console.error('Error loading recent transactions:', error);
    container.innerHTML = '<p class="text-center">Failed to load transactions</p>';
  }
}

// Export functions for global use
declare global {
  interface Window {
    refreshDashboard: () => void;
    showReportsModal: () => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  }
}

window.refreshDashboard = async function() {
  await loadMetrics();
  await loadSalesChart();
  await loadTopProducts();
  await loadRecentTransactions();
  window.showToast('Dashboard refreshed', 'success');
};

window.showReportsModal = function() {
  window.showToast('Reports feature coming soon!', 'info');
};
