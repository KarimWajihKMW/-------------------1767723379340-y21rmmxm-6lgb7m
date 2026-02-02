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
    const entityId = entity_id || req.headers['x-entity-id'] || 'HQ001';

    if (!entityId) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`🏗️ Fetching fixed assets for entity ${entityId}...`);

        const assetConditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const assetValues = [entityId];
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
        const depreciationValues = [entityId];
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

function validateAssetPayload(payload) {
    const required = ['asset_code', 'asset_name_ar', 'asset_category', 'asset_type', 'purchase_date', 'purchase_cost', 'depreciation_method', 'useful_life_years'];
    for (const key of required) {
        if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
            throw new Error(`حقل ${key} مطلوب`);
        }
    }

    if (Number.isNaN(Number(payload.purchase_cost))) {
        throw new Error('قيمة الشراء يجب أن تكون رقمية');
    }
    if (payload.salvage_value !== undefined && payload.salvage_value !== null && payload.salvage_value !== '' && Number.isNaN(Number(payload.salvage_value))) {
        throw new Error('قيمة الخردة يجب أن تكون رقمية');
    }
    if (payload.accumulated_depreciation !== undefined && payload.accumulated_depreciation !== null && payload.accumulated_depreciation !== '' && Number.isNaN(Number(payload.accumulated_depreciation))) {
        throw new Error('الإهلاك التراكمي يجب أن يكون رقمياً');
    }
    if (payload.net_book_value !== undefined && payload.net_book_value !== null && payload.net_book_value !== '' && Number.isNaN(Number(payload.net_book_value))) {
        throw new Error('القيمة الدفترية يجب أن تكون رقمية');
    }
    if (payload.useful_life_years !== undefined && Number.isNaN(Number(payload.useful_life_years))) {
        throw new Error('العمر الإنتاجي (سنوات) يجب أن يكون رقمياً');
    }
    if (payload.useful_life_months !== undefined && payload.useful_life_months !== null && payload.useful_life_months !== '' && Number.isNaN(Number(payload.useful_life_months))) {
        throw new Error('العمر الإنتاجي (أشهر) يجب أن يكون رقمياً');
    }
}

