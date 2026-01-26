/**
 * 🏗️ Fixed Assets API
 * Page 14 of Accounting System
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

async function getFixedAssets(req, res) {
    const { entity_id, status, asset_category, asset_type, from_date, to_date } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`🏗️ Fetching fixed assets for entity ${entity_id}...`);

        const assetConditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const assetValues = [entity_id];
        let assetIndex = 2;

        if (status) {
            assetConditions.push(`LOWER(status) = LOWER($${assetIndex})`);
            assetValues.push(status);
            assetIndex++;
        }
        if (asset_category) {
            assetConditions.push(`LOWER(asset_category) = LOWER($${assetIndex})`);
            assetValues.push(asset_category);
            assetIndex++;
        }
        if (asset_type) {
            assetConditions.push(`LOWER(asset_type) = LOWER($${assetIndex})`);
            assetValues.push(asset_type);
            assetIndex++;
        }
        if (from_date) {
            assetConditions.push(`purchase_date >= $${assetIndex}`);
            assetValues.push(from_date);
            assetIndex++;
        }
        if (to_date) {
            assetConditions.push(`purchase_date <= $${assetIndex}`);
            assetValues.push(to_date);
            assetIndex++;
        }

        const assetsQuery = `
            SELECT
                asset_id,
                asset_code,
                asset_name_ar,
                asset_name_en,
                asset_category,
                asset_type,
                purchase_date,
                purchase_cost,
                salvage_value,
                depreciable_value,
                depreciation_method,
                useful_life_years,
                useful_life_months,
                accumulated_depreciation,
                net_book_value,
                status,
                disposal_date,
                disposal_value,
                location,
                custodian_employee_id,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                office_id,
                asset_account_id,
                depreciation_account_id,
                accumulated_depreciation_account_id,
                serial_number,
                warranty_expiry_date,
                maintenance_schedule,
                notes,
                created_at,
                updated_at,
                created_by
            FROM finance_fixed_assets
            WHERE ${assetConditions.join(' AND ')}
            ORDER BY purchase_date DESC, asset_id DESC
        `;

        const assetsResult = await pool.query(assetsQuery, assetValues);
        const assets = assetsResult.rows;

        const depreciationConditions = ['(a.entity_id = $1 OR a.entity_id IS NULL)'];
        const depreciationValues = [entity_id];
        let depIndex = 2;

        if (from_date) {
            depreciationConditions.push(`d.depreciation_date >= $${depIndex}`);
            depreciationValues.push(from_date);
            depIndex++;
        }
        if (to_date) {
            depreciationConditions.push(`d.depreciation_date <= $${depIndex}`);
            depreciationValues.push(to_date);
            depIndex++;
        }

        const depreciationQuery = `
            SELECT
                d.depreciation_id,
                d.asset_id,
                a.asset_code,
                a.asset_name_ar,
                a.asset_name_en,
                d.depreciation_date,
                d.fiscal_year,
                d.fiscal_period,
                d.depreciation_amount,
                d.accumulated_depreciation,
                d.net_book_value,
                d.journal_entry_id,
                d.notes,
                d.created_at
            FROM finance_asset_depreciation d
            LEFT JOIN finance_fixed_assets a ON a.asset_id = d.asset_id
            WHERE ${depreciationConditions.join(' AND ')}
            ORDER BY d.depreciation_date DESC, d.depreciation_id DESC
        `;

        const depreciationResult = await pool.query(depreciationQuery, depreciationValues);
        const depreciation = depreciationResult.rows;

        const summary = assets.reduce((acc, a) => {
            acc.total_assets += 1;
            acc.total_cost += parseFloat(a.purchase_cost || 0);
            acc.total_accumulated += parseFloat(a.accumulated_depreciation || 0);
            acc.total_net += parseFloat(a.net_book_value || 0);
            const category = (a.asset_category || 'غير محدد').toLowerCase();
            acc.by_category[category] = (acc.by_category[category] || 0) + parseFloat(a.purchase_cost || 0);
            return acc;
        }, {
            total_assets: 0,
            total_cost: 0,
            total_accumulated: 0,
            total_net: 0,
            by_category: {}
        });

        const depreciationSummary = depreciation.reduce((acc, d) => {
            acc.total_depreciations += 1;
            acc.total_amount += parseFloat(d.depreciation_amount || 0);
            acc.latest_date = acc.latest_date && d.depreciation_date
                ? (new Date(acc.latest_date) > new Date(d.depreciation_date) ? acc.latest_date : d.depreciation_date)
                : d.depreciation_date || acc.latest_date;
            const year = d.fiscal_year || (d.depreciation_date ? new Date(d.depreciation_date).getFullYear() : 'غير محدد');
            acc.by_year[year] = (acc.by_year[year] || 0) + parseFloat(d.depreciation_amount || 0);
            return acc;
        }, {
            total_depreciations: 0,
            total_amount: 0,
            latest_date: null,
            by_year: {}
        });

        res.json({
            success: true,
            assets,
            depreciation,
            summary: {
                ...summary,
                depreciation: depreciationSummary
            }
        });
    } catch (error) {
        console.error('❌ Error fetching fixed assets:', error);
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
    getFixedAssets,
    testConnection
};
