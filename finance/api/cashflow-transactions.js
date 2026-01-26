/**
 * 💸 Cashflow Transactions API
 * Page 11 of Accounting System
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

async function getCashflowTransactions(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`💸 Fetching cashflow transactions for entity ${entity_id}...`);

        const query = `
            SELECT 
                cashflow_id,
                transaction_date,
                fiscal_year,
                fiscal_period,
                flow_type,
                flow_category,
                amount,
                flow_direction,
                description,
                reference_type,
                reference_id,
                entity_id,
                created_at
            FROM finance_cashflow
            WHERE entity_id = $1 OR entity_id IS NULL
            ORDER BY transaction_date DESC, cashflow_id DESC
        `;

        const result = await pool.query(query, [entity_id]);
        const transactions = result.rows;

        const summary = transactions.reduce((acc, t) => {
            acc.total_transactions += 1;
            if ((t.flow_direction || '').toUpperCase() === 'IN') {
                acc.total_in += parseFloat(t.amount || 0);
            } else {
                acc.total_out += parseFloat(t.amount || 0);
            }
            return acc;
        }, { total_transactions: 0, total_in: 0, total_out: 0 });

        summary.total_net = summary.total_in - summary.total_out;

        res.json({
            success: true,
            transactions,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching cashflow transactions:', error);
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
    getCashflowTransactions,
    testConnection
};
