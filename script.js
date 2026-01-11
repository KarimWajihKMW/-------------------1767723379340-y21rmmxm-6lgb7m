/**
 * NAYOSH ERP - SaaS Multi-Tenant Architecture
 * Features: Strict Isolation, Tenant Scopes, Subscription Mgmt, Advertiser Panel, Financial System
 */

const app = (() => {
    // --- API CONFIGURATION ---
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : '/api';
    
    // Helper function to fetch data from API
    async function fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
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
        canManageAds: () => perms.isAdmin() || currentUser.role === ROLES.ADVERTISER,
        canViewAuditLogs: () => perms.isAdmin(),

        getVisibleEntities: () => {
            if (perms.isHQ()) return db.entities;
            return db.entities.filter(e => e.id === currentUser.entityId);
        },

        getVisibleTasks: () => db.tasks.filter(t => t.entityId === currentUser.entityId),
        getVisibleTickets: () => (perms.isHQ() && perms.isSupport()) ? db.tickets : db.tickets.filter(t => t.entityId === currentUser.entityId),
        
        getVisibleAds: () => {
            return db.ads.filter(ad => {
                if (ad.sourceEntityId === currentUser.entityId) return true;
                if (ad.sourceType === 'HQ') return true;
                if (ad.targetIds.includes(currentUser.entityId) && ad.status === 'ACTIVE') return true;
                if (ad.level === 'L4_PLT_INT') return true;
                return false;
            }).sort((a, b) => new Date(b.date) - new Date(a.date));
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

    // --- DATA LOADING FROM API ---
    async function loadDataFromAPI() {
        try {
            // Load entities
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

            // Load users
            const users = await fetchAPI('/users');
            db.users = users.map(u => ({
                id: u.id,
                name: u.name,
                role: u.role,
                tenantType: u.tenant_type,
                entityId: u.entity_id,
                entityName: u.entity_name
            }));

            // Load invoices
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

            // Load transactions
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

            // Load ledger
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

            // Load ads
            const ads = await fetchAPI('/ads');
            db.ads = ads.map(ad => ({
                id: ad.id,
                title: ad.title,
                content: ad.content,
                level: ad.level,
                scope: ad.scope,
                status: ad.status,
                sourceEntityId: ad.source_entity_id,
                targetIds: ad.target_ids || [],
                date: ad.created_at,
                cost: parseFloat(ad.cost),
                sourceType: ad.source_type,
                budget: parseFloat(ad.budget),
                spent: parseFloat(ad.spent),
                impressions: ad.impressions || 0,
                clicks: ad.clicks || 0,
                startDate: ad.start_date,
                endDate: ad.end_date
            }));

            // Load approvals
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

            // Load notifications for current user
            if (currentUser?.id) {
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
            }

            console.log('✅ تم تحميل جميع البيانات من قاعدة البيانات');
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            console.warn('⚠️ استخدام البيانات الاحتياطية...');
            
            // Use fallback data
            db.entities = fallbackData.entities;
            db.users = fallbackData.users;
            
            showToast('تم التحميل بالوضع المحلي (offline mode)', 'info');
        }
    }

    // --- INIT & NAV ---
    const init = async () => {
        console.log('🔄 بدء التهيئة...');
        
        // Show loading
        const view = document.getElementById('main-view');
        view.innerHTML = `
            <div class="flex h-full items-center justify-center flex-col gap-6">
                <div class="relative">
                    <div class="w-24 h-24 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
                    <i class="fas fa-database absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl text-brand-600"></i>
                </div>
                <p class="text-slate-600 font-bold text-lg animate-pulse">جاري تحميل البيانات من قاعدة البيانات...</p>
            </div>`;
        
        // Load data from API
        await loadDataFromAPI();
        console.log('📊 تم تحميل البيانات:', { entities: db.entities.length, users: db.users.length });
        
        // Set default user if users exist
        if (db.users && db.users.length > 0) {
            currentUser = db.users[0];
            console.log('👤 المستخدم الحالي:', currentUser);
        } else {
            console.error('❌ لا توجد مستخدمين في قاعدة البيانات!');
            // Create emergency fallback user
            currentUser = { id: 1, name: 'مستخدم النظام', role: 'مسؤول النظام', tenantType: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي' };
            db.users = [currentUser];
        }
        
        renderSidebar();
        updateHeader();
        const tenant = db.entities.find(e => e.id === currentUser?.entityId);
        if(tenant && tenant.theme) updateThemeVariables(tenant.theme);
        
        loadRoute('dashboard');
        showToast(`تم تسجيل الدخول: ${currentUser?.entityName || 'نظام نايوش'}`, 'success');
        console.log('✅ اكتملت التهيئة');
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
        if (route === 'dashboard') content = renderDashboard();
        else if (route === 'hierarchy') content = await renderHierarchy();
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

    const renderDashboard = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        if (!entity) return renderPlaceholder('Entity Not Found');

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
        const categorized = { hq: visibleAds.filter(a => a.sourceType === 'HQ'), other: visibleAds.filter(a => a.sourceType !== 'HQ') };

        return `
        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2"><i class="fas fa-bullhorn text-brand-500"></i> التعاميم والإعلانات</h3>
                ${perms.canManageAds() ? `<button onclick="app.loadRoute('ads')" class="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition"><i class="fas fa-cog"></i> إدارة الإعلانات</button>` : ''}
            </div>
            <div class="p-6 space-y-6">
                ${categorized.hq.length > 0 ? `<div class="space-y-3"><h4 class="text-xs font-extrabold text-purple-600 uppercase tracking-widest">تعاميم المكتب الرئيسي (Global)</h4>${categorized.hq.map(renderAdCard).join('')}</div>` : ''}
                <div class="space-y-3"><h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">إعلانات النطاق المحلي (Local Scope)</h4>${categorized.other.length > 0 ? categorized.other.map(renderAdCard).join('') : '<p class="text-sm text-slate-400 italic">لا توجد إعلانات</p>'}</div>
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
                                <div class="border-r-4 border-blue-400 bg-blue-50 rounded-lg p-4">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-map-marked-alt text-xl text-blue-600"></i>
                                            <div>
                                                <h4 class="font-bold text-slate-800">${branch.name}</h4>
                                                <p class="text-xs text-slate-500">${branch.city}, ${branch.country} | ${branch.code}</p>
                                            </div>
                                        </div>
                                        <span class="text-xs font-bold px-3 py-1 rounded-full ${branch.is_active ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}">
                                            ${branch.is_active ? 'فعال' : 'معطل'}
                                        </span>
                                    </div>

                                    <!-- Incubators -->
                                    ${incubators.filter(i => i.branch_id === branch.id).map(incubator => `
                                        <div class="mr-6 mt-3 border-r-4 border-green-400 bg-white rounded-lg p-4">
                                            <div class="flex items-center justify-between mb-2">
                                                <div class="flex items-center gap-2">
                                                    <i class="fas fa-seedling text-green-600"></i>
                                                    <div>
                                                        <h5 class="font-bold text-sm text-slate-800">${incubator.name}</h5>
                                                        <p class="text-xs text-slate-500">${incubator.program_type} | السعة: ${incubator.capacity}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Platforms & Offices in Grid -->
                                            <div class="mr-4 mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <!-- Platforms -->
                                                <div class="space-y-2">
                                                    <p class="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                        <i class="fas fa-server text-orange-500"></i> المنصات
                                                    </p>
                                                    ${platforms.filter(p => p.incubator_id === incubator.id).map(platform => `
                                                        <div class="bg-orange-50 border border-orange-200 rounded-lg p-2">
                                                            <p class="text-xs font-semibold text-slate-700">${platform.name}</p>
                                                            <p class="text-xs text-slate-500">${platform.pricing_model} - ${platform.base_price} ${platform.currency}</p>
                                                        </div>
                                                    `).join('') || '<p class="text-xs text-slate-400 italic">لا توجد منصات</p>'}
                                                </div>

                                                <!-- Offices -->
                                                <div class="space-y-2">
                                                    <p class="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                        <i class="fas fa-briefcase text-teal-500"></i> المكاتب
                                                    </p>
                                                    ${offices.filter(o => o.incubator_id === incubator.id).map(office => `
                                                        <div class="bg-teal-50 border border-teal-200 rounded-lg p-2">
                                                            <p class="text-xs font-semibold text-slate-700">${office.name}</p>
                                                            <p class="text-xs text-slate-500">${office.office_type} - السعة: ${office.capacity}</p>
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

    // Expose functions
    return { 
        init, switchUser, loadRoute, openAdWizard, submitAdWizard, toggleRoleMenu, submitTenantRegistration, 
        renderSettings, saveSettings, previewTheme, toggleMobileMenu, wizardNext, wizardPrev, switchTab,
        openCreateInvoiceModal, submitInvoice, openPaymentModal, submitPayment, reverseTransaction,
        handleApprovalDecision, refreshHierarchy: () => loadRoute('hierarchy'),
        openCreateLinkModal, closeCreateLinkModal, submitCreateLink, deleteLink
    };
})();

// ========================================
// INCUBATOR TRAINING SYSTEM
// نظام حاضنة السلامة
// ========================================

async function renderIncubator() {
  const currentUser = db.users[0]; // Use first user as default
  const currentEntity = db.entities.find(e => e.id === currentUser?.entityId);
  
  const container = document.querySelector('#main-view');
  
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold mb-2">🎓 حاضنة السلامة</h1>
        <p class="text-blue-100">نظام إدارة التدريب والتأهيل</p>
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

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow">
        <div class="border-b border-gray-200">
          <nav class="flex -mb-px">
            <button onclick="app.incubatorTab = 'programs'; renderIncubator()" 
                    class="incubator-tab px-6 py-3 font-medium text-sm ${app.incubatorTab === 'programs' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              📚 البرامج التدريبية
            </button>
            <button onclick="app.incubatorTab = 'beneficiaries'; renderIncubator()" 
                    class="incubator-tab px-6 py-3 font-medium text-sm ${app.incubatorTab === 'beneficiaries' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              👥 المستفيدون
            </button>
            <button onclick="app.incubatorTab = 'sessions'; renderIncubator()" 
                    class="incubator-tab px-6 py-3 font-medium text-sm ${app.incubatorTab === 'sessions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              📅 الدفعات التدريبية
            </button>
            <button onclick="app.incubatorTab = 'assessments'; renderIncubator()" 
                    class="incubator-tab px-6 py-3 font-medium text-sm ${app.incubatorTab === 'assessments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              📝 التقييم
            </button>
            <button onclick="app.incubatorTab = 'certificates'; renderIncubator()" 
                    class="incubator-tab px-6 py-3 font-medium text-sm ${app.incubatorTab === 'certificates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              🏆 الشهادات
            </button>
            <button onclick="app.incubatorTab = 'renewals'; renderIncubator()" 
                    class="incubator-tab px-6 py-3 font-medium text-sm ${app.incubatorTab === 'renewals' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              🔄 المتابعة والتجديد
            </button>
            <button onclick="app.incubatorTab = 'records'; renderIncubator()" 
                    class="incubator-tab px-6 py-3 font-medium text-sm ${app.incubatorTab === 'records' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}">
              📋 السجل التدريبي
            </button>
          </nav>
        </div>

        <div id="incubator-content" class="p-6">
          <!-- Content will be loaded here -->
        </div>
      </div>
    </div>
  `;

  // Load statistics
  loadIncubatorStats(currentEntity?.id || 'INC03');
  
  // Load tab content
  if (!app.incubatorTab) app.incubatorTab = 'programs';
  loadIncubatorTab(app.incubatorTab, currentEntity?.id || 'INC03');
}

async function loadIncubatorStats(entityId) {
  try {
    const stats = await fetchAPI(`/incubator/stats?entity_id=${entityId}`);
    document.getElementById('stat-programs').textContent = stats.total_programs || 0;
    document.getElementById('stat-beneficiaries').textContent = stats.total_beneficiaries || 0;
    document.getElementById('stat-sessions').textContent = stats.active_sessions || 0;
    document.getElementById('stat-certificates').textContent = stats.active_certificates || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadIncubatorTab(tab, entityId) {
  const content = document.getElementById('incubator-content');
  
  switch(tab) {
    case 'programs':
      await renderTrainingPrograms(content, entityId);
      break;
    case 'beneficiaries':
      await renderBeneficiaries(content, entityId);
      break;
    case 'sessions':
      await renderTrainingSessions(content, entityId);
      break;
    case 'assessments':
      await renderAssessments(content, entityId);
      break;
    case 'certificates':
      await renderCertificates(content, entityId);
      break;
    case 'renewals':
      await renderRenewals(content, entityId);
      break;
    case 'records':
      await renderTrainingRecords(content, entityId);
      break;
  }
}

async function renderTrainingPrograms(container, entityId) {
  try {
    const programs = await fetchAPI(`/training-programs?entity_id=${entityId}`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">البرامج التدريبية</h3>
          <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-plus ml-2"></i> برنامج جديد
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${programs.map(program => `
            <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
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
                <div class="space-x-2">
                  <button class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="text-red-600">خطأ في تحميل البرامج: ${error.message}</div>`;
  }
}

async function renderBeneficiaries(container, entityId) {
  try {
    const beneficiaries = await fetchAPI(`/beneficiaries?entity_id=${entityId}`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">المستفيدون</h3>
          <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-plus ml-2"></i> مستفيد جديد
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهوية الوطنية</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الجوال</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستوى التعليمي</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              ${beneficiaries.map(b => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                        <i class="fas fa-user text-blue-600"></i>
                      </div>
                      <div>
                        <div class="font-medium">${b.full_name}</div>
                        <div class="text-sm text-gray-500">${b.email || 'لا يوجد بريد'}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${b.national_id}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${b.phone || '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${b.education_level || '-'}</td>
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
                    <button onclick="viewBeneficiary(${b.id})" class="text-blue-600 hover:text-blue-800 ml-3">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-gray-600 hover:text-gray-800">
                      <i class="fas fa-edit"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="text-red-600">خطأ في تحميل المستفيدين: ${error.message}</div>`;
  }
}

async function renderTrainingSessions(container, entityId) {
  try {
    const sessions = await fetchAPI(`/training-sessions?entity_id=${entityId}`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">الدفعات التدريبية</h3>
          <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-plus ml-2"></i> دفعة جديدة
          </button>
        </div>
        
        <div class="space-y-4">
          ${sessions.map(session => `
            <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
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
                    'ملغية'
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
                <div class="space-x-2">
                  <button class="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm">
                    <i class="fas fa-users ml-1"></i> المتدربون
                  </button>
                  <button class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="text-red-600">خطأ في تحميل الدفعات: ${error.message}</div>`;
  }
}

async function renderCertificates(container, entityId) {
  try {
    const certificates = await fetchAPI(`/certificates`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">الشهادات</h3>
          <div class="flex gap-2">
            <input type="text" placeholder="بحث برقم الشهادة..." 
                   class="border rounded-lg px-4 py-2" 
                   onkeyup="searchCertificate(this.value)">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <i class="fas fa-search"></i> تحقق
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${certificates.map(cert => `
            <div class="border-2 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white hover:shadow-xl transition-all">
              <div class="text-center mb-4">
                <div class="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
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
                <button onclick="viewCertificate(${cert.id})" class="text-blue-600 hover:text-blue-800 text-sm">
                  <i class="fas fa-eye ml-1"></i> عرض
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="text-red-600">خطأ في تحميل الشهادات: ${error.message}</div>`;
  }
}

async function renderTrainingRecords(container, entityId) {
  try {
    const beneficiaries = await fetchAPI(`/beneficiaries?entity_id=${entityId}`);
    
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">السجل التدريبي للمستفيدين</h3>
        </div>
        
        <div class="space-y-4">
          ${await Promise.all(beneficiaries.map(async b => {
            const records = await fetchAPI(`/training-records?beneficiary_id=${b.id}`);
            return `
              <div class="border rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center">
                    <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center ml-3">
                      <i class="fas fa-user text-blue-600 text-xl"></i>
                    </div>
                    <div>
                      <h4 class="font-bold">${b.full_name}</h4>
                      <p class="text-sm text-gray-500">${b.national_id}</p>
                    </div>
                  </div>
                  <span class="text-sm text-gray-600">
                    ${records.length} برنامج تدريبي
                  </span>
                </div>
                
                ${records.length > 0 ? `
                  <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-4 py-2 text-right">البرنامج</th>
                          <th class="px-4 py-2 text-right">الدفعة</th>
                          <th class="px-4 py-2 text-right">الساعات</th>
                          <th class="px-4 py-2 text-right">الدرجة</th>
                          <th class="px-4 py-2 text-right">الحالة</th>
                          <th class="px-4 py-2 text-right">الشهادة</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${records.map(r => `
                          <tr class="border-t">
                            <td class="px-4 py-2">${r.program_name}</td>
                            <td class="px-4 py-2">${r.session_name}</td>
                            <td class="px-4 py-2">${r.total_hours || '-'}</td>
                            <td class="px-4 py-2">
                              <span class="font-bold ${r.final_score >= 90 ? 'text-green-600' : r.final_score >= 70 ? 'text-blue-600' : 'text-gray-600'}">
                                ${r.final_score || '-'}
                              </span>
                            </td>
                            <td class="px-4 py-2">
                              <span class="px-2 py-1 rounded-full text-xs ${
                                r.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                r.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }">
                                ${r.status === 'COMPLETED' ? 'مكتمل' : r.status === 'IN_PROGRESS' ? 'جاري' : 'منسحب'}
                              </span>
                            </td>
                            <td class="px-4 py-2">
                              ${r.certificate_number ? `
                                <a href="#" class="text-blue-600 hover:underline text-xs">${r.certificate_number}</a>
                              ` : '-'}
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : `
                  <p class="text-gray-500 text-center py-4">لا توجد سجلات تدريبية</p>
                `}
              </div>
            `;
          })).then(html => html.join(''))}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="text-red-600">خطأ في تحميل السجلات: ${error.message}</div>`;
  }
}

async function renderAssessments(container, entityId) {
  try {
    const sessions = await fetchAPI(`/training-sessions?entity_id=${entityId}&status=IN_PROGRESS`);
    
    let html = `
      <div class="space-y-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">تقييم المتدربين (Evaluation)</h3>
        </div>`;
        
    if (sessions.length === 0) {
      html += `<div class="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">لا توجد دورات تدريبية جارية حالياً للتقييم</div>`;
    } else {
      html += `<div class="grid gap-6">`;
      for (const session of sessions) {
        const enrollments = await fetchAPI(`/enrollments?session_id=${session.id}&status=ATTENDING`);
        
        html += `
          <div class="border rounded-lg p-6 bg-white shadow-sm">
            <h4 class="font-bold text-lg mb-2 text-blue-600">${session.session_name}</h4>
            <div class="flex gap-4 text-sm text-gray-600 mb-4">
              <span><i class="fas fa-book ml-1"></i> ${session.program_name}</span>
              <span><i class="fas fa-calendar ml-1"></i> ${new Date(session.end_date).toLocaleDateString('ar-SA')}</span>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-right">المتدرب</th>
                    <th class="px-4 py-2 text-right">الهوية</th>
                    <th class="px-4 py-2 text-right">الحضور</th>
                    <th class="px-4 py-2 text-right">التقييم</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  ${enrollments.map(e => `
                    <tr>
                      <td class="px-4 py-3 font-medium">${e.full_name}</td>
                      <td class="px-4 py-3 text-gray-500">${e.national_id}</td>
                      <td class="px-4 py-3">
                        <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">95%</span>
                      </td>
                      <td class="px-4 py-3">
                        <button onclick="app.openAssessmentModal(${e.id}, '${e.full_name}', ${session.program_id})" class="text-blue-600 hover:text-blue-800 font-medium">
                          <i class="fas fa-edit ml-1"></i> رصد الدرجات
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ${enrollments.length === 0 ? '<p class="text-center py-4 text-gray-500">لا يوجد متدربين مسجلين</p>' : ''}
            </div>
          </div>
        `;
      }
      html += `</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
    
  } catch (error) {
    container.innerHTML = `<div class="text-red-600">خطأ في تحميل التقييمات: ${error.message}</div>`;
  }
}

async function renderRenewals(container, entityId) {
  try {
    const beneficiaries = await fetchAPI(`/beneficiaries?entity_id=${entityId}`);
    // Get stats
    const stats = await fetchAPI(`/incubator/stats?entity_id=${entityId}`);
    
    container.innerHTML = `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-red-50 p-4 rounded-lg border border-red-100">
            <h4 class="text-red-800 font-bold text-sm">شهادات منتهية</h4>
            <p class="text-2xl font-bold text-red-600 mt-1">${stats.expired_certificates || 0}</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <h4 class="text-yellow-800 font-bold text-sm">تشارف على الانتهاء (30 يوم)</h4>
            <p class="text-2xl font-bold text-yellow-600 mt-1">2</p> <!-- Mock data for demo -->
          </div>
          <div class="bg-green-50 p-4 rounded-lg border border-green-100">
            <h4 class="text-green-800 font-bold text-sm">شهادات سارية</h4>
            <p class="text-2xl font-bold text-green-600 mt-1">${stats.active_certificates || 0}</p>
          </div>
        </div>

        <div class="bg-white rounded-lg border p-6">
          <h3 class="font-bold text-lg mb-4 text-gray-800">البحث عن شهادة للتجديد</h3>
          <div class="flex gap-4 mb-6">
            <input type="text" placeholder="رقم الهوية الوطنية أو رقم الشهادة..." class="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
            <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold">
              <i class="fas fa-search ml-2"></i> بحث
            </button>
          </div>
          
          <div class="border-t pt-4">
            <h4 class="font-bold text-sm text-gray-500 mb-3 uppercase tracking-wider">سجل التجديدات والمتابعة</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-right">المستفيد</th>
                    <th class="px-4 py-2 text-right">الشهادة القديمة</th>
                    <th class="px-4 py-2 text-right">تاريخ التجديد</th>
                    <th class="px-4 py-2 text-right">النوع</th>
                    <th class="px-4 py-2 text-right">الشهادة الجديدة</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                   <!-- Placeholder data until API connected -->
                   <tr>
                    <td class="px-4 py-3 font-medium">محمد بن أحمد العتيبي</td>
                    <td class="px-4 py-3 text-red-500 font-mono text-xs">INC03-SAF101-2023-001</td>
                    <td class="px-4 py-3">2024-02-16</td>
                    <td class="px-4 py-3">تجديد قياسي</td>
                    <td class="px-4 py-3 text-green-600 font-mono text-xs font-bold">INC03-SAF101-2024-001</td>
                   </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="text-red-600">خطأ في تحميل التجديدات: ${error.message}</div>`;
  }
}

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