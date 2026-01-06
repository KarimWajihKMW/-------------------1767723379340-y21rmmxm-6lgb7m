/**
 * NAYOSH ERP - Advanced RBAC & Multi-Tenant System
 * Implements: HQ Admin, Branch Admin, Finance, Support, Advertiser, Audit Logs
 */

const app = (() => {
    // --- CONFIGURATION ---
    const TENANT_TYPES = {
        HQ: { id: 'HQ', label: 'المكتب الرئيسي', icon: 'fa-building', color: 'text-purple-600', bg: 'bg-purple-50' },
        BRANCH: { id: 'BRANCH', label: 'فرع تجزئة', icon: 'fa-store', color: 'text-blue-600', bg: 'bg-blue-50' },
        INCUBATOR: { id: 'INCUBATOR', label: 'حاضنة أعمال', icon: 'fa-seedling', color: 'text-orange-600', bg: 'bg-orange-50' },
        PLATFORM: { id: 'PLATFORM', label: 'منصة رقمية', icon: 'fa-laptop-code', color: 'text-green-600', bg: 'bg-green-50' },
        OFFICE: { id: 'OFFICE', label: 'مكتب إداري', icon: 'fa-briefcase', color: 'text-gray-600', bg: 'bg-gray-50' }
    };

    const ROLES = {
        ADMIN: 'ADMIN', // Can manage entity settings, users, etc.
        FINANCE: 'FINANCE', // Can see financials
        SUPPORT: 'SUPPORT', // Can see tickets
        ADVERTISER: 'ADVERTISER', // Can manage Ads
        USER: 'USER' // Read only
    };

    // --- DATA LAYER ---
    const db = {
        users: [
            // 1. HQ Admin
            { id: 1, name: 'م. أحمد العلي', role: ROLES.ADMIN, tenantType: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي' },
            // 2. Branch Admin
            { id: 2, name: 'سارة محمد', role: ROLES.ADMIN, tenantType: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول' },
            // 3. Incubator Admin
            { id: 3, name: 'د. خالد الزهراني', role: ROLES.ADMIN, tenantType: 'INCUBATOR', entityId: 'INC03', entityName: 'حاضنة السلامة' },
            // 4. Platform Admin
            { id: 4, name: 'فريق التقنية', role: ROLES.ADMIN, tenantType: 'PLATFORM', entityId: 'PLT01', entityName: 'نايوش كلاود' },
            // 5. Office Admin
            { id: 5, name: 'يوسف المكتب', role: ROLES.ADMIN, tenantType: 'OFFICE', entityId: 'OFF01', entityName: 'مكتب الدمام' },
            // 6. Finance (HQ)
            { id: 6, name: 'أ. منى المالية', role: ROLES.FINANCE, tenantType: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي' },
            // 7. Support (Platform)
            { id: 7, name: 'خدمة العملاء', role: ROLES.SUPPORT, tenantType: 'PLATFORM', entityId: 'PLT01', entityName: 'نايوش كلاود' },
            // 8. Advertiser (Branch)
            { id: 8, name: 'كريم التسويق', role: ROLES.ADVERTISER, tenantType: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول' },
            // 9. Another Branch Admin (For context)
            { id: 9, name: 'فهد السبيعي', role: ROLES.ADMIN, tenantType: 'BRANCH', entityId: 'BR016', entityName: 'فرع مول الرياض' },
            // 10. End User
            { id: 10, name: 'زائر النظام', role: ROLES.USER, tenantType: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول' }
        ],

        entities: [
            { id: 'HQ001', name: 'المكتب الرئيسي', type: 'HQ', status: 'Active', balance: 0, location: 'الرياض', users: 15 },
            { id: 'BR015', name: 'فرع العليا مول', type: 'BRANCH', status: 'Active', balance: 5000, location: 'الرياض - العليا', users: 8 },
            { id: 'BR016', name: 'فرع مول الرياض', type: 'BRANCH', status: 'Active', balance: 3200, location: 'الرياض - النخيل', users: 12 },
            { id: 'INC03', name: 'حاضنة السلامة', type: 'INCUBATOR', status: 'Active', balance: 10000, location: 'جدة', users: 45 },
            { id: 'PLT01', name: 'نايوش كلاود', type: 'PLATFORM', status: 'Active', balance: 150000, location: 'سحابي', users: 1200 },
            { id: 'OFF01', name: 'مكتب الدمام', type: 'OFFICE', status: 'Inactive', balance: 0, location: 'الدمام', users: 0 }
        ],

        ads: [
            { id: 1, title: 'صيانة دورية للنظام', content: 'سيتم توقف النظام للصيانة...', type: 'warning', scope: 'GLOBAL', status: 'ACTIVE', sourceEntityId: 'HQ001', date: '2023-11-20', cost: 0 },
            { id: 3, title: 'خصم خاص للموظفين', content: 'خصم 20% لدى كافية Jolt...', type: 'promo', scope: 'MULTI_BRANCH', status: 'ACTIVE', sourceEntityId: 'BR015', date: '2023-11-20', cost: 100 },
            { id: 5, title: 'افتتاح فرعنا الجديد', content: 'ندعوكم لحفل افتتاح...', type: 'promo', scope: 'GLOBAL', status: 'PENDING', sourceEntityId: 'BR015', date: '2023-11-25', cost: 150 }
        ],

        tasks: [
            { id: 101, title: 'اعتماد الميزانية الربعية للفروع', dueDate: '2023-11-30', status: 'Pending', priority: 'High', type: 'Finance', entityId: 'HQ001' },
            { id: 102, title: 'مراجعة طلبات الإعلانات المعلقة', dueDate: '2023-11-21', status: 'In Progress', priority: 'Medium', type: 'Ops', entityId: 'HQ001' },
            { id: 103, title: 'تجديد رخصة منصة نايوش كلاود', dueDate: '2023-12-01', status: 'Pending', priority: 'High', type: 'Legal', entityId: 'PLT01' },
            { id: 104, title: 'جرد المخزون الدوري', dueDate: '2023-11-22', status: 'Done', priority: 'Low', type: 'Ops', entityId: 'BR015' },
            { id: 105, title: 'تجهيز حملة العيد', dueDate: '2023-12-05', status: 'Pending', priority: 'High', type: 'Marketing', entityId: 'BR015' }
        ],

        auditLogs: [
            { id: 1, user: 'م. أحمد العلي', action: 'LOGIN', details: 'تم تسجيل الدخول للنظام', timestamp: '2023-11-20 08:00', entityId: 'HQ001' },
            { id: 2, user: 'سارة محمد', action: 'CREATE_AD', details: 'إنشاء إعلان: خصم خاص للموظفين', timestamp: '2023-11-20 09:15', entityId: 'BR015' },
            { id: 3, user: 'م. أحمد العلي', action: 'APPROVE_ENTITY', details: 'تفعيل كيان: مكتب الدمام', timestamp: '2023-11-20 10:00', entityId: 'HQ001' }
        ]
    };

    let currentUser = db.users[0];

    // --- PERMISSIONS & HELPERS ---
    const perms = {
        // Role Checks
        isHQ: () => currentUser.tenantType === 'HQ',
        isAdmin: () => currentUser.role === ROLES.ADMIN,
        isFinance: () => currentUser.role === ROLES.FINANCE || (currentUser.role === ROLES.ADMIN && currentUser.tenantType === 'HQ'),
        isAdvertiser: () => currentUser.role === ROLES.ADVERTISER || currentUser.role === ROLES.ADMIN,
        
        // Data Scoping
        canViewEntity: (eId) => perms.isHQ() || currentUser.entityId === eId,
        canEditEntity: (eId) => perms.isAdmin() && (perms.isHQ() || currentUser.entityId === eId),
        
        // Getters with Scope Enforcement
        getVisibleEntities: () => {
            if (perms.isHQ()) return db.entities;
            return db.entities.filter(e => e.id === currentUser.entityId);
        },
        
        getVisibleAds: () => {
            if (perms.isHQ()) return db.ads; // HQ sees all for governance
            return db.ads.filter(a => a.sourceEntityId === currentUser.entityId || a.scope === 'GLOBAL');
        },
        
        getVisibleTasks: () => {
            // HQ Admin sees HQ tasks. Entity Admin sees Entity tasks.
            if (perms.isHQ() && perms.isAdmin()) return db.tasks.filter(t => t.entityId === 'HQ001' || t.priority === 'High'); 
            return db.tasks.filter(t => t.entityId === currentUser.entityId);
        },

        getAuditLogs: () => {
            if (perms.isHQ()) return db.auditLogs;
            return db.auditLogs.filter(l => l.entityId === currentUser.entityId);
        }
    };

    const logAction = (action, details) => {
        const now = new Date();
        const log = {
            id: db.auditLogs.length + 1,
            user: currentUser.name,
            action: action,
            details: details,
            timestamp: now.toISOString().slice(0, 16).replace('T', ' '),
            entityId: currentUser.entityId
        };
        db.auditLogs.unshift(log);
        console.log("AUDIT:", log);
    };

    // --- INIT ---
    const init = () => {
        renderSidebar();
        updateHeader();
        loadRoute('dashboard');
        showToast(`مرحباً ${currentUser.name} | بصلاحية ${currentUser.role}`);
    };

    const switchUser = (id) => {
        const u = db.users.find(x => x.id === id);
        if (u) {
            logAction('LOGOUT', `تسجيل خروج المستخدم ${currentUser.name}`);
            currentUser = u;
            logAction('LOGIN', `تسجيل دخول بصفة ${currentUser.role}`);
            
            document.getElementById('main-view').innerHTML = `<div class="flex h-full items-center justify-center flex-col"><i class="fas fa-circle-notch fa-spin text-4xl text-brand-500 mb-4"></i><p class="text-slate-500">جاري تحميل الصلاحيات...</p></div>`;
            
            setTimeout(() => { 
                renderSidebar(); 
                updateHeader(); 
                loadRoute('dashboard');
                showToast(`تم التحويل إلى: ${currentUser.name} (${currentUser.tenantType})`);
            }, 800);
        }
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = currentUser.tenantType + ' | ' + currentUser.role;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        document.getElementById('entity-badge').innerText = currentUser.entityName;
        
        // Entity Badge Color based on type
        const typeConf = TENANT_TYPES[currentUser.tenantType];
        const badge = document.getElementById('entity-badge');
        badge.className = `px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${typeConf.bg} ${typeConf.color} border-${typeConf.color.split('-')[1]}-200`;
    };

    const showToast = (msg) => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl text-sm fade-in flex items-center gap-3';
        toast.innerHTML = `<i class="fas fa-info-circle text-brand-400"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // --- ROUTING ---
    const loadRoute = (route) => {
        const view = document.getElementById('main-view');
        document.getElementById('page-title').innerText = getTitle(route);
        
        let content = '';
        // Routing based on Role capabilities
        if (route === 'audit-logs') {
            content = renderAuditLogs();
        } else if (route === 'dashboard') {
            content = renderDashboard();
        } else if (route === 'entities') {
            content = renderEntitiesManager();
        } else if (route === 'ads') {
            content = renderAdsManager();
        } else if (route === 'tasks') {
            content = renderTasksManager();
        } else {
            content = renderPlaceholder();
        }

        view.innerHTML = `<div class="fade-in">${content}</div>`;
    };

    const getTitle = (r) => {
        const map = { 
            'dashboard': 'لوحة القيادة',
            'entities': 'إدارة الكيانات',
            'ads': 'إدارة الإعلانات',
            'audit-logs': 'سجل التدقيق (Audit Logs)',
            'tasks': 'المهام والعمليات'
        };
        return map[r] || 'نايوش ERP';
    };

    // --- RENDERERS ---
    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        let items = [
            { id: 'dashboard', icon: 'fa-chart-pie', label: 'الرئيسية', show: true },
            { id: 'entities', icon: 'fa-sitemap', label: 'الكيان', show: true },
            { id: 'tasks', icon: 'fa-tasks', label: 'المهام', show: true },
            { id: 'ads', icon: 'fa-bullhorn', label: perms.isHQ() ? 'حوكمة الإعلانات' : 'إعلاناتي', show: perms.isAdvertiser() || perms.isAdmin() },
            { id: 'audit-logs', icon: 'fa-clipboard-list', label: 'سجل التدقيق', show: perms.isAdmin() || perms.isHQ() }
        ];

        menu.innerHTML = items.filter(i => i.show).map(item => 
            `<li>
                <a href="#" onclick="app.loadRoute('${item.id}')" 
                   class="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition group">
                   <i class="fas ${item.icon} w-6 text-center text-slate-400 group-hover:text-brand-400 transition-colors"></i> 
                   ${item.label}
                </a>
            </li>`
        ).join('');
    };

    // Unified Dashboard with Role Logic
    const renderDashboard = () => {
        const entities = perms.getVisibleEntities();
        const balance = entities.reduce((acc, curr) => acc + (curr.balance || 0), 0);
        const tasks = perms.getVisibleTasks();
        
        return `
        <!-- WELCOME BANNER -->
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full mix-blend-overlay opacity-20 -mr-10 -mt-10"></div>
            <div class="relative z-10">
                <h2 class="text-2xl font-bold mb-1">أهلاً بك، ${currentUser.name}</h2>
                <p class="text-slate-300 text-sm opacity-80">أنت تتصفح النظام بصلاحية <span class="text-brand-400 font-bold">${currentUser.role}</span> ضمن نطاق <span class="text-brand-400 font-bold">${currentUser.entityName}</span></p>
            </div>
        </div>

        <!-- STATS GRID -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Balance Card (Finance/Admin Only) -->
            ${(perms.isFinance() || perms.isAdmin()) ? `
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p class="text-xs text-slate-500 font-bold mb-1">الرصيد المتاح</p>
                <h3 class="text-2xl font-bold text-slate-800">${balance.toLocaleString()} <span class="text-xs">ر.س</span></h3>
                <div class="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center absolute left-5 top-5"><i class="fas fa-wallet"></i></div>
            </div>` : ''}

            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p class="text-xs text-slate-500 font-bold mb-1">المهام النشطة</p>
                <h3 class="text-2xl font-bold text-slate-800">${tasks.filter(t => t.status !== 'Done').length}</h3>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p class="text-xs text-slate-500 font-bold mb-1">عدد المستخدمين</p>
                <h3 class="text-2xl font-bold text-slate-800">${entities.reduce((a,c)=>a+(c.users||0),0)}</h3>
            </div>
        </div>

        <!-- ROLE SPECIFIC WIDGETS -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${perms.isHQ() ? renderHQWidgets() : ''}
            ${perms.isAdvertiser() ? renderAdvertiserWidget() : ''}
            ${tasks.length > 0 ? renderTasksWidget(tasks) : ''}
        </div>
        `;
    };

    const renderHQWidgets = () => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-700 mb-4">ملخص الحوكمة (HQ Governance)</h3>
            <div class="space-y-3">
                <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span class="text-sm text-purple-900">عدد الكيانات المرتبطة</span>
                    <span class="font-bold text-purple-700">${db.entities.length}</span>
                </div>
                <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span class="text-sm text-orange-900">طلبات إعلانات معلقة</span>
                    <span class="font-bold text-orange-700">${db.ads.filter(a => a.status === 'PENDING').length}</span>
                </div>
            </div>
        </div>
    `;

    const renderAdvertiserWidget = () => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-700 mb-4">أداء الحملات (Marketing)</h3>
            <div class="h-32 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                [رسم بياني للإعلانات]
            </div>
        </div>
    `;

    const renderTasksWidget = (tasks) => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h3 class="font-bold text-slate-700 mb-4">المهام العاجلة</h3>
            <div class="space-y-2 max-h-48 overflow-y-auto">
                ${tasks.slice(0,3).map(t => `
                <div class="flex justify-between items-center p-2 border-b border-slate-50">
                    <span class="text-sm text-slate-600">${t.title}</span>
                    <span class="text-[10px] px-2 py-1 bg-slate-100 rounded">${t.dueDate}</span>
                </div>
                `).join('')}
            </div>
        </div>
    `;

    // ENTITIES MANAGER (Scoped)
    const renderEntitiesManager = () => {
        const entities = perms.getVisibleEntities();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">إدارة الكيانات</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${entities.map(e => `
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:border-brand-200 transition">
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-lg ${TENANT_TYPES[e.type].bg} ${TENANT_TYPES[e.type].color} flex items-center justify-center text-xl shadow-inner">
                                <i class="fas ${TENANT_TYPES[e.type].icon}"></i>
                            </div>
                            ${perms.canEditEntity(e.id) ? `<button class="text-slate-300 hover:text-brand-600"><i class="fas fa-edit"></i></button>` : ''}
                        </div>
                        <h3 class="font-bold text-lg text-slate-800 mb-1">${e.name}</h3>
                        <p class="text-xs text-slate-500 mb-2">${e.id}</p>
                        <p class="text-sm text-slate-600">${e.location}</p>
                    </div>
                    <div class="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between">
                        <span class="text-xs font-bold ${e.status === 'Active' ? 'text-green-600' : 'text-red-600'}">${e.status}</span>
                        <span class="text-xs text-slate-400">${e.users} مستخدم</span>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    };

    // ADS MANAGER (Scoped + Governance)
    const renderAdsManager = () => {
        const ads = perms.getVisibleAds();
        return `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-slate-800">${perms.isHQ() ? 'حوكمة الإعلانات المركزية' : 'إدارة الحملات الإعلانية'}</h2>
            ${perms.isAdvertiser() ? `<button onclick="app.createAdMock()" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm">+ إعلان جديد</button>` : ''}
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table class="w-full text-right">
                <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                    <tr>
                        <th class="p-4">الإعلان</th>
                        <th class="p-4">المصدر</th>
                        <th class="p-4">الحالة</th>
                        <th class="p-4">التكلفة</th>
                        <th class="p-4">إجراءات</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${ads.map(ad => `
                    <tr class="hover:bg-slate-50/50 transition">
                        <td class="p-4">
                            <p class="font-bold text-slate-800">${ad.title}</p>
                            <span class="text-xs text-slate-400">${ad.scope}</span>
                        </td>
                        <td class="p-4"><span class="text-xs bg-gray-100 px-2 py-1 rounded">${ad.sourceEntityId}</span></td>
                        <td class="p-4">
                            <span class="px-2 py-1 rounded text-[10px] font-bold ${ad.status==='ACTIVE'?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}">
                                ${ad.status}
                            </span>
                        </td>
                        <td class="p-4">${ad.cost} ر.س</td>
                        <td class="p-4 flex gap-2">
                            ${(perms.isHQ() && ad.status === 'PENDING') ? 
                                `<button onclick="app.approveAd(${ad.id})" class="text-green-600 hover:bg-green-50 p-2 rounded"><i class="fas fa-check"></i></button>` : 
                                '<span class="text-slate-300">-</span>'}
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
    };

    // TASKS MANAGER
    const renderTasksManager = () => {
        const tasks = perms.getVisibleTasks();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">المهام والعمليات</h2>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <ul class="space-y-4">
                ${tasks.map(t => `
                <li class="flex items-center gap-4 p-3 border rounded-lg hover:shadow-md transition bg-white">
                    <div class="w-2 h-12 rounded-full ${t.priority==='High'?'bg-red-500':t.priority==='Medium'?'bg-yellow-500':'bg-blue-500'}"></div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-800">${t.title}</h4>
                        <p class="text-xs text-slate-500">${t.type} | الاستحقاق: ${t.dueDate}</p>
                    </div>
                    <span class="text-xs font-bold px-2 py-1 rounded ${t.status==='Done'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-600'}">${t.status}</span>
                </li>
                `).join('')}
            </ul>
        </div>
        `;
    };

    // NEW: AUDIT LOGS
    const renderAuditLogs = () => {
        const logs = perms.getAuditLogs();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">سجل التدقيق (Audit Trail)</h2>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-right">
                    <thead class="bg-slate-900 text-white text-xs uppercase">
                        <tr>
                            <th class="p-4">#</th>
                            <th class="p-4">المستخدم</th>
                            <th class="p-4">الإجراء</th>
                            <th class="p-4">التفاصيل</th>
                            <th class="p-4">التوقيت</th>
                            <th class="p-4">الكيان</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 text-sm text-slate-600">
                        ${logs.map(l => `
                        <tr class="hover:bg-slate-50">
                            <td class="p-4 font-mono text-slate-400">${l.id}</td>
                            <td class="p-4 font-bold text-slate-800">${l.user}</td>
                            <td class="p-4"><span class="px-2 py-1 bg-slate-200 rounded text-xs font-bold">${l.action}</span></td>
                            <td class="p-4">${l.details}</td>
                            <td class="p-4 text-xs font-mono">${l.timestamp}</td>
                            <td class="p-4"><span class="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded">${l.entityId}</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    };

    const renderPlaceholder = () => `<div class="p-10 text-center text-slate-400">لا تملك صلاحية لعرض هذه الصفحة</div>`;

    // --- PUBLIC ACTIONS ---
    return {
        init,
        switchUser,
        loadRoute,
        approveAd: (id) => {
            const ad = db.ads.find(a => a.id === id);
            if (ad) {
                ad.status = 'ACTIVE';
                logAction('APPROVE_AD', `اعتماد الإعلان رقم ${id}`);
                showToast('تم اعتماد الإعلان');
                loadRoute('ads');
            }
        },
        createAdMock: () => {
            // Mock creation
            const newId = db.ads.length + 1;
            db.ads.push({ 
                id: newId, 
                title: 'إعلان جديد تجريبي', 
                content: 'محتوى الإعلان...', 
                type: 'promo', 
                scope: 'LOCAL', 
                status: 'PENDING', 
                sourceEntityId: currentUser.entityId, 
                date: '2023-11-21', 
                cost: 50 
            });
            logAction('CREATE_AD', `إنشاء إعلان جديد رقم ${newId}`);
            showToast('تم إرسال طلب الإعلان');
            loadRoute('ads');
        }
    };
})();

document.addEventListener('DOMContentLoaded', app.init);