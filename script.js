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

        finance: [
            { id: 'INV-HQ-101', desc: 'تحويل بنكي وارد', amount: 500000, type: 'credit', entityId: 'HQ001', date: '2023-11-01' },
            { id: 'EXP-HQ-202', desc: 'رواتب موظفي الإدارة', amount: -45000, type: 'debit', entityId: 'HQ001', date: '2023-11-05' },
            { id: 'INV-BR-303', desc: 'مبيعات يومية', amount: 12500, type: 'credit', entityId: 'BR015', date: '2023-11-06' },
            { id: 'EXP-BR-404', desc: 'صيانة مكيفات', amount: -600, type: 'debit', entityId: 'BR015', date: '2023-11-07' },
            { id: 'INV-INC-505', desc: 'رسوم دورة الأمن السيبراني', amount: 3500, type: 'credit', entityId: 'INC03', date: '2023-11-08' }
        ],

        tasks: [
            { id: 1, title: 'اعتماد الميزانية', status: 'pending', entityId: 'HQ001', assignedTo: 'manager' },
            { id: 2, title: 'جرد المستودع', status: 'in_progress', entityId: 'BR015', assignedTo: 'employee' },
            { id: 3, title: 'تجهيز قاعة التدريب', status: 'done', entityId: 'INC03', assignedTo: 'employee' },
            { id: 4, title: 'تحديث سيرفر قاعدة البيانات', status: 'pending', entityId: 'PLT01', assignedTo: 'manager' }
        ],

        cohorts: [
            { id: 101, name: 'الأمن السيبراني - دفعة 2', students: 25, progress: 40, entityId: 'INC03' },
            { id: 102, name: 'تطوير الويب - دفعة 5', students: 30, progress: 90, entityId: 'INC03' }
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
        isClient: () => currentUser.role === ROLES.CLIENT,
        isHQ: () => currentUser.tenantType === TENANT_TYPES.HQ
    };

    // --- API LAYER (Filtered by Scope & Permission) ---
    const api = {
        getCurrentUser: () => currentUser,
        
        getFinance: () => {
            if (!permissions.canViewFinance()) return [];
            // Scope: Only own tenant data
            return db.finance.filter(item => item.entityId === currentUser.entityId);
        },

        getTasks: () => {
            if (!permissions.canViewTasks()) return [];
            // Scope: Only own tenant data
            return db.tasks.filter(item => item.entityId === currentUser.entityId);
        },

        getCohorts: () => {
            if (!permissions.canViewCohorts()) return [];
            return db.cohorts.filter(item => item.entityId === currentUser.entityId);
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
            else if (currentUser.tenantType === TENANT_TYPES.HQ) content = viewDashboardHQ();
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

    const viewDashboardHQ = () => {
        const finance = api.getFinance();
        // Only Accountant and Admin see financial widgets
        const showFinance = permissions.canViewFinance();
        
        return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">لوحة قيادة المكتب الرئيسي</h2>
            <p class="text-gray-500">مرحباً بك، ${currentUser.name} (${currentUser.role === ROLES.ACCOUNTANT ? 'قسم المالية' : 'الإدارة العليا'})</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${showFinance ? `
            <div class="stat-card border-purple-200 bg-purple-50">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-purple-800">السيولة النقدية</h3>
                    <i class="fas fa-wallet text-purple-300 text-xl"></i>
                </div>
                <p class="text-3xl font-bold text-gray-800">${finance.reduce((a,c)=>c.type==='credit'?a+c.amount:a-c.amount,0).toLocaleString()} <span class="text-sm font-normal text-gray-500">ر.س</span></p>
                <p class="text-xs text-purple-600 mt-2">بيانات مالية سرية للمقر الرئيسي</p>
            </div>
            ` : ''}

            <div class="stat-card">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-gray-700">الفروع المرتبطة</h3>
                    <i class="fas fa-network-wired text-gray-300 text-xl"></i>
                </div>
                <p class="text-3xl font-bold text-gray-800">5</p>
                <p class="text-xs text-gray-400 mt-2">وحدات أعمال تابعة</p>
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
                ${api.getTasks().map(t => `<div class="p-3 border-b flex justify-between"><span>${t.title}</span><span class="text-xs bg-gray-100 px-2 py-1 rounded">${t.status}</span></div>`).join('')}
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
