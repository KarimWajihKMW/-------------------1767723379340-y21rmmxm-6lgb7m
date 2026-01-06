/**
 * NAYOSH ERP - Advanced RBAC System
 * Implements strict Multi-Tenant Role-Based Access Control
 */

const app = (() => {
    // --- CONFIGURATION: ROLES & PERMISSIONS ---
    const ROLES = {
        SUPER_ADMIN: 'SUPER_ADMIN', // Can do everything in their tenant, view global if HQ
        MANAGER: 'MANAGER',         // Admin of a specific tenant
        ACCOUNTANT: 'ACCOUNTANT',   // Finance view/edit only
        EMPLOYEE: 'EMPLOYEE',       // Operational tasks, view only restricted data
        CLIENT: 'CLIENT'            // Very limited view (e.g. Student portal)
    };

    const TENANT_TYPES = {
        HQ: 'HQ',
        BRANCH: 'BRANCH',
        INCUBATOR: 'INCUBATOR',
        PLATFORM: 'PLATFORM',
        OFFICE: 'OFFICE'
    };

    // --- DATA LAYER ---
    const db = {
        // Expanded User List covering all requested roles
        users: [
            { id: 1, name: 'م. أحمد العلي', role: ROLES.SUPER_ADMIN, tenantType: TENANT_TYPES.HQ, entityId: 'HQ001', entityName: 'المكتب الرئيسي - الرياض', desc: 'مدير عام النظام' },
            { id: 2, name: 'سارة محمد', role: ROLES.MANAGER, tenantType: TENANT_TYPES.BRANCH, entityId: 'BR015', entityName: 'فرع العليا مول', desc: 'مديرة الفرع' },
            { id: 3, name: 'د. خالد الزهراني', role: ROLES.MANAGER, tenantType: TENANT_TYPES.INCUBATOR, entityId: 'INC03', entityName: 'حاضنة السلامة', desc: 'مدير الحاضنة' },
            { id: 4, name: 'فريق التقنية', role: ROLES.MANAGER, tenantType: TENANT_TYPES.PLATFORM, entityId: 'PLT01', entityName: 'نايوش كلاود', desc: 'مدير المنصة' },
            { id: 5, name: 'أستاذة منى', role: ROLES.MANAGER, tenantType: TENANT_TYPES.OFFICE, entityId: 'OFF02', entityName: 'مكتب جدة', desc: 'مديرة المكتب' },
            
            // New Specific Roles requested
            { id: 6, name: 'سامي المحاسب', role: ROLES.ACCOUNTANT, tenantType: TENANT_TYPES.HQ, entityId: 'HQ001', entityName: 'المكتب الرئيسي - الرياض', desc: 'محاسب مالي' },
            { id: 7, name: 'ليلى موظفة', role: ROLES.EMPLOYEE, tenantType: TENANT_TYPES.BRANCH, entityId: 'BR015', entityName: 'فرع العليا مول', desc: 'موظفة مبيعات' },
            { id: 8, name: 'عمر الطالب', role: ROLES.CLIENT, tenantType: TENANT_TYPES.INCUBATOR, entityId: 'INC03', entityName: 'حاضنة السلامة', desc: 'طالب (عميل)' }
        ],

        // Explicit Entities Registry for Governance
        entities: [
            { id: 'HQ001', name: 'المكتب الرئيسي - الرياض', type: TENANT_TYPES.HQ, manager: 'م. أحمد العلي', status: 'active', performance: 98 },
            { id: 'BR015', name: 'فرع العليا مول', type: TENANT_TYPES.BRANCH, manager: 'سارة محمد', status: 'warning', performance: 75 },
            { id: 'INC03', name: 'حاضنة السلامة', type: TENANT_TYPES.INCUBATOR, manager: 'د. خالد الزهراني', status: 'active', performance: 92 },
            { id: 'PLT01', name: 'نايوش كلاود', type: TENANT_TYPES.PLATFORM, manager: 'فريق التقنية', status: 'maintenance', performance: 88 },
            { id: 'OFF02', name: 'مكتب جدة', type: TENANT_TYPES.OFFICE, manager: 'أستاذة منى', status: 'active', performance: 95 }
        ],

        finance: [
            { id: 'INV-HQ-101', desc: 'تحويل بنكي وارد', amount: 500000, type: 'credit', entityId: 'HQ001', date: '2023-11-01' },
            { id: 'EXP-HQ-202', desc: 'رواتب موظفي الإدارة', amount: -45000, type: 'debit', entityId: 'HQ001', date: '2023-11-05' },
            { id: 'INV-BR-303', desc: 'مبيعات يومية - العليا', amount: 12500, type: 'credit', entityId: 'BR015', date: '2023-11-06' },
            { id: 'EXP-BR-404', desc: 'صيانة مكيفات', amount: -600, type: 'debit', entityId: 'BR015', date: '2023-11-07' },
            { id: 'INV-INC-505', desc: 'رسوم دورة الأمن السيبراني', amount: 3500, type: 'credit', entityId: 'INC03', date: '2023-11-08' },
            { id: 'EXP-PLT-601', desc: 'تجديد سيرفرات AWS', amount: -1200, type: 'debit', entityId: 'PLT01', date: '2023-11-09' },
            { id: 'EXP-OFF-701', desc: 'تجهيزات مكتبية', amount: -3000, type: 'debit', entityId: 'OFF02', date: '2023-11-10' }
        ],

        tasks: [
            { id: 1, title: 'اعتماد الميزانية السنوية', status: 'pending', entityId: 'HQ001', assignedTo: 'manager', priority: 'high' },
            { id: 2, title: 'جرد المستودع الشهري', status: 'overdue', entityId: 'BR015', assignedTo: 'employee', priority: 'high' },
            { id: 3, title: 'تجهيز قاعة التدريب رقم 4', status: 'done', entityId: 'INC03', assignedTo: 'employee', priority: 'medium' },
            { id: 4, title: 'تحديث أمني للنظام v2.1', status: 'in_progress', entityId: 'PLT01', assignedTo: 'manager', priority: 'critical' },
            { id: 5, title: 'تجديد عقود الموظفين', status: 'pending', entityId: 'OFF02', assignedTo: 'manager', priority: 'medium' }
        ],

        cohorts: [
            { id: 101, name: 'الأمن السيبراني - دفعة 2', students: 25, progress: 40, entityId: 'INC03' },
            { id: 102, name: 'تطوير الويب - دفعة 5', students: 30, progress: 90, entityId: 'INC03' }
        ],

        notifications: [
            { id: 1, msg: 'تم تجاوز الحد الائتماني للفرع الرئيسي', type: 'alert', time: 'منذ 10 دقائق', entityId: 'BR015' },
            { id: 2, msg: 'تسجيل دخول جديد من منطقة غير معروفة', type: 'warning', time: 'منذ 30 دقيقة', entityId: 'PLT01' },
            { id: 3, msg: 'تم إغلاق السنة المالية للحاضنة بنجاح', type: 'success', time: 'منذ ساعتين', entityId: 'INC03' },
            { id: 4, msg: 'طلب اعتماد صرف ميزانية جديد', type: 'info', time: 'منذ 5 ساعات', entityId: 'OFF02' }
        ]
    };

    // --- STATE ---
    let currentUser = db.users[0]; // Default: HQ Super Admin

    // --- SECURITY & PERMISSIONS LOGIC ---
    const permissions = {
        canViewDashboard: () => true,
        canViewFinance: () => [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT].includes(currentUser.role),
        canEditFinance: () => [ROLES.SUPER_ADMIN, ROLES.ACCOUNTANT].includes(currentUser.role),
        canViewTasks: () => [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE].includes(currentUser.role),
        canManageTasks: () => [ROLES.SUPER_ADMIN, ROLES.MANAGER].includes(currentUser.role),
        canViewCohorts: () => [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CLIENT].includes(currentUser.role),
        canViewSystemStats: () => [ROLES.SUPER_ADMIN, ROLES.MANAGER].includes(currentUser.role) && currentUser.tenantType === TENANT_TYPES.PLATFORM,
        canViewGovernance: () => currentUser.tenantType === TENANT_TYPES.HQ && currentUser.role === ROLES.SUPER_ADMIN,
        isClient: () => currentUser.role === ROLES.CLIENT,
        isHQ: () => currentUser.tenantType === TENANT_TYPES.HQ
    };

    // --- API LAYER (Filtered by Scope & Permission) ---
    const api = {
        getCurrentUser: () => currentUser,
        
        getFinance: () => {
            if (!permissions.canViewFinance()) return [];
            // HQ Super Admin can see ALL finance if in Global Mode, but strictly typically sees HQ finance or Consolidated
            // For this system: HQ Super Admin sees Consolidated Finance in Dashboard, but specific list in Finance View
            if (permissions.isHQ() && currentUser.role === ROLES.SUPER_ADMIN) return db.finance;
            return db.finance.filter(item => item.entityId === currentUser.entityId);
        },

        getTasks: () => {
            if (!permissions.canViewTasks()) return [];
            if (permissions.isHQ() && currentUser.role === ROLES.SUPER_ADMIN) return db.tasks;
            return db.tasks.filter(item => item.entityId === currentUser.entityId);
        },

        getCohorts: () => {
            if (!permissions.canViewCohorts()) return [];
            return db.cohorts.filter(item => item.entityId === currentUser.entityId);
        },

        // HQ Specific APIs
        getAllEntities: () => {
             if (!permissions.canViewGovernance()) return [];
             return db.entities;
        },

        getGlobalStats: () => {
            if (!permissions.canViewGovernance()) return null;
            const totalRevenue = db.finance.filter(t => t.type === 'credit').reduce((a, b) => a + b.amount, 0);
            const totalExpense = db.finance.filter(t => t.type === 'debit').reduce((a, b) => a + Math.abs(b.amount), 0);
            const pendingTasks = db.tasks.filter(t => t.status !== 'done').length;
            const entitiesCount = db.entities.length;
            return { totalRevenue, totalExpense, pendingTasks, entitiesCount, netProfit: totalRevenue - totalExpense };
        },
        
        getRecentNotifications: () => {
             return db.notifications;
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
        
        // Simulate Loading for UX
        const main = document.getElementById('main-view');
        main.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full opacity-50">
            <i class="fas fa-fingerprint fa-spin text-5xl text-brand-500 mb-4"></i>
            <p class="font-bold text-lg">جاري التحقق من الصلاحيات...</p>
            <p class="text-sm text-gray-500 mt-2">الدور: ${currentUser.role} | النطاق: ${currentUser.tenantType}</p>
        </div>`;
        
        setTimeout(() => {
            renderSidebar();
            loadRoute('dashboard');
            updateHeader();
        }, 500);
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = `${currentUser.desc} (${currentUser.role})`;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        
        const badge = document.getElementById('entity-badge');
        badge.innerText = currentUser.entityName;
        
        // Dynamic Badge Color
        const typeColors = {
            'HQ': 'bg-purple-100 text-purple-700 border-purple-200',
            'BRANCH': 'bg-blue-100 text-blue-700 border-blue-200',
            'INCUBATOR': 'bg-orange-100 text-orange-700 border-orange-200',
            'PLATFORM': 'bg-green-100 text-green-700 border-green-200',
            'OFFICE': 'bg-gray-100 text-gray-700 border-gray-200'
        };
        badge.className = `hidden md:inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${typeColors[currentUser.tenantType] || 'bg-gray-100'}`;
    };

    // --- NAVIGATION RENDERER ---
    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        let links = `
            <li><a href="#" onclick="app.loadRoute('dashboard')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-home w-6 text-center group-hover:text-brand-400"></i> الرئيسية
            </a></li>
        `;

        // HQ Governance Menu
        if (permissions.canViewGovernance()) {
            links += `
            <div class="text-xs font-bold text-slate-500 mt-4 mb-2 px-3 uppercase tracking-wider">الحوكمة</div>
            <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-sitemap w-6 text-center group-hover:text-purple-400"></i> الفروع والكيانات
            </a></li>
            <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-chart-pie w-6 text-center group-hover:text-purple-400"></i> التقارير المركزية
            </a></li>
            `;
        }

        // Feature: Finance (Accounting)
        if (permissions.canViewFinance()) {
            links += `<li><a href="#" onclick="app.loadRoute('finance')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-coins w-6 text-center group-hover:text-yellow-400"></i> المالية
            </a></li>`;
        }

        // Feature: Tasks (Operations)
        if (permissions.canViewTasks()) {
            links += `<li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-tasks w-6 text-center group-hover:text-blue-400"></i> المهام
            </a></li>`;
        }

        // Feature: Cohorts (Education)
        if (currentUser.tenantType === TENANT_TYPES.INCUBATOR && permissions.canViewCohorts()) {
             links += `<li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-graduation-cap w-6 text-center group-hover:text-orange-400"></i> ${permissions.isClient() ? 'دوراتي' : 'إدارة الحاضنة'}
            </a></li>`;
        }

        // Feature: System Stats (Platform Admin)
        if (permissions.canViewSystemStats()) {
             links += `<li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-server w-6 text-center group-hover:text-green-400"></i> المراقبة
            </a></li>`;
        }

        // Feature: Settings (Managers & Admins only)
        if ([ROLES.SUPER_ADMIN, ROLES.MANAGER].includes(currentUser.role)) {
            links += `<li class="mt-8 border-t border-slate-800 pt-4"><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"><i class="fas fa-cog w-6 text-center"></i> الإعدادات</a></li>`;
        }
        
        menu.innerHTML = links;
    };

    const loadRoute = (route) => {
        const container = document.getElementById('main-view');
        let content = '';

        if (route === 'dashboard') {
            if (currentUser.role === ROLES.CLIENT) content = viewDashboardClient();
            // HQ Super Admin gets the Advanced Governance Dashboard
            else if (currentUser.tenantType === TENANT_TYPES.HQ && currentUser.role === ROLES.SUPER_ADMIN) content = viewDashboardHQGovernance();
            // HQ Accountant gets the simpler view
            else if (currentUser.tenantType === TENANT_TYPES.HQ) content = viewDashboardHQSimple();
            else if (currentUser.tenantType === TENANT_TYPES.BRANCH) content = viewDashboardBranch();
            else if (currentUser.tenantType === TENANT_TYPES.INCUBATOR) content = viewDashboardIncubator();
            else if (currentUser.tenantType === TENANT_TYPES.PLATFORM) content = viewDashboardPlatform();
            else if (currentUser.tenantType === TENANT_TYPES.OFFICE) content = viewDashboardOffice();
            else content = viewGenericDashboard();
        } 
        else if (route === 'finance') {
            content = permissions.canViewFinance() ? viewFinance() : viewAccessDenied();
        }
        else {
            content = '<div class="p-10 text-center text-gray-400">الصفحة قيد التطوير</div>';
        }

        container.innerHTML = `<div class="fade-in">${content}</div>`;
    };

    // --- VIEW COMPONENTS ---

    const viewAccessDenied = () => `
        <div class="flex flex-col items-center justify-center h-96 text-center">
            <i class="fas fa-lock text-6xl text-gray-300 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800">غير مصرح لك</h2>
            <p class="text-gray-500 mt-2">عذراً، حسابك الحالي (${currentUser.role}) لا يملك صلاحية الوصول لهذه الصفحة.</p>
        </div>
    `;

    // NEW: Comprehensive HQ Governance Dashboard
    const viewDashboardHQGovernance = () => {
        const stats = api.getGlobalStats();
        const entities = api.getAllEntities();
        const notifications = api.getRecentNotifications();

        return `
        <div class="space-y-6">
            <!-- Header Section -->
            <div class="flex justify-between items-end mb-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">مركز القيادة والتحكم (HQ)</h2>
                    <p class="text-gray-500 text-sm">نظرة شمولية على جميع الكيانات التابعة والعمليات الحيوية.</p>
                </div>
                <div class="flex gap-2">
                    <button class="bg-white border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition"><i class="fas fa-download ml-2"></i>تصدير التقرير الفصلي</button>
                    <button class="bg-brand-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-brand-700 transition shadow-lg shadow-brand-200"><i class="fas fa-plus ml-2"></i>كيان جديد</button>
                </div>
            </div>

            <!-- KPI Cards Row -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-xl shadow-sm border-b-4 border-green-500">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs text-gray-500 font-bold uppercase">إجمالي الإيرادات</p>
                            <h3 class="text-2xl font-bold text-gray-800 mt-1">${stats.totalRevenue.toLocaleString()} <span class="text-xs font-normal text-gray-400">ر.س</span></h3>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500"><i class="fas fa-chart-line"></i></div>
                    </div>
                    <div class="mt-2 text-xs text-green-600 flex items-center gap-1"><i class="fas fa-arrow-up"></i> 12% نمو شهري</div>
                </div>

                 <div class="bg-white p-5 rounded-xl shadow-sm border-b-4 border-red-400">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs text-gray-500 font-bold uppercase">إجمالي المصروفات</p>
                            <h3 class="text-2xl font-bold text-gray-800 mt-1">${stats.totalExpense.toLocaleString()} <span class="text-xs font-normal text-gray-400">ر.س</span></h3>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"><i class="fas fa-money-bill-wave"></i></div>
                    </div>
                    <div class="mt-2 text-xs text-gray-400">ضمن الميزانية المحددة</div>
                </div>

                <div class="bg-white p-5 rounded-xl shadow-sm border-b-4 border-blue-500">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs text-gray-500 font-bold uppercase">صافي الربح</p>
                            <h3 class="text-2xl font-bold text-gray-800 mt-1">${stats.netProfit.toLocaleString()} <span class="text-xs font-normal text-gray-400">ر.س</span></h3>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><i class="fas fa-coins"></i></div>
                    </div>
                    <div class="mt-2 text-xs text-blue-600">الربحية: ${(stats.netProfit / stats.totalRevenue * 100).toFixed(1)}%</div>
                </div>

                <div class="bg-white p-5 rounded-xl shadow-sm border-b-4 border-purple-500">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs text-gray-500 font-bold uppercase">حالة النظام</p>
                            <h3 class="text-2xl font-bold text-gray-800 mt-1">${stats.entitiesCount} <span class="text-xs font-normal text-gray-400">كيان نشط</span></h3>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500"><i class="fas fa-server"></i></div>
                    </div>
                     <div class="mt-2 text-xs text-orange-500 flex items-center gap-1"><i class="fas fa-exclamation-circle"></i> ${stats.pendingTasks} مهام معلقة</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left: Entities Table -->
                <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="p-5 border-b border-gray-100 flex justify-between items-center">
                        <h3 class="font-bold text-gray-700">حالة الكيانات التابعة</h3>
                        <button class="text-xs text-brand-600 hover:underline">عرض الكل</button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-right">
                            <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th class="p-4">الكيان</th>
                                    <th class="p-4">النوع</th>
                                    <th class="p-4">المدير المسؤول</th>
                                    <th class="p-4">الأداء</th>
                                    <th class="p-4">الحالة</th>
                                    <th class="p-4">إجراء</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${entities.map(ent => `
                                <tr class="hover:bg-gray-50 transition text-sm">
                                    <td class="p-4 font-bold text-gray-700">${ent.name}</td>
                                    <td class="p-4"><span class="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600">${ent.type}</span></td>
                                    <td class="p-4 text-gray-500">${ent.manager}</td>
                                    <td class="p-4">
                                        <div class="flex items-center gap-2">
                                            <div class="w-16 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                                <div class="h-full ${ent.performance > 90 ? 'bg-green-500' : (ent.performance > 70 ? 'bg-yellow-500' : 'bg-red-500')}" style="width: ${ent.performance}%"></div>
                                            </div>
                                            <span class="text-xs text-gray-400">${ent.performance}%</span>
                                        </div>
                                    </td>
                                    <td class="p-4">
                                        ${ent.status === 'active' 
                                            ? '<span class="text-green-600 flex items-center gap-1 text-xs"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> نشط</span>' 
                                            : (ent.status === 'warning' 
                                                ? '<span class="text-orange-500 flex items-center gap-1 text-xs"><span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> تنبيه</span>' 
                                                : '<span class="text-red-500 flex items-center gap-1 text-xs"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> صيانة</span>')}
                                    </td>
                                    <td class="p-4">
                                        <button class="text-gray-400 hover:text-brand-600 transition"><i class="fas fa-ellipsis-h"></i></button>
                                    </td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Right: Notifications & Feeds -->
                <div class="space-y-6">
                    <!-- Notifications -->
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h3 class="font-bold text-gray-700 mb-4">التنبيهات العاجلة</h3>
                        <div class="space-y-4">
                            ${notifications.map(note => `
                            <div class="flex gap-3 items-start">
                                <div class="mt-1 w-2 h-2 rounded-full ${note.type === 'alert' ? 'bg-red-500' : (note.type === 'warning' ? 'bg-orange-500' : (note.type === 'success' ? 'bg-green-500' : 'bg-blue-500'))} flex-shrink-0"></div>
                                <div>
                                    <p class="text-sm text-gray-800 font-medium leading-tight">${note.msg}</p>
                                    <div class="flex items-center gap-2 mt-1">
                                        <span class="text-[10px] text-gray-400">${note.time}</span>
                                        <span class="text-[10px] bg-gray-100 px-1 rounded text-gray-500">${note.entityId}</span>
                                    </div>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                        <button class="w-full mt-4 text-xs text-center text-brand-600 hover:text-brand-700 font-bold py-2 border border-brand-100 rounded bg-brand-50 transition">عرض أرشيف التنبيهات</button>
                    </div>

                    <!-- Quick Stats breakdown -->
                    <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-5 text-white">
                        <h3 class="font-bold mb-4 text-slate-200">توزيع الإيرادات</h3>
                        <div class="space-y-3">
                            <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-slate-400">الفروع (Retail)</span>
                                    <span>65%</span>
                                </div>
                                <div class="w-full bg-slate-700 h-1 rounded-full">
                                    <div class="bg-blue-500 h-1 rounded-full" style="width: 65%"></div>
                                </div>
                            </div>
                             <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-slate-400">الحاضنات (Edu)</span>
                                    <span>25%</span>
                                </div>
                                <div class="w-full bg-slate-700 h-1 rounded-full">
                                    <div class="bg-orange-500 h-1 rounded-full" style="width: 25%"></div>
                                </div>
                            </div>
                             <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-slate-400">المنصة (SaaS)</span>
                                    <span>10%</span>
                                </div>
                                <div class="w-full bg-slate-700 h-1 rounded-full">
                                    <div class="bg-green-500 h-1 rounded-full" style="width: 10%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    };

    // Simple HQ Dashboard (for non-admins like Accountant)
    const viewDashboardHQSimple = () => {
        const finance = api.getFinance();
        return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">لوحة الموظف (المقر الرئيسي)</h2>
            <p class="text-gray-500">مرحباً بك، ${currentUser.name} - قسم المالية</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="stat-card border-purple-200 bg-purple-50">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-purple-800">السيولة النقدية</h3>
                    <i class="fas fa-wallet text-purple-300 text-xl"></i>
                </div>
                <p class="text-3xl font-bold text-gray-800">${finance.reduce((a,c)=>c.type==='credit'?a+c.amount:a-c.amount,0).toLocaleString()} <span class="text-sm font-normal text-gray-500">ر.س</span></p>
                <p class="text-xs text-purple-600 mt-2">بيانات مالية سرية للمقر الرئيسي</p>
            </div>
        </div>
        `;
    };

    const viewDashboardBranch = () => {
        // Logic: Manager sees everything, Employee sees POS/Tasks only
        const isManager = currentUser.role === ROLES.MANAGER;

        return `
        <div class="flex flex-col gap-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-blue-500">
                <h2 class="text-xl font-bold text-gray-800">فرع ${currentUser.entityName}</h2>
                <p class="text-gray-500">صلاحيات: ${isManager ? 'إدارة كاملة (جرد، مالية، موظفين)' : 'عمليات (بيع، مهام يومية)'}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button class="p-6 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition flex flex-col items-center gap-3">
                    <i class="fas fa-cash-register text-3xl"></i>
                    <span class="font-bold">نقطة البيع (POS)</span>
                </button>
                
                <button class="p-6 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:border-blue-500 transition flex flex-col items-center gap-3">
                    <i class="fas fa-boxes text-3xl text-blue-300"></i>
                    <span class="font-bold">المخزون</span>
                </button>

                ${isManager ? `
                <button class="p-6 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:border-blue-500 transition flex flex-col items-center gap-3">
                    <i class="fas fa-users-cog text-3xl text-purple-300"></i>
                    <span class="font-bold">إدارة الموظفين</span>
                </button>
                <button class="p-6 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:border-blue-500 transition flex flex-col items-center gap-3">
                    <i class="fas fa-file-invoice-dollar text-3xl text-green-300"></i>
                    <span class="font-bold">إغلاق الصندوق</span>
                </button>
                ` : ''}
            </div>

             <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold mb-4">المهام المطلوبة</h3>
                ${api.getTasks().map(t => `<div class="p-3 border-b flex justify-between"><span>${t.title}</span><span class="text-xs ${t.status==='overdue'?'bg-red-100 text-red-600':'bg-gray-100'} px-2 py-1 rounded">${t.status}</span></div>`).join('')}
            </div>
        </div>
        `;
    };

    const viewDashboardIncubator = () => {
        const cohorts = api.getCohorts();
        return `
        <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 rounded-2xl shadow-lg mb-8">
             <h2 class="text-2xl font-bold mb-2">حاضنة الأعمال والتدريب</h2>
             <p class="opacity-90">إدارة البرامج التعليمية والمشتركين</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 class="font-bold text-gray-800 mb-4">الدفعات النشطة</h3>
            <div class="space-y-4">
                ${cohorts.map(c => `
                <div class="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div class="flex justify-between items-center mb-2">
                         <h4 class="font-bold text-slate-700">${c.name}</h4>
                         <span class="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded">${c.students} طالب</span>
                    </div>
                    <div class="w-full bg-gray-200 h-2 rounded-full">
                        <div class="bg-orange-500 h-2 rounded-full" style="width: ${c.progress}%"></div>
                    </div>
                    <div class="text-left text-xs text-gray-400 mt-1">نسبة الإنجاز ${c.progress}%</div>
                </div>
                `).join('')}
            </div>
        </div>
        `;
    };

    const viewDashboardClient = () => {
        // Specific Dashboard for Client (Student)
        const cohorts = api.getCohorts();
        return `
        <div class="max-w-3xl mx-auto">
            <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center mb-6">
                <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">مرحباً، ${currentUser.name}</h2>
                <p class="text-gray-500">بوابة الطالب الإلكترونية</p>
            </div>

            <h3 class="font-bold text-gray-700 mb-4 px-2">دوراتي المسجلة</h3>
            <div class="grid gap-4">
                ${cohorts.map(c => `
                <div class="bg-white p-6 rounded-xl shadow-sm flex items-center gap-4 hover:shadow-md transition cursor-pointer border border-transparent hover:border-green-200">
                    <div class="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-800">${c.name}</h4>
                        <p class="text-xs text-gray-400">حالة التسجيل: نشط</p>
                    </div>
                    <i class="fas fa-chevron-left text-gray-300"></i>
                </div>
                `).join('')}
            </div>

            <div class="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-center gap-4">
                <i class="fas fa-info-circle text-blue-500 text-2xl"></i>
                <div>
                    <h4 class="font-bold text-blue-800">تنبيه إداري</h4>
                    <p class="text-sm text-blue-600">يرجى سداد رسوم الفصل القادم قبل تاريخ 30/11</p>
                </div>
            </div>
        </div>
        `;
    };

    const viewDashboardPlatform = () => {
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div class="bg-gray-900 text-white p-6 rounded-xl shadow-lg">
                <h3 class="font-bold text-green-400 mb-4"><i class="fas fa-terminal mr-2"></i>Server Status</h3>
                <div class="space-y-2 font-mono text-sm">
                    <div class="flex justify-between"><span>CPU Usage</span><span class="text-green-400">12%</span></div>
                    <div class="flex justify-between"><span>Memory</span><span class="text-yellow-400">4.2GB / 8GB</span></div>
                    <div class="flex justify-between"><span>Uptime</span><span class="text-blue-400">45d 12h</span></div>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 class="font-bold text-gray-800 mb-4">SaaS Metrics</h3>
                <div class="text-center py-8">
                    <p class="text-4xl font-bold text-brand-600">14,205</p>
                    <p class="text-gray-400">Active Users across tenants</p>
                </div>
            </div>
        </div>
        `;
    };
    
    const viewDashboardOffice = () => {
         return `
         <div class="flex flex-col items-center justify-center h-full pt-10">
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" class="w-32 opacity-20 mb-6">
            <h2 class="text-2xl font-bold text-gray-700">مكتب الخدمات الإدارية</h2>
            <p class="text-gray-500">إدارة شؤون الموظفين والخدمات اللوجستية للمنطقة</p>
            <div class="mt-8 grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded shadow-sm text-center w-40">
                    <div class="font-bold text-xl">45</div>
                    <div class="text-xs text-gray-400">موظف</div>
                </div>
                <div class="bg-white p-4 rounded shadow-sm text-center w-40">
                    <div class="font-bold text-xl">12</div>
                    <div class="text-xs text-gray-400">سيارة</div>
                </div>
            </div>
         </div>
         `;
    }

    const viewGenericDashboard = () => `<div>Dashboard not configured for this type.</div>`;

    const viewFinance = () => {
        const finance = api.getFinance();
        const isEditor = permissions.canEditFinance();
        
        return `
        <div class="bg-white p-6 rounded-xl shadow-sm">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-xl font-bold text-gray-800">التقارير المالية</h2>
                    <p class="text-sm text-gray-500">عرض العمليات الخاصة بـ ${currentUser.entityName}</p>
                </div>
                ${isEditor ? `<button class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 shadow-lg shadow-green-200"><i class="fas fa-plus ml-2"></i>قيد جديد</button>` : ''}
            </div>
            
            <div class="overflow-x-auto">
                <table class="data-table w-full text-right">
                    <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th class="p-3 rounded-tr-lg">#</th>
                            <th class="p-3">البند</th>
                            <th class="p-3">التاريخ</th>
                            <th class="p-3 rounded-tl-lg">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        ${finance.map(f => `
                        <tr class="hover:bg-gray-50 transition">
                            <td class="p-3 font-mono text-xs text-gray-400">${f.id}</td>
                            <td class="p-3 font-medium text-gray-700">${f.desc}</td>
                            <td class="p-3 text-sm text-gray-500">${f.date}</td>
                            <td class="p-3 font-bold ${f.type === 'credit' ? 'text-green-600' : 'text-red-600'}" dir="ltr">
                                ${f.type === 'credit' ? '+' : ''}${f.amount.toLocaleString()}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            ${!isEditor ? `<div class="mt-4 p-3 bg-yellow-50 text-yellow-700 text-xs rounded border border-yellow-200"><i class="fas fa-lock ml-1"></i> وضع القراءة فقط: ليس لديك صلاحية التعديل على السجلات المالية.</div>` : ''}
        </div>
        `;
    };

    // --- EXPOSE ---
    return {
        init,
        switchUser,
        loadRoute
    };
})();

document.addEventListener('DOMContentLoaded', app.init);