async function createFixedAsset(req, res) {
    const entityId = req.body.entity_id || req.headers['x-entity-id'] || 'HQ001';
    const entityType = req.body.entity_type || req.headers['x-entity-type'] || 'HQ';

    if (!entityId) {
        return res.status(400).json({ success: false, error: 'entity_id is required' });
    }

    try {
        validateAssetPayload(req.body);

        const {
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
            created_by
        } = req.body;

        const depreciableValue = depreciable_value !== undefined && depreciable_value !== null
            ? Number(depreciable_value)
            : Number(purchase_cost) - Number(salvage_value || 0);
        const netBookValue = net_book_value !== undefined && net_book_value !== null
            ? Number(net_book_value)
            : Number(purchase_cost) - Number(accumulated_depreciation || 0);

        const insertQuery = `
            INSERT INTO finance_fixed_assets (
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
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,NOW(),NOW(),$32
            ) RETURNING *
        `;

        const values = [
            asset_code,
            asset_name_ar,
            asset_name_en || null,
            asset_category,
            asset_type,
            purchase_date,
            Number(purchase_cost),
            salvage_value !== undefined && salvage_value !== null && salvage_value !== '' ? Number(salvage_value) : 0,
            depreciableValue,
            depreciation_method,
            Number(useful_life_years),
            useful_life_months !== undefined && useful_life_months !== null && useful_life_months !== '' ? Number(useful_life_months) : null,
            accumulated_depreciation !== undefined && accumulated_depreciation !== null && accumulated_depreciation !== '' ? Number(accumulated_depreciation) : 0,
            netBookValue,
            status || 'active',
            disposal_date || null,
            disposal_value !== undefined && disposal_value !== null && disposal_value !== '' ? Number(disposal_value) : null,
            location || null,
            custodian_employee_id !== undefined && custodian_employee_id !== null && custodian_employee_id !== '' ? Number(custodian_employee_id) : null,
            entity_type || entityType,
            entityId,
            branch_id || null,
            incubator_id || null,
            office_id || null,
            asset_account_id !== undefined && asset_account_id !== null && asset_account_id !== '' ? Number(asset_account_id) : null,
            depreciation_account_id !== undefined && depreciation_account_id !== null && depreciation_account_id !== '' ? Number(depreciation_account_id) : null,
            accumulated_depreciation_account_id !== undefined && accumulated_depreciation_account_id !== null && accumulated_depreciation_account_id !== '' ? Number(accumulated_depreciation_account_id) : null,
            serial_number || null,
            warranty_expiry_date || null,
            maintenance_schedule || null,
            notes || null,
            created_by || 'system'
        ];

        const result = await pool.query(insertQuery, values);
        res.json({ success: true, asset: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating fixed asset:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updateFixedAsset(req, res) {
    const entityId = req.body.entity_id || req.headers['x-entity-id'] || 'HQ001';
    const entityType = req.body.entity_type || req.headers['x-entity-type'] || 'HQ';
    const assetId = req.params.asset_id;

    if (!entityId) {
        return res.status(400).json({ success: false, error: 'entity_id is required' });
    }
    if (!assetId) {
        return res.status(400).json({ success: false, error: 'asset_id is required' });
    }

    try {
        validateAssetPayload(req.body);

        const {
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
            branch_id,
            incubator_id,
            office_id,
            asset_account_id,
            depreciation_account_id,
            accumulated_depreciation_account_id,
            serial_number,
            warranty_expiry_date,
            maintenance_schedule,
            notes
        } = req.body;

        const depreciableValue = depreciable_value !== undefined && depreciable_value !== null
            ? Number(depreciable_value)
            : Number(purchase_cost) - Number(salvage_value || 0);
        const netBookValue = net_book_value !== undefined && net_book_value !== null
            ? Number(net_book_value)
            : Number(purchase_cost) - Number(accumulated_depreciation || 0);

        const updateQuery = `
            UPDATE finance_fixed_assets SET
                asset_code = $1,
                asset_name_ar = $2,
                asset_name_en = $3,
                asset_category = $4,
                asset_type = $5,
                purchase_date = $6,
                purchase_cost = $7,
                salvage_value = $8,
                depreciable_value = $9,
                depreciation_method = $10,
                useful_life_years = $11,
                useful_life_months = $12,
                accumulated_depreciation = $13,
                net_book_value = $14,
                status = $15,
                disposal_date = $16,
                disposal_value = $17,
                location = $18,
                custodian_employee_id = $19,
                entity_type = $20,
                entity_id = $21,
                branch_id = $22,
                incubator_id = $23,
                office_id = $24,
                asset_account_id = $25,
                depreciation_account_id = $26,
                accumulated_depreciation_account_id = $27,
                serial_number = $28,
                warranty_expiry_date = $29,
                maintenance_schedule = $30,
                notes = $31,
                updated_at = NOW()
            WHERE asset_id = $32 AND entity_id = $33
            RETURNING *
        `;

        const values = [
            asset_code,
            asset_name_ar,
            asset_name_en || null,
            asset_category,
            asset_type,
            purchase_date,
            Number(purchase_cost),
            salvage_value !== undefined && salvage_value !== null && salvage_value !== '' ? Number(salvage_value) : 0,
            depreciableValue,
            depreciation_method,
            Number(useful_life_years),
            useful_life_months !== undefined && useful_life_months !== null && useful_life_months !== '' ? Number(useful_life_months) : null,
            accumulated_depreciation !== undefined && accumulated_depreciation !== null && accumulated_depreciation !== '' ? Number(accumulated_depreciation) : 0,
            netBookValue,
            status || 'active',
            disposal_date || null,
            disposal_value !== undefined && disposal_value !== null && disposal_value !== '' ? Number(disposal_value) : null,
            location || null,
            custodian_employee_id !== undefined && custodian_employee_id !== null && custodian_employee_id !== '' ? Number(custodian_employee_id) : null,
            entity_type || entityType,
            entityId,
            branch_id || null,
            incubator_id || null,
            office_id || null,
            asset_account_id !== undefined && asset_account_id !== null && asset_account_id !== '' ? Number(asset_account_id) : null,
            depreciation_account_id !== undefined && depreciation_account_id !== null && depreciation_account_id !== '' ? Number(depreciation_account_id) : null,
            accumulated_depreciation_account_id !== undefined && accumulated_depreciation_account_id !== null && accumulated_depreciation_account_id !== '' ? Number(accumulated_depreciation_account_id) : null,
            serial_number || null,
            warranty_expiry_date || null,
            maintenance_schedule || null,
            notes || null,
            Number(assetId),
            entityId
        ];

        const result = await pool.query(updateQuery, values);
        if (!result.rowCount) {
            return res.status(404).json({ success: false, error: 'لم يتم العثور على الأصل لهذا الكيان' });
        }

        res.json({ success: true, asset: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating fixed asset:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteFixedAsset(req, res) {
    const entityId = req.query.entity_id || req.headers['x-entity-id'] || 'HQ001';
    const assetId = req.params.asset_id;

    if (!entityId) {
        return res.status(400).json({ success: false, error: 'entity_id is required' });
    }
    if (!assetId) {
        return res.status(400).json({ success: false, error: 'asset_id is required' });
    }

    try {
        const result = await pool.query(
            'DELETE FROM finance_fixed_assets WHERE asset_id = $1 AND entity_id = $2',
            [Number(assetId), entityId]
        );

        if (!result.rowCount) {
            return res.status(404).json({ success: false, error: 'لم يتم العثور على الأصل لهذا الكيان' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting fixed asset:', error);
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
    getFixedAssets,
    createFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
    testConnection
};
