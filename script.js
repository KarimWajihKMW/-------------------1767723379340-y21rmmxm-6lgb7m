/**
 * NAYOSH ERP - Advanced Ads Engine & Multi-Tenant System
 * Updated Logic: 5-Level Ads Scope, Approval Workflows, Pricing Model
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
        HQ: 'HQ',
        BRANCH: 'BRANCH',
        INCUBATOR: 'INCUBATOR',
        PLATFORM: 'PLATFORM',
        OFFICE: 'OFFICE'
    };

    // --- ADS ENGINE CONFIGURATION ---
    const AD_CONFIG = {
        // 5 Levels of Scope
        SCOPES: {
            LOCAL: { id: 'LOCAL', label: 'محلي (داخل الكيان فقط)', priceMultiplier: 0, requiresApproval: false },
            MULTI_BRANCH: { id: 'MULTI_BRANCH', label: 'شبكة الفروع (Retail Network)', priceMultiplier: 2, requiresApproval: true },
            INCUBATOR_INTERNAL: { id: 'INCUBATOR_INTERNAL', label: 'مجتمع الحاضنة', priceMultiplier: 0, requiresApproval: false },
            PLATFORM_USERS: { id: 'PLATFORM_USERS', label: 'مشتركي المنصة (SaaS)', priceMultiplier: 1.5, requiresApproval: true },
            GLOBAL: { id: 'GLOBAL', label: 'نشر موسع (كل النظام)', priceMultiplier: 5, requiresApproval: true }
        },
        PLACEMENTS: {
            CAROUSEL: { id: 'CAROUSEL', label: 'شريط المتحرك (Dashboard)', priceMultiplier: 1 },
            TOAST: { id: 'TOAST', label: 'تنبيه منبثق (Popup)', priceMultiplier: 2 },
            SIDEBAR: { id: 'SIDEBAR', label: 'القائمة الجانبية', priceMultiplier: 1.2 }
        },
        STATUS: {
            ACTIVE: 'ACTIVE',
            PENDING: 'PENDING', // Waiting for HQ
            REJECTED: 'REJECTED',
            EXPIRED: 'EXPIRED',
            DRAFT: 'DRAFT'
        },
        BASE_PRICE_PER_DAY: 10 // SAR
    };

    // --- DATA LAYER ---
    const db = {
        users: [
            { id: 1, name: 'م. أحمد العلي', role: ROLES.SUPER_ADMIN, tenantType: TENANT_TYPES.HQ, entityId: 'HQ001', entityName: 'المكتب الرئيسي' },
            { id: 2, name: 'سارة محمد', role: ROLES.MANAGER, tenantType: TENANT_TYPES.BRANCH, entityId: 'BR015', entityName: 'فرع العليا مول' },
            { id: 3, name: 'د. خالد الزهراني', role: ROLES.MANAGER, tenantType: TENANT_TYPES.INCUBATOR, entityId: 'INC03', entityName: 'حاضنة السلامة' },
            { id: 4, name: 'فريق التقنية', role: ROLES.MANAGER, tenantType: TENANT_TYPES.PLATFORM, entityId: 'PLT01', entityName: 'نايوش كلاود' },
            { id: 8, name: 'عمر الطالب', role: ROLES.CLIENT, tenantType: TENANT_TYPES.INCUBATOR, entityId: 'INC03', entityName: 'حاضنة السلامة' },
            { id: 9, name: 'فهد السبيعي', role: ROLES.MANAGER, tenantType: TENANT_TYPES.BRANCH, entityId: 'BR016', entityName: 'فرع مول الرياض' }
        ],

        // EXPANDED ADS SCHEMA
        ads: [
            // 1. GLOBAL AD (Approved & Active)
            {
                id: 1,
                title: 'صيانة دورية للنظام',
                content: 'سيتم توقف النظام للصيانة يوم الجمعة من الساعة 2ص حتى 4ص.',
                type: 'warning',
                scope: 'GLOBAL',
                sourceEntityId: 'HQ001',
                sourceEntityName: 'المكتب الرئيسي',
                targetType: 'ALL',
                status: 'ACTIVE',
                startDate: '2023-11-20',
                duration: 7,
                placement: 'CAROUSEL',
                price: 0
            },
            // 2. LOCAL AD (Branch Specific - Free)
            {
                id: 2,
                title: 'اجتماع الموظفين',
                content: 'اجتماع صباحي لمناقشة التارغت الشهري.',
                type: 'info',
                scope: 'LOCAL',
                sourceEntityId: 'BR015',
                sourceEntityName: 'فرع العليا مول',
                targetType: 'SELF',
                status: 'ACTIVE',
                startDate: '2023-11-21',
                duration: 3,
                placement: 'CAROUSEL',
                price: 0
            },
            // 3. MULTI-BRANCH AD (Paid & Approved)
            {
                id: 3,
                title: 'خصم خاص للموظفين',
                content: 'خصم 20% لدى كافية "Jolt" لجميع موظفي الفروع.',
                type: 'promo',
                scope: 'MULTI_BRANCH',
                sourceEntityId: 'BR015',
                sourceEntityName: 'فرع العليا مول',
                targetType: 'BRANCH',
                status: 'ACTIVE',
                startDate: '2023-11-20',
                duration: 10,
                placement: 'TOAST',
                price: 200 // Calculated
            },
            // 4. INCUBATOR INTERNAL (Free)
            {
                id: 4,
                title: 'يوم العرض (Demo Day)',
                content: 'نذكركم بموعد عرض المشاريع أمام المستثمرين غداً.',
                type: 'success',
                scope: 'INCUBATOR_INTERNAL',
                sourceEntityId: 'INC03',
                sourceEntityName: 'حاضنة السلامة',
                targetType: 'INCUBATOR',
                status: 'ACTIVE',
                startDate: '2023-11-22',
                duration: 5,
                placement: 'CAROUSEL',
                price: 0
            },
            // 5. PENDING APPROVAL AD (Global from a Branch)
            {
                id: 5,
                title: 'افتتاح فرعنا الجديد',
                content: 'ندعوكم لحفل افتتاح فرع العليا مول.',
                type: 'promo',
                scope: 'GLOBAL',
                sourceEntityId: 'BR015',
                sourceEntityName: 'فرع العليا مول',
                targetType: 'ALL',
                status: 'PENDING',
                startDate: '2023-11-25',
                duration: 3,
                placement: 'TOAST',
                price: 150
            }
        ],

        tenants: [
            { id: 'BR015', name: 'فرع العليا مول', type: TENANT_TYPES.BRANCH, balance: 5000 },
            { id: 'BR016', name: 'فرع مول الرياض', type: TENANT_TYPES.BRANCH, balance: 3200 },
            { id: 'INC03', name: 'حاضنة السلامة', type: TENANT_TYPES.INCUBATOR, balance: 10000 }
        ]
    };

    let currentUser = db.users[0]; // Default: Super Admin

    // --- PERMISSIONS HELPER ---
    const perms = {
        isHQ: () => currentUser.tenantType === TENANT_TYPES.HQ,
        canManageAds: () => [ROLES.SUPER_ADMIN, ROLES.MANAGER].includes(currentUser.role),
        canApproveAds: () => currentUser.role === ROLES.SUPER_ADMIN && currentUser.tenantType === TENANT_TYPES.HQ
    };

    // --- CORE LOGIC (Ads Engine) ---
    const adsEngine = {
        // 1. FILTERING ADS FOR DISPLAY
        getVisibleAds: () => {
            const today = new Date().toISOString().split('T')[0];
            
            return db.ads.filter(ad => {
                // Basic filters
                if (ad.status !== 'ACTIVE') return false;
                // Date check (Simplified)
                if (ad.startDate > today) return false;
                // TODO: Add proper expiry date check

                // --- SCOPE LOGIC ---
                switch (ad.scope) {
                    case 'GLOBAL':
                        return true; // Visible to everyone
                    case 'LOCAL':
                        return ad.sourceEntityId === currentUser.entityId;
                    case 'MULTI_BRANCH':
                        return currentUser.tenantType === TENANT_TYPES.BRANCH;
                    case 'INCUBATOR_INTERNAL':
                        return currentUser.entityId === ad.sourceEntityId; // Or specific logic for incubator community
                    case 'PLATFORM_USERS':
                        return currentUser.tenantType === TENANT_TYPES.PLATFORM || ad.sourceEntityId === currentUser.entityId;
                    default:
                        return false;
                }
            });
        },

        // 2. GETTING ADS TO MANAGE (My Ads + Approval Queue)
        getManageableAds: () => {
            if (perms.isHQ()) {
                return db.ads; // HQ sees all (for approval)
            }
            return db.ads.filter(ad => ad.sourceEntityId === currentUser.entityId);
        },

        // 3. PRICING CALCULATOR
        calculatePrice: (scope, duration, placement) => {
            const scopeMult = AD_CONFIG.SCOPES[scope]?.priceMultiplier || 0;
            const placeMult = AD_CONFIG.PLACEMENTS[placement]?.priceMultiplier || 1;
            const base = AD_CONFIG.BASE_PRICE_PER_DAY;
            
            // Formula: (Base * ScopeMultiplier * PlacementMultiplier) * Duration
            // Note: If Scope Multiplier is 0 (Local), price is 0.
            return Math.round((base * scopeMult * placeMult) * duration);
        },

        // 4. CREATE AD
        createAd: (formData) => {
            const scopeConfig = AD_CONFIG.SCOPES[formData.scope];
            const price = adsEngine.calculatePrice(formData.scope, formData.duration, formData.placement);
            
            // Determine Status
            // If HQ creates it, it's ACTIVE.
            // If Scope doesn't require approval (Local), it's ACTIVE.
            // Otherwise PENDING.
            let status = 'PENDING';
            if (perms.isHQ() || !scopeConfig.requiresApproval) {
                status = 'ACTIVE';
            }

            const newAd = {
                id: db.ads.length + 1,
                ...formData,
                sourceEntityId: currentUser.entityId,
                sourceEntityName: currentUser.entityName,
                status: status,
                price: price,
                date: new Date().toISOString().split('T')[0]
            };

            db.ads.push(newAd);
            return newAd;
        },

        // 5. APPROVE/REJECT
        updateStatus: (adId, newStatus) => {
            const ad = db.ads.find(a => a.id === adId);
            if (ad) ad.status = newStatus;
        }
    };

    // --- INIT ---
    const init = () => {
        renderSidebar();
        loadRoute('dashboard');
        updateHeader();
        // Show Toasts on init if any
        renderToasts();
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
                renderToasts();
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
        switch(route) {
            case 'dashboard': content = renderDashboard(); break;
            case 'ads-manager': content = renderAdsManager(); break;
            case 'operations': content = renderPlaceholder('العمليات', 'fa-cogs'); break;
            default: content = renderPlaceholder('صفحة قيد التطوير', 'fa-tools');
        }
        view.innerHTML = `<div class="fade-in">${content}</div>`;
    };

    const getTitle = (r) => {
        const map = { 'dashboard': 'لوحة التحكم', 'ads-manager': 'إدارة الإعلانات', 'operations': 'العمليات' };
        return map[r] || 'نايوش ERP';
    };

    // --- RENDERERS ---
    
    // 1. SIDEBAR
    const renderSidebar = () => {
        const menu = document.getElementById('nav-menu');
        let html = `
            <li><a href="#" onclick="app.loadRoute('dashboard')" class="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"><i class="fas fa-home w-6 text-center"></i> الرئيسية</a></li>
        `;

        if (perms.canManageAds()) {
            html += `<li><a href="#" onclick="app.loadRoute('ads-manager')" class="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"><i class="fas fa-bullhorn w-6 text-center"></i> الإعلانات</a></li>`;
        }

        html += `<li><a href="#" onclick="app.loadRoute('operations')" class="flex items-center gap-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"><i class="fas fa-rocket w-6 text-center"></i> العمليات</a></li>`;
        
        menu.innerHTML = html;
    };

    // 2. DASHBOARD
    const renderDashboard = () => {
        const ads = adsEngine.getVisibleAds().filter(a => a.placement === 'CAROUSEL');
        
        return `
        <!-- ADS CAROUSEL -->
        <div class="mb-8">
            <div class="flex items-center gap-2 mb-3">
                <h3 class="font-bold text-gray-700">الإعلانات والتعاميم</h3>
                <span class="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">${ads.length} نشط</span>
            </div>
            <div class="flex gap-4 overflow-x-auto pb-4 snap-x">
                ${ads.length ? ads.map(ad => `
                    <div class="min-w-[320px] md:min-w-[400px] bg-white border-r-4 ${getAdColor(ad.type)} p-5 rounded-xl shadow-sm snap-start hover:shadow-md transition flex flex-col justify-between h-40">
                        <div>
                            <div class="flex justify-between items-start">
                                <h4 class="font-bold text-gray-800 line-clamp-1">${ad.title}</h4>
                                <span class="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600">${AD_CONFIG.SCOPES[ad.scope]?.label.split(' ')[0]}</span>
                            </div>
                            <p class="text-sm text-gray-600 mt-2 line-clamp-3">${ad.content}</p>
                        </div>
                        <div class="text-[10px] text-gray-400 mt-auto pt-2 flex justify-between">
                            <span>من: ${ad.sourceEntityName}</span>
                            <span>${ad.startDate}</span>
                        </div>
                    </div>
                `).join('') : '<div class="w-full p-6 text-center text-gray-400 bg-white rounded-xl border border-dashed">لا توجد إعلانات نشطة حالياً</div>'}
            </div>
        </div>

        <!-- STATS GRID -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <div class="bg-white p-6 rounded-xl shadow-sm border-b-4 border-brand-500">
                <p class="text-xs text-gray-500 font-bold">المهام المفتوحة</p>
                <h3 class="text-2xl font-bold mt-1">12</h3>
             </div>
             <div class="bg-white p-6 rounded-xl shadow-sm border-b-4 border-purple-500">
                <p class="text-xs text-gray-500 font-bold">الرصيد</p>
                <h3 class="text-2xl font-bold mt-1">5,240 <span class="text-xs font-normal">ر.س</span></h3>
             </div>
        </div>
        `;
    };

    // 3. TOAST RENDERER
    const renderToasts = () => {
        const container = document.getElementById('toast-container');
        container.innerHTML = '';
        const ads = adsEngine.getVisibleAds().filter(a => a.placement === 'TOAST');
        
        ads.forEach(ad => {
            const el = document.createElement('div');
            el.className = `w-80 bg-white p-4 rounded-lg shadow-2xl border-r-4 ${getAdColor(ad.type)} flex items-start gap-3 transform transition-all duration-500 translate-x-0 pointer-events-auto`;
            el.innerHTML = `
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-gray-800">${ad.title}</h4>
                    <p class="text-xs text-gray-600 mt-1">${ad.content}</p>
                    <div class="mt-2 flex gap-2">
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-xs text-gray-400 hover:text-gray-600">إغلاق</button>
                        <span class="text-[10px] text-brand-600 bg-brand-50 px-2 rounded ml-auto">${ad.sourceEntityName}</span>
                    </div>
                </div>
            `;
            container.appendChild(el);
        });
    };

    // 4. ADS MANAGER (COMPLEX UI)
    const renderAdsManager = () => {
        const myAds = adsEngine.getManageableAds();
        const pendingAds = myAds.filter(a => a.status === 'PENDING');
        const activeAds = myAds.filter(a => a.status === 'ACTIVE');
        
        // Default Tab: My Ads
        // HQ Admin sees 'Pending Approvals' prominently
        
        return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left: Create/Calculator -->
            <div class="lg:col-span-1">
                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-4">
                    <h3 class="font-bold text-lg mb-4 text-brand-700 border-b pb-2">نشر إعلان جديد</h3>
                    <form id="create-ad-form" onsubmit="app.handleCreateAd(event)" class="space-y-4">
                        
                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">عنوان الإعلان</label>
                            <input type="text" name="title" required class="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-brand-200 outline-none">
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">المحتوى</label>
                            <textarea name="content" rows="3" required class="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-brand-200 outline-none"></textarea>
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-xs font-bold text-gray-700 mb-1">النوع</label>
                                <select name="type" class="w-full p-2 border rounded text-sm bg-slate-50">
                                    <option value="info">معلومة</option>
                                    <option value="promo">عرض ترويجي</option>
                                    <option value="warning">تنبيه هام</option>
                                    <option value="success">إنجاز</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-700 mb-1">مكان الظهور</label>
                                <select name="placement" id="ad-placement" onchange="app.updatePricePreview()" class="w-full p-2 border rounded text-sm bg-slate-50">
                                    ${Object.values(AD_CONFIG.PLACEMENTS).map(p => `<option value="${p.id}">${p.label}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="p-4 bg-brand-50 rounded-lg border border-brand-100">
                            <label class="block text-xs font-bold text-brand-800 mb-2">نطاق النشر (Target Scope)</label>
                            <select name="scope" id="ad-scope" onchange="app.updatePricePreview()" class="w-full p-2 border border-brand-200 rounded text-sm bg-white mb-2">
                                ${Object.values(AD_CONFIG.SCOPES).map(s => {
                                    // Filter scopes based on role? For demo, show all.
                                    return `<option value="${s.id}">${s.label}</option>`;
                                }).join('')}
                            </select>
                            <p id="scope-hint" class="text-[10px] text-brand-600">يظهر فقط لموظفي وعملاء فرعك الحالي.</p>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">المدة (بالأيام)</label>
                            <input type="number" name="duration" id="ad-duration" value="3" min="1" max="30" onchange="app.updatePricePreview()" class="w-full p-2 border rounded text-sm">
                        </div>

                        <!-- Pricing Preview -->
                        <div class="flex justify-between items-center py-3 border-t border-gray-100 mt-2">
                            <span class="text-xs text-gray-500 font-bold">التكلفة المقدرة:</span>
                            <span id="price-display" class="text-xl font-bold text-green-600">0 ر.س</span>
                        </div>

                        <button type="submit" class="w-full bg-brand-600 text-white py-2.5 rounded-lg font-bold hover:bg-brand-700 transition shadow-lg shadow-brand-200">إرسال للنشر</button>
                    </form>
                </div>
            </div>

            <!-- Right: Lists -->
            <div class="lg:col-span-2 space-y-8">
                
                ${perms.isHQ() ? `
                <!-- APPROVAL QUEUE (HQ ONLY) -->
                <div class="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
                    <div class="bg-orange-50 px-6 py-3 border-b border-orange-100 flex justify-between items-center">
                        <h3 class="font-bold text-orange-800"><i class="fas fa-clipboard-check ml-2"></i>طلبات النشر المعلقة (${pendingAds.length})</h3>
                    </div>
                    <div class="divide-y divide-gray-50">
                        ${pendingAds.length === 0 ? '<p class="p-6 text-center text-sm text-gray-400">لا توجد طلبات معلقة</p>' : pendingAds.map(ad => `
                            <div class="p-4 hover:bg-orange-50/50 transition flex justify-between items-center">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-500 font-bold">${ad.sourceEntityName}</span>
                                        <h4 class="font-bold text-gray-800">${ad.title}</h4>
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">${ad.content}</p>
                                    <div class="mt-2 text-xs text-gray-400 flex gap-3">
                                        <span><i class="fas fa-globe ml-1"></i>${AD_CONFIG.SCOPES[ad.scope]?.label}</span>
                                        <span><i class="fas fa-coins ml-1"></i>${ad.price} ر.س</span>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="app.approveAd(${ad.id})" class="bg-green-500 text-white px-3 py-1.5 rounded text-xs hover:bg-green-600">قبول</button>
                                    <button onclick="app.rejectAd(${ad.id})" class="bg-red-500 text-white px-3 py-1.5 rounded text-xs hover:bg-red-600">رفض</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- ACTIVE ADS -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div class="px-6 py-4 border-b border-gray-100 flex justify-between">
                        <h3 class="font-bold text-gray-800">إعلاناتي النشطة</h3>
                    </div>
                    <div class="divide-y divide-gray-50">
                         ${activeAds.length === 0 ? '<p class="p-6 text-center text-sm text-gray-400">لا توجد إعلانات نشطة</p>' : activeAds.map(ad => `
                            <div class="p-5 flex items-start gap-4">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${getAdColor(ad.type, true)}">
                                    <i class="fas fa-bullhorn"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between items-start">
                                        <h4 class="font-bold text-gray-800">${ad.title}</h4>
                                        <span class="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-full font-bold">نشط</span>
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">${ad.content}</p>
                                    <div class="mt-3 flex items-center gap-4 text-xs text-gray-400">
                                        <span class="flex items-center gap-1"><i class="far fa-calendar"></i> يبدأ: ${ad.startDate}</span>
                                        <span class="flex items-center gap-1"><i class="far fa-clock"></i> المدة: ${ad.duration} أيام</span>
                                        <span class="flex items-center gap-1 text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded">${AD_CONFIG.SCOPES[ad.scope]?.label.split(' ')[0]}</span>
                                    </div>
                                </div>
                                <button onclick="app.deleteAd(${ad.id})" class="text-gray-300 hover:text-red-500 transition"><i class="fas fa-trash"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Pending Ads (For regular users) -->
                ${!perms.isHQ() ? `
                <div class="bg-white rounded-xl shadow-sm border border-gray-100">
                     <div class="px-6 py-4 border-b border-gray-100">
                        <h3 class="font-bold text-gray-600 text-sm">بانتظار الموافقة</h3>
                    </div>
                    <div class="divide-y divide-gray-50">
                         ${pendingAds.map(ad => `
                            <div class="p-4 flex justify-between items-center opacity-75 grayscale-[50%]">
                                <div>
                                    <h4 class="font-bold text-sm text-gray-800">${ad.title}</h4>
                                    <span class="text-[10px] bg-yellow-100 text-yellow-700 px-2 rounded">قيد المراجعة (HQ)</span>
                                </div>
                                <span class="font-bold text-sm text-gray-500">${ad.price} ر.س</span>
                            </div>
                         `).join('')}
                    </div>
                </div>
                ` : ''}

            </div>
        </div>
        `;
    };

    // --- UTILS & HANDLERS ---
    const getAdColor = (type, isBg = false) => {
        const colors = {
            'info': isBg ? 'bg-blue-500' : 'border-blue-500',
            'promo': isBg ? 'bg-purple-500' : 'border-purple-500',
            'warning': isBg ? 'bg-orange-500' : 'border-orange-500',
            'success': isBg ? 'bg-green-500' : 'border-green-500'
        };
        return colors[type] || (isBg ? 'bg-gray-500' : 'border-gray-500');
    };

    const renderPlaceholder = (title, icon) => `
        <div class="flex flex-col items-center justify-center h-96 text-gray-300">
            <i class="fas ${icon} text-6xl mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-400">${title}</h2>
        </div>
    `;

    // EXPOSED METHODS
    return {
        init,
        switchUser,
        loadRoute,
        
        // Ads Handlers
        updatePricePreview: () => {
            const scope = document.getElementById('ad-scope').value;
            const duration = document.getElementById('ad-duration').value;
            const placement = document.getElementById('ad-placement').value;
            
            const price = adsEngine.calculatePrice(scope, duration, placement);
            document.getElementById('price-display').innerText = price + ' ر.س';
            
            // Update Hint
            const hintEl = document.getElementById('scope-hint');
            const config = AD_CONFIG.SCOPES[scope];
            hintEl.innerText = config.requiresApproval ? 
                '⚠️ يتطلب موافقة الإدارة المركزية (HQ) وسيتم خصم الرصيد بعد الموافقة.' : 
                '✅ نشر فوري مجاني داخل نطاقك الإداري.';
            hintEl.className = `text-[10px] mt-1 ${config.requiresApproval ? 'text-orange-600 font-bold' : 'text-green-600'}`;
        },

        handleCreateAd: (e) => {
            e.preventDefault();
            const formData = {
                title: e.target.title.value,
                content: e.target.content.value,
                type: e.target.type.value,
                scope: e.target.scope.value,
                duration: parseInt(e.target.duration.value),
                placement: e.target.placement.value,
                startDate: new Date().toISOString().split('T')[0]
            };
            
            const newAd = adsEngine.createAd(formData);
            alert(newAd.status === 'ACTIVE' ? 'تم نشر الإعلان بنجاح!' : 'تم إرسال الطلب للموافقة!');
            loadRoute('ads-manager');
            if(newAd.status === 'ACTIVE') renderToasts();
        },

        approveAd: (id) => {
            adsEngine.updateStatus(id, 'ACTIVE');
            loadRoute('ads-manager');
            renderToasts(); // If current user sees it
        },

        rejectAd: (id) => {
            adsEngine.updateStatus(id, 'REJECTED');
            loadRoute('ads-manager');
        },

        deleteAd: (id) => {
            if(confirm('هل أنت متأكد من الحذف؟')) {
                const idx = db.ads.findIndex(a => a.id === id);
                if(idx > -1) db.ads.splice(idx, 1);
                loadRoute('ads-manager');
            }
        }
    };
})();

// Init App
document.addEventListener('DOMContentLoaded', app.init);