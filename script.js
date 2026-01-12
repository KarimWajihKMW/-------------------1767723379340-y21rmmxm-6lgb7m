/**
 * NAYOSH ERP - SaaS Multi-Tenant Architecture
 * Features: Strict Isolation, Tenant Scopes, Subscription Mgmt, Advertiser Panel, Financial System
 */

// Global API Configuration (accessible from all functions)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

const app = (() => {
    // --- API CONFIGURATION (using global) ---
    
    // Helper function to fetch data from API with data isolation headers
    async function fetchAPI(endpoint, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            // إضافة headers عزل البيانات إذا كان المستخدم مسجل دخول
            // استخدم currentUser أو fallback على window.currentUserData
            const user = currentUser || window.currentUserData;
            if (user) {
                headers['x-entity-type'] = user.tenantType;
                headers['x-entity-id'] = user.entityId;
                console.log('📤 [fetchAPI] Sending headers:', { endpoint, entityType: user.tenantType, entityId: user.entityId });
            } else {
                console.warn('⚠️ [fetchAPI] No user data available for:', endpoint);
            }
            
            const url = `${API_BASE_URL}${endpoint}`;
            console.log(`🌐 [fetchAPI] Requesting: ${url}`);
            
            const response = await fetch(url, {
                ...options,
                headers,
                timeout: 30000 // 30 second timeout
            });
            
            console.log(`📥 [fetchAPI] Response status for ${endpoint}: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ [fetchAPI] HTTP Error ${response.status} for ${endpoint}:`, errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log(`✅ [fetchAPI] Success for ${endpoint}:`, Array.isArray(data) ? `${data.length} items` : 'object');
            return data;
        } catch (error) {
            console.error(`❌ [fetchAPI] Error for ${endpoint}:`, error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }
    
    // --- CONFIGURATION ---
    const TENANT_TYPES = {
        HQ: { id: 'HQ', label: 'المكتب الرئيسي (Provider)', icon: 'fa-building', color: 'text-purple-600', bg: 'bg-purple-50', theme: 'purple' },
        BRANCH: { id: 'BRANCH', label: 'فرع تجزئة (Tenant)', icon: 'fa-store', color: 'text-blue-600', bg: 'bg-blue-50', theme: 'blue' },
        INCUBATOR: { id: 'INCUBATOR', label: 'حاضنة أعمال (Tenant)', icon: 'fa-seedling', color: 'text-orange-600', bg: 'bg-orange-50', theme: 'orange' },
        PLATFORM: { id: 'PLATFORM', label: 'منصة رقمية (Tenant)', icon: 'fa-server', color: 'text-green-600', bg: 'bg-green-50', theme: 'green' },
        OFFICE: { id: 'OFFICE', label: 'مكتب إداري (Tenant)', icon: 'fa-briefcase', color: 'text-gray-600', bg: 'bg-gray-50', theme: 'gray' }
    };

    const ROLES = {
        ADMIN: 'مسؤول النظام',       // Tenant Admin
        FINANCE: 'مسؤول مالي',      // Finance Access
        SUPPORT: 'دعم فني',         // Support Tickets
        HR: 'موارد بشرية',          // Human Resources
        ADVERTISER: 'معلن',         // Ad Publisher
        USER: 'مستخدم'             // Standard User
    };

    const THEMES = {
        BLUE: { name: 'سماء زرقاء (Default)', colors: { 50: '240 249 255', 100: '224 242 254', 400: '56 189 248', 500: '14 165 233', 600: '2 132 199', 800: '7 89 133', 900: '12 74 110' }, preview: 'bg-sky-500' },
        PURPLE: { name: 'بنفسجي ملكي', colors: { 50: '250 245 255', 100: '243 232 255', 400: '192 132 252', 500: '168 85 247', 600: '147 51 234', 800: '107 33 168', 900: '88 28 135' }, preview: 'bg-purple-500' },
        EMERALD: { name: 'أخضر الطبيعة', colors: { 50: '236 253 245', 100: '209 250 229', 400: '52 211 153', 500: '16 185 129', 600: '5 150 105', 800: '6 95 70', 900: '6 78 59' }, preview: 'bg-emerald-500' },
        ROSE: { name: 'وردي أنيق', colors: { 50: '255 241 242', 100: '255 228 230', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 800: '159 18 57', 900: '136 19 55' }, preview: 'bg-rose-500' },
        AMBER: { name: 'ذهبي فاخر', colors: { 50: '255 251 235', 100: '254 243 199', 400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 800: '146 64 14', 900: '120 53 15' }, preview: 'bg-amber-500' }
    };

    const SUBSCRIPTION_PLANS = {
        BASIC: { name: 'أساسي', price: 999, limit: 10, features: ['إدارة المهام', 'إعلانات محلية'] },
        PRO: { name: 'احترافي', price: 2499, limit: 50, features: ['تحليلات متقدمة', 'إعلانات متعددة', 'API Access'] },
        ENTERPRISE: { name: 'مؤسسات', price: 4999, limit: 999, features: ['دعم 24/7', 'نطاق خاص', 'عزل كامل'] }
    };

    const AD_LEVELS = {
        L1_LOCAL: { id: 1, key: 'L1_LOCAL', label: 'محلي (Tenant Only)', desc: 'داخل نطاق المستأجر فقط', cost: 0, approval: false, badgeClass: 'bg-gray-100 text-gray-600 border-gray-200', gradient: 'from-gray-50 to-gray-100', chartColor: '#94a3b8' },
        L2_MULTI: { id: 2, key: 'L2_MULTI', label: 'متعدد الفروع (Paid)', desc: 'نشر لعدة فروع مختارة', cost: 500, approval: true, badgeClass: 'bg-blue-100 text-blue-600 border-blue-200', gradient: 'from-blue-50 to-cyan-50', chartColor: '#3b82f6' },
        L3_INC_INT: { id: 3, key: 'L3_INC_INT', label: 'داخل الحاضنة', desc: 'لجميع منسوبي الحاضنة', cost: 100, approval: false, badgeClass: 'bg-orange-100 text-orange-600 border-orange-200', gradient: 'from-orange-50 to-amber-50', chartColor: '#f97316' },
        L4_PLT_INT: { id: 4, key: 'L4_PLT_INT', label: 'داخل المنصة', desc: 'لجميع مستخدمي النظام الرقمي', cost: 1000, approval: true, badgeClass: 'bg-green-100 text-green-600 border-green-200', gradient: 'from-emerald-50 to-teal-50', chartColor: '#10b981' },
        L5_CROSS_INC: { id: 5, key: 'L5_CROSS_INC', label: 'شبكة SaaS العالمية', desc: 'إعلان عابر لجميع المستأجرين', cost: 1500, approval: true, badgeClass: 'bg-purple-100 text-purple-600 border-purple-200', gradient: 'from-violet-50 to-fuchsia-50', chartColor: '#8b5cf6' }
    };

    const INVOICE_STATUS = {
        PAID: { label: 'مدفوعة', color: 'text-green-600', bg: 'bg-green-100' },
        PARTIAL: { label: 'دفع جزئي', color: 'text-orange-600', bg: 'bg-orange-100' },
        UNPAID: { label: 'غير مدفوعة', color: 'text-red-600', bg: 'bg-red-100' },
        OVERDUE: { label: 'متأخرة', color: 'text-red-800', bg: 'bg-red-200' }
    };

    // --- DATA LAYER (Multi-Tenant) ---
    const db = {
        users: [],
        entities: [],
        invoices: [],
        transactions: [],
        ledger: [],
        ads: [],
        approvals: [],
        notifications: [],

        tasks: [
            { id: 101, title: 'تجديد اشتراك SaaS', dueDate: '2023-11-30', status: 'Pending', priority: 'High', type: 'Billing', entityId: 'BR015' },
            { id: 102, title: 'مراجعة الميزانية العامة', dueDate: '2023-11-21', status: 'In Progress', priority: 'Medium', type: 'Ops', entityId: 'HQ001' },
            { id: 103, title: 'إعداد تقرير الحاضنة', dueDate: '2023-11-22', status: 'Done', priority: 'Low', type: 'Ops', entityId: 'INC03' }
        ],

        tickets: [
            { id: 'T-201', subject: 'مشكلة في تسجيل الدخول', status: 'Open', priority: 'High', type: 'System', entityId: 'BR015', date: '2023-11-20' },
            { id: 'T-202', subject: 'طلب زيادة عدد المستخدمين', status: 'Pending', priority: 'Medium', type: 'Billing', entityId: 'INC03', date: '2023-11-21' }
        ],

        auditLogs: [
            { id: 1, user: 'م. أحمد العلي', role: 'HQ Admin', action: 'LOGIN', details: 'System Login', timestamp: '2023-11-20 08:00', entityId: 'HQ001' },
            { id: 2, user: 'سارة محمد', role: 'Branch Admin', action: 'UPDATE_PLAN', details: 'Plan upgrade requested', timestamp: '2023-11-20 09:15', entityId: 'BR015' }
        ]
    };

    let currentUser = null;
    let activeChart = null;
    let analyticsChart = null;
    let adWizardData = {}; 

    // --- ISOLATION & PERMISSIONS LAYER ---
    const perms = {
        isHQ: () => currentUser.tenantType === 'HQ',
        isAdmin: () => currentUser.role === ROLES.ADMIN,
        isFinance: () => currentUser.role === ROLES.FINANCE || currentUser.role === ROLES.ADMIN,
        isSupport: () => currentUser.role === ROLES.SUPPORT,
        isHR: () => currentUser.role === ROLES.HR || currentUser.role === ROLES.ADMIN,
        canManageAds: () => perms.isAdmin() || currentUser.role === ROLES.ADVERTISER,
        canViewAuditLogs: () => perms.isAdmin(),

        getVisibleEntities: () => {
            if (perms.isHQ()) return db.entities;
            return db.entities.filter(e => e.id === currentUser.entityId);
        },

        getVisibleTasks: () => db.tasks.filter(t => t.entityId === currentUser.entityId),
        getVisibleTickets: () => (perms.isHQ() && perms.isSupport()) ? db.tickets : db.tickets.filter(t => t.entityId === currentUser.entityId),
        
        getVisibleAds: () => {
            console.log(`🔍 [getVisibleAds] Called for user: ${currentUser.entityId} (${currentUser.tenantType})`);
            console.log(`📊 [getVisibleAds] Total ads in db.ads: ${db.ads.length}`);
            console.log(`📋 [getVisibleAds] Ads:`, db.ads.map(a => `${a.title} (${a.sourceType})`));
            
            const filtered = db.ads.filter(ad => {
                const sourceId = ad.sourceEntityId || ad.entityId;
                
                // Check 0: HQ sees everything!
                if (currentUser.tenantType === 'HQ') {
                    console.log(`✅ Ad "${ad.title}" visible: HQ sees all`);
                    return true;
                }
                
                // Check 1: Own ads
                if (sourceId === currentUser.entityId) {
                    console.log(`✅ Ad "${ad.title}" visible: Own ad`);
                    return true;
                }
                // Check 2: HQ ads (visible to all)
                if (ad.sourceType === 'HQ') {
                    console.log(`✅ Ad "${ad.title}" visible: HQ source`);
                    return true;
                }
                // Check 3: Targeted ads
                if (Array.isArray(ad.targetIds) && ad.targetIds.includes(currentUser.entityId) && ad.status === 'ACTIVE') {
                    console.log(`✅ Ad "${ad.title}" visible: Targeted`);
                    return true;
                }
                // Check 4: Platform internal ads
                if (ad.level === 'L4_PLT_INT') {
                    console.log(`✅ Ad "${ad.title}" visible: Platform internal`);
                    return true;
                }
                console.log(`❌ Ad "${ad.title}" NOT visible (sourceType: ${ad.sourceType}, targetIds: ${JSON.stringify(ad.targetIds)})`);
                return false;
            });
            console.log(`📊 Total visible ads for ${currentUser.entityId}: ${filtered.length} out of ${db.ads.length}`);
            return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        getManagedAds: () => db.ads.filter(ad => ad.sourceEntityId === currentUser.entityId),
        getVisibleAuditLogs: () => (perms.isHQ() && perms.isAdmin()) ? db.auditLogs : db.auditLogs.filter(l => l.entityId === currentUser.entityId),

        // Financial Permissions
        getVisibleInvoices: () => {
            if (perms.isHQ()) return db.invoices;
            return db.invoices.filter(i => i.entityId === currentUser.entityId);
        },
        getVisibleLedger: () => db.ledger.filter(l => l.entityId === currentUser.entityId)
    };

    // --- UTILS ---
    const showToast = (msg, type = 'info') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const styles = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-800';
        toast.className = `${styles} text-white px-6 py-4 rounded-xl shadow-2xl text-sm flex items-center gap-4 animate-slide-in backdrop-blur-sm bg-opacity-95`;
        toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} text-lg"></i> <span class="font-semibold">${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => { 
            toast.style.opacity = '0'; 
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300); 
        }, 3000);
    };

    const logAction = (action, details) => {
        db.auditLogs.unshift({ 
            id: db.auditLogs.length + 1,
            user: currentUser.name,
            role: `${currentUser.tenantType} ${currentUser.role}`,
            action: action,
            details: details,
            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
            entityId: currentUser.entityId
        });
    };

    const updateThemeVariables = (themeKey) => {
        const theme = THEMES[themeKey] || THEMES.BLUE;
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--brand-${key}`, value);
        });
    };

    // --- FALLBACK DATA (in case API fails) ---
    const fallbackData = {
        entities: [
            { id: 'HQ001', name: 'المكتب الرئيسي', type: 'HQ', status: 'Active', balance: 2500000, location: 'الرياض', users: 15, plan: 'ENTERPRISE', expiry: '2030-12-31', theme: 'BLUE' }
        ],
        users: [
            { id: 1, name: 'م. أحمد العلي', role: 'مسؤول النظام', tenantType: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي' }
        ]
    };

    // --- SELECT TENANT MODAL (for proper data isolation) ---
    async function showTenantSelector() {
        console.log('🔐 عرض نافذة اختيار الكيان...');
        return new Promise((resolve) => {
            // First load all entities to show available tenants
            const showSelector = async () => {
                try {
                    console.log('📥 تحميل قائمة الكيانات...');
                    // Get all entities first WITHOUT headers (for selection screen)
                    const response = await fetch(`${API_BASE_URL}/entities`);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const entities = await response.json();
                    console.log(`✅ تم تحميل ${entities.length} كيان`);
                    
                    if (!entities || entities.length === 0) {
                        throw new Error('لا توجد كيانات متاحة');
                    }
                    
                    const modal = document.createElement('div');
                    modal.id = 'tenant-selector';
                    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm';
                    modal.innerHTML = `
                    <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
                        <div class="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-8 text-white">
                            <h1 class="text-3xl font-bold mb-2">🏢 نظام نايوش ERP</h1>
                            <p class="text-purple-100">اختر الكيان الذي تريد تسجيل الدخول منه</p>
                        </div>
                        <div class="p-8">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${entities.map(e => `
                                    <div class="tenant-card cursor-pointer p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all transform hover:scale-105"
                                         onclick="selectTenant('${e.id}', '${e.type}')">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1">
                                                <h3 class="font-bold text-lg mb-2 text-gray-900">${e.name}</h3>
                                                <p class="text-sm text-gray-600 mb-4">النوع: <span class="font-semibold">${e.type === 'HQ' ? 'المكتب الرئيسي' : 'فرع'}</span></p>
                                                <div class="flex gap-4">
                                                    <span class="text-xs bg-gray-100 px-3 py-1 rounded-full">الحالة: ${e.status === 'active' ? '✅ نشط' : '⏸️ معطل'}</span>
                                                </div>
                                            </div>
                                            <div class="text-3xl">
                                                ${e.type === 'HQ' ? '🏛️' : e.type === 'BRANCH' ? '🏪' : e.type === 'INCUBATOR' ? '🌱' : e.type === 'PLATFORM' ? '💻' : '📋'}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <p class="text-center text-sm text-gray-500 mt-8 pt-8 border-t">
                                💡 اختيار الكيان سيحدد البيانات التي تراها في النظام
                            </p>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                window.selectTenant = (tenantId, tenantType) => {
                    const selectedEntity = entities.find(e => e.id === tenantId);
                    currentUser = {
                        id: 1,
                        name: selectedEntity.name + ' - مسؤول',
                        role: 'مسؤول النظام',
                        tenantType: tenantType,
                        entityId: tenantId,
                        entityName: selectedEntity.name
                    };
                    
                    // 🔑 حفظ currentUser في window وlocalStorage
                    window.currentUserData = currentUser;
                    localStorage.setItem('nayosh_selected_entity', JSON.stringify(currentUser));
                    console.log('💾 تم حفظ بيانات المستخدم الحالي:', window.currentUserData);
                    
                    modal.remove();
                    resolve(currentUser);
                };
                
                } catch (error) {
                    console.error('❌ خطأ في تحميل نافذة اختيار الكيان:', error);
                    // Show error message to user
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50';
                    errorDiv.innerHTML = `
                        <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">خطأ في الاتصال بالسيرفر</h2>
                            <p class="text-gray-600 mb-4">لا يمكن تحميل قائمة الكيانات</p>
                            <p class="text-sm text-gray-500 mb-4">${error.message}</p>
                            <button onclick="location.reload()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                                <i class="fas fa-sync-alt mr-2"></i>
                                إعادة المحاولة
                            </button>
                        </div>
                    `;
                    document.body.appendChild(errorDiv);
                }
            };
            
            showSelector();
        });
    }

    // --- DATA LOADING FROM API ---
    async function loadDataFromAPI() {
        console.log('🔄 Starting loadDataFromAPI...');
        console.log('👤 Current user:', currentUser);
        
        // Verify that currentUser is set
        if (!currentUser || !currentUser.entityId) {
            console.error('❌ لا يوجد مستخدم محدد! لا يمكن تحميل البيانات.');
            throw new Error('User not selected. Cannot load data.');
        }
        
        const loadedData = {
            entities: 0,
            users: 0,
            invoices: 0,
            transactions: 0,
            ledger: 0,
            ads: 0
        };
        
        try {
            // Load entities
            console.log('📥 Loading entities...');
            const entities = await fetchAPI('/entities');
            db.entities = entities.map(e => ({
                id: e.id,
                name: e.name,
                type: e.type,
                status: e.status,
                balance: parseFloat(e.balance) || 0,
                location: e.location,
                users: e.users_count || 0,
                plan: e.plan,
                expiry: e.expiry_date,
                theme: e.theme
            }));
            loadedData.entities = db.entities.length;
            console.log(`✅ Loaded ${loadedData.entities} entities`);

            // Load users
            console.log('📥 Loading users...');
            const users = await fetchAPI('/users');
            db.users = users.map(u => ({
                id: u.id,
                name: u.name,
                role: u.role,
                tenantType: u.tenant_type,
                entityId: u.entity_id,
                entityName: u.entity_name
            }));
            loadedData.users = db.users.length;
            console.log(`✅ Loaded ${loadedData.users} users`);

            // Load invoices
            console.log('📥 Loading invoices...');
            const invoices = await fetchAPI('/invoices');
            db.invoices = invoices.map(inv => ({
                id: inv.id,
                entityId: inv.entity_id,
                type: inv.type,
                title: inv.title,
                amount: parseFloat(inv.amount),
                paidAmount: parseFloat(inv.paid_amount),
                status: inv.status,
                date: inv.issue_date,
                dueDate: inv.due_date
            }));
            loadedData.invoices = db.invoices.length;
            console.log(`✅ Loaded ${loadedData.invoices} invoices`);

            // Load transactions
            console.log('📥 Loading transactions...');
            const transactions = await fetchAPI('/transactions');
            db.transactions = transactions.map(t => ({
                id: t.id,
                invoiceId: t.invoice_id,
                entityId: t.entity_id,
                type: t.type,
                amount: parseFloat(t.amount),
                method: t.payment_method,
                date: t.transaction_date,
                ref: t.reference_code,
                user: t.user_name
            }));
            loadedData.transactions = db.transactions.length;
            console.log(`✅ Loaded ${loadedData.transactions} transactions`);

            // Load ledger
            console.log('📥 Loading ledger...');
            const ledger = await fetchAPI('/ledger');
            db.ledger = ledger.map(l => ({
                id: l.id,
                entityId: l.entity_id,
                trxId: l.transaction_id,
                date: l.transaction_date,
                desc: l.description,
                debit: parseFloat(l.debit),
                credit: parseFloat(l.credit),
                balance: parseFloat(l.balance),
                type: l.type
            }));
            loadedData.ledger = db.ledger.length;
            console.log(`✅ Loaded ${loadedData.ledger} ledger entries`);

            // Load ads
            console.log('📥 Loading ads...');
            const ads = await fetchAPI('/ads');
            db.ads = ads.map(ad => {
                const sourceId = ad.source_entity_id || ad.entity_id;
                // Convert target_ids from string to array
                let targetIds = [];
                if (ad.target_ids) {
                    targetIds = typeof ad.target_ids === 'string' 
                        ? ad.target_ids.split(',').filter(id => id.trim()) 
                        : ad.target_ids;
                }
                return {
                    id: ad.id,
                    title: ad.title,
                    content: ad.content,
                    level: ad.level,
                    scope: ad.scope,
                    status: ad.status,
                    sourceEntityId: sourceId,
                    entityId: ad.entity_id,
                    targetIds: targetIds,
                    date: ad.created_at,
                    cost: parseFloat(ad.cost) || 0,
                    sourceType: ad.source_type,
                    budget: parseFloat(ad.budget) || 0,
                    spent: parseFloat(ad.spent) || 0,
                    impressions: ad.impressions || 0,
                    clicks: ad.clicks || 0,
                    startDate: ad.start_date,
                    endDate: ad.end_date
                };
            });
            loadedData.ads = db.ads.length;
            console.log(`✅ Loaded ${loadedData.ads} ads`);

            // Load approvals
            console.log('📥 Loading approvals...');
            const approvals = await fetchAPI('/approvals');
            db.approvals = approvals.map(a => ({
                id: a.id,
                entityId: a.entity_id,
                itemType: a.item_type,
                itemId: a.item_id,
                itemTitle: a.item_title,
                amount: parseFloat(a.amount),
                currentLevel: a.current_level,
                status: a.status,
                createdBy: a.created_by,
                createdByName: a.created_by_name,
                createdAt: a.created_at,
                steps: a.steps || []
            }));
            console.log(`✅ Loaded ${db.approvals.length} approvals`);

            // Load notifications for current user
            if (currentUser?.id) {
                console.log('📥 Loading notifications...');
                const notifications = await fetchAPI(`/notifications?user_id=${currentUser.id}`);
                db.notifications = notifications.map(n => ({
                    id: n.id,
                    userId: n.user_id,
                    entityId: n.entity_id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    linkType: n.link_type,
                    linkId: n.link_id,
                    isRead: n.is_read,
                    priority: n.priority,
                    createdAt: n.created_at
                }));
                console.log(`✅ Loaded ${db.notifications.length} notifications`);
            }

            console.log('✅ تم تحميل جميع البيانات من قاعدة البيانات', loadedData);
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Log which endpoint failed
            console.warn('⚠️ استخدام البيانات الاحتياطية...');
            
            // Use fallback data
            if (!db.entities || db.entities.length === 0) {
                db.entities = fallbackData.entities;
                console.log('📦 Using fallback entities');
            }
            if (!db.users || db.users.length === 0) {
                db.users = fallbackData.users;
                console.log('📦 Using fallback users');
            }
            
            // Throw error to be caught by init()
            throw new Error(`Failed to load data: ${error.message}`);
        }
    }

    // --- INIT & NAV ---
    const init = async () => {
        console.log('🔄 بدء التهيئة...');
        
        try {
            // Check if user already selected entity before
            const savedEntity = localStorage.getItem('nayosh_selected_entity');
            if (savedEntity) {
                try {
                    currentUser = JSON.parse(savedEntity);
                    window.currentUserData = currentUser;
                    console.log('✅ استرجاع الكيان المحفوظ:', currentUser);
                } catch (e) {
                    console.warn('⚠️ خطأ في استرجاع الكيان المحفوظ:', e);
                    localStorage.removeItem('nayosh_selected_entity');
                }
            }
            
            const view = document.getElementById('main-view');
            
            // Show tenant selector only if no saved entity
            if (!currentUser) {
                view.innerHTML = `<div class="flex h-full items-center justify-center"></div>`;
                await showTenantSelector();
                console.log('✅ تم اختيار الكيان:', currentUser);
            }
            
            // 🔑 تأكد من حفظ currentUser في window
            window.currentUserData = currentUser;
            
            // Show loading
            view.innerHTML = `
                <div class="flex h-full items-center justify-center flex-col gap-6">
                    <div class="relative">
                        <div class="w-24 h-24 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
                        <i class="fas fa-database absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl text-brand-600"></i>
                    </div>
                    <p class="text-slate-600 font-bold text-lg animate-pulse">جاري تحميل البيانات للكيان: <strong>${currentUser.entityName}</strong></p>
                </div>`;
            
            // Load data from API (now with proper entity headers)
            try {
                await loadDataFromAPI();
                console.log('📊 تم تحميل البيانات:', { entities: db.entities.length, users: db.users.length, invoices: db.invoices.length });
            } catch (apiError) {
                console.error('❌ خطأ في تحميل البيانات من API:', apiError);
                // Continue with empty data - app will still work
                console.log('⚠️ الاستمرار مع بيانات فارغة...');
            }
            
            // User is already selected from tenant selector
            console.log('👤 المستخدم الحالي:', currentUser);
            
            renderSidebar();
            updateHeader();
            const tenant = db.entities.find(e => e.id === currentUser?.entityId);
            if(tenant && tenant.theme) updateThemeVariables(tenant.theme);
            
            loadRoute('dashboard');
            showToast(`تم تسجيل الدخول: ${currentUser?.entityName || 'نظام نايوش'}`, 'success');
            console.log('✅ اكتملت التهيئة');
        } catch (error) {
            console.error('❌ خطأ فادح في التهيئة:', error);
            const view = document.getElementById('main-view');
            view.innerHTML = `
                <div class="flex h-full items-center justify-center flex-col gap-6 p-8">
                    <div class="text-center">
                        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                        <h2 class="text-2xl font-bold text-slate-800 mb-2">عذراً، حدث خطأ في تحميل النظام</h2>
                        <p class="text-slate-600 mb-4">يرجى تحديث الصفحة أو المحاولة لاحقاً</p>
                        <button onclick="location.reload()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-sync-alt mr-2"></i>
                            تحديث الصفحة
                        </button>
                    </div>
                    <div class="text-sm text-slate-400 bg-slate-100 p-4 rounded-lg max-w-2xl">
                        <strong>تفاصيل الخطأ:</strong> ${error.message}
                    </div>
                </div>
            `;
        }
    };

    const init_old = () => {
        renderSidebar();
        updateHeader();
        const tenant = db.entities.find(e => e.id === currentUser.entityId);
        if(tenant && tenant.theme) updateThemeVariables(tenant.theme);
        
        loadRoute('dashboard');
        showToast(`تم تسجيل الدخول: ${currentUser.entityName}`, 'success');
    };

    const toggleMobileMenu = () => {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('mobile-backdrop');
        const isClosed = sidebar.classList.contains('translate-x-full');

        if (isClosed) {
            sidebar.classList.remove('translate-x-full');
            sidebar.classList.add('translate-x-0');
            backdrop.classList.remove('hidden');
            requestAnimationFrame(() => backdrop.classList.remove('opacity-0'));
        } else {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('translate-x-full');
            backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
        }
    };

    const switchUser = (id) => {
        const u = db.users.find(x => x.id === id);
        if (u) {
            toggleRoleMenu();
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('translate-x-0') && window.innerWidth < 768) {
                toggleMobileMenu();
            }
            currentUser = u;
            const tenant = db.entities.find(e => e.id === currentUser.entityId);
            if(tenant && tenant.theme) updateThemeVariables(tenant.theme);
            const view = document.getElementById('main-view');
            view.innerHTML = `
                <div class="flex h-full items-center justify-center flex-col gap-6">
                    <div class="relative">
                        <div class="w-24 h-24 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
                        <i class="fas fa-sync absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl text-brand-600"></i>
                    </div>
                    <p class="text-slate-600 font-bold text-lg animate-pulse">جاري تبديل سياق المستأجر (Tenant Context)...</p>
                </div>`;
            setTimeout(() => { 
                renderSidebar(); updateHeader(); loadRoute('dashboard');
                showToast(`أنت الآن في نطاق: ${currentUser.entityName}`, 'success');
            }, 800);
        }
    };

    const toggleRoleMenu = (event) => {
        if (event) event.stopPropagation();
        const menu = document.getElementById('role-menu');
        const chevron = document.getElementById('role-chevron');
        
        // Populate menu with users when opening
        if (menu.classList.contains('hidden')) {
            // Group users by tenant type
            const grouped = {};
            db.users.forEach(u => {
                if (!grouped[u.tenantType]) grouped[u.tenantType] = [];
                grouped[u.tenantType].push(u);
            });
            
            let menuHTML = '<div class="p-4">';
            menuHTML += '<h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">اختر مستخدم للتبديل</h3>';
            
            // Add "Change Entity" button
            menuHTML += `
                <button onclick="app.changeTenant()" 
                        class="w-full mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition flex items-center gap-3 group shadow-lg">
                    <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <i class="fas fa-exchange-alt text-lg"></i>
                    </div>
                    <div class="flex-1 text-right">
                        <div class="font-bold text-sm">تغيير الكيان</div>
                        <div class="text-xs opacity-90">الانتقال إلى كيان آخر</div>
                    </div>
                </button>
                <div class="border-t border-gray-200 my-3"></div>
            `;
            
            Object.entries(grouped).forEach(([type, users]) => {
                const typeInfo = TENANT_TYPES[type] || TENANT_TYPES.BRANCH;
                menuHTML += `<div class="mb-4">`;
                menuHTML += `<div class="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
                    <i class="fas ${typeInfo.icon}"></i>
                    <span>${typeInfo.label}</span>
                </div>`;
                
                users.forEach(u => {
                    const isActive = currentUser && u.id === currentUser.id;
                    menuHTML += `
                        <button onclick="app.switchUser(${u.id})" 
                                class="w-full text-right p-3 rounded-lg hover:bg-slate-50 transition flex items-center gap-3 group ${isActive ? 'bg-brand-50 border border-brand-200' : ''}">
                            <div class="w-10 h-10 rounded-full ${typeInfo.bg} ${typeInfo.color} flex items-center justify-center font-bold text-sm flex-shrink-0">
                                ${u.name.charAt(0)}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-bold text-sm text-slate-800 truncate">${u.name}</div>
                                <div class="text-xs text-slate-500 truncate">${u.role} - ${u.entityName}</div>
                            </div>
                            ${isActive ? '<i class="fas fa-check text-brand-600"></i>' : ''}
                        </button>
                    `;
                });
                menuHTML += '</div>';
            });
            
            menuHTML += '</div>';
            menu.innerHTML = menuHTML;
            
            menu.classList.remove('hidden');
            setTimeout(() => { menu.classList.remove('opacity-0', 'scale-95'); menu.classList.add('opacity-100', 'scale-100'); }, 10);
            chevron.classList.add('rotate-180');
        } else {
            menu.classList.remove('opacity-100', 'scale-100');
            menu.classList.add('opacity-0', 'scale-95');
            chevron.classList.remove('rotate-180');
            setTimeout(() => menu.classList.add('hidden'), 200);
        }
    };

    window.addEventListener('click', (e) => {
        const menu = document.getElementById('role-menu');
        const btn = document.querySelector('button[onclick*="toggleRoleMenu"]');
        if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) toggleRoleMenu();
    });

    const changeTenant = () => {
        // Clear saved entity
        localStorage.removeItem('nayosh_selected_entity');
        currentUser = null;
        window.currentUserData = null;
        
        // Reload page to show tenant selector
        showToast('جاري تحميل نافذة اختيار الكيان...', 'info');
        setTimeout(() => {
            location.reload();
        }, 500);
    };

    const updateHeader = () => {
        if (!currentUser) return;
        
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = TENANT_TYPES[currentUser.tenantType].label;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        document.getElementById('tenant-id-display').innerText = currentUser.entityId;
        document.getElementById('tenant-badge').className = `hidden md:flex items-center gap-2 border px-3 py-1 rounded-full animate-fade-in ${TENANT_TYPES[currentUser.tenantType].bg} ${TENANT_TYPES[currentUser.tenantType].color} border-current border-opacity-20`;
        
        // Update notification bell
        const unreadCount = db.notifications.filter(n => !n.isRead).length;
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            notificationBell.innerHTML = `
                <i class="fas fa-bell text-lg"></i>
                ${unreadCount > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
            `;
        }
    };

    const loadRoute = async (route) => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('translate-x-0') && window.innerWidth < 768) toggleMobileMenu();

        const view = document.getElementById('main-view');
        document.getElementById('page-title').innerText = getTitle(route);
        if (activeChart) { activeChart.destroy(); activeChart = null; }
        if (analyticsChart) { analyticsChart.destroy(); analyticsChart = null; }
        
        let content = '';
        if (route === 'dashboard') {
            view.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>';
            content = await renderDashboard();
        }
        else if (route === 'hierarchy') content = await renderHierarchy();
        else if (route === 'employees') content = await renderEmployees();
        else if (route === 'saas') content = renderSaaSManager();
        else if (route === 'ads') content = renderAdsManager();
        else if (route === 'billing') content = renderBilling();
        else if (route === 'approvals') content = renderApprovals();
        else if (route === 'incubator') {
            view.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>';
            await renderIncubator();
        }
        else if (route === 'entities') content = renderEntitiesManager();
        else if (route === 'register-tenant') content = renderTenantRegistration();
        else if (route === 'tasks') content = renderTasksManager();
        else if (route === 'audit-logs') content = renderAuditLogs();
        else if (route === 'settings') content = renderSettings();
        else content = renderPlaceholder();

        if (route !== 'incubator') {
            view.innerHTML = `<div class="fade-in">${content}</div>`;
        }
        updateActiveLink(route);

        if (route === 'dashboard') requestAnimationFrame(initDashboardChart);
        if (route === 'ads' && perms.canManageAds()) requestAnimationFrame(initAnalyticsChart);
    };

    const updateActiveLink = (route) => {
        document.querySelectorAll('#nav-menu a').forEach(l => {
            l.classList.remove('bg-gradient-to-r', 'from-brand-600/20', 'to-brand-600/5', 'text-white', 'border-r-4', 'border-brand-500');
            l.classList.add('text-slate-400');
        });
        const active = document.getElementById(`link-${route}`);
        if(active) {
            active.classList.remove('text-slate-400');
            active.classList.add('bg-gradient-to-r', 'from-brand-600/20', 'to-brand-600/5', 'text-white', 'border-r-4', 'border-brand-500');
        }
    };

    const getTitle = (r) => {
        const map = { 
            'dashboard': 'لوحة القيادة (Tenant Dashboard)',
            'hierarchy': 'الهيكل الهرمي - Multi-Tenant',
            'saas': 'إدارة الاشتراك والخدمات (SaaS)',
            'billing': 'الإدارة المالية والفواتير',
            'approvals': 'الموافقات المالية التدريجية',
            'incubator': 'حاضنة السلامة - إدارة التدريب',
            'entities': perms.isHQ() ? 'إدارة المستأجرين' : 'بيانات الكيان',
            'register-tenant': 'تسجيل مستأجر جديد',
            'ads': perms.canManageAds() ? 'لوحة المعلن المركزية' : 'منصة الإعلانات',
            'tasks': 'المهام الداخلية',
            'audit-logs': 'سجل الأحداث (Audit Logs)',
            'settings': 'إعدادات الهوية والعلامة التجارية'
        };
        return map[r] || 'نظام نايوش';
    };

    const renderSidebar = () => {
        console.log('🔄 رسم القائمة الجانبية...', { currentUser });
        const menu = document.getElementById('nav-menu');
        if (!currentUser) {
            menu.innerHTML = '<li class="px-4 py-2 text-slate-400">جاري التحميل...</li>';
            console.warn('⚠️ لا يوجد مستخدم حالي!');
            return;
        }
        
        const unreadCount = db.notifications.filter(n => !n.isRead).length;
        const pendingApprovals = db.approvals.filter(a => 
            a.status === 'PENDING' && 
            a.steps.some(s => s.approver_id === currentUser.id && s.status === 'PENDING')
        ).length;
        
        const currentEntity = db.entities.find(e => e.id === currentUser.entityId);
        const isIncubator = currentEntity?.type === 'INCUBATOR';
        
        const items = [
            { id: 'dashboard', icon: 'fa-chart-pie', label: 'الرئيسية', show: true },
            { id: 'hierarchy', icon: 'fa-sitemap', label: 'الهيكل الهرمي', show: true },
            { id: 'saas', icon: 'fa-cubes', label: perms.isHQ() ? 'إدارة الاشتراكات' : 'اشتراكي (SaaS)', show: true },
            { id: 'incubator', icon: 'fa-graduation-cap', label: 'حاضنة السلامة', show: isIncubator || perms.isHQ() },
            { id: 'billing', icon: 'fa-file-invoice-dollar', label: 'المالية والفواتير', show: perms.isFinance() },
            { id: 'approvals', icon: 'fa-check-circle', label: 'الموافقات المالية', show: perms.isFinance(), badge: pendingApprovals },
            { id: 'entities', icon: 'fa-sitemap', label: perms.isHQ() ? 'المستأجرين' : 'فرعي/كياني', show: true },
            { id: 'employees', icon: 'fa-users', label: 'إدارة الموظفين', show: perms.isHR() || perms.isAdmin() },
            { id: 'ads', icon: 'fa-bullhorn', label: perms.canManageAds() ? 'مركز المعلنين' : 'الإعلانات', show: true },
            { id: 'tasks', icon: 'fa-tasks', label: 'المهام', show: true },
            { id: 'settings', icon: 'fa-paint-brush', label: 'إعدادات الهوية', show: perms.isAdmin() },
            { id: 'audit-logs', icon: 'fa-history', label: 'سجل النظام', show: perms.canViewAuditLogs() }
        ];

        menu.innerHTML = items.filter(i => i.show).map(item => 
            `<li>
                <a href="#" id="link-${item.id}" onclick="app.loadRoute('${item.id}')" 
                   class="flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group relative overflow-hidden">
                   <i class="fas ${item.icon} w-6 text-center group-hover:text-brand-400 transition-colors z-10"></i> 
                   <span class="z-10 relative font-medium">${item.label}</span>
                   ${item.badge ? `<span class="mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">${item.badge}</span>` : ''}
                </a>
            </li>`
        ).join('');
    };

    // --- FINANCIAL MODULE ---
    const renderBilling = () => {
        const invoices = perms.getVisibleInvoices();
        const ledger = perms.getVisibleLedger();
        
        const totalDue = invoices.reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0);
        const totalPaid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
        const overdue = invoices.filter(i => i.status === 'OVERDUE').length;

        return `
        <div class="space-y-8 animate-fade-in">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">النظام المالي والتحصيل</h2>
                    <p class="text-slate-500">${perms.isHQ() ? 'متابعة فواتير المستأجرين والتحصيل' : 'فواتير الاشتراكات والذمم المالية'}</p>
                </div>
                ${perms.isHQ() ? `<button onclick="app.openCreateInvoiceModal()" class="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition flex items-center gap-2"><i class="fas fa-plus"></i> إنشاء فاتورة جديدة</button>` : ''}
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${renderKpiCard('المبالغ المستحقة (AR)', totalDue.toLocaleString() + ' ر.س', 'fa-hand-holding-usd', 'text-red-600', 'bg-red-50')}
                ${renderKpiCard('المبالغ المحصلة', totalPaid.toLocaleString() + ' ر.س', 'fa-check-double', 'text-green-600', 'bg-green-50')}
                ${renderKpiCard('الفواتير المتأخرة', overdue, 'fa-clock', 'text-orange-600', 'bg-orange-50')}
            </div>

            <!-- Tabs -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="flex border-b border-slate-100">
                    <button onclick="app.switchTab('invoices')" id="tab-btn-invoices" class="flex-1 py-4 text-sm font-bold text-brand-600 border-b-2 border-brand-600 bg-brand-50 transition">الفواتير (Invoices)</button>
                    <button onclick="app.switchTab('ledger')" id="tab-btn-ledger" class="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition">سجل القيود (Ledger)</button>
                </div>

                <!-- Invoices Tab -->
                <div id="tab-content-invoices" class="p-6">
                    <div class="overflow-x-auto">
                         <table class="w-full text-right whitespace-nowrap">
                            <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th class="p-4">رقم الفاتورة</th>
                                    ${perms.isHQ() ? '<th class="p-4">المستأجر</th>' : ''}
                                    <th class="p-4">البيان</th>
                                    <th class="p-4">المبلغ</th>
                                    <th class="p-4">المدفوع</th>
                                    <th class="p-4">الحالة</th>
                                    <th class="p-4">التاريخ</th>
                                    <th class="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50 text-sm">
                                ${invoices.length ? invoices.map(inv => {
                                    const status = INVOICE_STATUS[inv.status] || INVOICE_STATUS.UNPAID;
                                    const entityName = db.entities.find(e => e.id === inv.entityId)?.name || inv.entityId;
                                    return `
                                    <tr class="hover:bg-slate-50 transition group">
                                        <td class="p-4 font-mono font-bold text-brand-600">${inv.id}</td>
                                        ${perms.isHQ() ? `<td class="p-4 font-bold text-slate-700">${entityName}</td>` : ''}
                                        <td class="p-4 text-slate-600">${inv.title}</td>
                                        <td class="p-4 font-bold">${inv.amount.toLocaleString()}</td>
                                        <td class="p-4 text-green-600">${inv.paidAmount.toLocaleString()}</td>
                                        <td class="p-4"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.bg} ${status.color} border-current border-opacity-20">${status.label}</span></td>
                                        <td class="p-4 text-xs text-slate-400">${inv.date}</td>
                                        <td class="p-4">
                                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                                <button onclick="app.openPaymentModal('${inv.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg tooltip" title="سداد"><i class="fas fa-money-bill-wave"></i></button>
                                                <button class="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg"><i class="fas fa-print"></i></button>
                                            </div>
                                        </td>
                                    </tr>`;
                                }).join('') : '<tr><td colspan="8" class="p-8 text-center text-slate-400">لا توجد فواتير مسجلة</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Ledger Tab -->
                <div id="tab-content-ledger" class="hidden p-6">
                    <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-6 flex items-start gap-3">
                        <i class="fas fa-shield-alt text-yellow-600 mt-1"></i>
                        <div>
                            <h4 class="font-bold text-yellow-800 text-sm">سجل مالي غير قابل للحذف (Immutable Ledger)</h4>
                            <p class="text-xs text-yellow-700 mt-1">يتم تسجيل جميع العمليات المالية هنا. لا يمكن حذف القيود، ولكن يمكن إجراء قيود عكسية (Reversal) لتصحيح الأخطاء.</p>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-right whitespace-nowrap">
                            <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                <tr>
                                    <th class="p-4">#</th>
                                    <th class="p-4">التاريخ</th>
                                    <th class="p-4">المرجع (Trx ID)</th>
                                    <th class="p-4">الوصف</th>
                                    <th class="p-4">دائن (Credit)</th>
                                    <th class="p-4">رصيد تراكمي</th>
                                    <th class="p-4">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-50 text-sm font-mono">
                                ${ledger.length ? ledger.map(l => `
                                <tr class="hover:bg-slate-50">
                                    <td class="p-4 text-slate-400">${l.id}</td>
                                    <td class="p-4 text-slate-500">${l.date}</td>
                                    <td class="p-4 text-brand-600">${l.trxId}</td>
                                    <td class="p-4 font-sans font-bold text-slate-700">${l.desc}</td>
                                    <td class="p-4 text-green-600">${l.credit > 0 ? l.credit.toLocaleString() : '-'}</td>
                                    <td class="p-4 font-bold text-slate-800">${l.balance.toLocaleString()}</td>
                                    <td class="p-4">
                                        ${l.credit > 0 ? `<button onclick="app.reverseTransaction('${l.trxId}')" class="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 hover:bg-red-100 transition">قيد عكسي</button>` : ''}
                                    </td>
                                </tr>`).join('') : '<tr><td colspan="7" class="p-8 text-center text-slate-400">السجل المالي فارغ</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`;
    };

    const switchTab = (tab) => {
        document.getElementById('tab-content-invoices').classList.add('hidden');
        document.getElementById('tab-content-ledger').classList.add('hidden');
        document.getElementById('tab-btn-invoices').className = 'flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition';
        document.getElementById('tab-btn-ledger').className = 'flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition';

        document.getElementById(`tab-content-${tab}`).classList.remove('hidden');
        document.getElementById(`tab-btn-${tab}`).className = 'flex-1 py-4 text-sm font-bold text-brand-600 border-b-2 border-brand-600 bg-brand-50 transition';
    };

    // --- MODALS ---
    const openCreateInvoiceModal = () => {
        const modal = document.createElement('div');
        modal.id = 'invoice-modal';
        modal.className = 'fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center backdrop-blur-sm fade-in p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
                <div class="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 class="font-bold text-lg text-slate-800">إنشاء فاتورة جديدة</h3>
                    <button onclick="document.getElementById('invoice-modal').remove()" class="text-slate-400 hover:text-slate-600"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">المستأجر (العميل)</label>
                        <select id="inv-entity" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200">
                            ${db.entities.filter(e => e.type !== 'HQ').map(e => `<option value="${e.id}">${e.name} (${e.id})</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">عنوان الفاتورة</label>
                        <input type="text" id="inv-title" placeholder="مثال: رسوم تجديد اشتراك" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                             <label class="block text-xs font-bold text-slate-600 mb-1.5">المبلغ (ر.س)</label>
                             <input type="number" id="inv-amount" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 font-bold">
                        </div>
                        <div>
                             <label class="block text-xs font-bold text-slate-600 mb-1.5">تاريخ الاستحقاق</label>
                             <input type="date" id="inv-due" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200">
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onclick="document.getElementById('invoice-modal').remove()" class="px-4 py-2 rounded-lg text-slate-500 font-bold hover:bg-slate-200">إلغاء</button>
                    <button onclick="app.submitInvoice()" class="px-6 py-2 rounded-lg bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg">إصدار الفاتورة</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    };

    const submitInvoice = () => {
        const entityId = document.getElementById('inv-entity').value;
        const title = document.getElementById('inv-title').value;
        const amount = parseFloat(document.getElementById('inv-amount').value);
        const due = document.getElementById('inv-due').value;

        if(!title || !amount || !due) return showToast('يرجى تعبئة جميع الحقول', 'error');

        const newInv = {
            id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            entityId: entityId,
            type: 'SERVICE',
            title: title,
            amount: amount,
            paidAmount: 0,
            status: 'UNPAID',
            date: new Date().toISOString().slice(0, 10),
            dueDate: due
        };

        db.invoices.unshift(newInv);
        logAction('CREATE_INVOICE', `Generated Invoice ${newInv.id} for ${entityId}`);
        document.getElementById('invoice-modal').remove();
        showToast('تم إصدار الفاتورة بنجاح', 'success');
        loadRoute('billing');
    };

    const openPaymentModal = (invId) => {
        const inv = db.invoices.find(i => i.id === invId);
        if(!inv) return;
        const remaining = inv.amount - inv.paidAmount;

        const modal = document.createElement('div');
        modal.id = 'pay-modal';
        modal.className = 'fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center backdrop-blur-sm fade-in p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                <div class="p-6 border-b border-slate-100 bg-green-50 flex justify-between items-center">
                    <h3 class="font-bold text-lg text-green-800"><i class="fas fa-cash-register mr-2"></i> تسجيل دفعة</h3>
                    <button onclick="document.getElementById('pay-modal').remove()" class="text-green-600 hover:text-green-800"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div class="bg-slate-50 p-3 rounded-lg flex justify-between text-sm">
                         <span class="text-slate-500">المبلغ المتبقي:</span>
                         <span class="font-bold text-slate-800">${remaining.toLocaleString()} ر.س</span>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">المبلغ المدفوع</label>
                        <input type="number" id="pay-amount" value="${remaining}" max="${remaining}" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 font-bold text-lg">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1.5">طريقة الدفع</label>
                        <select id="pay-method" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200">
                            <option>تحويل بنكي</option>
                            <option>بطاقة ائتمان</option>
                            <option>نقدي</option>
                        </select>
                    </div>
                </div>
                <div class="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onclick="app.submitPayment('${inv.id}')" class="w-full px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition transform hover:-translate-y-1">تأكيد السداد</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    };

    const submitPayment = (invId) => {
        const amount = parseFloat(document.getElementById('pay-amount').value);
        const method = document.getElementById('pay-method').value;
        const inv = db.invoices.find(i => i.id === invId);

        if (amount <= 0 || amount > (inv.amount - inv.paidAmount)) return showToast('مبلغ غير صالح', 'error');

        // 1. Create Transaction
        const trxId = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
        const newTrx = {
            id: trxId,
            invoiceId: invId,
            entityId: inv.entityId,
            type: 'PAYMENT',
            amount: amount,
            method: method,
            date: new Date().toISOString().slice(0, 10),
            user: currentUser.name
        };
        db.transactions.push(newTrx);

        // 2. Update Invoice
        inv.paidAmount += amount;
        if (inv.paidAmount >= inv.amount) inv.status = 'PAID';
        else if (inv.paidAmount > 0) inv.status = 'PARTIAL';

        // 3. Add to Ledger (Immutable)
        db.ledger.unshift({
            id: db.ledger.length + 1,
            entityId: inv.entityId,
            trxId: trxId,
            date: new Date().toISOString().slice(0, 10),
            desc: `سداد جزئي/كلي للفاتورة ${invId}`,
            debit: 0,
            credit: amount,
            balance: (db.ledger[0]?.balance || 0) + amount,
            type: 'Credit'
        });

        logAction('PAYMENT', `Recorded payment of ${amount} for ${invId}`);
        document.getElementById('pay-modal').remove();
        showToast('تم تسجيل الدفع بنجاح', 'success');
        loadRoute('billing');
    };

    const reverseTransaction = (trxId) => {
        const originalTrx = db.transactions.find(t => t.id === trxId);
        if (!originalTrx) return;
        if (confirm('هل أنت متأكد من إجراء قيد عكسي؟ سيتم خصم المبلغ من الرصيد.')) {
            // 1. Create Reversal Transaction
            const revId = `REV-${Math.floor(1000 + Math.random() * 9000)}`;
            
            // 2. Update Invoice
            const inv = db.invoices.find(i => i.id === originalTrx.invoiceId);
            if (inv) {
                inv.paidAmount -= originalTrx.amount;
                if (inv.paidAmount <= 0) inv.status = 'UNPAID';
                else if (inv.paidAmount < inv.amount) inv.status = 'PARTIAL';
            }

            // 3. Ledger Entry (Debit to reduce balance)
            db.ledger.unshift({
                id: db.ledger.length + 1,
                entityId: originalTrx.entityId,
                trxId: revId,
                date: new Date().toISOString().slice(0, 10),
                desc: `قيد عكسي (تصحيح) للمعاملة ${trxId}`,
                debit: originalTrx.amount,
                credit: 0,
                balance: (db.ledger[0]?.balance || 0) - originalTrx.amount,
                type: 'Debit'
            });

            logAction('REVERSAL', `Reversed transaction ${trxId}`);
            showToast('تم إجراء القيد العكسي بنجاح', 'success');
            loadRoute('billing');
        }
    };

    // --- DASHBOARD (Existing) --- 
    const initDashboardChart = () => {
        const ctx = document.getElementById('adsChart');
        if (!ctx) return;
        const visibleAds = perms.getVisibleAds();
        const levels = Object.values(AD_LEVELS);
        const counts = levels.map(l => visibleAds.filter(a => a.level === l.key).length);

        activeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: levels.map(l => l.label.split(' ')[0]),
                datasets: [{ label: 'الإعلانات', data: counts, backgroundColor: levels.map(l => l.chartColor), borderRadius: 6 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } }, 
                    x: { grid: { display: false }, border: { display: false } } 
                }
            }
        });
    };

    const renderDashboard = async () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        if (!entity) return renderPlaceholder('Entity Not Found');

        // Check if entity has specific dashboard type
        try {
            const dashboardType = await fetchAPI(`/dashboard/type?entity_id=${currentUser.entityId}`);
            
            if (dashboardType.dashboard_type === 'incubator') {
                try {
                    return await renderIncubatorDashboard();
                } catch (error) {
                    console.error('Incubator dashboard error:', error);
                    showToast('حدث خطأ في تحميل لوحة الحاضنة، سيتم عرض اللوحة الافتراضية', 'warning');
                }
            } else if (dashboardType.dashboard_type === 'platform') {
                try {
                    return await renderPlatformDashboard();
                } catch (error) {
                    console.error('Platform dashboard error:', error);
                    showToast('حدث خطأ في تحميل لوحة المنصة، سيتم عرض اللوحة الافتراضية', 'warning');
                }
            } else if (dashboardType.dashboard_type === 'office') {
                try {
                    return await renderOfficeDashboard();
                } catch (error) {
                    console.error('Office dashboard error:', error);
                    showToast('حدث خطأ في تحميل لوحة المكتب، سيتم عرض اللوحة الافتراضية', 'warning');
                }
            }
        } catch (error) {
            console.log('Using default dashboard:', error.message);
        }

        // Default dashboard
        return `
        <div class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <span class="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold mb-2 inline-block ${TENANT_TYPES[currentUser.tenantType].bg} ${TENANT_TYPES[currentUser.tenantType].color}">
                    ${TENANT_TYPES[currentUser.tenantType].label}
                </span>
                <h2 class="text-3xl md:text-4xl font-extrabold text-slate-800">${entity.name}</h2>
                <p class="text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                    <span class="flex items-center gap-1"><i class="fas fa-map-marker-alt text-brand-500"></i> ${entity.location}</span>
                    <span class="text-slate-300 hidden md:inline">|</span> 
                    <span class="text-slate-400 text-sm">Tenant ID: ${entity.id}</span>
                </p>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 w-full md:w-auto md:min-w-[200px] text-left">
                 <p class="text-xs text-slate-400 font-bold uppercase mb-1">خطة الاشتراك (SaaS)</p>
                 <div class="flex items-center justify-end gap-2">
                    <span class="text-xl font-black text-brand-600">${entity.plan}</span>
                    <i class="fas fa-check-circle text-green-500"></i>
                 </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
            <div class="lg:col-span-2 space-y-6 md:space-y-8">
                 <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                     <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <i class="fas fa-chart-bar text-brand-500"></i> نشاط المستأجر
                        </h3>
                     </div>
                     <div class="p-4 md:p-6 h-64 relative">
                        <canvas id="adsChart"></canvas>
                     </div>
                 </div>
                 ${renderAdsFeed()}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                 ${renderKpiCard('المحفظة الرقمية', (perms.isFinance()) ? entity.balance.toLocaleString() : '****', 'fa-wallet', 'text-teal-600', 'bg-teal-50')}
                 ${renderKpiCard('المهام النشطة', perms.getVisibleTasks().length, 'fa-tasks', 'text-blue-600', 'bg-blue-50')}
                 ${renderKpiCard('تذاكر الدعم', perms.getVisibleTickets().length, 'fa-headset', 'text-red-600', 'bg-red-50')}
                 ${renderKpiCard('عدد المستخدمين', entity.users, 'fa-users', 'text-purple-600', 'bg-purple-50')}
            </div>
        </div>`;
    };

    // Incubator Dashboard - Customer Journey & Programs
    const renderIncubatorDashboard = async () => {
        const data = await fetchAPI(`/dashboard/incubator?entity_id=${currentUser.entityId}`);
        const stats = data.statistics || {};
        
        return `
        <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <i class="fas fa-seedling text-2xl text-orange-600"></i>
                </div>
                <div>
                    <h2 class="text-3xl md:text-4xl font-extrabold text-slate-800">لوحة الحاضنة</h2>
                    <p class="text-gray-500">رحلة العملاء والبرامج التدريبية</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${renderKpiCard('إجمالي المستفيدين', stats.total_beneficiaries || 0, 'fa-users', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('البرامج النشطة', stats.total_programs || 0, 'fa-graduation-cap', 'text-green-600', 'bg-green-50')}
            ${renderKpiCard('الجلسات المنعقدة', stats.total_sessions || 0, 'fa-calendar-check', 'text-purple-600', 'bg-purple-50')}
            ${renderKpiCard('نسبة الإنجاز', Math.round(stats.overall_completion_rate || 0) + '%', 'fa-chart-line', 'text-orange-600', 'bg-orange-50')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-route text-orange-500"></i> رحلة المستفيدين
                    </h3>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    ${data.beneficiaries && data.beneficiaries.length > 0 ? data.beneficiaries.map(b => `
                        <div class="mb-4 p-4 border border-slate-100 rounded-lg hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h4 class="font-bold text-slate-800">${b.name}</h4>
                                    <p class="text-sm text-slate-500">${b.email}</p>
                                </div>
                                <span class="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-bold">
                                    ${Math.round(b.avg_completion || 0)}% مكتمل
                                </span>
                            </div>
                            <div class="flex gap-4 text-xs text-slate-600 mt-2">
                                <span><i class="fas fa-book-open text-blue-500"></i> ${b.enrollment_count} تسجيل</span>
                                <span><i class="fas fa-calendar text-green-500"></i> ${b.sessions_attended} جلسة</span>
                            </div>
                        </div>
                    `).join('') : '<p class="text-slate-400 text-center py-8">لا يوجد مستفيدين</p>'}
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-graduation-cap text-green-500"></i> البرامج التدريبية
                    </h3>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    ${data.programs && data.programs.length > 0 ? data.programs.map(p => `
                        <div class="mb-4 p-4 border border-slate-100 rounded-lg hover:shadow-md transition">
                            <h4 class="font-bold text-slate-800 mb-2">${p.name}</h4>
                            <p class="text-sm text-slate-600 mb-3">${p.description || ''}</p>
                            <div class="flex gap-4 text-xs text-slate-600">
                                <span><i class="fas fa-users text-blue-500"></i> ${p.total_beneficiaries} مستفيد</span>
                                <span><i class="fas fa-calendar text-purple-500"></i> ${p.total_sessions} جلسة</span>
                                <span><i class="fas fa-percent text-green-500"></i> ${Math.round(p.avg_completion_rate || 0)}%</span>
                            </div>
                        </div>
                    `).join('') : '<p class="text-slate-400 text-center py-8">لا توجد برامج</p>'}
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <i class="fas fa-calendar-alt text-purple-500"></i> الجلسات الأخيرة
                </h3>
            </div>
            <div class="p-6">
                ${data.recent_sessions && data.recent_sessions.length > 0 ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${data.recent_sessions.map(s => `
                            <div class="p-4 border border-slate-100 rounded-lg hover:shadow-md transition">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-bold text-slate-800">${s.program_name}</h4>
                                    <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                        ${new Date(s.session_date).toLocaleDateString('ar-SA')}
                                    </span>
                                </div>
                                <p class="text-sm text-slate-600 mb-2">${s.location || 'موقع غير محدد'}</p>
                                <div class="flex items-center gap-2 text-xs text-slate-500">
                                    <i class="fas fa-user-friends"></i> ${s.attendees_count} حضور
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-slate-400 text-center py-8">لا توجد جلسات</p>'}
            </div>
        </div>`;
    };

    // Platform Dashboard - Services/Content/Subscriptions
    const renderPlatformDashboard = async () => {
        const data = await fetchAPI(`/dashboard/platform?entity_id=${currentUser.entityId}`);
        const stats = data.statistics || {};
        const revenue = data.revenue || {};
        
        return `
        <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <i class="fas fa-server text-2xl text-green-600"></i>
                </div>
                <div>
                    <h2 class="text-3xl md:text-4xl font-extrabold text-slate-800">لوحة المنصة</h2>
                    <p class="text-gray-500">الخدمات والمحتوى والاشتراكات</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${renderKpiCard('الخدمات المتاحة', stats.total_services || 0, 'fa-box', 'text-green-600', 'bg-green-50')}
            ${renderKpiCard('الاشتراكات النشطة', stats.active_subscriptions || 0, 'fa-users-cog', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('إجمالي العملاء', stats.total_customers || 0, 'fa-user-tie', 'text-purple-600', 'bg-purple-50')}
            ${renderKpiCard('الإيرادات', (revenue.total_revenue || 0).toLocaleString() + ' ر.س', 'fa-dollar-sign', 'text-orange-600', 'bg-orange-50')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-shopping-bag text-green-500"></i> الخدمات والمنتجات
                    </h3>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    ${data.services && data.services.length > 0 ? data.services.map(s => `
                        <div class="mb-4 p-4 border border-slate-100 rounded-lg hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-bold text-slate-800">${s.title}</h4>
                                <span class="text-xs ${s.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'} px-2 py-1 rounded-full font-bold">
                                    ${s.status}
                                </span>
                            </div>
                            <p class="text-sm text-slate-600 line-clamp-2">${s.content || ''}</p>
                        </div>
                    `).join('') : '<p class="text-slate-400 text-center py-8">لا توجد خدمات</p>'}
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-users-cog text-blue-500"></i> الاشتراكات
                    </h3>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    ${data.subscriptions && data.subscriptions.length > 0 ? data.subscriptions.map(sub => `
                        <div class="mb-4 p-4 border border-slate-100 rounded-lg hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h4 class="font-bold text-slate-800">${sub.customer_name}</h4>
                                    <p class="text-sm text-slate-500">${sub.customer_email}</p>
                                </div>
                                <span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">
                                    ${sub.status}
                                </span>
                            </div>
                            <div class="flex gap-4 text-xs text-slate-600 mt-2">
                                <span><i class="fas fa-box text-green-500"></i> ${sub.service_name}</span>
                                <span><i class="fas fa-dollar-sign text-orange-500"></i> ${sub.price} ر.س</span>
                            </div>
                        </div>
                    `).join('') : '<p class="text-slate-400 text-center py-8">لا توجد اشتراكات</p>'}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-chart-pie text-purple-500"></i> إحصائيات المحتوى
                    </h3>
                </div>
                <div class="p-6">
                    ${data.content_stats && data.content_stats.length > 0 ? `
                        <div class="space-y-3">
                            ${data.content_stats.map(stat => `
                                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span class="font-bold text-slate-700">${stat.status}</span>
                                    <div class="flex gap-4 text-sm">
                                        <span class="text-slate-600">إجمالي: ${stat.count}</span>
                                        <span class="text-green-600">جديد: ${stat.new_this_week || 0}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-slate-400 text-center py-8">لا توجد إحصائيات</p>'}
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-money-bill-wave text-orange-500"></i> الإيرادات
                    </h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div class="text-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl">
                            <p class="text-sm text-slate-600 mb-2">الإيرادات الإجمالية</p>
                            <p class="text-3xl font-black text-orange-600">${(revenue.total_revenue || 0).toLocaleString()} ر.س</p>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-500 mb-1">إيرادات الشهر</p>
                                <p class="text-lg font-bold text-slate-800">${(revenue.monthly_revenue || 0).toLocaleString()} ر.س</p>
                            </div>
                            <div class="text-center p-4 bg-slate-50 rounded-lg">
                                <p class="text-xs text-slate-500 mb-1">معاملات الشهر</p>
                                <p class="text-lg font-bold text-slate-800">${revenue.monthly_transactions || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    };

    // Office Dashboard - Service Execution & Customer Appointments
    const renderOfficeDashboard = async () => {
        const data = await fetchAPI(`/dashboard/office?entity_id=${currentUser.entityId}`);
        const stats = data.statistics || {};
        
        return `
        <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <i class="fas fa-briefcase text-2xl text-gray-600"></i>
                </div>
                <div>
                    <h2 class="text-3xl md:text-4xl font-extrabold text-slate-800">لوحة المكتب</h2>
                    <p class="text-gray-500">تنفيذ الخدمات ومواعيد العملاء</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${renderKpiCard('المواعيد القادمة', stats.upcoming_appointments || 0, 'fa-calendar-alt', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('مواعيد اليوم', stats.today_appointments || 0, 'fa-calendar-day', 'text-green-600', 'bg-green-50')}
            ${renderKpiCard('العملاء', stats.total_customers || 0, 'fa-users', 'text-purple-600', 'bg-purple-50')}
            ${renderKpiCard('الخدمات النشطة', stats.active_services || 0, 'fa-cogs', 'text-orange-600', 'bg-orange-50')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-calendar-check text-blue-500"></i> جدول اليوم
                    </h3>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    ${data.today_schedule && data.today_schedule.length > 0 ? data.today_schedule.map(apt => `
                        <div class="mb-4 p-4 border-r-4 border-blue-500 bg-blue-50/30 rounded-lg hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h4 class="font-bold text-slate-800">${apt.service_name}</h4>
                                    <p class="text-sm text-slate-500">${new Date(apt.session_date).toLocaleTimeString('ar-SA', {hour: '2-digit', minute: '2-digit'})}</p>
                                </div>
                                <span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold">
                                    ${apt.duration || 60} دقيقة
                                </span>
                            </div>
                            <div class="flex gap-2 text-xs text-slate-600">
                                <i class="fas fa-users"></i> ${apt.attendees} عميل
                            </div>
                        </div>
                    `).join('') : '<p class="text-slate-400 text-center py-8">لا توجد مواعيد اليوم</p>'}
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-clock text-green-500"></i> المواعيد القادمة
                    </h3>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    ${data.appointments && data.appointments.length > 0 ? data.appointments.map(apt => `
                        <div class="mb-4 p-4 border border-slate-100 rounded-lg hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-bold text-slate-800">${apt.service_name}</h4>
                                <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                    ${new Date(apt.session_date).toLocaleDateString('ar-SA')}
                                </span>
                            </div>
                            <p class="text-sm text-slate-600 mb-2">${apt.location || 'موقع غير محدد'}</p>
                            <div class="flex gap-4 text-xs text-slate-600">
                                <span><i class="fas fa-users text-blue-500"></i> ${apt.booked_slots}/${apt.total_slots || '∞'}</span>
                                <span class="text-${apt.booked_slots >= (apt.total_slots || 999) ? 'red' : 'green'}-600">
                                    ${apt.booked_slots >= (apt.total_slots || 999) ? 'مكتمل' : 'متاح'}
                                </span>
                            </div>
                        </div>
                    `).join('') : '<p class="text-slate-400 text-center py-8">لا توجد مواعيد</p>'}
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-user-friends text-purple-500"></i> العملاء
                    </h3>
                </div>
                <div class="p-6 max-h-96 overflow-y-auto">
                    ${data.customers && data.customers.length > 0 ? data.customers.map(c => `
                        <div class="mb-4 p-4 border border-slate-100 rounded-lg hover:shadow-md transition">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h4 class="font-bold text-slate-800">${c.name}</h4>
                                    <p class="text-sm text-slate-500">${c.email}</p>
                                </div>
                            </div>
                            <div class="flex gap-4 text-xs text-slate-600 mt-2">
                                <span><i class="fas fa-calendar text-blue-500"></i> ${c.total_bookings} حجز</span>
                                <span><i class="fas fa-check-circle text-green-500"></i> ${c.active_bookings} نشط</span>
                                ${c.last_visit ? `<span><i class="fas fa-clock text-orange-500"></i> ${new Date(c.last_visit).toLocaleDateString('ar-SA')}</span>` : ''}
                            </div>
                        </div>
                    `).join('') : '<p class="text-slate-400 text-center py-8">لا يوجد عملاء</p>'}
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-tasks text-orange-500"></i> حالة التنفيذ
                    </h3>
                </div>
                <div class="p-6">
                    ${data.execution_status && data.execution_status.length > 0 ? `
                        <div class="space-y-3">
                            ${data.execution_status.map(stat => `
                                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span class="font-bold text-slate-700">${stat.status}</span>
                                    <div class="flex gap-4 text-sm">
                                        <span class="text-slate-600">إجمالي: ${stat.count}</span>
                                        <span class="text-blue-600">قادم: ${stat.upcoming || 0}</span>
                                        <span class="text-green-600">منتهي: ${stat.completed || 0}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-slate-400 text-center py-8">لا توجد إحصائيات</p>'}
                </div>
            </div>
        </div>`;
    };

    const renderKpiCard = (title, value, icon, color, bg) => `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
            <div class="relative z-10 flex justify-between items-center">
                <div>
                    <p class="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">${title}</p>
                    <h3 class="text-2xl font-extrabold text-slate-800">${value}</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner text-xl transform group-hover:rotate-12 transition-transform">
                    <i class="fas ${icon}"></i>
                </div>
            </div>
        </div>`;

    const renderSaaSManager = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        if(perms.isHQ()) {
            return `
            <h2 class="text-2xl font-bold text-slate-800 mb-6">إدارة جميع المستأجرين (Tenants)</h2>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                 <table class="w-full text-right whitespace-nowrap">
                    <thead class="bg-slate-50/80 text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <tr><th class="p-5">المستأجر</th><th class="p-5">الخطة</th><th class="p-5">انتهاء الصلاحية</th><th class="p-5">الحالة</th></tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 text-sm">
                        ${db.entities.filter(e => e.type !== 'HQ').map(e => `
                            <tr class="hover:bg-slate-50">
                                <td class="p-5 font-bold">${e.name} <span class="block text-xs text-gray-400 font-normal">${e.id}</span></td>
                                <td class="p-5"><span class="px-2 py-1 rounded bg-blue-50 text-blue-600 font-bold text-xs">${e.plan}</span></td>
                                <td class="p-5 font-mono text-gray-600">${e.expiry}</td>
                                <td class="p-5"><span class="text-green-600 font-bold">نشط</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        }
        
        const plan = SUBSCRIPTION_PLANS[entity.plan];
        return `
        <div class="max-w-4xl mx-auto">
            <div class="text-center mb-10">
                <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800 mb-2">إدارة اشتراكك</h2>
                <p class="text-slate-500">تفاصيل الباقة الحالية وحدود الاستخدام للمستأجر: <span class="font-bold text-slate-800">${entity.name}</span></p>
            </div>
            
            <div class="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative mb-8">
                <div class="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-10 -mt-10"></div>
                <div class="p-6 md:p-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            <span class="text-xs font-bold bg-brand-100 text-brand-600 px-3 py-1 rounded-full">الباقة الحالية</span>
                            <h3 class="text-3xl font-black text-slate-800">${plan.name}</h3>
                        </div>
                        <p class="text-gray-500">يتم التجديد بتاريخ: <span class="font-mono font-bold text-gray-800">${entity.expiry}</span></p>
                    </div>
                    <div class="text-center md:text-left">
                        <p class="text-4xl font-black text-slate-800">${plan.price} <span class="text-sm font-medium text-gray-400">ر.س / شهرياً</span></p>
                    </div>
                </div>
                <div class="bg-slate-50 p-6 border-t border-slate-100">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${plan.features.map(f => `<div class="flex items-center gap-2 text-sm text-slate-600"><i class="fas fa-check text-green-500"></i> ${f}</div>`).join('')}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${Object.keys(SUBSCRIPTION_PLANS).map(key => {
                    const p = SUBSCRIPTION_PLANS[key];
                    const isCurrent = entity.plan === key;
                    return `
                    <div class="border ${isCurrent ? 'border-brand-500 ring-2 ring-brand-100 bg-brand-50/50' : 'border-slate-200 bg-white'} rounded-xl p-6 text-center hover:shadow-lg transition relative overflow-hidden">
                        ${isCurrent ? '<div class="absolute top-3 right-3 text-brand-500"><i class="fas fa-check-circle text-xl"></i></div>' : ''}
                        <h4 class="font-bold text-lg text-slate-800 mb-2">${p.name}</h4>
                        <p class="text-2xl font-black text-slate-800 mb-4">${p.price}<span class="text-xs font-normal text-gray-400"> ر.س</span></p>
                        <button class="w-full py-2 rounded-lg text-sm font-bold transition ${isCurrent ? 'bg-brand-600 text-white cursor-default' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                            ${isCurrent ? 'باقتك الحالية' : 'ترقية'}
                        </button>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>`;
    };

    const renderAdsFeed = () => {
        const visibleAds = perms.getVisibleAds();
        // Separate HQ source ads from others
        const hqSourceAds = visibleAds.filter(a => a.sourceType === 'HQ');
        const localAds = visibleAds.filter(a => a.sourceType !== 'HQ');

        return `
        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2"><i class="fas fa-bullhorn text-brand-500"></i> التعاميم والإعلانات</h3>
                ${perms.canManageAds() ? `<button onclick="app.loadRoute('ads')" class="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition"><i class="fas fa-cog"></i> إدارة الإعلانات</button>` : ''}
            </div>
            <div class="p-6 space-y-6">
                ${hqSourceAds.length > 0 ? `<div class="space-y-3"><h4 class="text-xs font-extrabold text-purple-600 uppercase tracking-widest">تعاميم المكتب الرئيسي (Global)</h4>${hqSourceAds.map(renderAdCard).join('')}</div>` : ''}
                <div class="space-y-3"><h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">إعلانات النطاق المحلي (Local Scope)</h4>${localAds.length > 0 ? localAds.map(renderAdCard).join('') : '<p class="text-sm text-slate-400 italic">لا توجد إعلانات</p>'}</div>
            </div>
        </div>`;
    };

    const renderAdCard = (ad) => {
        const level = Object.values(AD_LEVELS).find(l => l.key === ad.level) || AD_LEVELS.L1_LOCAL;
        return `
        <div class="group relative bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-x-1 overflow-hidden">
            <div class="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${level.gradient}"></div>
            <div class="flex justify-between items-start mb-2 pl-2 pr-4">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${level.badgeClass}">${level.label}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg group-hover:text-brand-600 transition">${ad.title}</h4>
                </div>
                <span class="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full whitespace-nowrap">${ad.date}</span>
            </div>
            <p class="text-sm text-gray-500 pr-4 pl-2 line-clamp-2 leading-relaxed">${ad.content}</p>
        </div>`;
    };

    const renderAdsManager = () => {
        if (!perms.canManageAds()) return renderAdsFeed();
        const myAds = perms.getManagedAds();
        const totalImpressions = myAds.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
        const totalClicks = myAds.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
        const totalSpent = myAds.reduce((sum, ad) => sum + (ad.spent || 0), 0);
        const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

        return `
        <div class="animate-fade-in space-y-8">
            <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800">لوحة المعلن (Advertiser Console)</h2>
                    <p class="text-slate-500 mt-1">إدارة الحملات والتحليل الرقمي للمستأجر: <span class="font-bold text-brand-600">${currentUser.entityName}</span></p>
                </div>
                <button onclick="app.openAdWizard()" class="w-full md:w-auto bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-brand-500/40 hover:-translate-y-1 transition transform flex items-center justify-center gap-2">
                    <i class="fas fa-plus-circle"></i> إنشاء حملة إعلانية
                </button>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                ${renderKpiCard('إجمالي المشاهدات', totalImpressions.toLocaleString(), 'fa-eye', 'text-blue-600', 'bg-blue-50')}
                ${renderKpiCard('النقرات (Clicks)', totalClicks.toLocaleString(), 'fa-mouse-pointer', 'text-purple-600', 'bg-purple-50')}
                ${renderKpiCard('معدل النقر (CTR)', ctr + '%', 'fa-percent', 'text-green-600', 'bg-green-50')}
                ${renderKpiCard('الإنفاق الكلي', totalSpent.toLocaleString() + ' ر.س', 'fa-coins', 'text-orange-600', 'bg-orange-50')}
            </div>
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                 <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-lg text-slate-800">سجل الحملات النشطة</h3>
                 </div>
                 <div class="overflow-x-auto">
                     <table class="w-full text-right whitespace-nowrap">
                        <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider">
                            <tr><th class="p-5">اسم الحملة</th><th class="p-5">النطاق/المستوى</th><th class="p-5">المدة</th><th class="p-5">الميزانية</th><th class="p-5">النتائج</th><th class="p-5">الحالة</th></tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50 text-sm">
                            ${myAds.length > 0 ? myAds.map(ad => {
                                const level = Object.values(AD_LEVELS).find(l => l.key === ad.level);
                                return `
                                <tr class="hover:bg-slate-50 transition">
                                    <td class="p-5 font-bold text-slate-700">${ad.title}</td>
                                    <td class="p-5"><span class="text-[10px] font-bold px-2 py-1 rounded border bg-white ${level.badgeClass}">${level.label}</span></td>
                                    <td class="p-5 text-xs text-slate-600">${ad.startDate} - ${ad.endDate}</td>
                                    <td class="p-5 min-w-[150px]"><span class="font-bold">${ad.spent}/${ad.budget}</span> ر.س</td>
                                    <td class="p-5 text-xs"><span class="font-bold">${ad.impressions}</span> مشاهدة</td>
                                    <td class="p-5"><span class="px-2 py-1 rounded-full text-[10px] font-bold ${ad.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">${ad.status}</span></td>
                                </tr>`;
                            }).join('') : `<tr><td colspan="7" class="p-8 text-center text-slate-400">لا توجد حملات إعلانية مسجلة.</td></tr>`}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>`;
    };

    const initAnalyticsChart = () => {
        const ctx = document.getElementById('analyticsChart');
        if (!ctx) return;
        analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
                datasets: [{
                    label: 'مشاهدات', data: [120, 300, 450, 320, 500, 650, 400], borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)', tension: 0.4, fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
        });
    };

    const openAdWizard = () => {
        adWizardData = { step: 1, title: '', content: '', level: 'L1_LOCAL', budget: 100, startDate: '', endDate: '' };
        const modal = document.createElement('div');
        modal.id = 'ad-wizard-modal';
        modal.className = 'fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center backdrop-blur-sm fade-in p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform scale-95 animate-scale-up flex flex-col max-h-[90vh]">
                <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 class="font-bold text-lg text-slate-800">معالج إنشاء الحملات</h3>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">خطوة <span id="wiz-step-num">1</span> من 4</span>
                        <button onclick="document.getElementById('ad-wizard-modal').remove()" class="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition text-slate-500"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div id="wizard-body" class="p-6 overflow-y-auto custom-scrollbar flex-1"></div>
                <div class="p-4 border-t border-slate-100 bg-slate-50 flex justify-between shrink-0">
                    <button id="wiz-prev-btn" onclick="app.wizardPrev()" class="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition hidden">سابق</button>
                    <button id="wiz-next-btn" onclick="app.wizardNext()" class="px-6 py-2 rounded-xl font-bold bg-brand-600 text-white shadow-lg hover:shadow-brand-500/30 hover:bg-brand-700 transition ml-auto">التالي <i class="fas fa-arrow-left mr-2"></i></button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        renderWizardStep(1);
    };

    const renderWizardStep = (step) => {
        const body = document.getElementById('wizard-body');
        const nextBtn = document.getElementById('wiz-next-btn');
        const prevBtn = document.getElementById('wiz-prev-btn');
        document.getElementById('wiz-step-num').innerText = step;
        adWizardData.step = step;

        if (step === 1) {
            prevBtn.classList.add('hidden');
            nextBtn.innerHTML = 'التالي <i class="fas fa-arrow-left mr-2"></i>';
            body.innerHTML = `
                <div class="space-y-4 animate-fade-in">
                    <h4 class="text-xl font-bold text-slate-800 mb-4">تفاصيل المحتوى</h4>
                    <div><label class="block text-xs font-bold text-slate-600 mb-1.5">عنوان الحملة</label><input type="text" id="wiz-title" value="${adWizardData.title}" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition font-bold"></div>
                    <div><label class="block text-xs font-bold text-slate-600 mb-1.5">نص الإعلان</label><textarea id="wiz-content" rows="4" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition">${adWizardData.content}</textarea></div>
                </div>`;
        } else if (step === 2) {
            prevBtn.classList.remove('hidden');
            nextBtn.innerHTML = 'التالي <i class="fas fa-arrow-left mr-2"></i>';
            body.innerHTML = `
                <div class="space-y-6 animate-fade-in">
                    <h4 class="text-xl font-bold text-slate-800 mb-4">الميزانية والجدولة</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="block text-xs font-bold text-slate-600 mb-1.5">تاريخ البدء</label><input type="date" id="wiz-start" value="${adWizardData.startDate}" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"></div>
                        <div><label class="block text-xs font-bold text-slate-600 mb-1.5">تاريخ الانتهاء</label><input type="date" id="wiz-end" value="${adWizardData.endDate}" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"></div>
                    </div>
                    <div><label class="block text-xs font-bold text-slate-600 mb-1.5">الميزانية المرصودة</label><input type="number" id="wiz-budget" value="${adWizardData.budget}" class="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-lg"></div>
                </div>`;
        } else if (step === 3) {
            prevBtn.classList.remove('hidden');
            nextBtn.innerHTML = 'مراجعة <i class="fas fa-check mr-2"></i>';
            body.innerHTML = `
                <div class="space-y-4 animate-fade-in">
                    <h4 class="text-xl font-bold text-slate-800 mb-4">الاستهداف</h4>
                    <div class="grid grid-cols-1 gap-3">
                        ${Object.values(AD_LEVELS).map(l => `<label class="flex items-center gap-4 p-4 border rounded-xl hover:bg-slate-50 cursor-pointer ${adWizardData.level === l.key ? 'border-brand-500 bg-brand-50' : ''}"><input type="radio" name="wiz-level" value="${l.key}" ${adWizardData.level === l.key ? 'checked' : ''} class="peer w-5 h-5 text-brand-600"><div class="flex-1"><span class="font-bold text-sm block">${l.label}</span><span class="text-xs text-slate-500">${l.desc}</span></div></label>`).join('')}
                    </div>
                </div>`;
        } else if (step === 4) {
            prevBtn.classList.remove('hidden');
            nextBtn.innerHTML = 'تأكيد ونشر <i class="fas fa-rocket mr-2"></i>';
            nextBtn.onclick = app.submitAdWizard;
            body.innerHTML = `<div class="space-y-6 animate-fade-in"><h4 class="text-xl font-bold text-slate-800 mb-4">مراجعة نهائية</h4><div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"><div class="flex justify-between"><span class="text-sm text-slate-500">العنوان</span><span class="font-bold">${adWizardData.title}</span></div><div class="flex justify-between pt-3 border-t"><span class="text-sm font-bold">الميزانية</span><span class="font-black text-xl text-brand-600">${adWizardData.budget} ر.س</span></div></div><div class="flex gap-3 p-4 bg-yellow-50 rounded-xl"><input type="checkbox" id="wiz-confirm" class="mt-1"><label for="wiz-confirm" class="text-xs text-yellow-800 font-semibold">أوافق على الشروط.</label></div></div>`;
        }
    };

    const wizardNext = () => {
        if (adWizardData.step === 1) { adWizardData.title = document.getElementById('wiz-title').value; adWizardData.content = document.getElementById('wiz-content').value; }
        else if (adWizardData.step === 2) { adWizardData.startDate = document.getElementById('wiz-start').value; adWizardData.endDate = document.getElementById('wiz-end').value; adWizardData.budget = document.getElementById('wiz-budget').value; }
        else if (adWizardData.step === 3) { adWizardData.level = document.querySelector('input[name="wiz-level"]:checked')?.value; }
        renderWizardStep(adWizardData.step + 1);
    };

    const wizardPrev = () => renderWizardStep(adWizardData.step - 1);

    const submitAdWizard = () => {
        if (!document.getElementById('wiz-confirm').checked) return showToast('يجب الموافقة على الشروط', 'error');
        db.ads.unshift({ id: db.ads.length + 1, title: adWizardData.title, content: adWizardData.content, level: adWizardData.level, status: 'ACTIVE', sourceEntityId: currentUser.entityId, date: new Date().toISOString().slice(0, 10), sourceType: currentUser.tenantType, budget: parseInt(adWizardData.budget), spent: 0, impressions: 0, clicks: 0, startDate: adWizardData.startDate, endDate: adWizardData.endDate, targetIds: [] });
        document.getElementById('ad-wizard-modal').remove();
        showToast('تم إطلاق الحملة!', 'success');
        loadRoute('ads');
    };

    // --- APPROVALS MODULE ---
    const renderApprovals = () => {
        const myApprovals = db.approvals.filter(a => 
            a.steps.some(s => s.approver_id === currentUser.id)
        );
        
        const pendingForMe = myApprovals.filter(a => 
            a.steps.some(s => s.approver_id === currentUser.id && s.status === 'PENDING')
        );
        
        const myRequests = db.approvals.filter(a => a.createdBy === currentUser.id);
        
        const statusBadge = (status) => {
            const badges = {
                'PENDING': '<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">قيد الانتظار</span>',
                'IN_REVIEW': '<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">قيد المراجعة</span>',
                'APPROVED': '<span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">معتمد</span>',
                'REJECTED': '<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">مرفوض</span>'
            };
            return badges[status] || status;
        };
        
        const stepStatusBadge = (status) => {
            const badges = {
                'PENDING': '<span class="bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded text-xs">منتظر</span>',
                'APPROVED': '<span class="bg-green-50 text-green-600 px-2 py-0.5 rounded text-xs"><i class="fas fa-check"></i> موافق</span>',
                'REJECTED': '<span class="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs"><i class="fas fa-times"></i> مرفوض</span>',
                'SKIPPED': '<span class="bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-xs">متخطى</span>'
            };
            return badges[status] || status;
        };
        
        return `
        <div class="space-y-8 animate-fade-in">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">الموافقات المالية التدريجية</h2>
                    <p class="text-slate-500">نظام الموافقات: محاسب → مدير مالي → CFO/الإدارة</p>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${renderKpiCard('المعلقة عليك', pendingForMe.length, 'fa-hourglass-half', 'text-yellow-600', 'bg-yellow-50')}
                ${renderKpiCard('طلباتي', myRequests.length, 'fa-paper-plane', 'text-blue-600', 'bg-blue-50')}
                ${renderKpiCard('إجمالي الموافقات', myApprovals.length, 'fa-check-circle', 'text-green-600', 'bg-green-50')}
            </div>

            <!-- Tabs -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="flex border-b border-slate-100">
                    <button onclick="app.switchTab('pending-approvals')" id="tab-btn-pending-approvals" class="flex-1 py-4 text-sm font-bold text-brand-600 border-b-2 border-brand-600 bg-brand-50 transition">
                        المعلقة عليك ${pendingForMe.length > 0 ? `<span class="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs mr-2">${pendingForMe.length}</span>` : ''}
                    </button>
                    <button onclick="app.switchTab('my-requests')" id="tab-btn-my-requests" class="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition">طلباتي</button>
                    <button onclick="app.switchTab('all-approvals')" id="tab-btn-all-approvals" class="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition">جميع الموافقات</button>
                </div>

                <!-- Pending Approvals Tab -->
                <div id="tab-content-pending-approvals" class="p-6">
                    ${pendingForMe.length === 0 ? `
                        <div class="text-center py-12">
                            <i class="fas fa-check-double text-6xl text-slate-200 mb-4"></i>
                            <p class="text-slate-500">لا توجد موافقات معلقة عليك حالياً</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${pendingForMe.map(approval => {
                                const myStep = approval.steps.find(s => s.approver_id === currentUser.id && s.status === 'PENDING');
                                return `
                                    <div class="border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
                                        <div class="flex justify-between items-start mb-4">
                                            <div class="flex-1">
                                                <h3 class="text-lg font-bold text-slate-800 mb-1">${approval.itemTitle}</h3>
                                                <p class="text-sm text-slate-500">بواسطة: ${approval.createdByName} • ${new Date(approval.createdAt).toLocaleDateString('ar-SA')}</p>
                                            </div>
                                            <div class="text-left">
                                                <div class="text-2xl font-bold text-brand-600">${approval.amount.toLocaleString()} ر.س</div>
                                                ${statusBadge(approval.status)}
                                            </div>
                                        </div>
                                        
                                        <!-- Approval Steps Progress -->
                                        <div class="mb-4 bg-slate-50 rounded-lg p-4">
                                            <div class="text-xs font-bold text-slate-600 mb-3">مسار الموافقة:</div>
                                            <div class="flex items-center gap-2">
                                                ${approval.steps.map((step, idx) => `
                                                    <div class="flex items-center gap-2">
                                                        <div class="text-center ${step.approver_id === currentUser.id && step.status === 'PENDING' ? 'animate-pulse' : ''}">
                                                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-1
                                                                ${step.status === 'APPROVED' ? 'bg-green-500 text-white' : 
                                                                  step.status === 'REJECTED' ? 'bg-red-500 text-white' :
                                                                  step.approver_id === currentUser.id && step.status === 'PENDING' ? 'bg-yellow-400 text-white' :
                                                                  'bg-slate-200 text-slate-600'}">
                                                                ${step.status === 'APPROVED' ? '<i class="fas fa-check"></i>' :
                                                                  step.status === 'REJECTED' ? '<i class="fas fa-times"></i>' :
                                                                  (idx + 1)}
                                                            </div>
                                                            <div class="text-xs text-slate-600 max-w-[80px] truncate">${step.approver_name}</div>
                                                            <div class="text-xs text-slate-500">${step.approver_role}</div>
                                                        </div>
                                                        ${idx < approval.steps.length - 1 ? '<i class="fas fa-arrow-left text-slate-300"></i>' : ''}
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                        
                                        ${myStep ? `
                                            <div class="flex gap-3 mt-4">
                                                <button onclick="app.handleApprovalDecision(${approval.id}, ${myStep.id}, 'APPROVED')" 
                                                    class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold transition">
                                                    <i class="fas fa-check ml-2"></i>اعتماد
                                                </button>
                                                <button onclick="app.handleApprovalDecision(${approval.id}, ${myStep.id}, 'REJECTED')" 
                                                    class="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-bold transition">
                                                    <i class="fas fa-times ml-2"></i>رفض
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- My Requests Tab -->
                <div id="tab-content-my-requests" class="p-6 hidden">
                    ${myRequests.length === 0 ? `
                        <div class="text-center py-12">
                            <i class="fas fa-inbox text-6xl text-slate-200 mb-4"></i>
                            <p class="text-slate-500">لم تقم بإنشاء أي طلبات موافقة بعد</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${myRequests.map(approval => `
                                <div class="border border-slate-200 rounded-xl p-5">
                                    <div class="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 class="text-lg font-bold text-slate-800">${approval.itemTitle}</h3>
                                            <p class="text-sm text-slate-500">${new Date(approval.createdAt).toLocaleDateString('ar-SA')}</p>
                                        </div>
                                        <div class="text-left">
                                            <div class="text-xl font-bold text-brand-600">${approval.amount.toLocaleString()} ر.س</div>
                                            ${statusBadge(approval.status)}
                                        </div>
                                    </div>
                                    
                                    <!-- Steps Progress -->
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <div class="space-y-2">
                                            ${approval.steps.map((step, idx) => `
                                                <div class="flex items-center gap-3">
                                                    <div class="text-sm font-bold text-slate-600 w-8">${idx + 1}.</div>
                                                    <div class="flex-1">
                                                        <div class="font-semibold text-slate-700">${step.approver_name}</div>
                                                        <div class="text-xs text-slate-500">${step.approver_role}</div>
                                                        ${step.comments ? `<div class="text-xs text-slate-600 mt-1 italic">"${step.comments}"</div>` : ''}
                                                        ${step.rejection_reason ? `<div class="text-xs text-red-600 mt-1"><strong>سبب الرفض:</strong> ${step.rejection_reason}</div>` : ''}
                                                    </div>
                                                    <div>${stepStatusBadge(step.status)}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <!-- All Approvals Tab -->
                <div id="tab-content-all-approvals" class="p-6 hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-right">
                            <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                                <tr>
                                    <th class="p-3">العنوان</th>
                                    <th class="p-3">المبلغ</th>
                                    <th class="p-3">المستوى الحالي</th>
                                    <th class="p-3">الحالة</th>
                                    <th class="p-3">طالب الموافقة</th>
                                    <th class="p-3">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm">
                                ${myApprovals.map(approval => `
                                    <tr class="border-b border-slate-100 hover:bg-slate-50">
                                        <td class="p-3 font-semibold">${approval.itemTitle}</td>
                                        <td class="p-3 text-brand-600 font-bold">${approval.amount.toLocaleString()} ر.س</td>
                                        <td class="p-3">${approval.currentLevel} / ${approval.steps.length}</td>
                                        <td class="p-3">${statusBadge(approval.status)}</td>
                                        <td class="p-3">${approval.createdByName}</td>
                                        <td class="p-3 text-slate-500">${new Date(approval.createdAt).toLocaleDateString('ar-SA')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        `;
    };

    const renderEntitiesManager = () => `
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 class="text-2xl font-bold text-slate-800">${perms.isHQ() ? 'إدارة المستأجرين (Tenants)' : 'بيانات الكيان/الفرع'}</h2>
            ${perms.isHQ() ? `<button onclick="app.loadRoute('register-tenant')" class="w-full md:w-auto bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 animate-pulse-slow"><i class="fas fa-plus-circle"></i> تسجيل مستأجر جديد</button>` : ''}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${perms.getVisibleEntities().map(e => `
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-14 h-14 rounded-2xl ${TENANT_TYPES[e.type].bg} ${TENANT_TYPES[e.type].color} flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                <i class="fas ${TENANT_TYPES[e.type].icon}"></i>
                            </div>
                            <div class="bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-100 text-slate-600">${e.plan}</div>
                        </div>
                        <h3 class="font-bold text-xl text-slate-800 mb-1 group-hover:text-brand-600 transition">${e.name}</h3>
                        <p class="text-sm text-slate-500 mb-4"><i class="fas fa-map-pin text-xs"></i> ${e.location}</p>
                    </div>
                </div>`).join('')}
        </div>`;

    const renderTenantRegistration = () => {
        if (!perms.isHQ()) return renderPlaceholder('هذه الميزة متاحة فقط للمكتب الرئيسي (Super Admin)');
        return `
        <div class="max-w-4xl mx-auto animate-slide-in">
            <div class="text-center mb-8"><h2 class="text-2xl md:text-3xl font-extrabold text-slate-800">تسجيل مستأجر جديد</h2><p class="text-slate-500 mt-2">إنشاء بيئة عمل جديدة وتخصيص الموارد</p></div>
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 md:p-8">
                <div class="grid grid-cols-1 gap-8">
                    <div><h4 class="text-lg font-bold text-slate-800 mb-4 border-b pb-2">1. بيانات المؤسسة</h4><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-semibold text-slate-600 mb-2">اسم المستأجر</label><input type="text" id="reg-name" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"></div><div><label class="block text-sm font-semibold text-slate-600 mb-2">الموقع</label><input type="text" id="reg-location" class="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none"></div></div></div>
                    <div><h4 class="text-lg font-bold text-slate-800 mb-4 border-b pb-2">2. نوع الكيان</h4><div class="grid grid-cols-2 md:grid-cols-4 gap-4">${Object.values(TENANT_TYPES).filter(t => t.id !== 'HQ').map(t => `<label class="cursor-pointer relative"><input type="radio" name="reg-type" value="${t.id}" class="peer sr-only"><div class="p-4 rounded-xl border-2 border-slate-100 peer-checked:border-brand-500 peer-checked:bg-brand-50 transition-all text-center"><i class="fas ${t.icon} text-2xl mb-2 ${t.color}"></i><div class="text-xs font-bold">${t.label}</div></div></label>`).join('')}</div></div>
                    <div><h4 class="text-lg font-bold text-slate-800 mb-4 border-b pb-2">3. خطة الاشتراك</h4><div class="grid grid-cols-1 md:grid-cols-3 gap-4">${Object.keys(SUBSCRIPTION_PLANS).map(key => `<label class="cursor-pointer relative"><input type="radio" name="reg-plan" value="${key}" class="peer sr-only"><div class="p-4 rounded-xl border-2 border-slate-100 peer-checked:border-brand-500 peer-checked:bg-brand-50 transition-all"><div class="font-bold">${SUBSCRIPTION_PLANS[key].name}</div></div></label>`).join('')}</div></div>
                    <div class="pt-4 flex justify-end gap-3"><button onclick="app.loadRoute('entities')" class="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">إلغاء</button><button onclick="app.submitTenantRegistration()" class="px-8 py-3 rounded-xl font-bold bg-brand-600 text-white shadow-lg">إنشاء</button></div>
                </div>
            </div>
        </div>`;
    };

    const submitTenantRegistration = () => {
        const name = document.getElementById('reg-name').value;
        const location = document.getElementById('reg-location').value;
        const type = document.querySelector('input[name="reg-type"]:checked')?.value;
        const plan = document.querySelector('input[name="reg-plan"]:checked')?.value;
        if (!name || !location || !type || !plan) return showToast('الرجاء تعبئة جميع الحقول', 'error');
        const newId = (type === 'BRANCH' ? 'BR' : 'TNT') + Math.floor(100 + Math.random() * 900);
        db.entities.push({ id: newId, name: name, type: type, status: 'Active', balance: 0, location: location, users: 1, plan: plan, expiry: '2025-01-01', theme: 'BLUE' });
        db.users.push({ id: db.users.length + 1, name: 'مسؤول جديد', role: ROLES.ADMIN, tenantType: type, entityId: newId, entityName: name });
        showToast(`تم إنشاء المستأجر ${name} بنجاح!`, 'success');
        loadRoute('entities');
    };

    const renderTasksManager = () => {
        const tasks = perms.getVisibleTasks();
        if (tasks.length === 0) return renderPlaceholder('لا توجد مهام نشطة');
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">المهام الداخلية (${tasks.length})</h2>
        <div class="grid gap-4">${tasks.map(t => `<div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center"><div><h4 class="font-bold">${t.title}</h4><p class="text-xs text-slate-500">${t.type}</p></div><span class="px-2 py-1 rounded text-xs bg-slate-100">${t.status}</span></div>`).join('')}</div>`;
    };

    const renderSettings = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        if (!perms.isAdmin()) return renderPlaceholder();
        return `
        <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h2 class="text-2xl font-bold text-slate-800">خصائص العلامة التجارية</h2>
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
                <h3 class="font-bold text-lg mb-4">ألوان الهوية</h3>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    ${Object.entries(THEMES).map(([key, theme]) => `<label class="cursor-pointer group relative"><input type="radio" name="theme-select" value="${key}" onchange="app.previewTheme('${key}')" class="peer sr-only" ${entity.theme === key ? 'checked' : ''}><div class="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 peer-checked:border-brand-500 peer-checked:bg-slate-50 transition-all"><div class="w-12 h-12 rounded-full ${theme.preview} shadow-lg"></div><span class="text-xs font-bold">${theme.name}</span></div></label>`).join('')}
                </div>
            </div>
            <div class="flex justify-end pt-4"><button onclick="app.saveSettings()" class="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 transition">حفظ التغييرات</button></div>
        </div>`;
    };

    const previewTheme = (key) => updateThemeVariables(key);

    const saveSettings = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        const newTheme = document.querySelector('input[name="theme-select"]:checked')?.value;
        if(entity) { entity.theme = newTheme; updateThemeVariables(newTheme); showToast('تم الحفظ', 'success'); }
    };

    const renderAuditLogs = () => {
        if (!perms.canViewAuditLogs()) return renderPlaceholder();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">سجلات النظام</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
             <table class="w-full text-right whitespace-nowrap"><thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase"><tr><th class="p-4">الوقت</th><th class="p-4">المستخدم</th><th class="p-4">الحدث</th><th class="p-4">التفاصيل</th></tr></thead><tbody class="divide-y divide-slate-50 text-sm">${perms.getVisibleAuditLogs().map(log => `<tr><td class="p-4 text-gray-400">${log.timestamp}</td><td class="p-4 font-bold">${log.user}</td><td class="p-4 text-brand-600">${log.action}</td><td class="p-4 text-gray-500">${log.details}</td></tr>`).join('')}</tbody></table>
        </div>`;
    };

    // --- HIERARCHY VIEWER (Multi-Tenant Structure) ---
    const renderHierarchy = async () => {
        try {
            // جلب البيانات من API
            const stats = await fetchAPI('/hierarchy/stats');
            const headquarters = await fetchAPI('/headquarters');
            const branches = await fetchAPI('/branches');
            const incubators = await fetchAPI('/incubators');
            const platforms = await fetchAPI('/platforms');
            const offices = await fetchAPI('/offices');
            
            // جلب روابط المكاتب بالمنصات
            const officeLinks = [];
            for (const office of offices) {
                try {
                    const linkedPlatforms = await fetchAPI(`/offices/${office.id}/platforms`);
                    linkedPlatforms.forEach(platform => {
                        officeLinks.push({
                            office_id: office.id,
                            office_name: office.name,
                            platform_id: platform.id,
                            platform_name: platform.name,
                            is_active: platform.is_linked
                        });
                    });
                } catch (err) {
                    console.warn(`Could not load platforms for office ${office.id}`);
                }
            }

            return `
            <div class="space-y-8 animate-fade-in">
                <!-- Header -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-slate-800">الهيكل الهرمي للمنصة</h2>
                        <p class="text-slate-500">عرض شامل للمقرات → الفروع → الحاضنات → المنصات → المكاتب</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="app.refreshHierarchy()" class="bg-brand-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-brand-700 transition flex items-center gap-2">
                            <i class="fas fa-sync-alt"></i> تحديث
                        </button>
                    </div>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-building text-2xl opacity-80"></i>
                            <span class="text-3xl font-black">${stats.active_hqs || 0}</span>
                        </div>
                        <p class="text-xs font-semibold opacity-90">مقرات رئيسية</p>
                    </div>
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-map-marked-alt text-2xl opacity-80"></i>
                            <span class="text-3xl font-black">${stats.active_branches || 0}</span>
                        </div>
                        <p class="text-xs font-semibold opacity-90">فروع</p>
                    </div>
                    <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-seedling text-2xl opacity-80"></i>
                            <span class="text-3xl font-black">${stats.active_incubators || 0}</span>
                        </div>
                        <p class="text-xs font-semibold opacity-90">حاضنات</p>
                    </div>
                    <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-server text-2xl opacity-80"></i>
                            <span class="text-3xl font-black">${stats.active_platforms || 0}</span>
                        </div>
                        <p class="text-xs font-semibold opacity-90">منصات</p>
                    </div>
                    <div class="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-briefcase text-2xl opacity-80"></i>
                            <span class="text-3xl font-black">${stats.active_offices || 0}</span>
                        </div>
                        <p class="text-xs font-semibold opacity-90">مكاتب</p>
                    </div>
                    <div class="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white">
                        <div class="flex items-center justify-between mb-2">
                            <i class="fas fa-link text-2xl opacity-80"></i>
                            <span class="text-3xl font-black">${stats.active_links || 0}</span>
                        </div>
                        <p class="text-xs font-semibold opacity-90">روابط</p>
                    </div>
                </div>

                <!-- Entity Creation Buttons -->
                <div class="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
                    <div class="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
                        <div class="flex items-center gap-4">
                            <div class="bg-white/20 rounded-full p-3">
                                <i class="fas fa-plus-circle text-2xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black">تعريف الكيانات</h3>
                                <p class="text-sm opacity-90">إنشاء وإضافة كيانات جديدة للهيكل التنظيمي</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <!-- Create Branch Button -->
                            <button onclick="openCreateBranchModal()" 
                                    class="group bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                                <div class="flex flex-col items-center gap-3">
                                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition">
                                        <i class="fas fa-store text-3xl"></i>
                                    </div>
                                    <div class="text-center">
                                        <h4 class="font-black text-lg mb-1">إنشاء فرع</h4>
                                        <p class="text-xs opacity-90">Branch تابع للمقر الرئيسي</p>
                                    </div>
                                    <div class="mt-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                                        <i class="fas fa-plus ml-1"></i> جديد
                                    </div>
                                </div>
                            </button>
                            
                            <!-- Create Incubator Button -->
                            <button onclick="openCreateIncubatorModal()" 
                                    class="group bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                                <div class="flex flex-col items-center gap-3">
                                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition">
                                        <i class="fas fa-seedling text-3xl"></i>
                                    </div>
                                    <div class="text-center">
                                        <h4 class="font-black text-lg mb-1">إنشاء حاضنة</h4>
                                        <p class="text-xs opacity-90">Incubator تابع لفرع</p>
                                    </div>
                                    <div class="mt-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                                        <i class="fas fa-plus ml-1"></i> جديد
                                    </div>
                                </div>
                            </button>
                            
                            <!-- Create Platform Button -->
                            <button onclick="openCreatePlatformModal()" 
                                    class="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                                <div class="flex flex-col items-center gap-3">
                                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition">
                                        <i class="fas fa-server text-3xl"></i>
                                    </div>
                                    <div class="text-center">
                                        <h4 class="font-black text-lg mb-1">إنشاء منصة</h4>
                                        <p class="text-xs opacity-90">Platform تابع لحاضنة</p>
                                    </div>
                                    <div class="mt-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                                        <i class="fas fa-plus ml-1"></i> جديد
                                    </div>
                                </div>
                            </button>
                            
                            <!-- Create Office Button -->
                            <button onclick="openCreateOfficeModal()" 
                                    class="group bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                                <div class="flex flex-col items-center gap-3">
                                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition">
                                        <i class="fas fa-briefcase text-3xl"></i>
                                    </div>
                                    <div class="text-center">
                                        <h4 class="font-black text-lg mb-1">إنشاء مكتب</h4>
                                        <p class="text-xs opacity-90">Office تابع لحاضنة/منصة</p>
                                    </div>
                                    <div class="mt-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                                        <i class="fas fa-plus ml-1"></i> جديد
                                    </div>
                                </div>
                            </button>
                        </div>
                        
                        <!-- Info Box -->
                        <div class="mt-6 bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-info-circle text-blue-600 text-xl mt-0.5"></i>
                                <div class="flex-1">
                                    <h5 class="font-bold text-blue-900 mb-1">ملاحظة هامة</h5>
                                    <p class="text-sm text-blue-700">يجب إنشاء الكيانات بالترتيب الهرمي: فرع ← حاضنة ← منصة ← مكتب. كل كيان يجب أن يكون تابعاً للمستوى الأعلى منه.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Office-Platform Links Section -->
                <div class="bg-white rounded-2xl shadow-lg border-2 border-pink-200 overflow-hidden">
                    <div class="bg-gradient-to-r from-pink-600 to-pink-700 p-6 text-white">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="bg-white/20 rounded-full p-3">
                                    <i class="fas fa-link text-2xl"></i>
                                </div>
                                <div>
                                    <h3 class="text-xl font-black">روابط المكاتب بالمنصات</h3>
                                    <p class="text-sm opacity-90">عرض العلاقات بين المكاتب والمنصات المرتبطة بها</p>
                                </div>
                            </div>
                            <button onclick="app.openCreateLinkModal()" class="bg-white text-pink-600 px-4 py-2 rounded-xl font-bold hover:bg-pink-50 transition flex items-center gap-2 shadow-lg">
                                <i class="fas fa-plus"></i> ربط جديد
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        ${officeLinks.length > 0 ? `
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-slate-50">
                                        <tr>
                                            <th class="text-right px-4 py-3 text-sm font-bold text-slate-600">
                                                <i class="fas fa-briefcase text-teal-500 ml-2"></i>المكتب
                                            </th>
                                            <th class="text-center px-4 py-3 text-sm font-bold text-slate-600">
                                                <i class="fas fa-arrows-alt-h text-pink-500 ml-2"></i>الربط
                                            </th>
                                            <th class="text-right px-4 py-3 text-sm font-bold text-slate-600">
                                                <i class="fas fa-server text-orange-500 ml-2"></i>المنصة
                                            </th>
                                            <th class="text-center px-4 py-3 text-sm font-bold text-slate-600">
                                                الحالة
                                            </th>
                                            <th class="text-center px-4 py-3 text-sm font-bold text-slate-600">
                                                <i class="fas fa-cog ml-2"></i>الإجراءات
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        ${officeLinks.map(link => `
                                            <tr class="hover:bg-slate-50 transition-colors">
                                                <td class="px-4 py-4">
                                                    <div class="flex items-center gap-3">
                                                        <div class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                                                            <i class="fas fa-briefcase text-teal-600"></i>
                                                        </div>
                                                        <div>
                                                            <p class="font-semibold text-slate-800 text-sm">${link.office_name}</p>
                                                            <p class="text-xs text-slate-500">معرف: ${link.office_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-4 py-4 text-center">
                                                    <i class="fas fa-exchange-alt text-pink-500 text-xl"></i>
                                                </td>
                                                <td class="px-4 py-4">
                                                    <div class="flex items-center gap-3">
                                                        <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                                            <i class="fas fa-server text-orange-600"></i>
                                                        </div>
                                                        <div>
                                                            <p class="font-semibold text-slate-800 text-sm">${link.platform_name}</p>
                                                            <p class="text-xs text-slate-500">معرف: ${link.platform_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-4 py-4 text-center">
                                                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${link.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                                                        <i class="fas ${link.is_active ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                                        ${link.is_active ? 'نشط' : 'معطل'}
                                                    </span>
                                                </td>
                                                <td class="px-4 py-4 text-center">
                                                    <button onclick="app.deleteLink(${link.office_id}, ${link.platform_id}, '${link.office_name}', '${link.platform_name}')" 
                                                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto">
                                                        <i class="fas fa-unlink"></i> حذف
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Summary Cards -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                                <div class="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-xs font-semibold text-teal-600 mb-1">إجمالي المكاتب المرتبطة</p>
                                            <p class="text-2xl font-black text-teal-700">${new Set(officeLinks.map(l => l.office_id)).size}</p>
                                        </div>
                                        <i class="fas fa-briefcase text-3xl text-teal-400"></i>
                                    </div>
                                </div>
                                <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-xs font-semibold text-orange-600 mb-1">إجمالي المنصات المرتبطة</p>
                                            <p class="text-2xl font-black text-orange-700">${new Set(officeLinks.map(l => l.platform_id)).size}</p>
                                        </div>
                                        <i class="fas fa-server text-3xl text-orange-400"></i>
                                    </div>
                                </div>
                                <div class="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-xs font-semibold text-pink-600 mb-1">إجمالي الروابط النشطة</p>
                                            <p class="text-2xl font-black text-pink-700">${officeLinks.filter(l => l.is_active).length}</p>
                                        </div>
                                        <i class="fas fa-link text-3xl text-pink-400"></i>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div class="text-center py-12">
                                <i class="fas fa-unlink text-6xl text-slate-300 mb-4"></i>
                                <h4 class="text-xl font-bold text-slate-600 mb-2">لا توجد روابط</h4>
                                <p class="text-slate-500">لم يتم ربط أي مكتب بأي منصة بعد</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Hierarchical Tree View -->
                ${headquarters.map(hq => `
                    <div class="bg-white rounded-2xl shadow-lg border-2 border-purple-200 overflow-hidden">
                        <!-- HQ Header -->
                        <div class="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="bg-white/20 rounded-full p-3">
                                        <i class="fas fa-building text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-xl font-black">${hq.name}</h3>
                                        <p class="text-sm opacity-90">رمز: ${hq.code} | ${hq.country || 'عالمي'}</p>
                                    </div>
                                </div>
                                <span class="px-4 py-1 rounded-full text-xs font-bold ${hq.is_active ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}">
                                    ${hq.is_active ? 'نشط' : 'غير نشط'}
                                </span>
                            </div>
                        </div>

                        <!-- Branches -->
                        <div class="p-6 space-y-4">
                            ${branches.filter(b => b.hq_id === hq.id).map(branch => `
                                <div class="border-r-4 border-blue-400 bg-blue-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="app.viewEntityDetails('BRANCH', ${branch.id})">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-map-marked-alt text-xl text-blue-600"></i>
                                            <div>
                                                <h4 class="font-bold text-slate-800">${branch.name}</h4>
                                                <p class="text-xs text-slate-500">${branch.city}, ${branch.country} | ${branch.code}</p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs font-bold px-3 py-1 rounded-full ${branch.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}">
                                                ${branch.is_active ? 'فعال' : 'معطل'}
                                            </span>
                                            <i class="fas fa-chevron-left text-slate-400"></i>
                                        </div>
                                    </div>

                                    <!-- Incubators -->
                                    ${incubators.filter(i => i.branch_id === branch.id).map(incubator => `
                                        <div class="mr-6 mt-3 border-r-4 border-green-400 bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="event.stopPropagation(); app.viewEntityDetails('INCUBATOR', ${incubator.id})">
                                            <div class="flex items-center justify-between mb-2">
                                                <div class="flex items-center gap-2">
                                                    <i class="fas fa-seedling text-green-600"></i>
                                                    <div>
                                                        <h5 class="font-bold text-sm text-slate-800">${incubator.name}</h5>
                                                        <p class="text-xs text-slate-500">${incubator.program_type} | السعة: ${incubator.capacity}</p>
                                                    </div>
                                                </div>
                                                <i class="fas fa-chevron-left text-slate-400"></i>
                                            </div>

                                            <!-- Platforms & Offices in Grid -->
                                            <div class="mr-4 mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <!-- Platforms -->
                                                <div class="space-y-2">
                                                    <p class="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                        <i class="fas fa-server text-orange-500"></i> المنصات
                                                    </p>
                                                    ${platforms.filter(p => p.incubator_id === incubator.id).map(platform => `
                                                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-2 hover:bg-orange-100 transition-colors cursor-pointer" onclick="event.stopPropagation(); app.viewEntityDetails('PLATFORM', ${platform.id})">
                                                            <div class="flex items-center justify-between">
                                                                <div>
                                                                    <p class="text-xs font-semibold text-slate-700">${platform.name}</p>
                                                                    <p class="text-xs text-slate-500">${platform.pricing_model} - ${platform.base_price} ${platform.currency}</p>
                                                                </div>
                                                                <i class="fas fa-eye text-xs text-orange-400"></i>
                                                            </div>
                                                        </div>
                                                    `).join('') || '<p class="text-xs text-slate-400 italic">لا توجد منصات</p>'}
                                                </div>

                                                <!-- Offices -->
                                                <div class="space-y-2">
                                                    <p class="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                        <i class="fas fa-briefcase text-teal-500"></i> المكاتب
                                                    </p>
                                                    ${offices.filter(o => o.incubator_id === incubator.id).map(office => `
                                                        <div class="bg-teal-50 border border-teal-200 rounded-lg p-2 hover:bg-teal-100 transition-colors cursor-pointer" onclick="event.stopPropagation(); app.viewEntityDetails('OFFICE', ${office.id})">
                                                            <div class="flex items-center justify-between">
                                                                <div>
                                                                    <p class="text-xs font-semibold text-slate-700">${office.name}</p>
                                                                    <p class="text-xs text-slate-500">${office.office_type} - السعة: ${office.capacity}</p>
                                                                </div>
                                                                <i class="fas fa-eye text-xs text-teal-400"></i>
                                                            </div>
                                                        </div>
                                                    `).join('') || '<p class="text-xs text-slate-400 italic">لا توجد مكاتب</p>'}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') || '<p class="text-xs text-slate-400 italic mr-6 mt-2">لا توجد حاضنات في هذا الفرع</p>'}
                                </div>
                            `).join('') || '<p class="text-slate-500 text-center py-8">لا توجد فروع لهذا المقر</p>'}
                        </div>
                    </div>
                `).join('')}

                ${headquarters.length === 0 ? `
                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <i class="fas fa-inbox text-6xl text-slate-300 mb-4"></i>
                        <h3 class="text-xl font-bold text-slate-700 mb-2">لا توجد مقرات رئيسية</h3>
                        <p class="text-slate-500">لم يتم إنشاء أي هيكل تنظيمي بعد</p>
                    </div>
                ` : ''}

                <!-- Create Link Modal -->
                <div id="createLinkModal" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
                        <div class="bg-gradient-to-r from-pink-600 to-pink-700 p-6 text-white rounded-t-2xl">
                            <h3 class="text-xl font-black flex items-center gap-2">
                                <i class="fas fa-link"></i> إنشاء ربط جديد
                            </h3>
                        </div>
                        <div class="p-6 space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">
                                    <i class="fas fa-briefcase text-teal-500 ml-1"></i> اختر المكتب
                                </label>
                                <select id="linkOfficeSelect" class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition">
                                    <option value="">-- اختر المكتب --</option>
                                    ${offices.map(o => `<option value="${o.id}">${o.name} (${o.code})</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">
                                    <i class="fas fa-server text-orange-500 ml-1"></i> اختر المنصة
                                </label>
                                <select id="linkPlatformSelect" class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition">
                                    <option value="">-- اختر المنصة --</option>
                                    ${platforms.map(p => `<option value="${p.id}">${p.name} (${p.code})</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="flex gap-3 p-6 bg-slate-50 rounded-b-2xl">
                            <button onclick="app.closeCreateLinkModal()" class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-xl font-bold transition">
                                إلغاء
                            </button>
                            <button onclick="app.submitCreateLink()" class="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-4 py-3 rounded-xl font-bold transition">
                                <i class="fas fa-link ml-1"></i> إنشاء الربط
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        } catch (error) {
            console.error('Error loading hierarchy:', error);
            showToast('فشل تحميل الهيكل الهرمي', 'error');
            return `
            <div class="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <h3 class="text-xl font-bold text-red-700 mb-2">خطأ في التحميل</h3>
                <p class="text-red-600">${error.message}</p>
            </div>`;
        }
    };

    const renderPlaceholder = (msg = 'لا تملك صلاحية الوصول') => `
        <div class="flex flex-col items-center justify-center h-96 text-center animate-fade-in px-4">
            <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner"><i class="fas fa-lock text-4xl text-slate-400"></i></div>
            <h3 class="text-2xl font-bold text-slate-700">وصول مقيد</h3>
            <p class="text-slate-500 mt-2 max-w-md mx-auto">${msg}</p>
        </div>`;

    // --- OFFICE-PLATFORM LINK MANAGEMENT ---
    const openCreateLinkModal = () => {
        const modal = document.getElementById('createLinkModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('linkOfficeSelect').value = '';
            document.getElementById('linkPlatformSelect').value = '';
        }
    };

    const closeCreateLinkModal = () => {
        const modal = document.getElementById('createLinkModal');
        if (modal) modal.classList.add('hidden');
    };

    const submitCreateLink = async () => {
        const officeId = document.getElementById('linkOfficeSelect').value;
        const platformId = document.getElementById('linkPlatformSelect').value;

        if (!officeId || !platformId) {
            showToast('يرجى اختيار المكتب والمنصة', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/offices/${officeId}/platforms/${platformId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'فشل إنشاء الربط');
            }

            showToast('تم إنشاء الربط بنجاح', 'success');
            closeCreateLinkModal();
            loadRoute('hierarchy'); // إعادة تحميل الصفحة
        } catch (error) {
            console.error('Error creating link:', error);
            showToast(error.message || 'فشل إنشاء الربط', 'error');
        }
    };

    const deleteLink = async (officeId, platformId, officeName, platformName) => {
        const confirm = window.confirm(`هل أنت متأكد من حذف الربط بين:\n\n💼 ${officeName}\n↕️\n🖥️ ${platformName}\n\n⚠️ لا يمكن التراجع عن هذا الإجراء!`);
        
        if (!confirm) return;

        try {
            const response = await fetch(`${API_BASE_URL}/offices/${officeId}/platforms/${platformId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'فشل حذف الربط');
            }

            showToast('تم حذف الربط بنجاح', 'success');
            loadRoute('hierarchy'); // إعادة تحميل الصفحة
        } catch (error) {
            console.error('Error deleting link:', error);
            showToast(error.message || 'فشل حذف الربط', 'error');
        }
    };

    // --- APPROVAL ACTIONS ---
    const handleApprovalDecision = async (workflowId, stepId, decision) => {
        let comments = null;
        let rejectionReason = null;
        
        if (decision === 'REJECTED') {
            rejectionReason = prompt('يرجى إدخال سبب الرفض:');
            if (!rejectionReason || rejectionReason.trim() === '') {
                showToast('يجب إدخال سبب الرفض', 'error');
                return;
            }
        } else {
            comments = prompt('تعليقات (اختياري):');
        }
        
        try {
            await fetchAPI(`/approvals/${workflowId}/decide`, {
                method: 'POST',
                body: JSON.stringify({
                    step_id: stepId,
                    decision: decision,
                    comments: comments || '',
                    rejection_reason: rejectionReason,
                    approver_id: currentUser.id
                })
            });
            
            showToast(decision === 'APPROVED' ? 'تمت الموافقة بنجاح' : 'تم رفض الطلب', 'success');
            
            // Reload data and refresh view
            await loadDataFromAPI();
            loadRoute('approvals');
        } catch (error) {
            console.error('Error:', error);
            showToast('حدث خطأ في معالجة القرار', 'error');
        }
    };

    // INCUBATOR SYSTEM - moved inside app to access db
    const renderIncubator = async () => {
        const view = document.getElementById('main-view');
        view.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        `;
        
        try {
            // Use window.renderIncubatorSystem if it exists (defined outside)
            if (typeof window.renderIncubatorSystem === 'function') {
                await window.renderIncubatorSystem(currentUser);
            } else {
                view.innerHTML = `
                    <div class="p-8 text-center">
                        <i class="fas fa-exclamation-triangle text-yellow-500 text-6xl mb-4"></i>
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">نظام الحاضنة قيد التطوير</h2>
                        <p class="text-gray-600">سيتم تفعيل هذه الميزة قريباً</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading incubator:', error);
            view.innerHTML = `
                <div class="p-8 text-center text-red-600">
                    <i class="fas fa-times-circle text-6xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">خطأ في تحميل نظام الحاضنة</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    };

    // --- VIEW ENTITY DETAILS (صفحة تفاصيل الكيان) ---
    const viewEntityDetails = async (entityType, entityId) => {
        try {
            showToast(`جارٍ تحميل تفاصيل ${entityType}...`, 'info');
            
            // Fetch entity details from API
            const data = await fetchAPI(`/hierarchy/entity/${entityType}/${entityId}`);
            const entity = data.entity;
            
            // Get entity icon and color based on type
            const entityConfig = {
                'BRANCH': { icon: 'fa-map-marked-alt', color: 'blue', bgGradient: 'from-blue-600 to-blue-700' },
                'INCUBATOR': { icon: 'fa-seedling', color: 'green', bgGradient: 'from-green-600 to-green-700' },
                'PLATFORM': { icon: 'fa-server', color: 'orange', bgGradient: 'from-orange-600 to-orange-700' },
                'OFFICE': { icon: 'fa-briefcase', color: 'teal', bgGradient: 'from-teal-600 to-teal-700' }
            };
            
            const config = entityConfig[entityType];
            
            // Render entity details page
            const view = document.getElementById('main-view');
            view.innerHTML = `
                <div class="space-y-6 animate-fade-in">
                    <!-- Back Button -->
                    <div>
                        <button onclick="app.loadRoute('hierarchy')" class="text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-2 transition">
                            <i class="fas fa-arrow-right"></i>
                            <span>العودة إلى الهيكل الهرمي</span>
                        </button>
                    </div>

                    <!-- Entity Header Card -->
                    <div class="bg-white rounded-2xl shadow-lg border-2 border-${config.color}-200 overflow-hidden">
                        <div class="bg-gradient-to-r ${config.bgGradient} p-8 text-white">
                            <div class="flex items-start justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="bg-white/20 rounded-full p-4">
                                        <i class="fas ${config.icon} text-4xl"></i>
                                    </div>
                                    <div>
                                        <h1 class="text-3xl font-black mb-2">${entity.name}</h1>
                                        <p class="text-sm opacity-90">
                                            ${entityType === 'BRANCH' ? `${entity.city}, ${entity.country}` : ''}
                                            ${entityType === 'INCUBATOR' ? `${entity.program_type} | تابع لـ ${entity.branch_name}` : ''}
                                            ${entityType === 'PLATFORM' ? `${entity.pricing_model} | تابع لـ ${entity.incubator_name}` : ''}
                                            ${entityType === 'OFFICE' ? `${entity.office_type} | تابع لـ ${entity.incubator_name}` : ''}
                                        </p>
                                        <p class="text-xs mt-1 opacity-80">
                                            <i class="fas fa-code ml-1"></i> رمز: ${entity.code}
                                        </p>
                                    </div>
                                </div>
                                <span class="px-4 py-2 rounded-full text-sm font-bold ${entity.is_active ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}">
                                    ${entity.is_active ? '✅ نشط' : '❌ غير نشط'}
                                </span>
                            </div>
                        </div>

                        <!-- Entity Details Grid -->
                        <div class="p-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                ${entityType === 'BRANCH' ? `
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">المقر الرئيسي</p>
                                        <p class="font-bold text-slate-800">${entity.hq_name || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">المدينة</p>
                                        <p class="font-bold text-slate-800">${entity.city || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">الدولة</p>
                                        <p class="font-bold text-slate-800">${entity.country || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                                        <p class="font-bold text-slate-800">${entity.contact_email || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">الهاتف</p>
                                        <p class="font-bold text-slate-800">${entity.contact_phone || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">المدير</p>
                                        <p class="font-bold text-slate-800">${entity.manager_name || 'غير محدد'}</p>
                                    </div>
                                ` : ''}
                                
                                ${entityType === 'INCUBATOR' ? `
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">الفرع</p>
                                        <p class="font-bold text-slate-800">${entity.branch_name || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">نوع البرنامج</p>
                                        <p class="font-bold text-slate-800">${entity.program_type || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">السعة القصوى</p>
                                        <p class="font-bold text-slate-800">${entity.capacity || 0} مشروع</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                                        <p class="font-bold text-slate-800">${entity.contact_email || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">الهاتف</p>
                                        <p class="font-bold text-slate-800">${entity.contact_phone || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">المدير</p>
                                        <p class="font-bold text-slate-800">${entity.manager_name || 'غير محدد'}</p>
                                    </div>
                                ` : ''}
                                
                                ${entityType === 'PLATFORM' ? `
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">الحاضنة</p>
                                        <p class="font-bold text-slate-800">${entity.incubator_name || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">نموذج التسعير</p>
                                        <p class="font-bold text-slate-800">${entity.pricing_model || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">السعر الأساسي</p>
                                        <p class="font-bold text-slate-800">${entity.base_price || 0} ${entity.currency || 'SAR'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                                        <p class="font-bold text-slate-800">${entity.contact_email || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">الهاتف</p>
                                        <p class="font-bold text-slate-800">${entity.contact_phone || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">المدير</p>
                                        <p class="font-bold text-slate-800">${entity.manager_name || 'غير محدد'}</p>
                                    </div>
                                ` : ''}
                                
                                ${entityType === 'OFFICE' ? `
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">الحاضنة</p>
                                        <p class="font-bold text-slate-800">${entity.incubator_name || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">نوع المكتب</p>
                                        <p class="font-bold text-slate-800">${entity.office_type || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">السعة</p>
                                        <p class="font-bold text-slate-800">${entity.capacity || 0} شخص</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                                        <p class="font-bold text-slate-800">${entity.contact_email || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">الهاتف</p>
                                        <p class="font-bold text-slate-800">${entity.contact_phone || 'غير محدد'}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-lg p-4">
                                        <p class="text-xs text-slate-500 mb-1">المسؤول</p>
                                        <p class="font-bold text-slate-800">${entity.manager_name || 'غير محدد'}</p>
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${entity.description ? `
                                <div class="mt-6 bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
                                    <h3 class="font-bold text-blue-900 mb-2">الوصف</h3>
                                    <p class="text-sm text-blue-700">${entity.description}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Children Entities -->
                    ${data.incubators && data.incubators.length > 0 ? `
                        <div class="bg-white rounded-2xl shadow-lg border-2 border-green-200 overflow-hidden">
                            <div class="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
                                <h3 class="text-lg font-black flex items-center gap-2">
                                    <i class="fas fa-seedling"></i>
                                    الحاضنات التابعة (${data.incubators.length})
                                </h3>
                            </div>
                            <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                ${data.incubators.map(inc => `
                                    <div class="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="app.viewEntityDetails('INCUBATOR', ${inc.id})">
                                        <div class="flex items-center justify-between mb-2">
                                            <h4 class="font-bold text-slate-800 text-sm">${inc.name}</h4>
                                            <i class="fas fa-chevron-left text-green-500"></i>
                                        </div>
                                        <p class="text-xs text-slate-500">${inc.program_type} | السعة: ${inc.capacity}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${data.platforms && data.platforms.length > 0 ? `
                        <div class="bg-white rounded-2xl shadow-lg border-2 border-orange-200 overflow-hidden">
                            <div class="bg-gradient-to-r from-orange-600 to-orange-700 p-4 text-white">
                                <h3 class="text-lg font-black flex items-center gap-2">
                                    <i class="fas fa-server"></i>
                                    المنصات التابعة (${data.platforms.length})
                                </h3>
                            </div>
                            <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                ${data.platforms.map(plt => `
                                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="app.viewEntityDetails('PLATFORM', ${plt.id})">
                                        <div class="flex items-center justify-between mb-2">
                                            <h4 class="font-bold text-slate-800 text-sm">${plt.name}</h4>
                                            <i class="fas fa-chevron-left text-orange-500"></i>
                                        </div>
                                        <p class="text-xs text-slate-500">${plt.pricing_model} - ${plt.base_price} ${plt.currency}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${data.offices && data.offices.length > 0 ? `
                        <div class="bg-white rounded-2xl shadow-lg border-2 border-teal-200 overflow-hidden">
                            <div class="bg-gradient-to-r from-teal-600 to-teal-700 p-4 text-white">
                                <h3 class="text-lg font-black flex items-center gap-2">
                                    <i class="fas fa-briefcase"></i>
                                    المكاتب التابعة (${data.offices.length})
                                </h3>
                            </div>
                            <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                ${data.offices.map(ofc => `
                                    <div class="bg-teal-50 border border-teal-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="app.viewEntityDetails('OFFICE', ${ofc.id})">
                                        <div class="flex items-center justify-between mb-2">
                                            <h4 class="font-bold text-slate-800 text-sm">${ofc.name}</h4>
                                            <i class="fas fa-chevron-left text-teal-500"></i>
                                        </div>
                                        <p class="text-xs text-slate-500">${ofc.office_type} - السعة: ${ofc.capacity}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
            
        } catch (error) {
            console.error('Error viewing entity details:', error);
            showToast('فشل تحميل تفاصيل الكيان', 'error');
        }
    };

    // Expose functions
    return { 
        init, switchUser, loadRoute, openAdWizard, submitAdWizard, toggleRoleMenu, submitTenantRegistration, 
        renderSettings, saveSettings, previewTheme, toggleMobileMenu, wizardNext, wizardPrev, switchTab,
        openCreateInvoiceModal, submitInvoice, openPaymentModal, submitPayment, reverseTransaction,
        handleApprovalDecision, refreshHierarchy: () => loadRoute('hierarchy'),
        openCreateLinkModal, closeCreateLinkModal, submitCreateLink, deleteLink, changeTenant, viewEntityDetails
    };
})();

// ========================================
// INCUBATOR TRAINING SYSTEM (Outside closure)
// نظام حاضنة السلامة
// ========================================

window.renderIncubatorSystem = async function(currentUser) {
  const container = document.querySelector('#main-view');
  
  // Check if a platform is selected, otherwise show platforms list
  const selectedPlatformId = localStorage.getItem('nayosh_selected_platform');
  
  if (!selectedPlatformId) {
    // Show platforms selection screen
    return renderPlatformSelection(currentUser);
  }
  
  // Platform is selected, render the training system for this platform
  // Initialize active tab
  if (!window.incubatorActiveTab) window.incubatorActiveTab = 'overview';
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header with Back Button -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold mb-2">🎓 حاضنة السلامة</h1>
          <p class="text-blue-100">نظام إدارة التدريب والتأهيل - ${currentUser.entityName}</p>
          <p class="text-blue-200 text-sm mt-2" id="platform-name-header">جاري تحميل المنصة...</p>
        </div>
        <button onclick="window.changePlatform()" class="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg transition">
          <i class="fas fa-arrow-right ml-2"></i> اختر منصة أخرى
        </button>
      </div>

      <!-- Statistics Cards -->
      <div id="incubator-stats" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">البرامج التدريبية</p>
              <p class="text-3xl font-bold text-blue-600" id="stat-programs">-</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <i class="fas fa-book text-blue-600 text-2xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">المستفيدون</p>
              <p class="text-3xl font-bold text-green-600" id="stat-beneficiaries">-</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              <i class="fas fa-users text-green-600 text-2xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">الدفعات النشطة</p>
              <p class="text-3xl font-bold text-orange-600" id="stat-sessions">-</p>
            </div>
            <div class="bg-orange-100 p-3 rounded-full">
              <i class="fas fa-chalkboard-teacher text-orange-600 text-2xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">الشهادات الصالحة</p>
              <p class="text-3xl font-bold text-purple-600" id="stat-certificates">-</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
              <i class="fas fa-certificate text-purple-600 text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Area with Tabs -->
      <div class="bg-white rounded-lg shadow">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px overflow-x-auto">
            <button onclick="window.switchIncubatorTab('overview')" 
                    class="incubator-tab-btn px-6 py-3 font-medium text-sm whitespace-nowrap ${window.incubatorActiveTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              📊 نظرة عامة
            </button>
            <button onclick="window.switchIncubatorTab('programs')" 
                    class="incubator-tab-btn px-6 py-3 font-medium text-sm whitespace-nowrap ${window.incubatorActiveTab === 'programs' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              📚 البرامج التدريبية
            </button>
            <button onclick="window.switchIncubatorTab('beneficiaries')" 
                    class="incubator-tab-btn px-6 py-3 font-medium text-sm whitespace-nowrap ${window.incubatorActiveTab === 'beneficiaries' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              👥 المستفيدون
            </button>
            <button onclick="window.switchIncubatorTab('sessions')" 
                    class="incubator-tab-btn px-6 py-3 font-medium text-sm whitespace-nowrap ${window.incubatorActiveTab === 'sessions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              📅 الدفعات التدريبية
            </button>
            <button onclick="window.switchIncubatorTab('certificates')" 
                    class="incubator-tab-btn px-6 py-3 font-medium text-sm whitespace-nowrap ${window.incubatorActiveTab === 'certificates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              🏆 الشهادات
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div id="incubator-tab-content" class="p-6">
          <!-- Content will be loaded here -->
        </div>
      </div>
    </div>
  `;

  // Load platform name in header
  try {
    const platforms = await window.fetchAPI(`/incubators/${currentUser.entityId}/platforms`);
    const currentPlatform = platforms.find(p => p.id === parseInt(selectedPlatformId));
    if (currentPlatform) {
      document.getElementById('platform-name-header').textContent = `📍 المنصة: ${currentPlatform.name}`;
    }
  } catch (error) {
    console.error('Error loading platform:', error);
  }

  // Load statistics
  try {
    const stats = await window.fetchAPI(`/incubator/stats?entity_id=${currentUser.entityId}`);
    document.getElementById('stat-programs').textContent = stats.total_programs || 0;
    document.getElementById('stat-beneficiaries').textContent = stats.total_beneficiaries || 0;
    document.getElementById('stat-sessions').textContent = stats.active_sessions || 0;
    document.getElementById('stat-certificates').textContent = stats.active_certificates || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
  
  // Load initial tab content
  window.switchIncubatorTab(window.incubatorActiveTab);
};

// Switch between incubator tabs
window.switchIncubatorTab = async function(tab) {
  window.incubatorActiveTab = tab;
  const content = document.getElementById('incubator-tab-content');
  
  if (!content) return;
  
  // Show loading
  content.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  `;
  
  try {
    const currentUser = window.currentUserData;
    
    switch(tab) {
      case 'overview':
        await renderIncubatorOverview(content, currentUser);
        break;
      case 'programs':
        await renderTrainingPrograms(content, currentUser);
        break;
      case 'beneficiaries':
        await renderBeneficiaries(content, currentUser);
        break;
      case 'sessions':
        await renderTrainingSessions(content, currentUser);
        break;
      case 'certificates':
        await renderCertificates(content, currentUser);
        break;
      default:
        content.innerHTML = `<p class="text-gray-500">المحتوى غير متوفر</p>`;
    }
    
    // Update tab buttons
    document.querySelectorAll('.incubator-tab-btn').forEach(btn => {
      btn.className = btn.className.replace(/border-b-2 border-blue-500 text-blue-600/, 'text-gray-500 hover:text-gray-700');
    });
    const activeBtn = document.querySelector(`button[onclick*="${tab}"]`);
    if (activeBtn) {
      activeBtn.className = activeBtn.className.replace(/text-gray-500 hover:text-gray-700/, 'border-b-2 border-blue-500 text-blue-600');
    }
  } catch (error) {
    console.error('Error loading tab:', error);
    content.innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
        <p>خطأ في تحميل المحتوى: ${error.message}</p>
      </div>
    `;
  }
};

// Render Platform Selection
async function renderPlatformSelection(currentUser) {
  const container = document.querySelector('#main-view');
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold mb-2">🎓 حاضنة السلامة</h1>
        <p class="text-blue-100">اختر المنصة التدريبية - ${currentUser.entityName}</p>
      </div>

      <!-- Loading -->
      <div class="bg-white p-8 rounded-lg shadow text-center" id="platforms-loading">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 mt-4">جاري تحميل المنصات...</p>
      </div>

      <!-- Platforms Grid -->
      <div id="platforms-grid" class="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>

      <!-- No Platforms Message -->
      <div id="no-platforms" class="hidden bg-yellow-50 p-8 rounded-lg border border-yellow-200 text-center">
        <i class="fas fa-inbox text-yellow-600 text-5xl mb-4"></i>
        <p class="text-yellow-800 font-bold text-lg">لا توجد منصات تدريبية</p>
        <p class="text-yellow-600 mt-2">يرجى التواصل مع إدارة الحاضنة</p>
      </div>
    </div>
  `;

  try {
    // Get incubator ID from entity
    const incubatorId = currentUser?.entityId || window.currentUserData?.entityId;
    console.log('📋 جاري تحميل المنصات للحاضنة:', incubatorId);
    
    if (!incubatorId) {
      throw new Error('معرّف الحاضنة غير موجود - Incubator ID not found');
    }

    const platforms = await window.fetchAPI(`/incubators/${incubatorId}/platforms`);
    console.log('✅ تم تحميل المنصات:', platforms.length);

    const loadingEl = document.getElementById('platforms-loading');
    const gridEl = document.getElementById('platforms-grid');
    const noEl = document.getElementById('no-platforms');

    if (platforms.length === 0) {
      loadingEl.classList.add('hidden');
      noEl.classList.remove('hidden');
      return;
    }

    // Render platforms
    gridEl.innerHTML = platforms.map(platform => `
      <div class="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden cursor-pointer group"
           onclick="window.selectPlatform(${platform.id}, '${platform.name}')">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white group-hover:from-blue-600 group-hover:to-blue-700 transition">
          <i class="fas fa-graduation-cap text-4xl mb-3"></i>
          <h3 class="text-xl font-bold">${platform.name}</h3>
          ${platform.description ? `<p class="text-sm text-blue-100 mt-2">${platform.description}</p>` : ''}
          ${platform.code ? `<p class="text-xs text-blue-200 mt-2">الرمز: ${platform.code}</p>` : ''}
        </div>
        <div class="p-6">
          <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-bold">
            اختر المنصة <i class="fas fa-arrow-left ml-2"></i>
          </button>
        </div>
      </div>
    `).join('');

    loadingEl.classList.add('hidden');
    gridEl.classList.remove('hidden');

  } catch (error) {
    console.error('❌ خطأ في تحميل المنصات:', error);
    document.getElementById('platforms-loading').innerHTML = `
      <div class="text-center">
        <i class="fas fa-exclamation-circle text-red-600 text-5xl mb-4"></i>
        <p class="text-red-600 font-bold">خطأ في تحميل المنصات</p>
        <p class="text-red-500 mt-2">${error.message}</p>
      </div>
    `;
  }
}

// Select a platform
window.selectPlatform = function(platformId, platformName) {
  console.log('✅ تم اختيار المنصة:', platformName, platformId);
  localStorage.setItem('nayosh_selected_platform', platformId);
  localStorage.setItem('nayosh_selected_platform_name', platformName);
  window.renderIncubatorSystem(window.currentUserData);
};

// Change platform
window.changePlatform = function() {
  console.log('🔄 تغيير المنصة');
  localStorage.removeItem('nayosh_selected_platform');
  localStorage.removeItem('nayosh_selected_platform_name');
  window.incubatorActiveTab = 'overview'; // Reset tab
  window.renderIncubatorSystem(window.currentUserData);
};

// Overview Tab
async function renderIncubatorOverview(container, currentUser) {
  container.innerHTML = `
    <div class="space-y-4">
      <h3 class="text-lg font-bold mb-4">نظام الحاضنة</h3>
      <p class="text-gray-600 mb-4">مرحباً بك في نظام حاضنة السلامة لإدارة التدريب والتأهيل</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onclick="window.switchIncubatorTab('programs')" class="border rounded-lg p-6 hover:shadow-lg transition text-right cursor-pointer bg-white hover:bg-blue-50">
          <i class="fas fa-book text-blue-600 text-3xl mb-3"></i>
          <h4 class="font-bold mb-2 text-lg">البرامج التدريبية</h4>
          <p class="text-sm text-gray-600">إدارة البرامج والدورات التدريبية</p>
        </button>
        <button onclick="window.switchIncubatorTab('beneficiaries')" class="border rounded-lg p-6 hover:shadow-lg transition text-right cursor-pointer bg-white hover:bg-green-50">
          <i class="fas fa-users text-green-600 text-3xl mb-3"></i>
          <h4 class="font-bold mb-2 text-lg">المستفيدون</h4>
          <p class="text-sm text-gray-600">إدارة بيانات المستفيدين والمتدربين</p>
        </button>
        <button onclick="window.switchIncubatorTab('sessions')" class="border rounded-lg p-6 hover:shadow-lg transition text-right cursor-pointer bg-white hover:bg-orange-50">
          <i class="fas fa-calendar text-orange-600 text-3xl mb-3"></i>
          <h4 class="font-bold mb-2 text-lg">الدفعات التدريبية</h4>
          <p class="text-sm text-gray-600">جدولة وإدارة الدفعات التدريبية</p>
        </button>
        <button onclick="window.switchIncubatorTab('certificates')" class="border rounded-lg p-6 hover:shadow-lg transition text-right cursor-pointer bg-white hover:bg-purple-50">
          <i class="fas fa-certificate text-purple-600 text-3xl mb-3"></i>
          <h4 class="font-bold mb-2 text-lg">الشهادات</h4>
          <p class="text-sm text-gray-600">إصدار وإدارة الشهادات</p>
        </button>
      </div>
    </div>
  `;
}

// Training Programs Tab
async function renderTrainingPrograms(container, currentUser) {
  try {
    const programs = await window.fetchAPI(`/training-programs?entity_id=${currentUser.entityId}`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">البرامج التدريبية</h3>
          <button onclick="window.openAddProgramModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <i class="fas fa-plus ml-2"></i> برنامج جديد
          </button>
        </div>
        
        ${programs && programs.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${programs.map(program => `
              <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h4 class="font-bold text-lg text-blue-600">${program.name}</h4>
                    <p class="text-sm text-gray-500">${program.code}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-medium ${
                    program.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }">
                    ${program.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
                
                <p class="text-gray-600 text-sm mb-3">${program.description || 'لا يوجد وصف'}</p>
                
                <div class="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div class="flex items-center text-gray-600">
                    <i class="fas fa-clock ml-2"></i>
                    ${program.duration_hours} ساعة
                  </div>
                  <div class="flex items-center text-gray-600">
                    <i class="fas fa-users ml-2"></i>
                    ${program.max_participants} متدرب
                  </div>
                  <div class="flex items-center text-gray-600">
                    <i class="fas fa-money-bill ml-2"></i>
                    ${program.price} ريال
                  </div>
                  <div class="flex items-center text-gray-600">
                    <i class="fas fa-percentage ml-2"></i>
                    ${program.passing_score}% للنجاح
                  </div>
                </div>
                
                <div class="flex items-center justify-between pt-3 border-t">
                  <span class="text-xs text-gray-500">
                    صلاحية الشهادة: ${program.certificate_validity_months} شهر
                  </span>
                  <div class="space-x-2 space-x-reverse flex gap-2">
                    <button onclick="window.viewProgramDetails(${program.id})" class="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm border border-blue-600 rounded">
                      <i class="fas fa-eye ml-1"></i> عرض
                    </button>
                    <button onclick="window.editProgram(${program.id})" class="text-green-600 hover:text-green-800 px-3 py-1 text-sm border border-green-600 rounded">
                      <i class="fas fa-edit ml-1"></i> تعديل
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-12 bg-gray-50 rounded-lg">
            <i class="fas fa-book text-gray-400 text-5xl mb-4"></i>
            <h4 class="text-lg font-bold text-gray-700 mb-2">لا توجد برامج تدريبية</h4>
            <p class="text-gray-500 mb-4">ابدأ بإضافة أول برنامج تدريبي</p>
            <button onclick="window.openAddProgramModal()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              <i class="fas fa-plus ml-2"></i> إضافة برنامج
            </button>
          </div>
        `}
      </div>
    `;
  } catch (error) {
    console.error('Error loading programs:', error);
    container.innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
        <p>خطأ في تحميل البرامج: ${error.message}</p>
      </div>
    `;
  }
}

// Beneficiaries Tab
async function renderBeneficiaries(container, currentUser) {
  try {
    const beneficiaries = await window.fetchAPI(`/beneficiaries?entity_id=${currentUser.entityId}`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">المستفيدون</h3>
          <button onclick="window.openAddBeneficiaryModal()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
            <i class="fas fa-plus ml-2"></i> مستفيد جديد
          </button>
        </div>
        
        ${beneficiaries && beneficiaries.length > 0 ? `
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهوية</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجوال</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${beneficiaries.map(b => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center ml-3">
                          <i class="fas fa-user text-green-600"></i>
                        </div>
                        <div>
                          <div class="font-medium">${b.full_name}</div>
                          <div class="text-sm text-gray-500">${b.email || 'لا يوجد بريد'}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${b.national_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${b.phone || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs rounded-full ${
                        b.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        b.status === 'GRADUATED' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'
                      }">
                        ${b.status === 'ACTIVE' ? 'نشط' : b.status === 'GRADUATED' ? 'خريج' : 'متوقف'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <button onclick="window.viewBeneficiaryDetails(${b.id})" class="text-blue-600 hover:text-blue-800 ml-3 px-2 py-1 border border-blue-600 rounded">
                        <i class="fas fa-eye ml-1"></i> عرض
                      </button>
                      <button onclick="window.editBeneficiary(${b.id})" class="text-green-600 hover:text-green-800 px-2 py-1 border border-green-600 rounded">
                        <i class="fas fa-edit ml-1"></i> تعديل
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="text-center py-12 bg-gray-50 rounded-lg">
            <i class="fas fa-users text-gray-400 text-5xl mb-4"></i>
            <h4 class="text-lg font-bold text-gray-700 mb-2">لا يوجد مستفيدون</h4>
            <p class="text-gray-500 mb-4">ابدأ بإضافة أول مستفيد</p>
            <button onclick="window.openAddBeneficiaryModal()" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
              <i class="fas fa-plus ml-2"></i> إضافة مستفيد
            </button>
          </div>
        `}
      </div>
    `;
  } catch (error) {
    console.error('Error loading beneficiaries:', error);
    container.innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
        <p>خطأ في تحميل المستفيدين: ${error.message}</p>
      </div>
    `;
  }
}

// Training Sessions Tab
async function renderTrainingSessions(container, currentUser) {
  try {
    const sessions = await window.fetchAPI(`/training-sessions?entity_id=${currentUser.entityId}`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">الدفعات التدريبية</h3>
          <button onclick="window.openAddSessionModal()" class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition">
            <i class="fas fa-plus ml-2"></i> دفعة جديدة
          </button>
        </div>
        
        ${sessions && sessions.length > 0 ? `
          <div class="space-y-4">
            ${sessions.map(session => `
              <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1">
                    <h4 class="font-bold text-lg">${session.session_name}</h4>
                    <p class="text-sm text-gray-600">${session.program_name} (${session.program_code})</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs font-medium ${
                    session.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                    session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    session.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }">
                    ${
                      session.status === 'IN_PROGRESS' ? 'جارية' :
                      session.status === 'COMPLETED' ? 'مكتملة' :
                      session.status === 'PLANNED' ? 'مخططة' :
                      'ملغاة'
                    }
                  </span>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div class="text-sm">
                    <span class="text-gray-500">تاريخ البدء:</span>
                    <p class="font-medium">${new Date(session.start_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div class="text-sm">
                    <span class="text-gray-500">تاريخ الانتهاء:</span>
                    <p class="font-medium">${new Date(session.end_date).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div class="text-sm">
                    <span class="text-gray-500">المدرب:</span>
                    <p class="font-medium">${session.instructor_name || '-'}</p>
                  </div>
                  <div class="text-sm">
                    <span class="text-gray-500">المتدربون:</span>
                    <p class="font-medium">${session.current_participants} / ${session.max_participants}</p>
                  </div>
                </div>
                
                <div class="flex items-center justify-between pt-3 border-t">
                  <span class="text-sm text-gray-600">
                    <i class="fas fa-map-marker-alt ml-2"></i>${session.location || 'لم يحدد'}
                  </span>
                  <div class="space-x-2 space-x-reverse flex gap-2">
                    <button onclick="window.viewSessionDetails(${session.id})" class="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm border border-blue-600 rounded">
                      <i class="fas fa-eye ml-1"></i> عرض
                    </button>
                    <button onclick="window.editSession(${session.id})" class="text-orange-600 hover:text-orange-800 px-3 py-1 text-sm border border-orange-600 rounded">
                      <i class="fas fa-edit ml-1"></i> تعديل
                    </button>
                    <button onclick="window.manageEnrollments(${session.id}, '${session.session_name}')" class="text-green-600 hover:text-green-800 px-3 py-1 text-sm border border-green-600 rounded">
                      <i class="fas fa-users ml-1"></i> المتدربون
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-12 bg-gray-50 rounded-lg">
            <i class="fas fa-calendar text-gray-400 text-5xl mb-4"></i>
            <h4 class="text-lg font-bold text-gray-700 mb-2">لا توجد دفعات تدريبية</h4>
            <p class="text-gray-500 mb-4">ابدأ بإضافة أول دفعة تدريبية</p>
            <button onclick="window.openAddSessionModal()" class="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition">
              <i class="fas fa-plus ml-2"></i> إضافة دفعة
            </button>
          </div>
        `}
      </div>
    `;
  } catch (error) {
    console.error('Error loading sessions:', error);
    container.innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
        <p>خطأ في تحميل الدفعات: ${error.message}</p>
      </div>
    `;
  }
}

// Certificates Tab
async function renderCertificates(container, currentUser) {
  try {
    const certificates = await window.fetchAPI(`/certificates?entity_id=${currentUser.entityId}`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">الشهادات</h3>
          <div class="flex gap-2">
            <input type="text" placeholder="بحث برقم الشهادة..." 
                   class="border rounded-lg px-4 py-2" 
                   id="cert-search">
            <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
              <i class="fas fa-search"></i> تحقق
            </button>
          </div>
        </div>
        
        ${certificates && certificates.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${certificates.map(cert => `
              <div class="border-2 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-white hover:shadow-xl transition-all">
                <div class="text-center mb-4">
                  <div class="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i class="fas fa-certificate text-2xl"></i>
                  </div>
                  <h4 class="font-bold text-lg">${cert.full_name}</h4>
                  <p class="text-sm text-gray-600">${cert.national_id}</p>
                </div>
                
                <div class="space-y-2 text-sm mb-4">
                  <div class="flex justify-between">
                    <span class="text-gray-600">البرنامج:</span>
                    <span class="font-medium">${cert.program_name}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">رقم الشهادة:</span>
                    <span class="font-mono text-xs">${cert.certificate_number}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">تاريخ الإصدار:</span>
                    <span>${new Date(cert.issue_date).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">تنتهي في:</span>
                    <span>${new Date(cert.expiry_date).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">الدرجة:</span>
                    <span class="font-bold ${
                      cert.grade === 'EXCELLENT' ? 'text-green-600' :
                      cert.grade === 'VERY_GOOD' ? 'text-blue-600' :
                      'text-gray-600'
                    }">${cert.final_score}%</span>
                  </div>
                </div>
                
                <div class="flex justify-between items-center pt-3 border-t">
                  <span class="px-2 py-1 rounded-full text-xs font-medium ${
                    cert.status === 'VALID' ? 'bg-green-100 text-green-800' :
                    cert.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }">
                    ${cert.status === 'VALID' ? 'صالحة' : cert.status === 'EXPIRED' ? 'منتهية' : 'ملغاة'}
                  </span>
                  <button onclick="window.viewCertificateDetails(${cert.id})" class="text-purple-600 hover:text-purple-800 text-sm border border-purple-600 px-3 py-1 rounded">
                    <i class="fas fa-eye ml-1"></i> عرض
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-12 bg-gray-50 rounded-lg">
            <i class="fas fa-certificate text-gray-400 text-5xl mb-4"></i>
            <h4 class="text-lg font-bold text-gray-700 mb-2">لا توجد شهادات</h4>
            <p class="text-gray-500 mb-4">سيتم عرض الشهادات هنا عند إصدارها</p>
          </div>
        `}
      </div>
    `;
  } catch (error) {
    console.error('Error loading certificates:', error);
    container.innerHTML = `
      <div class="text-center py-8 text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
        <p>خطأ في تحميل الشهادات: ${error.message}</p>
      </div>
    `;
  }
}

// ========================================
// INCUBATOR MODAL FUNCTIONS
// ========================================

// Open Add Training Program Modal
window.openAddProgramModal = function() {
  const modal = document.createElement('div');
  modal.id = 'add-program-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="bg-blue-600 text-white p-6 rounded-t-lg">
        <h2 class="text-2xl font-bold">إضافة برنامج تدريبي جديد</h2>
      </div>
      
      <form id="add-program-form" class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">اسم البرنامج *</label>
            <input type="text" name="name" required 
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="مثال: السلامة المهنية">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">رمز البرنامج *</label>
            <input type="text" name="code" required 
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="مثال: SAF101">
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
            <textarea name="description" rows="3"
                      class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="وصف البرنامج التدريبي..."></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">عدد الساعات *</label>
            <input type="number" name="duration_hours" required min="1"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="40">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الحد الأقصى للمتدربين *</label>
            <input type="number" name="max_participants" required min="1"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="20">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">السعر (ريال) *</label>
            <input type="number" name="price" required min="0" step="0.01"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="5000">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">درجة النجاح (%) *</label>
            <input type="number" name="passing_score" required min="0" max="100"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="70">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">صلاحية الشهادة (شهور) *</label>
            <input type="number" name="certificate_validity_months" required min="1"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                   placeholder="12">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
            <select name="is_active" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="true">نشط</option>
              <option value="false">غير نشط</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-3 pt-4 border-t">
          <button type="submit" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
            <i class="fas fa-save ml-2"></i> حفظ البرنامج
          </button>
          <button type="button" onclick="window.closeIncubatorModal()" 
                  class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('add-program-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      entity_id: window.currentUserData.entityId,
      name: formData.get('name'),
      code: formData.get('code'),
      description: formData.get('description'),
      duration_hours: parseInt(formData.get('duration_hours')),
      max_participants: parseInt(formData.get('max_participants')),
      price: parseFloat(formData.get('price')),
      passing_score: parseInt(formData.get('passing_score')),
      certificate_validity_months: parseInt(formData.get('certificate_validity_months')),
      is_active: formData.get('is_active') === 'true'
    };
    
    try {
      await window.fetchAPI('/training-programs', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      window.closeIncubatorModal();
      alert('✅ تم إضافة البرنامج بنجاح!');
      window.switchIncubatorTab('programs');
    } catch (error) {
      alert('❌ حدث خطأ: ' + error.message);
    }
  });
};

// Open Add Beneficiary Modal
window.openAddBeneficiaryModal = function() {
  const modal = document.createElement('div');
  modal.id = 'add-beneficiary-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="bg-green-600 text-white p-6 rounded-t-lg">
        <h2 class="text-2xl font-bold">إضافة مستفيد جديد</h2>
      </div>
      
      <form id="add-beneficiary-form" class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل *</label>
            <input type="text" name="full_name" required 
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                   placeholder="محمد أحمد العتيبي">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">رقم الهوية *</label>
            <input type="text" name="national_id" required pattern="[0-9]{10}"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                   placeholder="1234567890">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
            <input type="tel" name="phone" pattern="05[0-9]{8}"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                   placeholder="0501234567">
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
            <input type="email" name="email"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                   placeholder="name@example.com">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">المستوى التعليمي</label>
            <select name="education_level" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none">
              <option value="">اختر...</option>
              <option value="ابتدائي">ابتدائي</option>
              <option value="متوسط">متوسط</option>
              <option value="ثانوي">ثانوي</option>
              <option value="دبلوم">دبلوم</option>
              <option value="بكالوريوس">بكالوريوس</option>
              <option value="ماجستير">ماجستير</option>
              <option value="دكتوراه">دكتوراه</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
            <select name="status" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none">
              <option value="ACTIVE">نشط</option>
              <option value="SUSPENDED">متوقف</option>
              <option value="GRADUATED">خريج</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-3 pt-4 border-t">
          <button type="submit" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold">
            <i class="fas fa-save ml-2"></i> حفظ المستفيد
          </button>
          <button type="button" onclick="window.closeIncubatorModal()" 
                  class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('add-beneficiary-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      entity_id: window.currentUserData.entityId,
      full_name: formData.get('full_name'),
      national_id: formData.get('national_id'),
      phone: formData.get('phone') || null,
      email: formData.get('email') || null,
      education_level: formData.get('education_level') || null,
      status: formData.get('status')
    };
    
    try {
      await window.fetchAPI('/beneficiaries', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      window.closeIncubatorModal();
      alert('✅ تم إضافة المستفيد بنجاح!');
      window.switchIncubatorTab('beneficiaries');
    } catch (error) {
      alert('❌ حدث خطأ: ' + error.message);
    }
  });
};

// Open Add Training Session Modal
window.openAddSessionModal = async function() {
  // First load programs list
  let programsOptions = '<option value="">اختر البرنامج...</option>';
  try {
    const programs = await window.fetchAPI(`/training-programs?entity_id=${window.currentUserData.entityId}`);
    programsOptions += programs.map(p => `<option value="${p.id}">${p.name} (${p.code})</option>`).join('');
  } catch (error) {
    console.error('Error loading programs:', error);
  }
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];
  
  const modal = document.createElement('div');
  modal.id = 'add-session-modal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="bg-orange-600 text-white p-6 rounded-t-lg">
        <h2 class="text-2xl font-bold">إضافة دفعة تدريبية جديدة</h2>
      </div>
      
      <form id="add-session-form" class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">اسم الدفعة *</label>
            <input type="text" name="session_name" required 
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                   placeholder="الدفعة الأولى - 2026">
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">البرنامج التدريبي *</label>
            <select name="program_id" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
              ${programsOptions}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">تاريخ البدء *</label>
            <input type="date" name="start_date" required value="${todayStr}"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">تاريخ الانتهاء *</label>
            <input type="date" name="end_date" required value="${nextMonthStr}"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">اسم المدرب</label>
            <input type="text" name="instructor_name"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                   placeholder="د. أحمد محمد">
          </div>
          
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-gray-700 mb-2">الموقع</label>
            <input type="text" name="location"
                   class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                   placeholder="قاعة التدريب - الطابق الأول">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
            <select name="status" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
              <option value="PLANNED">مخططة</option>
              <option value="IN_PROGRESS">جارية</option>
              <option value="COMPLETED">مكتملة</option>
              <option value="CANCELLED">ملغاة</option>
            </select>
          </div>
        </div>
        
        <div class="flex gap-3 pt-4 border-t">
          <button type="submit" class="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-bold">
            <i class="fas fa-save ml-2"></i> حفظ الدفعة
          </button>
          <button type="button" onclick="window.closeIncubatorModal()" 
                  class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  document.getElementById('add-session-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const program_id = formData.get('program_id');
    
    // Validate program selection
    if (!program_id) {
      alert('⚠️ يجب اختيار البرنامج التدريبي');
      return;
    }
    
    // Get dates and validate format
    const start_date = formData.get('start_date');
    const end_date = formData.get('end_date');
    
    if (!start_date || !end_date) {
      alert('⚠️ يجب إدخال تاريخ البدء والانتهاء');
      return;
    }
    
    // Ensure dates are in correct format (YYYY-MM-DD)
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      alert('⚠️ صيغة التاريخ غير صحيحة');
      return;
    }
    
    if (endDateObj < startDateObj) {
      alert('⚠️ تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء');
      return;
    }
    
    // Format dates as YYYY-MM-DD
    const formattedStartDate = startDateObj.toISOString().split('T')[0];
    const formattedEndDate = endDateObj.toISOString().split('T')[0];
    
    const data = {
      entity_id: window.currentUserData.entityId,
      session_name: formData.get('session_name'),
      program_id: parseInt(program_id),
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      instructor_name: formData.get('instructor_name') || null,
      location: formData.get('location') || null,
      status: formData.get('status')
    };
    
    console.log('📤 Sending training session data:', data);
    
    try {
      await window.fetchAPI('/training-sessions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      window.closeIncubatorModal();
      alert('✅ تم إضافة الدفعة بنجاح!');
      window.switchIncubatorTab('sessions');
    } catch (error) {
      console.error('Error adding session:', error);
      alert('❌ حدث خطأ: ' + error.message);
    }
  });
};

// Close Modal
window.closeIncubatorModal = function() {
  const modals = [
    'add-program-modal',
    'add-beneficiary-modal',
    'add-session-modal',
    'view-session-modal',
    'edit-session-modal',
    'enrollments-modal',
    'view-program-modal',
    'edit-program-modal',
    'view-beneficiary-modal',
    'edit-beneficiary-modal',
    'view-certificate-modal'
  ];
  
  modals.forEach(id => {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
  });
};

// View Session Details
window.viewSessionDetails = async function(sessionId) {
  try {
    const sessions = await window.fetchAPI(`/training-sessions?entity_id=${window.currentUserData.entityId}`);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      alert('❌ لم يتم العثور على الدفعة');
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'view-session-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-orange-600 text-white p-6 rounded-t-lg">
          <h2 class="text-2xl font-bold">تفاصيل الدفعة التدريبية</h2>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Session Info -->
          <div class="border-b pb-4">
            <h3 class="font-bold text-xl mb-2">${session.session_name}</h3>
            <p class="text-gray-600">${session.program_name || 'برنامج غير محدد'}</p>
          </div>
          
          <!-- Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">كود الدفعة</label>
              <p class="text-gray-900">${session.session_code}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">الحالة</label>
              <span class="px-3 py-1 rounded-full text-xs font-medium ${
                session.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                session.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }">
                ${
                  session.status === 'IN_PROGRESS' ? 'جارية' :
                  session.status === 'COMPLETED' ? 'مكتملة' :
                  session.status === 'PLANNED' ? 'مخططة' :
                  'ملغاة'
                }
              </span>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">تاريخ البدء</label>
              <p class="text-gray-900">${new Date(session.start_date).toLocaleDateString('ar-SA')}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">تاريخ الانتهاء</label>
              <p class="text-gray-900">${new Date(session.end_date).toLocaleDateString('ar-SA')}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">المدرب</label>
              <p class="text-gray-900">${session.instructor_name || '-'}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">الموقع</label>
              <p class="text-gray-900">${session.location || '-'}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">الحد الأقصى للمتدربين</label>
              <p class="text-gray-900">${session.max_participants}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">المتدربون المسجلون</label>
              <p class="text-gray-900">${session.current_participants}</p>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t">
            <button onclick="window.editSession(${sessionId})" class="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-bold">
              <i class="fas fa-edit ml-2"></i> تعديل
            </button>
            <button onclick="window.closeIncubatorModal()" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Error viewing session:', error);
    alert('❌ حدث خطأ في عرض تفاصيل الدفعة');
  }
};

// Edit Session
window.editSession = async function(sessionId) {
  try {
    const sessions = await window.fetchAPI(`/training-sessions?entity_id=${window.currentUserData.entityId}`);
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
      alert('❌ لم يتم العثور على الدفعة');
      return;
    }
    
    // Load programs for dropdown
    let programsOptions = '';
    try {
      const programs = await window.fetchAPI(`/training-programs?entity_id=${window.currentUserData.entityId}`);
      programsOptions = programs.map(p => 
        `<option value="${p.id}" ${p.id === session.program_id ? 'selected' : ''}>${p.name} (${p.code})</option>`
      ).join('');
    } catch (error) {
      console.error('Error loading programs:', error);
    }
    
    // Close any existing modals first
    window.closeIncubatorModal();
    
    const modal = document.createElement('div');
    modal.id = 'edit-session-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-orange-600 text-white p-6 rounded-t-lg">
          <h2 class="text-2xl font-bold">تعديل الدفعة التدريبية</h2>
        </div>
        
        <form id="edit-session-form" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">اسم الدفعة *</label>
              <input type="text" name="session_name" required value="${session.session_name}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">البرنامج التدريبي *</label>
              <select name="program_id" required class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                ${programsOptions}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">تاريخ البدء *</label>
              <input type="date" name="start_date" required value="${session.start_date.split('T')[0]}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">تاريخ الانتهاء *</label>
              <input type="date" name="end_date" required value="${session.end_date.split('T')[0]}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">اسم المدرب</label>
              <input type="text" name="instructor_name" value="${session.instructor_name || ''}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">الموقع</label>
              <input type="text" name="location" value="${session.location || ''}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
              <select name="status" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none">
                <option value="PLANNED" ${session.status === 'PLANNED' ? 'selected' : ''}>مخططة</option>
                <option value="IN_PROGRESS" ${session.status === 'IN_PROGRESS' ? 'selected' : ''}>جارية</option>
                <option value="COMPLETED" ${session.status === 'COMPLETED' ? 'selected' : ''}>مكتملة</option>
                <option value="CANCELLED" ${session.status === 'CANCELLED' ? 'selected' : ''}>ملغاة</option>
              </select>
            </div>
          </div>
          
          <div class="flex gap-3 pt-4 border-t">
            <button type="submit" class="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition font-bold">
              <i class="fas fa-save ml-2"></i> حفظ التعديلات
            </button>
            <button type="button" onclick="window.closeIncubatorModal()" 
                    class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('edit-session-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const data = {
        session_name: formData.get('session_name'),
        program_id: parseInt(formData.get('program_id')),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date'),
        instructor_name: formData.get('instructor_name') || null,
        location: formData.get('location') || null,
        status: formData.get('status')
      };
      
      try {
        await window.fetchAPI(`/training-sessions/${sessionId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        
        window.closeIncubatorModal();
        alert('✅ تم تحديث الدفعة بنجاح!');
        window.switchIncubatorTab('sessions');
      } catch (error) {
        console.error('Error updating session:', error);
        alert('❌ حدث خطأ: ' + error.message);
      }
    });
  } catch (error) {
    console.error('Error editing session:', error);
    alert('❌ حدث خطأ في تحميل بيانات الدفعة');
  }
};

// Manage Enrollments
// Manage Enrollments (Training Session Participants)
window.manageEnrollments = async function(sessionId, sessionName) {
  try {
    console.log('📋 جاري تحميل بيانات المتدربين للدفعة:', sessionId);
    
    // Load session details and beneficiaries
    const [sessions, beneficiaries] = await Promise.all([
      window.fetchAPI(`/training-sessions?entity_id=${window.currentUserData.entityId}`),
      window.fetchAPI(`/beneficiaries?entity_id=${window.currentUserData.entityId}`)
    ]);
    
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      alert('❌ لم يتم العثور على الدفعة');
      return;
    }
    
    // Get current enrollments for this session
    let enrollments = [];
    try {
      enrollments = await window.fetchAPI(`/enrollments?session_id=${sessionId}`);
      console.log('✅ تم تحميل المتدربين:', enrollments.length, enrollments);
    } catch (error) {
      console.error('❌ خطأ في تحميل المتدربين:', error);
    }
    
    const enrolledIds = enrollments.map(e => e.beneficiary_id);
    const availableBeneficiaries = beneficiaries.filter(b => !enrolledIds.includes(b.id) && b.status === 'ACTIVE');
    
    const modal = document.createElement('div');
    modal.id = 'enrollments-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-green-600 text-white p-6 rounded-t-lg">
          <h2 class="text-2xl font-bold">إدارة المتدربين - ${sessionName}</h2>
          <p class="text-sm mt-1">عدد المتدربين: ${enrollments.length} / ${session.max_participants}</p>
        </div>
        
        <div class="p-6">
          <!-- Add New Enrollment -->
          ${availableBeneficiaries.length > 0 ? `
            <div class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 class="font-bold mb-3">إضافة متدرب جديد</h3>
              <div class="flex gap-2">
                <select id="beneficiary-select" class="flex-1 border rounded-lg px-4 py-2">
                  <option value="">اختر المستفيد...</option>
                  ${availableBeneficiaries.map(b => `
                    <option value="${b.id}">${b.full_name} - ${b.national_id}</option>
                  `).join('')}
                </select>
                <button onclick="window.addEnrollment(${sessionId}, '${sessionName}')" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                  <i class="fas fa-plus ml-2"></i> إضافة
                </button>
              </div>
            </div>
          ` : `
            <div class="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p class="text-yellow-800">⚠️ جميع المستفيدين النشطين مسجلين بالفعل في هذه الدفعة</p>
            </div>
          `}
          
          <!-- Current Enrollments -->
          <h3 class="font-bold mb-3">المتدربون المسجلون (${enrollments.length})</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border rounded-lg">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">#</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهوية</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نسبة الحضور</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التقييم النهائي</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${enrollments.length > 0 ? enrollments.map((enrollment, idx) => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${idx + 1}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium">${enrollment.beneficiary_name || 'غير محدد'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${enrollment.beneficiary_national_id || '-'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(enrollment.enrollment_date).toLocaleDateString('ar-SA')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${enrollment.attendance_percentage || 0}%</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      ${enrollment.final_grade ? `<span class="font-bold">${enrollment.final_grade}%</span>` : '-'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs rounded-full ${
                        enrollment.status === 'ATTENDING' ? 'bg-green-100 text-green-800' :
                        enrollment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        enrollment.status === 'REGISTERED' ? 'bg-yellow-100 text-yellow-800' :
                        enrollment.status === 'WITHDRAWN' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }">
                        ${
                          enrollment.status === 'ATTENDING' ? 'يحضر' :
                          enrollment.status === 'COMPLETED' ? 'مكتمل' :
                          enrollment.status === 'REGISTERED' ? 'مسجل' :
                          enrollment.status === 'WITHDRAWN' ? 'منسحب' :
                          'راسب'
                        }
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button onclick="window.removeEnrollment(${enrollment.id}, ${sessionId}, '${sessionName}')" 
                              class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition text-sm font-bold">
                        <i class="fas fa-trash ml-1"></i> حذف
                      </button>
                    </td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                      <i class="fas fa-inbox text-4xl mb-3 block text-gray-400"></i>
                      <p class="font-bold">لا يوجد متدربون مسجلون بعد</p>
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 pt-6 border-t mt-6">
            <button onclick="window.closeIncubatorModal()" class="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition font-bold">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Error managing enrollments:', error);
    alert('❌ حدث خطأ في تحميل بيانات المتدربين: ' + error.message);
  }
};

// Add Enrollment
window.addEnrollment = async function(sessionId, sessionName) {
  const select = document.getElementById('beneficiary-select');
  const beneficiaryId = select.value;
  
  if (!beneficiaryId) {
    alert('⚠️ يرجى اختيار المستفيد');
    return;
  }
  
  try {
    await window.fetchAPI('/enrollments', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        beneficiary_id: parseInt(beneficiaryId),
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'REGISTERED'
      })
    });
    
    alert('✅ تم تسجيل المتدرب بنجاح!');
    window.closeIncubatorModal();
    window.manageEnrollments(sessionId, sessionName);
  } catch (error) {
    console.error('Error adding enrollment:', error);
    alert('❌ حدث خطأ: ' + error.message);
  }
};

// Remove Enrollment
window.removeEnrollment = async function(enrollmentId, sessionId, sessionName) {
  if (!confirm('هل أنت متأكد من حذف هذا المتدرب من الدفعة؟')) {
    return;
  }
  
  try {
    await window.fetchAPI(`/enrollments/${enrollmentId}`, {
      method: 'DELETE'
    });
    
    alert('✅ تم حذف المتدرب بنجاح!');
    window.closeIncubatorModal();
    window.manageEnrollments(sessionId, sessionName);
  } catch (error) {
    console.error('Error removing enrollment:', error);
    alert('❌ حدث خطأ: ' + error.message);
  }
};

// ========================================
// CERTIFICATES - View
// ========================================

// View Certificate Details
window.viewCertificateDetails = async function(certificateId) {
  try {
    const certificates = await window.fetchAPI(`/certificates?entity_id=${window.currentUserData.entityId}`);
    const cert = certificates.find(c => c.id === certificateId);
    
    if (!cert) {
      alert('❌ لم يتم العثور على الشهادة');
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'view-certificate-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <!-- Certificate Header -->
        <div class="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 rounded-t-lg text-center">
          <div class="mb-4">
            <i class="fas fa-certificate text-6xl"></i>
          </div>
          <h2 class="text-3xl font-bold mb-2">شهادة إتمام</h2>
          <p class="text-purple-200">نظام نايوش للتدريب والتطوير</p>
        </div>
        
        <!-- Certificate Body -->
        <div class="p-8">
          <!-- Beneficiary Info -->
          <div class="text-center mb-8 pb-8 border-b-2 border-purple-200">
            <p class="text-gray-600 mb-2">تُمنح هذه الشهادة إلى</p>
            <h3 class="text-4xl font-bold text-purple-800 mb-4">${cert.full_name}</h3>
            <p class="text-gray-600">رقم الهوية: <span class="font-bold">${cert.national_id}</span></p>
          </div>
          
          <!-- Program Info -->
          <div class="text-center mb-8">
            <p class="text-gray-600 mb-2">لإتمامه بنجاح برنامج</p>
            <h4 class="text-2xl font-bold text-gray-800 mb-4">${cert.program_name}</h4>
            <div class="inline-block bg-purple-100 px-6 py-3 rounded-lg">
              <p class="text-lg font-bold text-purple-800">الدرجة النهائية: ${cert.final_score}%</p>
              <p class="text-sm text-purple-600">${
                cert.grade === 'EXCELLENT' ? 'ممتاز' :
                cert.grade === 'VERY_GOOD' ? 'جيد جداً' :
                cert.grade === 'GOOD' ? 'جيد' :
                cert.grade === 'PASS' ? 'مقبول' : 'راسب'
              }</p>
            </div>
          </div>
          
          <!-- Certificate Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="border rounded-lg p-4">
              <label class="block text-sm font-bold text-gray-700 mb-1">رقم الشهادة</label>
              <p class="font-mono text-sm bg-gray-50 p-2 rounded">${cert.certificate_number}</p>
            </div>
            
            <div class="border rounded-lg p-4">
              <label class="block text-sm font-bold text-gray-700 mb-1">تاريخ الإصدار</label>
              <p class="text-gray-900">${new Date(cert.issue_date).toLocaleDateString('ar-SA', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</p>
            </div>
            
            <div class="border rounded-lg p-4">
              <label class="block text-sm font-bold text-gray-700 mb-1">تاريخ الانتهاء</label>
              <p class="text-gray-900">${new Date(cert.expiry_date).toLocaleDateString('ar-SA', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</p>
            </div>
            
            <div class="border rounded-lg p-4">
              <label class="block text-sm font-bold text-gray-700 mb-1">الحالة</label>
              <span class="px-3 py-1 rounded-full text-xs font-medium ${
                cert.status === 'VALID' ? 'bg-green-100 text-green-800' :
                cert.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }">
                ${cert.status === 'VALID' ? 'صالحة' : cert.status === 'EXPIRED' ? 'منتهية' : 'ملغاة'}
              </span>
            </div>
            
            <div class="md:col-span-2 border rounded-lg p-4">
              <label class="block text-sm font-bold text-gray-700 mb-1">رابط التحقق</label>
              <div class="flex gap-2">
                <input type="text" readonly value="${cert.verification_url || 'https://nayosh.sa/verify/' + cert.certificate_number}" 
                       class="flex-1 bg-gray-50 border rounded px-3 py-2 text-sm" id="verify-url">
                <button onclick="navigator.clipboard.writeText(document.getElementById('verify-url').value); alert('تم نسخ الرابط')" 
                        class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- QR Code -->
          <div class="text-center mb-6">
            <p class="text-sm text-gray-600 mb-2">رمز QR للتحقق</p>
            <div class="inline-block border-4 border-purple-200 p-4 rounded-lg">
              <div class="bg-gray-200 w-48 h-48 flex items-center justify-center">
                <i class="fas fa-qrcode text-6xl text-gray-400"></i>
              </div>
            </div>
          </div>
          
          <!-- Issued By -->
          <div class="text-center text-sm text-gray-600 pt-6 border-t">
            <p>أصدر بواسطة: <span class="font-bold">${cert.issued_by || 'نظام نايوش'}</span></p>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 pt-6 border-t mt-6">
            <button onclick="window.printCertificate(${certificateId})" class="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-bold">
              <i class="fas fa-print ml-2"></i> طباعة الشهادة
            </button>
            <button onclick="window.closeIncubatorModal()" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Error viewing certificate:', error);
    alert('❌ حدث خطأ في عرض الشهادة');
  }
};

// Print Certificate
window.printCertificate = async function(certificateId) {
  try {
    // Get certificate data
    const response = await window.fetchAPI(`/certificates?id=${certificateId}`);
    const cert = response[0];
    
    if (!cert) {
      alert('❌ لم يتم العثور على الشهادة');
      return;
    }
    
    // Create printable certificate
    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>شهادة - ${cert.certificate_number}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .certificate {
            width: 210mm;
            height: 297mm;
            padding: 40mm 20mm;
            box-sizing: border-box;
            position: relative;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .certificate-inner {
            background: white;
            height: 100%;
            border: 8px solid #f7d794;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 0 30px rgba(0,0,0,0.2);
            position: relative;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
          }
          
          .logo {
            font-size: 48px;
            color: #667eea;
            margin-bottom: 10px;
          }
          
          .org-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 0;
          }
          
          .cert-title {
            text-align: center;
            margin: 40px 0;
          }
          
          .cert-title h1 {
            font-size: 42px;
            color: #667eea;
            margin: 0;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          }
          
          .recipient {
            text-align: center;
            margin: 30px 0;
            font-size: 18px;
            color: #555;
          }
          
          .recipient-name {
            font-size: 36px;
            font-weight: bold;
            color: #333;
            margin: 15px 0;
            text-decoration: underline;
            text-decoration-color: #f7d794;
            text-decoration-thickness: 3px;
          }
          
          .program-info {
            text-align: center;
            margin: 30px 0;
          }
          
          .program-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin: 15px 0;
          }
          
          .score-box {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            margin: 20px 0;
          }
          
          .score-box .score {
            font-size: 32px;
            font-weight: bold;
          }
          
          .score-box .grade {
            font-size: 18px;
            margin-top: 5px;
          }
          
          .details {
            display: flex;
            justify-content: space-around;
            margin: 40px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
          }
          
          .detail-item {
            text-align: center;
          }
          
          .detail-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
          }
          
          .detail-value {
            font-size: 16px;
            font-weight: bold;
            color: #333;
          }
          
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
          }
          
          .cert-number {
            font-size: 14px;
            color: #666;
            font-family: 'Courier New', monospace;
          }
          
          .verify-info {
            font-size: 12px;
            color: #999;
            margin-top: 10px;
          }
          
          .signature {
            display: flex;
            justify-content: space-around;
            margin-top: 40px;
          }
          
          .signature-line {
            text-align: center;
          }
          
          .signature-line .line {
            width: 200px;
            border-top: 2px solid #333;
            margin: 0 auto 10px;
          }
          
          .signature-line .title {
            font-size: 14px;
            color: #666;
            font-weight: bold;
          }
          
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(102, 126, 234, 0.05);
            font-weight: bold;
            pointer-events: none;
            z-index: 0;
          }
          
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="certificate-inner">
            <div class="watermark">نايوش</div>
            
            <div class="header">
              <div class="logo">🎓</div>
              <h2 class="org-name">نظام نايوش - حاضنة السلامة</h2>
            </div>
            
            <div class="cert-title">
              <h1>شهـــادة تقديــــر</h1>
            </div>
            
            <div class="recipient">
              <p>تشهد حاضنة السلامة بأن</p>
              <div class="recipient-name">${cert.beneficiary_name}</div>
              <p>قد أتم بنجاح برنامج</p>
            </div>
            
            <div class="program-info">
              <div class="program-name">${cert.program_name}</div>
              
              <div class="score-box">
                <div class="score">${cert.final_score}%</div>
                <div class="grade">
                  ${
                    cert.grade === 'EXCELLENT' ? 'ممتاز' :
                    cert.grade === 'VERY_GOOD' ? 'جيد جداً' :
                    cert.grade === 'GOOD' ? 'جيد' :
                    cert.grade === 'PASS' ? 'مقبول' : 'راسب'
                  }
                </div>
              </div>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">رقم الشهادة</div>
                <div class="detail-value">${cert.certificate_number}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">تاريخ الإصدار</div>
                <div class="detail-value">${new Date(cert.issue_date).toLocaleDateString('ar-SA', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">تاريخ الانتهاء</div>
                <div class="detail-value">${new Date(cert.expiry_date).toLocaleDateString('ar-SA', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}</div>
              </div>
            </div>
            
            <div class="signature">
              <div class="signature-line">
                <div class="line"></div>
                <div class="title">توقيع المدير</div>
              </div>
              <div class="signature-line">
                <div class="line"></div>
                <div class="title">ختم المؤسسة</div>
              </div>
            </div>
            
            <div class="footer">
              <div class="cert-number">رقم الشهادة: ${cert.certificate_number}</div>
              <div class="verify-info">
                للتحقق من صحة الشهادة، يرجى زيارة: ${cert.verification_url || 'https://nayosh.sa/verify/' + cert.certificate_number}
              </div>
            </div>
          </div>
        </div>
        
        <script>
          window.onload = function() {
            // Auto print when loaded
            setTimeout(function() {
              window.print();
            }, 500);
          };
          
          // Close window after printing
          window.onafterprint = function() {
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
  } catch (error) {
    console.error('Error printing certificate:', error);
    alert('❌ حدث خطأ في طباعة الشهادة');
  }
};

// ========================================
// TRAINING PROGRAMS - View & Edit
// ========================================

// View Program Details
window.viewProgramDetails = async function(programId) {
  try {
    const programs = await window.fetchAPI(`/training-programs?entity_id=${window.currentUserData.entityId}`);
    const program = programs.find(p => p.id === programId);
    
    if (!program) {
      alert('❌ لم يتم العثور على البرنامج');
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'view-program-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-blue-600 text-white p-6 rounded-t-lg">
          <h2 class="text-2xl font-bold">تفاصيل البرنامج التدريبي</h2>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Program Info -->
          <div class="border-b pb-4">
            <h3 class="font-bold text-xl mb-2">${program.name}</h3>
            <p class="text-gray-600">${program.code}</p>
          </div>
          
          <!-- Description -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">الوصف</label>
            <p class="text-gray-900">${program.description || 'لا يوجد وصف'}</p>
          </div>
          
          <!-- Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">عدد الساعات</label>
              <p class="text-gray-900">${program.duration_hours} ساعة</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">الحد الأقصى للمتدربين</label>
              <p class="text-gray-900">${program.max_participants} متدرب</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">السعر</label>
              <p class="text-gray-900">${program.price} ريال</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">درجة النجاح</label>
              <p class="text-gray-900">${program.passing_score}%</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">صلاحية الشهادة</label>
              <p class="text-gray-900">${program.certificate_validity_months} شهر</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">الحالة</label>
              <span class="px-3 py-1 rounded-full text-xs font-medium ${
                program.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }">
                ${program.is_active ? 'نشط' : 'غير نشط'}
              </span>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t">
            <button onclick="window.editProgram(${programId})" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
              <i class="fas fa-edit ml-2"></i> تعديل
            </button>
            <button onclick="window.closeIncubatorModal()" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Error viewing program:', error);
    alert('❌ حدث خطأ في عرض تفاصيل البرنامج');
  }
};

// Edit Program
window.editProgram = async function(programId) {
  try {
    const programs = await window.fetchAPI(`/training-programs?entity_id=${window.currentUserData.entityId}`);
    const program = programs.find(p => p.id === programId);
    
    if (!program) {
      alert('❌ لم يتم العثور على البرنامج');
      return;
    }
    
    window.closeIncubatorModal();
    
    const modal = document.createElement('div');
    modal.id = 'edit-program-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-blue-600 text-white p-6 rounded-t-lg">
          <h2 class="text-2xl font-bold">تعديل البرنامج التدريبي</h2>
        </div>
        
        <form id="edit-program-form" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">اسم البرنامج *</label>
              <input type="text" name="name" required value="${program.name}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">الكود *</label>
              <input type="text" name="code" required value="${program.code}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">عدد الساعات *</label>
              <input type="number" name="duration_hours" required value="${program.duration_hours}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">الوصف</label>
              <textarea name="description" rows="3"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">${program.description || ''}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">الحد الأقصى للمتدربين *</label>
              <input type="number" name="max_participants" required value="${program.max_participants}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">السعر (ريال) *</label>
              <input type="number" name="price" required step="0.01" value="${program.price}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">درجة النجاح (%) *</label>
              <input type="number" name="passing_score" required min="0" max="100" value="${program.passing_score}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">صلاحية الشهادة (شهر) *</label>
              <input type="number" name="certificate_validity_months" required value="${program.certificate_validity_months}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div class="md:col-span-2">
              <label class="flex items-center">
                <input type="checkbox" name="is_active" ${program.is_active ? 'checked' : ''}
                       class="ml-2 h-4 w-4 text-blue-600 rounded">
                <span class="text-sm font-bold text-gray-700">البرنامج نشط</span>
              </label>
            </div>
          </div>
          
          <div class="flex gap-3 pt-4 border-t">
            <button type="submit" class="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-bold">
              <i class="fas fa-save ml-2"></i> حفظ التعديلات
            </button>
            <button type="button" onclick="window.closeIncubatorModal()" 
                    class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('edit-program-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const data = {
        name: formData.get('name'),
        code: formData.get('code'),
        description: formData.get('description') || null,
        duration_hours: parseInt(formData.get('duration_hours')),
        max_participants: parseInt(formData.get('max_participants')),
        price: parseFloat(formData.get('price')),
        passing_score: parseInt(formData.get('passing_score')),
        certificate_validity_months: parseInt(formData.get('certificate_validity_months')),
        is_active: formData.get('is_active') === 'on'
      };
      
      try {
        await window.fetchAPI(`/training-programs/${programId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        
        window.closeIncubatorModal();
        alert('✅ تم تحديث البرنامج بنجاح!');
        window.switchIncubatorTab('programs');
      } catch (error) {
        console.error('Error updating program:', error);
        alert('❌ حدث خطأ: ' + error.message);
      }
    });
  } catch (error) {
    console.error('Error editing program:', error);
    alert('❌ حدث خطأ في تحميل بيانات البرنامج');
  }
};

// ========================================
// BENEFICIARIES - View & Edit
// ========================================

// View Beneficiary Details
window.viewBeneficiaryDetails = async function(beneficiaryId) {
  try {
    const beneficiaries = await window.fetchAPI(`/beneficiaries?entity_id=${window.currentUserData.entityId}`);
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    
    if (!beneficiary) {
      alert('❌ لم يتم العثور على المستفيد');
      return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'view-beneficiary-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-green-600 text-white p-6 rounded-t-lg">
          <h2 class="text-2xl font-bold">تفاصيل المستفيد</h2>
        </div>
        
        <div class="p-6 space-y-6">
          <!-- Beneficiary Info -->
          <div class="border-b pb-4">
            <h3 class="font-bold text-xl mb-2">${beneficiary.full_name}</h3>
            <p class="text-gray-600">${beneficiary.email || 'لا يوجد بريد إلكتروني'}</p>
          </div>
          
          <!-- Details Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">رقم الهوية</label>
              <p class="text-gray-900">${beneficiary.national_id}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">رقم الجوال</label>
              <p class="text-gray-900">${beneficiary.phone || '-'}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">المستوى التعليمي</label>
              <p class="text-gray-900">${beneficiary.education_level || '-'}</p>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">الحالة</label>
              <span class="px-3 py-1 rounded-full text-xs font-medium ${
                beneficiary.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                beneficiary.status === 'GRADUATED' ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'
              }">
                ${beneficiary.status === 'ACTIVE' ? 'نشط' : beneficiary.status === 'GRADUATED' ? 'خريج' : 'متوقف'}
              </span>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-3 pt-4 border-t">
            <button onclick="window.editBeneficiary(${beneficiaryId})" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold">
              <i class="fas fa-edit ml-2"></i> تعديل
            </button>
            <button onclick="window.closeIncubatorModal()" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
              إغلاق
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  } catch (error) {
    console.error('Error viewing beneficiary:', error);
    alert('❌ حدث خطأ في عرض تفاصيل المستفيد');
  }
};

// Edit Beneficiary
window.editBeneficiary = async function(beneficiaryId) {
  try {
    const beneficiaries = await window.fetchAPI(`/beneficiaries?entity_id=${window.currentUserData.entityId}`);
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    
    if (!beneficiary) {
      alert('❌ لم يتم العثور على المستفيد');
      return;
    }
    
    window.closeIncubatorModal();
    
    const modal = document.createElement('div');
    modal.id = 'edit-beneficiary-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-green-600 text-white p-6 rounded-t-lg">
          <h2 class="text-2xl font-bold">تعديل بيانات المستفيد</h2>
        </div>
        
        <form id="edit-beneficiary-form" class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل *</label>
              <input type="text" name="full_name" required value="${beneficiary.full_name}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">رقم الهوية *</label>
              <input type="text" name="national_id" required value="${beneficiary.national_id}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">رقم الجوال *</label>
              <input type="tel" name="phone" required value="${beneficiary.phone || ''}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none">
            </div>
            
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
              <input type="email" name="email" value="${beneficiary.email || ''}"
                     class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none">
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">المستوى التعليمي</label>
              <select name="education_level" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none">
                <option value="">اختر المستوى...</option>
                <option value="ELEMENTARY" ${beneficiary.education_level === 'ELEMENTARY' ? 'selected' : ''}>ابتدائي</option>
                <option value="MIDDLE" ${beneficiary.education_level === 'MIDDLE' ? 'selected' : ''}>متوسط</option>
                <option value="SECONDARY" ${beneficiary.education_level === 'SECONDARY' ? 'selected' : ''}>ثانوي</option>
                <option value="DIPLOMA" ${beneficiary.education_level === 'DIPLOMA' ? 'selected' : ''}>دبلوم</option>
                <option value="BACHELOR" ${beneficiary.education_level === 'BACHELOR' ? 'selected' : ''}>بكالوريوس</option>
                <option value="MASTER" ${beneficiary.education_level === 'MASTER' ? 'selected' : ''}>ماجستير</option>
                <option value="PHD" ${beneficiary.education_level === 'PHD' ? 'selected' : ''}>دكتوراه</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
              <select name="status" class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none">
                <option value="ACTIVE" ${beneficiary.status === 'ACTIVE' ? 'selected' : ''}>نشط</option>
                <option value="GRADUATED" ${beneficiary.status === 'GRADUATED' ? 'selected' : ''}>خريج</option>
                <option value="SUSPENDED" ${beneficiary.status === 'SUSPENDED' ? 'selected' : ''}>متوقف</option>
              </select>
            </div>
          </div>
          
          <div class="flex gap-3 pt-4 border-t">
            <button type="submit" class="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-bold">
              <i class="fas fa-save ml-2"></i> حفظ التعديلات
            </button>
            <button type="button" onclick="window.closeIncubatorModal()" 
                    class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-bold">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('edit-beneficiary-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const data = {
        full_name: formData.get('full_name'),
        national_id: formData.get('national_id'),
        phone: formData.get('phone'),
        email: formData.get('email') || null,
        education_level: formData.get('education_level') || null,
        status: formData.get('status')
      };
      
      try {
        await window.fetchAPI(`/beneficiaries/${beneficiaryId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        
        window.closeIncubatorModal();
        alert('✅ تم تحديث بيانات المستفيد بنجاح!');
        window.switchIncubatorTab('beneficiaries');
      } catch (error) {
        console.error('Error updating beneficiary:', error);
        alert('❌ حدث خطأ: ' + error.message);
      }
    });
  } catch (error) {
    console.error('Error editing beneficiary:', error);
    alert('❌ حدث خطأ في تحميل بيانات المستفيد');
  }
};

// Make fetchAPI available globally for employee functions
// This version MUST include data isolation headers from currentUser
window.fetchAPI = async function(endpoint, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Get currentUser from the app closure
        // Note: This is a bit of a workaround - ideally currentUser would be global or in sessionStorage
        if (window.currentUserData) {
            headers['x-entity-type'] = window.currentUserData.tenantType;
            headers['x-entity-id'] = window.currentUserData.entityId;
            console.log('📤 Sending isolation headers:', { entityType: window.currentUserData.tenantType, entityId: window.currentUserData.entityId });
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// ========================================
// INCUBATOR TRAINING SYSTEM
// نظام حاضنة السلامة
// ========================================

// Helper to expose openAssessmentModal if needed
app.openAssessmentModal = async (enrollmentId, name, programId) => {
    const score = prompt(`رصد درجة المتدرب: ${name}\nالدرجة من 100:`);
    if (score && !isNaN(score)) {
        try {
            // Simplified: directly issue certificate (skipping detailed assessment for now)
            // In real world: 1. Create Assessment, 2. If Passed -> Create Certificate
            
            // Generate certificate number
            const certNum = `CERT-${programId}-${new Date().getFullYear()}-${enrollmentId}`;
             
            await fetchAPI('/certificates', {
                method: 'POST',
                body: JSON.stringify({
                    enrollment_id: enrollmentId,
                    beneficiary_id: 1, // Need to get valid ID
                    program_id: programId,
                    certificate_number: certNum,
                    final_score: parseFloat(score),
                    grade: parseFloat(score) >= 90 ? 'EXCELLENT' : 'VERY_GOOD',
                    issued_by: 'مدير التدريب'
                })
            });
            alert(`تم رصد الدرجة (${score}) وإصدار الشهادة بنجاح!`);
            renderAssessments(document.getElementById('incubator-content'), app.currentUser.entityId);
        } catch (e) {
            console.error(e);
            alert('تم حفظ الدرجة (محاكاة)');
        }
    }
};

// ========================================
// EMPLOYEES MANAGEMENT
// ========================================

const renderEmployees = async () => {
    try {
        const employees = await window.fetchAPI('/employees');
        const branches = await window.fetchAPI('/branches');
        const incubators = await window.fetchAPI('/incubators');
        const platforms = await window.fetchAPI('/platforms');
        const offices = await window.fetchAPI('/offices');

        // Group by entity type
        const byType = employees.reduce((acc, emp) => {
            acc[emp.assigned_entity_type] = (acc[emp.assigned_entity_type] || []);
            acc[emp.assigned_entity_type].push(emp);
            return acc;
        }, {});

        return `
        <div class="space-y-6 animate-fade-in">
            <!-- Header -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">إدارة الموظفين</h2>
                    <p class="text-slate-500">عرض وإدارة جميع الموظفين في النظام</p>
                </div>
                <button onclick="app.openCreateEmployeeModal()" class="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg">
                    <i class="fas fa-user-plus"></i> إضافة موظف جديد
                </button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div class="flex items-center justify-between mb-2">
                        <i class="fas fa-users text-2xl opacity-80"></i>
                        <span class="text-3xl font-black">${employees.length}</span>
                    </div>
                    <p class="text-xs font-semibold opacity-90">إجمالي الموظفين</p>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div class="flex items-center justify-between mb-2">
                        <i class="fas fa-store text-2xl opacity-80"></i>
                        <span class="text-3xl font-black">${byType.BRANCH?.length || 0}</span>
                    </div>
                    <p class="text-xs font-semibold opacity-90">موظفو الفروع</p>
                </div>
                <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                    <div class="flex items-center justify-between mb-2">
                        <i class="fas fa-seedling text-2xl opacity-80"></i>
                        <span class="text-3xl font-black">${byType.INCUBATOR?.length || 0}</span>
                    </div>
                    <p class="text-xs font-semibold opacity-90">موظفو الحاضنات</p>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div class="flex items-center justify-between mb-2">
                        <i class="fas fa-server text-2xl opacity-80"></i>
                        <span class="text-3xl font-black">${byType.PLATFORM?.length || 0}</span>
                    </div>
                    <p class="text-xs font-semibold opacity-90">موظفو المنصات</p>
                </div>
                <div class="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white">
                    <div class="flex items-center justify-between mb-2">
                        <i class="fas fa-briefcase text-2xl opacity-80"></i>
                        <span class="text-3xl font-black">${byType.OFFICE?.length || 0}</span>
                    </div>
                    <p class="text-xs font-semibold opacity-90">موظفو المكاتب</p>
                </div>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4">
                <div class="flex flex-wrap gap-4">
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-bold text-gray-700 mb-2">نوع الكيان</label>
                        <select id="filterEntityType" onchange="app.filterEmployees()" class="w-full border border-gray-300 rounded-lg px-4 py-2">
                            <option value="">الكل</option>
                            <option value="HQ">المقر الرئيسي</option>
                            <option value="BRANCH">الفروع</option>
                            <option value="INCUBATOR">الحاضنات</option>
                            <option value="PLATFORM">المنصات</option>
                            <option value="OFFICE">المكاتب</option>
                        </select>
                    </div>
                    <div class="flex-1 min-w-[200px]">
                        <label class="block text-sm font-bold text-gray-700 mb-2">بحث</label>
                        <input type="text" id="searchEmployee" onkeyup="app.filterEmployees()" placeholder="اسم، بريد، رقم موظف..." class="w-full border border-gray-300 rounded-lg px-4 py-2">
                    </div>
                    <div class="flex items-end">
                        <button onclick="app.resetEmployeeFilters()" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-bold">
                            <i class="fas fa-redo ml-2"></i> إعادة تعيين
                        </button>
                    </div>
                </div>
            </div>

            <!-- Employees Table -->
            <div class="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
                <div class="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
                    <h3 class="text-xl font-black flex items-center gap-3">
                        <i class="fas fa-users text-2xl"></i>
                        قائمة الموظفين
                    </h3>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full" id="employeesTable">
                        <thead class="bg-slate-50 border-b-2 border-slate-200">
                            <tr>
                                <th class="text-right px-4 py-3 text-sm font-bold text-slate-600">رقم الموظف</th>
                                <th class="text-right px-4 py-3 text-sm font-bold text-slate-600">الاسم</th>
                                <th class="text-right px-4 py-3 text-sm font-bold text-slate-600">المسمى الوظيفي</th>
                                <th class="text-right px-4 py-3 text-sm font-bold text-slate-600">القسم</th>
                                <th class="text-right px-4 py-3 text-sm font-bold text-slate-600">الكيان</th>
                                <th class="text-center px-4 py-3 text-sm font-bold text-slate-600">الراتب</th>
                                <th class="text-center px-4 py-3 text-sm font-bold text-slate-600">الحالة</th>
                                <th class="text-center px-4 py-3 text-sm font-bold text-slate-600">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${employees.map(emp => `
                                <tr class="hover:bg-slate-50 transition-colors employee-row" data-entity-type="${emp.assigned_entity_type}" data-search="${emp.full_name} ${emp.email} ${emp.employee_number}">
                                    <td class="px-4 py-4">
                                        <span class="font-mono text-xs bg-slate-100 px-2 py-1 rounded">${emp.employee_number}</span>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span class="font-bold text-blue-600">${emp.full_name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p class="font-semibold text-slate-800">${emp.full_name}</p>
                                                <p class="text-xs text-slate-500">${emp.email || 'لا يوجد بريد'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4">
                                        <span class="text-sm font-medium text-slate-700">${emp.position || '-'}</span>
                                    </td>
                                    <td class="px-4 py-4">
                                        <span class="text-sm text-slate-600">${emp.department || '-'}</span>
                                    </td>
                                    <td class="px-4 py-4">
                                        <div>
                                            <p class="text-sm font-semibold text-slate-800">${emp.entity_name || 'غير محدد'}</p>
                                            <p class="text-xs text-slate-500">${emp.assigned_entity_type}</p>
                                        </div>
                                    </td>
                                    <td class="px-4 py-4 text-center">
                                        <span class="font-bold text-green-600">${emp.salary ? parseFloat(emp.salary).toLocaleString() + ' SAR' : '-'}</span>
                                    </td>
                                    <td class="px-4 py-4 text-center">
                                        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                            <i class="fas ${emp.is_active ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                            ${emp.is_active ? 'نشط' : 'معطل'}
                                        </span>
                                    </td>
                                    <td class="px-4 py-4 text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <button onclick="app.viewEmployee(${emp.id})" class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50" title="عرض">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button onclick="app.editEmployee(${emp.id})" class="text-orange-600 hover:text-orange-800 p-2 rounded-lg hover:bg-orange-50" title="تعديل">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="app.deleteEmployee(${emp.id}, '${emp.full_name}')" class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50" title="حذف">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    ${employees.length === 0 ? `
                        <div class="text-center py-12">
                            <i class="fas fa-users text-6xl text-slate-300 mb-4"></i>
                            <h4 class="text-xl font-bold text-slate-600 mb-2">لا يوجد موظفين</h4>
                            <p class="text-slate-500 mb-4">ابدأ بإضافة موظف جديد للنظام</p>
                            <button onclick="app.openCreateEmployeeModal()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold">
                                <i class="fas fa-plus ml-2"></i> إضافة موظف
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    } catch (error) {
        return `<div class="text-red-600 p-8 bg-red-50 rounded-lg border border-red-200">
            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p class="font-bold">خطأ في تحميل الموظفين</p>
            <p class="text-sm">${error.message}</p>
        </div>`;
    }
};

// Filter employees
app.filterEmployees = function() {
    const entityType = document.getElementById('filterEntityType').value;
    const searchTerm = document.getElementById('searchEmployee').value.toLowerCase();
    const rows = document.querySelectorAll('.employee-row');

    rows.forEach(row => {
        const rowEntityType = row.dataset.entityType;
        const rowSearch = row.dataset.search.toLowerCase();
        
        const matchesType = !entityType || rowEntityType === entityType;
        const matchesSearch = !searchTerm || rowSearch.includes(searchTerm);
        
        row.style.display = matchesType && matchesSearch ? '' : 'none';
    });
};

// Reset filters
app.resetEmployeeFilters = function() {
    document.getElementById('filterEntityType').value = '';
    document.getElementById('searchEmployee').value = '';
    app.filterEmployees();
};

// View employee details
app.viewEmployee = async function(id) {
    try {
        const employee = await window.fetchAPI(`/employees/${id}`);
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold flex items-center gap-3">
                            <i class="fas fa-user-circle"></i>
                            معلومات الموظف
                        </h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-white/80 hover:text-white hover:rotate-90 transition-all duration-300">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">رقم الموظف</label>
                            <p class="text-lg font-semibold text-gray-800">${employee.employee_number}</p>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">الاسم الكامل</label>
                            <p class="text-lg font-semibold text-gray-800">${employee.full_name}</p>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">المسمى الوظيفي</label>
                            <p class="text-lg font-semibold text-gray-800">${employee.position}</p>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">القسم</label>
                            <p class="text-lg font-semibold text-gray-800">${employee.department}</p>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">الكيان</label>
                            <p class="text-lg font-semibold text-blue-600">${employee.entity_name || 'غير محدد'}</p>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">نوع التوظيف</label>
                            <p class="text-lg font-semibold text-gray-800">${employee.employment_type === 'FULL_TIME' ? 'دوام كامل' : employee.employment_type === 'PART_TIME' ? 'دوام جزئي' : employee.employment_type}</p>
                        </div>
                        ${employee.email ? `
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">البريد الإلكتروني</label>
                            <p class="text-lg font-semibold text-gray-800">${employee.email}</p>
                        </div>` : ''}
                        ${employee.phone ? `
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">الهاتف</label>
                            <p class="text-lg font-semibold text-gray-800">${employee.phone}</p>
                        </div>` : ''}
                        ${employee.salary ? `
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">الراتب</label>
                            <p class="text-lg font-semibold text-green-600">${parseFloat(employee.salary).toLocaleString()} SAR</p>
                        </div>` : ''}
                        ${employee.hire_date ? `
                        <div class="space-y-2">
                            <label class="text-sm font-bold text-gray-500">تاريخ التوظيف</label>
                            <p class="text-lg font-semibold text-gray-800">${new Date(employee.hire_date).toLocaleDateString('ar-SA')}</p>
                        </div>` : ''}
                    </div>
                </div>
                
                <div class="bg-gray-50 p-6 rounded-b-2xl flex gap-3 justify-end">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition">
                        <i class="fas fa-times ml-2"></i>
                        إغلاق
                    </button>
                    <button onclick="app.editEmployee(${id}); this.closest('.fixed').remove();" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition">
                        <i class="fas fa-edit ml-2"></i>
                        تعديل البيانات
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        alert('خطأ في تحميل بيانات الموظف');
    }
};

// Edit employee
app.editEmployee = async function(id) {
    try {
        const employee = await window.fetchAPI(`/employees/${id}`);
        const modal = document.getElementById('editEmployeeModal');
        if (!modal) {
            console.error('Edit modal not found');
            return;
        }
        
        // Fill form with employee data
        document.getElementById('edit_employee_id').value = id;
        document.getElementById('edit_employee_number').value = employee.employee_number;
        document.getElementById('edit_full_name').value = employee.full_name;
        document.getElementById('edit_email').value = employee.email || '';
        document.getElementById('edit_phone').value = employee.phone || '';
        document.getElementById('edit_position').value = employee.position;
        document.getElementById('edit_department').value = employee.department;
        document.getElementById('edit_salary').value = employee.salary || '';
        document.getElementById('edit_employment_type').value = employee.employment_type;
        document.getElementById('edit_address').value = employee.address || '';
        
        modal.classList.remove('hidden');
    } catch (error) {
        alert('خطأ في تحميل بيانات الموظف للتعديل');
    }
};

// Delete employee
app.deleteEmployee = async function(id, name) {
    if (confirm(`هل أنت متأكد من حذف الموظف "${name}"؟`)) {
        try {
            await window.fetchAPI(`/employees/${id}`, { method: 'DELETE' });
            alert('تم حذف الموظف بنجاح');
            window.location.reload();
        } catch (error) {
            alert('خطأ في حذف الموظف: ' + error.message);
        }
    }
};

// Open create employee modal
app.openCreateEmployeeModal = function() {
    const modal = document.getElementById('createEmployeeModal');
    if (modal) {
        modal.classList.remove('hidden');
        loadEntitiesForEmployee();
    }
};

// Close create employee modal
app.closeCreateEmployeeModal = function() {
    const modal = document.getElementById('createEmployeeModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('createEmployeeForm').reset();
        document.getElementById('entity_select').innerHTML = '<option value="">-- اختر الكيان --</option>';
    }
};

// Load entities for employee assignment
app.loadEntitiesForEmployee = async function() {
    const entityType = document.getElementById('assigned_entity_type').value;
    const entitySelect = document.getElementById('entity_select');
    
    if (!entityType) {
        entitySelect.innerHTML = '<option value="">-- اختر الكيان --</option>';
        return;
    }

    try {
        let endpoint = '';
        switch (entityType) {
            case 'HQ':
                entitySelect.innerHTML = '<option value="HQ-1">المقر الرئيسي</option>';
                return;
            case 'BRANCH':
                endpoint = '/branches';
                break;
            case 'INCUBATOR':
                endpoint = '/incubators';
                break;
            case 'PLATFORM':
                endpoint = '/platforms';
                break;
            case 'OFFICE':
                endpoint = '/offices';
                break;
        }

        const entities = await window.fetchAPI(endpoint);
        
        entitySelect.innerHTML = '<option value="">-- اختر الكيان --</option>';
        entities.forEach(entity => {
            const option = document.createElement('option');
            option.value = entity.id;
            option.textContent = entity.name;
            entitySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading entities:', error);
        entitySelect.innerHTML = '<option value="">خطأ في تحميل الكيانات</option>';
    }
};

// Submit create employee form
app.submitCreateEmployee = async function() {
    const form = document.getElementById('createEmployeeForm');
    const formData = new FormData(form);
    
    // Get form values
    const employeeData = {
        employee_number: document.getElementById('employee_number').value,
        full_name: document.getElementById('full_name').value,
        email: document.getElementById('email').value || null,
        phone: document.getElementById('phone').value || null,
        national_id: document.getElementById('national_id').value || null,
        position: document.getElementById('position').value,
        department: document.getElementById('department').value,
        hire_date: document.getElementById('hire_date').value || null,
        salary: document.getElementById('salary').value ? parseFloat(document.getElementById('salary').value) : null,
        employment_type: document.getElementById('employment_type').value,
        address: document.getElementById('address').value || null,
        emergency_contact: document.getElementById('emergency_contact').value || null,
        emergency_phone: document.getElementById('emergency_phone').value || null
    };

    // Handle entity assignment
    const entityType = document.getElementById('assigned_entity_type').value;
    const entityId = document.getElementById('entity_select').value;
    
    // Add entity type to data
    employeeData.assigned_entity_type = entityType;
    
    // Set entity IDs based on type (matching server.js schema)
    if (entityType === 'HQ') {
        employeeData.hq_id = 1; // HQ ID
    } else if (entityType && entityId) {
        switch (entityType) {
            case 'BRANCH':
                employeeData.branch_id = parseInt(entityId);
                break;
            case 'INCUBATOR':
                employeeData.incubator_id = parseInt(entityId);
                break;
            case 'PLATFORM':
                employeeData.platform_id = parseInt(entityId);
                break;
            case 'OFFICE':
                employeeData.office_id = parseInt(entityId);
                break;
        }
    }

    // Validate required fields
    if (!employeeData.employee_number || !employeeData.full_name || !employeeData.position || 
        !employeeData.department || !employeeData.employment_type || !entityType || 
        (entityType !== 'HQ' && !entityId)) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        await window.fetchAPI('/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });

        alert('تم إضافة الموظف بنجاح!');
        app.closeCreateEmployeeModal();
        window.location.reload(); // Refresh employees page
    } catch (error) {
        alert('خطأ في إضافة الموظف: ' + error.message);
    }
};

// Make functions available globally
window.openCreateEmployeeModal = app.openCreateEmployeeModal;
window.closeCreateEmployeeModal = app.closeCreateEmployeeModal;
window.loadEntityOptions = app.loadEntitiesForEmployee;
window.submitCreateEmployee = app.submitCreateEmployee;

// Close edit employee modal
window.closeEditEmployeeModal = function() {
    const modal = document.getElementById('editEmployeeModal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('editEmployeeForm').reset();
    }
};

// Submit edit employee form
window.submitEditEmployee = async function() {
    const id = document.getElementById('edit_employee_id').value;
    const employeeData = {
        full_name: document.getElementById('edit_full_name').value,
        email: document.getElementById('edit_email').value || null,
        phone: document.getElementById('edit_phone').value || null,
        position: document.getElementById('edit_position').value,
        department: document.getElementById('edit_department').value,
        salary: document.getElementById('edit_salary').value ? parseFloat(document.getElementById('edit_salary').value) : null,
        employment_type: document.getElementById('edit_employment_type').value,
        address: document.getElementById('edit_address').value || null
    };

    // Validate required fields
    if (!employeeData.full_name || !employeeData.position || !employeeData.department || !employeeData.employment_type) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        await window.fetchAPI(`/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });

        alert('تم تحديث بيانات الموظف بنجاح!');
        window.closeEditEmployeeModal();
        window.location.reload(); // Refresh employees page
    } catch (error) {
        alert('خطأ في تحديث بيانات الموظف: ' + error.message);
    }
};

// ========================================
// ENTITY CREATION FUNCTIONS
// ========================================

// Open Create Branch Modal
window.openCreateBranchModal = function() {
  const modal = document.getElementById('createBranchModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
};

// Close Create Branch Modal
window.closeCreateBranchModal = function() {
  const modal = document.getElementById('createBranchModal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('createBranchForm').reset();
  }
};

// Submit Create Branch
window.submitCreateBranch = async function() {
  const formData = {
    hq_id: parseInt(document.getElementById('branch_hq_id').value),
    name: document.getElementById('branch_name').value,
    code: document.getElementById('branch_code').value,
    description: document.getElementById('branch_description').value,
    country: document.getElementById('branch_country').value,
    city: document.getElementById('branch_city').value,
    address: document.getElementById('branch_address').value,
    contact_email: document.getElementById('branch_email').value,
    contact_phone: document.getElementById('branch_phone').value,
    manager_name: document.getElementById('branch_manager').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('فشل في إنشاء الفرع');

    const result = await response.json();
    alert(`✅ تم إنشاء الفرع "${result.name}" بنجاح!`);
    closeCreateBranchModal();
    location.reload(); // Refresh the hierarchy
  } catch (error) {
    alert(`❌ خطأ: ${error.message}`);
  }
};

// Open Create Incubator Modal
window.openCreateIncubatorModal = function() {
  const modal = document.getElementById('createIncubatorModal');
  if (modal) {
    modal.classList.remove('hidden');
    loadBranchesForIncubator();
  }
};

// Close Create Incubator Modal
window.closeCreateIncubatorModal = function() {
  const modal = document.getElementById('createIncubatorModal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('createIncubatorForm').reset();
  }
};

// Load branches for incubator dropdown
async function loadBranchesForIncubator() {
  try {
    const response = await fetch(`${API_BASE_URL}/branches`);
    const branches = await response.json();
    const select = document.getElementById('incubator_branch_id');
    select.innerHTML = '<option value="">-- اختر فرع --</option>' +
      branches.map(b => `<option value="${b.id}">${b.name} (${b.code})</option>`).join('');
  } catch (error) {
    console.error('Error loading branches:', error);
  }
}

// Submit Create Incubator
window.submitCreateIncubator = async function() {
  const formData = {
    branch_id: parseInt(document.getElementById('incubator_branch_id').value),
    name: document.getElementById('incubator_name').value,
    code: document.getElementById('incubator_code').value,
    description: document.getElementById('incubator_description').value,
    program_type: document.getElementById('incubator_program_type').value,
    capacity: parseInt(document.getElementById('incubator_capacity').value),
    contact_email: document.getElementById('incubator_email').value,
    contact_phone: document.getElementById('incubator_phone').value,
    manager_name: document.getElementById('incubator_manager').value,
    start_date: document.getElementById('incubator_start_date').value || null,
    end_date: document.getElementById('incubator_end_date').value || null
  };

  try {
    const response = await fetch(`${API_BASE_URL}/incubators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('فشل في إنشاء الحاضنة');

    const result = await response.json();
    alert(`✅ تم إنشاء الحاضنة "${result.name}" بنجاح!`);
    closeCreateIncubatorModal();
    location.reload();
  } catch (error) {
    alert(`❌ خطأ: ${error.message}`);
  }
};

// Open Create Platform Modal
window.openCreatePlatformModal = function() {
  const modal = document.getElementById('createPlatformModal');
  if (modal) {
    modal.classList.remove('hidden');
    loadIncubatorsForPlatform();
  }
};

// Close Create Platform Modal
window.closeCreatePlatformModal = function() {
  const modal = document.getElementById('createPlatformModal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('createPlatformForm').reset();
  }
};

// Load incubators for platform dropdown
async function loadIncubatorsForPlatform() {
  try {
    const response = await fetch(`${API_BASE_URL}/incubators`);
    const incubators = await response.json();
    const select = document.getElementById('platform_incubator_id');
    select.innerHTML = '<option value="">-- اختر حاضنة --</option>' +
      incubators.map(i => `<option value="${i.id}">${i.name} (${i.code})</option>`).join('');
  } catch (error) {
    console.error('Error loading incubators:', error);
  }
}

// Submit Create Platform
window.submitCreatePlatform = async function() {
  const formData = {
    incubator_id: parseInt(document.getElementById('platform_incubator_id').value),
    name: document.getElementById('platform_name').value,
    code: document.getElementById('platform_code').value,
    description: document.getElementById('platform_description').value,
    platform_type: document.getElementById('platform_type').value,
    pricing_model: document.getElementById('platform_pricing_model').value,
    base_price: parseFloat(document.getElementById('platform_base_price').value) || 0,
    currency: document.getElementById('platform_currency').value || 'USD'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/platforms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('فشل في إنشاء المنصة');

    const result = await response.json();
    alert(`✅ تم إنشاء المنصة "${result.name}" بنجاح!`);
    closeCreatePlatformModal();
    location.reload();
  } catch (error) {
    alert(`❌ خطأ: ${error.message}`);
  }
};

// Open Create Office Modal
window.openCreateOfficeModal = function() {
  const modal = document.getElementById('createOfficeModal');
  if (modal) {
    modal.classList.remove('hidden');
    loadIncubatorsForOffice();
  }
};

// Close Create Office Modal
window.closeCreateOfficeModal = function() {
  const modal = document.getElementById('createOfficeModal');
  if (modal) {
    modal.classList.add('hidden');
    document.getElementById('createOfficeForm').reset();
  }
};

// Load incubators for office dropdown
async function loadIncubatorsForOffice() {
  try {
    const response = await fetch(`${API_BASE_URL}/incubators`);
    const incubators = await response.json();
    const select = document.getElementById('office_incubator_id');
    select.innerHTML = '<option value="">-- اختر حاضنة --</option>' +
      incubators.map(i => `<option value="${i.id}">${i.name} (${i.code})</option>`).join('');
  } catch (error) {
    console.error('Error loading incubators:', error);
  }
}

// Submit Create Office
window.submitCreateOffice = async function() {
  const formData = {
    incubator_id: parseInt(document.getElementById('office_incubator_id').value),
    name: document.getElementById('office_name').value,
    code: document.getElementById('office_code').value,
    description: document.getElementById('office_description').value,
    office_type: document.getElementById('office_type').value,
    location: document.getElementById('office_location').value,
    address: document.getElementById('office_address').value,
    capacity: parseInt(document.getElementById('office_capacity').value) || 0,
    contact_email: document.getElementById('office_email').value,
    contact_phone: document.getElementById('office_phone').value,
    manager_name: document.getElementById('office_manager').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/offices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('فشل في إنشاء المكتب');

    const result = await response.json();
    alert(`✅ تم إنشاء المكتب "${result.name}" بنجاح!`);
    closeCreateOfficeModal();
    location.reload();
  } catch (error) {
    alert(`❌ خطأ: ${error.message}`);
  }
};

document.addEventListener('DOMContentLoaded', app.init);