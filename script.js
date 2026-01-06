/**
 * NAYOSH ERP - HQ Central Governance & Multi-Tenant System
 * Updated Logic: HQ Dashboard, Entity Management, Central Reports, Tasks
 */

const app = (() => {
    // --- CONFIGURATION ---
    const ROLES = {
        SUPER_ADMIN: 'SUPER_ADMIN',
        MANAGER: 'MANAGER',
        EMPLOYEE: 'EMPLOYEE',
        CLIENT: 'CLIENT'
    };

    const TENANT_TYPES = {
        HQ: { id: 'HQ', label: 'المكتب الرئيسي', icon: 'fa-building', color: 'text-purple-600', bg: 'bg-purple-50' },
        BRANCH: { id: 'BRANCH', label: 'فرع تجزئة', icon: 'fa-store', color: 'text-blue-600', bg: 'bg-blue-50' },
        INCUBATOR: { id: 'INCUBATOR', label: 'حاضنة أعمال', icon: 'fa-seedling', color: 'text-orange-600', bg: 'bg-orange-50' },
        PLATFORM: { id: 'PLATFORM', label: 'منصة رقمية', icon: 'fa-laptop-code', color: 'text-green-600', bg: 'bg-green-50' },
        OFFICE: { id: 'OFFICE', label: 'مكتب إداري', icon: 'fa-briefcase', color: 'text-gray-600', bg: 'bg-gray-50' }
    };

    // --- DATA LAYER ---
    const db = {
        users: [
            { id: 1, name: 'م. أحمد العلي', role: ROLES.SUPER_ADMIN, tenantType: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي' },
            { id: 2, name: 'سارة محمد', role: ROLES.MANAGER, tenantType: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول' },
            { id: 3, name: 'د. خالد الزهراني', role: ROLES.MANAGER, tenantType: 'INCUBATOR', entityId: 'INC03', entityName: 'حاضنة السلامة' },
            { id: 4, name: 'فريق التقنية', role: ROLES.MANAGER, tenantType: 'PLATFORM', entityId: 'PLT01', entityName: 'نايوش كلاود' },
            { id: 9, name: 'فهد السبيعي', role: ROLES.MANAGER, tenantType: 'BRANCH', entityId: 'BR016', entityName: 'فرع مول الرياض' }
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
            { id: 1, title: 'صيانة دورية للنظام', content: 'سيتم توقف النظام للصيانة...', type: 'warning', scope: 'GLOBAL', status: 'ACTIVE', sourceEntityId: 'HQ001', date: '2023-11-20' },
            { id: 3, title: 'خصم خاص للموظفين', content: 'خصم 20% لدى كافية Jolt...', type: 'promo', scope: 'MULTI_BRANCH', status: 'ACTIVE', sourceEntityId: 'BR015', date: '2023-11-20' },
            { id: 5, title: 'افتتاح فرعنا الجديد', content: 'ندعوكم لحفل افتتاح...', type: 'promo', scope: 'GLOBAL', status: 'PENDING', sourceEntityId: 'BR015', date: '2023-11-25', price: 150 }
        ],

        tasks: [
            { id: 101, title: 'اعتماد الميزانية الربعية للفروع', dueDate: '2023-11-30', status: 'Pending', priority: 'High', type: 'Finance' },
            { id: 102, title: 'مراجعة طلبات الإعلانات المعلقة', dueDate: '2023-11-21', status: 'In Progress', priority: 'Medium', type: 'Ops' },
            { id: 103, title: 'تجديد رخصة منصة نايوش كلاود', dueDate: '2023-12-01', status: 'Pending', priority: 'High', type: 'Legal' },
            { id: 104, title: 'اجتماع مدراء المناطق', dueDate: '2023-11-22', status: 'Done', priority: 'Low', type: 'Meeting' }
        ]
    };

    let currentUser = db.users[0]; // Default: HQ Super Admin

    // --- PERMISSIONS ---
    const perms = {
        isHQ: () => currentUser.tenantType === 'HQ',
    };

    // --- INIT ---
    const init = () => {
        renderSidebar();
        updateHeader();
        loadRoute('dashboard');
    };

    const switchUser = (id) => {
        const u = db.users.find(x => x.id === id);
        if (u) {
            currentUser = u;
            document.getElementById('main-view').innerHTML = `<div class="flex h-full items-center justify-center"><i class="fas fa-spin fa-spinner text-4xl text-brand-500"></i></div>`;
            setTimeout(() => { 
                renderSidebar(); 
                updateHeader(); 
                loadRoute('dashboard');
            }, 500);
        }
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = currentUser.tenantType + ' | ' + currentUser.role;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        document.getElementById('entity-badge').innerText = currentUser.entityName;
    };

    // --- ROUTING ---
    const loadRoute = (route) => {
        const view = document.getElementById('main-view');
        document.getElementById('page-title').innerText = getTitle(route);
        
        let content = '';
        if (perms.isHQ()) {
            // HQ Specific Routes
            switch(route) {
                case 'dashboard': content = renderHQDashboard(); break;
                case 'entities': content = renderEntitiesManager(); break;
                case 'reports': content = renderCentralReports(); break;
                case 'ads-governance': content = renderAdsGovernance(); break;
                case 'tasks': content = renderTasksManager(); break;
                default: content = renderPlaceholder();
            }
        } else {
            // Other Roles Routes (Simplified for this context)
            switch(route) {
                case 'dashboard': content = renderBranchDashboard(); break;
                default: content = renderPlaceholder();
            }
        }
        view.innerHTML = `<div class="fade-in">${content}</div>`;
    };

    const getTitle = (r) => {
        const map = { 
            'dashboard': 'لوحة القيادة المركزية', 
            'entities': 'إدارة الكيانات والفروع', 
            'reports': 'التقارير والتحليلات', 
            'ads-governance': 'حوكمة الإعلانات',
            'tasks': 'المهام والمتابعة'
        };
        return map[r] || 'نايوش ERP';
    };

    // --- RENDERERS ---
    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        let items = [];

        if (perms.isHQ()) {
            items = [
                { id: 'dashboard', icon: 'fa-chart-pie', label: 'الرئيسية' },
                { id: 'entities', icon: 'fa-sitemap', label: 'إدارة الكيانات' },
                { id: 'tasks', icon: 'fa-tasks', label: 'المهام' },
                { id: 'ads-governance', icon: 'fa-user-shield', label: 'حوكمة الإعلانات' },
                { id: 'reports', icon: 'fa-file-contract', label: 'التقارير المركزية' }
            ];
        } else {
            items = [
                { id: 'dashboard', icon: 'fa-home', label: 'الرئيسية' },
                { id: 'my-ads', icon: 'fa-bullhorn', label: 'إعلاناتي' },
                { id: 'operations', icon: 'fa-cogs', label: 'العمليات' }
            ];
        }

        menu.innerHTML = items.map(item => 
            `<li>
                <a href="#" onclick="app.loadRoute('${item.id}')" 
                   class="flex items-center gap-3 px-3 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition group">
                   <i class="fas ${item.icon} w-6 text-center text-slate-400 group-hover:text-brand-400 transition-colors"></i> 
                   ${item.label}
                </a>
            </li>`
        ).join('');
    };

    // 1. HQ DASHBOARD
    const renderHQDashboard = () => {
        const stats = {
            totalEntities: db.entities.length - 1, // Exclude HQ
            totalBalance: db.entities.reduce((acc, curr) => acc + (curr.balance || 0), 0),
            pendingAds: db.ads.filter(a => a.status === 'PENDING').length,
            activeUsers: db.entities.reduce((acc, curr) => acc + (curr.users || 0), 0)
        };

        return `
        <!-- KPI CARDS -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                    <p class="text-xs text-slate-500 font-bold mb-1">إجمالي الكيانات</p>
                    <h3 class="text-2xl font-bold text-slate-800">${stats.totalEntities}</h3>
                    <span class="text-[10px] text-green-500 flex items-center mt-1"><i class="fas fa-arrow-up ml-1"></i> 2 جدد هذا الشهر</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg"><i class="fas fa-building"></i></div>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                    <p class="text-xs text-slate-500 font-bold mb-1">الرصيد المجمع</p>
                    <h3 class="text-2xl font-bold text-slate-800">${stats.totalBalance.toLocaleString()} <span class="text-xs">ر.س</span></h3>
                    <span class="text-[10px] text-green-500 flex items-center mt-1"><i class="fas fa-arrow-up ml-1"></i> 12% نمو</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg"><i class="fas fa-wallet"></i></div>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                    <p class="text-xs text-slate-500 font-bold mb-1">طلبات معلقة</p>
                    <h3 class="text-2xl font-bold text-slate-800">${stats.pendingAds}</h3>
                    <span class="text-[10px] ${stats.pendingAds > 0 ? 'text-orange-500' : 'text-slate-400'} flex items-center mt-1">${stats.pendingAds > 0 ? 'يتطلب إجراء' : 'لا يوجد مهام'}</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-lg"><i class="fas fa-clock"></i></div>
            </div>

            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                    <p class="text-xs text-slate-500 font-bold mb-1">المستخدمين النشطين</p>
                    <h3 class="text-2xl font-bold text-slate-800">${stats.activeUsers}</h3>
                    <span class="text-[10px] text-green-500 flex items-center mt-1">عبر كل المنصات</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-lg"><i class="fas fa-users"></i></div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- ENTITIES SNAPSHOT -->
            <div class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 class="font-bold text-slate-700">حالة الكيانات والفروع</h3>
                    <button onclick="app.loadRoute('entities')" class="text-xs text-brand-600 hover:underline">عرض الكل</button>
                </div>
                <div class="p-4">
                    <div class="overflow-x-auto">
                        <table class="w-full text-right">
                            <thead class="text-xs text-slate-400 font-light bg-slate-50">
                                <tr>
                                    <th class="p-3 rounded-r-lg">اسم الكيان</th>
                                    <th class="p-3">النوع</th>
                                    <th class="p-3">الموقع</th>
                                    <th class="p-3">الحالة</th>
                                    <th class="p-3 rounded-l-lg">الأداء</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm text-slate-600">
                                ${db.entities.filter(e => e.type !== 'HQ').slice(0, 5).map(e => `
                                    <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
                                        <td class="p-3 font-bold">${e.name}</td>
                                        <td class="p-3"><span class="text-[10px] px-2 py-1 rounded ${TENANT_TYPES[e.type].bg} ${TENANT_TYPES[e.type].color}">${TENANT_TYPES[e.type].label}</span></td>
                                        <td class="p-3">${e.location}</td>
                                        <td class="p-3">
                                            <span class="flex items-center gap-1 text-[10px] font-bold ${e.status === 'Active' ? 'text-green-500' : 'text-red-500'}">
                                                <span class="w-1.5 h-1.5 rounded-full bg-current"></span> ${e.status === 'Active' ? 'نشط' : 'متوقف'}
                                            </span>
                                        </td>
                                        <td class="p-3">
                                            <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div class="h-full bg-brand-500" style="width: ${Math.random() * 40 + 60}%"></div>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- URGENT TASKS -->
            <div class="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
                <div class="px-6 py-4 border-b border-slate-100">
                    <h3 class="font-bold text-slate-700">المهام العاجلة</h3>
                </div>
                <div class="flex-1 p-4 space-y-3 overflow-y-auto max-h-96">
                    ${db.tasks.filter(t => t.status !== 'Done').map(t => `
                        <div class="p-3 bg-slate-50 rounded-lg border-r-4 ${t.priority === 'High' ? 'border-red-400' : 'border-yellow-400'} hover:shadow-md transition cursor-pointer">
                            <div class="flex justify-between items-start">
                                <span class="text-[10px] text-slate-400 font-mono">#${t.id}</span>
                                <span class="text-[10px] bg-white border px-1.5 rounded text-slate-500">${t.dueDate}</span>
                            </div>
                            <h4 class="text-sm font-bold text-slate-800 mt-1">${t.title}</h4>
                            <div class="mt-2 flex justify-between items-center">
                                <span class="text-[10px] text-slate-500 bg-slate-200 px-2 rounded">${t.type}</span>
                                <button class="text-xs text-brand-600 hover:text-brand-800"><i class="fas fa-arrow-left"></i></button>
                            </div>
                        </div>
                    `).join('')}
                    <button onclick="app.loadRoute('tasks')" class="w-full py-2 text-center text-xs text-slate-400 border border-dashed rounded hover:bg-slate-50 transition">إضافة مهمة جديدة +</button>
                </div>
            </div>
        </div>
        `;
    };

    // 2. ENTITY MANAGER
    const renderEntitiesManager = () => {
        return `
        <div class="mb-6 flex justify-between items-center">
            <h2 class="text-2xl font-bold text-slate-800">إدارة الكيانات</h2>
            <button class="bg-brand-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-brand-700 transition flex items-center gap-2">
                <i class="fas fa-plus"></i> إضافة كيان جديد
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            ${db.entities.map(e => `
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:border-brand-200 transition">
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-4">
                            <div class="w-12 h-12 rounded-lg ${TENANT_TYPES[e.type].bg} ${TENANT_TYPES[e.type].color} flex items-center justify-center text-xl shadow-inner">
                                <i class="fas ${TENANT_TYPES[e.type].icon}"></i>
                            </div>
                            <div class="relative">
                                <button class="text-slate-300 hover:text-slate-600"><i class="fas fa-ellipsis-v"></i></button>
                            </div>
                        </div>
                        <h3 class="font-bold text-lg text-slate-800 mb-1">${e.name}</h3>
                        <p class="text-xs text-slate-500 flex items-center gap-1"><i class="fas fa-map-marker-alt"></i> ${e.location}</p>
                        
                        <div class="mt-6 grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                            <div>
                                <p class="text-[10px] text-slate-400">المستخدمين</p>
                                <p class="font-bold text-slate-700">${e.users}</p>
                            </div>
                            <div class="text-left">
                                <p class="text-[10px] text-slate-400">الرصيد</p>
                                <p class="font-bold text-green-600">${e.balance} ر.س</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-50 px-5 py-3 flex justify-between items-center">
                        <span class="text-[10px] px-2 py-0.5 rounded-full ${e.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${e.status === 'Active' ? 'متصل' : 'غير نشط'}
                        </span>
                        <button class="text-xs text-brand-600 font-bold hover:underline">التفاصيل</button>
                    </div>
                </div>
            `).join('')}
        </div>
        `;
    };

    // 3. CENTRAL REPORTS
    const renderCentralReports = () => {
        return `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-slate-800">التقارير المركزية</h2>
                <select class="bg-white border border-slate-200 rounded px-3 py-1 text-sm outline-none">
                    <option>هذا الشهر</option>
                    <option>الربع الأخير</option>
                    <option>السنة الحالية</option>
                </select>
            </div>

            <!-- Revenue Chart Simulation -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 class="font-bold text-slate-700 mb-6">توزيع الإيرادات حسب نوع الكيان</h3>
                <div class="space-y-4">
                    ${Object.keys(TENANT_TYPES).map(key => {
                        if (key === 'HQ' || key === 'OFFICE') return '';
                        const type = TENANT_TYPES[key];
                        const val = Math.floor(Math.random() * 80) + 20;
                        return `
                        <div>
                            <div class="flex justify-between text-xs mb-1">
                                <span class="font-bold text-slate-600">${type.label}</span>
                                <span class="text-slate-400">${val}%</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div class="${type.bg.replace('bg-', 'bg-').replace('50', '500')} h-2.5 rounded-full" style="width: ${val}%"></div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Activity Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-slate-700 mb-4">أكثر الفروع نشاطاً (إعلانات)</h3>
                    <ul class="space-y-3">
                        ${db.entities.filter(e => e.type === 'BRANCH').slice(0,3).map((e, i) => `
                            <li class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">${i+1}</span>
                                    <span class="text-sm text-slate-700">${e.name}</span>
                                </div>
                                <span class="text-xs font-bold text-brand-600">${Math.floor(Math.random() * 50)} إعلان</span>
                            </li>
                        `).join('')}
                    </ul>
                 </div>
                 
                 <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-slate-700 mb-4">ملخص الدعم الفني</h3>
                    <div class="flex items-center justify-center h-40">
                        <div class="text-center">
                            <h4 class="text-4xl font-bold text-slate-800">98%</h4>
                            <p class="text-sm text-green-500">نسبة الرضا</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
        `;
    };

    // 4. ADS GOVERNANCE (Existing Logic + HQ View)
    const renderAdsGovernance = () => {
        // Re-using the logic from previous build but wrapping it specifically
        // This is where HQ approves/rejects global ads
        const pendingAds = db.ads.filter(a => a.status === 'PENDING');
        
        return `
        <div class="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden mb-6">
            <div class="bg-orange-50 px-6 py-4 border-b border-orange-100">
                <h3 class="font-bold text-orange-800 text-lg">طلبات النشر المعلقة (Governance Queue)</h3>
                <p class="text-xs text-orange-600 mt-1">هذه الإعلانات تتطلب موافقة مركزية لأنها تستهدف نطاق أوسع من الصلاحيات الممنوحة للفرع.</p>
            </div>
            <div class="divide-y divide-gray-50">
                ${pendingAds.length === 0 ? '<p class="p-8 text-center text-gray-400">لا توجد طلبات معلقة، النظام نظيف ✅</p>' : pendingAds.map(ad => `
                    <div class="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-orange-50/30 transition">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-slate-600">${ad.sourceEntityId}</span>
                                <h4 class="font-bold text-gray-800">${ad.title}</h4>
                                <span class="text-[10px] bg-red-100 text-red-600 px-2 rounded-full">${ad.scope}</span>
                            </div>
                            <p class="text-sm text-gray-600">${ad.content}</p>
                            <div class="mt-3 flex items-center gap-4 text-xs text-gray-400">
                                <span><i class="far fa-calendar"></i> ${ad.date}</span>
                                <span><i class="fas fa-coins"></i> التكلفة: ${ad.price || 0} ر.س</span>
                            </div>
                        </div>
                        <div class="flex gap-3">
                             <button onclick="app.approveAd(${ad.id})" class="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 shadow-sm transition">
                                <i class="fas fa-check"></i> موافقة
                             </button>
                             <button onclick="app.rejectAd(${ad.id})" class="bg-white border border-red-200 text-red-500 px-4 py-2 rounded-lg text-sm hover:bg-red-50 transition">
                                <i class="fas fa-times"></i> رفض
                             </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        `;
    };

    const renderTasksManager = () => {
        return `
        <div class="bg-white rounded-xl shadow-sm border border-slate-100">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between">
                <h3 class="font-bold text-slate-800">قائمة المهام المركزية</h3>
                <button class="text-sm text-brand-600 font-bold hover:underline">+ مهمة جديدة</button>
            </div>
            <div class="divide-y divide-slate-50">
                ${db.tasks.map(t => `
                    <div class="p-4 flex items-center gap-4 hover:bg-slate-50 transition">
                        <div class="w-6 h-6 rounded-full border-2 ${t.status === 'Done' ? 'bg-green-500 border-green-500' : 'border-slate-300'} flex items-center justify-center cursor-pointer">
                            ${t.status === 'Done' ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                        </div>
                        <div class="flex-1 ${t.status === 'Done' ? 'opacity-50 line-through' : ''}">
                            <h4 class="text-sm font-bold text-slate-800">${t.title}</h4>
                            <p class="text-xs text-slate-400">تاريخ الاستحقاق: ${t.dueDate}</p>
                        </div>
                        <span class="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-600">${t.type}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        `;
    };

    // 5. SIMPLE BRANCH DASHBOARD (For Context)
    const renderBranchDashboard = () => {
        return `
        <div class="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded mb-6">
            <h3 class="font-bold text-yellow-800">لوحة تحكم الفرع</h3>
            <p class="text-sm text-yellow-700">أنت تشاهد الآن نسخة الفرع المحدودة. انتقل إلى وضع "HQ" لرؤية اللوحة المركزية.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="text-lg font-bold">إعلاناتي</h3>
                <p class="text-3xl font-bold text-brand-600 mt-2">3</p>
             </div>
             <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="text-lg font-bold">الرصيد</h3>
                <p class="text-3xl font-bold text-green-600 mt-2">${currentUser.entityId === 'BR015' ? '5,000' : '0'} ر.س</p>
             </div>
        </div>
        `;
    };

    // --- UTILS ---
    const renderPlaceholder = () => `<div class="p-10 text-center text-slate-400">صفحة قيد التطوير</div>`;

    return {
        init,
        switchUser,
        loadRoute,
        approveAd: (id) => {
            const ad = db.ads.find(a => a.id === id);
            if (ad) ad.status = 'ACTIVE';
            alert('تم اعتماد الإعلان ونشره بنجاح');
            loadRoute('ads-governance');
        },
        rejectAd: (id) => {
            db.ads = db.ads.filter(a => a.id !== id);
            loadRoute('ads-governance');
        }
    };
})();

document.addEventListener('DOMContentLoaded', app.init);
