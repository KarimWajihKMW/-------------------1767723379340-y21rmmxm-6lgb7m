/**
 * 👥 Customers API
 * Page 7 of Accounting System
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

function normalizeRiskFactors(input) {
    if (input === null || input === undefined) return null;
    if (typeof input === 'object') return input;
    const text = String(input).trim();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (error) {
        return { notes: text };
    }
}

async function generateNextNumber(prefix) {
    const result = await pool.query(
        `SELECT customer_code FROM finance_customers WHERE customer_code LIKE $1 ORDER BY customer_code DESC LIMIT 1`,
        [`${prefix}%`]
    );
    if (!result.rows.length) {
        return `${prefix}0001`;
    }
    const lastNumber = result.rows[0].customer_code || '';
    const numPart = parseInt(lastNumber.replace(prefix, ''), 10) || 0;
    const nextNum = numPart + 1;
    return `${prefix}${nextNum.toString().padStart(4, '0')}`;
}

/**
 * Get all customers
 */
async function getCustomers(req, res) {
    const entity_id = req.query.entity_id || req.headers['x-entity-id'] || 'HQ001';

    try {
        console.log(`👥 Fetching customers for entity ${entity_id}...`);

        const query = `
            SELECT 
                customer_id,
                customer_code,
                customer_name_ar,
                customer_name_en,
                customer_type,
                email,
                phone,
                mobile,
                address,
                city,
                country,
                tax_number,
                commercial_registration,
                credit_limit,
                credit_period_days,
                payment_terms,
                risk_score,
                risk_level,
                risk_factors,
                entity_id,
                is_active,
                is_blocked,
                blocked_reason,
                created_at
            FROM finance_customers
            WHERE entity_id = $1 OR entity_id IS NULL
            ORDER BY customer_id DESC
        `;

        const result = await pool.query(query, [entity_id]);
        const customers = result.rows;

        const summary = {
            total_customers: customers.length,
            active_customers: customers.filter(c => c.is_active && !c.is_blocked).length,
            blocked_customers: customers.filter(c => c.is_blocked).length,
            total_credit_limit: customers.reduce((sum, c) => sum + parseFloat(c.credit_limit || 0), 0)
        };

        console.log(`✅ Found ${customers.length} customers`);

        res.json({
            success: true,
            customers,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching customers:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Create customer
 */
async function createCustomer(req, res) {
    const {
        entity_id,
        customer_code,
        customer_name_ar,
        customer_name_en,
        customer_type,
        email,
        phone,
        mobile,
        address,
        city,
        country,
        tax_number,
        commercial_registration,
        credit_limit,
        credit_period_days,
        payment_terms,
        risk_score,
        risk_level,
        risk_factors,
        is_active,
        is_blocked,
        blocked_reason
    } = req.body || {};

    const resolvedEntityId = entity_id || req.headers['x-entity-id'] || 'HQ001';

    if (!resolvedEntityId || !customer_name_ar) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: entity_id, customer_name_ar'
        });
    }

    try {
        const generatedCode = customer_code && customer_code.trim().length
            ? customer_code.trim()
            : await generateNextNumber('CUST');

        const normalizedRiskFactors = normalizeRiskFactors(risk_factors);
        const result = await pool.query(
            `INSERT INTO finance_customers
             (customer_code, customer_name_ar, customer_name_en, customer_type, email, phone, mobile, address, city, country,
              tax_number, commercial_registration, credit_limit, credit_period_days, payment_terms, risk_score, risk_level,
              risk_factors, entity_id, is_active, is_blocked, blocked_reason, created_at, updated_at, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,NOW(),NOW(),$23)
             RETURNING *`,
            [
                generatedCode,
                customer_name_ar,
                customer_name_en || null,
                customer_type || 'COMPANY',
                email || null,
                phone || null,
                mobile || null,
                address || null,
                city || null,
                country || null,
                tax_number || null,
                commercial_registration || null,
                credit_limit ?? null,
                credit_period_days ?? null,
                payment_terms || null,
                risk_score ?? null,
                risk_level || null,
                normalizedRiskFactors ? JSON.stringify(normalizedRiskFactors) : null,
                resolvedEntityId,
                is_active !== false,
                !!is_blocked,
                blocked_reason || null,
                'SYSTEM'
            ]
        );

        res.json({ success: true, customer: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating customer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Update customer
 */
async function updateCustomer(req, res) {
    const { customer_id } = req.params;
    const {
        entity_id,
        customer_code,
        customer_name_ar,
        customer_name_en,
        customer_type,
        email,
        phone,
        mobile,
        address,
        city,
        country,
        tax_number,
        commercial_registration,
        credit_limit,
        credit_period_days,
        payment_terms,
        risk_score,
        risk_level,
        risk_factors,
        is_active,
        is_blocked,
        blocked_reason
    } = req.body || {};

    const resolvedEntityId = entity_id || req.headers['x-entity-id'] || req.query.entity_id || null;

    if (!customer_id || !resolvedEntityId || !customer_name_ar) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: customer_id, entity_id, customer_name_ar'
        });
    }

    try {
        const existing = await pool.query('SELECT customer_id, entity_id, customer_code FROM finance_customers WHERE customer_id = $1', [customer_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        if (existing.rows[0].entity_id && existing.rows[0].entity_id !== resolvedEntityId) {
            return res.status(403).json({ success: false, error: 'لا يمكن تعديل عميل كيان آخر' });
        }

        const normalizedRiskFactors = normalizeRiskFactors(risk_factors);
        const effectiveCode = customer_code && customer_code.trim().length
            ? customer_code.trim()
            : existing.rows[0].customer_code;

        if (!effectiveCode) {
            return res.status(400).json({ success: false, error: 'customer_code مفقود' });
        }
        const result = await pool.query(
            `UPDATE finance_customers
             SET customer_code = $1,
                 customer_name_ar = $2,
                 customer_name_en = $3,
                 customer_type = $4,
                 email = $5,
                 phone = $6,
                 mobile = $7,
                 address = $8,
                 city = $9,
                 country = $10,
                 tax_number = $11,
                 commercial_registration = $12,
                 credit_limit = $13,
                 credit_period_days = $14,
                 payment_terms = $15,
                 risk_score = $16,
                 risk_level = $17,
                 risk_factors = $18,
                 is_active = $19,
                 is_blocked = $20,
                 blocked_reason = $21,
                 updated_at = NOW()
             WHERE customer_id = $22
             RETURNING *`,
            [
                effectiveCode,
                customer_name_ar,
                customer_name_en || null,
                customer_type || 'COMPANY',
                email || null,
                phone || null,
                mobile || null,
                address || null,
                city || null,
                country || null,
                tax_number || null,
                commercial_registration || null,
                credit_limit ?? null,
                credit_period_days ?? null,
                payment_terms || null,
                risk_score ?? null,
                risk_level || null,
                normalizedRiskFactors ? JSON.stringify(normalizedRiskFactors) : null,
                is_active !== false,
                !!is_blocked,
                blocked_reason || null,
                customer_id
            ]
        );

        res.json({ success: true, customer: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating customer:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Delete customer (soft delete)
 */
async function deleteCustomer(req, res) {
    const { customer_id } = req.params;
    const entity_id = req.query.entity_id || req.headers['x-entity-id'] || null;

    if (!customer_id || !entity_id) {
        return res.status(400).json({ success: false, error: 'customer_id and entity_id are required' });
    }

    try {
        const existing = await pool.query('SELECT customer_id, entity_id FROM finance_customers WHERE customer_id = $1', [customer_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }
        if (existing.rows[0].entity_id && existing.rows[0].entity_id !== entity_id) {
            return res.status(403).json({ success: false, error: 'لا يمكن حذف عميل كيان آخر' });
        }

        try {
            const deleted = await pool.query(
                'DELETE FROM finance_customers WHERE customer_id = $1 RETURNING customer_id',
                [customer_id]
            );
            if (!deleted.rows.length) {
                return res.status(404).json({ success: false, error: 'Customer not found' });
            }
            return res.json({ success: true, message: 'تم حذف العميل' });
        } catch (deleteError) {
            await pool.query(
                `UPDATE finance_customers
                 SET is_active = false,
                     updated_at = NOW()
                 WHERE customer_id = $1`,
                [customer_id]
            );
            return res.json({ success: true, message: 'تم تعطيل العميل لوجود ارتباطات' });
        }
    } catch (error) {
        console.error('❌ Error deleting customer:', error);
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
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    testConnection
};
