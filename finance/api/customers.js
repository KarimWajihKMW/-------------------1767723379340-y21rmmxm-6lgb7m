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

/**
 * Get all customers
 */
async function getCustomers(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

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
    testConnection
};
