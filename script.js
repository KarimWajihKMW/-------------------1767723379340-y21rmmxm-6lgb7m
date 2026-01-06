/**
 * NAYOSH ERP - Comprehensive Multi-Tenant System
 * Includes: Operations, Clients, Subscriptions, Reports, Team Management, Ads Engine
 */

const app = (() => {
    // --- CONFIGURATION: ROLES & PERMISSIONS ---
    const ROLES = {
        SUPER_ADMIN: 'SUPER_ADMIN',
        MANAGER: 'MANAGER',
        ACCOUNTANT: 'ACCOUNTANT',
        EMPLOYEE: 'EMPLOYEE',
        CLIENT: 'CLIENT'
    };

    const TENANT_TYPES = {
        HQ: 'HQ',
        BRANCH: 'BRANCH',
        INCUBATOR: 'INCUBATOR',
        PLATFORM: 'PLATFORM',
        OFFICE: 'OFFICE'
    };

    // --- DATA LAYER (Expanded) ---
    const db = {
        users: [
            { id: 1, name: 'م. أحمد العلي', role: ROLES.SUPER_ADMIN, tenantType: TENANT_TYPES.HQ, entityId: 'HQ001', entityName: 'المكتب الرئيسي', desc: 'مدير عام النظام' },
            { id: 2, name: 'سارة محمد', role: ROLES.MANAGER, tenantType: TENANT_TYPES.BRANCH, entityId: 'BR015', entityName: 'فرع العليا مول', desc: 'مديرة الفرع' },
            { id: 3, name: 'د. خالد الزهراني', role: ROLES.MANAGER, tenantType: TENANT_TYPES.INCUBATOR, entityId: 'INC03', entityName: 'حاضنة السلامة', desc: 'مدير الحاضنة' },
            { id: 4, name: 'فريق التقنية', role: ROLES.MANAGER, tenantType: TENANT_TYPES.PLATFORM, entityId: 'PLT01', entityName: 'نايوش كلاود', desc: 'مدير المنصة' },
            { id: 5, name: 'أستاذة منى', role: ROLES.MANAGER, tenantType: TENANT_TYPES.OFFICE, entityId: 'OFF02', entityName: 'مكتب جدة', desc: 'مديرة المكتب' },
            { id: 6, name: 'سامي المحاسب', role: ROLES.ACCOUNTANT, tenantType: TENANT_TYPES.HQ, entityId: 'HQ001', entityName: 'المكتب الرئيسي', desc: 'محاسب مالي' },
            { id: 7, name: 'ليلى موظفة', role: ROLES.EMPLOYEE, tenantType: TENANT_TYPES.BRANCH, entityId: 'BR015', entityName: 'فرع العليا مول', desc: 'موظفة مبيعات' },
            { id: 8, name: 'عمر الطالب', role: ROLES.CLIENT, tenantType: TENANT_TYPES.INCUBATOR, entityId: 'INC03', entityName: 'حاضنة السلامة', desc: 'طالب (عميل)' }
        ],

        // ADS ENGINE DATA STORE
        ads: [
            { 
                id: 1, 
                title: 'تحديث النظام 2.0', 
                content: 'تم إطلاق واجهة جديدة للنظام، يرجى تحديث الصفحة للحصول على آخر التحديثات.', 
                type: 'info', 
                scope: 'GLOBAL', 
                target: null, 
                entityId: null, 
                date: '2023-11-20', 
                active: true 
            },
            { 
                id: 2, 
                title: 'عرض خاص للفروع', 
                content: 'خصم 50% على الطابعات الحرارية حتى نهاية الشهر لجميع فروع التجزئة.', 
                type: 'promo', 
                scope: 'ALL_TENANTS', 
                target: 'BRANCH', 
                entityId: null, 
                date: '2023-11-21', 
                active: true 
            },
            { 
                id: 3, 
                title: 'تذكير بالاجتماع', 
                content: 'اجتماع فريق المبيعات غداً صباحاً في قاعة الاجتماعات.', 
                type: 'warning', 
                scope: 'LOCAL', 
                target: null, 
                entityId: 'BR015', 
                date: '2023-11-22', 
                active: true 
            },
            { 
                id: 4, 
                title: 'مسابقة الهاكاثون', 
                content: 'فتح باب التسجيل في هاكاثون الابتكار لجميع طلاب الحاضنة والمشاريع المحتضنة.', 
                type: 'success', 
                scope: 'ALL_TENANTS', 
                target: 'INCUBATOR', 
                entityId: null, 
                date: '2023-11-19', 
                active: true 
            },
             { 
                id: 5, 
                title: 'إعلان للعملاء', 
                content: 'تم تمديد فترة التسجيل في الدورات الصيفية.', 
                type: 'info', 
                scope: 'LOCAL', 
                target: null, 
                entityId: 'INC03', 
                date: '2023-11-23', 
                active: true 
            }
        ],

        // HQ Governance Data
        tenants: [
            { id: 'BR015', name: 'فرع العليا مول', type: TENANT_TYPES.BRANCH, manager: 'سارة محمد', status: 'Healthy', performance: 92, revenue: 150000 },
            { id: 'INC03', name: 'حاضنة السلامة', type: TENANT_TYPES.INCUBATOR, manager: 'د. خالد الزهراني', status: 'Warning', performance: 78, revenue: 45000 },
            { id: 'PLT01', name: 'نايوش كلاود', type: TENANT_TYPES.PLATFORM, manager: 'فريق التقنية', status: 'Healthy', performance: 99, revenue: 320000 },
            { id: 'OFF02', name: 'مكتب جدة', type: TENANT_TYPES.OFFICE, manager: 'أستاذة منى', status: 'Critical', performance: 45, revenue: 0 }
        ],

        hqTasks: [
            { id: 1, title: 'اعتماد ميزانية الربع الرابع', deadline: '2023-12-01', priority: 'High', status: 'Pending' },
            { id: 2, title: 'مراجعة عقود الصيانة - فرع العليا', deadline: '2023-11-25', priority: 'Medium', status: 'In Progress' },
            { id: 3, title: 'الموافقة على تعيين مدير جديد', deadline: '2023-11-30', priority: 'High', status: 'Done' }
        ],

        alerts: [
            { id: 1, msg: 'انقطاع الاتصال في فرع العليا مول لمدة 10 دقائق', type: 'error', time: '10:00 AM' },
            { id: 2, msg: 'تم تجاوز الحد الائتماني لمكتب جدة', type: 'warning', time: '09:30 AM' },
            { id: 3, msg: 'اكتمال النسخ الاحتياطي للنظام', type: 'success', time: '02:00 AM' }
        ],

        // Clients / Customers Data
        clients: [
            { id: 101, name: 'شركة التقنية الحديثة', type: 'B2B', entityId: 'PLT01', status: 'Active' },
            { id: 102, name: 'مؤسسة الأفق', type: 'B2B', entityId: 'PLT01', status: 'Active' },
            { id: 201, name: 'أحمد صالح', type: 'Individual', entityId: 'BR015', status: 'VIP' },
            { id: 202, name: 'نورة السعد', type: 'Individual', entityId: 'BR015', status: 'Regular' },
            { id: 301, name: 'عمر الطالب', type: 'Student', entityId: 'INC03', status: 'Active' },
            { id: 302, name: 'فريق مشروع "إنجاز"', type: 'Startup', entityId: 'INC03', status: 'Incubated' },
            { id: 401, name: 'قسم الموارد البشرية', type: 'Internal', entityId: 'OFF02', status: 'Active' }
        ],

        // Subscriptions / Contracts Data
        subscriptions: [
            { id: 'SUB-01', plan: 'Enterprise SaaS', amount: 5000, cycle: 'Monthly', entityId: 'PLT01', client: 'شركة التقنية الحديثة' },
            { id: 'SUB-02', plan: 'Startup Tier', amount: 0, cycle: 'Grant', entityId: 'INC03', client: 'فريق مشروع "إنجاز"' },
            { id: 'SUB-03', plan: 'Loyalty Gold', amount: 0, cycle: 'Lifetime', entityId: 'BR015', client: 'أحمد صالح' },
            { id: 'CON-01', plan: 'عقد نظافة', amount: 2000, cycle: 'Monthly', entityId: 'OFF02', client: 'شركة النظافة المتحدة' }
        ],

        // Team Data
        team: [
            { id: 1, name: 'محمد الفهد', role: 'Sales Rep', entityId: 'BR015', kpi: 85 },
            { id: 2, name: 'هند القحطاني', role: 'Store Keeper', entityId: 'BR015', kpi: 92 },
            { id: 3, name: 'د. يوسف', role: 'Mentor', entityId: 'INC03', kpi: 98 },
            { id: 4, name: 'علي رضا', role: 'DevOps Eng', entityId: 'PLT01', kpi: 95 },
            { id: 5, name: 'سعاد', role: 'Secretary', entityId: 'OFF02', kpi: 88 }
        ],

        // Operations Data (Generic Items)
        operations: [
            { id: 1, type: 'Sale', desc: 'فاتورة #1023', entityId: 'BR015', status: 'Completed', time: '10:30 AM' },
            { id: 2, type: 'Class', desc: 'محاضرة مقدمة في البرمجة', entityId: 'INC03', status: 'In Progress', time: '11:00 AM' },
            { id: 3, type: 'Ticket', desc: 'خطأ 500 في السيرفر', entityId: 'PLT01', status: 'Pending', time: '09:15 AM' },
            { id: 4, type: 'Request', desc: 'طلب صيانة طابعة', entityId: 'OFF02', status: 'New', time: '08:45 AM' }
        ],

        finance: [
            { id: 'TRX-101', desc: 'مبيعات نقدية', amount: 1500, type: 'credit', entityId: 'BR015', date: '2023-11-20' },
            { id: 'TRX-102', desc: 'اشتراك شهري', amount: 5000, type: 'credit', entityId: 'PLT01', date: '2023-11-21' },
            { id: 'TRX-103', desc: 'شراء قرطاسية', amount: -200, type: 'debit', entityId: 'OFF02', date: '2023-11-22' }
        ]
    };

    // --- STATE ---
    let currentUser = db.users[0]; // Default User

    // --- SECURITY & PERMISSIONS ---
    const permissions = {
        // Role Checks
        isManager: () => [ROLES.SUPER_ADMIN, ROLES.MANAGER].includes(currentUser.role),
        isEmployee: () => [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE].includes(currentUser.role),
        isClient: () => currentUser.role === ROLES.CLIENT,
        isHQAdmin: () => currentUser.role === ROLES.SUPER_ADMIN && currentUser.tenantType === TENANT_TYPES.HQ,

        // Feature Access
        canViewOperations: () => !permissions.isClient() && !permissions.isHQ(),
        canViewClients: () => !permissions.isClient() && !permissions.isHQ(),
        canViewSubs: () => !permissions.isHQ(),
        canViewReports: () => permissions.isManager() || currentUser.role === ROLES.ACCOUNTANT,
        canViewTeam: () => permissions.isManager() && !permissions.isHQ(),
        canViewGovernance: () => permissions.isHQ(),
        canManageAds: () => permissions.isHQAdmin() || (permissions.isManager() && !permissions.isHQ()),
        
        // Tenant Checks
        isHQ: () => currentUser.tenantType === TENANT_TYPES.HQ,
        isBranch: () => currentUser.tenantType === TENANT_TYPES.BRANCH,
        isIncubator: () => currentUser.tenantType === TENANT_TYPES.INCUBATOR,
        isPlatform: () => currentUser.tenantType === TENANT_TYPES.PLATFORM,
        isOffice: () => currentUser.tenantType === TENANT_TYPES.OFFICE
    };

    // --- DATA ACCESS ---
    const api = {
        getCurrentUser: () => currentUser,
        getData: (collection) => {
            // Strict Isolation: Users only see data for their EntityID (unless HQ Admin)
            if (permissions.isHQ()) {
                return db[collection];
            }
            return db[collection].filter(item => item.entityId === currentUser.entityId);
        },
        // ADS ENGINE: Filtering Logic
        getAds: () => {
            return db.ads.filter(ad => {
                if (!ad.active) return false;

                // 1. GLOBAL: Visible to everyone
                if (ad.scope === 'GLOBAL') return true;

                // 2. ALL_TENANTS: Visible if user matches the tenant type
                if (ad.scope === 'ALL_TENANTS' && ad.target === currentUser.tenantType) return true;

                // 3. LOCAL: Visible if user matches specific entityId
                if (ad.scope === 'LOCAL' && ad.entityId === currentUser.entityId) return true;

                return false;
            });
        },
        // ADS MANAGEMENT: Get ads based on who is managing
        getManageableAds: () => {
            if (permissions.isHQAdmin()) {
                // HQ sees Global and All_Tenants ads
                return db.ads.filter(ad => ad.scope === 'GLOBAL' || ad.scope === 'ALL_TENANTS');
            } else if (permissions.isManager()) {
                // Managers see their LOCAL ads
                return db.ads.filter(ad => ad.scope === 'LOCAL' && ad.entityId === currentUser.entityId);
            }
            return [];
        },
        addAd: (ad) => {
            ad.id = db.ads.length + 1;
            ad.date = new Date().toISOString().split('T')[0];
            ad.active = true;
            db.ads.push(ad);
        },
        deleteAd: (id) => {
            const index = db.ads.findIndex(a => a.id == id);
            if (index > -1) db.ads.splice(index, 1);
        }
    };

    // --- INITIALIZATION ---
    const init = () => {
        renderSidebar();
        loadRoute('dashboard');
        updateHeader();
    };

    const switchUser = (userId) => {
        const user = db.users.find(u => u.id === userId);
        if (!user) return;
        currentUser = user;
        
        document.getElementById('main-view').innerHTML = `
        <div class="flex flex-col items-center justify-center h-full opacity-50">
            <i class="fas fa-circle-notch fa-spin text-5xl text-brand-500 mb-4"></i>
            <p class="font-bold text-lg">جاري تحميل الصلاحيات...</p>
            <p class="text-sm text-gray-500 mt-2">الدور: ${currentUser.role} | النطاق: ${currentUser.tenantType}</p>
        </div>`;
        
        setTimeout(() => {
            renderSidebar();
            loadRoute('dashboard');
            updateHeader();
        }, 600);
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = `${currentUser.desc} (${currentUser.role})`;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        document.getElementById('entity-badge').innerText = currentUser.entityName;
        document.getElementById('page-title').innerText = 'لوحة التحكم';
    };

    // --- NAVIGATION RENDERER ---
    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        let links = '';

        // 1. Dashboard (All)
        links += createNavLink('dashboard', 'fas fa-home', 'الرئيسية');

        // HQ SPECIFIC MENU
        if (permissions.canViewGovernance()) {
            links += createNavLink('governance', 'fas fa-sitemap', 'إدارة الشبكة والكيانات');
            links += createNavLink('ads-admin', 'fas fa-bullhorn', 'إدارة الإعلانات المركزية');
            links += createNavLink('reports', 'fas fa-chart-pie', 'التقارير المركزية');
        } else {
            // OTHER TENANTS MENU
            if (!permissions.isClient()) {
                // 2. Daily Operations
                const opLabel = 
                    permissions.isBranch() ? 'نقاط البيع (POS)' : 
                    permissions.isIncubator() ? 'جدول الحصص' : 
                    permissions.isPlatform() ? 'تذاكر الدعم' : 
                    permissions.isOffice() ? 'الخدمات والطلبات' : 'العمليات';
                links += createNavLink('operations', 'fas fa-rocket', opLabel);

                // 3. Clients/Customers
                const clientLabel = 
                    permissions.isIncubator() ? 'الطلاب والشركات' : 
                    permissions.isPlatform() ? 'المشتركين (Tenants)' : 
                    permissions.isOffice() ? 'الجهات المستفيدة' : 'العملاء';
                links += createNavLink('clients', 'fas fa-users', clientLabel);

                // 4. Subscriptions/Contracts
                const subLabel = 
                    permissions.isBranch() ? 'العضويات' : 
                    permissions.isOffice() ? 'العقود' : 'الاشتراكات';
                links += createNavLink('subscriptions', 'fas fa-file-contract', subLabel);
            } else {
                // Client View
                links += createNavLink('subscriptions', 'fas fa-id-card', 'اشتراكاتي');
            }

            // 5. Reports (Managers)
            if (permissions.canViewReports() && !permissions.isHQ()) {
                links += createNavLink('reports', 'fas fa-chart-bar', 'التقارير');
            }

            // 6. Team Management (Managers)
            if (permissions.canViewTeam()) {
                links += createNavLink('team', 'fas fa-user-shield', 'إدارة الفريق');
            }

            // 7. Ads Management (Managers)
            if (permissions.canManageAds()) {
                 links += createNavLink('ads-admin', 'fas fa-bullhorn', 'نشر الإعلانات');
            }
        }

        menu.innerHTML = links;
    };

    const createNavLink = (route, icon, text) => {
        return `<li><a href="#" onclick="app.loadRoute('${route}')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
            <i class="${icon} w-6 text-center group-hover:text-brand-400"></i> ${text}
        </a></li>`;
    };

    // --- ROUTER & VIEW CONTROLLER ---
    const loadRoute = (route) => {
        const container = document.getElementById('main-view');
        document.getElementById('page-title').innerText = getPageTitle(route);

        // Update active state in menu
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('bg-slate-800', 'text-white'));
        // (Simple active state logic omitted)

        let content = '';

        switch (route) {
            case 'dashboard':
                content = renderDashboard();
                break;
            case 'operations':
                content = renderOperations();
                break;
            case 'clients':
                content = renderClients();
                break;
            case 'subscriptions':
                content = renderSubscriptions();
                break;
            case 'reports':
                content = renderReports();
                break;
            case 'team':
                content = renderTeam();
                break;
            case 'governance':
                content = renderGovernance();
                break;
            case 'ads-admin':
                content = renderAdsManagement();
                break;
            default:
                content = '<div class="p-10 text-center">الصفحة غير موجودة</div>';
        }

        container.innerHTML = `<div class="fade-in">${content}</div>`;
    };

    const getPageTitle = (route) => {
        const titles = { 
            'dashboard': 'لوحة القيادة والمتابعة', 
            'operations': 'التشغيل اليومي', 
            'clients': 'إدارة العملاء', 
            'subscriptions': 'الاشتراكات والعقود', 
            'reports': 'التقارير والإحصائيات', 
            'team': 'فريق العمل',
            'governance': 'إدارة الشبكة والكيانات',
            'ads-admin': 'نظام إدارة الإعلانات'
        };
        return titles[route] || 'نايوش ERP';
    }

    // --- HELPER COMPONENTS ---
    const renderAdsCarousel = () => {
        const ads = api.getAds();
        if (ads.length === 0) return '';

        return `
        <div class="mb-6 overflow-hidden relative group">
            <div class="flex gap-4 overflow-x-auto pb-2 snap-x custom-scrollbar">
                ${ads.map(ad => `
                    <div class="min-w-[100%] md:min-w-[350px] bg-white p-5 rounded-xl border-r-4 ${ad.type === 'promo' ? 'border-purple-500 bg-purple-50' : ad.type === 'warning' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500'} shadow-sm snap-start hover:shadow-md transition flex flex-col justify-between">
                        <div>
                            <div class="flex justify-between items-start">
                                <h4 class="font-bold text-gray-800">${ad.title}</h4>
                                <span class="text-[10px] uppercase font-bold px-2 py-1 rounded ${ad.scope === 'GLOBAL' ? 'bg-indigo-100 text-indigo-700' : ad.scope === 'ALL_TENANTS' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'}">
                                    ${ad.scope === 'GLOBAL' ? 'عام' : ad.scope === 'ALL_TENANTS' ? 'كل الفروع' : 'داخلي'}
                                </span>
                            </div>
                            <p class="text-sm text-gray-600 mt-2 leading-relaxed">${ad.content}</p>
                        </div>
                        <div class="mt-3 text-[10px] text-gray-400 flex justify-between items-center">
                             <span><i class="far fa-clock ml-1"></i>${ad.date}</span>
                             ${ad.type === 'promo' ? '<button class="text-purple-600 font-bold hover:underline">التفاصيل</button>' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    };

    // --- RENDERERS ---

    // 1. DASHBOARD RENDERER
    const renderDashboard = () => {
        const adsSection = renderAdsCarousel();

        if (permissions.isHQ()) {
            // Calculate Aggregates
            const totalRevenue = db.tenants.reduce((sum, t) => sum + t.revenue, 0);
            const healthScore = Math.round(db.tenants.reduce((sum, t) => sum + t.performance, 0) / db.tenants.length);
            
            return `
            ${adsSection}
            <!-- HQ Header Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                ${card('الإيرادات المجمعة', totalRevenue.toLocaleString() + ' ر.س', 'green', 'fa-coins')}
                ${card('مؤشر الأداء العام', healthScore + '%', 'blue', 'fa-chart-line')}
                ${card('عدد الكيانات', db.tenants.length, 'purple', 'fa-sitemap')}
                ${card('تنبيهات حرجة', db.alerts.filter(a=>a.type==='error').length, 'red', 'fa-exclamation-triangle')}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Right Column: Governance Map (2/3) -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Tenants Status -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-800"><i class="fas fa-network-wired text-brand-500 ml-2"></i>حالة الفروع والكيانات</h3>
                            <button onclick="app.loadRoute('governance')" class="text-xs text-brand-600 hover:underline">عرض الكل</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-right">
                                <thead class="bg-slate-50 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th class="p-3">الكيان</th>
                                        <th class="p-3">النوع</th>
                                        <th class="p-3">المدير</th>
                                        <th class="p-3">الأداء</th>
                                        <th class="p-3">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100">
                                    ${db.tenants.map(t => `
                                        <tr class="hover:bg-slate-50 transition">
                                            <td class="p-3 font-bold text-gray-700">${t.name}</td>
                                            <td class="p-3 text-xs"><span class="px-2 py-1 bg-gray-100 rounded">${t.type}</span></td>
                                            <td class="p-3 text-sm text-gray-500">${t.manager}</td>
                                            <td class="p-3">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-xs font-bold">${t.performance}%</span>
                                                    <div class="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                                        <div class="h-full ${t.performance > 90 ? 'bg-green-500' : t.performance > 70 ? 'bg-yellow-500' : 'bg-red-500'}" style="width: ${t.performance}%"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="p-3">
                                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === 'Healthy' ? 'bg-green-100 text-green-800' : t.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                                                    <span class="w-1.5 h-1.5 rounded-full ${t.status === 'Healthy' ? 'bg-green-500' : t.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'}"></span>
                                                    ${t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Left Column: Tasks & Alerts (1/3) -->
                <div class="space-y-6">
                    <!-- HQ Tasks -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-bold text-gray-800 text-sm">مهام الإدارة العليا</h3>
                        </div>
                        <ul class="space-y-3">
                            ${db.hqTasks.map(task => `
                                <li class="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                                    <div class="mt-1">
                                        <input type="checkbox" ${task.status === 'Done' ? 'checked' : ''} class="rounded border-gray-300 text-brand-600 focus:ring-brand-500">
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-sm font-medium ${task.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700'}">${task.title}</p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 rounded">${task.deadline}</span>
                                            <span class="text-[10px] ${task.priority === 'High' ? 'text-red-500 font-bold' : 'text-yellow-600'}">${task.priority}</span>
                                        </div>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <!-- System Alerts -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                         <h3 class="font-bold text-gray-800 text-sm mb-4">مركز الإشعارات</h3>
                         <div class="space-y-4">
                            ${db.alerts.map(alert => `
                                <div class="flex gap-3">
                                    <div class="mt-0.5">
                                        ${alert.type === 'error' ? '<i class="fas fa-times-circle text-red-500"></i>' : 
                                          alert.type === 'warning' ? '<i class="fas fa-exclamation-circle text-yellow-500"></i>' : 
                                          '<i class="fas fa-check-circle text-green-500"></i>'}
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-600 leading-relaxed">${alert.msg}</p>
                                        <p class="text-[10px] text-gray-400 mt-1">${alert.time}</p>
                                    </div>
                                </div>
                            `).join('')}
                         </div>
                    </div>
                </div>
            </div>
            `;
        }
        
        // Client View
        if (permissions.isClient()) return `
            ${adsSection}
            <div class="bg-white p-8 rounded-xl shadow-sm text-center">
                <h2 class="text-2xl font-bold text-gray-800">مرحباً بك في بوابة الطالب</h2>
                <p class="text-gray-500 mt-2">تابع دروسك واشتراكاتك من هنا</p>
                <button onclick="app.loadRoute('subscriptions')" class="mt-4 bg-brand-600 text-white px-6 py-2 rounded-lg">عرض دوراتي</button>
            </div>
        `;

        // Managers/Employees Dashboard
        return `
        ${adsSection}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-brand-500">
                <p class="text-sm text-gray-500">النشاط اليومي</p>
                <h3 class="text-2xl font-bold">${api.getData('operations').length} عمليات</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-green-500">
                <p class="text-sm text-gray-500">العملاء النشطين</p>
                <h3 class="text-2xl font-bold">${api.getData('clients').length} عميل</h3>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-purple-500">
                <p class="text-sm text-gray-500">كفاءة الفريق</p>
                <h3 class="text-2xl font-bold">94%</h3>
            </div>
        </div>
        <div class="mt-6 bg-white p-6 rounded-xl shadow-sm">
            <h3 class="font-bold text-gray-700 mb-4">آخر العمليات المسجلة</h3>
            ${renderTable(['النوع', 'الوصف', 'الوقت', 'الحالة'], api.getData('operations').slice(0,5), (item) => `
                <td><span class="px-2 py-1 bg-gray-100 rounded text-xs font-bold">${item.type}</span></td>
                <td>${item.desc}</td>
                <td>${item.time}</td>
                <td><span class="text-xs text-green-600 font-bold">${item.status}</span></td>
            `)}
        </div>
        `;
    };

    // 2. NEW: ADS MANAGEMENT RENDERER
    const renderAdsManagement = () => {
        const myAds = api.getManageableAds();
        const isHQ = permissions.isHQAdmin();

        return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Form -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                <h3 class="font-bold text-lg mb-4 text-brand-600"><i class="fas fa-plus-circle ml-2"></i>نشر إعلان جديد</h3>
                <form onsubmit="event.preventDefault(); alert('تم إضافة الإعلان بنجاح!');" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">عنوان الإعلان</label>
                        <input type="text" class="w-full p-2 border border-gray-300 rounded text-sm focus:border-brand-500 focus:outline-none" placeholder="مثلاً: صيانة طارئة">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">محتوى الإعلان</label>
                        <textarea class="w-full p-2 border border-gray-300 rounded text-sm focus:border-brand-500 focus:outline-none" rows="3" placeholder="تفاصيل الإعلان..."></textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">نوع الإعلان</label>
                        <select class="w-full p-2 border border-gray-300 rounded text-sm bg-white">
                            <option value="info">معلومة (Information)</option>
                            <option value="promo">ترويجي (Promo)</option>
                            <option value="warning">تنبيه (Warning)</option>
                            <option value="success">إنجاز (Success)</option>
                        </select>
                    </div>
                    
                    ${isHQ ? `
                    <div class="p-3 bg-gray-50 rounded border border-gray-200">
                        <label class="block text-xs font-bold text-brand-700 mb-2">نطاق النشر (صلاحيات HQ)</label>
                        <div class="space-y-2">
                            <label class="flex items-center text-sm">
                                <input type="radio" name="scope" value="GLOBAL" class="ml-2 text-brand-600"> نشر عام (كل النظام)
                            </label>
                            <label class="flex items-center text-sm">
                                <input type="radio" name="scope" value="ALL_TENANTS" class="ml-2 text-brand-600"> نشر حسب نوع الكيان
                            </label>
                            <select class="w-full mt-1 p-2 border border-gray-300 rounded text-xs bg-white" disabled>
                                <option>-- اختر نوع الكيان --</option>
                                <option value="BRANCH">جميع الفروع (Retail)</option>
                                <option value="INCUBATOR">جميع الحاضنات (Edu)</option>
                            </select>
                        </div>
                    </div>
                    ` : `
                    <div class="p-3 bg-gray-50 rounded border border-gray-200">
                        <p class="text-xs text-gray-500">سيتم نشر هذا الإعلان داخلياً فقط لموظفي وعملاء <strong>${currentUser.entityName}</strong>.</p>
                        <input type="hidden" name="scope" value="LOCAL">
                    </div>
                    `}

                    <button type="submit" class="w-full bg-brand-600 text-white py-2 rounded font-bold hover:bg-brand-700 transition">نشر الإعلان</button>
                </form>
            </div>

            <!-- List -->
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="font-bold text-lg mb-4">الإعلانات النشطة (${myAds.length})</h3>
                <div class="space-y-4">
                    ${myAds.length > 0 ? myAds.map(ad => `
                        <div class="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition group">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${ad.type === 'promo' ? 'bg-purple-500' : ad.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}">
                                <i class="fas ${ad.type === 'promo' ? 'fa-tag' : ad.type === 'warning' ? 'fa-exclamation' : 'fa-info'}"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between">
                                    <h4 class="font-bold text-gray-800">${ad.title}</h4>
                                    <div class="flex gap-2">
                                         <span class="text-[10px] px-2 py-1 rounded bg-gray-200 text-gray-600">${ad.scope === 'GLOBAL' ? 'عام' : ad.scope === 'ALL_TENANTS' ? `كل الـ ${ad.target}` : 'محلي'}</span>
                                         <button onclick="app.deleteAd(${ad.id})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600 mt-1">${ad.content}</p>
                                <p class="text-xs text-gray-400 mt-2">${ad.date}</p>
                            </div>
                        </div>
                    `).join('') : '<p class="text-center text-gray-400 py-10">لا توجد إعلانات نشطة</p>'}
                </div>
            </div>
        </div>
        `;
    }

    // 3. GOVERNANCE RENDERER (HQ ONLY)
    const renderGovernance = () => {
        if (!permissions.isHQ()) return '<div class="text-red-500">غير مصرح لك بالوصول</div>';
        
        return `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <div class="flex gap-2">
                    <button class="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 shadow-sm"><i class="fas fa-plus ml-2"></i>إضافة كيان جديد</button>
                    <button class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"><i class="fas fa-file-export ml-2"></i>تصدير التقرير</button>
                </div>
                <div class="relative">
                    <input type="text" placeholder="بحث عن فرع أو كيان..." class="pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-brand-500 w-64">
                    <i class="fas fa-search absolute left-3 top-2.5 text-gray-400"></i>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                ${db.tenants.map(t => `
                    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-brand-300 transition group">
                        <div class="flex justify-between items-start mb-3">
                            <div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition">
                                <i class="fas ${t.type === 'BRANCH' ? 'fa-store' : t.type === 'PLATFORM' ? 'fa-server' : 'fa-building'}"></i>
                            </div>
                            <span class="text-[10px] px-2 py-1 rounded-full ${t.status === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${t.status}</span>
                        </div>
                        <h4 class="font-bold text-gray-800 mb-1">${t.name}</h4>
                        <p class="text-xs text-gray-500 mb-4">${t.manager}</p>
                        <div class="flex justify-between items-center text-xs border-t border-gray-100 pt-3">
                            <span class="text-gray-400">الأداء: <strong class="text-gray-700">${t.performance}%</strong></span>
                            <button class="text-brand-600 hover:underline">إدارة</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold mb-4">سجل التدقيق الأخير (Audit Log)</h3>
                <table class="w-full text-right text-sm">
                    <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th class="p-3">التاريخ</th>
                            <th class="p-3">الحدث</th>
                            <th class="p-3">الكيان المسؤول</th>
                            <th class="p-3">التفاصيل</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr>
                            <td class="p-3">2023-11-20 10:30</td>
                            <td class="p-3 font-bold">تسجيل دخول ناجح</td>
                            <td class="p-3">فرع العليا مول</td>
                            <td class="p-3 text-gray-500">User: Sara</td>
                        </tr>
                        <tr>
                            <td class="p-3">2023-11-20 09:15</td>
                            <td class="p-3 font-bold text-red-500">محاولة دخول فاشلة</td>
                            <td class="p-3">مكتب جدة</td>
                            <td class="p-3 text-gray-500">IP: 192.168.1.5</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    // 4. OPERATIONS RENDERER
    const renderOperations = () => {
        if (permissions.isBranch()) return `
            <div class="flex gap-4 mb-6">
                <div class="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition">
                    <i class="fas fa-cash-register text-4xl text-blue-500 mb-2"></i>
                    <h3 class="font-bold">نقطة البيع (POS)</h3>
                </div>
                <div class="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-500 transition">
                    <i class="fas fa-box-open text-4xl text-orange-500 mb-2"></i>
                    <h3 class="font-bold">إدارة المخزون</h3>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold mb-4">سجل المبيعات اليومية</h3>
                ${renderTable(['رقم الفاتورة', 'المبلغ', 'البائع', 'الحالة'], 
                    [{id:'#101', amt:'250 ر.س', seller:'محمد', st:'مدفوع'}, {id:'#102', amt:'120 ر.س', seller:'ليلى', st:'مدفوع'}], 
                    (i) => `<td>${i.id}</td><td class="font-bold">${i.amt}</td><td>${i.seller}</td><td><span class="text-green-600">${i.st}</span></td>`)}
            </div>
        `;

        if (permissions.isIncubator()) return `
            <div class="bg-white p-6 rounded-xl shadow-sm mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg">الجدول الدراسي - اليوم</h3>
                    <button class="bg-brand-600 text-white text-xs px-3 py-1 rounded">إضافة حصة</button>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center p-4 border border-l-4 border-l-orange-500 rounded bg-gray-50">
                        <div class="w-16 font-bold text-gray-500">09:00</div>
                        <div class="flex-1">
                            <h4 class="font-bold text-gray-800">أساسيات ريادة الأعمال</h4>
                            <p class="text-xs text-gray-500">القاعة 3 - د. يوسف</p>
                        </div>
                        <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">جاري الآن</span>
                    </div>
                    <div class="flex items-center p-4 border border-l-4 border-l-gray-300 rounded hover:bg-gray-50">
                        <div class="w-16 font-bold text-gray-500">11:00</div>
                        <div class="flex-1">
                            <h4 class="font-bold text-gray-800">ورشة عمل التصميم</h4>
                            <p class="text-xs text-gray-500">معمل 1 - أ. سارة</p>
                        </div>
                        <span class="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">قادم</span>
                    </div>
                </div>
            </div>
        `;

        if (permissions.isPlatform()) return `
             <div class="flex gap-4 h-full">
                <div class="w-1/3 bg-gray-100 p-4 rounded-xl">
                    <h4 class="font-bold text-gray-600 mb-3">New Tickets <span class="bg-red-500 text-white text-xs rounded-full px-2">2</span></h4>
                    <div class="bg-white p-3 rounded shadow-sm mb-2 border-l-4 border-red-500 cursor-pointer">
                        <p class="font-bold text-sm">Server Timeout</p>
                        <p class="text-xs text-gray-400">Tenant: PLT-005</p>
                    </div>
                    <div class="bg-white p-3 rounded shadow-sm mb-2 border-l-4 border-yellow-500 cursor-pointer">
                        <p class="font-bold text-sm">Login Issue</p>
                        <p class="text-xs text-gray-400">Tenant: PLT-012</p>
                    </div>
                </div>
                <div class="w-1/3 bg-gray-100 p-4 rounded-xl">
                    <h4 class="font-bold text-gray-600 mb-3">In Progress</h4>
                    <div class="bg-white p-3 rounded shadow-sm mb-2 border-l-4 border-blue-500 cursor-pointer">
                        <p class="font-bold text-sm">Database Migration</p>
                        <p class="text-xs text-gray-400">Assigned: Ali</p>
                    </div>
                </div>
                <div class="w-1/3 bg-gray-100 p-4 rounded-xl">
                    <h4 class="font-bold text-gray-600 mb-3">Resolved</h4>
                     <div class="bg-white p-3 rounded shadow-sm mb-2 opacity-60">
                        <p class="font-bold text-sm">UI Bug Fix</p>
                    </div>
                </div>
             </div>
        `;

        if (permissions.isOffice()) return `
            <div class="grid grid-cols-2 gap-4 mb-6">
                <button class="p-4 bg-purple-50 text-purple-700 rounded-lg text-center hover:bg-purple-100 border border-purple-200 font-bold"><i class="fas fa-file-invoice mb-2 block text-2xl"></i>طلب شراء</button>
                <button class="p-4 bg-blue-50 text-blue-700 rounded-lg text-center hover:bg-blue-100 border border-blue-200 font-bold"><i class="fas fa-car mb-2 block text-2xl"></i>حجز سيارة</button>
                <button class="p-4 bg-green-50 text-green-700 rounded-lg text-center hover:bg-green-100 border border-green-200 font-bold"><i class="fas fa-stamp mb-2 block text-2xl"></i>خطاب رسمي</button>
                <button class="p-4 bg-red-50 text-red-700 rounded-lg text-center hover:bg-red-100 border border-red-200 font-bold"><i class="fas fa-tools mb-2 block text-2xl"></i>بلاغ صيانة</button>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold mb-4">الطلبات الواردة</h3>
                ${renderTable(['رقم الطلب', 'الموظف', 'النوع', 'الحالة'], api.getData('operations'), (i) => `<td>#${i.id}</td><td>موظف داخلي</td><td>${i.desc}</td><td><span class="text-orange-500">${i.status}</span></td>`)}
            </div>
        `;

        return `<div>No operations view defined.</div>`;
    };

    // 5. CLIENTS RENDERER
    const renderClients = () => {
        const clients = api.getData('clients');
        return `
        <div class="bg-white p-6 rounded-xl shadow-sm">
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-lg">قائمة ${permissions.isIncubator() ? 'الطلاب والشركات' : 'العملاء'}</h3>
                <button class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs hover:bg-brand-700"><i class="fas fa-plus ml-2"></i>إضافة جديد</button>
            </div>
            ${renderTable(['الاسم', 'النوع', 'الحالة', 'إجراءات'], clients, (c) => `
                <td class="font-bold text-gray-700">${c.name}</td>
                <td><span class="bg-slate-100 px-2 py-1 rounded text-xs">${c.type}</span></td>
                <td><span class="text-green-600 text-xs font-bold">${c.status}</span></td>
                <td><button class="text-gray-400 hover:text-brand-500"><i class="fas fa-edit"></i></button></td>
            `)}
        </div>
        `;
    };

    // 6. SUBSCRIPTIONS RENDERER
    const renderSubscriptions = () => {
        if (permissions.isClient()) {
             // Student View
             return `
             <div class="max-w-2xl mx-auto">
                <div class="bg-gradient-to-r from-brand-600 to-brand-800 text-white p-6 rounded-xl shadow-lg mb-6">
                    <h3 class="text-xl font-bold">بطاقة الطالب الرقمية</h3>
                    <p class="opacity-80 mt-1">Active Subscription</p>
                </div>
                <h3 class="font-bold text-gray-700 mb-3">اشتراكاتي الحالية</h3>
                ${api.getData('subscriptions').map(s => `
                    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center mb-3">
                        <div>
                            <h4 class="font-bold text-brand-600">${s.plan}</h4>
                            <p class="text-xs text-gray-400">تجدد: ${s.cycle}</p>
                        </div>
                        <div class="text-left">
                            <span class="block font-bold text-gray-800">${s.amount === 0 ? 'منحة مجانية' : s.amount + ' ر.س'}</span>
                            <span class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">نشط</span>
                        </div>
                    </div>
                `).join('')}
             </div>
             `;
        }

        // Manager View
        const subs = api.getData('subscriptions');
        return `
        <div class="bg-white p-6 rounded-xl shadow-sm">
             <h3 class="font-bold text-lg mb-4">${permissions.isOffice() ? 'العقود والاتفاقيات' : 'إدارة الاشتراكات'}</h3>
             ${renderTable(['المعرف', 'اسم العميل', 'الخطة/العقد', 'الدورة', 'القيمة'], subs, (s) => `
                <td class="font-mono text-xs">${s.id}</td>
                <td class="font-bold">${s.client}</td>
                <td>${s.plan}</td>
                <td>${s.cycle}</td>
                <td class="font-bold text-green-600">${s.amount} ر.س</td>
             `)}
        </div>
        `;
    };

    // 7. REPORTS RENDERER
    const renderReports = () => {
        const finance = api.getData('finance');
        const income = finance.filter(f => f.type === 'credit').reduce((a,b) => a + b.amount, 0);
        const expense = finance.filter(f => f.type === 'debit').reduce((a,b) => a + Math.abs(b.amount), 0);
        
        const title = permissions.isHQ() ? 'التقارير المالية المجمعة (Consolidated)' : 'التقارير المالية';

        return `
        <div class="space-y-6">
             <h3 class="font-bold text-xl text-gray-800">${title}</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div class="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500">
                    <p class="text-gray-500 text-xs uppercase font-bold">الدخل</p>
                    <h3 class="text-2xl font-bold text-gray-800">${income.toLocaleString()}</h3>
                 </div>
                 <div class="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500">
                    <p class="text-gray-500 text-xs uppercase font-bold">المصروفات</p>
                    <h3 class="text-2xl font-bold text-gray-800">${expense.toLocaleString()}</h3>
                 </div>
                 <div class="bg-white p-6 rounded-xl shadow-sm border-t-4 border-brand-500">
                    <p class="text-gray-500 text-xs uppercase font-bold">الصافي</p>
                    <h3 class="text-2xl font-bold text-gray-800">${(income - expense).toLocaleString()}</h3>
                 </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold text-gray-700 mb-6">الأداء الشهري (محاكاة رسم بياني)</h3>
                <div class="flex items-end gap-2 h-40 pb-2 border-b border-gray-200">
                    <div class="w-full bg-blue-100 rounded-t h-[40%] hover:bg-blue-200 transition relative group"><span class="absolute -top-6 w-full text-center text-xs opacity-0 group-hover:opacity-100">40%</span></div>
                    <div class="w-full bg-blue-300 rounded-t h-[60%] hover:bg-blue-400 transition relative group"><span class="absolute -top-6 w-full text-center text-xs opacity-0 group-hover:opacity-100">60%</span></div>
                    <div class="w-full bg-blue-500 rounded-t h-[80%] hover:bg-blue-600 transition relative group"><span class="absolute -top-6 w-full text-center text-xs opacity-0 group-hover:opacity-100">80%</span></div>
                    <div class="w-full bg-blue-200 rounded-t h-[50%] hover:bg-blue-300 transition relative group"><span class="absolute -top-6 w-full text-center text-xs opacity-0 group-hover:opacity-100">50%</span></div>
                    <div class="w-full bg-brand-600 rounded-t h-[90%] hover:bg-brand-700 transition relative group"><span class="absolute -top-6 w-full text-center text-xs opacity-0 group-hover:opacity-100">90%</span></div>
                </div>
                <div class="flex justify-between text-xs text-gray-400 mt-2">
                    <span>يونيو</span><span>يوليو</span><span>أغسطس</span><span>سبتمبر</span><span>أكتوبر</span>
                </div>
            </div>
        </div>
        `;
    };

    // 8. TEAM RENDERER
    const renderTeam = () => {
        const team = api.getData('team');
        return `
        <div class="bg-white p-6 rounded-xl shadow-sm">
             <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-lg">فريق العمل (${team.length})</h3>
                <button class="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-xs hover:bg-gray-50">تصدير الأسماء</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${team.map(m => `
                <div class="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-md transition bg-gray-50">
                    <div class="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">${m.name.charAt(0)}</div>
                    <div>
                        <h4 class="font-bold text-gray-800">${m.name}</h4>
                        <p class="text-xs text-gray-500">${m.role}</p>
                        <div class="mt-1 flex items-center gap-1 text-[10px]">
                            <span class="text-green-600">KPI: ${m.kpi}%</span>
                            <div class="w-16 bg-gray-200 h-1 rounded-full overflow-hidden">
                                <div class="bg-green-500 h-1 rounded-full" style="width: ${m.kpi}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        `;
    };

    // --- UTILS ---
    const card = (title, val, color, icon) => `
        <div class="bg-white p-6 rounded-xl shadow-sm border-l-4 border-${color}-500">
            <div class="flex justify-between">
                <div>
                    <p class="text-xs text-gray-500 font-bold uppercase">${title}</p>
                    <h3 class="text-2xl font-bold mt-1">${val}</h3>
                </div>
                <div class="w-10 h-10 rounded-full bg-${color}-50 flex items-center justify-center text-${color}-500 text-xl">
                    <i class="fas ${icon}"></i>
                </div>
            </div>
        </div>
    `;

    const renderTable = (headers, data, rowMapper) => {
        if (!data || data.length === 0) return '<div class="p-4 text-center text-gray-400 text-sm">لا توجد بيانات متاحة</div>';
        return `
        <div class="overflow-x-auto">
            <table class="w-full text-right">
                <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>${headers.map(h => `<th class="p-4">${h}</th>`).join('')}</tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    ${data.map(item => `<tr class="hover:bg-gray-50 transition text-sm">${rowMapper(item)}</tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    };

    return {
        init,
        switchUser,
        loadRoute,
        deleteAd: (id) => { api.deleteAd(id); loadRoute('ads-admin'); }, // Exposed for UI
        getData: api.getData
    };
})();

document.addEventListener('DOMContentLoaded', app.init);