/**
 * 🧾 Journal Lines API
 * Page 10 of Accounting System
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

async function getJournalLines(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`🧾 Fetching journal lines for entity ${entity_id}...`);

        const query = `
            SELECT 
                jl.line_id,
                jl.entry_id,
                jl.line_number,
                jl.account_id,
                jl.account_code,
                jl.debit_amount,
                jl.credit_amount,
                jl.description AS line_description,
                jl.created_at,
                je.entry_number,
                je.entry_date,
                je.entry_type,
                je.status,
                a.account_name_ar,
                a.account_name_en
            FROM finance_journal_lines jl
            JOIN finance_journal_entries je ON jl.entry_id = je.entry_id
            LEFT JOIN finance_accounts a ON jl.account_id = a.account_id
            WHERE je.entity_id = $1 OR je.entity_id IS NULL
            ORDER BY je.entry_date DESC, je.entry_number DESC, jl.line_number
        `;

        let result = await pool.query(query, [entity_id]);
        let lines = result.rows;

        if (lines.length === 0) {
            const fallbackQuery = `
                SELECT 
                    jl.line_id,
                    jl.entry_id,
                    jl.line_number,
                    jl.account_id,
                    jl.account_code,
                    jl.debit_amount,
                    jl.credit_amount,
                    jl.description AS line_description,
                    jl.created_at,
                    je.entry_number,
                    je.entry_date,
                    je.entry_type,
                    je.status,
                    a.account_name_ar,
                    a.account_name_en
                FROM finance_journal_lines jl
                JOIN finance_journal_entries je ON jl.entry_id = je.entry_id
                LEFT JOIN finance_accounts a ON jl.account_id = a.account_id
                ORDER BY je.entry_date DESC, je.entry_number DESC, jl.line_number
            `;

            result = await pool.query(fallbackQuery);
            lines = result.rows;
        }

        const summary = lines.reduce((acc, l) => {
            acc.total_lines += 1;
            acc.total_debit += parseFloat(l.debit_amount || 0);
            acc.total_credit += parseFloat(l.credit_amount || 0);
            return acc;
        }, { total_lines: 0, total_debit: 0, total_credit: 0 });
        summary.total_diff = summary.total_debit - summary.total_credit;

        res.json({
            success: true,
            lines,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching journal lines:', error);
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
    getJournalLines,
    testConnection
};
