import { contextBridge, ipcRenderer } from 'electron';
import { IPCApi } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api: IPCApi = {
  db: {
    initialize: () => ipcRenderer.invoke('db:initialize'),
    runMigrations: () => ipcRenderer.invoke('db:runMigrations'),
  },

  auth: {
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    changePassword: (userId: number, oldPassword: string, newPassword: string) => 
      ipcRenderer.invoke('auth:changePassword', userId, oldPassword, newPassword),
  },

  users: {
    getAll: () => ipcRenderer.invoke('users:getAll'),
    getById: (id: number) => ipcRenderer.invoke('users:getById', id),
    create: (username: string, password: string, role: any) => 
      ipcRenderer.invoke('users:create', username, password, role),
    update: (id: number, updates: any) => ipcRenderer.invoke('users:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('users:delete', id),
    getUserWithRoles: (id: number) => ipcRenderer.invoke('users:getUserWithRoles', id),
    assignRole: (userId: number, roleId: number) => ipcRenderer.invoke('users:assignRole', userId, roleId),
    removeRole: (userId: number, roleId: number) => ipcRenderer.invoke('users:removeRole', userId, roleId),
    getUserPermissions: (userId: number) => ipcRenderer.invoke('users:getUserPermissions', userId),
    hasPermission: (userId: number, resource: string, action: string) => 
      ipcRenderer.invoke('users:hasPermission', userId, resource, action),
    grantPermission: (userId: number, permissionId: number) => 
      ipcRenderer.invoke('users:grantPermission', userId, permissionId),
    revokePermission: (userId: number, permissionId: number) => 
      ipcRenderer.invoke('users:revokePermission', userId, permissionId),
  },

  roles: {
    getAll: () => ipcRenderer.invoke('roles:getAll'),
    getById: (id: number) => ipcRenderer.invoke('roles:getById', id),
    create: (name: string, description: string) => ipcRenderer.invoke('roles:create', name, description),
    update: (id: number, updates: any) => ipcRenderer.invoke('roles:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('roles:delete', id),
    getRolePermissions: (roleId: number) => ipcRenderer.invoke('roles:getRolePermissions', roleId),
    assignPermission: (roleId: number, permissionId: number) => 
      ipcRenderer.invoke('roles:assignPermission', roleId, permissionId),
    removePermission: (roleId: number, permissionId: number) => 
      ipcRenderer.invoke('roles:removePermission', roleId, permissionId),
    getRoleUsers: (roleId: number) => ipcRenderer.invoke('roles:getRoleUsers', roleId),
  },

  permissions: {
    getAll: () => ipcRenderer.invoke('permissions:getAll'),
    getById: (id: number) => ipcRenderer.invoke('permissions:getById', id),
    getByResource: (resource: string) => ipcRenderer.invoke('permissions:getByResource', resource),
    checkPermission: (userId: number, resource: string, action: string) => 
      ipcRenderer.invoke('permissions:checkPermission', userId, resource, action),
    getAuditLog: (filters?: any) => ipcRenderer.invoke('permissions:getAuditLog', filters),
  },

  customers: {
    getAll: () => ipcRenderer.invoke('customers:getAll'),
    getById: (id: number) => ipcRenderer.invoke('customers:getById', id),
    search: (query: string) => ipcRenderer.invoke('customers:search', query),
    getRecent: (limit: number) => ipcRenderer.invoke('customers:getRecent', limit),
    create: (customer: any) => ipcRenderer.invoke('customers:create', customer),
    update: (id: number, updates: any) => ipcRenderer.invoke('customers:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('customers:delete', id),
  },

  orders: {
    getAll: (filters?: any) => ipcRenderer.invoke('orders:getAll', filters),
    getById: (id: number) => ipcRenderer.invoke('orders:getById', id),
    create: (order: any, items: any[]) => ipcRenderer.invoke('orders:create', order, items),
    finalize: (orderId: number, templateId?: number) => 
      ipcRenderer.invoke('orders:finalize', orderId, templateId),
    cancel: (orderId: number) => ipcRenderer.invoke('orders:cancel', orderId),
    duplicate: (orderId: number) => ipcRenderer.invoke('orders:duplicate', orderId),
  },

  frequentOrders: {
    getAll: (userId?: number) => ipcRenderer.invoke('frequentOrders:getAll', userId),
    getById: (id: number) => ipcRenderer.invoke('frequentOrders:getById', id),
    create: (label: string, items: any[], ownerUserId?: number) => 
      ipcRenderer.invoke('frequentOrders:create', label, items, ownerUserId),
    update: (id: number, updates: any) => ipcRenderer.invoke('frequentOrders:update', id, updates),
    delete: (id: number) => ipcRenderer.invoke('frequentOrders:delete', id),
  },

  templates: {
    getAll: () => ipcRenderer.invoke('templates:getAll'),
    getById: (id: number) => ipcRenderer.invoke('templates:getById', id),
    getDefault: () => ipcRenderer.invoke('templates:getDefault'),
    create: (template: any) => ipcRenderer.invoke('templates:create', template),
    update: (id: number, updates: any) => ipcRenderer.invoke('templates:update', id, updates),
    setDefault: (id: number) => ipcRenderer.invoke('templates:setDefault', id),
    delete: (id: number) => ipcRenderer.invoke('templates:delete', id),
    getAssets: (templateId: number) => ipcRenderer.invoke('templates:getAssets', templateId),
    addAsset: (asset: any) => ipcRenderer.invoke('templates:addAsset', asset),
    removeAsset: (assetId: number) => ipcRenderer.invoke('templates:removeAsset', assetId),
    uploadLogo: (templateId: number) => ipcRenderer.invoke('templates:uploadLogo', templateId),
    addQRCode: (templateId: number, qrData: any) => 
      ipcRenderer.invoke('templates:addQRCode', templateId, qrData),
    updateAssetMeta: (assetId: number, metaJson: string) => 
      ipcRenderer.invoke('templates:updateAssetMeta', assetId, metaJson),
  },

  openOrders: {
    getAll: () => ipcRenderer.invoke('openOrders:getAll'),
    create: (name: string, customerId?: number) => 
      ipcRenderer.invoke('openOrders:create', name, customerId),
    update: (id: number, state: any, customerId?: number) => 
      ipcRenderer.invoke('openOrders:update', id, state, customerId),
    delete: (id: number) => ipcRenderer.invoke('openOrders:delete', id),
  },

  installments: {
    createPlan: (plan: any) => ipcRenderer.invoke('installments:createPlan', plan),
    getPlan: (planId: number) => ipcRenderer.invoke('installments:getPlan', planId),
    getInstallments: (planId: number) => ipcRenderer.invoke('installments:getInstallments', planId),
    getOverdue: () => ipcRenderer.invoke('installments:getOverdue'),
    getActivePlans: () => ipcRenderer.invoke('installments:getActivePlans'),
    recordPayment: (installmentId: number, amount: number, method: string, reference?: string) => 
      ipcRenderer.invoke('installments:recordPayment', installmentId, amount, method, reference),
    payoff: (planId: number, method: string, reference?: string) => 
      ipcRenderer.invoke('installments:payoff', planId, method, reference),
    cancelPlan: (planId: number) => ipcRenderer.invoke('installments:cancelPlan', planId),
  },

  payments: {
    getAll: (filters?: any) => ipcRenderer.invoke('payments:getAll', filters),
    getByOrder: (orderId: number) => ipcRenderer.invoke('payments:getByOrder', orderId),
    recordInstallmentPayment: (installmentId: number, amount: number, method: string) => 
      ipcRenderer.invoke('payments:recordInstallmentPayment', installmentId, amount, method),
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (updates: any) => ipcRenderer.invoke('settings:update', updates),
  },

  license: {
    getInfo: () => ipcRenderer.invoke('license:getInfo'),
    getState: () => ipcRenderer.invoke('license:getState'),
    activate: (licenseKey: string) => ipcRenderer.invoke('license:activate', licenseKey),
    deactivate: () => ipcRenderer.invoke('license:deactivate'),
    verify: () => ipcRenderer.invoke('license:verify'),
    checkExpiry: () => ipcRenderer.invoke('license:checkExpiry'),
    checkFeature: (feature: string) => ipcRenderer.invoke('license:checkFeature', feature),
    checkLimit: (type: 'users' | 'orders', current: number) => ipcRenderer.invoke('license:checkLimit', type, current),
    issueLicense: (customerName: string, customerEmail: string, maxActivations: number) => ipcRenderer.invoke('license:issueLicense', customerName, customerEmail, maxActivations),
    exportDebug: () => ipcRenderer.invoke('license:exportDebug'),
    importFromFile: () => ipcRenderer.invoke('license:importFromFile'),
    checkUpdates: () => ipcRenderer.invoke('license:checkUpdates'),
    getActivations: () => ipcRenderer.invoke('license:getActivations'),
    revoke: (licenseKey: string) => ipcRenderer.invoke('license:revoke', licenseKey),
    startTrial: () => ipcRenderer.invoke('license:startTrial'),
  },

  print: {
    generatePDF: (orderId: number, options?: any) => 
      ipcRenderer.invoke('print:generatePDF', orderId, options),
    printDirect: (orderId: number, printerName?: string) => 
      ipcRenderer.invoke('print:printDirect', orderId, printerName),
    getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
  },

  backups: {
    create: (destination?: string) => ipcRenderer.invoke('backups:create', destination),
    restore: (backupPath: string) => ipcRenderer.invoke('backups:restore', backupPath),
    getLastBackupTime: () => ipcRenderer.invoke('backups:getLastBackupTime'),
    vacuum: () => ipcRenderer.invoke('backups:vacuum'),
    analyze: () => ipcRenderer.invoke('backups:analyze'),
  },

  files: {
    selectFile: (filters?: any) => ipcRenderer.invoke('files:selectFile', filters),
    selectDirectory: () => ipcRenderer.invoke('files:selectDirectory'),
    uploadImage: (sourcePath: string, templateId: number) => 
      ipcRenderer.invoke('files:uploadImage', sourcePath, templateId),
  },

  dashboard: {
    getStats: (period: 'today' | 'yesterday' | '7days' | '30days') => 
      ipcRenderer.invoke('dashboard:getStats', period),
    getRecentOrders: (limit: number) => ipcRenderer.invoke('dashboard:getRecentOrders', limit),
  },
};

contextBridge.exposeInMainWorld('posAPI', api);

// Type declaration for TypeScript
declare global {
  interface Window {
    posAPI: IPCApi;
  }
}
