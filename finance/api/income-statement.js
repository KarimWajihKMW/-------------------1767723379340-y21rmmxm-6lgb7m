/**
 * 📈 Income Statement API
 * Page 4 of Accounting System
 * Uses finance_account_balances to calculate revenue/expenses
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

/**
 * Get income statement (revenues, expenses, totals)
 */
async function getIncomeStatement(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📈 Fetching income statement for entity ${entity_id}...`);

        const query = `
            SELECT account_id, account_code, account_name_ar, account_type,
                   total_debit, total_credit, balance, entity_id
            FROM finance_account_balances
            WHERE (entity_id = $1 OR entity_id IS NULL)
              AND account_type IN ('REVENUE', 'EXPENSE')
            ORDER BY account_code
        `;

        const result = await pool.query(query, [entity_id]);

        const revenueAccounts = result.rows.filter(a => a.account_type === 'REVENUE');
        const expenseAccounts = result.rows.filter(a => a.account_type === 'EXPENSE');

        const totalRevenue = revenueAccounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);
        const totalExpenses = expenseAccounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);
        const netIncome = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

        res.json({
            success: true,
            revenue_accounts: revenueAccounts,
            expense_accounts: expenseAccounts,
            totals: {
                total_revenue: totalRevenue,
                total_expenses: totalExpenses,
                net_income: netIncome,
                profit_margin: profitMargin
            },
            counts: {
                revenue_accounts: revenueAccounts.length,
                expense_accounts: expenseAccounts.length,
                total_accounts: revenueAccounts.length + expenseAccounts.length
            }
        });

    } catch (error) {
        console.error('❌ Error fetching income statement:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Test database connection
 */
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
    getIncomeStatement,
    testConnection
};
