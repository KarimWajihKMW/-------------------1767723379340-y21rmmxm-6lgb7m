/**
 * 📚 Journal Entries & General Ledger API
 * Page 2 of Accounting System
 * Handles all journal entry operations
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

function normalizeAmount(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    let text = String(value).trim();
    if (!text) return 0;

    const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
    const easternIndic = '۰۱۲۳۴۵۶۷۸۹';
    text = text.replace(/[٠-٩]/g, (digit) => arabicIndic.indexOf(digit));
    text = text.replace(/[۰-۹]/g, (digit) => easternIndic.indexOf(digit));

    text = text.replace(/\s+/g, '');
    text = text.replace(/٬/g, '');
    if (text.includes(',') && !text.includes('.')) {
        text = text.replace(',', '.');
    } else {
        text = text.replace(/,/g, '');
    }
    text = text.replace(/٫/g, '.');

    const cleaned = text.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Get all journal entries with their lines
 */
async function getJournalEntries(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📚 Fetching journal entries for entity ${entity_id}...`);

        // Get all journal entries
        const entriesQuery = `
            SELECT 
                entry_id,
                entry_number,
                entry_date,
                entry_type,
                description,
                reference_number,
                status,
                is_posted,
                fiscal_year,
                fiscal_period,
                created_at,
                updated_at
            FROM finance_journal_entries
            WHERE entity_id = $1
            ORDER BY entry_date DESC, entry_number DESC
        `;

        const entriesResult = await pool.query(entriesQuery, [entity_id]);
        const entries = entriesResult.rows;

        console.log(`✅ Found ${entries.length} journal entries`);

        // Get lines for each entry
        for (let entry of entries) {
            const linesQuery = `
                SELECT 
                    jl.line_id,
                    jl.entry_id,
                    jl.line_number,
                    jl.account_id,
                    jl.account_code,
                    fa.account_name_ar as account_name,
                    jl.debit_amount,
                    jl.credit_amount,
                    jl.description,
                    jl.cost_center_id,
                    jl.project_id
                FROM finance_journal_lines jl
                LEFT JOIN finance_accounts fa ON jl.account_id = fa.account_id
                WHERE jl.entry_id = $1
                ORDER BY jl.line_number
            `;

            const linesResult = await pool.query(linesQuery, [entry.entry_id]);
            entry.lines = linesResult.rows;

            console.log(`  Entry #${entry.entry_number}: ${entry.lines.length} lines`);
        }

        res.json({
            success: true,
            entries: entries,
            count: entries.length,
            message: `تم تحميل ${entries.length} قيد محاسبي`
        });

    } catch (error) {
        console.error('❌ Error fetching journal entries:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Get single journal entry with details
 */
async function getJournalEntry(req, res) {
    const { entry_id } = req.params;
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📚 Fetching journal entry ${entry_id}...`);

        // Get entry
        const entryQuery = `
            SELECT *
            FROM finance_journal_entries
            WHERE entry_id = $1 AND entity_id = $2
        `;

        const entryResult = await pool.query(entryQuery, [entry_id, entity_id]);

        if (entryResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Journal entry not found'
            });
        }

        const entry = entryResult.rows[0];

        // Get lines
        const linesQuery = `
            SELECT 
                jl.line_id,
                jl.entry_id,
                jl.line_number,
                jl.account_id,
                jl.account_code,
                fa.account_name_ar as account_name,
                jl.debit_amount,
                jl.credit_amount,
                jl.description,
                jl.cost_center_id,
                jl.project_id
            FROM finance_journal_lines jl
            LEFT JOIN finance_accounts fa ON jl.account_id = fa.account_id
            WHERE jl.entry_id = $1
            ORDER BY jl.line_number
        `;

        const linesResult = await pool.query(linesQuery, [entry_id]);
        entry.lines = linesResult.rows;

        console.log(`✅ Found entry #${entry.entry_number} with ${entry.lines.length} lines`);

        res.json({
            success: true,
            entry: entry
        });

    } catch (error) {
        console.error('❌ Error fetching journal entry:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Get account balances for trial balance
 */
async function getAccountBalances(req, res) {
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📊 Fetching account balances for entity ${entity_id}...`);

        const query = `
            SELECT 
                account_id,
                account_code,
                account_name_ar,
                account_type,
                entity_type,
                entity_id,
                total_debit,
                total_credit,
                balance
            FROM finance_account_balances
            WHERE entity_id = $1 OR entity_id IS NULL
            ORDER BY account_code
        `;

        const result = await pool.query(query, [entity_id]);

        console.log(`✅ Found ${result.rows.length} account balances`);

        res.json({
            success: true,
            balances: result.rows,
            count: result.rows.length,
            message: `تم تحميل ${result.rows.length} رصيد حساب`
        });

    } catch (error) {
        console.error('❌ Error fetching account balances:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Get general ledger for specific account
 */
async function getAccountLedger(req, res) {
    const { account_id } = req.params;
    const { entity_id, start_date, end_date } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`📖 Fetching ledger for account ${account_id}...`);

        // Get account info from finance_account_balances
        const accountQuery = `
            SELECT *
            FROM finance_account_balances
            WHERE account_id = $1
            LIMIT 1
        `;

        const accountResult = await pool.query(accountQuery, [account_id]);

        if (accountResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Account not found'
            });
        }

        const account = accountResult.rows[0];

        // Get journal lines for this account
        let ledgerQuery = `
            SELECT 
                jl.line_id,
                jl.entry_id,
                jl.line_number,
                jl.debit_amount,
                jl.credit_amount,
                jl.description as line_description,
                je.entry_number,
                je.entry_date,
                je.entry_type,
                je.description as entry_description,
                je.reference_number,
                je.status
            FROM finance_journal_lines jl
            JOIN finance_journal_entries je ON jl.entry_id = je.entry_id
            WHERE jl.account_id = $1 AND je.entity_id = $2
        `;

        const params = [account_id, entity_id];

        if (start_date) {
            params.push(start_date);
            ledgerQuery += ` AND je.entry_date >= $${params.length}`;
        }

        if (end_date) {
            params.push(end_date);
            ledgerQuery += ` AND je.entry_date <= $${params.length}`;
        }

        ledgerQuery += ` ORDER BY je.entry_date, je.entry_number, jl.line_number`;

        const ledgerResult = await pool.query(ledgerQuery, params);

        console.log(`✅ Found ${ledgerResult.rows.length} ledger entries`);

        // Calculate running balance
        let runningBalance = 0;
        const ledgerEntries = ledgerResult.rows.map(row => {
            const debit = parseFloat(row.debit_amount || 0);
            const credit = parseFloat(row.credit_amount || 0);

            // For asset and expense accounts, debit increases, credit decreases
            // For liability, equity, and revenue accounts, credit increases, debit decreases
            if (['ASSET', 'EXPENSE'].includes(account.account_type)) {
                runningBalance += debit - credit;
            } else {
                runningBalance += credit - debit;
            }

            return {
                ...row,
                running_balance: runningBalance
            };
        });

        res.json({
            success: true,
            account: account,
            ledger: ledgerEntries,
            count: ledgerEntries.length,
            opening_balance: 0,
            closing_balance: runningBalance
        });

    } catch (error) {
        console.error('❌ Error fetching account ledger:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

/**
 * Create new journal entry
 */
async function createJournalEntry(req, res) {
    const {
        entity_id,
        entry_number,
        entry_date,
        entry_type,
        description,
        reference_number,
        fiscal_year,
        fiscal_period,
        lines
    } = req.body;

    if (!entity_id || !entry_date || !lines || lines.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: entity_id, entry_date, lines'
        });
    }

    // Validate that debits = credits
    const totalDebit = lines.reduce((sum, line) => sum + normalizeAmount(line.debit_amount), 0);
    const totalCredit = lines.reduce((sum, line) => sum + normalizeAmount(line.credit_amount), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({
            success: false,
            error: 'Journal entry is not balanced. Total debit must equal total credit.',
            total_debit: totalDebit,
            total_credit: totalCredit,
            difference: totalDebit - totalCredit
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('📝 Creating new journal entry...');

        // Insert journal entry
        const entryQuery = `
            INSERT INTO finance_journal_entries (
                entity_id, entry_number, entry_date, entry_type,
                description, reference_number, status, is_posted,
                fiscal_year, fiscal_period, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            RETURNING *
        `;

        const entryValues = [
            entity_id,
            entry_number || `JE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            entry_date,
            entry_type || 'GENERAL',
            description,
            reference_number,
            'DRAFT',
            false,
            fiscal_year,
            fiscal_period,
            'SYSTEM'
        ];

        const entryResult = await client.query(entryQuery, entryValues);
        const newEntry = entryResult.rows[0];

        console.log(`✅ Created entry #${newEntry.entry_number}`);

        const accountIds = lines
            .map(line => parseInt(line.account_id, 10))
            .filter(id => Number.isInteger(id));

        const accountsLookup = new Map();
        if (accountIds.length) {
            const accountsResult = await client.query(
                `SELECT account_id, account_code, account_name_ar FROM finance_accounts WHERE account_id = ANY($1::int[])`,
                [accountIds]
            );
            accountsResult.rows.forEach(row => {
                accountsLookup.set(row.account_id, {
                    account_code: row.account_code,
                    account_name: row.account_name_ar
                });
            });
        }

        // Insert journal lines
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const accountId = parseInt(line.account_id, 10);
            const accountMeta = Number.isInteger(accountId) ? accountsLookup.get(accountId) : null;
            const accountCode = line.account_code || accountMeta?.account_code;

            if (!Number.isInteger(accountId) || !accountCode) {
                throw new Error('Invalid account data: account_id or account_code missing');
            }

            const lineQuery = `
                INSERT INTO finance_journal_lines (
                    entry_id, line_number, account_id, account_code,
                    debit_amount, credit_amount, description,
                    cost_center_id, project_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const lineValues = [
                newEntry.entry_id,
                i + 1,
                accountId,
                accountCode,
                normalizeAmount(line.debit_amount),
                normalizeAmount(line.credit_amount),
                line.description,
                line.cost_center_id,
                line.project_id
            ];

            await client.query(lineQuery, lineValues);
            console.log(`  ✅ Added line ${i + 1}`);
        }

        await client.query('COMMIT');

        console.log(`✅ Journal entry created successfully`);

        res.json({
            success: true,
            entry: newEntry,
            message: `تم إنشاء القيد المحاسبي #${newEntry.entry_number}`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating journal entry:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        client.release();
    }
}

/**
 * Delete journal entry with lines
 */
async function deleteJournalEntry(req, res) {
    const { entry_id } = req.params;
    const { entity_id } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const entryResult = await client.query(
            `SELECT entry_id, entry_number, status
             FROM finance_journal_entries
             WHERE entry_id = $1 AND entity_id = $2`,
            [entry_id, entity_id]
        );

        if (entryResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Journal entry not found'
            });
        }

        await client.query(
            'DELETE FROM finance_journal_lines WHERE entry_id = $1',
            [entry_id]
        );

        const deleteResult = await client.query(
            `DELETE FROM finance_journal_entries
             WHERE entry_id = $1 AND entity_id = $2
             RETURNING entry_id, entry_number`,
            [entry_id, entity_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            entry: deleteResult.rows[0],
            message: 'تم حذف القيد المحاسبي بنجاح'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error deleting journal entry:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        client.release();
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
    getJournalEntries,
    getJournalEntry,
    getAccountBalances,
    getAccountLedger,
    createJournalEntry,
    deleteJournalEntry,
    testConnection
};
