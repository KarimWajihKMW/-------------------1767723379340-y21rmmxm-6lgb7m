/**
 * 📆 Plan Installments API
 * Page 19 of Accounting System
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

async function getPlanInstallments(req, res) {
    const { entity_id, status, from_date, to_date, plan_status } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📆 Fetching plan installments for entity ${entity_id}...`);

        const conditions = ['(p.entity_id = $1 OR p.entity_id IS NULL)'];
        const values = [entity_id];
        let index = 2;

        if (status) {
            conditions.push(`LOWER(i.status) = LOWER($${index})`);
            values.push(status);
            index++;
        }
        if (plan_status) {
            conditions.push(`LOWER(p.status) = LOWER($${index})`);
            values.push(plan_status);
            index++;
        }
        if (from_date) {
            conditions.push(`i.due_date >= $${index}`);
            values.push(from_date);
            index++;
        }
        if (to_date) {
            conditions.push(`i.due_date <= $${index}`);
            values.push(to_date);
            index++;
        }

        const query = `
            SELECT
                i.installment_id,
                i.plan_id,
                i.installment_number,
                i.due_date,
                i.amount,
                i.paid_amount,
                i.status,
                i.paid_date,
                i.payment_id,
                i.created_at,
                i.updated_at,
                p.plan_number,
                p.customer_id,
                p.invoice_id,
                p.start_date,
                p.end_date,
                p.total_amount AS plan_total_amount,
                p.paid_amount AS plan_paid_amount,
                p.remaining_amount AS plan_remaining_amount,
                p.number_of_installments,
                p.installment_amount AS plan_installment_amount,
                p.installment_frequency,
                p.status AS plan_status,
                p.risk_score_at_creation,
                p.risk_level_at_creation,
                p.entity_type,
                p.entity_id,
                p.branch_id,
                p.incubator_id,
                p.created_at AS plan_created_at,
                p.updated_at AS plan_updated_at,
                p.created_by AS plan_created_by,
                p.approved_by AS plan_approved_by,
                p.approved_at AS plan_approved_at,
                pay.payment_number,
                pay.payment_date,
                pay.payment_amount,
                pay.payment_method,
                pay.payment_type,
                pay.status AS payment_status
            FROM finance_plan_installments i
            LEFT JOIN finance_payment_plans p ON p.plan_id = i.plan_id
            LEFT JOIN finance_payments pay ON pay.payment_id = i.payment_id
            WHERE ${conditions.join(' AND ')}
            ORDER BY i.due_date DESC, i.installment_id DESC
        `;

        const result = await pool.query(query, values);
        const rows = result.rows;

        const summary = rows.reduce((acc, r) => {
            acc.total_installments += 1;
            acc.total_amount += parseFloat(r.amount || 0);
            acc.total_paid += parseFloat(r.paid_amount || 0);
            acc.total_remaining += Math.max(parseFloat(r.amount || 0) - parseFloat(r.paid_amount || 0), 0);
            const statusKey = (r.status || 'غير محدد').toLowerCase();
            acc.by_status[statusKey] = (acc.by_status[statusKey] || 0) + 1;
            return acc;
        }, {
            total_installments: 0,
            total_amount: 0,
            total_paid: 0,
            total_remaining: 0,
            by_status: {}
        });

        res.json({
            success: true,
            rows,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching plan installments:', error);
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
    getPlanInstallments,
    testConnection
};
