/**
 * NAYOSH ERP - Advanced RBAC & Multi-Tenant System
 * Updated: Dashboard Segregation & Operational Tickets
 */

const app = (() => {
    // --- CONFIGURATION ---
    const TENANT_TYPES = {
        HQ: { id: 'HQ', label: 'المكتب الرئيسي', icon: 'fa-building', color: 'text-purple-600', bg: 'bg-purple-50', theme: 'purple' },
        BRANCH: { id: 'BRANCH', label: 'فرع تجزئة', icon: 'fa-store', color: 'text-blue-600', bg: 'bg-blue-50', theme: 'blue' },
        INCUBATOR: { id: 'INCUBATOR', label: 'حاضنة أعمال', icon: 'fa-seedling', color: 'text-orange-600', bg: 'bg-orange-50', theme: 'orange' },
        PLATFORM: { id: 'PLATFORM', label: 'منصة رقمية', icon: 'fa-laptop-code', color: 'text-green-600', bg: 'bg-green-50', theme: 'green' },
        OFFICE: { id: 'OFFICE', label: 'مكتب إداري', icon: 'fa-briefcase', color: 'text-gray-600', bg: 'bg-gray-50', theme: 'gray' }
    };

    const ROLES = {
        ADMIN: 'ADMIN', 
        FINANCE: 'FINANCE', 
        SUPPORT: 'SUPPORT', 
        ADVERTISER: 'ADVERTISER', 
        USER: 'USER'
    };

    // --- DATA LAYER ---
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

        entities: [
            { id: 'HQ001', name: 'المكتب الرئيسي', type: 'HQ', status: 'Active', balance: 2500000, location: 'الرياض', users: 15 },
            { id: 'BR015', name: 'فرع العليا مول', type: 'BRANCH', status: 'Active', balance: 45000, location: 'الرياض - العليا', users: 8 },
            { id: 'BR016', name: 'فرع مول الرياض', type: 'BRANCH', status: 'Active', balance: 32000, location: 'الرياض - النخيل', users: 12 },
            { id: 'INC03', name: 'حاضنة السلامة', type: 'INCUBATOR', status: 'Active', balance: 120000, location: 'جدة', users: 45 },
            { id: 'PLT01', name: 'نايوش كلاود', type: 'PLATFORM', status: 'Active', balance: 500000, location: 'سحابي', users: 1200 },
            { id: 'OFF01', name: 'مكتب الدمام', type: 'OFFICE', status: 'Inactive', balance: 0, location: 'الدمام', users: 0 }
        ],

        ads: [
            { id: 1, title: 'صيانة دورية للنظام', content: 'سيتم توقف النظام للصيانة...', type: 'warning', scope: 'GLOBAL', status: 'ACTIVE', sourceEntityId: 'HQ001', date: '2023-11-20', cost: 0 },
            { id: 3, title: 'خصم خاص للموظفين', content: 'خصم 20% لدى كافية Jolt...', type: 'promo', scope: 'MULTI_BRANCH', status: 'ACTIVE', sourceEntityId: 'BR015', date: '2023-11-20', cost: 100 },
            { id: 5, title: 'افتتاح فرعنا الجديد', content: 'ندعوكم لحفل افتتاح...', type: 'promo', scope: 'GLOBAL', status: 'PENDING', sourceEntityId: 'BR015', date: '2023-11-25', cost: 150 }
        ],

        tasks: [
            { id: 101, title: 'اعتماد الميزانية الربعية', dueDate: '2023-11-30', status: 'Pending', priority: 'High', type: 'Finance', entityId: 'HQ001' },
            { id: 102, title: 'مراجعة طلبات الإعلانات', dueDate: '2023-11-21', status: 'In Progress', priority: 'Medium', type: 'Ops', entityId: 'HQ001' },
            { id: 103, title: 'تجديد رخصة SSL', dueDate: '2023-12-01', status: 'Pending', priority: 'High', type: 'Tech', entityId: 'PLT01' },
            { id: 104, title: 'جرد المخزون الدوري', dueDate: '2023-11-22', status: 'Done', priority: 'Low', type: 'Ops', entityId: 'BR015' },
            { id: 105, title: 'تجهيز حملة العيد', dueDate: '2023-12-05', status: 'Pending', priority: 'High', type: 'Marketing', entityId: 'BR015' },
            { id: 106, title: 'مقابلة شركات ناشئة', dueDate: '2023-11-28', status: 'In Progress', priority: 'Medium', type: 'Incubation', entityId: 'INC03' }
        ],

        tickets: [
            { id: 'T-201', subject: 'تعطل التكييف في المستودع', status: 'Open', priority: 'High', type: 'Facility', entityId: 'BR015', date: '2023-11-20' },
            { id: 'T-202', subject: 'طلب زيادة مساحة تخزينية', status: 'In Progress', priority: 'Medium', type: 'Tech', entityId: 'INC03', date: '2023-11-19' },
            { id: 'T-203', subject: 'مشكلة في طباعة الفواتير', status: 'Closed', priority: 'Low', type: 'Support', entityId: 'BR015', date: '2023-11-18' },
            { id: 'T-204', subject: 'API Latency Spike', status: 'Open', priority: 'Critical', type: 'System', entityId: 'PLT01', date: '2023-11-21' }
        ],

        notifications: [
            { id: 1, msg: 'تم اعتماد الميزانية الجديدة', time: 'منذ ساعة', type: 'success', entityId: 'HQ001' },
            { id: 2, msg: 'يوجد 3 تذاكر دعم فني عاجلة', time: 'منذ ساعتين', type: 'warning', entityId: 'PLT01' },
            { id: 3, msg: 'تذكير: موعد الجرد غداً', time: 'منذ 3 ساعات', type: 'info', entityId: 'BR015' }
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
            if (perms.isHQ() && perms.isAdmin()) return db.tasks; 
            return db.tasks.filter(t => t.entityId === currentUser.entityId);
        },

        getVisibleTickets: () => {
            if (perms.isHQ() && perms.isAdmin()) return db.tickets;
            return db.tickets.filter(t => t.entityId === currentUser.entityId);
        },

        getVisibleNotifications: () => {
             return db.notifications.filter(n => n.entityId === currentUser.entityId || n.entityId === 'GLOBAL');
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
            
            document.getElementById('main-view').innerHTML = `<div class="flex h-full items-center justify-center flex-col"><i class="fas fa-circle-notch fa-spin text-4xl text-brand-500 mb-4"></i><p class="text-slate-500">جاري تحميل واجهة ${TENANT_TYPES[u.tenantType].label}...</p></div>`;
            
            setTimeout(() => { 
                renderSidebar(); 
                updateHeader(); 
                loadRoute('dashboard');
                showToast(`تم التحويل إلى: ${currentUser.name}`);
            }, 800);
        }
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = currentUser.tenantType + ' | ' + currentUser.role;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        document.getElementById('entity-badge').innerText = currentUser.entityName;
        
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
        switch (route) {
            case 'dashboard': content = renderDashboard(); break;
            case 'entities': content = renderEntitiesManager(); break;
            case 'ads': content = renderAdsManager(); break;
            case 'tasks': content = renderTasksManager(); break;
            case 'tickets': content = renderTicketsManager(); break;
            case 'audit-logs': content = renderAuditLogs(); break;
            default: content = renderPlaceholder();
        }

        view.innerHTML = `<div class="fade-in">${content}</div>`;
        updateActiveLink(route);
    };

    const updateActiveLink = (route) => {
        // Just simple logic to highlight sidebar
        const links = document.querySelectorAll('#nav-menu a');
        links.forEach(l => l.classList.remove('bg-slate-800', 'text-white'));
        const active = document.getElementById(`link-${route}`);
        if(active) active.classList.add('bg-slate-800', 'text-white');
    }

    const getTitle = (r) => {
        const map = { 
            'dashboard': 'لوحة القيادة الموحدة',
            'entities': 'إدارة الكيانات والفروع',
            'ads': 'الحملات والإعلانات',
            'audit-logs': 'سجل التدقيق (Audit Logs)',
            'tasks': 'المهام والعمليات',
            'tickets': 'تذاكر الدعم والتشغيل'
        };
        return map[r] || 'نايوش ERP';
    };

    // --- RENDERERS ---
    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        let items = [
            { id: 'dashboard', icon: 'fa-chart-pie', label: 'الرئيسية', show: true },
            { id: 'entities', icon: 'fa-sitemap', label: 'الكيانات', show: true },
            { id: 'tasks', icon: 'fa-tasks', label: 'المهام', show: true },
            { id: 'tickets', icon: 'fa-ticket-alt', label: 'التذاكر', show: true },
            { id: 'ads', icon: 'fa-bullhorn', label: perms.isHQ() ? 'حوكمة الإعلانات' : 'إعلاناتي', show: perms.isAdvertiser() || perms.isAdmin() },
            { id: 'audit-logs', icon: 'fa-clipboard-list', label: 'سجل التدقيق', show: perms.isAdmin() || perms.isHQ() }
        ];

        menu.innerHTML = items.filter(i => i.show).map(item => 
            `<li>
                <a href="#" id="link-${item.id}" onclick="app.loadRoute('${item.id}')" 
                   class="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition group">
                   <i class="fas ${item.icon} w-6 text-center text-slate-400 group-hover:text-brand-400 transition-colors"></i> 
                   ${item.label}
                </a>
            </li>`
        ).join('');
    };

    // --- MASTER DASHBOARD CONTROLLER ---
    const renderDashboard = () => {
        switch (currentUser.tenantType) {
            case 'HQ': return renderHQDashboard();
            case 'BRANCH': return renderBranchDashboard();
            case 'INCUBATOR': return renderIncubatorDashboard();
            case 'PLATFORM': return renderPlatformDashboard();
            case 'OFFICE': return renderOfficeDashboard();
            default: return `<div class="text-center p-10">جاري تحميل لوحة التحكم العامة...</div>`;
        }
    };

    // 1. HQ DASHBOARD (Aggregated)
    const renderHQDashboard = () => {
        const totalBalance = db.entities.reduce((acc, e) => acc + e.balance, 0);
        const totalUsers = db.entities.reduce((acc, e) => acc + e.users, 0);
        const activeEntities = db.entities.filter(e => e.status === 'Active').length;
        const criticalTickets = db.tickets.filter(t => t.priority === 'Critical').length;

        return `
        <div class="mb-6 flex justify-between items-end">
            <div>
                <h2 class="text-3xl font-bold text-gray-800">مركز القيادة (HQ)</h2>
                <p class="text-gray-500">نظرة شمولية على جميع الكيانات والأصول</p>
            </div>
            <div class="flex gap-2">
                <button class="px-4 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition">تقرير مالي موحد</button>
            </div>
        </div>

        <!-- KPI CARDS -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            ${renderKpiCard('إجمالي السيولة', totalBalance.toLocaleString() + ' ر.س', 'fa-wallet', 'text-green-600', 'bg-green-50', '+12%')}
            ${renderKpiCard('إجمالي المستخدمين', totalUsers, 'fa-users', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('الكيانات النشطة', activeEntities + '/' + db.entities.length, 'fa-building', 'text-purple-600', 'bg-purple-50')}
            ${renderKpiCard('تذاكر حرجة', criticalTickets, 'fa-exclamation-triangle', 'text-red-600', 'bg-red-50', 'انتبه')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- ENTITY PERFORMANCE MATRIX -->
            <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-4 border-b border-slate-50 flex justify-between items-center">
                    <h3 class="font-bold text-gray-700">مصفوفة أداء الكيانات</h3>
                    <span class="text-xs bg-slate-100 px-2 py-1 rounded">تحديث مباشر</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-right text-sm">
                        <thead class="bg-slate-50 text-slate-500 font-bold">
                            <tr>
                                <th class="p-3">الكيان</th>
                                <th class="p-3">النوع</th>
                                <th class="p-3">الرصيد</th>
                                <th class="p-3">الحالة</th>
                                <th class="p-3">الأداء</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            ${db.entities.map(e => `
                            <tr class="hover:bg-slate-50/50">
                                <td class="p-3 font-semibold text-gray-700">${e.name}</td>
                                <td class="p-3"><span class="text-xs px-2 py-1 rounded-full ${TENANT_TYPES[e.type].bg} ${TENANT_TYPES[e.type].color}">${TENANT_TYPES[e.type].label}</span></td>
                                <td class="p-3 font-mono">${e.balance.toLocaleString()}</td>
                                <td class="p-3"><span class="w-2 h-2 rounded-full inline-block mr-1 ${e.status==='Active'?'bg-green-500':'bg-red-500'}"></span> ${e.status}</td>
                                <td class="p-3">
                                    <div class="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div class="h-full bg-brand-500" style="width: ${Math.random() * 40 + 60}%"></div>
                                    </div>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- ALERTS & SYSTEM HEALTH -->
            <div class="space-y-6">
                <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-gray-700 mb-4">حالة النظام (System Health)</h3>
                    <div class="space-y-4">
                        <div>
                            <div class="flex justify-between text-xs mb-1"><span>الخوادم</span><span class="text-green-600">99.9%</span></div>
                            <div class="w-full bg-slate-100 rounded-full h-1.5"><div class="bg-green-500 h-1.5 rounded-full" style="width: 99%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs mb-1"><span>قواعد البيانات</span><span class="text-green-600">مستقر</span></div>
                            <div class="w-full bg-slate-100 rounded-full h-1.5"><div class="bg-green-500 h-1.5 rounded-full" style="width: 95%"></div></div>
                        </div>
                    </div>
                </div>

                <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-gray-700 mb-4">أحدث الإجراءات الإدارية</h3>
                    <ul class="space-y-3 text-sm">
                         ${db.auditLogs.slice(0, 3).map(log => `
                            <li class="flex gap-3">
                                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500"><i class="fas fa-history text-xs"></i></div>
                                <div>
                                    <p class="font-bold text-gray-800 text-xs">${log.action}</p>
                                    <p class="text-gray-500 text-[10px]">${log.details}</p>
                                </div>
                            </li>
                         `).join('')}
                    </ul>
                </div>
            </div>
        </div>
        `;
    };

    // 2. BRANCH DASHBOARD
    const renderBranchDashboard = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        const myTickets = db.tickets.filter(t => t.entityId === currentUser.entityId);
        
        return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">لوحة الفروع (${entity.name})</h2>
            <div class="flex gap-2 text-sm text-gray-500 mt-1">
                <span><i class="fas fa-map-marker-alt"></i> ${entity.location}</span>
                <span class="mx-2">|</span>
                <span><i class="fas fa-user-friends"></i> ${entity.users} موظف</span>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${renderKpiCard('رصيد الفرع', entity.balance.toLocaleString(), 'fa-cash-register', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('حملات نشطة', db.ads.filter(a => a.sourceEntityId === entity.id && a.status === 'ACTIVE').length, 'fa-bullhorn', 'text-orange-600', 'bg-orange-50')}
            ${renderKpiCard('تذاكر مفتوحة', myTickets.filter(t => t.status === 'Open').length, 'fa-ticket-alt', 'text-red-600', 'bg-red-50')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Operational Tickets -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-700">تذاكر التشغيل (Operational)</h3>
                    <button onclick="app.loadRoute('tickets')" class="text-xs text-blue-600 hover:underline">عرض الكل</button>
                </div>
                ${myTickets.length ? `
                    <ul class="space-y-3">
                        ${myTickets.slice(0,3).map(t => `
                        <li class="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div class="flex items-center gap-3">
                                <div class="w-2 h-2 rounded-full ${t.priority==='High'?'bg-red-500':'bg-green-500'}"></div>
                                <div>
                                    <p class="font-bold text-sm text-gray-800">${t.subject}</p>
                                    <p class="text-[10px] text-gray-500">${t.type}</p>
                                </div>
                            </div>
                            <span class="text-xs font-bold px-2 py-1 rounded bg-white border shadow-sm">${t.status}</span>
                        </li>
                        `).join('')}
                    </ul>
                ` : '<p class="text-sm text-slate-400">لا توجد تذاكر نشطة</p>'}
            </div>

            <!-- Local Notifications -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 class="font-bold text-gray-700 mb-4">تنبيهات الفرع</h3>
                <div class="space-y-4">
                    <div class="flex gap-3 items-start">
                        <div class="mt-1 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs"><i class="fas fa-bell"></i></div>
                        <div>
                            <p class="text-sm text-gray-800 font-semibold">موعد جرد المخزون</p>
                            <p class="text-xs text-gray-500">تذكير للقيام بالجرد الشهري غداً صباحاً.</p>
                        </div>
                    </div>
                     <div class="flex gap-3 items-start">
                        <div class="mt-1 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs"><i class="fas fa-info"></i></div>
                        <div>
                            <p class="text-sm text-gray-800 font-semibold">تحديث سياسات الخصم</p>
                            <p class="text-xs text-gray-500">تم تحديث سياسة الخصومات للموظفين من قبل HQ.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    };

    // 3. INCUBATOR DASHBOARD
    const renderIncubatorDashboard = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        return `
        <div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-8 text-white mb-8 shadow-lg">
            <h2 class="text-3xl font-bold mb-2">حاضنة الأعمال (${entity.name})</h2>
            <p class="opacity-90">بيئة ريادية متكاملة لدعم الشركات الناشئة</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${renderKpiCard('الشركات المحتضنة', '12', 'fa-rocket', 'text-orange-600', 'bg-orange-50')}
            ${renderKpiCard('نسبة الإشغال', '85%', 'fa-chair', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('ساعات التوجيه', '120h', 'fa-chalkboard-teacher', 'text-purple-600', 'bg-purple-50')}
            ${renderKpiCard('الفعاليات القادمة', '3', 'fa-calendar-alt', 'text-pink-600', 'bg-pink-50')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 class="font-bold text-gray-800 mb-4">الشركات الناشئة (Startups Overview)</h3>
                <!-- Mock Chart Area -->
                <div class="h-48 bg-slate-50 rounded flex items-center justify-center border border-dashed border-slate-300">
                    <span class="text-slate-400">[رسم بياني لنمو الشركات]</span>
                </div>
            </div>
             <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 class="font-bold text-gray-800 mb-4">طلبات المرافق</h3>
                <ul class="space-y-2">
                    <li class="text-sm p-2 bg-slate-50 rounded flex justify-between">
                        <span>حجز قاعة الاجتماعات A</span>
                        <span class="text-xs text-green-600 font-bold">مقبول</span>
                    </li>
                    <li class="text-sm p-2 bg-slate-50 rounded flex justify-between">
                        <span>طلب جهاز عرض (Projector)</span>
                        <span class="text-xs text-orange-600 font-bold">قيد المراجعة</span>
                    </li>
                </ul>
            </div>
        </div>
        `;
    };

    // 4. PLATFORM DASHBOARD
    const renderPlatformDashboard = () => {
        return `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">لوحة المنصة الرقمية (Cloud Ops)</h2>
            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Systems Operational</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
                <p class="text-slate-400 text-xs mb-1">Active Connections</p>
                <h3 class="text-3xl font-mono font-bold text-green-400">1,245</h3>
            </div>
             <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p class="text-slate-500 text-xs mb-1 font-bold">Avg Response Time</p>
                <h3 class="text-2xl font-mono font-bold text-slate-800">45ms</h3>
            </div>
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                <p class="text-slate-500 text-xs mb-1 font-bold">Error Rate</p>
                <h3 class="text-2xl font-mono font-bold text-red-500">0.02%</h3>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 class="font-bold text-gray-700 mb-4">تذاكر الدعم الفني</h3>
                ${db.tickets.filter(t => t.entityId === 'PLT01').map(t => `
                <div class="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <div>
                        <p class="text-sm font-bold text-gray-800">${t.subject}</p>
                        <p class="text-xs text-slate-400">${t.id}</p>
                    </div>
                    <span class="text-xs px-2 py-1 rounded bg-slate-100">${t.priority}</span>
                </div>
                `).join('')}
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 class="font-bold text-gray-700 mb-4">Server Load Distribution</h3>
                <div class="flex gap-2 items-end h-32 justify-center">
                    <div class="w-8 bg-blue-200 h-20 rounded-t"></div>
                    <div class="w-8 bg-blue-300 h-24 rounded-t"></div>
                    <div class="w-8 bg-blue-500 h-32 rounded-t animate-pulse"></div>
                    <div class="w-8 bg-blue-300 h-16 rounded-t"></div>
                    <div class="w-8 bg-blue-200 h-12 rounded-t"></div>
                </div>
            </div>
        </div>
        `;
    };

    // 5. OFFICE DASHBOARD
    const renderOfficeDashboard = () => {
        return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">المكتب الإداري</h2>
            <p class="text-gray-500">إدارة المهام الإدارية والطلبات الداخلية</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${renderKpiCard('طلبات معلقة', '5', 'fa-inbox', 'text-gray-600', 'bg-gray-100')}
            ${renderKpiCard('الموظفين', '12', 'fa-users', 'text-gray-600', 'bg-gray-100')}
        </div>
        `;
    };

    // --- ENTITIES MANAGER ---
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

    // --- TICKETS MANAGER ---
    const renderTicketsManager = () => {
        const tickets = perms.getVisibleTickets();
        return `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-slate-800">تذاكر الدعم والتشغيل</h2>
            <button class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-brand-700">+ تذكرة جديدة</button>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table class="w-full text-right">
                <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                    <tr>
                        <th class="p-4">رقم التذكرة</th>
                        <th class="p-4">الموضوع</th>
                        <th class="p-4">النوع</th>
                        <th class="p-4">الأولوية</th>
                        <th class="p-4">الحالة</th>
                        <th class="p-4">الكيان</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${tickets.map(t => `
                    <tr class="hover:bg-slate-50/50">
                        <td class="p-4 font-mono text-slate-500">${t.id}</td>
                        <td class="p-4 font-bold text-gray-800">${t.subject}</td>
                        <td class="p-4">${t.type}</td>
                        <td class="p-4"><span class="text-xs px-2 py-1 rounded ${t.priority === 'High' || t.priority === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">${t.priority}</span></td>
                        <td class="p-4">
                            <span class="text-xs font-bold px-2 py-1 rounded-full ${t.status === 'Open' ? 'bg-green-100 text-green-700' : t.status === 'Closed' ? 'bg-gray-100 text-gray-500' : 'bg-orange-100 text-orange-700'}">
                                ${t.status}
                            </span>
                        </td>
                        <td class="p-4 text-xs text-gray-400">${t.entityId}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
    };

    // --- ADS MANAGER ---
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

    // --- TASKS MANAGER ---
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

    // --- AUDIT LOGS ---
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

    const renderKpiCard = (title, value, icon, colorClass, bgClass, badge = null) => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:-translate-y-1 transition duration-300">
            <div class="absolute top-0 right-0 w-24 h-24 ${bgClass} rounded-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition"></div>
            <div class="relative z-10">
                <p class="text-xs text-slate-500 font-bold mb-1">${title}</p>
                <h3 class="text-2xl font-bold text-slate-800">${value}</h3>
                <div class="w-10 h-10 rounded-full ${bgClass} ${colorClass} flex items-center justify-center absolute left-5 top-5 shadow-sm">
                    <i class="fas ${icon}"></i>
                </div>
                ${badge ? `<span class="absolute top-5 left-16 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">${badge}</span>` : ''}
            </div>
        </div>
    `;

    // --- PUBLIC ACTIONS ---
    return {
        init,
        switchUser,
        loadRoute,
        createAdMock: () => {
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
        },
        approveAd: (id) => {
            const ad = db.ads.find(a => a.id === id);
            if (ad) {
                ad.status = 'ACTIVE';
                logAction('APPROVE_AD', `اعتماد الإعلان رقم ${id}`);
                showToast('تم اعتماد الإعلان');
                loadRoute('ads');
            }
        }
    };
})();

document.addEventListener('DOMContentLoaded', app.init);