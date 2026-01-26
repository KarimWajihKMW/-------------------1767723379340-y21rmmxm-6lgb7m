/**
 * 🧮 AR Aging API
 * Page 18 of Accounting System
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

async function getARAging(req, res) {
    const { entity_id, status, aging_category, from_date, to_date } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`🧮 Fetching AR aging for entity ${entity_id}...`);

        const conditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const values = [entity_id];
        let index = 2;

        if (status) {
            conditions.push(`LOWER(status) = LOWER($${index})`);
            values.push(status);
            index++;
        }
        if (aging_category) {
            conditions.push(`LOWER(aging_category) = LOWER($${index})`);
            values.push(aging_category);
            index++;
        }
        if (from_date) {
            conditions.push(`invoice_date >= $${index}`);
            values.push(from_date);
            index++;
        }
        if (to_date) {
            conditions.push(`invoice_date <= $${index}`);
            values.push(to_date);
            index++;
        }

        const query = `
            SELECT
                invoice_id,
                invoice_number,
                invoice_date,
                due_date,
                customer_id,
                customer_code,
                customer_name_ar,
                total_amount,
                paid_amount,
                remaining_amount,
                status,
                days_overdue,
                aging_category,
                entity_type,
                entity_id,
                branch_id,
                incubator_id
            FROM finance_ar_aging
            WHERE ${conditions.join(' AND ')}
            ORDER BY days_overdue DESC NULLS LAST, invoice_date DESC
        `;

        const result = await pool.query(query, values);
        const rows = result.rows;

        const summary = rows.reduce((acc, r) => {
            acc.total_invoices += 1;
            acc.total_amount += parseFloat(r.total_amount || 0);
            acc.total_paid += parseFloat(r.paid_amount || 0);
            acc.total_remaining += parseFloat(r.remaining_amount || 0);
            const bucket = (r.aging_category || 'غير محدد').toLowerCase();
            acc.by_bucket[bucket] = (acc.by_bucket[bucket] || 0) + parseFloat(r.remaining_amount || 0);
            const statusKey = (r.status || 'غير محدد').toLowerCase();
            acc.by_status[statusKey] = (acc.by_status[statusKey] || 0) + 1;
            return acc;
        }, {
            total_invoices: 0,
            total_amount: 0,
            total_paid: 0,
            total_remaining: 0,
            by_bucket: {},
            by_status: {}
        });

        res.json({
            success: true,
            rows,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching AR aging:', error);
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
    getARAging,
    testConnection
};
