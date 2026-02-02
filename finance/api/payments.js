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
 * Create payment
 */
async function createPayment(req, res) {
    const {
        entity_id,
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
        notes
    } = req.body || {};

    if (!entity_id || !payment_date || !customer_id || !payment_amount || !payment_method) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: entity_id, payment_date, customer_id, payment_amount, payment_method'
        });
    }

    try {
        const generatedNumber = payment_number || `PAY-${Date.now()}`;
        const result = await pool.query(
            `
            INSERT INTO finance_payments
                (payment_number, payment_date, customer_id, customer_name, payment_amount, payment_method, payment_type,
                 bank_name, check_number, transaction_reference, status, notes, entity_id, created_by, created_at, updated_at)
            VALUES
                ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW())
            RETURNING *
            `,
            [
                generatedNumber,
                payment_date,
                customer_id,
                customer_name || null,
                payment_amount,
                payment_method,
                payment_type || 'FULL',
                bank_name || null,
                check_number || null,
                transaction_reference || null,
                status || 'COMPLETED',
                notes || null,
                entity_id,
                'SYSTEM'
            ]
        );

        res.json({ success: true, payment: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Update payment
 */
async function updatePayment(req, res) {
    const { payment_id } = req.params;
    const {
        entity_id,
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
        notes
    } = req.body || {};

    if (!payment_id || !entity_id || !payment_date || !customer_id || !payment_amount || !payment_method) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: payment_id, entity_id, payment_date, customer_id, payment_amount, payment_method'
        });
    }

    try {
        const existing = await pool.query('SELECT payment_id, entity_id FROM finance_payments WHERE payment_id = $1', [payment_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        if (existing.rows[0].entity_id && existing.rows[0].entity_id !== entity_id) {
            return res.status(403).json({ success: false, error: 'لا يمكن تعديل مدفوعة كيان آخر' });
        }

        const result = await pool.query(
            `
            UPDATE finance_payments
            SET payment_number = $1,
                payment_date = $2,
                customer_id = $3,
                customer_name = $4,
                payment_amount = $5,
                payment_method = $6,
                payment_type = $7,
                bank_name = $8,
                check_number = $9,
                transaction_reference = $10,
                status = $11,
                notes = $12,
                updated_at = NOW()
            WHERE payment_id = $13
            RETURNING *
            `,
            [
                payment_number,
                payment_date,
                customer_id,
                customer_name || null,
                payment_amount,
                payment_method,
                payment_type || 'FULL',
                bank_name || null,
                check_number || null,
                transaction_reference || null,
                status || 'COMPLETED',
                notes || null,
                payment_id
            ]
        );

        res.json({ success: true, payment: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating payment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Delete payment
 */
async function deletePayment(req, res) {
    const { payment_id } = req.params;
    const { entity_id } = req.query;

    if (!payment_id || !entity_id) {
        return res.status(400).json({ success: false, error: 'payment_id and entity_id are required' });
    }

    try {
        const existing = await pool.query('SELECT payment_id, entity_id FROM finance_payments WHERE payment_id = $1', [payment_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        if (existing.rows[0].entity_id && existing.rows[0].entity_id !== entity_id) {
            return res.status(403).json({ success: false, error: 'لا يمكن حذف مدفوعة كيان آخر' });
        }

        await pool.query('DELETE FROM finance_payments WHERE payment_id = $1', [payment_id]);
        res.json({ success: true, message: 'تم حذف المدفوعة' });
    } catch (error) {
        console.error('❌ Error deleting payment:', error);
        res.status(500).json({ success: false, error: error.message });
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
    createPayment,
    updatePayment,
    deletePayment,
    testConnection
};
