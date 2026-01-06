/**
 * NAYOSH ERP System - Strict Multi-Tenant Architecture
 * Enforces complete data isolation between tenants (HQ, Branch, Incubator, etc.)
 */

const app = (() => {
    // --- CENTRAL DATABASE (Simulating Server-Side Data Lake) ---
    // In a real app, this data sits in separated schemas or rows with tenant_id.
    const db = {
        users: [
            { id: 1, name: 'م. أحمد العلي', role: 'HQ', entityId: 'HQ001', entityName: 'المكتب الرئيسي - الرياض', desc: 'الإدارة العليا' },
            { id: 2, name: 'سارة محمد', role: 'BRANCH', entityId: 'BR015', entityName: 'فرع العليا مول', desc: 'نقطة بيع وخدمة' },
            { id: 3, name: 'د. خالد الزهراني', role: 'INCUBATOR', entityId: 'INC03', entityName: 'حاضنة مسار السلامة', desc: 'مركز تدريب وتأهيل' },
            { id: 4, name: 'فريق التقنية', role: 'PLATFORM', entityId: 'PLT01', entityName: 'نايوش كلاود (SaaS)', desc: 'إدارة المنصات الرقمية' },
            { id: 5, name: 'أستاذة منى', role: 'OFFICE', entityId: 'OFF02', entityName: 'مكتب جدة الإقليمي', desc: 'خدمات إدارية ولوجستية' }
        ],
        
        // Financial Ledgers - STRICTLY TAGGED BY ENTITY ID
        finance: [
            // HQ Data
            { id: 'INV-HQ-001', desc: 'عوائد استثمارية', amount: 50000, type: 'credit', entityId: 'HQ001', date: '2023-11-01' },
            { id: 'EXP-HQ-001', desc: 'رواتب الإدارة العليا', amount: -20000, type: 'debit', entityId: 'HQ001', date: '2023-11-02' },
            
            // Branch Data
            { id: 'INV-2024-001', desc: 'إيرادات مبيعات التجزئة', amount: 15400, type: 'credit', entityId: 'BR015', date: '2023-11-01' },
            { id: 'EXP-BR-001', desc: 'فواتير كهرباء الفرع', amount: -1200, type: 'debit', entityId: 'BR015', date: '2023-11-05' },
            
            // Incubator Data
            { id: 'INV-2024-002', desc: 'رسوم اشتراك دورات', amount: 8500, type: 'credit', entityId: 'INC03', date: '2023-11-02' },
            
            // Platform Data
            { id: 'EXP-2024-882', desc: 'تجديد خوادم سحابية', amount: -2400, type: 'debit', entityId: 'PLT01', date: '2023-11-02' },
            
            // Office Data
            { id: 'EXP-2024-991', desc: 'نثريات ومستلزمات مكتبية', amount: -450, type: 'debit', entityId: 'OFF02', date: '2023-11-03' }
        ],

        // Platform Metrics - Tagged for PLT01 only
        system_stats: [
             { entityId: 'PLT01', uptime: 99.98, activeUsers: 14205, dbLoad: 34, tickets: 5 }
        ],

        // Tasks - Tagged by Entity
        tasks: [
            { id: 101, title: 'اعتماد مسير رواتب نوفمبر', status: 'pending', dept: 'HR', entityId: 'OFF02' },
            { id: 102, title: 'تجديد عقود الصيانة', status: 'done', dept: 'Legal', entityId: 'OFF02' },
            { id: 103, title: 'استقبال وفد الوزارة', status: 'in_progress', dept: 'Admin', entityId: 'OFF02' },
            { id: 201, title: 'مراجعة الميزانية السنوية', status: 'pending', dept: 'Finance', entityId: 'HQ001' }
        ],

        // Incubator cohorts - Tagged by Entity
        cohorts: [
            { name: 'الدفعة 14 - سلامة مهنية', students: 45, progress: 75, entityId: 'INC03' },
            { name: 'الدفعة 15 - إدارة مخاطر', students: 30, progress: 10, entityId: 'INC03' }
        ],

        // Implementation Plan Data (New Request)
        roadmap: [
            {
                phase: 'المرحلة 1: التأسيس والبنية التحتية', 
                desc: 'بناء نواة النظام وهيكل البيانات متعدد المستأجرين.',
                time: 'أسبوعين',
                status: 'completed',
                deliverables: ['تصميم قاعدة البيانات المعزولة (Schemas)', 'نظام الصلاحيات (RBAC)', 'واجهة تسجيل الدخول والداشبورد الأساسي'],
                criteria: ['نجاح عزل بيانات 3 مستأجرين مختلفين', 'زمن استجابة API أقل من 200ms', 'اجتياز اختبارات الأمان الأساسية']
            },
            {
                phase: 'المرحلة 2: الوحدات التشغيلية (MVP)', 
                desc: 'تطوير الوحدات الأساسية لكل نشاط تجاري (تجزئة، تعليم، إدارة).',
                time: '4 أسابيع',
                status: 'in_progress',
                deliverables: ['نظام نقاط البيع (POS)', 'إدارة الدورات والطلاب', 'نظام الفوترة المالية الموحد'],
                criteria: ['إتمام عملية بيع كاملة وحفظها', 'تسجيل طالب في دورة بنجاح', 'توليد تقرير مالي دقيق لكل مستأجر']
            },
            {
                phase: 'المرحلة 3: التكامل والتقارير',
                desc: 'ربط النظام مع خدمات خارجية وبناء تقارير ذكاء الأعمال.',
                time: '3 أسابيع',
                status: 'pending',
                deliverables: ['بوابة الدفع الإلكتروني', 'الربط مع الفوترة الإلكترونية (ZATCA)', 'لوحات معلومات تفاعلية (BI)'],
                criteria: ['قبول عملية دفع حقيقية', 'اعتماد الفاتورة من هيئة الزكاة (Sandbox)', 'تصدير التقارير بصيغة PDF/Excel']
            },
            {
                phase: 'المرحلة 4: الإطلاق والتحسين',
                desc: 'تحسين الأداء وإطلاق النسخة العامة للعملاء.',
                time: 'أسبوعين',
                status: 'pending',
                deliverables: ['تحسين الكاشينج (Caching)', 'تطبيق الموبايل (PWA)', 'دليل المستخدم والتوثيق'],
                criteria: ['تحمل 10,000 مستخدم متزامن', 'تقييم أداء Lighthouse > 90', 'إغلاق جميع الثغرات الأمنية الحرجة']
            }
        ]
    };

    // --- STATE ---
    let currentUser = db.users[0]; // Start as HQ

    // --- SECURE DATA ACCESS LAYER (ISOLATION LOGIC) ---
    const api = {
        getCurrentUser: () => currentUser,
        
        // STRICT FILTERING: Returns only data belonging to the current Tenant/Entity
        getFinance: () => db.finance.filter(item => item.entityId === currentUser.entityId),
        
        getTasks: () => db.tasks.filter(item => item.entityId === currentUser.entityId),
        
        getCohorts: () => db.cohorts.filter(item => item.entityId === currentUser.entityId),
        
        getStats: () => db.system_stats.find(item => item.entityId === currentUser.entityId) || null,
        
        // Even user listing should be isolated (only show users in same entity)
        getColleagues: () => db.users.filter(u => u.entityId === currentUser.entityId),

        // Public or Permission-based data
        getRoadmap: () => db.roadmap
    };

    // --- CORE ---
    const init = () => {
        renderSidebar();
        loadRoute('dashboard');
        updateHeader();
    };

    const switchUser = (roleType) => {
        const newUser = db.users.find(u => u.role === roleType);
        if (!newUser) return;
        
        currentUser = newUser;
        
        // Simulate transition
        const main = document.getElementById('main-view');
        main.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50">
            <i class="fas fa-shield-alt fa-spin text-4xl text-brand-500 mb-4"></i>
            <p class="font-bold">جاري تطبيق سياسات العزل...</p>
            <p class="text-sm text-gray-500 mt-2">تحميل بيانات المستأجر: ${currentUser.entityName}</p>
        </div>`;
        
        setTimeout(() => {
            // Re-render sidebar to update links based on new role
            renderSidebar();
            // Redirect to dashboard on switch
            loadRoute('dashboard');
            updateHeader();
        }, 600);
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = currentUser.desc;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        
        const badge = document.getElementById('entity-badge');
        badge.innerText = currentUser.entityName;
        
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
        
        // Base Navigation
        let links = `
            <li><a href="#" onclick="app.loadRoute('dashboard')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group">
                <i class="fas fa-home w-6 text-center group-hover:text-brand-400"></i> الرئيسية
            </a></li>
        `;

        // Role Based Items
        if (currentUser.role === 'HQ') {
            links += `
                <li><a href="#" onclick="app.loadRoute('finance')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-chart-pie w-6 text-center group-hover:text-purple-400"></i> التقارير المالية</a></li>
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-building w-6 text-center group-hover:text-purple-400"></i> إدارة الأصول</a></li>
                <li><a href="#" onclick="app.loadRoute('roadmap')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-map-signs w-6 text-center group-hover:text-purple-400"></i> خطة العمل</a></li>
            `;
        }

        if (currentUser.role === 'BRANCH') {
            links += `
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-cash-register w-6 text-center group-hover:text-blue-400"></i> المبيعات (POS)</a></li>
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-boxes w-6 text-center group-hover:text-blue-400"></i> المخزون</a></li>
            `;
        }

        if (currentUser.role === 'INCUBATOR') {
            links += `
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-user-graduate w-6 text-center group-hover:text-orange-400"></i> المتدربين</a></li>
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-chalkboard-teacher w-6 text-center group-hover:text-orange-400"></i> الدورات</a></li>
            `;
        }

        if (currentUser.role === 'PLATFORM') {
            links += `
                <li><a href="#" onclick="app.loadRoute('tickets')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-ticket-alt w-6 text-center group-hover:text-green-400"></i> تذاكر الدعم</a></li>
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-server w-6 text-center group-hover:text-green-400"></i> المراقبة</a></li>
                <li><a href="#" onclick="app.loadRoute('roadmap')" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-map-signs w-6 text-center group-hover:text-green-400"></i> خطة التطوير</a></li>
            `;
        }

        if (currentUser.role === 'OFFICE') {
            links += `
                <li><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition group"><i class="fas fa-users w-6 text-center group-hover:text-gray-400"></i> الموظفين</a></li>
            `;
        }

        links += `<li class="mt-8 border-t border-slate-800 pt-4"><a href="#" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"><i class="fas fa-cog w-6 text-center"></i> إعدادات المستأجر</a></li>`;
        
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
        } else if (route === 'finance') {
            content = viewFinanceReport();
        } else if (route === 'roadmap') {
            content = viewRoadmap();
        } else {
            content = `<div class="p-10 text-center text-gray-400">الصفحة غير متاحة في هذا الإصدار</div>`;
        }

        container.innerHTML = `<div class="fade-in">${content}</div>`;
    };

    // --- ISOLATED DASHBOARD VIEWS ---

    const viewDashboardHQ = () => {
        // FETCHING ONLY HQ DATA
        const finance = api.getFinance();
        const totalBalance = finance.reduce((acc, curr) => curr.type === 'credit' ? acc + curr.amount : acc - curr.amount, 0);
        const tasks = api.getTasks();

        return `
        <div class="mb-6">
            <div class="flex items-center gap-2">
                 <h2 class="text-2xl font-bold text-gray-800">لوحة إدارة المكتب الرئيسي</h2>
                 <span class="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded border border-purple-200">Tenant ID: ${currentUser.entityId}</span>
            </div>
            <p class="text-gray-500 mt-1">بيانات خاصة بالمقر الرئيسي فقط (معزولة عن الفروع)</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="stat-card bg-purple-50 border-purple-200">
                <div class="flex justify-between items-center mb-4">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><i class="fas fa-building"></i></div>
                </div>
                <div class="text-3xl font-bold text-gray-800">الرياض</div>
                <div class="text-sm text-gray-500 mt-1">مقر العمليات</div>
            </div>
            <div class="stat-card">
                <div class="flex justify-between items-center mb-4">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><i class="fas fa-wallet"></i></div>
                </div>
                <div class="text-3xl font-bold text-gray-800">${totalBalance.toLocaleString()} <span class="text-sm font-normal text-gray-400">ر.س</span></div>
                <div class="text-sm text-gray-500 mt-1">رصيد حساب المقر</div>
            </div>
            <div class="stat-card">
                <div class="flex justify-between items-center mb-4">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i class="fas fa-tasks"></i></div>
                </div>
                <div class="text-3xl font-bold text-gray-800">${tasks.length}</div>
                <div class="text-sm text-gray-500 mt-1">مهام إدارية نشطة</div>
            </div>
        </div>

        <!-- Internal HQ Tasks Only -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="font-bold text-lg mb-4">المهام الداخلية</h3>
            ${tasks.length > 0 ? `
            <ul class="space-y-3">
                ${tasks.map(t => `<li class="p-3 bg-gray-50 rounded border flex justify-between"><span>${t.title}</span><span class="text-xs bg-gray-200 px-2 py-1 rounded">${t.status}</span></li>`).join('')}
            </ul>` : '<p class="text-gray-400">لا توجد مهام مسجلة لهذا الكيان.</p>'}
        </div>
        `;
    };

    const viewDashboardBranch = () => {
        // FETCHING ONLY BRANCH DATA
        const finance = api.getFinance();
        const balance = finance.reduce((acc, curr) => curr.type === 'credit' ? acc + curr.amount : acc - curr.amount, 0);
        const recentSales = finance.filter(f => f.type === 'credit').slice(0, 3);

        return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                             <h2 class="text-xl font-bold text-gray-800"><i class="fas fa-cash-register text-blue-500 ml-2"></i>نقطة بيع الفرع</h2>
                             <p class="text-xs text-gray-400">ID: ${currentUser.entityId}</p>
                        </div>
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
                    <h3 class="font-bold mb-4">مبيعات الفرع الأخيرة</h3>
                    ${recentSales.length > 0 ? `
                    <table class="w-full text-sm">
                        <thead class="text-gray-500 border-b">
                            <tr><th class="text-right pb-2">الوصف</th><th class="text-right pb-2">المبلغ</th></tr>
                        </thead>
                        <tbody class="divide-y">
                            ${recentSales.map(s => `<tr><td class="py-3">${s.desc}</td><td class="py-3 font-bold">${s.amount} ر.س</td></tr>`).join('')}
                        </tbody>
                    </table>` : '<p class="text-gray-400">لا توجد بيانات مبيعات لعرضها.</p>'}
                </div>
            </div>

            <div class="bg-gradient-to-b from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg">
                <h3 class="font-bold text-lg mb-1">خزينة الفرع</h3>
                <p class="text-blue-200 text-sm mb-6">الرصيد الحالي</p>
                <div class="text-center mb-8">
                    <p class="text-4xl font-bold">${balance.toLocaleString()}</p>
                    <p class="text-sm opacity-70">ريال سعودي</p>
                </div>
                <div class="text-center border-t border-blue-500/50 pt-4">
                    <p class="text-xs text-blue-200">هذه البيانات خاصة بـ ${currentUser.entityName}</p>
                </div>
            </div>
        </div>
        `;
    };

    const viewDashboardPlatform = () => {
        // FETCHING ONLY PLATFORM DATA
        const stats = api.getStats();
        const finance = api.getFinance(); // Platform expenses/income only
        
        if (!stats) return '<div class="p-6">No Stats Data Available for this Tenant</div>';

        return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gray-900 text-green-400 p-6 rounded-xl shadow-sm border border-gray-800 font-mono">
                <div class="text-sm text-gray-400 mb-2">UPTIME (SLA)</div>
                <div class="text-4xl font-bold">${stats.uptime}%</div>
                <div class="h-1 w-full bg-gray-700 mt-4 rounded overflow-hidden">
                    <div class="h-full bg-green-500 w-[99%]"></div>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div class="text-sm text-gray-500 mb-2">Active Subscribers</div>
                <div class="text-3xl font-bold text-gray-800">${stats.activeUsers.toLocaleString()}</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div class="text-sm text-gray-500 mb-2">SaaS Operations Cost</div>
                <div class="text-3xl font-bold text-red-600">${finance.reduce((a,c) => c.type==='debit'?a+Math.abs(c.amount):a, 0)} <span class="text-sm text-gray-400 font-normal">SAR</span></div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 bg-gray-50 border-b flex justify-between">
                <h3 class="font-bold">Platform Health (Tenant: ${currentUser.entityId})</h3>
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Monitoring Active</span>
            </div>
            <div class="p-6">
                <div class="flex items-center gap-4 mb-4">
                    <span class="w-24 text-sm font-bold text-gray-600">Database</span>
                    <div class="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div class="bg-blue-500 h-full" style="width: ${stats.dbLoad}%"></div>
                    </div>
                    <span class="text-xs text-gray-500">${stats.dbLoad}% Load</span>
                </div>
            </div>
        </div>
        `;
    };

    const viewDashboardOffice = () => {
        const tasks = api.getTasks();
        const myFinance = api.getFinance();
        
        return `
        <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-1 space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-gray-500">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">المهام الإدارية (مكتب جدة)</h2>
                    <ul class="space-y-3">
                        ${tasks.map(task => `
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
                    <button class="mt-4 w-full py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700">+ إضافة مهمة</button>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm">
                     <h3 class="font-bold mb-2">المصاريف المكتبية</h3>
                     <p class="text-2xl font-bold text-gray-700">${myFinance.reduce((a,c)=>c.type==='debit'?a+Math.abs(c.amount):a, 0)} <span class="text-sm text-gray-400">ر.س</span></p>
                </div>
            </div>

            <div class="w-full md:w-80 space-y-6">
                <div class="bg-white p-6 rounded-xl shadow-sm">
                    <h3 class="font-bold mb-4 text-gray-800">الحضور (فريق جدة)</h3>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-gray-500">اليوم</span>
                        <span class="font-bold text-green-600">100%</span>
                    </div>
                    <div class="w-full bg-gray-100 h-2 rounded-full mb-4">
                        <div class="bg-green-500 h-2 rounded-full w-full"></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    };

    const viewDashboardIncubator = () => {
        const cohorts = api.getCohorts();
        const finance = api.getFinance();
        
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div class="bg-orange-500 text-white p-6 rounded-xl shadow-lg">
                <div class="text-orange-100 text-sm mb-1">الدفعات النشطة</div>
                <div class="text-3xl font-bold">${cohorts.length}</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div class="text-gray-500 text-sm mb-1">إجمالي المتدربين (الحاضنة)</div>
                <div class="text-3xl font-bold text-gray-800">${cohorts.reduce((a,c)=>a+c.students,0)}</div>
            </div>
             <div class="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <div class="text-gray-500 text-sm mb-1">الإيرادات التدريبية</div>
                <div class="text-3xl font-bold text-gray-800">${finance.reduce((a,c)=>c.type==='credit'?a+c.amount:a,0)} <span class="text-sm font-normal text-gray-400">ر.س</span></div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="font-bold text-lg mb-6">تقدم الدفعات الدراسية (الخاصة بهذا الكيان)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${cohorts.map(c => `
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

    const viewFinanceReport = () => {
        const finance = api.getFinance();
        return `
        <div class="bg-white p-6 rounded-xl shadow-sm">
            <h2 class="text-xl font-bold mb-4">التقرير المالي - ${currentUser.entityName}</h2>
            <table class="data-table w-full text-right">
                <thead>
                    <tr>
                        <th class="p-3 bg-gray-50">رقم المرجع</th>
                        <th class="p-3 bg-gray-50">البند</th>
                        <th class="p-3 bg-gray-50">التاريخ</th>
                        <th class="p-3 bg-gray-50">المبلغ</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    ${finance.map(f => `
                    <tr>
                        <td class="p-3 font-mono text-xs text-gray-500">${f.id}</td>
                        <td class="p-3">${f.desc}</td>
                        <td class="p-3 text-sm text-gray-500">${f.date}</td>
                        <td class="p-3 font-bold ${f.type === 'credit' ? 'text-green-600' : 'text-red-600'}">
                            ${f.type === 'credit' ? '+' : ''}${f.amount}
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `;
    }

    const viewRoadmap = () => {
        const plan = api.getRoadmap();
        
        const statusColors = {
            'completed': 'bg-green-100 text-green-700 border-green-200',
            'in_progress': 'bg-blue-100 text-blue-700 border-blue-200',
            'pending': 'bg-gray-100 text-gray-500 border-gray-200'
        };

        const statusLabels = {
            'completed': 'مكتملة',
            'in_progress': 'قيد التنفيذ',
            'pending': 'مجدولة'
        };

        return `
        <div class="bg-white p-6 rounded-xl shadow-sm mb-6">
            <div class="flex justify-between items-start">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">خطة تنفيذ المشروع</h2>
                    <p class="text-gray-500">خارطة طريق تطوير نظام نايوش ERP ومراحله الزمنية</p>
                </div>
                <button class="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 transition">
                    <i class="fas fa-download ml-2"></i> تصدير الخطة
                </button>
            </div>
        </div>

        <div class="relative space-y-8 px-4">
            <!-- Vertical Line -->
            <div class="absolute right-8 top-0 bottom-0 w-1 bg-gray-200 hidden md:block rounded-full"></div>

            ${plan.map((phase, index) => `
            <div class="relative flex flex-col md:flex-row gap-6 items-start">
                <!-- Dot -->
                <div class="hidden md:flex absolute right-6 w-5 h-5 rounded-full border-4 border-white ${phase.status === 'completed' ? 'bg-green-500' : (phase.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300')} z-10"></div>

                <div class="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
                    <div class="flex flex-wrap justify-between items-start mb-4 gap-4">
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">${phase.phase}</h3>
                            <p class="text-sm text-gray-500 mt-1"><i class="far fa-clock ml-1"></i> المدة التقديرية: ${phase.time}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusColors[phase.status]}">
                            ${statusLabels[phase.status]}
                        </span>
                    </div>
                    
                    <p class="text-gray-700 mb-6">${phase.desc}</p>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-slate-50 p-4 rounded-lg">
                            <h4 class="font-bold text-sm text-slate-700 mb-3 border-b border-slate-200 pb-2"><i class="fas fa-box-open ml-2 text-brand-500"></i> المخرجات (Deliverables)</h4>
                            <ul class="space-y-2">
                                ${phase.deliverables.map(d => `<li class="text-sm text-slate-600 flex items-center gap-2"><i class="fas fa-check-circle text-xs text-brand-300"></i> ${d}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="bg-slate-50 p-4 rounded-lg">
                            <h4 class="font-bold text-sm text-slate-700 mb-3 border-b border-slate-200 pb-2"><i class="fas fa-clipboard-check ml-2 text-green-500"></i> معايير القبول (Criteria)</h4>
                            <ul class="space-y-2">
                                ${phase.criteria.map(c => `<li class="text-sm text-slate-600 flex items-center gap-2"><i class="fas fa-shield-alt text-xs text-green-300"></i> ${c}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>
        `;
    }

    // --- EXPOSE ---
    return {
        init,
        loadRoute,
        switchUser
    };
})();

// Start App
document.addEventListener('DOMContentLoaded', app.init);