/**
 * 💧 Cashflow Summary API
 * Page 9 of Accounting System
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

async function getCashflowSummary(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`💧 Fetching cashflow summary for entity ${entity_id}...`);

        const query = `
            SELECT flow_type, fiscal_year, fiscal_period,
                   cash_in, cash_out, net_cashflow,
                   entity_id
            FROM finance_cashflow_summary
            WHERE entity_id = $1 OR entity_id IS NULL
            ORDER BY fiscal_year DESC, fiscal_period, flow_type
        `;

        const result = await pool.query(query, [entity_id]);
        const rows = result.rows;

        const summary = rows.reduce((acc, r) => {
            acc.total_in += parseFloat(r.cash_in || 0);
            acc.total_out += parseFloat(r.cash_out || 0);
            acc.total_net += parseFloat(r.net_cashflow || 0);
            acc.total_rows += 1;
            return acc;
        }, { total_in: 0, total_out: 0, total_net: 0, total_rows: 0 });

        res.json({
            success: true,
            rows,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching cashflow summary:', error);
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
    getCashflowSummary,
    testConnection
};
