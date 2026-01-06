/**
 * NAYOSH ERP - SaaS Multi-Tenant Architecture
 * Features: Strict Isolation, Tenant Scopes, Subscription Mgmt
 */

const app = (() => {
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
        BLUE: {
            name: 'سماء زرقاء (Default)',
            colors: { 50: '240 249 255', 100: '224 242 254', 400: '56 189 248', 500: '14 165 233', 600: '2 132 199', 800: '7 89 133', 900: '12 74 110' },
            preview: 'bg-sky-500'
        },
        PURPLE: {
            name: 'بنفسجي ملكي',
            colors: { 50: '250 245 255', 100: '243 232 255', 400: '192 132 252', 500: '168 85 247', 600: '147 51 234', 800: '107 33 168', 900: '88 28 135' },
            preview: 'bg-purple-500'
        },
        EMERALD: {
            name: 'أخضر الطبيعة',
            colors: { 50: '236 253 245', 100: '209 250 229', 400: '52 211 153', 500: '16 185 129', 600: '5 150 105', 800: '6 95 70', 900: '6 78 59' },
            preview: 'bg-emerald-500'
        },
        ROSE: {
            name: 'وردي أنيق',
            colors: { 50: '255 241 242', 100: '255 228 230', 400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 800: '159 18 57', 900: '136 19 55' },
            preview: 'bg-rose-500'
        },
        AMBER: {
            name: 'ذهبي فاخر',
            colors: { 50: '255 251 235', 100: '254 243 199', 400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 800: '146 64 14', 900: '120 53 15' },
            preview: 'bg-amber-500'
        }
    };

    const SUBSCRIPTION_PLANS = {
        BASIC: { name: 'أساسي', price: 999, limit: 10, features: ['إدارة المهام', 'إعلانات محلية'] },
        PRO: { name: 'احترافي', price: 2499, limit: 50, features: ['تحليلات متقدمة', 'إعلانات متعددة', 'API Access'] },
        ENTERPRISE: { name: 'مؤسسات', price: 4999, limit: 999, features: ['دعم 24/7', 'نطاق خاص', 'عزل كامل'] }
    };

    // --- 5 LEVEL AD PUBLISHING RULES ---
    const AD_LEVELS = {
        L1_LOCAL: { 
            id: 1, key: 'L1_LOCAL', label: 'محلي (Tenant Only)', desc: 'داخل نطاق المستأجر فقط', cost: 0, approval: false, 
            badgeClass: 'bg-gray-100 text-gray-600 border-gray-200', gradient: 'from-gray-50 to-gray-100', chartColor: '#94a3b8' 
        },
        L2_MULTI: { 
            id: 2, key: 'L2_MULTI', label: 'متعدد الفروع (Paid)', desc: 'نشر لعدة فروع مختارة', cost: 500, approval: true, 
            badgeClass: 'bg-blue-100 text-blue-600 border-blue-200', gradient: 'from-blue-50 to-cyan-50', chartColor: '#3b82f6' 
        },
        L3_INC_INT: { 
            id: 3, key: 'L3_INC_INT', label: 'داخل الحاضنة', desc: 'لجميع منسوبي الحاضنة', cost: 100, approval: false, 
            badgeClass: 'bg-orange-100 text-orange-600 border-orange-200', gradient: 'from-orange-50 to-amber-50', chartColor: '#f97316' 
        },
        L4_PLT_INT: { 
            id: 4, key: 'L4_PLT_INT', label: 'داخل المنصة', desc: 'لجميع مستخدمي النظام الرقمي', cost: 1000, approval: true, 
            badgeClass: 'bg-green-100 text-green-600 border-green-200', gradient: 'from-emerald-50 to-teal-50', chartColor: '#10b981' 
        },
        L5_CROSS_INC: { 
            id: 5, key: 'L5_CROSS_INC', label: 'شبكة SaaS العالمية', desc: 'إعلان عابر لجميع المستأجرين', cost: 1500, approval: true, 
            badgeClass: 'bg-purple-100 text-purple-600 border-purple-200', gradient: 'from-violet-50 to-fuchsia-50', chartColor: '#8b5cf6' 
        }
    };

    // --- DATA LAYER (Multi-Tenant) ---
    const db = {
        users: [
            { id: 1, name: 'م. أحمد العلي', role: ROLES.ADMIN, tenantType: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي' },
            { id: 2, name: 'سارة محمد', role: ROLES.ADMIN, tenantType: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول' },
            { id: 3, name: 'د. خالد الزهراني', role: ROLES.ADMIN, tenantType: 'INCUBATOR', entityId: 'INC03', entityName: 'حاضنة السلامة' },
            { id: 4, name: 'فريق التقنية', role: ROLES.ADMIN, tenantType: 'PLATFORM', entityId: 'PLT01', entityName: 'نايوش كلاود' },
            { id: 5, name: 'يوسف المكتب', role: ROLES.ADMIN, tenantType: 'OFFICE', entityId: 'OFF01', entityName: 'مكتب الدمام' },
            { id: 6, name: 'أ. منى المالية', role: ROLES.FINANCE, tenantType: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي' },
            { id: 7, name: 'خدمة العملاء', role: ROLES.SUPPORT, tenantType: 'PLATFORM', entityId: 'PLT01', entityName: 'نايوش كلاود' },
            { id: 8, name: 'كريم التسويق', role: ROLES.ADVERTISER, tenantType: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول' },
            { id: 9, name: 'فهد السبيعي', role: ROLES.ADMIN, tenantType: 'BRANCH', entityId: 'BR016', entityName: 'فرع مول الرياض' },
            { id: 10, name: 'زائر النظام', role: ROLES.USER, tenantType: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول' }
        ],

        // Entities act as Tenants in this SaaS model
        entities: [
            { id: 'HQ001', name: 'المكتب الرئيسي', type: 'HQ', status: 'Active', balance: 2500000, location: 'الرياض', users: 15, plan: 'ENTERPRISE', expiry: '2030-12-31', theme: 'BLUE' },
            { id: 'BR015', name: 'فرع العليا مول', type: 'BRANCH', status: 'Active', balance: 45000, location: 'الرياض - العليا', users: 8, plan: 'PRO', expiry: '2024-06-15', theme: 'BLUE' },
            { id: 'BR016', name: 'فرع مول الرياض', type: 'BRANCH', status: 'Active', balance: 32000, location: 'الرياض - النخيل', users: 12, plan: 'BASIC', expiry: '2024-05-20', theme: 'BLUE' },
            { id: 'INC03', name: 'حاضنة السلامة', type: 'INCUBATOR', status: 'Active', balance: 120000, location: 'جدة', users: 45, plan: 'ENTERPRISE', expiry: '2025-01-01', theme: 'EMERALD' },
            { id: 'INC04', name: 'حاضنة الرياض تك', type: 'INCUBATOR', status: 'Active', balance: 200000, location: 'الرياض', users: 60, plan: 'ENTERPRISE', expiry: '2025-03-01', theme: 'AMBER' },
            { id: 'PLT01', name: 'نايوش كلاود', type: 'PLATFORM', status: 'Active', balance: 500000, location: 'سحابي', users: 1200, plan: 'PRO', expiry: '2024-11-30', theme: 'PURPLE' },
            { id: 'OFF01', name: 'مكتب الدمام', type: 'OFFICE', status: 'Active', balance: 15000, location: 'الدمام', users: 4, plan: 'BASIC', expiry: '2024-04-10', theme: 'BLUE' }
        ],

        ads: [
            { id: 1, title: 'تحديث سياسات SaaS 2024', content: 'نلفت انتباه جميع المستأجرين لتحديث السياسات.', level: 'L5_CROSS_INC', scope: 'GLOBAL', status: 'ACTIVE', sourceEntityId: 'HQ001', targetIds: [], date: '2023-11-20', cost: 0, sourceType: 'HQ' },
            { id: 2, title: 'اجتماع داخلي - العليا', content: 'مناقشة تارجت الشهر القادم.', level: 'L1_LOCAL', scope: 'LOCAL', status: 'ACTIVE', sourceEntityId: 'BR015', targetIds: ['BR015'], date: '2023-11-21', cost: 0, sourceType: 'BRANCH' },
            { id: 3, title: 'عرض مشترك للفروع', content: 'خصم موحد 15%.', level: 'L2_MULTI', scope: 'MULTI', status: 'ACTIVE', sourceEntityId: 'BR015', targetIds: ['BR015', 'BR016'], date: '2023-11-22', cost: 500, sourceType: 'BRANCH' },
            { id: 4, title: 'ورشة رواد الأعمال', content: 'مخصصة لمنسوبي الحاضنة.', level: 'L3_INC_INT', scope: 'INCUBATOR', status: 'ACTIVE', sourceEntityId: 'INC03', targetIds: ['INC03'], date: '2023-11-23', cost: 100, sourceType: 'INCUBATOR' },
            { id: 6, title: 'صيانة المنصة السحابية', content: 'وقت توقف مجدول.', level: 'L4_PLT_INT', scope: 'PLATFORM', status: 'ACTIVE', sourceEntityId: 'PLT01', targetIds: [], date: '2023-11-25', cost: 1000, sourceType: 'PLATFORM' }
        ],

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

    let currentUser = db.users[0];
    let activeChart = null;

    // --- ISOLATION & PERMISSIONS LAYER ---
    const perms = {
        isHQ: () => currentUser.tenantType === 'HQ',
        isAdmin: () => currentUser.role === ROLES.ADMIN,
        isFinance: () => currentUser.role === ROLES.FINANCE,
        isSupport: () => currentUser.role === ROLES.SUPPORT,
        canManageAds: () => perms.isAdmin() || currentUser.role === ROLES.ADVERTISER,
        canViewAuditLogs: () => perms.isAdmin(),

        // SaaS Isolation Logic
        getVisibleEntities: () => {
            // HQ sees all tenants, Tenants see only themselves
            if (perms.isHQ()) return db.entities;
            return db.entities.filter(e => e.id === currentUser.entityId);
        },

        getVisibleTasks: () => {
            // STRICT ISOLATION: Tasks are private to the tenant
            return db.tasks.filter(t => t.entityId === currentUser.entityId);
        },

        getVisibleTickets: () => {
            // STRICT ISOLATION unless HQ Support
            if (perms.isHQ() && perms.isSupport()) return db.tickets;
            return db.tickets.filter(t => t.entityId === currentUser.entityId);
        },
        
        getVisibleAds: () => {
            return db.ads.filter(ad => {
                // 1. Own Tenant Ads (Always visible)
                if (ad.sourceEntityId === currentUser.entityId) return true;
                
                // 2. HQ Broadcasts (Visible to all tenants)
                if (ad.sourceType === 'HQ') return true;

                // 3. Explicit Targeting (Shared Ads)
                if (ad.targetIds.includes(currentUser.entityId) && ad.status === 'ACTIVE') return true;

                // 4. Platform Global Ads
                if (ad.level === 'L4_PLT_INT') return true;

                return false;
            }).sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        getVisibleAuditLogs: () => {
             if (perms.isHQ() && perms.isAdmin()) return db.auditLogs;
             return db.auditLogs.filter(l => l.entityId === currentUser.entityId);
        }
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

    // --- INIT & NAV ---
    const init = () => {
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
            // Open Menu
            sidebar.classList.remove('translate-x-full');
            sidebar.classList.add('translate-x-0');
            
            backdrop.classList.remove('hidden');
            // Small delay to allow display:block to apply before opacity transition
            requestAnimationFrame(() => {
                backdrop.classList.remove('opacity-0');
            });
        } else {
            // Close Menu
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('translate-x-full');
            
            backdrop.classList.add('opacity-0');
            setTimeout(() => {
                backdrop.classList.add('hidden');
            }, 300);
        }
    };

    const switchUser = (id) => {
        const u = db.users.find(x => x.id === id);
        if (u) {
            toggleRoleMenu();
            
            // Close mobile menu if open
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('translate-x-0') && window.innerWidth < 768) {
                toggleMobileMenu();
            }

            currentUser = u;
            const tenant = db.entities.find(e => e.id === currentUser.entityId);
            if(tenant && tenant.theme) updateThemeVariables(tenant.theme);

            // Visual Loading State
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
                renderSidebar(); 
                updateHeader(); 
                loadRoute('dashboard');
                showToast(`أنت الآن في نطاق: ${currentUser.entityName}`, 'success');
            }, 800);
        }
    };

    const toggleRoleMenu = (event) => {
        if (event) event.stopPropagation();
        const menu = document.getElementById('role-menu');
        const chevron = document.getElementById('role-chevron');
        if (menu.classList.contains('hidden')) {
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
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = TENANT_TYPES[currentUser.tenantType].label;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        document.getElementById('tenant-id-display').innerText = currentUser.entityId;
        document.getElementById('tenant-badge').className = `hidden md:flex items-center gap-2 border px-3 py-1 rounded-full animate-fade-in ${TENANT_TYPES[currentUser.tenantType].bg} ${TENANT_TYPES[currentUser.tenantType].color} border-current border-opacity-20`;
    };

    const loadRoute = (route) => {
        // Close mobile menu if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('translate-x-0') && window.innerWidth < 768) {
            toggleMobileMenu();
        }

        const view = document.getElementById('main-view');
        document.getElementById('page-title').innerText = getTitle(route);
        if (activeChart) { activeChart.destroy(); activeChart = null; }
        
        let content = '';
        // Routing Logic
        if (route === 'dashboard') content = renderDashboard();
        else if (route === 'saas') content = renderSaaSManager();
        else if (route === 'ads') content = renderAdsManager();
        else if (route === 'entities') content = renderEntitiesManager();
        else if (route === 'register-tenant') content = renderTenantRegistration();
        else if (route === 'tasks') content = renderTasksManager();
        else if (route === 'audit-logs') content = renderAuditLogs();
        else if (route === 'settings') content = renderSettings();
        else content = renderPlaceholder();

        view.innerHTML = `<div class="fade-in">${content}</div>`;
        updateActiveLink(route);

        if (route === 'dashboard') requestAnimationFrame(initDashboardChart);
    };

    const updateActiveLink = (route) => {
        document.querySelectorAll('#nav-menu a').forEach(l => {
            // Remove active styles
            l.classList.remove('bg-gradient-to-r', 'from-brand-600/20', 'to-brand-600/5', 'text-white', 'border-r-4', 'border-brand-500');
            // Add inactive hover text style if needed
            l.classList.add('text-slate-400');
        });
        
        const active = document.getElementById(`link-${route}`);
        if(active) {
            active.classList.remove('text-slate-400');
            active.classList.add('bg-gradient-to-r', 'from-brand-600/20', 'to-brand-600/5', 'text-white', 'border-r-4', 'border-brand-500');
        } else if(route === 'register-tenant') {
             // Keep entities active if registering
             const entitiesLink = document.getElementById('link-entities');
             if(entitiesLink) {
                 entitiesLink.classList.remove('text-slate-400');
                 entitiesLink.classList.add('bg-gradient-to-r', 'from-brand-600/20', 'to-brand-600/5', 'text-white', 'border-r-4', 'border-brand-500');
             }
        }
    };

    const getTitle = (r) => {
        const map = { 
            'dashboard': 'لوحة القيادة (Tenant Dashboard)',
            'saas': 'إدارة الاشتراك والخدمات (SaaS)',
            'entities': perms.isHQ() ? 'إدارة المستأجرين' : 'بيانات الكيان',
            'register-tenant': 'تسجيل مستأجر جديد',
            'ads': 'منصة الإعلانات المركزية',
            'tasks': 'المهام الداخلية',
            'audit-logs': 'سجل الأحداث (Audit Logs)',
            'settings': 'إعدادات الهوية والعلامة التجارية'
        };
        return map[r] || 'نايوش SaaS';
    };

    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        const items = [
            { id: 'dashboard', icon: 'fa-chart-pie', label: 'الرئيسية', show: true },
            { id: 'saas', icon: 'fa-cubes', label: perms.isHQ() ? 'إدارة الاشتراكات' : 'اشتراكي (SaaS)', show: true },
            { id: 'entities', icon: 'fa-sitemap', label: perms.isHQ() ? 'المستأجرين' : 'فرعي/كياني', show: true },
            { id: 'ads', icon: 'fa-bullhorn', label: 'الإعلانات', show: true },
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
                </a>
            </li>`
        ).join('');
    };

    // --- DASHBOARD --- 
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
                 ${renderKpiCard('المحفظة الرقمية', (perms.isFinance() || perms.isAdmin()) ? entity.balance.toLocaleString() : '****', 'fa-wallet', 'text-teal-600', 'bg-teal-50')}
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

    // --- VIEWS ---
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
                <!-- Plan Upgrade Options Mockup -->
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
                ${perms.canManageAds() ? `<button onclick="app.openAdBuilderModal()" class="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition">+ نشر إعلان</button>` : ''}
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
            <div class="text-center mb-8">
                <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800">تسجيل مستأجر جديد</h2>
                <p class="text-slate-500 mt-2">إنشاء بيئة عمل جديدة وتخصيص الموارد</p>
            </div>

            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6 md:p-8">
                <div class="grid grid-cols-1 gap-8">
                    <!-- Step 1: Basic Info -->
                    <div>
                        <h4 class="text-lg font-bold text-slate-800 mb-4 border-b pb-2">1. بيانات المؤسسة</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-slate-600 mb-2">اسم المستأجر (Tenant Name)</label>
                                <input type="text" id="reg-name" placeholder="مثال: فرع النخيل" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-600 mb-2">الموقع (Location)</label>
                                <input type="text" id="reg-location" placeholder="المدينة - الحي" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition">
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Tenant Type -->
                    <div>
                        <h4 class="text-lg font-bold text-slate-800 mb-4 border-b pb-2">2. نوع الكيان (Tenant Type)</h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            ${Object.values(TENANT_TYPES).filter(t => t.id !== 'HQ').map(t => `
                                <label class="cursor-pointer relative">
                                    <input type="radio" name="reg-type" value="${t.id}" class="peer sr-only">
                                    <div class="p-4 rounded-xl border-2 border-slate-100 hover:border-brand-200 peer-checked:border-brand-500 peer-checked:bg-brand-50 transition-all text-center group">
                                        <i class="fas ${t.icon} text-2xl mb-2 ${t.color} group-hover:scale-110 transition"></i>
                                        <div class="text-xs font-bold text-slate-600">${t.label.split(' ')[0]} ${t.label.split(' ')[1]}</div>
                                    </div>
                                    <div class="absolute top-2 left-2 text-brand-500 opacity-0 peer-checked:opacity-100 transition"><i class="fas fa-check-circle"></i></div>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Step 3: Plan -->
                    <div>
                        <h4 class="text-lg font-bold text-slate-800 mb-4 border-b pb-2">3. خطة الاشتراك (Plan)</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${Object.keys(SUBSCRIPTION_PLANS).map(key => {
                                const p = SUBSCRIPTION_PLANS[key];
                                return `
                                <label class="cursor-pointer relative">
                                    <input type="radio" name="reg-plan" value="${key}" class="peer sr-only">
                                    <div class="p-4 rounded-xl border-2 border-slate-100 hover:border-brand-200 peer-checked:border-brand-500 peer-checked:bg-gradient-to-br peer-checked:from-brand-50 peer-checked:to-white transition-all">
                                        <div class="font-bold text-slate-800">${p.name}</div>
                                        <div class="text-xl font-black text-brand-600 mt-1">${p.price} <span class="text-xs text-gray-400 font-normal">ر.س</span></div>
                                        <ul class="mt-3 space-y-1 text-xs text-gray-500">
                                            ${p.features.slice(0,2).map(f => `<li><i class="fas fa-check text-green-500 ml-1"></i>${f}</li>`).join('')}
                                        </ul>
                                    </div>
                                </label>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Submit -->
                    <div class="pt-4 flex flex-col-reverse md:flex-row justify-end gap-3">
                        <button onclick="app.loadRoute('entities')" class="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition">إلغاء</button>
                        <button onclick="app.submitTenantRegistration()" class="px-8 py-3 rounded-xl font-bold bg-brand-600 text-white shadow-lg hover:shadow-brand-500/30 hover:bg-brand-700 hover:scale-105 transition transform">
                            <i class="fas fa-plus-circle ml-2"></i> إنشاء المستأجر
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    };

    const submitTenantRegistration = () => {
        const name = document.getElementById('reg-name').value;
        const location = document.getElementById('reg-location').value;
        const type = document.querySelector('input[name="reg-type"]:checked')?.value;
        const plan = document.querySelector('input[name="reg-plan"]:checked')?.value;

        if (!name || !location || !type || !plan) {
            showToast('الرجاء تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }

        // Generate ID
        const idPrefix = type === 'BRANCH' ? 'BR' : type === 'INCUBATOR' ? 'INC' : 'TNT';
        const newId = idPrefix + Math.floor(100 + Math.random() * 900);

        // Create Entity
        const newEntity = {
            id: newId,
            name: name,
            type: type,
            status: 'Active',
            balance: 0,
            location: location,
            users: 1,
            plan: plan,
            expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
            theme: 'BLUE'
        };
        db.entities.push(newEntity);

        // Create Default Admin
        const newAdmin = {
            id: db.users.length + 1,
            name: 'مسؤول جديد',
            role: ROLES.ADMIN,
            tenantType: type,
            entityId: newId,
            entityName: name
        };
        db.users.push(newAdmin);

        logAction('CREATE_TENANT', `Created new tenant ${name} (${newId})`);
        showToast(`تم إنشاء المستأجر ${name} بنجاح!`, 'success');
        loadRoute('entities');
    };

    const renderAdsManager = () => {
        const ads = perms.getVisibleAds();
        return `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-slate-800">إدارة الحملات الإعلانية</h2>
            ${perms.canManageAds() ? `<button onclick="app.openAdBuilderModal()" class="bg-brand-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition">+ حملة جديدة</button>` : ''}
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
             <table class="w-full text-right whitespace-nowrap">
                <thead class="bg-slate-50/80 text-xs text-slate-500 font-bold uppercase tracking-wider"><tr><th class="p-5">العنوان</th><th class="p-5">المستوى</th><th class="p-5">الحالة</th></tr></thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${ads.map(ad => `
                        <tr class="hover:bg-slate-50">
                            <td class="p-5 font-bold text-slate-700">${ad.title}</td>
                            <td class="p-5"><span class="text-[10px] font-bold px-2 py-1 rounded border bg-gray-50">${ad.level}</span></td>
                            <td class="p-5"><span class="px-2 py-1 rounded-full text-[10px] font-bold ${ad.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">${ad.status}</span></td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    };

    const renderTasksManager = () => {
        const tasks = perms.getVisibleTasks();
        if (tasks.length === 0) return renderPlaceholder('لا توجد مهام نشطة لهذا المستأجر');
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">المهام الداخلية (${tasks.length})</h2>
        <div class="grid gap-4">
            ${tasks.map(t => `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div><h4 class="font-bold text-slate-800">${t.title}</h4><p class="text-xs text-slate-500">${t.type} | ${t.dueDate}</p></div>
                    <span class="px-2 py-1 rounded text-xs bg-slate-100 w-fit">${t.status}</span>
                </div>
            `).join('')}
        </div>`;
    };

    const renderSettings = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        if (!perms.isAdmin()) return renderPlaceholder();

        return `
        <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl md:text-3xl font-extrabold text-slate-800">خصائص العلامة التجارية</h2>
                    <p class="text-slate-500 mt-2">تخصيص هوية المستأجر والواجهة</p>
                </div>
                <div class="hidden md:block">
                    <div class="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-4 py-2 rounded-lg flex items-center gap-2">
                        <i class="fas fa-magic"></i> معاينة حية (Live Preview)
                    </div>
                </div>
            </div>

            <!-- Color Theme Section -->
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-50">
                    <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <i class="fas fa-palette text-brand-500"></i> ألوان الهوية (Theme Color)
                    </h3>
                    <p class="text-sm text-slate-400 mt-1">اختر لوحة الألوان الأساسية لواجهة النظام الخاصة بكيانك</p>
                </div>
                <div class="p-6 md:p-8">
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        ${Object.entries(THEMES).map(([key, theme]) => `
                            <label class="cursor-pointer group relative">
                                <input type="radio" name="theme-select" value="${key}" onchange="app.previewTheme('${key}')" class="peer sr-only" ${entity.theme === key ? 'checked' : ''}>
                                <div class="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-300 peer-checked:border-brand-500 peer-checked:bg-slate-50 transition-all">
                                    <div class="w-12 h-12 rounded-full ${theme.preview} shadow-lg ring-4 ring-white group-hover:scale-110 transition-transform"></div>
                                    <span class="text-xs font-bold text-slate-600 text-center peer-checked:text-brand-600">${theme.name}</span>
                                </div>
                                <div class="absolute top-2 right-2 text-brand-600 opacity-0 peer-checked:opacity-100 transition">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Branding & Logo Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6">
                    <h3 class="font-bold text-lg text-slate-800 mb-4">شعار المستأجر (Logo)</h3>
                    <div class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition cursor-pointer group">
                        <div class="w-16 h-16 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            <i class="fas fa-cloud-upload-alt"></i>
                        </div>
                        <p class="text-sm font-bold text-slate-600">اضغط لرفع الشعار</p>
                        <p class="text-xs text-slate-400 mt-1">PNG, JPG (Max 2MB)</p>
                    </div>
                 </div>

                 <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden p-6">
                    <h3 class="font-bold text-lg text-slate-800 mb-4">اسم العرض (Display Name)</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-2">الاسم الظاهر في النظام</label>
                            <input type="text" value="${entity.name}" id="settings-name" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition font-bold text-slate-700">
                        </div>
                        <p class="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                            <i class="fas fa-info-circle text-brand-500 mr-1"></i> 
                            تغيير الاسم قد يتطلب موافقة من الإدارة العليا (HQ) في بعض الحالات.
                        </p>
                    </div>
                 </div>
            </div>

            <div class="flex justify-end pt-4">
                <button onclick="app.saveSettings()" class="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-brand-500/40 hover:-translate-y-1 transition transform flex items-center gap-2">
                    <i class="fas fa-save"></i> حفظ التغييرات
                </button>
            </div>
        </div>`;
    };

    const previewTheme = (key) => {
        updateThemeVariables(key);
    };

    const saveSettings = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        const newName = document.getElementById('settings-name').value;
        const newTheme = document.querySelector('input[name="theme-select"]:checked')?.value;

        if(entity) {
            entity.name = newName;
            entity.theme = newTheme;
            
            // Refresh session info if name changed
            if(entity.id === currentUser.entityId) {
                currentUser.entityName = newName;
            }
            
            updateHeader(); // Update displayed name
            updateThemeVariables(newTheme); // Ensure theme is applied properly
            
            showToast('تم حفظ إعدادات الهوية بنجاح!', 'success');
            logAction('UPDATE_SETTINGS', `Updated Branding: ${newTheme}`);
        }
    };

    const renderAuditLogs = () => {
        if (!perms.canViewAuditLogs()) return renderPlaceholder();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">سجلات النظام (Audit Trail)</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
             <table class="w-full text-right whitespace-nowrap">
                <thead class="bg-slate-50/80 text-xs text-slate-500 font-bold uppercase"><tr><th class="p-4">الوقت</th><th class="p-4">المستخدم</th><th class="p-4">الحدث</th><th class="p-4">التفاصيل</th></tr></thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${perms.getVisibleAuditLogs().map(log => `
                        <tr class="hover:bg-slate-50">
                            <td class="p-4 text-gray-400 font-mono text-xs">${log.timestamp}</td>
                            <td class="p-4 font-bold text-slate-700">${log.user}</td>
                            <td class="p-4 font-bold text-brand-600">${log.action}</td>
                            <td class="p-4 text-gray-500">${log.details}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    };

    const renderPlaceholder = (msg = 'لا تملك صلاحية الوصول') => `
        <div class="flex flex-col items-center justify-center h-96 text-center animate-fade-in px-4">
            <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner"><i class="fas fa-lock text-4xl text-slate-400"></i></div>
            <h3 class="text-2xl font-bold text-slate-700">وصول مقيد (Tenant Isolation)</h3>
            <p class="text-slate-500 mt-2 max-w-md mx-auto">${msg}</p>
        </div>`;

    const openAdBuilderModal = () => {
        const modal = document.createElement('div');
        modal.id = 'ad-modal';
        modal.className = 'fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center backdrop-blur-sm fade-in p-4';
        const levelsHtml = Object.values(AD_LEVELS).map(l => 
            `<label class="relative flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-all duration-200 group border-slate-200 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="adLevel" value="${l.key}" class="peer w-4 h-4 text-brand-600 focus:ring-brand-500">
                <div class="flex-1">
                    <div class="flex justify-between items-center mb-1"><span class="font-bold text-sm text-slate-800 peer-checked:text-brand-800">${l.label}</span><span class="text-[10px] font-bold bg-white border px-2 py-0.5 rounded text-slate-500 shadow-sm">${l.cost} ر.س</span></div>
                    <span class="block text-xs text-slate-500 peer-checked:text-brand-600">${l.desc}</span>
                </div>
            </label>`
        ).join('');
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95 animate-scale-up">
                <div class="bg-slate-900 text-white p-5 flex justify-between items-center">
                    <h3 class="font-bold text-lg">إنشاء حملة جديدة</h3>
                    <button onclick="document.getElementById('ad-modal').remove()" class="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <div><label class="block text-xs font-bold text-slate-700 mb-2">عنوان الحملة</label><input type="text" id="ad-title" class="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"></div>
                    <div><label class="block text-xs font-bold text-slate-700 mb-2">نطاق النشر (Targeting)</label><div class="grid grid-cols-1 gap-3">${levelsHtml}</div></div>
                    <button onclick="app.submitAd()" class="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition">تأكيد ونشر</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    };

    const submitAd = () => {
        const title = document.getElementById('ad-title').value;
        const levelKey = document.querySelector('input[name="adLevel"]:checked')?.value;
        if (title && levelKey) {
            db.ads.unshift({ id: db.ads.length + 1, title, content: 'محتوى تجريبي...', level: levelKey, scope: 'LOCAL', status: 'ACTIVE', cost: 0, sourceEntityId: currentUser.entityId, targetIds: [currentUser.entityId], date: new Date().toISOString().slice(0,10), sourceType: currentUser.tenantType });
            document.getElementById('ad-modal').remove();
            showToast('تم نشر الإعلان بنجاح', 'success');
            loadRoute('ads');
        }
    };

    // Expose functions
    return { 
        init, 
        switchUser, 
        loadRoute, 
        openAdBuilderModal, 
        submitAd, 
        toggleRoleMenu, 
        submitTenantRegistration,
        renderSettings,
        saveSettings,
        previewTheme,
        toggleMobileMenu
    };
})();

document.addEventListener('DOMContentLoaded', app.init);