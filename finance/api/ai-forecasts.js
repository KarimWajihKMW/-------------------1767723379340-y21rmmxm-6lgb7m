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
    testConnection
};
