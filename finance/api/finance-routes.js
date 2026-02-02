const express = require('express');
const router = express.Router();
const db = require('../../db');

// ========================================
// Helper Functions
// ========================================

// Entity Filter Helper
const getEntityFilter = (userEntity, tableAlias = '') => {
  const alias = tableAlias ? `${tableAlias}.` : '';
  
  if (userEntity.type === 'HQ') {
    return '1=1';
  } else if (userEntity.type === 'BRANCH') {
    return `${alias}branch_id = '${userEntity.id}' OR ${alias}entity_id = '${userEntity.id}'`;
  } else if (userEntity.type === 'INCUBATOR') {
    return `${alias}incubator_id = '${userEntity.id}' OR ${alias}entity_id = '${userEntity.id}'`;
  } else if (userEntity.type === 'PLATFORM') {
    return `${alias}platform_id = '${userEntity.id}' OR ${alias}entity_id = '${userEntity.id}'`;
  } else if (userEntity.type === 'OFFICE') {
    return `${alias}office_id = '${userEntity.id}' OR ${alias}entity_id = '${userEntity.id}'`;
  }
  
  return `${alias}entity_id = '${userEntity.id}'`;
};

// Generate Next Number Helper
const generateNextNumber = async (prefix, table, column) => {
  const result = await db.query(
    `SELECT ${column} FROM ${table} WHERE ${column} LIKE $1 ORDER BY ${column} DESC LIMIT 1`,
    [`${prefix}%`]
  );
  
  if (result.rows.length === 0) {
    return `${prefix}0001`;
  }
  
  const lastNumber = result.rows[0][column];
  const numPart = parseInt(lastNumber.replace(prefix, ''));
  const nextNum = numPart + 1;
  return `${prefix}${nextNum.toString().padStart(4, '0')}`;
};

// ========================================
// CHART OF ACCOUNTS APIs
// ========================================

