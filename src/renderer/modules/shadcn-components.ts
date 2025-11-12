// Shadcn-style UI Components for SimplePOS

// Card Component with variants
export function Card(options: {
  children: string;
  className?: string;
  variant?: 'default' | 'bordered' | 'ghost';
}) {
  const variantClasses = {
    default: 'shadcn-card',
    bordered: 'shadcn-card shadcn-card-bordered',
    ghost: 'shadcn-card shadcn-card-ghost'
  };
  
  return `
    <div class="${variantClasses[options.variant || 'default']} ${options.className || ''}">
      ${options.children}
    </div>
  `;
}

// Metric Card Component
export function MetricCard(options: {
  title: string;
  value: string;
  description?: string;
  icon?: string;
  trend?: { value: string; isPositive: boolean };
  className?: string;
}) {
  return `
    <div class="shadcn-metric-card ${options.className || ''}">
      <div class="shadcn-metric-header">
        <p class="shadcn-metric-title">${options.title}</p>
        ${options.icon ? `<div class="shadcn-metric-icon">${options.icon}</div>` : ''}
      </div>
      <div class="shadcn-metric-content">
        <div class="shadcn-metric-value">${options.value}</div>
        ${options.trend ? `
          <p class="shadcn-metric-trend ${options.trend.isPositive ? 'positive' : 'negative'}">
            <span class="shadcn-trend-icon">${options.trend.isPositive ? '↑' : '↓'}</span>
            ${options.trend.value}
          </p>
        ` : ''}
        ${options.description ? `<p class="shadcn-metric-description">${options.description}</p>` : ''}
      </div>
    </div>
  `;
}

// Button Component with variants
export function Button(options: {
  text: string;
  onClick?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  id?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const variantClasses = {
    default: 'shadcn-btn shadcn-btn-primary',
    secondary: 'shadcn-btn shadcn-btn-secondary',
    outline: 'shadcn-btn shadcn-btn-outline',
    ghost: 'shadcn-btn shadcn-btn-ghost',
    destructive: 'shadcn-btn shadcn-btn-destructive'
  };
  
  const sizeClasses = {
    sm: 'shadcn-btn-sm',
    default: '',
    lg: 'shadcn-btn-lg',
    icon: 'shadcn-btn-icon'
  };
  
  return `
    <button 
      ${options.id ? `id="${options.id}"` : ''}
      type="${options.type || 'button'}"
      class="${variantClasses[options.variant || 'default']} ${sizeClasses[options.size || 'default']} ${options.className || ''}"
      ${options.onClick ? `onclick="${options.onClick}"` : ''}
      ${options.disabled ? 'disabled' : ''}
    >
      ${options.text}
    </button>
  `;
}

// Input Component with label
export function Input(options: {
  id?: string;
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  required?: boolean;
  className?: string;
  icon?: string;
}) {
  return `
    <div class="shadcn-input-group ${options.className || ''}">
      ${options.label ? `<label class="shadcn-label" ${options.id ? `for="${options.id}"` : ''}>${options.label}</label>` : ''}
      <div class="shadcn-input-wrapper">
        ${options.icon ? `<div class="shadcn-input-icon">${options.icon}</div>` : ''}
        <input 
          ${options.id ? `id="${options.id}"` : ''}
          type="${options.type || 'text'}"
          class="shadcn-input ${options.icon ? 'has-icon' : ''}"
          placeholder="${options.placeholder || ''}"
          ${options.value ? `value="${options.value}"` : ''}
          ${options.required ? 'required' : ''}
        />
      </div>
    </div>
  `;
}

// Badge Component
export function Badge(options: {
  text: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success';
  className?: string;
}) {
  const variantClasses = {
    default: 'shadcn-badge',
    secondary: 'shadcn-badge shadcn-badge-secondary',
    outline: 'shadcn-badge shadcn-badge-outline',
    destructive: 'shadcn-badge shadcn-badge-destructive',
    success: 'shadcn-badge shadcn-badge-success'
  };
  
  return `
    <span class="${variantClasses[options.variant || 'default']} ${options.className || ''}">
      ${options.text}
    </span>
  `;
}

// Tabs Component
export function Tabs(options: {
  tabs: Array<{ id: string; label: string; active?: boolean }>;
  className?: string;
}) {
  return `
    <div class="shadcn-tabs ${options.className || ''}">
      <div class="shadcn-tabs-list">
        ${options.tabs.map(tab => `
          <button 
            class="shadcn-tabs-trigger ${tab.active ? 'active' : ''}"
            onclick="switchTab('${tab.id}')"
            data-tab="${tab.id}"
          >
            ${tab.label}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// Table Component
export function Table(options: {
  headers: string[];
  rows: Array<Array<string | number>>;
  className?: string;
}) {
  return `
    <div class="shadcn-table-container ${options.className || ''}">
      <table class="shadcn-table">
        <thead class="shadcn-table-header">
          <tr>
            ${options.headers.map(header => `<th class="shadcn-table-head">${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody class="shadcn-table-body">
          ${options.rows.map(row => `
            <tr class="shadcn-table-row">
              ${row.map((cell, index) => `<td class="shadcn-table-cell">${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Avatar Component
export function Avatar(options: {
  src?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'shadcn-avatar-sm',
    md: 'shadcn-avatar-md',
    lg: 'shadcn-avatar-lg'
  };
  
  return `
    <div class="shadcn-avatar ${sizeClasses[options.size || 'md']} ${options.className || ''}">
      ${options.src ? 
        `<img src="${options.src}" alt="${options.fallback}" class="shadcn-avatar-image" />` :
        `<span class="shadcn-avatar-fallback">${options.fallback}</span>`
      }
    </div>
  `;
}

// Separator Component
export function Separator(options?: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
  return `
    <div class="shadcn-separator ${options?.orientation === 'vertical' ? 'vertical' : ''} ${options?.className || ''}"></div>
  `;
}

// Progress Component
export function Progress(options: {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, (options.value / (options.max || 100)) * 100));
  
  return `
    <div class="shadcn-progress ${options.className || ''}">
      <div class="shadcn-progress-bar" style="width: ${percentage}%"></div>
      ${options.showLabel ? `<span class="shadcn-progress-label">${Math.round(percentage)}%</span>` : ''}
    </div>
  `;
}

// Alert Component
export function Alert(options: {
  title?: string;
  description: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  className?: string;
}) {
  const variantClasses = {
    default: 'shadcn-alert',
    destructive: 'shadcn-alert shadcn-alert-destructive',
    success: 'shadcn-alert shadcn-alert-success',
    warning: 'shadcn-alert shadcn-alert-warning'
  };
  
  return `
    <div class="${variantClasses[options.variant || 'default']} ${options.className || ''}">
      ${options.title ? `<h5 class="shadcn-alert-title">${options.title}</h5>` : ''}
      <p class="shadcn-alert-description">${options.description}</p>
    </div>
  `;
}
