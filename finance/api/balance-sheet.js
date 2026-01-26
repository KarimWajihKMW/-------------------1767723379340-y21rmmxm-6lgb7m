/**
 * 📊 Balance Sheet API
 * Page 3 of Accounting System
 * Handles all balance sheet operations (Assets, Liabilities, Equity)
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    host: 'crossover.proxy.rlwy.net',
    port: 44255,
    database: 'railway',
    user: 'postgres',
    password: 'PddzJpAQYezqknsntSzmCUlQYuYJldcT',
    ssl: { rejectUnauthorized: false }
});

/**
 * Get balance sheet header info
 */
async function getBalanceSheet(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📊 Fetching balance sheet for entity ${entity_id}...`);

        const query = `
            SELECT *
            FROM finance_balance_sheet
            WHERE entity_id = $1
            ORDER BY sheet_date DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [entity_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Balance sheet not found'
            });
        }

        console.log(`✅ Found balance sheet for ${result.rows[0].period_type} period`);

        res.json({
            success: true,
            sheet: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error fetching balance sheet:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Get all assets
 */
async function getAssets(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`🏢 Fetching assets for entity ${entity_id}...`);

        const query = `
            SELECT *
            FROM finance_assets
            WHERE entity_id = $1
            ORDER BY 
                CASE asset_category
                    WHEN 'current' THEN 1
                    WHEN 'fixed' THEN 2
                    ELSE 3
                END,
                asset_id
        `;

        const result = await pool.query(query, [entity_id]);

        console.log(`✅ Found ${result.rows.length} assets`);

        // Calculate totals
        const currentAssets = result.rows.filter(a => a.asset_category === 'current');
        const fixedAssets = result.rows.filter(a => a.asset_category === 'fixed');

        const currentTotal = currentAssets.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const fixedTotal = fixedAssets.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const total = currentTotal + fixedTotal;

        res.json({
            success: true,
            assets: result.rows,
            summary: {
                current_assets: currentAssets.length,
                current_total: currentTotal,
                fixed_assets: fixedAssets.length,
                fixed_total: fixedTotal,
                total_assets: result.rows.length,
                total_amount: total
            },
            message: `تم تحميل ${result.rows.length} أصل`
        });

    } catch (error) {
        console.error('❌ Error fetching assets:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Get all liabilities
 */
async function getLiabilities(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`⚠️ Fetching liabilities for entity ${entity_id}...`);

        const query = `
            SELECT *
            FROM finance_liabilities
            WHERE entity_id = $1
            ORDER BY 
                CASE liability_category
                    WHEN 'current' THEN 1
                    WHEN 'long-term' THEN 2
                    ELSE 3
                END,
                liability_id
        `;

        const result = await pool.query(query, [entity_id]);

        console.log(`✅ Found ${result.rows.length} liabilities`);

        // Calculate totals
        const currentLiabilities = result.rows.filter(l => l.liability_category === 'current');
        const longTermLiabilities = result.rows.filter(l => l.liability_category === 'long-term');

        const currentTotal = currentLiabilities.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
        const longTermTotal = longTermLiabilities.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
        const total = currentTotal + longTermTotal;

        res.json({
            success: true,
            liabilities: result.rows,
            summary: {
                current_liabilities: currentLiabilities.length,
                current_total: currentTotal,
                long_term_liabilities: longTermLiabilities.length,
                long_term_total: longTermTotal,
                total_liabilities: result.rows.length,
                total_amount: total
            },
            message: `تم تحميل ${result.rows.length} التزام`
        });

    } catch (error) {
        console.error('❌ Error fetching liabilities:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Get all equity items
 */
async function getEquity(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`💰 Fetching equity for entity ${entity_id}...`);

        const query = `
            SELECT *
            FROM finance_equity
            WHERE entity_id = $1
            ORDER BY equity_id
        `;

        const result = await pool.query(query, [entity_id]);

        console.log(`✅ Found ${result.rows.length} equity items`);

        // Calculate total
        const total = result.rows.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        res.json({
            success: true,
            equity: result.rows,
            summary: {
                total_items: result.rows.length,
                total_amount: total
            },
            message: `تم تحميل ${result.rows.length} بند حقوق ملكية`
        });

    } catch (error) {
        console.error('❌ Error fetching equity:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Get complete balance sheet (all components)
 */
async function getCompleteBalanceSheet(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📊 Fetching complete balance sheet for entity ${entity_id}...`);

        // Get sheet info
        const sheetQuery = `
            SELECT * FROM finance_balance_sheet
            WHERE entity_id = $1
            ORDER BY sheet_date DESC
            LIMIT 1
        `;
        const sheetResult = await pool.query(sheetQuery, [entity_id]);

        if (sheetResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Balance sheet not found'
            });
        }

        const sheet = sheetResult.rows[0];

        // Get assets
        const assetsQuery = `SELECT * FROM finance_assets WHERE entity_id = $1 ORDER BY asset_category, asset_id`;
        const assetsResult = await pool.query(assetsQuery, [entity_id]);

        // Get liabilities
        const liabilitiesQuery = `SELECT * FROM finance_liabilities WHERE entity_id = $1 ORDER BY liability_category, liability_id`;
        const liabilitiesResult = await pool.query(liabilitiesQuery, [entity_id]);

        // Get equity
        const equityQuery = `SELECT * FROM finance_equity WHERE entity_id = $1 ORDER BY equity_id`;
        const equityResult = await pool.query(equityQuery, [entity_id]);

        // Calculate totals
        const totalAssets = assetsResult.rows.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const totalLiabilities = liabilitiesResult.rows.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
        const totalEquity = equityResult.rows.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // Check if balanced
        const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

        console.log(`✅ Complete balance sheet loaded`);
        console.log(`   Assets: ${totalAssets.toFixed(2)}`);
        console.log(`   Liabilities: ${totalLiabilities.toFixed(2)}`);
        console.log(`   Equity: ${totalEquity.toFixed(2)}`);
        console.log(`   Balanced: ${isBalanced ? 'Yes' : 'No'}`);

        res.json({
            success: true,
            sheet: sheet,
            assets: assetsResult.rows,
            liabilities: liabilitiesResult.rows,
            equity: equityResult.rows,
            totals: {
                total_assets: totalAssets,
                total_liabilities: totalLiabilities,
                total_equity: totalEquity,
                is_balanced: isBalanced,
                difference: totalAssets - (totalLiabilities + totalEquity)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching complete balance sheet:', error);
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
    getBalanceSheet,
    getAssets,
    getLiabilities,
    getEquity,
    getCompleteBalanceSheet,
    testConnection
};
