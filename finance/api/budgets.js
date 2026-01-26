/**
 * 📑 Budgets API
 * Page 15 of Accounting System
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

async function getBudgets(req, res) {
    const { entity_id, fiscal_year, budget_type, scenario, status, fiscal_period } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
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

        const linesConditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const linesValues = [entity_id];
        let lIndex = 2;

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
            WHERE ${linesConditions.join(' AND ')}
            ORDER BY line_id DESC
        `;

        const linesResult = await pool.query(linesQuery, linesValues);
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
            total_budget_amount: lines.reduce((sum, l) => sum + parseFloat(l.annual_amount || 0), 0),
            total_budgeted: variances.reduce((sum, v) => sum + parseFloat(v.budgeted_amount || 0), 0),
            total_actual: variances.reduce((sum, v) => sum + parseFloat(v.actual_amount || 0), 0),
            total_variance: variances.reduce((sum, v) => sum + parseFloat(v.variance_amount || 0), 0),
            by_type: {}
        };

        budgets.forEach(b => {
            const key = (b.budget_type || 'غير محدد').toLowerCase();
            summary.by_type[key] = (summary.by_type[key] || 0) + 1;
        });

        res.json({
            success: true,
            budgets,
            lines,
            variances,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching budgets:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function testConnection(req, res) {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            message: 'Database connected successfully',
            timestamp: result.rows[0].now
        });
    } catch (error) {
        console.error('❌ Database connection error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    getBudgets,
    testConnection
};
