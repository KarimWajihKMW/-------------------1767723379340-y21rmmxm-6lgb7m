/**
 * 🤖 AI Forecasts API
 * Page 8 of Accounting System
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

function normalizeInsights(input) {
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

async function getForecasts(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`🤖 Fetching AI forecasts for entity ${entity_id}...`);

        const query = `
            SELECT 
                forecast_id,
                entity_id,
                forecast_period,
                forecast_type,
                forecast_amount,
                confidence_level,
                ai_model,
                ai_insights,
                created_at
            FROM finance_ai_forecasts
            WHERE entity_id = $1 OR entity_id IS NULL
            ORDER BY created_at DESC, forecast_id DESC
        `;

        const result = await pool.query(query, [entity_id]);
        const forecasts = result.rows;

        const sumForecast = forecasts.reduce((sum, f) => sum + parseFloat(f.forecast_amount || 0), 0);
        const maxForecast = forecasts.reduce((max, f) => Math.max(max, parseFloat(f.forecast_amount || 0)), 0);
        const avgConfidence = forecasts.length
            ? forecasts.reduce((sum, f) => sum + (parseFloat(f.confidence_level || 0) * 100), 0) / forecasts.length
            : 0;

        const models = Array.from(new Set(forecasts.map(f => f.ai_model).filter(Boolean)));

        res.json({
            success: true,
            forecasts,
            summary: {
                total_forecasts: forecasts.length,
                sum_forecast: sumForecast,
                max_forecast: maxForecast,
                avg_confidence: avgConfidence,
                models
            }
        });
    } catch (error) {
        console.error('❌ Error fetching AI forecasts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

async function createForecast(req, res) {
    const {
        entity_id,
        forecast_period,
        forecast_type,
        forecast_amount,
        confidence_level,
        ai_model,
        ai_insights
    } = req.body || {};

    if (!entity_id || !forecast_period || forecast_amount === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: entity_id, forecast_period, forecast_amount'
        });
    }

    try {
        const normalizedInsights = normalizeInsights(ai_insights);
        const result = await pool.query(
            `INSERT INTO finance_ai_forecasts
             (entity_id, forecast_period, forecast_type, forecast_amount, confidence_level, ai_model, ai_insights, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
             RETURNING *`,
            [
                entity_id,
                forecast_period,
                forecast_type || 'revenue',
                forecast_amount,
                confidence_level ?? null,
                ai_model || null,
                normalizedInsights ? JSON.stringify(normalizedInsights) : null
            ]
        );

        res.json({ success: true, forecast: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating forecast:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updateForecast(req, res) {
    const { forecast_id } = req.params;
    const {
        entity_id,
        forecast_period,
        forecast_type,
        forecast_amount,
        confidence_level,
        ai_model,
        ai_insights
    } = req.body || {};

    if (!forecast_id || !entity_id || !forecast_period || forecast_amount === undefined) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: forecast_id, entity_id, forecast_period, forecast_amount'
        });
    }

    try {
        const existing = await pool.query('SELECT forecast_id, entity_id FROM finance_ai_forecasts WHERE forecast_id = $1', [forecast_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Forecast not found' });
        }
        if (existing.rows[0].entity_id && existing.rows[0].entity_id !== entity_id) {
            return res.status(403).json({ success: false, error: 'لا يمكن تعديل تنبؤ كيان آخر' });
        }

        const normalizedInsights = normalizeInsights(ai_insights);
        const result = await pool.query(
            `UPDATE finance_ai_forecasts
             SET forecast_period = $1,
                 forecast_type = $2,
                 forecast_amount = $3,
                 confidence_level = $4,
                 ai_model = $5,
                 ai_insights = $6
             WHERE forecast_id = $7
             RETURNING *`,
            [
                forecast_period,
                forecast_type || 'revenue',
                forecast_amount,
                confidence_level ?? null,
                ai_model || null,
                normalizedInsights ? JSON.stringify(normalizedInsights) : null,
                forecast_id
            ]
        );

        res.json({ success: true, forecast: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating forecast:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteForecast(req, res) {
    const { forecast_id } = req.params;
    const { entity_id } = req.query;

    if (!forecast_id || !entity_id) {
        return res.status(400).json({ success: false, error: 'forecast_id and entity_id are required' });
    }

    try {
        const existing = await pool.query('SELECT forecast_id, entity_id FROM finance_ai_forecasts WHERE forecast_id = $1', [forecast_id]);
        if (!existing.rows.length) {
            return res.status(404).json({ success: false, error: 'Forecast not found' });
        }
        if (existing.rows[0].entity_id && existing.rows[0].entity_id !== entity_id) {
            return res.status(403).json({ success: false, error: 'لا يمكن حذف تنبؤ كيان آخر' });
        }

        await pool.query('DELETE FROM finance_ai_forecasts WHERE forecast_id = $1', [forecast_id]);
        res.json({ success: true, message: 'تم حذف التنبؤ' });
    } catch (error) {
        console.error('❌ Error deleting forecast:', error);
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
    getForecasts,
    createForecast,
    updateForecast,
    deleteForecast,
    testConnection
};
