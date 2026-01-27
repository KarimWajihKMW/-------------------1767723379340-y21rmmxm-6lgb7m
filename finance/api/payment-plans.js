/**
 * 📆 Payment Plans API
 * Page 21 of Accounting System
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

async function getPaymentPlans(req, res) {
    const { entity_id, status, from_date, to_date, plan_number, customer_name, invoice_number } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📆 Fetching payment plans for entity ${entity_id}...`);

        const planConditions = ['(p.entity_id = $1 OR p.entity_id IS NULL)'];
        const planValues = [entity_id];
        let pIndex = 2;

        if (status) {
            planConditions.push(`LOWER(p.status) = LOWER($${pIndex})`);
            planValues.push(status);
            pIndex++;
        }
        if (plan_number) {
            planConditions.push(`p.plan_number ILIKE $${pIndex}`);
            planValues.push(`%${plan_number}%`);
            pIndex++;
        }
        if (customer_name) {
            planConditions.push(`(c.customer_name_ar ILIKE $${pIndex} OR c.customer_name_en ILIKE $${pIndex})`);
            planValues.push(`%${customer_name}%`);
            pIndex++;
        }
        if (invoice_number) {
            planConditions.push(`i.invoice_number ILIKE $${pIndex}`);
            planValues.push(`%${invoice_number}%`);
            pIndex++;
        }
        if (from_date) {
            planConditions.push(`p.start_date >= $${pIndex}`);
            planValues.push(from_date);
            pIndex++;
        }
        if (to_date) {
            planConditions.push(`p.end_date <= $${pIndex}`);
            planValues.push(to_date);
            pIndex++;
        }

        const plansQuery = `
            SELECT
                p.plan_id,
                p.plan_number,
                p.customer_id,
                p.invoice_id,
                p.start_date,
                p.end_date,
                p.total_amount,
                p.paid_amount,
                p.remaining_amount,
                p.number_of_installments,
                p.installment_amount,
                p.installment_frequency,
                p.status,
                p.risk_score_at_creation,
                p.risk_level_at_creation,
                p.entity_type,
                p.entity_id,
                p.branch_id,
                p.incubator_id,
                p.created_at,
                p.updated_at,
                p.created_by,
                p.approved_by,
                p.approved_at,
                c.customer_code,
                c.customer_name_ar,
                c.customer_name_en,
                c.customer_type,
                i.invoice_number,
                i.invoice_date,
                i.status AS invoice_status,
                i.payment_status AS invoice_payment_status
            FROM finance_payment_plans
            p
            LEFT JOIN finance_customers c ON c.customer_id = p.customer_id
            LEFT JOIN finance_invoices i ON i.invoice_id = p.invoice_id
            WHERE ${planConditions.join(' AND ')}
            ORDER BY p.start_date DESC, p.plan_id DESC
        `;

        const plansResult = await pool.query(plansQuery, planValues);
        const plans = plansResult.rows;

        const allocationsQuery = `
            SELECT
                a.allocation_id,
                a.payment_id,
                a.invoice_id,
                a.allocated_amount,
                a.created_at,
                p.payment_number,
                p.payment_date,
                p.payment_amount,
                p.payment_method,
                p.status AS payment_status,
                p.entity_id AS payment_entity_id,
                i.invoice_number,
                i.invoice_date,
                i.status AS invoice_status,
                c.customer_id,
                c.customer_name_ar,
                c.customer_name_en
            FROM finance_payment_allocations a
            LEFT JOIN finance_payments p ON p.payment_id = a.payment_id
            LEFT JOIN finance_invoices i ON i.invoice_id = a.invoice_id
            LEFT JOIN finance_customers c ON c.customer_id = i.customer_id
            WHERE (p.entity_id = $1 OR p.entity_id IS NULL)
            ORDER BY a.created_at DESC, a.allocation_id DESC
        `;

        const allocationsResult = await pool.query(allocationsQuery, [entity_id]);
        const allocations = allocationsResult.rows;

        const summary = plans.reduce((acc, plan) => {
            acc.total_plans += 1;
            acc.total_amount += parseFloat(plan.total_amount || 0);
            acc.total_paid += parseFloat(plan.paid_amount || 0);
            acc.total_remaining += parseFloat(plan.remaining_amount || 0);
            const statusKey = (plan.status || 'غير محدد').toLowerCase();
            acc.by_status[statusKey] = (acc.by_status[statusKey] || 0) + 1;
            return acc;
        }, {
            total_plans: 0,
            total_amount: 0,
            total_paid: 0,
            total_remaining: 0,
            by_status: {}
        });

        summary.total_allocations = allocations.length;
        summary.total_allocated_amount = allocations.reduce((sum, a) => sum + parseFloat(a.allocated_amount || 0), 0);
        summary.entity_id = entity_id;
        summary.generated_at = new Date().toISOString();

        res.json({
            success: true,
            plans,
            allocations,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching payment plans:', error);
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
    getPaymentPlans,
    testConnection
};
