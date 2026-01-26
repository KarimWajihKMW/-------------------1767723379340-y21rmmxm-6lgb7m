/**
 * 📆 Payment Plans API
 * Page 16 of Accounting System
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
    const { entity_id, status, from_date, to_date } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📆 Fetching payment plans for entity ${entity_id}...`);

        const planConditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const planValues = [entity_id];
        let pIndex = 2;

        if (status) {
            planConditions.push(`LOWER(status) = LOWER($${pIndex})`);
            planValues.push(status);
            pIndex++;
        }
        if (from_date) {
            planConditions.push(`start_date >= $${pIndex}`);
            planValues.push(from_date);
            pIndex++;
        }
        if (to_date) {
            planConditions.push(`end_date <= $${pIndex}`);
            planValues.push(to_date);
            pIndex++;
        }

        const plansQuery = `
            SELECT
                plan_id,
                plan_number,
                customer_id,
                invoice_id,
                start_date,
                end_date,
                total_amount,
                paid_amount,
                remaining_amount,
                number_of_installments,
                installment_amount,
                installment_frequency,
                status,
                risk_score_at_creation,
                risk_level_at_creation,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                created_at,
                updated_at,
                created_by,
                approved_by,
                approved_at
            FROM finance_payment_plans
            WHERE ${planConditions.join(' AND ')}
            ORDER BY start_date DESC, plan_id DESC
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
                p.entity_id AS payment_entity_id
            FROM finance_payment_allocations a
            LEFT JOIN finance_payments p ON p.payment_id = a.payment_id
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
