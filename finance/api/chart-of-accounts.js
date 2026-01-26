/**
 * 📘 Chart of Accounts API
 * Page 5 of Accounting System
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
 * Get all accounts with balances
 */
async function getChartOfAccounts(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📘 Fetching chart of accounts for entity ${entity_id}...`);

        const query = `
            SELECT 
                a.account_id,
                a.account_code,
                a.account_name_ar,
                a.account_name_en,
                a.account_type,
                a.parent_account_id,
                a.level,
                a.is_active,
                a.is_header,
                a.normal_balance,
                a.description,
                a.notes,
                COALESCE(b.total_debit, 0) AS total_debit,
                COALESCE(b.total_credit, 0) AS total_credit,
                COALESCE(b.balance, 0) AS balance
            FROM finance_accounts a
            LEFT JOIN finance_account_balances b
                ON a.account_id = b.account_id
                AND (b.entity_id = $1 OR b.entity_id IS NULL)
            WHERE a.entity_id = $1 OR a.entity_id IS NULL
            ORDER BY a.account_code
        `;

        const result = await pool.query(query, [entity_id]);

        const accounts = result.rows;

        const summary = {
            total_accounts: accounts.length,
            asset_accounts: accounts.filter(a => a.account_type === 'ASSET').length,
            liability_accounts: accounts.filter(a => a.account_type === 'LIABILITY').length,
            equity_accounts: accounts.filter(a => a.account_type === 'EQUITY').length,
            revenue_accounts: accounts.filter(a => a.account_type === 'REVENUE').length,
            expense_accounts: accounts.filter(a => a.account_type === 'EXPENSE').length
        };

        console.log(`✅ Found ${accounts.length} accounts`);

        res.json({
            success: true,
            accounts,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching chart of accounts:', error);
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
    getChartOfAccounts,
    testConnection
};
