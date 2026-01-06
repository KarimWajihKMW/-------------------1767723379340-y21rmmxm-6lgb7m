/**
 * NAYOSH ERP System - Simulated Backend & Frontend Logic
 * Handles Multi-tenancy, Role-Based Access, and Modules (Ads, Finance, Incubator)
 */

const app = (() => {
    // --- MOCK DATABASE ---
    const db = {
        users: [
            { id: 1, name: 'أحمد المدير', role: 'HQ', entityId: 'HQ01', entityName: 'المكتب الرئيسي' },
            { id: 2, name: 'سارة مسؤولة الفرع', role: 'BRANCH', entityId: 'BR01', entityName: 'فرع الرياض' },
            { id: 3, name: 'خالد المشرف', role: 'INCUBATOR', entityId: 'INC01', entityName: 'حاضنة السلامة' }
        ],
        ads: [
            { id: 101, title: 'حملة الصيف', type: 'local', status: 'active', entityId: 'BR01', budget: 5000, views: 1200 },
            { id: 102, title: 'إعلان توظيف مركزي', type: 'network', status: 'pending_approval', entityId: 'HQ01', budget: 20000, views: 0 },
            { id: 103, title: 'ورشة السلامة المهنية', type: 'local', status: 'active', entityId: 'INC01', budget: 1500, views: 450 }
        ],
        finance: [
            { id: 'TRX-998', desc: 'اشتراك شهري - باقة ذهبية', amount: 5000, type: 'credit', status: 'verified', date: '2023-10-25', entityId: 'BR01', immutable: true },
            { id: 'TRX-999', desc: 'صيانة خوادم', amount: -1200, type: 'debit', status: 'pending', date: '2023-10-26', entityId: 'HQ01', immutable: true }
        ],
        incubator_requests: [
            { id: 501, name: 'شركة البناء الحديث', stage: 'training', progress: 40, entityId: 'INC01', nextMeeting: 'Zoom - 10:00 AM' },
            { id: 502, name: 'مؤسسة الأفق', stage: 'registration', progress: 10, entityId: 'INC01', nextMeeting: null },
            { id: 503, name: 'مصنع الصلب', stage: 'certification', progress: 90, entityId: 'INC01', nextMeeting: 'SMRTTX - 2:00 PM' }
        ]
    };

    // --- STATE ---
    let currentUser = db.users[0]; // Default to HQ Admin

    // --- CORE FUNCTIONS ---

    const init = () => {
        renderSidebar();
        loadRoute('dashboard');
        updateHeader();
    };

    const switchUser = (roleType) => {
        currentUser = db.users.find(u => u.role === roleType) || db.users[0];
        // Simulate page reload/context switch
        document.getElementById('main-view').innerHTML = '<div class="flex items-center justify-center h-full text-brand-600"><i class="fas fa-circle-notch fa-spin text-4xl"></i></div>';
        setTimeout(() => {
            init();
            alert(`تم تسجيل الدخول بصلاحية: ${currentUser.entityName} (بيانات معزولة)`);
        }, 500);
    };

    const updateHeader = () => {
        document.getElementById('user-name').innerText = currentUser.name;
        document.getElementById('user-role').innerText = currentUser.entityName;
        document.getElementById('user-initials').innerText = currentUser.name.charAt(0);
        const badge = document.getElementById('entity-badge');
        badge.innerText = currentUser.role === 'HQ' ? 'إدارة عليا' : currentUser.role === 'BRANCH' ? 'فرع' : 'حاضنة';
        badge.className = `px-3 py-1 rounded-full text-xs font-bold border ${currentUser.role === 'HQ' ? 'bg-purple-100 text-purple-700 border-purple-200' : currentUser.role === 'BRANCH' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`;
    };

    // --- NAVIGATION ---

    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        const commonLinks = `
            <li><a href="#" onclick="app.loadRoute('dashboard')" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"><i class="fas fa-home w-6"></i> الرئيسية</a></li>
            <li><a href="#" onclick="app.loadRoute('ads')" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"><i class="fas fa-bullhorn w-6"></i> الإعلانات والنشر</a></li>
            <li><a href="#" onclick="app.loadRoute('finance')" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"><i class="fas fa-file-invoice-dollar w-6"></i> الفوترة والمالية</a></li>
        `;

        let roleSpecificLinks = '';
        if (currentUser.role === 'INCUBATOR' || currentUser.role === 'HQ') {
            roleSpecificLinks += `<li><a href="#" onclick="app.loadRoute('incubator')" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"><i class="fas fa-hard-hat w-6"></i> حاضنة السلامة</a></li>`;
        }

        menu.innerHTML = commonLinks + roleSpecificLinks + `<li><a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition mt-8"><i class="fas fa-cog w-6"></i> الإعدادات</a></li>`;
    };

    const loadRoute = (route) => {
        const container = document.getElementById('main-view');
        let content = '';
        
        // Update Title
        const titles = { dashboard: 'لوحة المعلومات', ads: 'نظام الإعلانات المركزي', finance: 'المالية والتدقيق', incubator: 'مسار حاضنة السلامة' };
        document.getElementById('page-title').innerText = titles[route] || 'نايوش';

        switch(route) {
            case 'dashboard': content = viewDashboard(); break;
            case 'ads': content = viewAds(); break;
            case 'finance': content = viewFinance(); break;
            case 'incubator': content = viewIncubator(); break;
            default: content = viewDashboard();
        }
        
        container.innerHTML = `<div class="fade-in">${content}</div>`;
    };

    // --- VIEWS GENERATION (WITH MULTI-TENANCY FILTERS) ---

    const viewDashboard = () => {
        // Filter data based on entity (HQ sees all, others see only theirs)
        const myAds = db.ads.filter(i => currentUser.role === 'HQ' || i.entityId === currentUser.entityId);
        const myFinance = db.finance.filter(i => currentUser.role === 'HQ' || i.entityId === currentUser.entityId);
        
        return `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-brand-500">
                <div class="text-gray-500 text-sm mb-1">إجمالي العمليات</div>
                <div class="text-2xl font-bold">${myFinance.length}</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-green-500">
                <div class="text-gray-500 text-sm mb-1">الإيرادات (الشهر)</div>
                <div class="text-2xl font-bold">${myFinance.filter(f=>f.type==='credit').reduce((a,b)=>a+b.amount,0).toLocaleString()} ر.س</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-orange-500">
                <div class="text-gray-500 text-sm mb-1">الحملات النشطة</div>
                <div class="text-2xl font-bold">${myAds.filter(a=>a.status==='active').length}</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border-r-4 border-purple-500">
                <div class="text-gray-500 text-sm mb-1">المهام المعلقة</div>
                <div class="text-2xl font-bold">5</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold mb-4 border-b pb-2">آخر النشاطات (SMRTTX Log)</h3>
                <ul class="space-y-3">
                    <li class="flex items-center gap-3 text-sm">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>تم تسجيل دخول جديد من ${currentUser.name}</span>
                        <span class="text-gray-400 mr-auto text-xs">الآن</span>
                    </li>
                    <li class="flex items-center gap-3 text-sm">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>تحديث سجلات الفوترة الآلي</span>
                        <span class="text-gray-400 mr-auto text-xs">منذ 2 ساعة</span>
                    </li>
                </ul>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm">
                <h3 class="font-bold mb-4 border-b pb-2">اختصارات سريعة</h3>
                <div class="grid grid-cols-2 gap-4">
                    <button onclick="app.loadRoute('ads')" class="p-4 bg-gray-50 rounded-lg text-center hover:bg-brand-50 hover:text-brand-600 transition">
                        <i class="fas fa-plus-circle text-2xl mb-2"></i>
                        <div class="text-sm font-medium">حملة إعلانية جديدة</div>
                    </button>
                    <button class="p-4 bg-gray-50 rounded-lg text-center hover:bg-green-50 hover:text-green-600 transition">
                        <i class="fas fa-file-invoice text-2xl mb-2"></i>
                        <div class="text-sm font-medium">إصدار فاتورة</div>
                    </button>
                </div>
            </div>
        </div>
        `;
    };

    const viewAds = () => {
        const myAds = db.ads.filter(i => currentUser.role === 'HQ' || i.entityId === currentUser.entityId);
        
        let rows = myAds.map(ad => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">${ad.title}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${ad.type==='network'?'bg-purple-100 text-purple-700':'bg-gray-100 text-gray-700'}">${ad.type === 'network' ? 'شبكة الفروع' : 'محلي'}</span></td>
                <td class="px-6 py-4">${ad.budget} ر.س</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${ad.status==='active'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}">
                        ${ad.status === 'active' ? 'نشط' : 'بانتظار الموافقة'}
                    </span>
                </td>
                <td class="px-6 py-4 text-left">
                    <button class="text-gray-400 hover:text-brand-600"><i class="fas fa-chart-bar"></i></button>
                    <button class="text-gray-400 hover:text-red-600 mr-2"><i class="fas fa-stop-circle"></i></button>
                </td>
            </tr>
        `).join('');

        return `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-lg font-bold">إدارة الحملات والنشر</h3>
                    <p class="text-sm text-gray-500">نظام متعدد الطبقات (محلي / شبكي)</p>
                </div>
                <button class="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-500/30 flex items-center gap-2">
                    <i class="fas fa-plus"></i> نشر إعلان جديد
                </button>
            </div>

            <div class="bg-white rounded-xl shadow overflow-hidden">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>عنوان الحملة</th>
                            <th>النطاق</th>
                            <th>الميزانية</th>
                            <th>الحالة</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>${rows.length ? rows : '<tr><td colspan="5" class="text-center py-8 text-gray-400">لا توجد بيانات للعرض</td></tr>'}</tbody>
                </table>
            </div>
            
            ${currentUser.role === 'HQ' ? `
            <div class="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 class="font-bold text-yellow-800 mb-2"><i class="fas fa-shield-alt"></i> منطقة موافقات الإدارة العليا</h4>
                <p class="text-sm text-yellow-700">يوجد 3 طلبات نشر عبر الشبكة من الفروع تحتاج إلى تدقيق وتسعير.</p>
            </div>` : ''}
        `;
    };

    const viewFinance = () => {
        const data = db.finance.filter(i => currentUser.role === 'HQ' || i.entityId === currentUser.entityId);
        
        const rows = data.map(trx => `
             <tr>
                <td class="px-6 py-4 font-mono text-xs text-gray-500">${trx.id}</td>
                <td class="px-6 py-4">${trx.desc}</td>
                <td class="px-6 py-4 ${trx.type === 'credit' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}" dir="ltr">${trx.amount > 0 ? '+' : ''}${trx.amount}</td>
                <td class="px-6 py-4">${trx.date}</td>
                <td class="px-6 py-4">
                    <span class="flex items-center gap-1 text-xs text-gray-500">
                        <i class="fas fa-lock text-gray-400"></i> سجل غير قابل للحذف
                    </span>
                </td>
             </tr>
        `).join('');

        return `
             <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 rounded-xl">
                    <div class="text-gray-400 text-sm">الرصيد المحفظي</div>
                    <div class="text-3xl font-bold mt-2">32,450.00 <span class="text-sm font-normal">ر.س</span></div>
                </div>
                 <div class="bg-white border border-gray-200 p-6 rounded-xl">
                    <div class="text-gray-500 text-sm">مستحقات معلقة</div>
                    <div class="text-2xl font-bold mt-2 text-orange-500">4,200.00 <span class="text-sm font-normal text-gray-400">ر.س</span></div>
                </div>
             </div>

             <div class="bg-white rounded-xl shadow overflow-hidden">
                <div class="p-4 border-b flex justify-between items-center">
                    <h3 class="font-bold">سجل الحركات المالية (Audit Log)</h3>
                    <button class="text-sm text-brand-600 hover:underline">تصدير تقرير ضريبي</button>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>رقم المرجع</th>
                            <th>البيان</th>
                            <th>المبلغ</th>
                            <th>التاريخ</th>
                            <th>حالة القيد</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
             </div>
        `;
    };

    const viewIncubator = () => {
        if (currentUser.role === 'BRANCH') return `<div class="p-12 text-center text-gray-400 bg-white rounded-xl">عذراً، هذه الوحدة مخصصة لكيانات الحاضنة والإدارة فقط.</div>`;
        
        const requests = db.incubator_requests.filter(i => currentUser.role === 'HQ' || i.entityId === currentUser.entityId);
        
        const cards = requests.map(req => `
            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition mb-4">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-bold text-gray-800">${req.name}</h4>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">#${req.id}</span>
                </div>
                
                <div class="mb-4">
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                        <span>المرحلة: ${translateStage(req.stage)}</span>
                        <span>${req.progress}%</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2">
                        <div class="bg-orange-500 h-2 rounded-full" style="width: ${req.progress}%"></div>
                    </div>
                </div>

                ${req.nextMeeting ? `
                <div class="flex items-center gap-2 bg-blue-50 text-blue-700 p-2 rounded text-xs mb-3">
                    <i class="fas fa-video"></i>
                    <span>${req.nextMeeting}</span>
                </div>
                ` : ''}

                <div class="flex gap-2 mt-2">
                    <button class="flex-1 bg-gray-800 text-white text-xs py-2 rounded hover:bg-gray-700">إدارة</button>
                    <button class="flex-1 bg-white border border-gray-300 text-gray-700 text-xs py-2 rounded hover:bg-gray-50">التقييم</button>
                </div>
            </div>
        `).join('');

        return `
            <div class="flex flex-col md:flex-row gap-6 h-[calc(100vh-180px)]">
                <!-- Kanban Column -->
                <div class="w-full md:w-1/3 bg-gray-100 p-4 rounded-xl flex flex-col">
                    <h3 class="font-bold text-gray-700 mb-4 flex items-center justify-between">
                        <span>طلبات نشطة</span>
                        <span class="bg-white text-xs px-2 py-1 rounded-full shadow-sm">${requests.length}</span>
                    </h3>
                    <div class="overflow-y-auto flex-1">
                        ${cards}
                    </div>
                    <button class="w-full mt-3 py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-brand-500 hover:text-brand-500 transition">
                        <i class="fas fa-plus"></i> تسجيل متدرب جديد
                    </button>
                </div>

                <!-- Detail View Placeholder -->
                <div class="w-full md:w-2/3 bg-white p-8 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
                    <div class="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-hard-hat text-4xl text-orange-500"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">حاضنة السلامة الذكية</h2>
                    <p class="text-gray-500 max-w-md mb-6">حدد بطاقة من القائمة لعرض تفاصيل التدريب، سجلات التقييم، واعتماد الشهادات.</p>
                    <div class="flex gap-4">
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-check-circle text-green-500"></i> ربط حكومي
                        </div>
                         <div class="flex items-center gap-2 text-sm text-gray-600">
                            <i class="fas fa-video text-blue-500"></i> اجتماعات SMRTTX
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    const translateStage = (stage) => {
        const map = { registration: 'التسجيل', training: 'التدريب', certification: 'الاعتماد' };
        return map[stage] || stage;
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
