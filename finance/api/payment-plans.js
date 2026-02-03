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

async function createPaymentPlan(req, res) {
    try {
        const {
            plan_number,
            customer_id,
            invoice_id,
            start_date,
            end_date,
            total_amount,
            paid_amount = 0,
            number_of_installments,
            installment_amount,
            installment_frequency = 'MONTHLY',
            status = 'active',
            risk_score_at_creation = null,
            risk_level_at_creation = null,
            entity_type = 'HQ',
            entity_id = 'HQ001',
            branch_id = null,
            incubator_id = null,
            created_by = 'system'
        } = req.body || {};

        if (!plan_number || !customer_id || !invoice_id || !start_date || !total_amount || !number_of_installments || !installment_amount) {
            return res.status(400).json({ success: false, error: 'plan_number, customer_id, invoice_id, start_date, total_amount, number_of_installments, and installment_amount are required' });
        }

        const remaining_amount = parseFloat(total_amount) - parseFloat(paid_amount || 0);

        const insertQuery = `
            INSERT INTO finance_payment_plans (
                plan_number, customer_id, invoice_id, start_date, end_date, total_amount, paid_amount, remaining_amount,
                number_of_installments, installment_amount, installment_frequency, status, risk_score_at_creation, risk_level_at_creation,
                entity_type, entity_id, branch_id, incubator_id, created_by
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
            )
            ON CONFLICT (plan_number) DO UPDATE SET
                customer_id = EXCLUDED.customer_id,
                invoice_id = EXCLUDED.invoice_id,
                start_date = EXCLUDED.start_date,
                end_date = EXCLUDED.end_date,
                total_amount = EXCLUDED.total_amount,
                paid_amount = EXCLUDED.paid_amount,
                remaining_amount = EXCLUDED.remaining_amount,
                number_of_installments = EXCLUDED.number_of_installments,
                installment_amount = EXCLUDED.installment_amount,
                installment_frequency = EXCLUDED.installment_frequency,
                status = EXCLUDED.status,
                risk_score_at_creation = EXCLUDED.risk_score_at_creation,
                risk_level_at_creation = EXCLUDED.risk_level_at_creation,
                entity_type = EXCLUDED.entity_type,
                entity_id = EXCLUDED.entity_id,
                branch_id = EXCLUDED.branch_id,
                incubator_id = EXCLUDED.incubator_id,
                created_by = EXCLUDED.created_by,
                updated_at = NOW()
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
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
            created_by
        ]);

        res.status(201).json({ success: true, plan: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating payment plan:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updatePaymentPlan(req, res) {
    try {
        const { plan_id } = req.params;
        if (!plan_id) return res.status(400).json({ success: false, error: 'plan_id is required' });

        const fields = [
            'plan_number', 'customer_id', 'invoice_id', 'start_date', 'end_date', 'total_amount', 'paid_amount',
            'remaining_amount', 'number_of_installments', 'installment_amount', 'installment_frequency', 'status',
            'risk_score_at_creation', 'risk_level_at_creation', 'entity_type', 'entity_id', 'branch_id', 'incubator_id', 'updated_at'
        ];

        const payload = { ...req.body, updated_at: new Date() };
        const setClauses = [];
        const values = [];
        let idx = 1;

        for (const field of fields) {
            if (field in payload) {
                setClauses.push(`${field} = $${idx}`);
                values.push(payload[field]);
                idx++;
            }
        }

        if (!setClauses.length) {
            return res.status(400).json({ success: false, error: 'No fields provided to update' });
        }

        values.push(plan_id);
        const updateQuery = `UPDATE finance_payment_plans SET ${setClauses.join(', ')} WHERE plan_id = $${idx} RETURNING *`;
        const result = await pool.query(updateQuery, values);

        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Plan not found' });
        res.json({ success: true, plan: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating payment plan:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function deletePaymentPlan(req, res) {
    try {
        const { plan_id } = req.params;
        if (!plan_id) return res.status(400).json({ success: false, error: 'plan_id is required' });

        const result = await pool.query('DELETE FROM finance_payment_plans WHERE plan_id = $1 RETURNING plan_id', [plan_id]);
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Plan not found' });

        res.json({ success: true, deleted: result.rows[0].plan_id });
    } catch (error) {
        console.error('❌ Error deleting payment plan:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function createPaymentAllocation(req, res) {
    try {
        const { payment_id, invoice_id, allocated_amount } = req.body || {};

        if (!payment_id || !invoice_id || !allocated_amount) {
            return res.status(400).json({ success: false, error: 'payment_id, invoice_id, and allocated_amount are required' });
        }

        const insertQuery = `
            INSERT INTO finance_payment_allocations (payment_id, invoice_id, allocated_amount)
            VALUES ($1,$2,$3)
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [payment_id, invoice_id, allocated_amount]);
        res.status(201).json({ success: true, allocation: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating payment allocation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updatePaymentAllocation(req, res) {
    try {
        const { allocation_id } = req.params;
        if (!allocation_id) return res.status(400).json({ success: false, error: 'allocation_id is required' });

        const { payment_id, invoice_id, allocated_amount } = req.body || {};
        if (!payment_id || !invoice_id || !allocated_amount) {
            return res.status(400).json({ success: false, error: 'payment_id, invoice_id, and allocated_amount are required' });
        }

        const updateQuery = `
            UPDATE finance_payment_allocations
            SET payment_id = $1, invoice_id = $2, allocated_amount = $3
            WHERE allocation_id = $4
            RETURNING *;
        `;

        const result = await pool.query(updateQuery, [payment_id, invoice_id, allocated_amount, allocation_id]);
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Allocation not found' });
        res.json({ success: true, allocation: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating payment allocation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function deletePaymentAllocation(req, res) {
    try {
        const { allocation_id } = req.params;
        if (!allocation_id) return res.status(400).json({ success: false, error: 'allocation_id is required' });

        const result = await pool.query('DELETE FROM finance_payment_allocations WHERE allocation_id = $1 RETURNING allocation_id', [allocation_id]);
        if (!result.rows.length) return res.status(404).json({ success: false, error: 'Allocation not found' });

        res.json({ success: true, deleted: result.rows[0].allocation_id });
    } catch (error) {
        console.error('❌ Error deleting payment allocation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getPaymentPlans,
    testConnection,
    createPaymentPlan,
    updatePaymentPlan,
    deletePaymentPlan,
    createPaymentAllocation,
    updatePaymentAllocation,
    deletePaymentAllocation
};
