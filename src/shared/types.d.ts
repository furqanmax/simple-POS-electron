export type UserRole = 'admin' | 'user' | 'guest';
export type OrderStatus = 'draft' | 'finalized' | 'cancelled';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
export type InstallmentFrequency = 'weekly' | 'biweekly' | 'monthly';
export type AssetType = 'logo' | 'qr';
export type StorageKind = 'file' | 'blob';
export type BillSize = 'A3' | 'A4' | 'A5' | 'Letter' | 'Legal' | 'HalfLetter' | 'Thermal57' | 'Thermal58' | 'Thermal76' | 'Thermal80' | 'Strip8.5x4.25';
export type BillLayout = 'Classic' | 'Minimal' | 'Compact' | 'Detailed';
export type LicensePlan = 'Trial' | 'Monthly' | 'Quarterly' | 'Annual';
export interface User {
    id: number;
    username: string;
    role: UserRole;
    active: boolean;
    created_at: string;
}
export interface UserWithPassword extends User {
    password_hash: string;
}
export interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    gstin?: string;
    address?: string;
    created_at: string;
    updated_at: string;
}
export interface OrderItem {
    id?: number;
    order_id?: number;
    name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}
export interface Order {
    id: number;
    user_id: number;
    customer_id?: number;
    subtotal: number;
    tax_rate: number;
    tax_total: number;
    grand_total: number;
    status: OrderStatus;
    created_at: string;
    invoice_template_id?: number;
    invoice_snapshot_json?: string;
    is_installment: boolean;
    installment_plan_id?: number;
}
export interface OrderWithItems extends Order {
    items: OrderItem[];
    customer?: Customer;
    user?: User;
}
export interface FrequentOrder {
    id: number;
    owner_user_id?: number;
    label: string;
    items_json: string;
    active: boolean;
    created_at: string;
}
export interface InvoiceTemplate {
    id: number;
    name: string;
    is_default: boolean;
    header_json: string;
    footer_json: string;
    styles_json: string;
    preferred_bill_size?: BillSize;
    preferred_layout?: BillLayout;
    created_at: string;
}
export interface InvoiceAsset {
    id: number;
    template_id: number;
    type: AssetType;
    storage_kind: StorageKind;
    path?: string;
    blob?: Buffer;
    meta_json: string;
}
export interface QRCodeMeta {
    label: string;
    data: string;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    size: number;
    placement: {
        position: 'top' | 'bottom' | 'left' | 'right';
        row?: number;
        column?: number;
    };
}
export interface OpenOrder {
    id: number;
    name: string;
    created_at: string;
    customer_id?: number;
    state_json: string;
}
export interface InstallmentPlan {
    id: number;
    order_id: number;
    principal: number;
    down_payment: number;
    fee: number;
    frequency: InstallmentFrequency;
    count: number;
    start_date: string;
    rounding_mode: string;
    created_at: string;
}
export interface Installment {
    id: number;
    plan_id: number;
    seq_no: number;
    due_date: string;
    amount_due: number;
    status: InstallmentStatus;
    paid_at?: string;
    payment_method?: string;
    receipt_no?: string;
}
export interface Payment {
    id: number;
    order_id?: number;
    installment_id?: number;
    amount: number;
    method: string;
    reference?: string;
    created_at: string;
}
export interface Settings {
    id: number;
    default_currency: string;
    locale: string;
    tax_enabled: boolean;
    default_bill_size?: BillSize;
    default_bill_layout?: BillLayout;
    per_size_margins_json?: string;
    font_scale_override?: number;
    theme?: string;
}
export interface LicenseState {
    id: number;
    plan: LicensePlan;
    expiry?: string;
    last_verified_at?: string;
    signed_token_blob?: string;
    machine_fingerprint?: string;
    last_seen_monotonic?: number;
}
export interface LicenseFeatures {
    maxUsers: number;
    maxOrders: number;
    canExport: boolean;
    canBackup: boolean;
    multipleTemplates: boolean;
    installments: boolean;
    advancedReports: boolean;
    emailSupport: boolean;
    phoneSupport: boolean;
}
export type LicenseStatus = 'valid' | 'expired' | 'grace' | 'trial' | 'invalid' | 'tampered';
export interface LicenseInfo {
    isValid: boolean;
    isExpired: boolean;
    isTrial: boolean;
    plan: LicensePlan;
    expiryDate: Date | null;
    daysRemaining: number;
    graceRemaining: number;
    features: LicenseFeatures;
    status: LicenseStatus;
    message: string;
}
export interface BillSizeSpec {
    width: number;
    height: number;
    unit: 'mm' | 'in';
    safeMargins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
}
export interface InvoiceData {
    order: OrderWithItems;
    template: InvoiceTemplate;
    assets: InvoiceAsset[];
    settings: Settings;
    businessInfo?: {
        name: string;
        address: string;
        phone?: string;
        email?: string;
        taxId?: string;
    };
}
export interface IPCApi {
    db: {
        initialize: () => Promise<void>;
        runMigrations: () => Promise<void>;
    };
    auth: {
        login: (username: string, password: string) => Promise<User | null>;
        logout: () => Promise<void>;
        getCurrentUser: () => Promise<User | null>;
        changePassword: (userId: number, oldPassword: string, newPassword: string) => Promise<boolean>;
    };
    users: {
        getAll: () => Promise<User[]>;
        getById: (id: number) => Promise<User | null>;
        create: (username: string, password: string, role: UserRole) => Promise<User>;
        update: (id: number, updates: Partial<User>) => Promise<void>;
        delete: (id: number) => Promise<void>;
    };
    customers: {
        getAll: () => Promise<Customer[]>;
        getById: (id: number) => Promise<Customer | null>;
        search: (query: string) => Promise<Customer[]>;
        getRecent: (limit: number) => Promise<Customer[]>;
        create: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<Customer>;
        update: (id: number, updates: Partial<Customer>) => Promise<void>;
        delete: (id: number) => Promise<void>;
    };
    orders: {
        getAll: (filters?: {
            startDate?: string;
            endDate?: string;
            userId?: number;
            customerId?: number;
        }) => Promise<OrderWithItems[]>;
        getById: (id: number) => Promise<OrderWithItems | null>;
        create: (order: Omit<Order, 'id' | 'created_at'>, items: OrderItem[]) => Promise<Order>;
        finalize: (orderId: number, templateId?: number) => Promise<void>;
        cancel: (orderId: number) => Promise<void>;
        duplicate: (orderId: number) => Promise<Order>;
    };
    frequentOrders: {
        getAll: (userId?: number) => Promise<FrequentOrder[]>;
        getById: (id: number) => Promise<FrequentOrder | null>;
        create: (label: string, items: OrderItem[], ownerUserId?: number) => Promise<FrequentOrder>;
        update: (id: number, updates: Partial<FrequentOrder>) => Promise<void>;
        delete: (id: number) => Promise<void>;
    };
    templates: {
        getAll: () => Promise<InvoiceTemplate[]>;
        getById: (id: number) => Promise<InvoiceTemplate | null>;
        getDefault: () => Promise<InvoiceTemplate | null>;
        create: (template: Omit<InvoiceTemplate, 'id' | 'created_at'>) => Promise<InvoiceTemplate>;
        update: (id: number, updates: Partial<InvoiceTemplate>) => Promise<void>;
        setDefault: (id: number) => Promise<void>;
        delete: (id: number) => Promise<void>;
        getAssets: (templateId: number) => Promise<InvoiceAsset[]>;
        addAsset: (asset: Omit<InvoiceAsset, 'id'>) => Promise<InvoiceAsset>;
        removeAsset: (assetId: number) => Promise<void>;
    };
    openOrders: {
        getAll: () => Promise<OpenOrder[]>;
        create: (name: string, customerId?: number) => Promise<OpenOrder>;
        update: (id: number, state: any, customerId?: number) => Promise<void>;
        delete: (id: number) => Promise<void>;
    };
    installments: {
        createPlan: (plan: Omit<InstallmentPlan, 'id' | 'created_at'>) => Promise<InstallmentPlan>;
        getPlan: (planId: number) => Promise<InstallmentPlan | null>;
        getInstallments: (planId: number) => Promise<Installment[]>;
        getOverdue: () => Promise<Array<Installment & {
            plan: InstallmentPlan;
            order: Order;
        }>>;
        recordPayment: (installmentId: number, amount: number, method: string, reference?: string) => Promise<void>;
        payoff: (planId: number, method: string, reference?: string) => Promise<void>;
        cancelPlan: (planId: number) => Promise<void>;
    };
    payments: {
        getAll: (filters?: {
            startDate?: string;
            endDate?: string;
        }) => Promise<Payment[]>;
        getByOrder: (orderId: number) => Promise<Payment[]>;
    };
    settings: {
        get: () => Promise<Settings>;
        update: (updates: Partial<Settings>) => Promise<void>;
    };
    license: {
        getInfo: () => Promise<LicenseInfo>;
        getState: () => Promise<LicenseState | null>;
        activate: (licenseKey: string) => Promise<{ success: boolean; message: string }>;
        deactivate: () => Promise<void>;
        verify: () => Promise<boolean>;
        checkExpiry: () => Promise<{
            expired: boolean;
            daysRemaining: number;
            graceRemaining: number;
        }>;
        checkFeature: (feature: string) => Promise<boolean>;
        checkLimit: (type: 'users' | 'orders', current: number) => Promise<boolean>;
        generateKey: (email: string, plan: LicensePlan, days: number) => Promise<string>;
        exportDebug: () => Promise<void>;
        importFromFile: () => Promise<{ success: boolean; message: string }>;
        checkUpdates: () => Promise<{ available: boolean; message: string }>;
    };
    print: {
        generatePDF: (orderId: number, outputPath?: string) => Promise<string>;
        printDirect: (orderId: number, printerName?: string) => Promise<boolean>;
        getPrinters: () => Promise<Array<{
            name: string;
            isDefault: boolean;
        }>>;
    };
    backups: {
        create: (destination?: string) => Promise<string>;
        restore: (backupPath: string) => Promise<void>;
        getLastBackupTime: () => Promise<string | null>;
        vacuum: () => Promise<void>;
        analyze: () => Promise<void>;
    };
    files: {
        selectFile: (filters?: Array<{
            name: string;
            extensions: string[];
        }>) => Promise<string | null>;
        selectDirectory: () => Promise<string | null>;
        uploadImage: (sourcePath: string, templateId: number) => Promise<string>;
    };
    dashboard: {
        getStats: (period: 'today' | '7days' | '30days') => Promise<{
            orderCount: number;
            revenue: number;
            trend: Array<{
                date: string;
                revenue: number;
                count: number;
            }>;
            overdueInstallments: number;
        }>;
        getRecentOrders: (limit: number) => Promise<OrderWithItems[]>;
    };
}
//# sourceMappingURL=types.d.ts.map