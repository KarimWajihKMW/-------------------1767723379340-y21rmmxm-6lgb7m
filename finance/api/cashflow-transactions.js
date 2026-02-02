/**
 * 💸 Cashflow Transactions API
 * Page 11 of Accounting System
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

async function getCashflowTransactions(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`💸 Fetching cashflow transactions for entity ${entity_id}...`);

        const query = `
            SELECT 
                cashflow_id,
                transaction_date,
                fiscal_year,
                fiscal_period,
                flow_type,
                flow_category,
                amount,
                flow_direction,
                description,
                reference_type,
                reference_id,
                entity_id,
                created_at
            FROM finance_cashflow
            WHERE entity_id = $1 OR entity_id IS NULL
            ORDER BY transaction_date DESC, cashflow_id DESC
        `;

        const result = await pool.query(query, [entity_id]);
        const transactions = result.rows;

        const summary = transactions.reduce((acc, t) => {
            acc.total_transactions += 1;
            if ((t.flow_direction || '').toUpperCase() === 'IN') {
                acc.total_in += parseFloat(t.amount || 0);
            } else {
                acc.total_out += parseFloat(t.amount || 0);
            }
            return acc;
        }, { total_transactions: 0, total_in: 0, total_out: 0 });

        summary.total_net = summary.total_in - summary.total_out;

        res.json({
            success: true,
            transactions,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching cashflow transactions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function createCashflowTransaction(req, res) {
    const {
        entity_id,
        transaction_date,
        fiscal_year,
        fiscal_period,
        flow_type,
        flow_category,
        amount,
        flow_direction,
        description,
        reference_type,
        reference_id
    } = req.body || {};

    if (!entity_id || !transaction_date || !flow_type || !flow_category || !flow_direction || !description) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: entity_id, transaction_date, flow_type, flow_category, flow_direction, description'
        });
    }

    const numericAmount = parseFloat(amount || 0);
    if (!numericAmount) {
        return res.status(400).json({
            success: false,
            error: 'amount is required'
        });
    }

    try {
        const normalizedReferenceId = reference_id ? parseInt(reference_id, 10) : null;
        const safeReferenceId = Number.isNaN(normalizedReferenceId) ? null : normalizedReferenceId;
        const result = await pool.query(
            `INSERT INTO finance_cashflow
             (transaction_date, fiscal_year, fiscal_period, flow_type, flow_category, amount, flow_direction, description, reference_type, reference_id, entity_type, entity_id, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
             RETURNING *`,
            [
                transaction_date,
                fiscal_year || null,
                fiscal_period || null,
                String(flow_type || '').toUpperCase(),
                flow_category,
                numericAmount,
                String(flow_direction || '').toUpperCase(),
                description,
                reference_type || null,
                safeReferenceId,
                'HQ',
                entity_id
            ]
        );

        res.json({ success: true, transaction: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating cashflow transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updateCashflowTransaction(req, res) {
    const { cashflow_id } = req.params;
    const {
        entity_id,
        transaction_date,
        fiscal_year,
        fiscal_period,
        flow_type,
        flow_category,
        amount,
        flow_direction,
        description,
        reference_type,
        reference_id
    } = req.body || {};

    if (!cashflow_id || !entity_id || !transaction_date || !flow_type || !flow_category || !flow_direction || !description) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: cashflow_id, entity_id, transaction_date, flow_type, flow_category, flow_direction, description'
        });
    }

    const numericAmount = parseFloat(amount || 0);
    if (!numericAmount) {
        return res.status(400).json({
            success: false,
            error: 'amount is required'
        });
    }

    try {
        const normalizedReferenceId = reference_id ? parseInt(reference_id, 10) : null;
        const safeReferenceId = Number.isNaN(normalizedReferenceId) ? null : normalizedReferenceId;
        const existing = await pool.query(
            'SELECT cashflow_id, entity_id FROM finance_cashflow WHERE cashflow_id = $1',
            [cashflow_id]
        );
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }
        if (existing.rows[0].entity_id && existing.rows[0].entity_id !== entity_id) {
            return res.status(403).json({ success: false, error: 'لا يمكن تعديل معاملة كيان آخر' });
        }

        const result = await pool.query(
            `UPDATE finance_cashflow
             SET transaction_date = $1,
                 fiscal_year = $2,
                 fiscal_period = $3,
                 flow_type = $4,
                 flow_category = $5,
                 amount = $6,
                 flow_direction = $7,
                 description = $8,
                 reference_type = $9,
                 reference_id = $10
             WHERE cashflow_id = $11
             RETURNING *`,
            [
                transaction_date,
                fiscal_year || null,
                fiscal_period || null,
                String(flow_type || '').toUpperCase(),
                flow_category,
                numericAmount,
                String(flow_direction || '').toUpperCase(),
                description,
                reference_type || null,
                safeReferenceId,
                cashflow_id
            ]
        );

        res.json({ success: true, transaction: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating cashflow transaction:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteCashflowTransaction(req, res) {
    const { cashflow_id } = req.params;
    const { entity_id } = req.query;

    if (!cashflow_id || !entity_id) {
        return res.status(400).json({ success: false, error: 'cashflow_id and entity_id are required' });
    }

    try {
        const existing = await pool.query(
            'SELECT cashflow_id, entity_id FROM finance_cashflow WHERE cashflow_id = $1',
            [cashflow_id]
        );
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }
        if (existing.rows[0].entity_id && existing.rows[0].entity_id !== entity_id) {
            return res.status(403).json({ success: false, error: 'لا يمكن حذف معاملة كيان آخر' });
        }

        await pool.query('DELETE FROM finance_cashflow WHERE cashflow_id = $1', [cashflow_id]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting cashflow transaction:', error);
        res.status(500).json({ success: false, error: error.message });
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
    getCashflowTransactions,
    createCashflowTransaction,
    updateCashflowTransaction,
    deleteCashflowTransaction,
    testConnection
};
