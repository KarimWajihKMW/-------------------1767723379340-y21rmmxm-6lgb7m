/**
 * 💳 Payments API
 * Page 6 of Accounting System
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
 * Get all payments
 */
async function getPayments(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`💳 Fetching payments for entity ${entity_id}...`);

        const query = `
            SELECT 
                payment_id,
                payment_number,
                payment_date,
                customer_id,
                customer_name,
                payment_amount,
                payment_method,
                payment_type,
                bank_name,
                check_number,
                transaction_reference,
                status,
                notes,
                entity_id,
                created_at
            FROM finance_payments
            WHERE entity_id = $1 OR entity_id IS NULL
            ORDER BY payment_date DESC, payment_id DESC
        `;

        const result = await pool.query(query, [entity_id]);
        const payments = result.rows;

        const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.payment_amount || 0), 0);
        const uniqueCustomers = new Set(payments.map(p => p.customer_id || p.customer_name || 'unknown')).size;

        const statusCounts = payments.reduce((acc, p) => {
            const s = (p.status || 'UNKNOWN').toUpperCase();
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        const statusLabel = Object.keys(statusCounts).length
            ? Object.entries(statusCounts).map(([k, v]) => `${k}:${v}`).join(' | ')
            : '—';

        console.log(`✅ Found ${payments.length} payments`);

        res.json({
            success: true,
            payments,
            summary: {
                total_payments: payments.length,
                total_amount: totalAmount,
                unique_customers: uniqueCustomers,
                status_counts: statusCounts,
                status_label: statusLabel
            }
        });
    } catch (error) {
        console.error('❌ Error fetching payments:', error);
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
    getPayments,
    testConnection
};
