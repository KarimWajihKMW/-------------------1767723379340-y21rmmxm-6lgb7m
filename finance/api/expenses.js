/**
 * 🧾 Expenses & Vendors API
 * Page 23 of Accounting System
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

async function getExpenses(req, res) {
    const { entity_id, status, expense_category, expense_type, from_date, to_date, expense_number, vendor_name, invoice_number } = req.query;

    if (!entity_id) {
        return res.status(400).json({
            success: false,
            error: 'entity_id is required'
        });
    }

    try {
        console.log(`🧾 Fetching expenses for entity ${entity_id}...`);

        const expenseConditions = ['(entity_id = $1 OR entity_id IS NULL)'];
        const expenseValues = [entity_id];
        let eIndex = 2;

        if (status) {
            expenseConditions.push(`LOWER(status) = LOWER($${eIndex})`);
            expenseValues.push(status);
            eIndex++;
        }
        if (expense_number) {
            expenseConditions.push(`expense_number ILIKE $${eIndex}`);
            expenseValues.push(`%${expense_number}%`);
            eIndex++;
        }
        if (vendor_name) {
            expenseConditions.push(`vendor_name ILIKE $${eIndex}`);
            expenseValues.push(`%${vendor_name}%`);
            eIndex++;
        }
        if (invoice_number) {
            expenseConditions.push(`invoice_number ILIKE $${eIndex}`);
            expenseValues.push(`%${invoice_number}%`);
            eIndex++;
        }
        if (expense_category) {
            expenseConditions.push(`LOWER(expense_category) = LOWER($${eIndex})`);
            expenseValues.push(expense_category);
            eIndex++;
        }
        if (expense_type) {
            expenseConditions.push(`LOWER(expense_type) = LOWER($${eIndex})`);
            expenseValues.push(expense_type);
            eIndex++;
        }
        if (from_date) {
            expenseConditions.push(`expense_date >= $${eIndex}`);
            expenseValues.push(from_date);
            eIndex++;
        }
        if (to_date) {
            expenseConditions.push(`expense_date <= $${eIndex}`);
            expenseValues.push(to_date);
            eIndex++;
        }

        const expensesQuery = `
            SELECT
                expense_id,
                expense_number,
                expense_date,
                expense_category,
                expense_type,
                vendor_id,
                vendor_name,
                amount,
                tax_amount,
                total_amount,
                status,
                entity_type,
                entity_id,
                branch_id,
                incubator_id,
                platform_id,
                journal_entry_id,
                invoice_number,
                receipt_file,
                attachments,
                description,
                notes,
                created_at,
                updated_at,
                created_by,
                approved_by,
                approved_at
            FROM finance_expenses
            WHERE ${expenseConditions.join(' AND ')}
            ORDER BY expense_date DESC, expense_id DESC
        `;

        const expensesResult = await pool.query(expensesQuery, expenseValues);
        const expenses = expensesResult.rows;

        const vendorsQuery = `
            SELECT
                vendor_id,
                vendor_code,
                vendor_name_ar,
                vendor_name_en,
                vendor_type,
                email,
                phone,
                mobile,
                address,
                city,
                country,
                tax_number,
                commercial_registration,
                payment_terms,
                payment_term_days,
                entity_type,
                entity_id,
                is_active,
                created_at,
                updated_at,
                created_by
            FROM finance_vendors
            WHERE (entity_id = $1 OR entity_id IS NULL)
            ORDER BY vendor_id DESC
        `;

        const vendorsResult = await pool.query(vendorsQuery, [entity_id]);
        const vendors = vendorsResult.rows;

        const summary = expenses.reduce((acc, exp) => {
            acc.total_expenses += 1;
            acc.total_amount += parseFloat(exp.amount || 0);
            acc.total_tax += parseFloat(exp.tax_amount || 0);
            acc.total_grand += parseFloat(exp.total_amount || 0);
            const category = (exp.expense_category || 'غير محدد').toLowerCase();
            acc.by_category[category] = (acc.by_category[category] || 0) + parseFloat(exp.total_amount || 0);
            const statusKey = (exp.status || 'غير محدد').toLowerCase();
            acc.by_status[statusKey] = (acc.by_status[statusKey] || 0) + 1;
            return acc;
        }, {
            total_expenses: 0,
            total_amount: 0,
            total_tax: 0,
            total_grand: 0,
            by_category: {},
            by_status: {}
        });

        summary.total_vendors = vendors.length;
        summary.active_vendors = vendors.filter(v => v.is_active === true).length;
        summary.entity_id = entity_id;
        summary.generated_at = new Date().toISOString();

        res.json({
            success: true,
            expenses,
            vendors,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching expenses:', error);
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

async function createExpense(req, res) {
    try {
        const {
            expense_number,
            expense_date,
            expense_category,
            expense_type,
            vendor_id,
            vendor_name,
            amount,
            tax_amount = 0,
            status = 'approved',
            entity_type = 'HQ',
            entity_id = 'HQ001',
            branch_id = null,
            incubator_id = null,
            platform_id = null,
            invoice_number = null,
            receipt_file = null,
            attachments = null,
            description = null,
            notes = null,
            created_by = 'النظام'
        } = req.body || {};

        if (!expense_number || !expense_date || !expense_category || !expense_type || !vendor_id || !vendor_name || amount == null) {
            return res.status(400).json({
                success: false,
                error: 'رقم المصروف وتاريخ المصروف والفئة والنوع ورقم المورد واسم المورد والمبلغ مطلوبة'
            });
        }

        const parsedAmount = parseFloat(amount);
        const parsedTax = parseFloat(tax_amount || 0);
        const total_amount = parsedAmount + parsedTax;

        const insertQuery = `
            INSERT INTO finance_expenses (
                expense_number, expense_date, expense_category, expense_type, vendor_id, vendor_name,
                amount, tax_amount, total_amount, status, entity_type, entity_id, branch_id, incubator_id,
                platform_id, invoice_number, receipt_file, attachments, description, notes, created_by
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
            )
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
            expense_number,
            expense_date,
            expense_category,
            expense_type,
            vendor_id,
            vendor_name,
            parsedAmount,
            parsedTax,
            total_amount,
            status,
            entity_type,
            entity_id,
            branch_id,
            incubator_id,
            platform_id,
            invoice_number,
            receipt_file,
            attachments ? JSON.stringify(attachments) : null,
            description,
            notes,
            created_by
        ]);

        res.status(201).json({ success: true, expense: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating expense:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updateExpense(req, res) {
    const { id } = req.params;
    const { expense_date, amount, tax_amount, status, notes } = req.body;

    try {
        const result = await pool.query(
            `UPDATE finance_expenses
             SET expense_date = COALESCE($1, expense_date),
                 amount = COALESCE($2, amount),
                 tax_amount = COALESCE($3, tax_amount),
                 status = COALESCE($4, status),
                 notes = COALESCE($5, notes),
                 updated_at = NOW()
             WHERE expense_id = $6
             RETURNING *`,
            [expense_date || null, amount ?? null, tax_amount ?? null, status || null, notes || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Expense not found' });
        }

        res.json({ success: true, expense: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating expense:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function createVendor(req, res) {
    try {
        const {
            vendor_code,
            vendor_name_ar,
            vendor_name_en = null,
            vendor_type = null,
            email = null,
            phone = null,
            mobile = null,
            address = null,
            city = null,
            country = 'المملكة العربية السعودية',
            tax_number = null,
            commercial_registration = null,
            payment_terms = null,
            payment_term_days = 30,
            entity_type = 'HQ',
            entity_id = 'HQ001',
            is_active = true,
            created_by = 'النظام'
        } = req.body || {};

        if (!vendor_code || !vendor_name_ar) {
            return res.status(400).json({ success: false, error: 'كود المورد واسم المورد (عربي) مطلوبان' });
        }

        const insertQuery = `
            INSERT INTO finance_vendors (
                vendor_code, vendor_name_ar, vendor_name_en, vendor_type, email, phone, mobile,
                address, city, country, tax_number, commercial_registration, payment_terms, payment_term_days,
                entity_type, entity_id, is_active, created_by
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
            )
            ON CONFLICT (vendor_code) DO UPDATE SET
                vendor_name_ar = EXCLUDED.vendor_name_ar,
                vendor_name_en = EXCLUDED.vendor_name_en,
                vendor_type = EXCLUDED.vendor_type,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                mobile = EXCLUDED.mobile,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                country = EXCLUDED.country,
                tax_number = EXCLUDED.tax_number,
                commercial_registration = EXCLUDED.commercial_registration,
                payment_terms = EXCLUDED.payment_terms,
                payment_term_days = EXCLUDED.payment_term_days,
                entity_type = EXCLUDED.entity_type,
                entity_id = EXCLUDED.entity_id,
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING *;
        `;

        const result = await pool.query(insertQuery, [
            vendor_code,
            vendor_name_ar,
            vendor_name_en,
            vendor_type,
            email,
            phone,
            mobile,
            address,
            city,
            country,
            tax_number,
            commercial_registration,
            payment_terms,
            payment_term_days,
            entity_type,
            entity_id,
            typeof is_active === 'string'
                ? ['true', 'نعم', '1'].includes(is_active.toLowerCase())
                : !!is_active,
            created_by
        ]);

        res.status(201).json({ success: true, vendor: result.rows[0] });
    } catch (error) {
        console.error('❌ Error creating vendor:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteExpense(req, res) {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM finance_expenses WHERE expense_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'المصروف غير موجود' });
        }
        res.json({ success: true, expense: result.rows[0] });
    } catch (error) {
        console.error('❌ Error deleting expense:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function updateVendor(req, res) {
    const { id } = req.params;
    const { vendor_name_ar, email, phone, is_active } = req.body;
    const parsedActive = typeof is_active === 'string'
        ? ['true', 'نعم', '1'].includes(is_active.toLowerCase())
        : is_active;

    try {
        const result = await pool.query(
            `UPDATE finance_vendors
             SET vendor_name_ar = COALESCE($1, vendor_name_ar),
                 email = COALESCE($2, email),
                 phone = COALESCE($3, phone),
                 is_active = COALESCE($4, is_active),
                 updated_at = NOW()
             WHERE vendor_id = $5
             RETURNING *`,
            [vendor_name_ar || null, email || null, phone || null, parsedActive ?? null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'المورد غير موجود' });
        }

        res.json({ success: true, vendor: result.rows[0] });
    } catch (error) {
        console.error('❌ Error updating vendor:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

async function deleteVendor(req, res) {
    const { id } = req.params;
    try {
        const usageCheck = await pool.query(
            'SELECT COUNT(*)::int AS count FROM finance_expenses WHERE vendor_id = $1',
            [id]
        );

        if (usageCheck.rows[0]?.count > 0) {
            return res.status(409).json({
                success: false,
                error: 'لا يمكن حذف المورد لأنه مرتبط بمصروفات مسجلة.'
            });
        }

        const result = await pool.query('DELETE FROM finance_vendors WHERE vendor_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'المورد غير موجود' });
        }
        res.json({ success: true, vendor: result.rows[0] });
    } catch (error) {
        console.error('❌ Error deleting vendor:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = {
    getExpenses,
    testConnection,
    createExpense,
    updateExpense,
    deleteExpense,
    createVendor,
    updateVendor,
    deleteVendor
};
