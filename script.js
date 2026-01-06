/**
 * NAYOSH ERP - Advanced RBAC System
 * Implements strict data isolation and granular permissions:
 * HQ Admin, Branch Admin, Incubator Admin, Platform Admin, Office Admin, Finance, Support, Advertiser, End User.
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

    // Strict Role Definitions
    const ROLES = {
        ADMIN: 'ADMIN',       // Full Control within Entity
        FINANCE: 'FINANCE',   // Financial View & Ops
        SUPPORT: 'SUPPORT',   // Tickets & Helpdesk
        ADVERTISER: 'ADVERTISER', // Ads & Marketing
        USER: 'USER'          // Read Only / End User
    };

    const AD_LEVELS = {
        L1_LOCAL: { id: 1, label: 'محلي (Local)', desc: 'داخل الفرع فقط', cost: 0, requireApproval: false, badge: 'bg-gray-100 text-gray-600' },
        L2_MULTI: { id: 2, label: 'متعدد الفروع (Paid)', desc: 'حملة مدفوعة لعدة فروع', cost: 500, requireApproval: true, badge: 'bg-blue-100 text-blue-600' },
        L3_INC_INT: { id: 3, label: 'مجتمع الحاضنة', desc: 'لشركات الحاضنة فقط', cost: 100, requireApproval: true, badge: 'bg-orange-100 text-orange-600' },
        L4_PLT_INT: { id: 4, label: 'داخل المنصة', desc: 'لمستخدمي النظام الرقمي', cost: 1000, requireApproval: true, badge: 'bg-green-100 text-green-600' },
        L5_CROSS_INC: { id: 5, label: 'عابر للحاضنات', desc: 'نشر في حاضنات أخرى', cost: 1500, requireApproval: true, badge: 'bg-purple-100 text-purple-600' }
    };

    // --- DATA LAYER ---
    const db = {
        users: [
            // Admins (By Entity Type)
            { id: 1, name: 'م. أحمد العلي', role: ROLES.ADMIN, tenantType: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي' },
            { id: 2, name: 'سارة محمد', role: ROLES.ADMIN, tenantType: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول' },
            { id: 3, name: 'د. خالد الزهراني', role: ROLES.ADMIN, tenantType: 'INCUBATOR', entityId: 'INC03', entityName: 'حاضنة السلامة' },
            { id: 4, name: 'فريق التقنية', role: ROLES.ADMIN, tenantType: 'PLATFORM', entityId: 'PLT01', entityName: 'نايوش كلاود' },
            { id: 5, name: 'يوسف المكتب', role: ROLES.ADMIN, tenantType: 'OFFICE', entityId: 'OFF01', entityName: 'مكتب الدمام' },
            
            // Functional Roles
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
            { id: 'INC04', name: 'حاضنة الرياض تك', type: 'INCUBATOR', status: 'Active', balance: 200000, location: 'الرياض', users: 60 },
            { id: 'PLT01', name: 'نايوش كلاود', type: 'PLATFORM', status: 'Active', balance: 500000, location: 'سحابي', users: 1200 },
            { id: 'OFF01', name: 'مكتب الدمام', type: 'OFFICE', status: 'Active', balance: 15000, location: 'الدمام', users: 4 }
        ],

        ads: [
            { id: 1, title: 'صيانة دورية للنظام', content: 'سيتم توقف النظام للصيانة فجر الجمعة.', level: 'GLOBAL', scope: 'ALL', status: 'ACTIVE', sourceEntityId: 'HQ001', targetIds: [], date: '2023-11-20', cost: 0 },
            { id: 2, title: 'اجتماع موظفين داخلي', content: 'اجتماع لمناقشة التارجت الشهري.', level: 'L1_LOCAL', scope: 'LOCAL', status: 'ACTIVE', sourceEntityId: 'BR015', targetIds: ['BR015'], date: '2023-11-21', cost: 0 },
            { id: 3, title: 'خصم موحد 20%', content: 'حملة ترويجية مشتركة بين الفروع.', level: 'L2_MULTI', scope: 'MULTI', status: 'ACTIVE', sourceEntityId: 'BR015', targetIds: ['BR015', 'BR016'], date: '2023-11-22', cost: 500 },
            { id: 5, title: 'تحدي الابتكار المفتوح', content: 'دعوة لجميع الحاضنات للمشاركة.', level: 'L5_CROSS_INC', scope: 'MULTI', status: 'PENDING', sourceEntityId: 'INC03', targetIds: ['INC03', 'INC04'], date: '2023-11-24', cost: 1500 }
        ],

        tasks: [
            { id: 101, title: 'اعتماد الميزانية الربعية', dueDate: '2023-11-30', status: 'Pending', priority: 'High', type: 'Finance', entityId: 'HQ001' },
            { id: 102, title: 'مراجعة طلبات الإعلانات', dueDate: '2023-11-21', status: 'In Progress', priority: 'Medium', type: 'Ops', entityId: 'HQ001' },
            { id: 104, title: 'جرد المخزون الدوري', dueDate: '2023-11-22', status: 'Done', priority: 'Low', type: 'Ops', entityId: 'BR015' }
        ],

        tickets: [
            { id: 'T-201', subject: 'تعطل التكييف في المستودع', status: 'Open', priority: 'High', type: 'Facility', entityId: 'BR015', date: '2023-11-20' },
            { id: 'T-204', subject: 'API Latency Spike', status: 'Open', priority: 'Critical', type: 'System', entityId: 'PLT01', date: '2023-11-21' }
        ],

        auditLogs: [
            { id: 1, user: 'م. أحمد العلي', role: 'HQ Admin', action: 'LOGIN', details: 'تم تسجيل الدخول للنظام', timestamp: '2023-11-20 08:00', entityId: 'HQ001' },
            { id: 2, user: 'سارة محمد', role: 'Branch Admin', action: 'CREATE_AD', details: 'إنشاء إعلان: خصم خاص للموظفين', timestamp: '2023-11-20 09:15', entityId: 'BR015' }
        ]
    };

    let currentUser = db.users[0];

    // --- GRANULAR PERMISSIONS LOGIC ---
    const perms = {
        // Scope Checks
        isHQ: () => currentUser.tenantType === 'HQ',
        isMyEntity: (id) => currentUser.entityId === id,
        
        // Role Checks
        isAdmin: () => currentUser.role === ROLES.ADMIN,
        isFinance: () => currentUser.role === ROLES.FINANCE,
        isSupport: () => currentUser.role === ROLES.SUPPORT,
        isAdvertiser: () => currentUser.role === ROLES.ADVERTISER,
        isUser: () => currentUser.role === ROLES.USER,

        // --- CAPABILITIES (Strict Isolation) ---

        // 1. Can View Entity Data? (Strict: HQ Global or Local Only)
        canViewEntity: (eId) => {
            if (perms.isHQ() && perms.isAdmin()) return true; // HQ Super Admin sees all
            return currentUser.entityId === eId; // Everyone else sees ONLY their entity
        },

        // 2. Can Edit Entity Settings? (Admin Only)
        canEditEntity: (eId) => {
            return perms.isAdmin() && perms.canViewEntity(eId);
        },

        // 3. Can View Financial Balance? (Admin + Finance Only)
        canViewBalance: () => {
            return perms.isAdmin() || perms.isFinance();
        },

        // 4. Can Manage Ads? (Admin + Advertiser Only)
        canManageAds: () => {
            return perms.isAdmin() || perms.isAdvertiser();
        },

        // 5. Can View Audit Logs? (Admin Only)
        canViewAuditLogs: () => {
            return perms.isAdmin();
        },

        // 6. Can Manage Tickets? (Admin + Support Only)
        canManageTickets: () => {
            return perms.isAdmin() || perms.isSupport();
        },

        // --- DATA FILTERING HELPERS ---
        getVisibleEntities: () => {
            if (perms.isHQ() && perms.isAdmin()) return db.entities;
            return db.entities.filter(e => e.id === currentUser.entityId);
        },

        getVisibleAds: () => {
            // View logic: Can see Global HQ ads AND local ads AND ads targeted at my entity
            return db.ads.filter(ad => {
                if (ad.level === 'GLOBAL') return true;
                const isSource = ad.sourceEntityId === currentUser.entityId;
                const isTarget = ad.targetIds.includes(currentUser.entityId);
                if (isSource) return true;
                if (isTarget && ad.status === 'ACTIVE') return true;
                return false;
            });
        },

        getVisibleAuditLogs: () => {
             if (perms.isHQ() && perms.isAdmin()) return db.auditLogs;
             // Admin of a branch sees logs for that branch only
             if (perms.isAdmin()) return db.auditLogs.filter(l => l.entityId === currentUser.entityId);
             // Others see nothing
             return [];
        }
    };

    // --- AUDIT SYSTEM ---
    const logAction = (action, details) => {
        const now = new Date();
        const log = {
            id: db.auditLogs.length + 1,
            user: currentUser.name,
            role: `${currentUser.tenantType} ${currentUser.role}`,
            action: action,
            details: details,
            timestamp: now.toISOString().slice(0, 16).replace('T', ' '),
            entityId: currentUser.entityId
        };
        db.auditLogs.unshift(log);
    };

    // --- UI HELPERS ---
    const showToast = (msg, type = 'info') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const colors = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-slate-800';
        toast.className = `${colors} text-white px-4 py-3 rounded-lg shadow-xl text-sm fade-in flex items-center gap-3`;
        toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    // --- CORE LOGIC ---
    const init = () => {
        renderSidebar();
        updateHeader();
        loadRoute('dashboard');
        showToast(`مرحباً ${currentUser.name} (${currentUser.role})`);
    };

    const switchUser = (id) => {
        const u = db.users.find(x => x.id === id);
        if (u) {
            logAction('LOGOUT', `تسجيل خروج المستخدم ${currentUser.name}`);
            currentUser = u;
            logAction('LOGIN', `تسجيل دخول للدور ${currentUser.tenantType} - ${currentUser.role}`);
            
            document.getElementById('main-view').innerHTML = `<div class="flex h-full items-center justify-center flex-col gap-4"><i class="fas fa-fingerprint text-6xl text-brand-200 animate-pulse"></i><p class="text-slate-500 font-bold">جاري تطبيق سياسات ${u.role}...</p></div>`;
            
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

    const loadRoute = (route) => {
        const view = document.getElementById('main-view');
        document.getElementById('page-title').innerText = getTitle(route);
        
        let content = '';
        // Route Guarding
        if (route === 'audit-logs' && !perms.canViewAuditLogs()) {
            content = renderPlaceholder('عفواً، ليس لديك صلاحية الاطلاع على سجلات التدقيق');
        } else {
             switch (route) {
                case 'dashboard': content = renderDashboard(); break;
                case 'entities': content = renderEntitiesManager(); break;
                case 'ads': content = renderAdsManager(); break;
                case 'tasks': content = renderTasksManager(); break;
                case 'tickets': content = renderTicketsManager(); break;
                case 'audit-logs': content = renderAuditLogs(); break;
                case 'permissions': content = renderPermissionsMatrix(); break;
                default: content = renderPlaceholder();
            }
        }

        view.innerHTML = `<div class="fade-in">${content}</div>`;
        updateActiveLink(route);
    };

    const updateActiveLink = (route) => {
        const links = document.querySelectorAll('#nav-menu a');
        links.forEach(l => l.classList.remove('bg-slate-800', 'text-white'));
        const active = document.getElementById(`link-${route}`);
        if(active) active.classList.add('bg-slate-800', 'text-white');
    }

    const getTitle = (r) => {
        const map = { 
            'dashboard': 'لوحة القيادة الموحدة',
            'entities': 'إدارة الكيانات والفروع',
            'ads': 'منصة الإعلانات المركزية',
            'audit-logs': 'سجل التدقيق (Audit Logs)',
            'tasks': 'المهام والعمليات',
            'tickets': 'تذاكر الدعم والتشغيل',
            'permissions': 'مصفوفة الصلاحيات (Roles Matrix)'
        };
        return map[r] || 'نايوش ERP';
    };

    // --- RENDERERS ---
    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        let items = [
            { id: 'dashboard', icon: 'fa-chart-pie', label: 'الرئيسية', show: true },
            { id: 'entities', icon: 'fa-sitemap', label: 'الكيان', show: true },
            { id: 'ads', icon: 'fa-bullhorn', label: 'الإعلانات', show: true },
            { id: 'tasks', icon: 'fa-tasks', label: 'المهام', show: true },
            { id: 'tickets', icon: 'fa-ticket-alt', label: 'التذاكر', show: true },
            { id: 'audit-logs', icon: 'fa-clipboard-list', label: 'سجل التدقيق', show: perms.canViewAuditLogs() },
            { id: 'permissions', icon: 'fa-shield-alt', label: 'الصلاحيات', show: true }
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

    // --- MASKED DATA COMPONENT ---
    const renderMaskedBalance = (balance) => {
        if (perms.canViewBalance()) {
            return balance.toLocaleString() + ' ر.س';
        }
        return '<span class="text-slate-400 tracking-widest">****</span>';
    };

    // --- DASHBOARDS ---
    const renderDashboard = () => {
        // Common Header
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        if (!entity) return renderPlaceholder('الكيان غير موجود');

        return `
        <div class="mb-8 flex justify-between items-end">
            <div>
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-1 rounded text-[10px] bg-slate-200 text-slate-600 font-bold">${currentUser.role}</span>
                    ${perms.isHQ() ? '<span class="px-2 py-1 rounded text-[10px] bg-purple-100 text-purple-600 font-bold">HQ ACCESS</span>' : ''}
                </div>
                <h2 class="text-3xl font-bold text-gray-800">${entity.name}</h2>
                <p class="text-gray-500">${entity.location} | المستخدم الحالي: ${currentUser.name}</p>
            </div>
            <div class="text-left">
                 <p class="text-xs text-slate-400 font-bold uppercase">المحفظة الرقمية</p>
                 <p class="text-2xl font-mono font-bold ${perms.canViewBalance() ? 'text-brand-600' : 'text-slate-400'}">
                    ${renderMaskedBalance(entity.balance)}
                 </p>
            </div>
        </div>

        ${renderAdsWidget()}

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            ${renderKpiCard('إعلاناتي', db.ads.filter(a => a.sourceEntityId === entity.id).length, 'fa-bullhorn', 'text-orange-600', 'bg-orange-50')}
            ${renderKpiCard('المهام المعلقة', db.tasks.filter(t => t.entityId === entity.id && t.status === 'Pending').length, 'fa-tasks', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('تذاكر مفتوحة', db.tickets.filter(t => t.entityId === entity.id && t.status === 'Open').length, 'fa-ticket-alt', 'text-red-600', 'bg-red-50')}
            ${renderKpiCard('الموظفين', entity.users, 'fa-users', 'text-teal-600', 'bg-teal-50')}
        </div>

        <!-- Role Specific Notice -->
        ${!perms.isAdmin() ? `
        <div class="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded shadow-sm flex items-start gap-3">
            <i class="fas fa-lock text-yellow-600 mt-1"></i>
            <div>
                <h4 class="font-bold text-yellow-800">صلاحيات محدودة (${currentUser.role})</h4>
                <p class="text-sm text-yellow-700 mt-1">
                    أنت تعمل الآن بصلاحيات مقيدة. لا يمكنك الاطلاع على الأرصدة أو سجلات التدقيق أو تعديل إعدادات الكيان إلا إذا كان دورك يسمح بذلك.
                </p>
            </div>
        </div>
        ` : ''}
        `;
    };

    const renderAdsWidget = () => {
        const visibleAds = perms.getVisibleAds();
        if (visibleAds.length === 0) return '';

        return `
        <div class="mb-8">
            <div class="flex items-center gap-2 mb-4">
                <i class="fas fa-bullhorn text-brand-500"></i>
                <h3 class="font-bold text-gray-700">آخر التعاميم والإعلانات</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${visibleAds.slice(0, 3).map(ad => {
                    const isHQ = ad.level === 'GLOBAL';
                    return `
                    <div class="bg-white border-r-4 ${isHQ ? 'border-purple-600' : 'border-blue-400'} rounded-l-lg shadow-sm p-4 hover:shadow-md transition relative">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block ${isHQ ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                            ${isHQ ? 'HQ تعميم' : 'إعلان'}
                        </span>
                        <h4 class="font-bold text-gray-800 mb-1">${ad.title}</h4>
                        <p class="text-sm text-gray-500 line-clamp-2">${ad.content}</p>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    };

    // --- MANAGERS ---
    const renderEntitiesManager = () => {
        const entities = perms.getVisibleEntities();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">بيانات الكيان</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${entities.map(e => `
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group">
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-lg ${TENANT_TYPES[e.type].bg} ${TENANT_TYPES[e.type].color} flex items-center justify-center text-xl">
                                <i class="fas ${TENANT_TYPES[e.type].icon}"></i>
                            </div>
                            <div class="bg-slate-100 px-2 py-1 rounded text-xs font-mono font-bold min-w-[80px] text-center">
                                ${renderMaskedBalance(e.balance)}
                            </div>
                        </div>
                        <h3 class="font-bold text-lg text-slate-800">${e.name}</h3>
                        <p class="text-sm text-slate-600 mb-4">${e.location}</p>
                        <div class="border-t pt-3 flex justify-between items-center text-xs text-gray-500">
                            <span>${e.status}</span>
                            ${perms.canEditEntity(e.id) ? '<button class="text-brand-600 font-bold hover:underline">تعديل</button>' : '<i class="fas fa-lock opacity-50"></i>'}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    };

    const renderAdsManager = () => {
        const ads = perms.getVisibleAds();
        return `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-slate-800">الإعلانات</h2>
            ${perms.canManageAds() ? `
            <button onclick="app.openAdBuilderModal()" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-brand-700 flex items-center gap-2">
                <i class="fas fa-plus"></i> إنشاء حملة
            </button>` : ''}
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <table class="w-full text-right">
                <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                    <tr>
                        <th class="p-4">الإعلان</th>
                        <th class="p-4">المصدر</th>
                        <th class="p-4">التكلفة</th>
                        <th class="p-4">الحالة</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${ads.map(ad => `
                        <tr class="hover:bg-slate-50/50">
                            <td class="p-4 font-bold">${ad.title}</td>
                            <td class="p-4 text-xs">${ad.sourceEntityId}</td>
                            <td class="p-4 font-mono">${ad.cost}</td>
                            <td class="p-4"><span class="px-2 py-1 rounded text-[10px] bg-slate-100">${ad.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
    };

    const renderAuditLogs = () => {
        if (!perms.canViewAuditLogs()) return renderPlaceholder('غير مصرح');
        const logs = perms.getVisibleAuditLogs();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">سجلات التدقيق (Audit Trail)</h2>
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <table class="w-full text-right">
                <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                    <tr>
                        <th class="p-4">الوقت</th>
                        <th class="p-4">المستخدم</th>
                        <th class="p-4">الدور</th>
                        <th class="p-4">الحدث (Action)</th>
                        <th class="p-4">التفاصيل</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${logs.map(log => `
                        <tr class="hover:bg-slate-50/50">
                            <td class="p-4 text-gray-500 font-mono text-xs">${log.timestamp}</td>
                            <td class="p-4 font-bold">${log.user}</td>
                            <td class="p-4 text-xs"><span class="bg-slate-100 px-2 py-1 rounded">${log.role}</span></td>
                            <td class="p-4 font-bold text-brand-600">${log.action}</td>
                            <td class="p-4 text-gray-600">${log.details}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
    };

    const renderPermissionsMatrix = () => {
        // Visual guide for the user
        const roles = [
            { name: 'Admin (HQ/Branch)', desc: 'تحكم كامل في الكيان التابع له + المالية + المستخدمين.' },
            { name: 'Finance', desc: 'الاطلاع على الأرصدة وإدارة المدفوعات فقط.' },
            { name: 'Support', desc: 'إدارة التذاكر وحل المشكلات التقنية.' },
            { name: 'Advertiser', desc: 'إنشاء وإدارة الحملات الإعلانية.' },
            { name: 'End User', desc: 'صلاحيات قراءة محدودة جداً.' }
        ];

        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">مصفوفة الصلاحيات (Roles & Permissions)</h2>
        <div class="grid gap-4">
            ${roles.map(r => `
                <div class="bg-white p-4 rounded-lg border-r-4 border-brand-500 shadow-sm">
                    <h3 class="font-bold text-lg">${r.name}</h3>
                    <p class="text-slate-500">${r.desc}</p>
                </div>
            `).join('')}
        </div>
        `;
    };

    const renderTasksManager = () => `<div class="p-8 text-center"><i class="fas fa-tasks text-4xl text-slate-300 mb-4"></i><h3 class="text-xl font-bold text-slate-600">نظام إدارة المهام</h3><p class="text-slate-400">قريباً...</p></div>`;
    const renderTicketsManager = () => `<div class="p-8 text-center"><i class="fas fa-headset text-4xl text-slate-300 mb-4"></i><h3 class="text-xl font-bold text-slate-600">نظام التذاكر والدعم</h3><p class="text-slate-400">${perms.canManageTickets() ? 'لديك صلاحية إدارة التذاكر' : 'ليس لديك صلاحية'}</p></div>`;
    
    const renderPlaceholder = (msg = 'لا تملك صلاحية الوصول لهذه الصفحة') => `
        <div class="flex flex-col items-center justify-center h-96 text-center">
            <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-lock text-3xl text-slate-400"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-700">تم رفض الوصول</h3>
            <p class="text-slate-500 mt-2">${msg}</p>
        </div>
    `;

    const renderKpiCard = (title, value, icon, color, bg) => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div class="relative z-10">
                <p class="text-xs text-slate-500 font-bold mb-1">${title}</p>
                <h3 class="text-2xl font-bold text-slate-800">${value}</h3>
                <div class="w-10 h-10 rounded-full ${bg} ${color} flex items-center justify-center absolute left-5 top-5 shadow-sm">
                    <i class="fas ${icon}"></i>
                </div>
            </div>
        </div>
    `;

    // --- MODAL & ACTIONS ---
    const openAdBuilderModal = () => {
        if (!perms.canManageAds()) {
            showToast('عفواً، حسابك لا يملك صلاحية إنشاء إعلانات', 'error');
            return;
        }

        // Reuse existing modal logic from previous version...
        const modal = document.createElement('div');
        modal.id = 'ad-modal';
        modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm fade-in';
        
        const options = Object.entries(AD_LEVELS).map(([key, val]) => 
            `<label class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition">
                <input type="radio" name="adLevel" value="${key}" class="mt-1" onchange="app.updateAdCost(${val.cost})">
                <div>
                    <span class="block font-bold text-sm text-slate-800">${val.label}</span>
                    <span class="block text-xs text-slate-500">${val.desc}</span>
                </div>
                <span class="text-xs font-bold mr-auto bg-gray-100 px-2 py-1 rounded">${val.cost} ر.س</span>
            </label>`
        ).join('');

        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div class="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h3 class="font-bold">إنشاء حملة إعلانية جديدة</h3>
                    <button onclick="document.getElementById('ad-modal').remove()" class="hover:text-red-400"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">عنوان الإعلان</label>
                        <input type="text" id="ad-title" class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">مستوى النشر</label>
                        <div class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            ${options}
                        </div>
                    </div>
                    <div class="bg-brand-50 p-3 rounded-lg flex justify-between items-center">
                        <span class="text-sm text-brand-800 font-bold">التكلفة المقدرة:</span>
                        <span id="ad-cost-display" class="text-xl font-bold text-brand-600">0 ر.س</span>
                    </div>
                    <button onclick="app.submitAd()" class="w-full bg-brand-600 text-white py-3 rounded-lg font-bold hover:bg-brand-700 transition">تأكيد ونشر</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    const updateAdCost = (cost) => {
        document.getElementById('ad-cost-display').innerText = cost + ' ر.س';
    };

    const submitAd = () => {
        const title = document.getElementById('ad-title').value;
        const levelKey = document.querySelector('input[name="adLevel"]:checked')?.value;
        
        if (!title || !levelKey) {
            showToast('الرجاء تعبئة جميع الحقول', 'error');
            return;
        }

        const levelConfig = AD_LEVELS[levelKey];
        const cost = levelConfig.cost;
        const entity = db.entities.find(e => e.id === currentUser.entityId);

        // Finance check
        if (cost > 0 && entity.balance < cost) {
            showToast('رصيد المحفظة غير كافٍ', 'error');
            logAction('CREATE_AD_FAILED', `محاولة إنشاء إعلان فاشلة لعدم كفاية الرصيد (${cost} ر.س)`);
            return;
        }

        if (cost > 0) entity.balance -= cost;

        const newAd = {
            id: db.ads.length + 1,
            title: title,
            content: 'محتوى إعلاني جديد...',
            level: levelKey,
            scope: 'MULTI',
            status: levelConfig.requireApproval ? 'PENDING' : 'ACTIVE',
            cost: cost,
            sourceEntityId: currentUser.entityId,
            targetIds: [currentUser.entityId], // Default target self
            date: new Date().toISOString().slice(0,10)
        };

        db.ads.unshift(newAd);
        logAction('CREATE_AD', `إنشاء إعلان (${levelConfig.label}) بتكلفة ${cost} ر.س`);
        
        document.getElementById('ad-modal').remove();
        showToast('تم إرسال الطلب بنجاح', 'success');
        loadRoute('ads');
    };

    return {
        init,
        switchUser,
        loadRoute,
        openAdBuilderModal,
        updateAdCost,
        submitAd
    };
})();

document.addEventListener('DOMContentLoaded', app.init);
