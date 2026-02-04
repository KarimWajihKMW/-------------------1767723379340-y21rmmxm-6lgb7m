/**
 * 📆 Plan Installments API
 * Page 22 of Accounting System
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
    const { entity_id, status, from_date, to_date, plan_status, plan_number, customer_name, invoice_number } = req.query;

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
        if (plan_number) {
            conditions.push(`p.plan_number ILIKE $${index}`);
            values.push(`%${plan_number}%`);
            index++;
        }
        if (customer_name) {
            conditions.push(`(c.customer_name_ar ILIKE $${index} OR c.customer_name_en ILIKE $${index})`);
            values.push(`%${customer_name}%`);
            index++;
        }
        if (invoice_number) {
            conditions.push(`inv.invoice_number ILIKE $${index}`);
            values.push(`%${invoice_number}%`);
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
                pay.status AS payment_status,
                c.customer_code,
                c.customer_name_ar,
                c.customer_name_en,
                c.customer_type,
                inv.invoice_number,
                inv.invoice_date,
                inv.status AS invoice_status,
                inv.payment_status AS invoice_payment_status
            FROM finance_plan_installments i
            LEFT JOIN finance_payment_plans p ON p.plan_id = i.plan_id
            LEFT JOIN finance_payments pay ON pay.payment_id = i.payment_id
            LEFT JOIN finance_customers c ON c.customer_id = p.customer_id
            LEFT JOIN finance_invoices inv ON inv.invoice_id = p.invoice_id
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

        summary.entity_id = entity_id;
        summary.generated_at = new Date().toISOString();

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

async function createPlanInstallment(req, res) {
    const { entity_id } = req.query;
    const {
        plan_id,
        installment_number,
        due_date,
        amount,
        paid_amount = 0,
        status = 'PENDING',
        paid_date = null,
        payment_id = null
    } = req.body || {};

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    if (!plan_id || !installment_number || !due_date || !amount) {
        return res.status(400).json({
            success: false,
            error: 'plan_id, installment_number, due_date, and amount are required'
        });
    }

    try {
        const planCheck = await pool.query(
            `
            SELECT plan_id
            FROM finance_payment_plans
            WHERE plan_id = $1
              AND (entity_id = $2 OR entity_id IS NULL)
            `,
            [plan_id, entity_id]
        );

        if (!planCheck.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'plan not found'
            });
        }

        const insertQuery = `
            INSERT INTO finance_plan_installments (
                plan_id, installment_number, due_date, amount, paid_amount, status, paid_date, payment_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *
        `;

        const result = await pool.query(insertQuery, [
            plan_id,
            installment_number,
            due_date,
            amount,
            paid_amount || 0,
            status,
            paid_date,
            payment_id
        ]);

        res.status(201).json({
            success: true,
            installment: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error creating plan installment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function updatePlanInstallment(req, res) {
    const { id } = req.params;
    const { entity_id } = req.query;
    const { due_date, amount, paid_amount, status, paid_date, payment_id } = req.body || {};

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    const updates = [];
    const values = [];
    let index = 1;

    if (due_date !== undefined) {
        updates.push(`due_date = $${index}`);
        values.push(due_date);
        index++;
    }
    if (amount !== undefined) {
        updates.push(`amount = $${index}`);
        values.push(amount);
        index++;
    }
    if (paid_amount !== undefined) {
        updates.push(`paid_amount = $${index}`);
        values.push(paid_amount);
        index++;
    }
    if (status !== undefined) {
        updates.push(`status = $${index}`);
        values.push(status);
        index++;
    }
    if (paid_date !== undefined) {
        updates.push(`paid_date = $${index}`);
        values.push(paid_date || null);
        index++;
    }
    if (payment_id !== undefined) {
        updates.push(`payment_id = $${index}`);
        values.push(payment_id || null);
        index++;
    }

    if (!updates.length) {
        return res.status(400).json({
            success: false,
            error: 'no fields provided to update'
        });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    try {
        const query = `
            UPDATE finance_plan_installments i
            SET ${updates.join(', ')}
            FROM finance_payment_plans p
            WHERE i.plan_id = p.plan_id
              AND i.installment_id = $${index}
              AND (p.entity_id = $${index + 1} OR p.entity_id IS NULL)
            RETURNING i.*
        `;

        values.push(id, entity_id);

        const result = await pool.query(query, values);

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'installment not found'
            });
        }

        res.json({
            success: true,
            installment: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error updating plan installment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function deletePlanInstallment(req, res) {
    const { id } = req.params;
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        const result = await pool.query(
            `
            DELETE FROM finance_plan_installments i
            USING finance_payment_plans p
            WHERE i.plan_id = p.plan_id
              AND i.installment_id = $1
              AND (p.entity_id = $2 OR p.entity_id IS NULL)
            RETURNING i.*
            `,
            [id, entity_id]
        );

        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                error: 'installment not found'
            });
        }

        res.json({
            success: true,
            installment: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error deleting plan installment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    createPlanInstallment,
    getPlanInstallments,
    testConnection,
    updatePlanInstallment,
    deletePlanInstallment
};
