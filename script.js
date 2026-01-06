/**
 * NAYOSH ERP System - Integrated Multi-Entity Architecture
 * Handles HQ, Branches, Incubators, Platforms, and Administrative Offices in a single unified core.
 */

const app = (() => {
    // --- MOCK DATABASE (Centralized Data Lake) ---
    const db = {
        users: [
            { id: 1, name: 'م. أحمد العلي', role: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي - الرياض', desc: 'الإدارة العليا' },
            { id: 2, name: 'سارة محمد', role: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول', desc: 'نقطة بيع وخدمة' },
            { id: 3, name: 'د. خالد الزهراني', role: 'INCUBATOR', entityId: 'INC03', entityName: 'حاضنة مسار السلامة', desc: 'مركز تدريب وتأهيل' },
            { id: 4, name: 'فريق التقنية', role: 'PLATFORM', entityId: 'PLT01', entityName: 'نايوش كلاود (SaaS)', desc: 'إدارة المنصات الرقمية' },
            { id: 5, name: 'أستاذة منى', role: 'OFFICE', entityId: 'OFF02', entityName: 'مكتب جدة الإقليمي', desc: 'خدمات إدارية ولوجستية' }
        ],
        
        // Financial Ledgers tagged by Entity ID
        finance: [
            { id: 'INV-2024-001', desc: 'إيرادات مبيعات التجزئة', amount: 15400, type: 'credit', entityId: 'BR015', date: '2023-11-01' },
            { id: 'INV-2024-002', desc: 'رسوم اشتراك دورات', amount: 8500, type: 'credit', entityId: 'INC03', date: '2023-11-02' },
            { id: 'EXP-2024-882', desc: 'تجديد خوادم سحابية', amount: -2400, type: 'debit', entityId: 'PLT01', date: '2023-11-02' },
            { id: 'EXP-2024-991', desc: 'نثريات ومستلزمات مكتبية', amount: -450, type: 'debit', entityId: 'OFF02', date: '2023-11-03' }
        ],

        // Platform Metrics
        platform_metrics: {
            uptime: 99.98,
            activeUsers: 14205,
            dbLoad: 34,
            tickets: [
                { id: 401, subject: 'مشكلة في بوابة الدفع', priority: 'high', status: 'open' },
                { id: 402, subject: 'تحديث واجهة API', priority: 'low', status: 'pending' }
            ]
        },

        // Office Tasks
        office_tasks: [
            { id: 101, title: 'اعتماد مسير رواتب نوفمبر', status: 'pending', dept: 'HR' },
            { id: 102, title: 'تجديد عقود الصيانة', status: 'done', dept: 'Legal' },
            { id: 103, title: 'استقبال وفد الوزارة', status: 'in_progress', dept: 'Admin' }
        ],

        // Incubator cohorts
        incubator_cohorts: [
            { name: 'الدفعة 14 - سلامة مهنية', students: 45, progress: 75 },
            { name: 'الدفعة 15 - إدارة مخاطر', students: 30, progress: 10 }
        ]
    };

    // --- STATE ---
    let currentUser = db.users[0]; // Start as HQ

    // --- CORE ---
    const init = () => {
        renderSidebar();
        loadRoute('dashboard');
        updateHeader();
    };

    const switchUser = (roleType) => {
        currentUser = db.users.find(u => u.role === roleType) || db.users[0];
        // Simulate transition
        const main = document.getElementById('main-view');
        main.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50">
            <i class="fas fa-sync fa-spin text-4xl text-brand-500 mb-4"></i>
            <p>جاري تحميل سياق النظام: ${currentUser.entityName}</p>
        </div>`;
        
        setTimeout(() => {
            init();
            // Optional toast or notification here
        }, 600);
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = currentUser.desc;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        
        const badge = document.getElementById('entity-badge');
        badge.innerText = currentUser.entityName;
        
        // Dynamic coloring based on Entity Type
        const colors = {
            'HQ': 'bg-purple-100 text-purple-700 border-purple-200',
            'BRANCH': 'bg-blue-100 text-blue-700 border-blue-200',
            'INCUBATOR': 'bg-orange-100 text-orange-700 border-orange-200',
            'PLATFORM': 'bg-green-100 text-green-700 border-green-200',
            'OFFICE': 'bg-gray-100 text-gray-700 border-gray-200'
        };
        badge.className = `hidden md:inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${colors[currentUser.role] || colors['HQ']}`;
    };

    // --- NAVIGATION LOGIC ---
    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        
        // 1. Common items for everyone
        let links = `
            <li><a href="#" onclick="app.loadRoute('dashboard')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-home w-6 text-center group-hover:text-brand-400"></i> الرئيسية
            </a></li>
        `;

        // 2. Role Based Items
        if (currentUser.role === 'HQ') {
            links += `
                <li><a href="#" onclick="app.loadRoute('all-entities')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-sitemap w-6 text-center group-hover:text-purple-400"></i> إدارة الكيانات</a></li>
                <li><a href="#" onclick="app.loadRoute('finance')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-chart-line w-6 text-center group-hover:text-green-400"></i> المالية الموحدة</a></li>
            `;
        }

        if (currentUser.role === 'BRANCH') {
            links += `
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-cash-register w-6 text-center group-hover:text-blue-400"></i> نقطة البيع (POS)</a></li>
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-boxes w-6 text-center group-hover:text-blue-400"></i> المخزون الفرعي</a></li>
            `;
        }

        if (currentUser.role === 'INCUBATOR') {
            links += `
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-user-graduate w-6 text-center group-hover:text-orange-400"></i> المتدربين</a></li>
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-certificate w-6 text-center group-hover:text-orange-400"></i> الشهادات</a></li>
            `;
        }

        if (currentUser.role === 'PLATFORM') {
            links += `
                <li><a href="#" onclick="app.loadRoute('tickets')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-ticket-alt w-6 text-center group-hover:text-green-400"></i> تذاكر الدعم</a></li>
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-server w-6 text-center group-hover:text-green-400"></i> حالة الخوادم</a></li>
            `;
        }

        if (currentUser.role === 'OFFICE') {
            links += `
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-users w-6 text-center group-hover:text-gray-400"></i> شؤون الموظفين</a></li>
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-file-signature w-6 text-center group-hover:text-gray-400"></i> الصادر والوارد</a></li>
            `;
        }

        links += `<li class="mt-8 border-t border-slate-800 pt-4"><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"><i class="fas fa-cog w-6 text-center"></i> الإعدادات</a></li>`;
        
        menu.innerHTML = links;
    };

    const loadRoute = (route) => {
        const container = document.getElementById('main-view');
        let content = '';

        // Routing Logic
        if (route === 'dashboard') {
            if (currentUser.role === 'HQ') content = viewDashboardHQ();
            else if (currentUser.role === 'PLATFORM') content = viewDashboardPlatform();
            else if (currentUser.role === 'INCUBATOR') content = viewDashboardIncubator();
            else if (currentUser.role === 'OFFICE') content = viewDashboardOffice();
            else content = viewDashboardBranch();
        } else if (route === 'all-entities') {
            content = viewAllEntities();
        } else {
            content = `<div class="p-10 text-center text-gray-400">جاري العمل على بناء هذه الصفحة...</div>`;
        }

        container.innerHTML = `<div class="fade-in">${content}</div>`;
    };

    // --- ENTITY-SPECIFIC DASHBOARDS ---

    const viewDashboardHQ = () => {
        const totalBalance = db.finance.reduce((acc, curr) => curr.type === 'credit' ? acc + curr.amount : acc - curr.amount, 0);
        return `
        <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">نظرة عامة على المنظومة</h2>
            <p class="text-gray-500">لوحة القيادة المركزية للمكتب الرئيسي</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="stat-card bg-purple-50 border-purple-200">
                <div class="flex justify-between items-center mb-4">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><i class="fas fa-network-wired"></i></div>
                    <span class="text-xs font-bold bg-white px-2 py-1 rounded text-purple-600">نشط</span>
                </div>
                <div class="text-3xl font-bold text-gray-800">5</div>
                <div class="text-sm text-gray-500 mt-1">كيانات مرتبطة</div>
            </div>
            <div class="stat-card">
                <div class="flex justify-between items-center mb-4">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i class="fas fa-wallet"></i></div>
                </div>
                <div class="text-3xl font-bold text-gray-800">${totalBalance.toLocaleString()} <span class="text-sm font-normal text-gray-400">ر.س</span></div>
                <div class="text-sm text-gray-500 mt-1">السيولة النقدية المجمعة</div>
            </div>
             <div class="stat-card">
                <div class="flex justify-between items-center mb-4">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i class="fas fa-users"></i></div>
                </div>
                <div class="text-3xl font-bold text-gray-800">150+</div>
                <div class="text-sm text-gray-500 mt-1">إجمالي الموظفين</div>
            </div>
            <div class="stat-card">
                <div class="flex justify-between items-center mb-4">
                    <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><i class="fas fa-exclamation-triangle"></i></div>
                </div>
                <div class="text-3xl font-bold text-gray-800">2</div>
                <div class="text-sm text-gray-500 mt-1">تنبيهات حرجة</div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="font-bold text-lg mb-4">خريطة الأداء اللحظي</h3>
            <div class="space-y-4">
                ${db.users.filter(u=>u.role!=='HQ').map(u => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div class="flex items-center gap-4">
                        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <div>
                            <div class="font-bold text-sm">${u.entityName}</div>
                            <div class="text-xs text-gray-500">${u.role} - ID: ${u.entityId}</div>
                        </div>
                    </div>
                    <div class="text-sm font-semibold text-gray-600">نشط منذ 8:00 ص</div>
                </div>`).join('')}
            </div>
        </div>
        `;
    };

    const viewDashboardBranch = () => {
        return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left: POS Simulation -->
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold text-gray-800"><i class="fas fa-cash-register text-blue-500 ml-2"></i>نقطة البيع السريع</h2>
                        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">جلسة جديدة</button>
                    </div>
                    <div class="grid grid-cols-3 gap-4">
                        <button class="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center">
                            <i class="fas fa-tshirt text-2xl text-gray-400 mb-2"></i>
                            <div class="text-sm font-bold">منتجات</div>
                        </button>
                         <button class="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center">
                            <i class="fas fa-box-open text-2xl text-gray-400 mb-2"></i>
                            <div class="text-sm font-bold">مرتجعات</div>
                        </button>
                         <button class="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center">
                            <i class="fas fa-qrcode text-2xl text-gray-400 mb-2"></i>
                            <div class="text-sm font-bold">مسح كود</div>
                        </button>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm">
                    <h3 class="font-bold mb-4">آخر المبيعات</h3>
                    <table class="w-full text-sm">
                        <thead class="text-gray-500 border-b">
                            <tr><th class="text-right pb-2">رقم الفاتورة</th><th class="text-right pb-2">المبلغ</th><th class="text-right pb-2">الحالة</th></tr>
                        </thead>
                        <tbody class="divide-y">
                            <tr><td class="py-3">#8821</td><td class="py-3 font-bold">450 ر.س</td><td class="py-3 text-green-600">مكتملة</td></tr>
                            <tr><td class="py-3">#8822</td><td class="py-3 font-bold">120 ر.س</td><td class="py-3 text-green-600">مكتملة</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Right: Targets -->
            <div class="bg-gradient-to-b from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg">
                <h3 class="font-bold text-lg mb-1">هدف الفرع الشهري</h3>
                <p class="text-blue-200 text-sm mb-6">نوفمبر 2023</p>
                
                <div class="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center border-8 border-blue-400/30 rounded-full">
                    <div class="text-center">
                        <span class="text-2xl font-bold">65%</span>
                        <p class="text-xs text-blue-200">متحقق</p>
                    </div>
                </div>
                
                <div class="text-center">
                    <p class="text-sm opacity-70">المتبقي لتحقيق الهدف</p>
                    <p class="text-xl font-bold">12,400 ر.س</p>
                </div>
            </div>
        </div>
        `;
    };

    const viewDashboardPlatform = () => {
        const m = db.platform_metrics;
        return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gray-900 text-green-400 p-6 rounded-xl shadow-sm border border-gray-800 font-mono">
                <div class="text-sm text-gray-400 mb-2">UPTIME (SLA)</div>
                <div class="text-4xl font-bold">${m.uptime}%</div>
                <div class="h-1 w-full bg-gray-700 mt-4 rounded overflow-hidden">
                    <div class="h-full bg-green-500 w-[99%]"></div>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div class="text-sm text-gray-500 mb-2">Active Subscribers</div>
                <div class="text-3xl font-bold text-gray-800">${m.activeUsers.toLocaleString()}</div>
                <div class="text-xs text-green-600 mt-1"><i class="fas fa-arrow-up"></i> +12% this week</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div class="text-sm text-gray-500 mb-2">Open Support Tickets</div>
                <div class="text-3xl font-bold text-gray-800">${m.tickets.filter(t=>t.status==='open').length}</div>
                <button class="text-xs text-brand-600 mt-2 hover:underline">View Queue</button>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 bg-gray-50 border-b flex justify-between">
                <h3 class="font-bold">System Health & Logs</h3>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">All Systems Operational</span>
            </div>
            <div class="p-6">
                <div class="flex items-center gap-4 mb-4">
                    <span class="w-24 text-sm font-bold text-gray-600">Database</span>
                    <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div class="bg-blue-500 h-full" style="width: ${m.dbLoad}%"></div>
                    </div>
                    <span class="text-xs text-gray-500">${m.dbLoad}% Load</span>
                </div>
                <div class="flex items-center gap-4">
                    <span class="w-24 text-sm font-bold text-gray-600">Storage</span>
                    <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div class="bg-purple-500 h-full" style="width: 45%"></div>
                    </div>
                    <span class="text-xs text-gray-500">45% Used</span>
                </div>
            </div>
        </div>
        `;
    };

    const viewDashboardOffice = () => {
        return `
        <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-1 space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-gray-500">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">المهام الإدارية</h2>
                    <ul class="space-y-3">
                        ${db.office_tasks.map(task => `
                        <li class="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                            <div class="flex items-center gap-3">
                                <div class="w-5 h-5 rounded border flex items-center justify-center ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}">
                                    ${task.status === 'done' ? '<i class="fas fa-check text-xs"></i>' : ''}
                                </div>
                                <span class="${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}">${task.title}</span>
                            </div>
                            <span class="text-xs bg-white px-2 py-1 border rounded">${task.dept}</span>
                        </li>
                        `).join('')}
                    </ul>
                    <button class="mt-4 w-full py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700">+ إضافة مهمة جديدة</button>
                </div>
            </div>

            <div class="w-full md:w-80 space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-sm">
                    <h3 class="font-bold mb-4 text-gray-800">الحضور والانصراف</h3>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-500">حضور اليوم</span>
                        <span class="font-bold text-green-600">94%</span>
                    </div>
                    <div class="w-full bg-gray-100 h-2 rounded-full mb-4">
                        <div class="bg-green-500 h-2 rounded-full w-[94%]"></div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <img src="https://ui-avatars.com/api/?name=Ali&background=random" class="w-6 h-6 rounded-full">
                            <span>علي (إجازة سنوية)</span>
                        </div>
                         <div class="flex items-center gap-2 text-sm text-gray-600">
                            <img src="https://ui-avatars.com/api/?name=Maha&background=random" class="w-6 h-6 rounded-full">
                            <span>مها (مهمة عمل)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    };

    const viewDashboardIncubator = () => {
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-orange-500 text-white p-6 rounded-xl shadow-lg">
                <div class="text-orange-100 text-sm mb-1">الدفعات النشطة</div>
                <div class="text-3xl font-bold">3</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div class="text-gray-500 text-sm mb-1">إجمالي المتدربين</div>
                <div class="text-3xl font-bold text-gray-800">75</div>
            </div>
             <div class="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div class="text-gray-500 text-sm mb-1">الشهادات المصدرة</div>
                <div class="text-3xl font-bold text-gray-800">1,204</div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="font-bold text-lg mb-6">تقدم الدفعات الدراسية</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${db.incubator_cohorts.map(c => `
                <div class="border rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="font-bold text-gray-700">${c.name}</h4>
                        <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">${c.students} طالب</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex-1 bg-gray-100 h-2 rounded-full">
                            <div class="bg-orange-500 h-2 rounded-full" style="width: ${c.progress}%"></div>
                        </div>
                        <span class="text-xs font-bold text-gray-600">${c.progress}%</span>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        `;
    }

    const viewAllEntities = () => {
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${db.users.map(u => `
            <div class="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border-t-4 ${u.role === 'HQ' ? 'border-purple-500' : u.role === 'BRANCH' ? 'border-blue-500' : u.role === 'PLATFORM' ? 'border-green-500' : 'border-gray-500'}">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-gray-800">${u.entityName}</h3>
                        <p class="text-sm text-gray-500">${u.entityId}</p>
                    </div>
                    <span class="text-xs px-2 py-1 rounded bg-gray-100">${u.role}</span>
                </div>
                <p class="mt-4 text-sm text-gray-600">${u.desc}</p>
                <div class="mt-6 flex gap-2">
                    <button class="flex-1 py-2 text-sm border rounded hover:bg-gray-50">الإعدادات</button>
                    <button class="flex-1 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700">دخول</button>
                </div>
            </div>
            `).join('')}
        </div>
        `;
    };

    // --- EXPOSE ---
    return {
        init,
        loadRoute,
        switchUser
    };
})();

// Start App
document.addEventListener('DOMContentLoaded', app.init);