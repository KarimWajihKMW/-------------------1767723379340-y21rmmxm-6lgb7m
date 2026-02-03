/**
 * 📑 Budgets API (Page 15)
 * Adds full CRUD, rich seeding, and variance math helpers.
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'crossover.proxy.rlwy.net',
    port: 44255,
    database: 'railway',
    user: 'postgres',
    password: 'PddzJpAQYezqknsntSzmCUlQYuYJldcT',
    ssl: { rejectUnauthorized: false }
});

const DEFAULT_ENTITY_ID = '1';
const DEFAULT_ENTITY_TYPE = 'HQ';

function parseNumber(value, fallback = 0) {
    if (value === undefined || value === null || value === '') return fallback;
    const num = Number(value);
    return Number.isNaN(num) ? fallback : num;
}

function normalizeText(value) {
    return value === undefined || value === null || value === '' ? null : value;
}

function distributeMonthly(annual) {
    const monthly = Number((parseNumber(annual) / 12).toFixed(2));
    return Array(12).fill(monthly);
}

async function ensureSeedData(entityId = DEFAULT_ENTITY_ID, entityType = DEFAULT_ENTITY_TYPE) {
    const client = await pool.connect();
    try {
        const existing = await client.query(
            'SELECT COUNT(*)::int AS count FROM finance_budgets WHERE entity_id = $1',
            [entityId]
        );

        if (existing.rows[0].count > 0) {
            return false;
        }

        await client.query('BEGIN');

        const budgetsPayload = [
            {
                budget_code: 'BUD-2024-OPS',
                budget_name_ar: 'ميزانية التشغيل 2024',
                budget_name_en: '2024 Operating Budget',
                budget_type: 'operational',
                fiscal_year: 2024,
                scenario: 'base',
                status: 'approved',
                branch_id: 'BR-HQ',
                incubator_id: 'INC-HEAD',
                platform_id: 'PLAT-CORE',
                program_id: 101,
                description: 'تشغيل المقر الرئيسي وتوسعة الفرق الأساسية لعام 2024',
                assumptions: 'معدلات نمو شهرية 3% للعمليات، وثبات في العقود طويلة الأجل',
                created_by: 'system',
                approved_by: 'cfo',
                approved_at: new Date()
            },
            {
                budget_code: 'BUD-2024-CAPEX',
                budget_name_ar: 'ميزانية رأس المال 2024',
                budget_name_en: '2024 Capital Budget',
                budget_type: 'capital',
                fiscal_year: 2024,
                scenario: 'expansion',
                status: 'approved',
                branch_id: 'BR-HQ',
                incubator_id: 'INC-HEAD',
                platform_id: 'PLAT-CORE',
                program_id: 202,
                description: 'مشروعات توسعة البنية التحتية التقنية والأصول الإنتاجية',
                assumptions: 'تنفيذ المشتريات على ثلاث دفعات مع تفاوض للحصول على خصومات',
                created_by: 'system',
                approved_by: 'cfo',
                approved_at: new Date()
            },
            {
                budget_code: 'BUD-2025-OPS',
                budget_name_ar: 'ميزانية التشغيل 2025',
                budget_name_en: '2025 Operating Budget',
                budget_type: 'operational',
                fiscal_year: 2025,
                scenario: 'growth',
                status: 'draft',
                branch_id: 'BR-01',
                incubator_id: 'INC-GROWTH',
                platform_id: 'PLAT-GO',
                program_id: 305,
                description: 'تعظيم الإيرادات من المنصات الرقمية وتطوير المبيعات الاستشارية',
                assumptions: 'زيادة أسعار الخدمات بنسبة 7% مع ضبط المصروفات المتغيرة',
                created_by: 'planning-team',
                approved_by: null,
                approved_at: null
            },
            {
                budget_code: 'BUD-2025-RND',
                budget_name_ar: 'ميزانية الابتكار 2025',
                budget_name_en: '2025 Innovation Budget',
                budget_type: 'development',
                fiscal_year: 2025,
                scenario: 'innovation',
                status: 'approved',
                branch_id: 'BR-LAB',
                incubator_id: 'INC-LABS',
                platform_id: 'PLAT-AI',
                program_id: 450,
                description: 'تمويل التجارب البحثية وتطوير منتجات الذكاء الاصطناعي',
                assumptions: 'تركيز على نماذج الإيرادات المتكررة، ومشاركة مسرعات الأعمال',
                created_by: 'innovation-lab',
                approved_by: 'cto',
                approved_at: new Date()
            }
        ];

        const budgetIdMap = {};

        for (const item of budgetsPayload) {
            const result = await client.query(
                `INSERT INTO finance_budgets (
                    budget_code,
                    budget_name_ar,
                    budget_name_en,
                    budget_type,
                    fiscal_year,
                    scenario,
                    status,
                    entity_type,
                    entity_id,
                    branch_id,
                    incubator_id,
                    platform_id,
                    program_id,
                    description,
                    assumptions,
                    created_at,
                    updated_at,
                    created_by,
                    approved_by,
                    approved_at
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW(),$16,$17,$18
                ) RETURNING budget_id`,
                [
                    item.budget_code,
                    item.budget_name_ar,
                    item.budget_name_en,
                    item.budget_type,
                    item.fiscal_year,
                    item.scenario,
                    item.status,
                    entityType,
                    entityId,
                    item.branch_id,
                    item.incubator_id,
                    item.platform_id,
                    item.program_id,
                    item.description,
                    item.assumptions,
                    item.created_by,
                    item.approved_by,
                    item.approved_at
                ]
            );
            budgetIdMap[item.budget_code] = result.rows[0].budget_id;
        }

        const linesPayload = [
            // 2024 Operating
            { budget_code: 'BUD-2024-OPS', account_id: 287, account_code: '5210', account_name: 'الرواتب والأجور', annual_amount: 1200000, months: Array(12).fill(100000), notes: 'رواتب الفريق التشغيلي والمزايا' },
            { budget_code: 'BUD-2024-OPS', account_id: 288, account_code: '5220', account_name: 'الإيجارات', annual_amount: 360000, months: Array(12).fill(30000), notes: 'إيجار المقر والمراكز الفرعية' },
            { budget_code: 'BUD-2024-OPS', account_id: 289, account_code: '5230', account_name: 'الكهرباء والماء', annual_amount: 180000, months: Array(12).fill(15000), notes: 'مرافق وطاقة احتياطية للخوادم' },
            { budget_code: 'BUD-2024-OPS', account_id: 290, account_code: '5240', account_name: 'الاتصالات', annual_amount: 72000, months: Array(12).fill(6000), notes: 'انترنت فائق السرعة واتصالات موحدة' },
            { budget_code: 'BUD-2024-OPS', account_id: 293, account_code: '5270', account_name: 'مصروفات السفر', annual_amount: 150000, months: [20000, 15000, 15000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000], notes: 'زيارات العملاء والمؤتمرات' },

            // 2024 CAPEX
            { budget_code: 'BUD-2024-CAPEX', account_id: 260, account_code: '1240', account_name: 'الأجهزة والمعدات', annual_amount: 450000, months: [200000, 150000, 100000, 0, 0, 0, 0, 0, 0, 0, 0, 0], notes: 'توسعة مراكز البيانات' },
            { budget_code: 'BUD-2024-CAPEX', account_id: 259, account_code: '1230', account_name: 'السيارات', annual_amount: 200000, months: [0, 0, 0, 100000, 100000, 0, 0, 0, 0, 0, 0, 0], notes: 'أسطول دعم ميداني' },
            { budget_code: 'BUD-2024-CAPEX', account_id: 262, account_code: '1260', account_name: 'الأصول غير الملموسة', annual_amount: 120000, months: [0, 0, 0, 0, 0, 60000, 60000, 0, 0, 0, 0, 0], notes: 'تراخيص برمجية استراتيجية' },

            // 2025 Operating
            { budget_code: 'BUD-2025-OPS', account_id: 287, account_code: '5210', account_name: 'الرواتب والأجور', annual_amount: 1320000, months: Array(12).fill(110000), notes: 'زيادات الأداء وبرامج الاحتفاظ' },
            { budget_code: 'BUD-2025-OPS', account_id: 288, account_code: '5220', account_name: 'الإيجارات', annual_amount: 396000, months: Array(12).fill(33000), notes: 'مساحات إضافية لمعامل الابتكار' },
            { budget_code: 'BUD-2025-OPS', account_id: 289, account_code: '5230', account_name: 'الكهرباء والماء', annual_amount: 192000, months: Array(12).fill(16000), notes: 'تحسين كفاءة الطاقة' },
            { budget_code: 'BUD-2025-OPS', account_id: 296, account_code: '5320', account_name: 'الاستشارات والخدمات المهنية', annual_amount: 180000, months: Array(12).fill(15000), notes: 'مكاتب استشارية للتحول الرقمي' },

            // 2025 R&D
            { budget_code: 'BUD-2025-RND', account_id: 280, account_code: '4120', account_name: 'مبيعات الخدمات', annual_amount: 850000, months: [65000, 65000, 70000, 70000, 75000, 75000, 80000, 85000, 90000, 95000, 100000, 105000], notes: 'إيرادات العقود التجريبية' },
            { budget_code: 'BUD-2025-RND', account_id: 295, account_code: '5310', account_name: 'مصروفات إدارية عامة', annual_amount: 210000, months: Array(12).fill(17500), notes: 'تشغيل مختبرات الابتكار' },
            { budget_code: 'BUD-2025-RND', account_id: 293, account_code: '5270', account_name: 'مصروفات السفر', annual_amount: 140000, months: [12000, 12000, 12000, 12000, 12000, 12000, 12000, 12000, 14000, 14000, 16000, 16000], notes: 'معارض تقنية ومسرعات عالمية' }
        ];

        for (const line of linesPayload) {
            const budgetId = budgetIdMap[line.budget_code];
            if (!budgetId) continue;
            const months = line.months && line.months.length === 12 ? line.months : distributeMonthly(line.annual_amount);
            await client.query(
                `INSERT INTO finance_budget_lines (
                    budget_id,
                    account_id,
                    account_code,
                    account_name,
                    annual_amount,
                    month_1,
                    month_2,
                    month_3,
                    month_4,
                    month_5,
                    month_6,
                    month_7,
                    month_8,
                    month_9,
                    month_10,
                    month_11,
                    month_12,
                    entity_type,
                    entity_id,
                    branch_id,
                    incubator_id,
                    notes,
                    created_at
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW()
                )`,
                [
                    budgetId,
                    line.account_id,
                    line.account_code,
                    line.account_name,
                    parseNumber(line.annual_amount),
                    parseNumber(months[0]),
                    parseNumber(months[1]),
                    parseNumber(months[2]),
                    parseNumber(months[3]),
                    parseNumber(months[4]),
                    parseNumber(months[5]),
                    parseNumber(months[6]),
                    parseNumber(months[7]),
                    parseNumber(months[8]),
                    parseNumber(months[9]),
                    parseNumber(months[10]),
                    parseNumber(months[11]),
                    entityType,
                    entityId,
                    line.branch_id || null,
                    line.incubator_id || null,
                    line.notes || null
                ]
            );
        }

        const variancesPayload = [
            {
                fiscal_year: 2024,
                fiscal_period: 3,
                period_name: 'مارس 2024',
                account_id: 287,
                account_code: '5210',
                budgeted_amount: 300000,
                actual_amount: 320000,
                variance_type: 'unfavorable',
                significance_level: 'high',
                ai_explanation: 'زيادة التوظيف أسرع من المخطط لاستيعاب عقود جديدة',
                ai_recommendations: 'إعادة جدولة التعيينات للأشهر التالية مع تحسين الإنتاجية'
            },
            {
                fiscal_year: 2024,
                fiscal_period: 6,
                period_name: 'يونيو 2024',
                account_id: 280,
                account_code: '4120',
                budgeted_amount: 400000,
                actual_amount: 455000,
                variance_type: 'favorable',
                significance_level: 'medium',
                ai_explanation: 'تسارع في إيرادات الخدمات السحابية',
                ai_recommendations: 'توسيع العروض القائمة مع الحفاظ على هوامش الربح'
            },
            {
                fiscal_year: 2024,
                fiscal_period: 9,
                period_name: 'سبتمبر 2024',
                account_id: 260,
                account_code: '1240',
                budgeted_amount: 150000,
                actual_amount: 130000,
                variance_type: 'favorable',
                significance_level: 'low',
                ai_explanation: 'خصومات الموردين على دفعة الأجهزة الثالثة',
                ai_recommendations: 'تعزيز مفاوضات العقود السنوية مع نفس المورد'
            },
            {
                fiscal_year: 2025,
                fiscal_period: 1,
                period_name: 'يناير 2025',
                account_id: 295,
                account_code: '5310',
                budgeted_amount: 17500,
                actual_amount: 16000,
                variance_type: 'favorable',
                significance_level: 'medium',
                ai_explanation: 'تأجيل بعض المصروفات الإدارية بعد تفاوض عقود الدعم',
                ai_recommendations: 'تثبيت العقود الجديدة على نفس الأسعار لمدة 12 شهر'
            }
        ];

        for (const variance of variancesPayload) {
            const varianceAmount = parseNumber(variance.actual_amount) - parseNumber(variance.budgeted_amount);
            const variancePct = parseNumber(variance.budgeted_amount) !== 0
                ? Number(((varianceAmount / variance.budgeted_amount) * 100).toFixed(2))
                : 0;

            await client.query(
                `INSERT INTO finance_budget_variances (
                    fiscal_year,
                    fiscal_period,
                    period_name,
                    account_id,
                    account_code,
                    budgeted_amount,
                    actual_amount,
                    variance_amount,
                    variance_percentage,
                    variance_type,
                    significance_level,
                    ai_explanation,
                    ai_recommendations,
                    entity_type,
                    entity_id,
                    branch_id,
                    incubator_id,
                    created_at,
                    analyzed_at
                ) VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW()
                )`,
                [
                    variance.fiscal_year,
                    variance.fiscal_period,
                    variance.period_name,
                    variance.account_id,
                    variance.account_code,
                    parseNumber(variance.budgeted_amount),
                    parseNumber(variance.actual_amount),
                    varianceAmount,
                    variancePct,
                    variance.variance_type,
                    variance.significance_level,
                    variance.ai_explanation,
                    variance.ai_recommendations,
                    entityType,
                    entityId,
                    'BR-HQ',
                    'INC-HEAD'
                ]
            );
        }

        await client.query('COMMIT');
        console.log(`✅ Seeded rich budgets data for entity ${entityId}`);
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding budgets data:', error);
        return false;
    } finally {
        client.release();
    }
}

async function getBudgets(req, res) {
    const { entity_id, fiscal_year, budget_type, scenario, status, fiscal_period } = req.query;

    if (!entity_id) {
        return res.status(400).json({ success: false, error: 'entity_id is required' });
    }

    try {
        await ensureSeedData(entity_id, DEFAULT_ENTITY_TYPE);
        console.log(`📑 Fetching budgets for entity ${entity_id}...`);

        const budgetConditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const budgetValues = [entity_id];
        let bIndex = 2;

        if (fiscal_year) {
            budgetConditions.push(`fiscal_year = $${bIndex}`);
            budgetValues.push(parseInt(fiscal_year, 10));
            bIndex++;
        }
        if (budget_type) {
            budgetConditions.push(`LOWER(budget_type) = LOWER($${bIndex})`);
            budgetValues.push(budget_type);
            bIndex++;
        }
        if (scenario) {
            budgetConditions.push(`LOWER(scenario) = LOWER($${bIndex})`);
            budgetValues.push(scenario);
            bIndex++;
        }
        if (status) {
            budgetConditions.push(`LOWER(status) = LOWER($${bIndex})`);
            budgetValues.push(status);
            bIndex++;
        }

        const budgetsQuery = `
            SELECT
                budget_id,
                budget_code,
                budget_name_ar,
                budget_name_en,
                budget_type,
                fiscal_year,
                scenario,
                status,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                platform_id,
                program_id,
                description,
                assumptions,
                created_at,
                updated_at,
                created_by,
                approved_by,
                approved_at
            FROM finance_budgets
            WHERE ${budgetConditions.join(' AND ')}
            ORDER BY fiscal_year DESC, budget_id DESC
        `;

        const budgetsResult = await pool.query(budgetsQuery, budgetValues);
        const budgets = budgetsResult.rows;

        const linesQuery = `
            SELECT
                line_id,
                budget_id,
                account_id,
                account_code,
                account_name,
                annual_amount,
                month_1,
                month_2,
                month_3,
                month_4,
                month_5,
                month_6,
                month_7,
                month_8,
                month_9,
                month_10,
                month_11,
                month_12,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                notes,
                created_at
            FROM finance_budget_lines
            WHERE (entity_id = $1 OR entity_id IS NULL)
            ORDER BY line_id DESC
        `;

        const linesResult = await pool.query(linesQuery, [entity_id]);
        const lines = linesResult.rows;

        const varianceConditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const varianceValues = [entity_id];
        let vIndex = 2;

        if (fiscal_year) {
            varianceConditions.push(`fiscal_year = $${vIndex}`);
            varianceValues.push(parseInt(fiscal_year, 10));
            vIndex++;
        }
        if (fiscal_period) {
            varianceConditions.push(`fiscal_period = $${vIndex}`);
            varianceValues.push(parseInt(fiscal_period, 10));
            vIndex++;
        }

        const varianceQuery = `
            SELECT
                variance_id,
                fiscal_year,
                fiscal_period,
                period_name,
                account_id,
                account_code,
                budgeted_amount,
                actual_amount,
                variance_amount,
                variance_percentage,
                variance_type,
                significance_level,
                ai_explanation,
                ai_recommendations,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                created_at,
                analyzed_at
            FROM finance_budget_variances
            WHERE ${varianceConditions.join(' AND ')}
            ORDER BY fiscal_year DESC, fiscal_period DESC, variance_id DESC
        `;

        const varianceResult = await pool.query(varianceQuery, varianceValues);
        const variances = varianceResult.rows;

        const summary = {
            total_budgets: budgets.length,
            total_lines: lines.length,
            total_variances: variances.length,
            total_budget_amount: lines.reduce((sum, l) => sum + parseNumber(l.annual_amount), 0),
            total_budgeted: variances.reduce((sum, v) => sum + parseNumber(v.budgeted_amount), 0),
            total_actual: variances.reduce((sum, v) => sum + parseNumber(v.actual_amount), 0),
            total_variance: variances.reduce((sum, v) => sum + parseNumber(v.variance_amount), 0),
            by_type: {}
        };

        budgets.forEach(b => {
            const key = (b.budget_type || 'غير محدد').toLowerCase();
            summary.by_type[key] = (summary.by_type[key] || 0) + 1;
        });

        return res.json({ success: true, budgets, lines, variances, summary });
    } catch (error) {
        console.error('❌ Error fetching budgets:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function createBudget(req, res) {
    const entityId = req.body.entity_id || req.headers['x-entity-id'] || DEFAULT_ENTITY_ID;
    const entityType = req.body.entity_type || req.headers['x-entity-type'] || DEFAULT_ENTITY_TYPE;

    const required = ['budget_code', 'budget_name_ar', 'budget_type', 'fiscal_year'];
    for (const field of required) {
        if (!req.body[field]) {
            return res.status(400).json({ success: false, error: `${field} is required` });
        }
    }

    try {
        const result = await pool.query(
            `INSERT INTO finance_budgets (
                budget_code,
                budget_name_ar,
                budget_name_en,
                budget_type,
                fiscal_year,
                scenario,
                status,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                platform_id,
                program_id,
                description,
                assumptions,
                created_at,
                updated_at,
                created_by,
                approved_by,
                approved_at
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW(),$16,$17,$18
            ) RETURNING *`,
            [
                req.body.budget_code,
                req.body.budget_name_ar,
                req.body.budget_name_en || null,
                req.body.budget_type,
                parseInt(req.body.fiscal_year, 10),
                req.body.scenario || 'base',
                req.body.status || 'draft',
                entityType,
                entityId,
                normalizeText(req.body.branch_id),
                normalizeText(req.body.incubator_id),
                normalizeText(req.body.platform_id),
                req.body.program_id !== undefined && req.body.program_id !== null && req.body.program_id !== '' ? Number(req.body.program_id) : null,
                normalizeText(req.body.description),
                normalizeText(req.body.assumptions),
                normalizeText(req.body.created_by),
                normalizeText(req.body.approved_by),
                req.body.approved_at || null
            ]
        );

        return res.status(201).json({ success: true, budget: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: 'budget_code must be unique' });
        }
        console.error('❌ Error creating budget:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function updateBudget(req, res) {
    const budgetId = Number(req.params.budget_id);
    if (!budgetId) {
        return res.status(400).json({ success: false, error: 'budget_id is required' });
    }

    try {
        const result = await pool.query(
            `UPDATE finance_budgets SET
                budget_code = COALESCE($1, budget_code),
                budget_name_ar = COALESCE($2, budget_name_ar),
                budget_name_en = COALESCE($3, budget_name_en),
                budget_type = COALESCE($4, budget_type),
                fiscal_year = COALESCE($5, fiscal_year),
                scenario = COALESCE($6, scenario),
                status = COALESCE($7, status),
                entity_type = COALESCE($8, entity_type),
                entity_id = COALESCE($9, entity_id),
                branch_id = COALESCE($10, branch_id),
                incubator_id = COALESCE($11, incubator_id),
                platform_id = COALESCE($12, platform_id),
                program_id = COALESCE($13, program_id),
                description = COALESCE($14, description),
                assumptions = COALESCE($15, assumptions),
                created_by = COALESCE($16, created_by),
                approved_by = COALESCE($17, approved_by),
                approved_at = COALESCE($18, approved_at),
                updated_at = NOW()
            WHERE budget_id = $19
            RETURNING *`,
            [
                req.body.budget_code || null,
                req.body.budget_name_ar || null,
                req.body.budget_name_en || null,
                req.body.budget_type || null,
                req.body.fiscal_year ? parseInt(req.body.fiscal_year, 10) : null,
                req.body.scenario || null,
                req.body.status || null,
                req.body.entity_type || null,
                req.body.entity_id || null,
                normalizeText(req.body.branch_id),
                normalizeText(req.body.incubator_id),
                normalizeText(req.body.platform_id),
                req.body.program_id !== undefined && req.body.program_id !== null && req.body.program_id !== '' ? Number(req.body.program_id) : null,
                normalizeText(req.body.description),
                normalizeText(req.body.assumptions),
                normalizeText(req.body.created_by),
                normalizeText(req.body.approved_by),
                req.body.approved_at || null,
                budgetId
            ]
        );

        if (!result.rowCount) {
            return res.status(404).json({ success: false, error: 'لم يتم العثور على الميزانية' });
        }

        return res.json({ success: true, budget: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, error: 'budget_code must be unique' });
        }
        console.error('❌ Error updating budget:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteBudget(req, res) {
    const budgetId = Number(req.params.budget_id);
    if (!budgetId) {
        return res.status(400).json({ success: false, error: 'budget_id is required' });
    }

    try {
        const result = await pool.query('DELETE FROM finance_budgets WHERE budget_id = $1', [budgetId]);
        if (!result.rowCount) {
            return res.status(404).json({ success: false, error: 'لم يتم العثور على الميزانية' });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting budget:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function createBudgetLine(req, res) {
    const entityId = req.body.entity_id || req.headers['x-entity-id'] || DEFAULT_ENTITY_ID;
    const entityType = req.body.entity_type || req.headers['x-entity-type'] || DEFAULT_ENTITY_TYPE;

    const required = ['budget_id', 'account_id', 'annual_amount'];
    for (const field of required) {
        if (!req.body[field]) {
            return res.status(400).json({ success: false, error: `${field} is required` });
        }
    }

    const annualAmount = parseNumber(req.body.annual_amount);
    const months = [
        parseNumber(req.body.month_1),
        parseNumber(req.body.month_2),
        parseNumber(req.body.month_3),
        parseNumber(req.body.month_4),
        parseNumber(req.body.month_5),
        parseNumber(req.body.month_6),
        parseNumber(req.body.month_7),
        parseNumber(req.body.month_8),
        parseNumber(req.body.month_9),
        parseNumber(req.body.month_10),
        parseNumber(req.body.month_11),
        parseNumber(req.body.month_12)
    ];

    const hasMonths = months.some(v => v !== 0);
    const normalizedMonths = hasMonths ? months : distributeMonthly(annualAmount);

    try {
        const result = await pool.query(
            `INSERT INTO finance_budget_lines (
                budget_id,
                account_id,
                account_code,
                account_name,
                annual_amount,
                month_1,
                month_2,
                month_3,
                month_4,
                month_5,
                month_6,
                month_7,
                month_8,
                month_9,
                month_10,
                month_11,
                month_12,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                notes,
                created_at
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW()
            ) RETURNING *`,
            [
                Number(req.body.budget_id),
                Number(req.body.account_id),
                req.body.account_code || null,
                req.body.account_name || null,
                annualAmount,
                parseNumber(normalizedMonths[0]),
                parseNumber(normalizedMonths[1]),
                parseNumber(normalizedMonths[2]),
                parseNumber(normalizedMonths[3]),
                parseNumber(normalizedMonths[4]),
                parseNumber(normalizedMonths[5]),
                parseNumber(normalizedMonths[6]),
                parseNumber(normalizedMonths[7]),
                parseNumber(normalizedMonths[8]),
                parseNumber(normalizedMonths[9]),
                parseNumber(normalizedMonths[10]),
                parseNumber(normalizedMonths[11]),
                entityType,
                entityId,
                normalizeText(req.body.branch_id),
                normalizeText(req.body.incubator_id),
                normalizeText(req.body.notes)
            ]
        );

        return res.status(201).json({ success: true, line: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating budget line:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function updateBudgetLine(req, res) {
    const lineId = Number(req.params.line_id);
    if (!lineId) {
        return res.status(400).json({ success: false, error: 'line_id is required' });
    }

    try {
        const result = await pool.query(
            `UPDATE finance_budget_lines SET
                budget_id = COALESCE($1, budget_id),
                account_id = COALESCE($2, account_id),
                account_code = COALESCE($3, account_code),
                account_name = COALESCE($4, account_name),
                annual_amount = COALESCE($5, annual_amount),
                month_1 = COALESCE($6, month_1),
                month_2 = COALESCE($7, month_2),
                month_3 = COALESCE($8, month_3),
                month_4 = COALESCE($9, month_4),
                month_5 = COALESCE($10, month_5),
                month_6 = COALESCE($11, month_6),
                month_7 = COALESCE($12, month_7),
                month_8 = COALESCE($13, month_8),
                month_9 = COALESCE($14, month_9),
                month_10 = COALESCE($15, month_10),
                month_11 = COALESCE($16, month_11),
                month_12 = COALESCE($17, month_12),
                entity_type = COALESCE($18, entity_type),
                entity_id = COALESCE($19, entity_id),
                branch_id = COALESCE($20, branch_id),
                incubator_id = COALESCE($21, incubator_id),
                notes = COALESCE($22, notes)
            WHERE line_id = $23
            RETURNING *`,
            [
                req.body.budget_id ? Number(req.body.budget_id) : null,
                req.body.account_id ? Number(req.body.account_id) : null,
                req.body.account_code || null,
                req.body.account_name || null,
                req.body.annual_amount !== undefined && req.body.annual_amount !== null && req.body.annual_amount !== '' ? parseNumber(req.body.annual_amount) : null,
                req.body.month_1 !== undefined ? parseNumber(req.body.month_1, null) : null,
                req.body.month_2 !== undefined ? parseNumber(req.body.month_2, null) : null,
                req.body.month_3 !== undefined ? parseNumber(req.body.month_3, null) : null,
                req.body.month_4 !== undefined ? parseNumber(req.body.month_4, null) : null,
                req.body.month_5 !== undefined ? parseNumber(req.body.month_5, null) : null,
                req.body.month_6 !== undefined ? parseNumber(req.body.month_6, null) : null,
                req.body.month_7 !== undefined ? parseNumber(req.body.month_7, null) : null,
                req.body.month_8 !== undefined ? parseNumber(req.body.month_8, null) : null,
                req.body.month_9 !== undefined ? parseNumber(req.body.month_9, null) : null,
                req.body.month_10 !== undefined ? parseNumber(req.body.month_10, null) : null,
                req.body.month_11 !== undefined ? parseNumber(req.body.month_11, null) : null,
                req.body.month_12 !== undefined ? parseNumber(req.body.month_12, null) : null,
                req.body.entity_type || null,
                req.body.entity_id || null,
                normalizeText(req.body.branch_id),
                normalizeText(req.body.incubator_id),
                normalizeText(req.body.notes),
                lineId
            ]
        );

        if (!result.rowCount) {
            return res.status(404).json({ success: false, error: 'لم يتم العثور على بند الميزانية' });
        }

        return res.json({ success: true, line: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating budget line:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteBudgetLine(req, res) {
    const lineId = Number(req.params.line_id);
    if (!lineId) {
        return res.status(400).json({ success: false, error: 'line_id is required' });
    }

    try {
        const result = await pool.query('DELETE FROM finance_budget_lines WHERE line_id = $1', [lineId]);
        if (!result.rowCount) {
            return res.status(404).json({ success: false, error: 'لم يتم العثور على بند الميزانية' });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting budget line:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function createVariance(req, res) {
    const entityId = req.body.entity_id || req.headers['x-entity-id'] || DEFAULT_ENTITY_ID;
    const entityType = req.body.entity_type || req.headers['x-entity-type'] || DEFAULT_ENTITY_TYPE;

    const required = ['fiscal_year', 'fiscal_period', 'account_id', 'budgeted_amount', 'actual_amount'];
    for (const field of required) {
        if (!req.body[field]) {
            return res.status(400).json({ success: false, error: `${field} is required` });
        }
    }

    const budgeted = parseNumber(req.body.budgeted_amount);
    const actual = parseNumber(req.body.actual_amount);
    const varianceAmount = actual - budgeted;
    const variancePct = budgeted !== 0 ? Number(((varianceAmount / budgeted) * 100).toFixed(2)) : 0;

    try {
        const result = await pool.query(
            `INSERT INTO finance_budget_variances (
                fiscal_year,
                fiscal_period,
                period_name,
                account_id,
                account_code,
                budgeted_amount,
                actual_amount,
                variance_amount,
                variance_percentage,
                variance_type,
                significance_level,
                ai_explanation,
                ai_recommendations,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                created_at,
                analyzed_at
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW()
            ) RETURNING *`,
            [
                parseInt(req.body.fiscal_year, 10),
                parseInt(req.body.fiscal_period, 10),
                req.body.period_name || null,
                Number(req.body.account_id),
                req.body.account_code || null,
                budgeted,
                actual,
                varianceAmount,
                variancePct,
                req.body.variance_type || (varianceAmount >= 0 ? 'unfavorable' : 'favorable'),
                req.body.significance_level || 'medium',
                req.body.ai_explanation || null,
                req.body.ai_recommendations || null,
                entityType,
                entityId,
                normalizeText(req.body.branch_id),
                normalizeText(req.body.incubator_id)
            ]
        );

        return res.status(201).json({ success: true, variance: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating variance:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function updateVariance(req, res) {
    const varianceId = Number(req.params.variance_id);
    if (!varianceId) {
        return res.status(400).json({ success: false, error: 'variance_id is required' });
    }

    const budgeted = req.body.budgeted_amount !== undefined ? parseNumber(req.body.budgeted_amount) : null;
    const actual = req.body.actual_amount !== undefined ? parseNumber(req.body.actual_amount) : null;
    const varianceAmount = budgeted !== null && actual !== null ? actual - budgeted : null;
    const variancePct = budgeted !== null && budgeted !== 0 && varianceAmount !== null
        ? Number(((varianceAmount / budgeted) * 100).toFixed(2))
        : null;

    try {
        const result = await pool.query(
            `UPDATE finance_budget_variances SET
                fiscal_year = COALESCE($1, fiscal_year),
                fiscal_period = COALESCE($2, fiscal_period),
                period_name = COALESCE($3, period_name),
                account_id = COALESCE($4, account_id),
                account_code = COALESCE($5, account_code),
                budgeted_amount = COALESCE($6, budgeted_amount),
                actual_amount = COALESCE($7, actual_amount),
                variance_amount = COALESCE($8, variance_amount),
                variance_percentage = COALESCE($9, variance_percentage),
                variance_type = COALESCE($10, variance_type),
                significance_level = COALESCE($11, significance_level),
                ai_explanation = COALESCE($12, ai_explanation),
                ai_recommendations = COALESCE($13, ai_recommendations),
                entity_type = COALESCE($14, entity_type),
                entity_id = COALESCE($15, entity_id),
                branch_id = COALESCE($16, branch_id),
                incubator_id = COALESCE($17, incubator_id),
                analyzed_at = NOW()
            WHERE variance_id = $18
            RETURNING *`,
            [
                req.body.fiscal_year ? parseInt(req.body.fiscal_year, 10) : null,
                req.body.fiscal_period ? parseInt(req.body.fiscal_period, 10) : null,
                req.body.period_name || null,
                req.body.account_id ? Number(req.body.account_id) : null,
                req.body.account_code || null,
                budgeted,
                actual,
                varianceAmount,
                variancePct,
                req.body.variance_type || null,
                req.body.significance_level || null,
                req.body.ai_explanation || null,
                req.body.ai_recommendations || null,
                req.body.entity_type || null,
                req.body.entity_id || null,
                normalizeText(req.body.branch_id),
                normalizeText(req.body.incubator_id),
                varianceId
            ]
        );

        if (!result.rowCount) {
            return res.status(404).json({ success: false, error: 'لم يتم العثور على الانحراف' });
        }

        return res.json({ success: true, variance: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating variance:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteVariance(req, res) {
    const varianceId = Number(req.params.variance_id);
    if (!varianceId) {
        return res.status(400).json({ success: false, error: 'variance_id is required' });
    }

    try {
        const result = await pool.query('DELETE FROM finance_budget_variances WHERE variance_id = $1', [varianceId]);
        if (!result.rowCount) {
            return res.status(404).json({ success: false, error: 'لم يتم العثور على الانحراف' });
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting variance:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

async function testConnection(req, res) {
    try {
        const result = await pool.query('SELECT NOW()');
        return res.json({
            success: true,
            message: 'Database connected successfully',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('❌ Database connection error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    createBudgetLine,
    updateBudgetLine,
    deleteBudgetLine,
    createVariance,
    updateVariance,
    deleteVariance,
    testConnection
};
