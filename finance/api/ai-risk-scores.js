/**
 * 🛡️ AI Risk Scores API
 * Page 13 of Accounting System
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

async function getRiskScores(req, res) {
    const { entity_id, from_date, to_date, risk_level, customer_id } = req.query;
    const entityId = entity_id || req.headers['x-entity-id'] || 'HQ001';

    if (!entityId) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`🛡️ Fetching AI risk scores for entity ${entityId}...`);

        const conditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const values = [entityId];
        let paramIndex = 2;

        if (from_date) {
            conditions.push(`assessment_date >= $${paramIndex}`);
            values.push(from_date);
            paramIndex++;
        }

        if (to_date) {
            conditions.push(`assessment_date <= $${paramIndex}`);
            values.push(to_date);
            paramIndex++;
        }

        if (risk_level) {
            conditions.push(`LOWER(risk_level) = LOWER($${paramIndex})`);
            values.push(risk_level);
            paramIndex++;
        }

        if (customer_id) {
            conditions.push(`customer_id = $${paramIndex}`);
            values.push(customer_id);
            paramIndex++;
        }

        const query = `
            SELECT
                risk_id,
                customer_id,
                assessment_date,
                risk_score,
                risk_level,
                risk_factors,
                calculation_details,
                recommendations,
                suggested_actions,
                entity_type,
                entity_id,
                model_version,
                created_at
            FROM finance_ai_risk_scores
            WHERE ${conditions.join(' AND ')}
            ORDER BY assessment_date DESC, risk_id DESC
        `;

        const result = await pool.query(query, values);
        const rows = result.rows;

        const summary = rows.reduce((acc, r) => {
            const score = parseFloat(r.risk_score || 0);
            acc.total_scores += 1;
            acc.total_score_value += score;
            acc.max_score = Math.max(acc.max_score, score);
            acc.min_score = Math.min(acc.min_score, score);
            acc.levels[(r.risk_level || 'Unknown').toUpperCase()] =
                (acc.levels[(r.risk_level || 'Unknown').toUpperCase()] || 0) + 1;
            acc.customers.add(r.customer_id);
            acc.latest_assessment = acc.latest_assessment
                ? (new Date(r.assessment_date) > new Date(acc.latest_assessment) ? r.assessment_date : acc.latest_assessment)
                : r.assessment_date;
            return acc;
        }, {
            total_scores: 0,
            total_score_value: 0,
            max_score: 0,
            min_score: rows.length ? Number.MAX_SAFE_INTEGER : 0,
            levels: {},
            customers: new Set(),
            latest_assessment: null
        });

        summary.avg_score = summary.total_scores ? (summary.total_score_value / summary.total_scores) : 0;
        summary.min_score = summary.total_scores ? summary.min_score : 0;
        summary.unique_customers = summary.customers.size;
        summary.customers = undefined;
        summary.latest_assessment = summary.latest_assessment;

        res.json({
            success: true,
            rows,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching AI risk scores:', error);
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
    getRiskScores,
    testConnection
};
