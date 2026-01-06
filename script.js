/**
 * NAYOSH ERP - Advanced RBAC System
 * Updated with Multi-Layered Ad System (5 Levels)
 * Updated: Arabic Roles & Localization
 * Updated: Interactive Charts
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
        ADMIN: 'مسؤول النظام',       // Full Control
        FINANCE: 'مسؤول مالي',      // Financial View
        SUPPORT: 'دعم فني',         // Tickets
        ADVERTISER: 'معلن',         // Ads
        USER: 'مستخدم'             // Read Only
    };

    // --- 5 LEVEL AD PUBLISHING RULES ---
    const AD_LEVELS = {
        L1_LOCAL: { 
            id: 1, 
            key: 'L1_LOCAL', 
            label: 'محلي (Local)', 
            desc: 'داخل الكيان/الفرع فقط', 
            cost: 0, 
            approval: false, 
            badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
            gradient: 'from-gray-50 to-gray-100',
            chartColor: '#94a3b8' // Slate 400
        },
        L2_MULTI: { 
            id: 2, 
            key: 'L2_MULTI', 
            label: 'متعدد الفروع (Paid)', 
            desc: 'نشر لعدة فروع مختارة', 
            cost: 500, 
            approval: true, 
            badgeClass: 'bg-blue-100 text-blue-600 border-blue-200',
            gradient: 'from-blue-50 to-cyan-50',
            chartColor: '#3b82f6' // Blue 500
        },
        L3_INC_INT: { 
            id: 3, 
            key: 'L3_INC_INT', 
            label: 'داخل الحاضنة', 
            desc: 'لجميع منسوبي الحاضنة', 
            cost: 100, 
            approval: false, 
            badgeClass: 'bg-orange-100 text-orange-600 border-orange-200',
            gradient: 'from-orange-50 to-amber-50',
            chartColor: '#f97316' // Orange 500
        },
        L4_PLT_INT: { 
            id: 4, 
            key: 'L4_PLT_INT', 
            label: 'داخل المنصة', 
            desc: 'لجميع مستخدمي النظام الرقمي', 
            cost: 1000, 
            approval: true, 
            badgeClass: 'bg-green-100 text-green-600 border-green-200',
            gradient: 'from-emerald-50 to-teal-50',
            chartColor: '#10b981' // Emerald 500
        },
        L5_CROSS_INC: { 
            id: 5, 
            key: 'L5_CROSS_INC', 
            label: 'عابر للحاضنات', 
            desc: 'نشر في حاضنات أخرى (بموافقة)', 
            cost: 1500, 
            approval: true, 
            badgeClass: 'bg-purple-100 text-purple-600 border-purple-200',
            gradient: 'from-violet-50 to-fuchsia-50',
            chartColor: '#8b5cf6' // Violet 500
        }
    };

    const AD_SOURCES = {
        HQ: { label: 'إعلانات الرئيسية', icon: 'fa-crown', color: 'text-purple-600' },
        BRANCH: { label: 'رئيسية الفرع', icon: 'fa-store', color: 'text-blue-600' },
        INCUBATOR: { label: 'رئيسية الحاضنة', icon: 'fa-seedling', color: 'text-orange-600' },
        PLATFORM: { label: 'رئيسية المنصة', icon: 'fa-laptop-code', color: 'text-green-600' },
        OFFICE: { label: 'رئيسية المكتب', icon: 'fa-briefcase', color: 'text-gray-600' }
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
            { id: 'OFF01', name: 'مكتب الدمام', type: 'OFFICE', status: 'Active', balance: 15000, location: 'الدمام', users: 4 }
        ],

        ads: [
            // HQ Ad (Level 5 simulated as global here or special HQ level)
            { id: 1, title: 'تحديث سياسات التشغيل 2024', content: 'نلفت انتباه جميع الفروع لتحديث السياسات.', level: 'L5_CROSS_INC', scope: 'GLOBAL', status: 'ACTIVE', sourceEntityId: 'HQ001', targetIds: [], date: '2023-11-20', cost: 0, sourceType: 'HQ' },
            // Branch Local
            { id: 2, title: 'اجتماع فريق المبيعات', content: 'مناقشة تارجت الشهر القادم.', level: 'L1_LOCAL', scope: 'LOCAL', status: 'ACTIVE', sourceEntityId: 'BR015', targetIds: ['BR015'], date: '2023-11-21', cost: 0, sourceType: 'BRANCH' },
            // Multi Branch
            { id: 3, title: 'حملة العودة للمدارس', content: 'خصم 15% على جميع المنتجات.', level: 'L2_MULTI', scope: 'MULTI', status: 'ACTIVE', sourceEntityId: 'BR015', targetIds: ['BR015', 'BR016'], date: '2023-11-22', cost: 500, sourceType: 'BRANCH' },
            // Incubator Internal
            { id: 4, title: 'ورشة عمل ريادة الأعمال', content: 'مخصصة لشركات الحاضنة فقط.', level: 'L3_INC_INT', scope: 'INCUBATOR', status: 'ACTIVE', sourceEntityId: 'INC03', targetIds: ['INC03'], date: '2023-11-23', cost: 100, sourceType: 'INCUBATOR' },
            // Cross Incubator
            { id: 5, title: 'تحدي الابتكار المفتوح', content: 'دعوة للمشاركة في الهاكاثون السنوي.', level: 'L5_CROSS_INC', scope: 'MULTI', status: 'PENDING', sourceEntityId: 'INC03', targetIds: ['INC03', 'INC04'], date: '2023-11-24', cost: 1500, sourceType: 'INCUBATOR' },
            // Platform
            { id: 6, title: 'تحديث أمني للنظام', content: 'سيتم إعادة تشغيل الخوادم.', level: 'L4_PLT_INT', scope: 'PLATFORM', status: 'ACTIVE', sourceEntityId: 'PLT01', targetIds: [], date: '2023-11-25', cost: 1000, sourceType: 'PLATFORM' }
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
            { id: 1, user: 'م. أحمد العلي', role: 'مدير المكتب الرئيسي', action: 'LOGIN', details: 'تم تسجيل الدخول للنظام', timestamp: '2023-11-20 08:00', entityId: 'HQ001' },
            { id: 2, user: 'سارة محمد', role: 'مدير الفرع', action: 'CREATE_AD', details: 'إنشاء إعلان: خصم خاص للموظفين', timestamp: '2023-11-20 09:15', entityId: 'BR015' }
        ]
    };

    let currentUser = db.users[0];
    let activeChart = null;

    // --- PERMISSIONS ---
    const perms = {
        isHQ: () => currentUser.tenantType === 'HQ',
        isAdmin: () => currentUser.role === ROLES.ADMIN,
        isFinance: () => currentUser.role === ROLES.FINANCE,
        isSupport: () => currentUser.role === ROLES.SUPPORT,
        isAdvertiser: () => currentUser.role === ROLES.ADVERTISER,
        isUser: () => currentUser.role === ROLES.USER,

        canViewEntity: (eId) => (perms.isHQ() && perms.isAdmin()) || currentUser.entityId === eId,
        canEditEntity: (eId) => perms.isAdmin() && perms.canViewEntity(eId),
        canViewBalance: () => perms.isAdmin() || perms.isFinance(),
        canManageAds: () => perms.isAdmin() || perms.isAdvertiser(),
        canViewAuditLogs: () => perms.isAdmin(),
        canManageTickets: () => perms.isAdmin() || perms.isSupport(),

        getVisibleEntities: () => (perms.isHQ() && perms.isAdmin()) ? db.entities : db.entities.filter(e => e.id === currentUser.entityId),
        
        // --- UPDATED VISIBILITY LOGIC ---
        getVisibleAds: () => {
            return db.ads.filter(ad => {
                // 1. Source always sees their own ads
                if (ad.sourceEntityId === currentUser.entityId) return true;
                
                // 2. HQ Ads (Simulating Global Broadcast) -> Seen by Everyone
                if (ad.sourceType === 'HQ') return true;

                // 3. Platform Ads -> Seen by Everyone if targeted globally or user is on platform
                if (ad.level === 'L4_PLT_INT') return true;

                // 4. Targeted Ads (Multi-branch, Cross-Incubator) - if approved
                if (ad.targetIds.includes(currentUser.entityId) && ad.status === 'ACTIVE') return true;

                // 5. Incubator Internal (Simulated logic: if user is in an incubator)
                // Ideally we check if currentUser.entity.parent === ad.sourceEntityId
                if (ad.level === 'L3_INC_INT' && currentUser.tenantType === 'INCUBATOR' && ad.sourceEntityId === currentUser.entityId) return true;

                return false;
            }).sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        getVisibleAuditLogs: () => {
             if (perms.isHQ() && perms.isAdmin()) return db.auditLogs;
             if (perms.isAdmin()) return db.auditLogs.filter(l => l.entityId === currentUser.entityId);
             return [];
        }
    };

    // --- AUDIT ---
    const logAction = (action, details) => {
        const now = new Date();
        db.auditLogs.unshift({ 
            id: db.auditLogs.length + 1,
            user: currentUser.name,
            role: `${currentUser.tenantType} ${currentUser.role}`,
            action: action,
            details: details,
            timestamp: now.toISOString().slice(0, 16).replace('T', ' '),
            entityId: currentUser.entityId
        });
    };

    // --- UI UTILS ---
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

    // --- MENU LOGIC ---
    const toggleRoleMenu = (event) => {
        if (event) event.stopPropagation();
        const menu = document.getElementById('role-menu');
        const chevron = document.getElementById('role-chevron');
        const isHidden = menu.classList.contains('hidden');
        
        if (isHidden) {
            menu.classList.remove('hidden');
            // Slight delay to allow display:block to apply before transition
            requestAnimationFrame(() => {
                menu.classList.remove('opacity-0', 'scale-95');
                menu.classList.add('opacity-100', 'scale-100');
            });
            chevron.classList.add('rotate-180');
        } else {
            menu.classList.remove('opacity-100', 'scale-100');
            menu.classList.add('opacity-0', 'scale-95');
            chevron.classList.remove('rotate-180');
            setTimeout(() => {
                menu.classList.add('hidden');
            }, 200); // Wait for transition
        }
    };

    // Close menu when clicking outside
    window.addEventListener('click', (e) => {
        const menu = document.getElementById('role-menu');
        const btn = document.querySelector('button[onclick*="toggleRoleMenu"]');
        
        if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !btn.contains(e.target)) {
            toggleRoleMenu();
        }
    });

    // --- INIT ---
    const init = () => {
        renderSidebar();
        updateHeader();
        loadRoute('dashboard');
        showToast(`مرحباً ${currentUser.name} (${currentUser.role})`, 'success');
    };

    const switchUser = (id) => {
        const u = db.users.find(x => x.id === id);
        if (u) {
            // Close menu first
            toggleRoleMenu();

            logAction('LOGOUT', `تسجيل خروج المستخدم ${currentUser.name}`);
            currentUser = u;
            logAction('LOGIN', `تسجيل دخول للدور ${currentUser.tenantType} - ${currentUser.role}`);
            
            const view = document.getElementById('main-view');
            view.innerHTML = `
                <div class="flex h-full items-center justify-center flex-col gap-6">
                    <div class="relative">
                        <div class="w-24 h-24 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
                        <i class="fas fa-user-shield absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl text-brand-600"></i>
                    </div>
                    <p class="text-slate-600 font-bold text-lg animate-pulse">جاري تطبيق سياسات ${u.role}...</p>
                </div>`;
            
            setTimeout(() => { 
                renderSidebar(); 
                updateHeader(); 
                loadRoute('dashboard');
                showToast(`تم التحويل إلى: ${currentUser.name}`, 'success');
            }, 800);
        }
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = TENANT_TYPES[currentUser.tenantType].label + ' | ' + currentUser.role;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        document.getElementById('entity-badge').innerText = currentUser.entityName;
        
        const typeConf = TENANT_TYPES[currentUser.tenantType];
        const badge = document.getElementById('entity-badge');
        badge.className = `px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${typeConf.bg} ${typeConf.color} border-${typeConf.color.split('-')[1]}-200`;
    };

    const loadRoute = (route) => {
        const view = document.getElementById('main-view');
        document.getElementById('page-title').innerText = getTitle(route);

        // Destroy existing chart if switching routes or reloading dashboard
        if (activeChart) {
            activeChart.destroy();
            activeChart = null;
        }
        
        let content = '';
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

        // Initialize Chart if on dashboard
        if (route === 'dashboard') {
            // Delay slightly to ensure DOM is updated
            requestAnimationFrame(() => {
                initDashboardChart();
            });
        }
    };

    const updateActiveLink = (route) => {
        const links = document.querySelectorAll('#nav-menu a');
        links.forEach(l => l.classList.remove('bg-gradient-to-r', 'from-slate-800', 'to-slate-900', 'text-white', 'border-r-4', 'border-brand-500'));
        const active = document.getElementById(`link-${route}`);
        if(active) active.classList.add('bg-gradient-to-r', 'from-slate-800', 'to-slate-900', 'text-white', 'border-r-4', 'border-brand-500');
    }

    const getTitle = (r) => {
        const map = { 
            'dashboard': 'لوحة القيادة الموحدة',
            'entities': 'إدارة الكيانات والفروع',
            'ads': 'منصة الإعلانات متعددة الطبقات',
            'audit-logs': 'سجل التدقيق (Audit Logs)',
            'tasks': 'المهام والعمليات',
            'tickets': 'تذاكر الدعم والتشغيل',
            'permissions': 'مصفوفة الصلاحيات (Roles Matrix)'
        };
        return map[r] || 'نايوش ERP';
    };

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
                   class="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all group relative overflow-hidden">
                   <i class="fas ${item.icon} w-6 text-center text-slate-400 group-hover:text-brand-400 transition-colors z-10"></i> 
                   <span class="z-10 relative">${item.label}</span>
                </a>
            </li>`
        ).join('');
    };

    const renderMaskedBalance = (balance) => {
        if (perms.canViewBalance()) {
            return balance.toLocaleString() + ' <span class="text-xs">ر.س</span>';
        }
        return '<span class="text-slate-400 tracking-widest text-sm">****</span>';
    };

    // --- CHART LOGIC ---
    const initDashboardChart = () => {
        const ctx = document.getElementById('adsChart');
        if (!ctx) return;

        // Data Aggregation
        const visibleAds = perms.getVisibleAds();
        const levels = Object.values(AD_LEVELS);
        const labels = levels.map(l => l.label.split(' ')[0]); // Simplified labels
        
        const counts = levels.map(l => visibleAds.filter(a => a.level === l.key).length);
        const colors = levels.map(l => l.chartColor);

        activeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'عدد الإعلانات',
                    data: counts,
                    backgroundColor: colors,
                    borderRadius: 8,
                    barThickness: 30,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { family: 'Cairo', size: 14 },
                        bodyFont: { family: 'Cairo', size: 13 },
                        padding: 12,
                        cornerRadius: 10,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { family: 'Cairo' }
                        },
                        grid: {
                            color: '#f1f5f9'
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { 
                            display: false 
                        },
                        ticks: {
                            font: { family: 'Cairo', weight: 'bold' }
                        },
                        border: { display: false }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    };

    // --- DASHBOARD RENDER ---
    const renderDashboard = () => {
        const entity = db.entities.find(e => e.id === currentUser.entityId);
        if (!entity) return renderPlaceholder('الكيان غير موجود');

        return `
        <div class="mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-3 py-1 rounded-lg text-[10px] bg-slate-200 text-slate-600 font-bold shadow-sm">${currentUser.role}</span>
                    ${perms.isHQ() ? '<span class="px-3 py-1 rounded-lg text-[10px] bg-purple-100 text-purple-600 font-bold shadow-sm">صلاحيات HQ</span>' : ''}
                </div>
                <h2 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">${entity.name}</h2>
                <p class="text-gray-500 mt-1 flex items-center gap-2"><i class="fas fa-map-marker-alt text-brand-500"></i> ${entity.location}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 min-w-[200px]">
                 <p class="text-xs text-slate-400 font-bold uppercase mb-1">المحفظة الرقمية</p>
                 <p class="text-3xl font-mono font-bold ${perms.canViewBalance() ? 'text-brand-600' : 'text-slate-400'}">
                    ${renderMaskedBalance(entity.balance)}
                 </p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <!-- Main Content Area -->
            <div class="lg:col-span-2 space-y-8">
                 
                 <!-- CHART SECTION (NEW) -->
                 <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                     <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <i class="fas fa-chart-bar text-brand-500"></i> 
                            تحليل الحملات الإعلانية
                        </h3>
                        <span class="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600 font-bold">Live Data</span>
                     </div>
                     <div class="p-6 h-64 relative">
                        <canvas id="adsChart"></canvas>
                     </div>
                 </div>

                 ${renderAdsFeed()}
            </div>

            <!-- Quick Stats -->
            <div class="space-y-4">
                 ${renderKpiCard('إعلاناتي النشطة', db.ads.filter(a => a.sourceEntityId === entity.id).length, 'fa-bullhorn', 'text-orange-600', 'bg-orange-50')}
                 ${renderKpiCard('المهام المعلقة', db.tasks.filter(t => t.entityId === entity.id && t.status === 'Pending').length, 'fa-tasks', 'text-blue-600', 'bg-blue-50')}
                 ${renderKpiCard('التذاكر المفتوحة', db.tickets.filter(t => t.entityId === entity.id && t.status === 'Open').length, 'fa-ticket-alt', 'text-red-600', 'bg-red-50')}
                 ${renderKpiCard('الموظفين المسجلين', entity.users, 'fa-users', 'text-teal-600', 'bg-teal-50')}
            </div>
        </div>
        `;
    };

    const renderAdsFeed = () => {
        const visibleAds = perms.getVisibleAds();
        
        // Categorize ads for the tiered display
        const categorized = {
            hq: visibleAds.filter(a => a.sourceType === 'HQ'),
            other: visibleAds.filter(a => a.sourceType !== 'HQ')
        };

        return `
        <div class="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <i class="fas fa-bullhorn text-brand-500"></i> 
                    مركز الإعلانات والتعاميم
                </h3>
                ${perms.canManageAds() ? `<button onclick="app.openAdBuilderModal()" class="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition shadow-lg shadow-brand-500/30">+ نشر إعلان</button>` : ''}
            </div>
            
            <div class="p-6 space-y-6">
                <!-- HQ Layer (Top Priority) -->
                ${categorized.hq.length > 0 ? `
                <div class="space-y-3">
                    <h4 class="text-xs font-extrabold text-purple-600 uppercase tracking-widest">إعلانات الرئيسية (HQ)</h4>
                    ${categorized.hq.map(ad => renderAdCard(ad)).join('')}
                </div>
                ` : ''}

                <!-- Other Layers -->
                <div class="space-y-3">
                    <h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest">إعلانات الفروع والكيانات</h4>
                    ${categorized.other.length > 0 ? categorized.other.map(ad => renderAdCard(ad)).join('') : '<p class="text-sm text-slate-400 italic">لا توجد إعلانات أخرى حالياً</p>'}
                </div>
            </div>
        </div>
        `;
    };

    const renderAdCard = (ad) => {
        const level = Object.values(AD_LEVELS).find(l => l.key === ad.level) || AD_LEVELS.L1_LOCAL;
        const sourceConfig = AD_SOURCES[ad.sourceType] || AD_SOURCES.BRANCH;
        
        return `
        <div class="group relative bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-x-1 overflow-hidden">
            <!-- Gradient Stripe -->
            <div class="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${level.gradient}"></div>
            
            <div class="flex justify-between items-start mb-2 pl-2 pr-4">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${level.badgeClass}">
                            ${level.label}
                        </span>
                        <span class="text-[10px] text-slate-400 flex items-center gap-1">
                             <i class="fas ${sourceConfig.icon} text-xs"></i> ${sourceConfig.label}
                        </span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-lg group-hover:text-brand-600 transition">${ad.title}</h4>
                </div>
                <span class="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">${ad.date}</span>
            </div>
            <p class="text-sm text-gray-500 pr-4 pl-2 line-clamp-2 leading-relaxed">${ad.content}</p>
        </div>
        `;
    };

    const renderKpiCard = (title, value, icon, color, bg) => `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all">
            <div class="relative z-10 flex justify-between items-center">
                <div>
                    <p class="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">${title}</p>
                    <h3 class="text-3xl font-extrabold text-slate-800 group-hover:scale-105 transition-transform origin-right">${value}</h3>
                </div>
                <div class="w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner text-xl transform group-hover:rotate-12 transition-transform">
                    <i class="fas ${icon}"></i>
                </div>
            </div>
        </div>
    `;

    const renderAdsManager = () => {
        const ads = perms.getVisibleAds();
        return `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-slate-800">إدارة الحملات الإعلانية</h2>
            ${perms.canManageAds() ? `
            <button onclick="app.openAdBuilderModal()" class="bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 transition flex items-center gap-2">
                <i class="fas fa-plus"></i> إنشاء حملة جديدة
            </button>` : ''}
        </div>
        
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <table class="w-full text-right">
                <thead class="bg-slate-50/80 text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                        <th class="p-5">عنوان الإعلان</th>
                        <th class="p-5">طبقة النشر (Level)</th>
                        <th class="p-5">المصدر</th>
                        <th class="p-5">التكلفة</th>
                        <th class="p-5">الحالة</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${ads.map(ad => {
                        const level = Object.values(AD_LEVELS).find(l => l.key === ad.level);
                        return `
                        <tr class="hover:bg-slate-50/50 transition-colors group">
                            <td class="p-5 font-bold text-slate-700 group-hover:text-brand-600 transition">${ad.title}</td>
                            <td class="p-5">
                                <span class="text-[10px] font-bold px-2 py-1 rounded border ${level ? level.badgeClass : ''}">${level ? level.label : ad.level}</span>
                            </td>
                            <td class="p-5 text-xs text-slate-500">${ad.sourceType}</td>
                            <td class="p-5 font-mono font-bold text-slate-600">${ad.cost > 0 ? ad.cost + ' ر.س' : 'مجاني'}</td>
                            <td class="p-5">
                                <span class="px-2 py-1 rounded-full text-[10px] font-bold ${ad.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">
                                    ${ad.status === 'ACTIVE' ? 'نشط' : 'بانتظار الموافقة'}
                                </span>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>
        `;
    };

    const renderEntitiesManager = () => `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">إدارة الكيانات</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${perms.getVisibleEntities().map(e => `
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-14 h-14 rounded-2xl ${TENANT_TYPES[e.type].bg} ${TENANT_TYPES[e.type].color} flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                <i class="fas ${TENANT_TYPES[e.type].icon}"></i>
                            </div>
                            <div class="bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-slate-100 text-slate-600">
                                ${renderMaskedBalance(e.balance)}
                            </div>
                        </div>
                        <h3 class="font-bold text-xl text-slate-800 mb-1 group-hover:text-brand-600 transition">${e.name}</h3>
                        <p class="text-sm text-slate-500 mb-4 flex items-center gap-1"><i class="fas fa-map-pin text-xs"></i> ${e.location}</p>
                        <div class="border-t border-slate-50 pt-4 flex justify-between items-center text-xs">
                            <span class="bg-green-50 text-green-600 px-2 py-1 rounded-full font-bold">${e.status}</span>
                            ${perms.canEditEntity(e.id) ? '<button class="text-brand-600 font-bold hover:underline">تعديل البيانات</button>' : '<i class="fas fa-lock opacity-30"></i>'}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    const renderAuditLogs = () => {
        if (!perms.canViewAuditLogs()) return renderPlaceholder();
        return `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">سجلات النظام (Audit Trail)</h2>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <table class="w-full text-right">
                <thead class="bg-slate-50/80 text-xs text-slate-500 font-bold uppercase">
                    <tr>
                        <th class="p-4">الوقت</th>
                        <th class="p-4">المستخدم</th>
                        <th class="p-4">الحدث</th>
                        <th class="p-4">التفاصيل</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 text-sm">
                    ${perms.getVisibleAuditLogs().map(log => `
                        <tr class="hover:bg-slate-50/50">
                            <td class="p-4 text-gray-400 font-mono text-xs">${log.timestamp}</td>
                            <td class="p-4 font-bold text-slate-700">${log.user}</td>
                            <td class="p-4 font-bold text-brand-600">${log.action}</td>
                            <td class="p-4 text-gray-500">${log.details}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
    };

    const renderPermissionsMatrix = () => `
        <h2 class="text-2xl font-bold text-slate-800 mb-6">مصفوفة الصلاحيات (Roles)</h2>
        <div class="grid gap-4">
            ${Object.values(ROLES).map(r => `
                <div class="bg-white p-5 rounded-xl border-r-4 border-brand-500 shadow-sm hover:shadow-md transition">
                    <h3 class="font-bold text-lg text-slate-800">${r}</h3>
                    <p class="text-slate-500 text-sm mt-1">وصف الصلاحيات والأذونات الخاصة بهذا الدور...</p>
                </div>
            `).join('')}
        </div>
    `;

    const renderPlaceholder = (msg = 'لا تملك صلاحية الوصول') => `
        <div class="flex flex-col items-center justify-center h-96 text-center animate-fade-in">
            <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <i class="fas fa-lock text-4xl text-slate-400"></i>
            </div>
            <h3 class="text-2xl font-bold text-slate-700">تم رفض الوصول</h3>
            <p class="text-slate-500 mt-2 max-w-md mx-auto">${msg}</p>
        </div>
    `;

    const renderTasksManager = () => `<div class="p-12 text-center"><i class="fas fa-tasks text-5xl text-slate-200 mb-4"></i><h3 class="text-xl font-bold text-slate-500">نظام المهام قريباً</h3></div>`;
    const renderTicketsManager = () => `<div class="p-12 text-center"><i class="fas fa-headset text-5xl text-slate-200 mb-4"></i><h3 class="text-xl font-bold text-slate-500">الدعم الفني</h3></div>`;

    // --- AD BUILDER MODAL ---
    const openAdBuilderModal = () => {
        if (!perms.canManageAds()) {
            showToast('عفواً، حسابك لا يملك صلاحية إنشاء إعلانات', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'ad-modal';
        modal.className = 'fixed inset-0 bg-slate-900/60 z-[999] flex items-center justify-center backdrop-blur-sm fade-in p-4';
        
        const levelsHtml = Object.values(AD_LEVELS).map(l => 
            `<label class="relative flex items-center gap-4 p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-all duration-200 group border-slate-200 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                <input type="radio" name="adLevel" value="${l.key}" class="peer w-4 h-4 text-brand-600 focus:ring-brand-500" onchange="app.updateAdCost(${l.cost})">
                <div class="flex-1">
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-sm text-slate-800 peer-checked:text-brand-800">${l.label}</span>
                        <span class="text-[10px] font-bold bg-white border px-2 py-0.5 rounded text-slate-500 shadow-sm">${l.cost} ر.س</span>
                    </div>
                    <span class="block text-xs text-slate-500 peer-checked:text-brand-600">${l.desc}</span>
                </div>
                <div class="absolute inset-0 border-2 border-transparent peer-checked:border-brand-500 rounded-xl pointer-events-none"></div>
            </label>`
        ).join('');

        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-95 animate-scale-up">
                <div class="bg-slate-900 text-white p-5 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i class="fas fa-bullhorn text-sm"></i></div>
                        <h3 class="font-bold text-lg">إنشاء حملة إعلانية جديدة</h3>
                    </div>
                    <button onclick="document.getElementById('ad-modal').remove()" class="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">عنوان الحملة</label>
                        <input type="text" id="ad-title" placeholder="اكتب عنواناً جذاباً للإعلان..." class="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition shadow-sm">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">قواعد النشر والاستهداف (Targeting Rules)</label>
                        <div class="grid grid-cols-1 gap-3">
                            ${levelsHtml}
                        </div>
                    </div>
                    <div class="bg-gradient-to-r from-brand-50 to-blue-50 p-4 rounded-xl flex justify-between items-center border border-brand-100">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-coins text-brand-500"></i>
                            <span class="text-sm text-brand-800 font-bold">التكلفة الإجمالية:</span>
                        </div>
                        <span id="ad-cost-display" class="text-2xl font-extrabold text-brand-600 tracking-tight">0 ر.س</span>
                    </div>
                    <button onclick="app.submitAd()" class="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-brand-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95">تأكيد ونشر الحملة</button>
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
        const levelKey = document.querySelector('input[name="adLevel":checked')?.value;
        
        if (!title || !levelKey) {
            showToast('الرجاء تعبئة جميع الحقول المطلوبة', 'error');
            return;
        }

        const levelConfig = AD_LEVELS[levelKey];
        const cost = levelConfig.cost;
        const entity = db.entities.find(e => e.id === currentUser.entityId);

        if (perms.isFinance() || perms.isAdmin() || perms.isAdvertiser()) {
             if (cost > 0 && entity.balance < cost) {
                showToast('رصيد المحفظة الرقمية غير كافٍ لإتمام العملية', 'error');
                logAction('CREATE_AD_FAILED', `فشل إنشاء إعلان لعدم كفاية الرصيد (${cost} ر.س)`);
                return;
            }
            if (cost > 0) entity.balance -= cost;
        }

        const newAd = {
            id: db.ads.length + 1,
            title: title,
            content: 'محتوى الإعلان يتم عرضه هنا (تم الإنشاء حديثاً)...',
            level: levelKey,
            scope: levelConfig.scope,
            status: levelConfig.approval ? 'PENDING' : 'ACTIVE',
            cost: cost,
            sourceEntityId: currentUser.entityId,
            targetIds: [currentUser.entityId], // Simplified targeting for demo
            date: new Date().toISOString().slice(0,10),
            sourceType: currentUser.tenantType
        };

        db.ads.unshift(newAd);
        logAction('CREATE_AD', `إنشاء إعلان (${levelConfig.label}) بتكلفة ${cost} ر.س`);
        
        document.getElementById('ad-modal').remove();
        showToast('تم إرسال حملتك الإعلانية بنجاح', 'success');
        loadRoute('ads');
    };

    return {
        init,
        switchUser,
        loadRoute,
        openAdBuilderModal,
        updateAdCost,
        submitAd,
        toggleRoleMenu // Exported for onclick
    };
})();

document.addEventListener('DOMContentLoaded', app.init);