/**
 * NAYOSH ERP - Advanced RBAC & Multi-Tenant System
 * Updated: Wallet Integration & Auto-Deduction Logic
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

    // 5-Level Publishing Rules Configuration
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
            { id: 'INC04', name: 'حاضنة الرياض تك', type: 'INCUBATOR', status: 'Active', balance: 200000, location: 'الرياض', users: 60 },
            { id: 'PLT01', name: 'نايوش كلاود', type: 'PLATFORM', status: 'Active', balance: 500000, location: 'سحابي', users: 1200 },
            { id: 'OFF01', name: 'مكتب الدمام', type: 'OFFICE', status: 'Inactive', balance: 0, location: 'الدمام', users: 0 }
        ],

        // Enhanced Ads Structure for 5 Levels
        ads: [
            // HQ Global Ad
            { id: 1, title: 'صيانة دورية للنظام', content: 'سيتم توقف النظام للصيانة فجر الجمعة.', level: 'GLOBAL', scope: 'ALL', status: 'ACTIVE', sourceEntityId: 'HQ001', targetIds: [], date: '2023-11-20', cost: 0 },
            
            // Level 1: Local Branch
            { id: 2, title: 'اجتماع موظفين داخلي', content: 'اجتماع لمناقشة التارجت الشهري.', level: 'L1_LOCAL', scope: 'LOCAL', status: 'ACTIVE', sourceEntityId: 'BR015', targetIds: ['BR015'], date: '2023-11-21', cost: 0 },
            
            // Level 2: Multi-Branch (Paid)
            { id: 3, title: 'خصم موحد 20%', content: 'حملة ترويجية مشتركة بين الفروع.', level: 'L2_MULTI', scope: 'MULTI', status: 'ACTIVE', sourceEntityId: 'BR015', targetIds: ['BR015', 'BR016'], date: '2023-11-22', cost: 500 },
            
            // Level 3: Incubator Internal
            { id: 4, title: 'ورشة عمل: الاستثمار', content: 'ورشة خاصة للشركات المحتضنة.', level: 'L3_INC_INT', scope: 'LOCAL', status: 'ACTIVE', sourceEntityId: 'INC03', targetIds: ['INC03'], date: '2023-11-23', cost: 100 },
            
            // Level 5: Cross-Incubator (Pending Approval)
            { id: 5, title: 'تحدي الابتكار المفتوح', content: 'دعوة لجميع الحاضنات للمشاركة.', level: 'L5_CROSS_INC', scope: 'MULTI', status: 'PENDING', sourceEntityId: 'INC03', targetIds: ['INC03', 'INC04'], date: '2023-11-24', cost: 1500 }
        ],

        tasks: [
            { id: 101, title: 'اعتماد الميزانية الربعية', dueDate: '2023-11-30', status: 'Pending', priority: 'High', type: 'Finance', entityId: 'HQ001' },
            { id: 102, title: 'مراجعة طلبات الإعلانات', dueDate: '2023-11-21', status: 'In Progress', priority: 'Medium', type: 'Ops', entityId: 'HQ001' },
            { id: 104, title: 'جرد المخزون الدوري', dueDate: '2023-11-22', status: 'Done', priority: 'Low', type: 'Ops', entityId: 'BR015' },
            { id: 105, title: 'تجهيز حملة العيد', dueDate: '2023-12-05', status: 'Pending', priority: 'High', type: 'Marketing', entityId: 'BR015' }
        ],

        tickets: [
            { id: 'T-201', subject: 'تعطل التكييف في المستودع', status: 'Open', priority: 'High', type: 'Facility', entityId: 'BR015', date: '2023-11-20' },
            { id: 'T-202', subject: 'طلب زيادة مساحة تخزينية', status: 'In Progress', priority: 'Medium', type: 'Tech', entityId: 'INC03', date: '2023-11-19' },
            { id: 'T-204', subject: 'API Latency Spike', status: 'Open', priority: 'Critical', type: 'System', entityId: 'PLT01', date: '2023-11-21' }
        ],

        notifications: [
            { id: 1, msg: 'تم اعتماد الميزانية الجديدة', time: 'منذ ساعة', type: 'success', entityId: 'HQ001' },
            { id: 2, msg: 'يوجد 3 تذاكر دعم فني عاجلة', time: 'منذ ساعتين', type: 'warning', entityId: 'PLT01' },
            { id: 3, msg: 'تذكير: موعد الجرد غداً', time: 'منذ 3 ساعات', type: 'info', entityId: 'BR015' }
        ],

        auditLogs: [
            { id: 1, user: 'م. أحمد العلي', action: 'LOGIN', details: 'تم تسجيل الدخول للنظام', timestamp: '2023-11-20 08:00', entityId: 'HQ001' },
            { id: 2, user: 'سارة محمد', action: 'CREATE_AD', details: 'إنشاء إعلان: خصم خاص للموظفين', timestamp: '2023-11-20 09:15', entityId: 'BR015' }
        ]
    };

    let currentUser = db.users[0];

    // --- PERMISSIONS & LOGIC ---
    const perms = {
        isHQ: () => currentUser.tenantType === 'HQ',
        isAdmin: () => currentUser.role === ROLES.ADMIN,
        isAdvertiser: () => currentUser.role === ROLES.ADVERTISER || currentUser.role === ROLES.ADMIN,
        
        canViewEntity: (eId) => perms.isHQ() || currentUser.entityId === eId,
        canEditEntity: (eId) => perms.isAdmin() && (perms.isHQ() || currentUser.entityId === eId),
        
        getVisibleEntities: () => {
            if (perms.isHQ()) return db.entities;
            return db.entities.filter(e => e.id === currentUser.entityId);
        },
        
        // Revised Ad Logic for 5 Levels
        getAdsForDashboard: (viewerEntityId) => {
            return db.ads.filter(ad => {
                // 1. GLOBAL Ads (HQ) - Show to everyone
                if (ad.level === 'GLOBAL') return true;
                
                // 2. Targeting Logic Check
                const isTargeted = ad.targetIds.includes(viewerEntityId);
                const isSource = ad.sourceEntityId === viewerEntityId;

                // Show if you are the creator or the target
                if (isSource) return true;

                // If targeting others, must be ACTIVE/APPROVED
                if (isTargeted && ad.status === 'ACTIVE') return true;

                return false;
            });
        },

        getVisibleTasks: () => {
            if (perms.isHQ() && perms.isAdmin()) return db.tasks; 
            return db.tasks.filter(t => t.entityId === currentUser.entityId);
        },

        getVisibleTickets: () => {
            if (perms.isHQ() && perms.isAdmin()) return db.tickets;
            return db.tickets.filter(t => t.entityId === currentUser.entityId);
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

    // --- INIT & ROUTING ---
    const init = () => {
        renderSidebar();
        updateHeader();
        loadRoute('dashboard');
        showToast(`مرحباً ${currentUser.name}`);
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
            }, 600);
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
            { id: 'ads', icon: 'fa-bullhorn', label: 'الإعلانات', show: true },
            { id: 'tasks', icon: 'fa-tasks', label: 'المهام', show: true },
            { id: 'tickets', icon: 'fa-ticket-alt', label: 'التذاكر', show: true },
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

    // --- AD WIDGET COMPONENT ---
    const renderAdsWidget = (entityId) => {
        const visibleAds = perms.getAdsForDashboard(entityId);
        if (visibleAds.length === 0) return '';

        return `
        <div class="mb-8">
            <div class="flex items-center gap-2 mb-4">
                <i class="fas fa-bullhorn text-brand-500"></i>
                <h3 class="font-bold text-gray-700">الإعلانات والتعاميم النشطة</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${visibleAds.map(ad => {
                    const levelConfig = Object.values(AD_LEVELS).find(l => ad.level.startsWith('L')) || { badge: 'bg-purple-600 text-white', label: 'HQ GLOBAL' };
                    const isHQ = ad.level === 'GLOBAL';
                    return `
                    <div class="bg-white border-r-4 ${isHQ ? 'border-purple-600' : 'border-blue-400'} rounded-l-lg shadow-sm p-4 hover:shadow-md transition relative overflow-hidden group">
                        <div class="absolute top-0 left-0 p-2 opacity-10 group-hover:opacity-20 transition">
                            <i class="fas fa-bullhorn text-6xl"></i>
                        </div>
                        <div class="relative z-10">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block ${isHQ ? 'bg-purple-100 text-purple-700' : levelConfig.badge}">
                                ${isHQ ? 'تعميم إداري (HQ)' : levelConfig.label}
                            </span>
                            <h4 class="font-bold text-gray-800 mb-1">${ad.title}</h4>
                            <p class="text-sm text-gray-500 mb-2 line-clamp-2">${ad.content}</p>
                            <div class="flex justify-between items-center text-xs text-gray-400 border-t pt-2">
                                <span><i class="fas fa-building ml-1"></i>${ad.sourceEntityId}</span>
                                <span>${ad.date}</span>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    };

    // --- DASHBOARDS ---
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

    const renderHQDashboard = () => {
        const totalBalance = db.entities.reduce((acc, e) => acc + e.balance, 0);
        const activeEntities = db.entities.filter(e => e.status === 'Active').length;
        return `
        <div class="mb-6">
            <h2 class="text-3xl font-bold text-gray-800">مركز القيادة (HQ)</h2>
            <p class="text-gray-500">نظرة شمولية على جميع الكيانات والأصول</p>
        </div>

        ${renderAdsWidget(currentUser.entityId)}

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            ${renderKpiCard('إجمالي السيولة', totalBalance.toLocaleString() + ' ر.س', 'fa-wallet', 'text-green-600', 'bg-green-50', '+12%')}
            ${renderKpiCard('الكيانات النشطة', activeEntities + '/' + db.entities.length, 'fa-building', 'text-purple-600', 'bg-purple-50')}
            ${renderKpiCard('طلبات الإعلانات', db.ads.filter(a => a.status === 'PENDING').length, 'fa-bullhorn', 'text-orange-600', 'bg-orange-50', 'يحتاج موافقة')}
            ${renderKpiCard('تذاكر حرجة', '3', 'fa-exclamation-triangle', 'text-red-600', 'bg-red-50')}
        </div>
        <!-- Entity Matrix Placeholder -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
             <h3 class="font-bold text-gray-700 mb-4">مصفوفة أداء الكيانات</h3>
             <p class="text-slate-400 text-sm">جدول البيانات التفصيلي...</p>
        </div>
        `;
    };

    const renderBranchDashboard = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">لوحة الفروع (${entity.name})</h2>
            <div class="flex gap-2 text-sm text-gray-500 mt-1">
                <span><i class="fas fa-map-marker-alt"></i> ${entity.location}</span>
                <span class="mx-2">|</span>
                <span><i class="fas fa-user-friends"></i> ${entity.users} موظف</span>
            </div>
        </div>

        ${renderAdsWidget(currentUser.entityId)}

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${renderKpiCard('رصيد الفرع', entity.balance.toLocaleString() + ' ر.س', 'fa-cash-register', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('إعلانات نشطة', db.ads.filter(a => a.sourceEntityId === entity.id && a.status === 'ACTIVE').length, 'fa-bullhorn', 'text-orange-600', 'bg-orange-50')}
            ${renderKpiCard('تذاكر مفتوحة', '2', 'fa-ticket-alt', 'text-red-600', 'bg-red-50')}
        </div>
        `;
    };

    const renderIncubatorDashboard = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        return `
        <div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-8 text-white mb-8 shadow-lg">
            <h2 class="text-3xl font-bold mb-2">حاضنة الأعمال (${entity.name})</h2>
            <p class="opacity-90">بيئة ريادية متكاملة لدعم الشركات الناشئة</p>
        </div>

        ${renderAdsWidget(currentUser.entityId)}

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${renderKpiCard('رصيد الحاضنة', entity.balance.toLocaleString() + ' ر.س', 'fa-wallet', 'text-white', 'bg-orange-400 bg-opacity-30')}
            ${renderKpiCard('الشركات المحتضنة', '12', 'fa-rocket', 'text-orange-600', 'bg-orange-50')}
            ${renderKpiCard('نسبة الإشغال', '85%', 'fa-chair', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('ساعات التوجيه', '120h', 'fa-chalkboard-teacher', 'text-purple-600', 'bg-purple-50')}
        </div>
        `;
    };

    const renderPlatformDashboard = () => {
        return `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">لوحة المنصة الرقمية (Cloud Ops)</h2>
            <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Operational</span>
        </div>

        ${renderAdsWidget(currentUser.entityId)}

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div class="bg-slate-800 text-white p-5 rounded-xl shadow-lg">
                <p class="text-slate-400 text-xs mb-1">Active Connections</p>
                <h3 class="text-3xl font-mono font-bold text-green-400">1,245</h3>
            </div>
            ${renderKpiCard('Avg Response', '45ms', 'fa-server', 'text-blue-600', 'bg-blue-50')}
            ${renderKpiCard('Error Rate', '0.02%', 'fa-bug', 'text-red-600', 'bg-red-50')}
        </div>
        `;
    };

    const renderOfficeDashboard = () => {
        return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">المكتب الإداري</h2>
        </div>
        ${renderAdsWidget(currentUser.entityId)}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${renderKpiCard('طلبات معلقة', '5', 'fa-inbox', 'text-gray-600', 'bg-gray-100')}
            ${renderKpiCard('الموظفين', '12', 'fa-users', 'text-gray-600', 'bg-gray-100')}
        </div>
        `;
    };

    // --- ADS MANAGER PAGE ---
    const renderAdsManager = () => {
        const ads = perms.getAdsForDashboard(currentUser.entityId);
        return `
        <div class="mb-6 flex justify-between items-center">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">إدارة الإعلانات والتعاميم</h2>
                <p class="text-slate-500 text-sm">التحكم في الحملات الإعلانية ومراقبة التكاليف</p>
            </div>
            <button onclick="app.openAdBuilderModal()" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-brand-700 flex items-center gap-2">
                <i class="fas fa-plus"></i> إنشاء حملة إعلانية
            </button>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table class="w-full text-right">
                <thead class="bg-slate-50 text-xs text-slate-500 font-bold uppercase">
                    <tr>
                        <th class="p-4">الإعلان</th>
                        <th class="p-4">المستوى (Level)</th>
                        <th class="p-4">الاستهداف</th>
                        <th class="p-4">التكلفة</th>
                        <th class="p-4">الحالة</th>
                        <th class="p-4">إجراءات</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${ads.map(ad => {
                        const level = Object.values(AD_LEVELS).find(l => ad.level === 'L' + l.id || ad.level === l.id) || { label: 'GLOBAL', badge: 'bg-purple-100 text-purple-700' };
                        if(ad.level === 'GLOBAL') level.label = 'HQ تعميم';

                        return `
                        <tr class="hover:bg-slate-50/50 transition">
                            <td class="p-4">
                                <p class="font-bold text-slate-800">${ad.title}</p>
                                <p class="text-xs text-slate-400 truncate w-48">${ad.content}</p>
                            </td>
                            <td class="p-4"><span class="text-[10px] px-2 py-1 rounded font-bold ${level.badge}">${level.label}</span></td>
                            <td class="p-4 text-xs text-gray-500">${ad.targetIds.length ? ad.targetIds.join(', ') : 'الكل'}</td>
                            <td class="p-4 font-mono">${ad.cost > 0 ? ad.cost + ' ر.س' : 'مجاني'}</td>
                            <td class="p-4">
                                <span class="px-2 py-1 rounded text-[10px] font-bold ${ad.status==='ACTIVE'?'bg-green-100 text-green-700':ad.status==='PENDING'?'bg-orange-100 text-orange-700':'bg-red-100 text-red-700'}">
                                    ${ad.status}
                                </span>
                            </td>
                            <td class="p-4">
                                ${(perms.isHQ() && ad.status === 'PENDING') ? 
                                    `<button onclick="app.approveAd(${ad.id})" class="text-green-600 hover:bg-green-50 p-2 rounded" title="اعتماد"><i class="fas fa-check"></i></button>` : 
                                    '<span class="text-slate-300">-</span>'}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        `;
    };

    // --- ENTITIES & OTHERS (Simplified for brevity as they are unchanged logic mostly) ---
    const renderEntitiesManager = () => {
        const entities = perms.getVisibleEntities();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">إدارة الكيانات</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${entities.map(e => `
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-lg ${TENANT_TYPES[e.type].bg} ${TENANT_TYPES[e.type].color} flex items-center justify-center text-xl">
                                <i class="fas ${TENANT_TYPES[e.type].icon}"></i>
                            </div>
                            <div class="bg-slate-100 px-2 py-1 rounded text-xs font-mono font-bold">
                                ${e.balance.toLocaleString()} ر.س
                            </div>
                        </div>
                        <h3 class="font-bold text-lg text-slate-800">${e.name}</h3>
                        <p class="text-sm text-slate-600">${e.location}</p>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    };

    const renderTasksManager = () => `<h2 class="text-2xl font-bold mb-4">المهام</h2><p>قائمة المهام...</p>`;
    const renderTicketsManager = () => `<h2 class="text-2xl font-bold mb-4">التذاكر</h2><p>قائمة التذاكر...</p>`;
    const renderAuditLogs = () => `<h2 class="text-2xl font-bold mb-4">سجل التدقيق</h2><p>قائمة السجلات...</p>`;
    const renderPlaceholder = () => `<div class="p-10 text-center text-slate-400">لا تملك صلاحية</div>`;
    const renderKpiCard = (title, value, icon, color, bg, badge) => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 ${bg} rounded-full -mr-10 -mt-10 opacity-50"></div>
            <div class="relative z-10">
                <p class="text-xs text-slate-500 font-bold mb-1">${title}</p>
                <h3 class="text-2xl font-bold text-slate-800">${value}</h3>
                <div class="w-10 h-10 rounded-full ${bg} ${color} flex items-center justify-center absolute left-5 top-5 shadow-sm">
                    <i class="fas ${icon}"></i>
                </div>
                ${badge ? `<span class="absolute top-5 left-16 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">${badge}</span>` : ''}
            </div>
        </div>
    `;

    // --- MODAL & ACTIONS ---
    const openAdBuilderModal = () => {
        // Simple Modal Implementation
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
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95">
                <div class="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h3 class="font-bold">إنشاء حملة إعلانية جديدة</h3>
                    <button onclick="document.getElementById('ad-modal').remove()" class="hover:text-red-400"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">عنوان الإعلان</label>
                        <input type="text" id="ad-title" class="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" placeholder="مثال: خصم خاص...">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-700 mb-1">مستوى النشر (Target Level)</label>
                        <div class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            ${options}
                        </div>
                    </div>
                    <div>
                         <label class="block text-xs font-bold text-gray-700 mb-1">المستهدفين (Target IDs)</label>
                         <input type="text" id="ad-targets" class="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="أدخل معرفات الفروع/الحاضنات مفصولة بفاصلة (اختياري)">
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
        // Animation
        setTimeout(() => modal.querySelector('div').classList.remove('scale-95'), 10);
    };

    const updateAdCost = (cost) => {
        document.getElementById('ad-cost-display').innerText = cost + ' ر.س';
    };

    const submitAd = () => {
        const title = document.getElementById('ad-title').value;
        const levelKey = document.querySelector('input[name="adLevel"]:checked')?.value;
        const targetsInput = document.getElementById('ad-targets').value;
        
        if (!title || !levelKey) {
            showToast('الرجاء تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }

        const levelConfig = AD_LEVELS[levelKey];
        const cost = levelConfig.cost;

        // --- WALLET & DEDUCTION LOGIC ---
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        if (!entity) {
            showToast('خطأ: لا يمكن العثور على محفظة الكيان', 'error');
            return;
        }

        if (cost > 0) {
            if (entity.balance < cost) {
                showToast(`عفواً، رصيد المحفظة (${entity.balance} ر.س) لا يكفي لتغطية تكلفة الإعلان (${cost} ر.س).`, 'error');
                return;
            }
            
            // Deduct the cost automatically
            entity.balance -= cost;
            logAction('PAYMENT', `خصم تكلفة إعلان (${cost} ر.س) من رصيد ${entity.name}`);
        }
        // -------------------------------

        const targets = targetsInput ? targetsInput.split(',').map(s => s.trim()) : (levelConfig.id === 1 ? [currentUser.entityId] : []);
        
        const newAd = {
            id: db.ads.length + 1,
            title: title,
            content: 'إعلان تم إنشاؤه حديثاً عبر النظام...',
            level: levelKey,
            scope: levelConfig.id === 1 ? 'LOCAL' : 'MULTI',
            status: levelConfig.requireApproval ? 'PENDING' : 'ACTIVE',
            cost: cost,
            sourceEntityId: currentUser.entityId,
            targetIds: targets,
            date: new Date().toISOString().slice(0,10)
        };

        db.ads.unshift(newAd);
        logAction('CREATE_AD', `إنشاء إعلان جديد (${levelConfig.label}) - التكلفة: ${cost}`);
        
        document.getElementById('ad-modal').remove();
        
        if (cost > 0) {
            showToast(`تم نشر الإعلان وخصم ${cost} ر.س من المحفظة`, 'success');
        } else {
            showToast('تم نشر الإعلان (مجاني)', 'success');
        }

        loadRoute('ads');
    };

    const approveAd = (id) => {
        const ad = db.ads.find(a => a.id === id);
        if (ad) {
            ad.status = 'ACTIVE';
            logAction('APPROVE_AD', `اعتماد الإعلان رقم ${id}`);
            showToast('تم اعتماد الإعلان');
            loadRoute('ads');
        }
    };

    return {
        init,
        switchUser,
        loadRoute,
        openAdBuilderModal,
        updateAdCost,
        submitAd,
        approveAd
    };
})();

document.addEventListener('DOMContentLoaded', app.init);