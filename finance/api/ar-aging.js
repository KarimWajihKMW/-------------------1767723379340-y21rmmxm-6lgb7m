/**
 * 🧮 AR Aging API
 * Page 24 of Accounting System
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
    const { entity_id, status, aging_category, from_date, to_date, invoice_number, customer_name, customer_code } = req.query;

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
        if (invoice_number) {
            conditions.push(`invoice_number ILIKE $${index}`);
            values.push(`%${invoice_number}%`);
            index++;
        }
        if (customer_name) {
            conditions.push(`(customer_name_ar ILIKE $${index} OR customer_name_en ILIKE $${index})`);
            values.push(`%${customer_name}%`);
            index++;
        }
        if (customer_code) {
            conditions.push(`customer_code ILIKE $${index}`);
            values.push(`%${customer_code}%`);
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
            WITH aging AS (
                SELECT
                    i.invoice_id,
                    i.invoice_number,
                    i.invoice_date,
                    i.due_date,
                    c.customer_id,
                    c.customer_code,
                    c.customer_name_ar,
                    c.customer_name_en,
                    c.customer_type,
                    i.total_amount,
                    i.paid_amount,
                    i.remaining_amount,
                    i.status,
                    i.payment_status,
                    CURRENT_DATE - i.due_date AS days_overdue,
                    CASE 
                        WHEN CURRENT_DATE <= i.due_date THEN 'CURRENT'
                        WHEN CURRENT_DATE - i.due_date BETWEEN 1 AND 30 THEN '1-30_DAYS'
                        WHEN CURRENT_DATE - i.due_date BETWEEN 31 AND 60 THEN '31-60_DAYS'
                        WHEN CURRENT_DATE - i.due_date BETWEEN 61 AND 90 THEN '61-90_DAYS'
                        ELSE 'OVER_90_DAYS'
                    END AS aging_category,
                    i.entity_type,
                    i.entity_id,
                    i.branch_id,
                    i.incubator_id
                FROM finance_invoices i
                JOIN finance_customers c ON i.customer_id = c.customer_id
                WHERE i.remaining_amount > 0
                  AND i.status IN ('ISSUED', 'PARTIAL', 'OVERDUE')
            )
            SELECT *
            FROM aging
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

        summary.entity_id = entity_id;
        summary.generated_at = new Date().toISOString();

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