// Get all accounts (with hierarchy)
router.get('/accounts', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { type, parent_id, level, active_only } = req.query;
    
    let query = `
      SELECT 
        a.*,
        p.account_name_ar as parent_name,
        (SELECT COUNT(*) FROM finance_accounts WHERE parent_account_id = a.account_id) as children_count
      FROM finance_accounts a
      LEFT JOIN finance_accounts p ON a.parent_account_id = p.account_id
      WHERE ${getEntityFilter(userEntity, 'a')}
    `;
    
    const params = [];
    
    if (type) {
      params.push(type);
      query += ` AND a.account_type = $${params.length}`;
    }
    
    if (parent_id) {
      params.push(parent_id);
      query += ` AND a.parent_account_id = $${params.length}`;
    }
    
    if (level) {
      params.push(level);
      query += ` AND a.level = $${params.length}`;
    }
    
    if (active_only === 'true') {
      query += ` AND a.is_active = true`;
    }
    
    query += ` ORDER BY a.account_code`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      accounts: result.rows
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get account by ID with balance
router.get('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const accountResult = await db.query(
      'SELECT * FROM finance_accounts WHERE account_id = $1',
      [id]
    );
    
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    const account = accountResult.rows[0];
    
    // Get balance
    const balanceResult = await db.query(
      `SELECT * FROM finance_account_balances WHERE account_id = $1`,
      [id]
    );
    
    res.json({
      success: true,
      account: account,
      balance: balanceResult.rows[0] || { balance: 0, total_debit: 0, total_credit: 0 }
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new account
router.post('/accounts', async (req, res) => {
  try {
    const {
      account_code,
      account_name_ar,
      account_name_en,
      account_type,
      parent_account_id,
      level,
      is_header,
      normal_balance,
      description,
      entity_type,
      entity_id,
      branch_id,
      incubator_id
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO finance_accounts 
       (account_code, account_name_ar, account_name_en, account_type, parent_account_id, 
        level, is_header, normal_balance, description, entity_type, entity_id, branch_id, incubator_id,
        created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [account_code, account_name_ar, account_name_en, account_type, parent_account_id,
       level, is_header, normal_balance, description, entity_type, entity_id, branch_id, incubator_id,
       req.headers['x-user-id'] || 'system']
    );
    
    res.status(201).json({
      success: true,
      account: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// JOURNAL ENTRIES APIs
// ========================================

// Get all journal entries
router.get('/journal-entries', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { status, from_date, to_date, type, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        je.*,
        COUNT(jl.line_id) as lines_count,
        SUM(jl.debit_amount) as total_debit,
        SUM(jl.credit_amount) as total_credit
      FROM finance_journal_entries je
      LEFT JOIN finance_journal_lines jl ON je.entry_id = jl.entry_id
      WHERE ${getEntityFilter(userEntity, 'je')}
    `;
    
    const params = [];
    
    if (status) {
      params.push(status);
      query += ` AND je.status = $${params.length}`;
    }
    
    if (from_date) {
      params.push(from_date);
      query += ` AND je.entry_date >= $${params.length}`;
    }
    
    if (to_date) {
      params.push(to_date);
      query += ` AND je.entry_date <= $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      query += ` AND je.entry_type = $${params.length}`;
    }
    
    query += ` GROUP BY je.entry_id ORDER BY je.entry_date DESC, je.entry_number DESC`;
    
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      entries: result.rows
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get journal entry by ID with lines
router.get('/journal-entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const entryResult = await db.query(
      'SELECT * FROM finance_journal_entries WHERE entry_id = $1',
      [id]
    );
    
    if (entryResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Journal entry not found' });
    }
    
    const linesResult = await db.query(
      `SELECT 
        jl.*,
        a.account_name_ar,
        a.account_type
       FROM finance_journal_lines jl
       JOIN finance_accounts a ON jl.account_id = a.account_id
       WHERE jl.entry_id = $1
       ORDER BY jl.line_number`,
      [id]
    );
    
    res.json({
      success: true,
      entry: entryResult.rows[0],
      lines: linesResult.rows
    });
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new journal entry
router.post('/journal-entries', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      entry_date,
      entry_type = 'MANUAL',
      description,
      reference_number,
      reference_type,
      reference_id,
      entity_type,
      entity_id,
      branch_id,
      incubator_id,
      platform_id,
      fiscal_year,
      fiscal_period,
      lines = []
    } = req.body;
    
    // Validate: Total debits must equal total credits
    const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Total debits must equal total credits',
        totalDebit,
        totalCredit
      });
    }
    
    // Generate entry number
    const entry_number = await generateNextNumber('JE', 'finance_journal_entries', 'entry_number');
    
    // Create journal entry
    const entryResult = await client.query(
      `INSERT INTO finance_journal_entries 
       (entry_number, entry_date, entry_type, description, reference_number, reference_type, reference_id,
        entity_type, entity_id, branch_id, incubator_id, platform_id, fiscal_year, fiscal_period,
        status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'DRAFT', $15)
       RETURNING *`,
      [entry_number, entry_date, entry_type, description, reference_number, reference_type, reference_id,
       entity_type, entity_id, branch_id, incubator_id, platform_id, fiscal_year, fiscal_period,
       req.headers['x-user-id'] || 'system']
    );
    
    const entry_id = entryResult.rows[0].entry_id;
    
    // Create journal lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      await client.query(
        `INSERT INTO finance_journal_lines 
         (entry_id, line_number, account_id, account_code, debit_amount, credit_amount, description,
          entity_type, entity_id, branch_id, incubator_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [entry_id, i + 1, line.account_id, line.account_code, 
         line.debit_amount || 0, line.credit_amount || 0, line.description,
         entity_type, entity_id, branch_id, incubator_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      entry: entryResult.rows[0],
      message: 'Journal entry created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating journal entry:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// Post journal entry (make it permanent)
router.post('/journal-entries/:id/post', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `UPDATE finance_journal_entries 
       SET status = 'POSTED', is_posted = true, posted_at = NOW(), posted_by = $1
       WHERE entry_id = $2 AND status = 'DRAFT'
       RETURNING *`,
      [req.headers['x-user-id'] || 'system', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Journal entry not found or already posted' 
      });
    }
    
    res.json({
      success: true,
      entry: result.rows[0],
      message: 'Journal entry posted successfully'
    });
  } catch (error) {
    console.error('Error posting journal entry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// INVOICES APIs
// ========================================

// Get all invoices
router.get('/invoices', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { status, customer_id, from_date, to_date, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        i.*,
        c.customer_name_ar,
        c.customer_code,
        c.risk_level
      FROM finance_invoices i
      JOIN finance_customers c ON i.customer_id = c.customer_id
      WHERE ${getEntityFilter(userEntity, 'i')}
    `;
    
    const params = [];
    
    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }
    
    if (customer_id) {
      params.push(customer_id);
      query += ` AND i.customer_id = $${params.length}`;
    }
    
    if (from_date) {
      params.push(from_date);
      query += ` AND i.invoice_date >= $${params.length}`;
    }
    
    if (to_date) {
      params.push(to_date);
      query += ` AND i.invoice_date <= $${params.length}`;
    }
    
    query += ` ORDER BY i.invoice_date DESC, i.invoice_number DESC`;
    
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      invoices: result.rows
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get invoice by ID with lines
router.get('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoiceResult = await db.query(
      `SELECT 
        i.*,
        c.customer_name_ar,
        c.customer_code,
        c.email,
        c.phone,
        c.address,
        c.tax_number,
        c.risk_level
       FROM finance_invoices i
       JOIN finance_customers c ON i.customer_id = c.customer_id
       WHERE i.invoice_id = $1`,
      [id]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    
    const linesResult = await db.query(
      `SELECT * FROM finance_invoice_lines WHERE invoice_id = $1 ORDER BY line_number`,
      [id]
    );
    
    const paymentsResult = await db.query(
      `SELECT 
        p.*,
        pa.allocated_amount
       FROM finance_payments p
       JOIN finance_payment_allocations pa ON p.payment_id = pa.payment_id
       WHERE pa.invoice_id = $1
       ORDER BY p.payment_date DESC`,
      [id]
    );
    
    res.json({
      success: true,
      invoice: invoiceResult.rows[0],
      lines: linesResult.rows,
      payments: paymentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update invoice
router.put('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      due_date,
      total_amount,
      status,
      notes
    } = req.body;

    const result = await db.query(
      `UPDATE finance_invoices
       SET due_date = COALESCE($1, due_date),
           total_amount = COALESCE($2, total_amount),
           status = COALESCE($3, status),
           notes = COALESCE($4, notes),
           updated_at = NOW()
       WHERE invoice_id = $5
       RETURNING *`,
      [due_date || null, total_amount ?? null, status || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, invoice: result.rows[0] });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete invoice
router.delete('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM finance_invoice_lines WHERE invoice_id = $1', [id]);
    const result = await db.query('DELETE FROM finance_invoices WHERE invoice_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.json({ success: true, invoice: result.rows[0] });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new invoice
router.post('/invoices', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      customer_id,
      invoice_date,
      due_date,
      program_id,
      service_id,
      entity_type,
      entity_id,
      branch_id,
      incubator_id,
      platform_id,
      allow_partial_payment = true,
      allow_installments = false,
      notes,
      lines = []
    } = req.body;
    
    // Get customer info
    const customerResult = await client.query(
      'SELECT * FROM finance_customers WHERE customer_id = $1',
      [customer_id]
    );
    
    if (customerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    const customer = customerResult.rows[0];
    
    // Calculate totals
    let subtotal = 0;
    let tax_amount = 0;
    let discount_amount = 0;
    
    for (const line of lines) {
      const lineSubtotal = line.quantity * line.unit_price;
      const lineDiscount = line.discount_amount || (lineSubtotal * (line.discount_percentage || 0) / 100);
      const lineTaxable = lineSubtotal - lineDiscount;
      const lineTax = lineTaxable * (line.tax_percentage || 15) / 100;
      
      subtotal += lineSubtotal;
      discount_amount += lineDiscount;
      tax_amount += lineTax;
    }
    
    const total_amount = subtotal - discount_amount + tax_amount;
    
    // Generate invoice number
    const invoice_number = await generateNextNumber('INV', 'finance_invoices', 'invoice_number');
    
    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO finance_invoices 
       (invoice_number, invoice_date, due_date, customer_id, customer_name,
        subtotal, tax_amount, discount_amount, total_amount, remaining_amount,
        program_id, service_id, entity_type, entity_id, branch_id, incubator_id, platform_id,
        allow_partial_payment, allow_installments, notes, status, payment_status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'ISSUED', 'UNPAID', $21)
       RETURNING *`,
      [invoice_number, invoice_date, due_date, customer_id, customer.customer_name_ar,
       subtotal, tax_amount, discount_amount, total_amount, total_amount,
       program_id, service_id, entity_type, entity_id, branch_id, incubator_id, platform_id,
       allow_partial_payment, allow_installments, notes,
       req.headers['x-user-id'] || 'system']
    );
    
    const invoice_id = invoiceResult.rows[0].invoice_id;
    
    // Create invoice lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineSubtotal = line.quantity * line.unit_price;
      const lineDiscount = line.discount_amount || (lineSubtotal * (line.discount_percentage || 0) / 100);
      const lineTaxable = lineSubtotal - lineDiscount;
      const lineTax = lineTaxable * (line.tax_percentage || 15) / 100;
      const lineTotal = lineTaxable + lineTax;
      
      await client.query(
        `INSERT INTO finance_invoice_lines 
         (invoice_id, line_number, item_code, item_name, description, quantity, unit_price,
          discount_percentage, discount_amount, tax_percentage, tax_amount, line_total, revenue_account_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [invoice_id, i + 1, line.item_code, line.item_name, line.description,
         line.quantity, line.unit_price, line.discount_percentage || 0, lineDiscount,
         line.tax_percentage || 15, lineTax, lineTotal, line.revenue_account_id]
      );
    }
    
    // Create automatic journal entry
    const entry_number = await generateNextNumber('JE', 'finance_journal_entries', 'entry_number');
    
    const journalResult = await client.query(
      `INSERT INTO finance_journal_entries 
       (entry_number, entry_date, entry_type, description, reference_number, reference_type, reference_id,
        entity_type, entity_id, branch_id, incubator_id, status, is_posted, created_by)
       VALUES ($1, $2, 'AUTO', $3, $4, 'INVOICE', $5, $6, $7, $8, $9, 'POSTED', true, $10)
       RETURNING *`,
      [entry_number, invoice_date, `قيد آلي - فاتورة رقم ${invoice_number}`, invoice_number, invoice_id,
       entity_type, entity_id, branch_id, incubator_id, req.headers['x-user-id'] || 'system']
    );
    
    const journal_entry_id = journalResult.rows[0].entry_id;
    
    // Debit: Accounts Receivable
    await client.query(
      `INSERT INTO finance_journal_lines 
       (entry_id, line_number, account_id, account_code, debit_amount, credit_amount, description)
       VALUES ($1, 1, (SELECT account_id FROM finance_accounts WHERE account_code = '1130'), '1130', $2, 0, $3)`,
      [journal_entry_id, total_amount, `ذمم مدينة - ${customer.customer_name_ar}`]
    );
    
    // Credit: Revenue (from lines)
    await client.query(
      `INSERT INTO finance_journal_lines 
       (entry_id, line_number, account_id, account_code, debit_amount, credit_amount, description)
       VALUES ($1, 2, (SELECT account_id FROM finance_accounts WHERE account_code = '4100'), '4100', 0, $2, $3)`,
      [journal_entry_id, subtotal - discount_amount, `إيرادات`]
    );
    
    // Credit: Tax Payable (if applicable)
    if (tax_amount > 0) {
      await client.query(
        `INSERT INTO finance_journal_lines 
         (entry_id, line_number, account_id, account_code, debit_amount, credit_amount, description)
         VALUES ($1, 3, (SELECT account_id FROM finance_accounts WHERE account_code = '2140'), '2140', 0, $2, $3)`,
        [journal_entry_id, tax_amount, `ضريبة القيمة المضافة`]
      );
    }
    
    // Update invoice with journal entry ID
    await client.query(
      'UPDATE finance_invoices SET journal_entry_id = $1 WHERE invoice_id = $2',
      [journal_entry_id, invoice_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      invoice: invoiceResult.rows[0],
      journal_entry_id: journal_entry_id,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// ========================================
// PAYMENTS APIs
// ========================================

// Get all payments
router.get('/payments', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { status, customer_id, from_date, to_date, entity_id, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        p.*,
        c.customer_name_ar,
        c.customer_code
      FROM finance_payments p
      JOIN finance_customers c ON p.customer_id = c.customer_id
      WHERE ${getEntityFilter(userEntity, 'p')}
    `;
    
    const params = [];
    
    if (entity_id) {
      params.push(entity_id);
      query += ` AND p.entity_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }
    
    if (customer_id) {
      params.push(customer_id);
      query += ` AND p.customer_id = $${params.length}`;
    }
    
    if (from_date) {
      params.push(from_date);
      query += ` AND p.payment_date >= $${params.length}`;
    }
    
    if (to_date) {
      params.push(to_date);
      query += ` AND p.payment_date <= $${params.length}`;
    }
    
    query += ` ORDER BY p.payment_date DESC, p.payment_number DESC`;
    
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      payments: result.rows
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create payment
router.post('/payments', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      customer_id,
      customer_name,
      payment_date,
      payment_amount,
      payment_method,
      payment_type = 'FULL',
      bank_name,
      check_number,
      transaction_reference,
      entity_type,
      entity_id,
      branch_id,
      incubator_id,
      notes,
      allocations = [] // [{ invoice_id, allocated_amount }]
    } = req.body;
    const resolvedEntityId = entity_id || (req.userEntity ? req.userEntity.id : 'HQ001');
    const resolvedEntityType = entity_type || (req.userEntity ? req.userEntity.type : 'HQ');
    
    // Get customer info
    let customer = null;
    if (customer_id) {
      const customerResult = await client.query(
        'SELECT * FROM finance_customers WHERE customer_id = $1',
        [customer_id]
      );
      customer = customerResult.rows[0] || null;
    }

    if (!customer) {
      const nameValue = (customer_name || '').trim();
      if (!nameValue) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }

      const customerCode = await generateNextNumber('CUST', 'finance_customers', 'customer_code');
      const created = await client.query(
        `INSERT INTO finance_customers
         (customer_code, customer_name_ar, customer_name_en, entity_type, entity_id, branch_id, incubator_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          customerCode,
          nameValue,
          nameValue,
          resolvedEntityType,
          resolvedEntityId,
          branch_id || null,
          incubator_id || null,
          req.headers['x-user-id'] || 'system'
        ]
      );
      customer = created.rows[0];
    }
    
    // Validate allocation total
    if (allocations.length) {
      const totalAllocated = allocations.reduce((sum, a) => sum + parseFloat(a.allocated_amount), 0);
      if (Math.abs(totalAllocated - payment_amount) > 0.01) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Total allocated amount must equal payment amount',
          payment_amount,
          totalAllocated
        });
      }
    }
    
    // Generate payment number
    const payment_number = await generateNextNumber('PAY', 'finance_payments', 'payment_number');
    
    // Create payment
    const paymentResult = await client.query(
      `INSERT INTO finance_payments 
       (payment_number, payment_date, customer_id, customer_name, payment_amount, payment_method,
        payment_type, bank_name, check_number, transaction_reference,
        entity_type, entity_id, branch_id, incubator_id, notes, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'APPROVED', $16)
       RETURNING *`,
      [payment_number, payment_date, customer.customer_id, customer.customer_name_ar, payment_amount, payment_method,
       payment_type, bank_name, check_number, transaction_reference,
       resolvedEntityType, resolvedEntityId, branch_id, incubator_id, notes, req.headers['x-user-id'] || 'system']
    );
    
    const payment_id = paymentResult.rows[0].payment_id;
    
    // Create allocations and update invoices
    for (const allocation of allocations) {
      await client.query(
        `INSERT INTO finance_payment_allocations (payment_id, invoice_id, allocated_amount)
         VALUES ($1, $2, $3)`,
        [payment_id, allocation.invoice_id, allocation.allocated_amount]
      );
      
      // Update invoice
      await client.query(
        `UPDATE finance_invoices 
         SET paid_amount = paid_amount + $1,
             remaining_amount = remaining_amount - $2,
             payment_status = CASE 
               WHEN remaining_amount - $3 <= 0 THEN 'PAID'
               ELSE 'PARTIAL'
             END,
             status = CASE 
               WHEN remaining_amount - $4 <= 0 THEN 'PAID'
               ELSE status
             END,
             updated_at = NOW()
         WHERE invoice_id = $5`,
        [allocation.allocated_amount, allocation.allocated_amount, 
         allocation.allocated_amount, allocation.allocated_amount, allocation.invoice_id]
      );
    }
    
    // Create automatic journal entry
    const entry_number = await generateNextNumber('JE', 'finance_journal_entries', 'entry_number');
    
    const journalResult = await client.query(
      `INSERT INTO finance_journal_entries 
       (entry_number, entry_date, entry_type, description, reference_number, reference_type, reference_id,
        entity_type, entity_id, branch_id, incubator_id, status, is_posted, created_by)
       VALUES ($1, $2, 'AUTO', $3, $4, 'PAYMENT', $5, $6, $7, $8, $9, 'POSTED', true, $10)
       RETURNING *`,
      [entry_number, payment_date, `قيد آلي - دفعة رقم ${payment_number}`, payment_number, payment_id,
       entity_type, entity_id, branch_id, incubator_id, req.headers['x-user-id'] || 'system']
    );
    
    const journal_entry_id = journalResult.rows[0].entry_id;
    
    // Debit: Cash/Bank
    const cashAccount = payment_method === 'CASH' ? '1110' : '1120';
    await client.query(
      `INSERT INTO finance_journal_lines 
       (entry_id, line_number, account_id, account_code, debit_amount, credit_amount, description)
       VALUES ($1, 1, (SELECT account_id FROM finance_accounts WHERE account_code = $2), $3, $4, 0, $5)`,
      [journal_entry_id, cashAccount, cashAccount, payment_amount, `دفعة من ${customer.customer_name_ar}`]
    );
    
    // Credit: Accounts Receivable
    await client.query(
      `INSERT INTO finance_journal_lines 
       (entry_id, line_number, account_id, account_code, debit_amount, credit_amount, description)
       VALUES ($1, 2, (SELECT account_id FROM finance_accounts WHERE account_code = '1130'), '1130', 0, $2, $3)`,
      [journal_entry_id, payment_amount, `ذمم مدينة - ${customer.customer_name_ar}`]
    );
    
    // Update payment with journal entry ID
    await client.query(
      'UPDATE finance_payments SET journal_entry_id = $1 WHERE payment_id = $2',
      [journal_entry_id, payment_id]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      payment: paymentResult.rows[0],
      journal_entry_id: journal_entry_id,
      message: 'Payment created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// Update payment
router.put('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      payment_date,
      payment_amount,
      payment_method,
      status,
      notes
    } = req.body;

    const result = await db.query(
      `UPDATE finance_payments
       SET payment_date = COALESCE($1, payment_date),
           payment_amount = COALESCE($2, payment_amount),
           payment_method = COALESCE($3, payment_method),
           status = COALESCE($4, status),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE payment_id = $6
       RETURNING *`,
      [payment_date || null, payment_amount ?? null, payment_method || null, status || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, payment: result.rows[0] });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete payment
router.delete('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM finance_payment_allocations WHERE payment_id = $1', [id]);
    const result = await db.query('DELETE FROM finance_payments WHERE payment_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.json({ success: true, payment: result.rows[0] });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// CUSTOMERS APIs
// ========================================

// Get all customers
router.get('/customers', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { risk_level, is_active, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT i.invoice_id) as invoices_count,
        COALESCE(SUM(i.total_amount), 0) as total_invoiced,
        COALESCE(SUM(i.remaining_amount), 0) as total_outstanding
      FROM finance_customers c
      LEFT JOIN finance_invoices i ON c.customer_id = i.customer_id
      WHERE ${getEntityFilter(userEntity, 'c')}
    `;
    
    const params = [];
    
    if (risk_level) {
      params.push(risk_level);
      query += ` AND c.risk_level = $${params.length}`;
    }
    
    if (is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND c.is_active = $${params.length}`;
    }
    
    query += ` GROUP BY c.customer_id ORDER BY c.customer_name_ar`;
    
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      customers: result.rows
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create customer
router.post('/customers', async (req, res) => {
  try {
    const {
      customer_name_ar,
      customer_name_en,
      customer_type = 'INDIVIDUAL',
      email,
      phone,
      mobile,
      address,
      city,
      country = 'Saudi Arabia',
      tax_number,
      commercial_registration,
      credit_limit = 0,
      credit_period_days = 30,
      entity_type,
      entity_id,
      branch_id,
      incubator_id,
      program_id
    } = req.body;
    
    // Generate customer code
    const customer_code = await generateNextNumber('CUST', 'finance_customers', 'customer_code');
    
    const result = await db.query(
      `INSERT INTO finance_customers 
       (customer_code, customer_name_ar, customer_name_en, customer_type, email, phone, mobile,
        address, city, country, tax_number, commercial_registration, credit_limit, credit_period_days,
        entity_type, entity_id, branch_id, incubator_id, program_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [customer_code, customer_name_ar, customer_name_en, customer_type, email, phone, mobile,
       address, city, country, tax_number, commercial_registration, credit_limit, credit_period_days,
       entity_type, entity_id, branch_id, incubator_id, program_id, req.headers['x-user-id'] || 'system']
    );
    
    res.status(201).json({
      success: true,
      customer: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
