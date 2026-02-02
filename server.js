const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const ensureFacilitiesContractsTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS facilities_project_contracts (
        id SERIAL PRIMARY KEY,
        contract_name TEXT NOT NULL,
        partner TEXT NOT NULL,
        expiry DATE,
        value_text TEXT,
        status TEXT DEFAULT 'قيد المراجعة',
        sla_percent NUMERIC,
        risk_level TEXT DEFAULT 'متوسط',
        entity_id TEXT,
        entity_type TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ facilities_project_contracts table ready');
  } catch (error) {
    console.error('❌ Failed to ensure facilities_project_contracts table:', error);
  }
};

ensureFacilitiesContractsTable();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Authentication API Routes
const authRoutes = require('./auth-api');
app.use('/api/auth', authRoutes);

// Sidebar Menu API Routes
const menuRoutes = require('./sidebar-menu-api');
app.use('/api/menu', menuRoutes);

// Super Admin API Routes
const superAdminRoutes = require('./super-admin-api');
app.use('/api/admin', superAdminRoutes);

// Permissions API Routes
const permissionsRoutes = require('./api-permissions-routes');
app.use('/api/permissions', permissionsRoutes);

// Serve static files (must come AFTER API routes to avoid conflicts)
app.get(['/finance', '/finance/', '/finance/*.html'], (req, res, next) => {
  try {
    const requestPath = req.path === '/finance' || req.path === '/finance/'
      ? '/finance/index.html'
      : req.path;
    const safePath = decodeURIComponent(requestPath).replace(/\.{2,}/g, '');
    const filePath = path.join(__dirname, safePath);

    if (!filePath.startsWith(path.join(__dirname, 'finance')) || !fs.existsSync(filePath)) {
      return next();
    }

    let html = fs.readFileSync(filePath, 'utf8');
    html = html
      .replace(/const ENTITY_ID = '1';/g, "const ENTITY_ID = window.getFinanceEntityId ? window.getFinanceEntityId() : 'HQ001';")
      .replace(/const ENTITY_ID = 'HQ001';/g, "const ENTITY_ID = window.getFinanceEntityId ? window.getFinanceEntityId() : 'HQ001';")
      .replace(/const CASHFLOW_ENTITY_ID = '1';/g, "const CASHFLOW_ENTITY_ID = window.getFinanceEntityId ? window.getFinanceEntityId() : 'HQ001';")
      .replace(/const AR_ENTITY_ID = 'HQ001';/g, "const AR_ENTITY_ID = window.getFinanceEntityId ? window.getFinanceEntityId() : 'HQ001';");
    const hasTheme = html.includes('/finance/brand-theme.css');
    const injection = hasTheme
      ? '    <script src="/finance/finance-context.js"></script>\n'
      : '    <link rel="stylesheet" href="/finance/brand-theme.css">\n    <script src="/finance/brand-theme.js"></script>\n    <script src="/finance/finance-context.js"></script>\n';
    const injected = html.replace('</head>', `${injection}</head>`);
    res.type('html').send(injected);
  } catch (error) {
    next();
  }
});

app.use(express.static('.'));

// Finance System API Routes
const financeRoutes = require('./finance/api/finance-routes');
app.use('/finance', financeRoutes);

// Finance Cashflow API Routes (Page 1: Operating, Investing, Financing + AI Forecasting)
const cashflowRoutes = require('./finance/api/cashflow-routes');
app.use('/finance/cashflow', cashflowRoutes);

// Finance Journal API Routes (Page 2: Journal Entries & General Ledger)
const journalAPI = require('./finance/api/journal');
app.get('/finance/journal/test', journalAPI.testConnection);
app.get('/finance/journal/entries/:entry_id', journalAPI.getJournalEntry);
app.get('/finance/journal/entries', journalAPI.getJournalEntries);
app.post('/finance/journal/entries', journalAPI.createJournalEntry);
app.put('/finance/journal/entries/:entry_id', journalAPI.updateJournalEntry);
app.delete('/finance/journal/entries/:entry_id', journalAPI.deleteJournalEntry);
app.get('/finance/journal/balances', journalAPI.getAccountBalances);
app.get('/finance/journal/ledger/:account_id', journalAPI.getAccountLedger);

// Finance Balance Sheet API Routes (Page 3: Balance Sheet - Assets, Liabilities, Equity)
const balanceSheetAPI = require('./finance/api/balance-sheet');
app.get('/finance/balance-sheet/test', balanceSheetAPI.testConnection);
app.get('/finance/balance-sheet', balanceSheetAPI.getBalanceSheet);
app.get('/finance/balance-sheet/assets', balanceSheetAPI.getAssets);
app.post('/finance/balance-sheet/assets', balanceSheetAPI.createAsset);
app.put('/finance/balance-sheet/assets/:asset_id', balanceSheetAPI.updateAsset);
app.delete('/finance/balance-sheet/assets/:asset_id', balanceSheetAPI.deleteAsset);
app.get('/finance/balance-sheet/liabilities', balanceSheetAPI.getLiabilities);
app.post('/finance/balance-sheet/liabilities', balanceSheetAPI.createLiability);
app.put('/finance/balance-sheet/liabilities/:liability_id', balanceSheetAPI.updateLiability);
app.delete('/finance/balance-sheet/liabilities/:liability_id', balanceSheetAPI.deleteLiability);
app.get('/finance/balance-sheet/equity', balanceSheetAPI.getEquity);
app.post('/finance/balance-sheet/equity', balanceSheetAPI.createEquity);
app.put('/finance/balance-sheet/equity/:equity_id', balanceSheetAPI.updateEquity);
app.delete('/finance/balance-sheet/equity/:equity_id', balanceSheetAPI.deleteEquity);
app.get('/finance/balance-sheet/complete', balanceSheetAPI.getCompleteBalanceSheet);

// Finance Income Statement API Routes (Page 4: Income Statement - Revenue & Expenses)
const incomeStatementAPI = require('./finance/api/income-statement');
app.get('/finance/income-statement/test', incomeStatementAPI.testConnection);
app.get('/finance/income-statement', incomeStatementAPI.getIncomeStatement);
app.post('/finance/income-statement/items', incomeStatementAPI.createIncomeItem);
app.put('/finance/income-statement/items/:item_id', incomeStatementAPI.updateIncomeItem);
app.delete('/finance/income-statement/items/:item_id', incomeStatementAPI.deleteIncomeItem);

// Finance Chart of Accounts API Routes (Page 5: Chart of Accounts)
const chartOfAccountsAPI = require('./finance/api/chart-of-accounts');
app.get('/finance/chart-of-accounts/test', chartOfAccountsAPI.testConnection);
app.get('/finance/chart-of-accounts', chartOfAccountsAPI.getChartOfAccounts);
app.get('/finance/chart-of-accounts/:account_id', chartOfAccountsAPI.getAccount);
app.post('/finance/chart-of-accounts', chartOfAccountsAPI.createAccount);
app.put('/finance/chart-of-accounts/:account_id', chartOfAccountsAPI.updateAccount);
app.delete('/finance/chart-of-accounts/:account_id', chartOfAccountsAPI.deleteAccount);

// Finance Payments API Routes (Page 6: Payments)
const paymentsAPI = require('./finance/api/payments');
app.get('/finance/payments/test', paymentsAPI.testConnection);
app.get('/finance/payments', paymentsAPI.getPayments);
app.post('/finance/payments', paymentsAPI.createPayment);
app.put('/finance/payments/:payment_id', paymentsAPI.updatePayment);
app.delete('/finance/payments/:payment_id', paymentsAPI.deletePayment);

// Finance Customers API Routes (Page 7: Customers)
const customersAPI = require('./finance/api/customers');
app.get('/finance/customers/test', customersAPI.testConnection);
app.get('/finance/customers', customersAPI.getCustomers);
app.post('/finance/customers', customersAPI.createCustomer);
app.put('/finance/customers/:customer_id', customersAPI.updateCustomer);
app.delete('/finance/customers/:customer_id', customersAPI.deleteCustomer);

// Finance AI Forecasts API Routes (Page 8: AI Forecasts)
const aiForecastsAPI = require('./finance/api/ai-forecasts');
app.get('/finance/ai-forecasts/test', aiForecastsAPI.testConnection);
app.get('/finance/ai-forecasts', aiForecastsAPI.getForecasts);
app.post('/finance/ai-forecasts', aiForecastsAPI.createForecast);
app.put('/finance/ai-forecasts/:forecast_id', aiForecastsAPI.updateForecast);
app.delete('/finance/ai-forecasts/:forecast_id', aiForecastsAPI.deleteForecast);

// Finance Cashflow Summary API Routes (Page 9: Cashflow Summary)
const cashflowSummaryAPI = require('./finance/api/cashflow-summary');
app.get('/finance/cashflow-summary/test', cashflowSummaryAPI.testConnection);
app.get('/finance/cashflow-summary', cashflowSummaryAPI.getCashflowSummary);
app.post('/finance/cashflow-summary', cashflowSummaryAPI.createCashflowSummary);
app.put('/finance/cashflow-summary', cashflowSummaryAPI.updateCashflowSummary);
app.delete('/finance/cashflow-summary', cashflowSummaryAPI.deleteCashflowSummary);

// Finance Journal Lines API Routes (Page 10: Journal Lines)
const journalLinesAPI = require('./finance/api/journal-lines');
app.get('/finance/journal-lines/test', journalLinesAPI.testConnection);
app.get('/finance/journal-lines', journalLinesAPI.getJournalLines);

// Finance Cashflow Transactions API Routes (Page 11: Cashflow Transactions)
const cashflowTransactionsAPI = require('./finance/api/cashflow-transactions');
app.get('/finance/cashflow-transactions/test', cashflowTransactionsAPI.testConnection);
app.get('/finance/cashflow-transactions', cashflowTransactionsAPI.getCashflowTransactions);

// Finance Cashflow Comprehensive API Routes (Page 12: Comprehensive Cashflow Report)
const cashflowComprehensiveAPI = require('./finance/api/cashflow-comprehensive');
app.get('/finance/cashflow-comprehensive/test', cashflowComprehensiveAPI.testConnection);
app.get('/finance/cashflow-comprehensive', cashflowComprehensiveAPI.getCashflowComprehensive);

// Finance AI Risk Scores API Routes (Page 13: AI Risk Scores)
const aiRiskScoresAPI = require('./finance/api/ai-risk-scores');
app.get('/finance/ai-risk-scores/test', aiRiskScoresAPI.testConnection);
app.get('/finance/ai-risk-scores', aiRiskScoresAPI.getRiskScores);

// Finance Fixed Assets API Routes (Page 14: Fixed Assets & Depreciation)
const fixedAssetsAPI = require('./finance/api/fixed-assets');
app.get('/finance/fixed-assets/test', fixedAssetsAPI.testConnection);
app.get('/finance/fixed-assets', fixedAssetsAPI.getFixedAssets);

// Finance Budgets API Routes (Page 15: Budgets & Variances)
const budgetsAPI = require('./finance/api/budgets');
app.get('/finance/budgets/test', budgetsAPI.testConnection);
app.get('/finance/budgets', budgetsAPI.getBudgets);

// Finance Payment Plans API Routes (Page 16: Payment Plans & Allocations)
const paymentPlansAPI = require('./finance/api/payment-plans');
app.get('/finance/payment-plans/test', paymentPlansAPI.testConnection);
app.get('/finance/payment-plans', paymentPlansAPI.getPaymentPlans);

// Finance Expenses API Routes (Page 17: Expenses & Vendors)
const expensesAPI = require('./finance/api/expenses');
app.get('/finance/expenses/test', expensesAPI.testConnection);
app.get('/finance/expenses', expensesAPI.getExpenses);
app.put('/finance/expenses/:id', expensesAPI.updateExpense);
app.delete('/finance/expenses/:id', expensesAPI.deleteExpense);
app.put('/finance/vendors/:id', expensesAPI.updateVendor);
app.delete('/finance/vendors/:id', expensesAPI.deleteVendor);

// Finance AR Aging API Routes (Page 18: Accounts Receivable Aging)
const arAgingAPI = require('./finance/api/ar-aging');
app.get('/finance/ar-aging/test', arAgingAPI.testConnection);
app.get('/finance/ar-aging', arAgingAPI.getARAging);

// Finance Plan Installments API Routes (Page 19: Plan Installments)
const planInstallmentsAPI = require('./finance/api/plan-installments');
app.get('/finance/plan-installments/test', planInstallmentsAPI.testConnection);
app.get('/finance/plan-installments', planInstallmentsAPI.getPlanInstallments);

// Finance Account Balances API Routes (Page 20: Account Balances)
const accountBalancesAPI = require('./finance/api/account-balances');
app.get('/finance/account-balances/test', accountBalancesAPI.testConnection);
app.get('/finance/account-balances', accountBalancesAPI.getAccountBalances);

// ========================================
// DATA ISOLATION MIDDLEWARE
// ========================================

// Middleware to extract and validate user entity
app.use((req, res, next) => {
  try {
    // In real production, this would come from JWT token
    // For now, we'll extract it from headers or use default
    const userEntityType = req.headers['x-entity-type'] || 'HQ';
    const userEntityId = req.headers['x-entity-id'] || 'HQ001';
    
    // Attach to request for use in routes
    req.userEntity = {
      type: userEntityType,
      id: userEntityId
    };
    
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid entity context' });
  }
});

// Helper function to build entity filter WHERE clause
const getEntityFilter = (userEntity, tableAlias = '') => {
  const alias = tableAlias ? `${tableAlias}.` : '';
  
  if (userEntity.type === 'HQ') {
    // HQ sees all data
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

// Root health check for Railway
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ========================================
// API Routes
// ========================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'OK', database: 'Connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// Facilities Projects Contracts API
app.get('/api/facilities/contracts', async (req, res) => {
  try {
    const filter = getEntityFilter(req.userEntity, 'c');
    const result = await db.query(
      `SELECT c.id, c.contract_name, c.partner, c.expiry, c.value_text, c.status, c.sla_percent, c.risk_level
       FROM facilities_project_contracts c
       WHERE ${filter}
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/facilities/contracts', async (req, res) => {
  try {
    const { contract_name, partner, expiry, value_text, status, sla_percent, risk_level } = req.body || {};
    if (!contract_name || !partner) {
      return res.status(400).json({ error: 'contract_name and partner are required' });
    }

    const result = await db.query(
      `INSERT INTO facilities_project_contracts
       (contract_name, partner, expiry, value_text, status, sla_percent, risk_level, entity_id, entity_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, contract_name, partner, expiry, value_text, status, sla_percent, risk_level`,
      [
        contract_name,
        partner,
        expiry || null,
        value_text || null,
        status || 'قيد المراجعة',
        sla_percent || null,
        risk_level || 'متوسط',
        req.userEntity.id,
        req.userEntity.type
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/facilities/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { contract_name, partner, expiry, value_text, status, sla_percent, risk_level } = req.body || {};
    const filter = getEntityFilter(req.userEntity, 'c');
    const result = await db.query(
      `UPDATE facilities_project_contracts c
       SET contract_name = COALESCE($1, c.contract_name),
           partner = COALESCE($2, c.partner),
           expiry = COALESCE($3, c.expiry),
           value_text = COALESCE($4, c.value_text),
           status = COALESCE($5, c.status),
           sla_percent = COALESCE($6, c.sla_percent),
           risk_level = COALESCE($7, c.risk_level),
           updated_at = NOW()
       WHERE c.id = $8 AND ${filter}
       RETURNING id, contract_name, partner, expiry, value_text, status, sla_percent, risk_level`,
      [
        contract_name || null,
        partner || null,
        expiry || null,
        value_text || null,
        status || null,
        sla_percent || null,
        risk_level || null,
        id
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/facilities/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = getEntityFilter(req.userEntity, 'c');
    const result = await db.query(
      `DELETE FROM facilities_project_contracts c
       WHERE c.id = $1 AND ${filter}
       RETURNING id`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all entities
app.get('/api/entities', async (req, res) => {
  try {
    // PERFORMANCE OPTIMIZATION: Support query parameters for filtering and limiting
    const { types, limit, offset } = req.query;
    
    let query = 'SELECT * FROM entities WHERE 1=1';
    const values = [];
    let paramIndex = 1;
    
    // Filter by entity types (comma-separated)
    if (types) {
      const typeArray = types.split(',').map(t => t.trim());
      query += ` AND type = ANY($${paramIndex})`;
      values.push(typeArray);
      paramIndex++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    // Apply limit
    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(parseInt(limit));
      paramIndex++;
    }
    
    // Apply offset for pagination
    if (offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(parseInt(offset));
      paramIndex++;
    }
    
    const result = await db.query(query, values);
    console.log(`📊 [/api/entities] Returned ${result.rows.length} entities (filters: ${types || 'none'}, limit: ${limit || 'none'})`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ [/api/entities] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get entity by ID
app.get('/api/entities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM entities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new entity
app.post('/api/entities', async (req, res) => {
  try {
    const { id, name, type, location, status = 'Active' } = req.body;
    
    if (!id || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields: id, name, type' });
    }
    
    const query = `
      INSERT INTO entities (id, name, type, location, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [id, name, type, location || '', status]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update entity
app.put('/api/entities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }
    
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      values.push(location);
      paramIndex++;
    }
    
    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    const query = `
      UPDATE entities 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete entity
app.delete('/api/entities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if entity exists
    const checkResult = await db.query('SELECT * FROM entities WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    // Delete entity
    const deleteQuery = 'DELETE FROM entities WHERE id = $1 RETURNING *';
    const result = await db.query(deleteQuery, [id]);
    
    res.json({ 
      message: 'Entity deleted successfully',
      entity: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users with data isolation
app.get('/api/users', async (req, res) => {
  try {
    const isHQ = req.userEntity.type === 'HQ';
    const whereClause = isHQ ? '1=1' : 'u.entity_id = $1';
    const params = isHQ ? [] : [req.userEntity.id];

    const query = `
      SELECT u.*, 
        COALESCE(e.name, 'غير محدد') as entity_name
      FROM users u
      LEFT JOIN entities e ON u.entity_id = e.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
    `;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new invoice
app.post('/api/invoices', async (req, res) => {
  try {
    const {
      id,
      entityId,
      type,
      title,
      amount,
      paidAmount,
      status,
      date,
      dueDate,
      customerName,
      customerNumber,
      customerPhone,
      customerEmail,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!id || !entityId || !type || !title || !amount || !date || !dueDate) {
      return res.status(400).json({ error: 'الرجاء تعبئة جميع الحقول المطلوبة' });
    }

    // Check permissions - only HQ or the entity itself can create invoice
    if (req.userEntity.type !== 'HQ' && entityId !== req.userEntity.id) {
      return res.status(403).json({ error: 'ليس لديك صلاحيات لإنشاء فاتورة لهذا الكيان' });
    }

    // Insert invoice
    const query = `
      INSERT INTO invoices (
        id, entity_id, type, title, amount, paid_amount, status,
        issue_date, due_date, customer_name, customer_number,
        customer_phone, customer_email, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      id,
      entityId,
      type,
      title,
      amount,
      paidAmount || 0,
      status || 'UNPAID',
      date,
      dueDate,
      customerName || null,
      customerNumber || null,
      customerPhone || null,
      customerEmail || null,
      paymentMethod || null
    ];

    const result = await db.query(query, values);
    res.json({ success: true, invoice: result.rows[0] });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all invoices with data isolation
app.get('/api/invoices', async (req, res) => {
  try {
    const { entity_id, status } = req.query;
    let query = 'SELECT * FROM invoices WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    
    // Apply user's entity filter
    if (req.userEntity.type === 'HQ') {
      // HQ sees all invoices
    } else if (req.userEntity.type === 'BRANCH') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'INCUBATOR') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'PLATFORM') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'OFFICE') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    }
    
    // Additional filters
    if (entity_id) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entity_id);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if invoice exists and user has permission
    const checkQuery = 'SELECT * FROM invoices WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }
    
    const invoice = checkResult.rows[0];
    
    // Check permissions - only HQ or the entity that created it can delete
    if (req.userEntity.type !== 'HQ' && invoice.entity_id !== req.userEntity.id) {
      return res.status(403).json({ error: 'ليس لديك صلاحيات لحذف هذه الفاتورة' });
    }
    
    // Delete the invoice
    const deleteQuery = 'DELETE FROM invoices WHERE id = $1 RETURNING *';
    const result = await db.query(deleteQuery, [id]);
    
    res.json({ 
      message: 'تم حذف الفاتورة بنجاح',
      invoice: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EMPLOYEE REQUESTS APIs
// ========================================

// Get all employee requests with data isolation
app.get('/api/employee-requests', async (req, res) => {
  try {
    const { status, request_type, employee_id } = req.query;
    let query = 'SELECT * FROM employee_requests WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    
    // Apply user's entity filter
    if (req.userEntity.type !== 'HQ') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    }
    
    // Additional filters
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (request_type) {
      query += ` AND request_type = $${paramIndex}`;
      params.push(request_type);
      paramIndex++;
    }
    
    if (employee_id) {
      query += ` AND employee_id = $${paramIndex}`;
      params.push(employee_id);
      paramIndex++;
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employee requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new employee request
app.post('/api/employee-requests', async (req, res) => {
  try {
    const {
      id,
      entityId,
      employeeId,
      employeeName,
      requestType,
      requestTitle,
      description,
      status,
      priority,
      requestData,
      requiresApproval,
      requestedDate,
      startDate,
      endDate,
      notes,
      createdBy
    } = req.body;

    // Validate required fields
    if (!id || !entityId || !employeeName || !requestType || !requestTitle || !requestedDate) {
      return res.status(400).json({ error: 'الرجاء تعبئة جميع الحقول المطلوبة' });
    }

    // Insert request
    const query = `
      INSERT INTO employee_requests (
        id, entity_id, employee_id, employee_name, request_type, request_title,
        description, status, priority, request_data, requires_approval,
        requested_date, start_date, end_date, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      id,
      entityId,
      employeeId || null,
      employeeName,
      requestType,
      requestTitle,
      description || null,
      status || 'PENDING',
      priority || 'NORMAL',
      requestData ? JSON.stringify(requestData) : null,
      requiresApproval !== undefined ? requiresApproval : true,
      requestedDate,
      startDate || null,
      endDate || null,
      notes || null,
      createdBy || null
    ];

    const result = await db.query(query, values);
    res.json({ success: true, request: result.rows[0] });
  } catch (error) {
    console.error('Error creating employee request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update employee request status
app.put('/api/employee-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approverName, approvalNotes, completionDate } = req.body;
    
    const query = `
      UPDATE employee_requests 
      SET status = $1,
          approver_name = COALESCE($2, approver_name),
          approval_date = CASE WHEN $1 IN ('APPROVED', 'REJECTED') THEN CURRENT_TIMESTAMP ELSE approval_date END,
          approval_notes = COALESCE($3, approval_notes),
          completion_date = COALESCE($4, completion_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await db.query(query, [status, approverName, approvalNotes, completionDate, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    
    res.json({ success: true, request: result.rows[0] });
  } catch (error) {
    console.error('Error updating employee request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete employee request
app.delete('/api/employee-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM employee_requests WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }
    
    res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
  } catch (error) {
    console.error('Error deleting employee request:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// REQUEST TYPES APIs (إدارة أنواع الطلبات)
// ========================================

// Get all request types
app.get('/api/request-types', async (req, res) => {
  try {
    const { is_active, category } = req.query;
    let query = 'SELECT * FROM request_types WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    
    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }
    
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    query += ' ORDER BY display_order, type_name_ar';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching request types:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single request type
app.get('/api/request-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM request_types WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'نوع الطلب غير موجود' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching request type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new request type
app.post('/api/request-types', async (req, res) => {
  try {
    const {
      type_code,
      type_name_ar,
      type_name_en,
      description_ar,
      description_en,
      icon,
      color,
      category,
      is_active,
      requires_approval,
      requires_manager_approval,
      requires_hr_approval,
      approval_levels,
      form_fields,
      display_order,
      created_by
    } = req.body;

    // Validate required fields
    if (!type_code || !type_name_ar) {
      return res.status(400).json({ error: 'الرجاء تعبئة الحقول المطلوبة (الكود والاسم)' });
    }

    const query = `
      INSERT INTO request_types (
        type_code, type_name_ar, type_name_en, description_ar, description_en,
        icon, color, category, is_active, requires_approval,
        requires_manager_approval, requires_hr_approval, approval_levels,
        form_fields, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      type_code,
      type_name_ar,
      type_name_en || null,
      description_ar || null,
      description_en || null,
      icon || '📄',
      color || '#ffffff',
      category || 'general',
      is_active !== undefined ? is_active : true,
      requires_approval !== undefined ? requires_approval : true,
      requires_manager_approval || false,
      requires_hr_approval || false,
      approval_levels || 1,
      form_fields ? JSON.stringify(form_fields) : null,
      display_order || 0,
      created_by || null
    ];

    const result = await db.query(query, values);
    res.status(201).json({ success: true, requestType: result.rows[0] });
  } catch (error) {
    console.error('Error creating request type:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'كود نوع الطلب موجود مسبقاً' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update request type
app.put('/api/request-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type_code,
      type_name_ar,
      type_name_en,
      description_ar,
      description_en,
      icon,
      color,
      category,
      is_active,
      requires_approval,
      requires_manager_approval,
      requires_hr_approval,
      approval_levels,
      form_fields,
      display_order
    } = req.body;

    const query = `
      UPDATE request_types 
      SET type_code = COALESCE($1, type_code),
          type_name_ar = COALESCE($2, type_name_ar),
          type_name_en = COALESCE($3, type_name_en),
          description_ar = COALESCE($4, description_ar),
          description_en = COALESCE($5, description_en),
          icon = COALESCE($6, icon),
          color = COALESCE($7, color),
          category = COALESCE($8, category),
          is_active = COALESCE($9, is_active),
          requires_approval = COALESCE($10, requires_approval),
          requires_manager_approval = COALESCE($11, requires_manager_approval),
          requires_hr_approval = COALESCE($12, requires_hr_approval),
          approval_levels = COALESCE($13, approval_levels),
          form_fields = COALESCE($14, form_fields),
          display_order = COALESCE($15, display_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
    `;
    
    const result = await db.query(query, [
      type_code, type_name_ar, type_name_en, description_ar, description_en,
      icon, color, category, is_active, requires_approval,
      requires_manager_approval, requires_hr_approval, approval_levels,
      form_fields ? JSON.stringify(form_fields) : null,
      display_order, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'نوع الطلب غير موجود' });
    }
    
    res.json({ success: true, requestType: result.rows[0] });
  } catch (error) {
    console.error('Error updating request type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete request type
app.delete('/api/request-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM request_types WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'نوع الطلب غير موجود' });
    }
    
    res.json({ success: true, message: 'تم حذف نوع الطلب بنجاح' });
  } catch (error) {
    console.error('Error deleting request type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle request type active status
app.patch('/api/request-types/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE request_types SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'نوع الطلب غير موجود' });
    }
    
    res.json({ success: true, requestType: result.rows[0] });
  } catch (error) {
    console.error('Error toggling request type status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// PAYMENT METHODS APIs (إدارة طرق الدفع)
// ========================================

// Get all payment methods
app.get('/api/payment-methods', async (req, res) => {
  try {
    const { is_active } = req.query;
    let query = 'SELECT * FROM payment_methods WHERE 1=1';
    let params = [];
    
    if (is_active !== undefined) {
      query += ' AND is_active = $1';
      params.push(is_active === 'true');
    }
    
    query += ' ORDER BY display_order, method_name_ar';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single payment method
app.get('/api/payment-methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM payment_methods WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new payment method
app.post('/api/payment-methods', async (req, res) => {
  try {
    const {
      method_code,
      method_name_ar,
      method_name_en,
      description_ar,
      description_en,
      icon,
      color,
      is_active,
      requires_bank_details,
      requires_card_details,
      processing_fee_percentage,
      processing_fee_fixed,
      min_amount,
      max_amount,
      display_order,
      created_by
    } = req.body;

    // Validate required fields
    if (!method_code || !method_name_ar) {
      return res.status(400).json({ error: 'الرجاء تعبئة الحقول المطلوبة (الكود والاسم)' });
    }

    const query = `
      INSERT INTO payment_methods (
        method_code, method_name_ar, method_name_en, description_ar, description_en,
        icon, color, is_active, requires_bank_details, requires_card_details,
        processing_fee_percentage, processing_fee_fixed, min_amount, max_amount,
        display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      method_code,
      method_name_ar,
      method_name_en || null,
      description_ar || null,
      description_en || null,
      icon || '💳',
      color || '#3b82f6',
      is_active !== undefined ? is_active : true,
      requires_bank_details || false,
      requires_card_details || false,
      processing_fee_percentage || 0,
      processing_fee_fixed || 0,
      min_amount || null,
      max_amount || null,
      display_order || 0,
      created_by || null
    ];

    const result = await db.query(query, values);
    res.status(201).json({ success: true, paymentMethod: result.rows[0] });
  } catch (error) {
    console.error('Error creating payment method:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(409).json({ error: 'كود طريقة الدفع موجود مسبقاً' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update payment method
app.put('/api/payment-methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      method_code,
      method_name_ar,
      method_name_en,
      description_ar,
      description_en,
      icon,
      color,
      is_active,
      requires_bank_details,
      requires_card_details,
      processing_fee_percentage,
      processing_fee_fixed,
      min_amount,
      max_amount,
      display_order
    } = req.body;

    const query = `
      UPDATE payment_methods 
      SET method_code = COALESCE($1, method_code),
          method_name_ar = COALESCE($2, method_name_ar),
          method_name_en = COALESCE($3, method_name_en),
          description_ar = COALESCE($4, description_ar),
          description_en = COALESCE($5, description_en),
          icon = COALESCE($6, icon),
          color = COALESCE($7, color),
          is_active = COALESCE($8, is_active),
          requires_bank_details = COALESCE($9, requires_bank_details),
          requires_card_details = COALESCE($10, requires_card_details),
          processing_fee_percentage = COALESCE($11, processing_fee_percentage),
          processing_fee_fixed = COALESCE($12, processing_fee_fixed),
          min_amount = COALESCE($13, min_amount),
          max_amount = COALESCE($14, max_amount),
          display_order = COALESCE($15, display_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
    `;
    
    const result = await db.query(query, [
      method_code, method_name_ar, method_name_en, description_ar, description_en,
      icon, color, is_active, requires_bank_details, requires_card_details,
      processing_fee_percentage, processing_fee_fixed, min_amount, max_amount,
      display_order, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });
    }
    
    res.json({ success: true, paymentMethod: result.rows[0] });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete payment method
app.delete('/api/payment-methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM payment_methods WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });
    }
    
    res.json({ success: true, message: 'تم حذف طريقة الدفع بنجاح' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle payment method active status
app.patch('/api/payment-methods/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE payment_methods SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });
    }
    
    res.json({ success: true, paymentMethod: result.rows[0] });
  } catch (error) {
    console.error('Error toggling payment method status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// INSTALLMENT PLAN TYPES APIs
// ========================================

// Get all installment plan types
app.get('/api/installment-plan-types', async (req, res) => {
  try {
    const { is_active } = req.query;
    let query = 'SELECT * FROM installment_plan_types WHERE 1=1';
    let params = [];
    
    if (is_active !== undefined) {
      query += ' AND is_active = $1';
      params.push(is_active === 'true');
    }
    
    query += ' ORDER BY display_order, duration_months';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching installment plan types:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single installment plan type
app.get('/api/installment-plan-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM installment_plan_types WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'خطة الأقساط غير موجودة' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching installment plan type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new installment plan type
app.post('/api/installment-plan-types', async (req, res) => {
  try {
    const {
      plan_code,
      plan_name_ar,
      plan_name_en,
      description_ar,
      description_en,
      duration_months,
      number_of_payments,
      payment_frequency,
      interest_rate,
      admin_fee,
      late_payment_fee,
      min_amount,
      max_amount,
      has_grace_period,
      grace_period_days,
      early_payment_discount,
      icon,
      color,
      badge_text,
      is_active,
      is_featured,
      display_order,
      created_by
    } = req.body;

    // Validate required fields
    if (!plan_code || !plan_name_ar || !duration_months || !number_of_payments) {
      return res.status(400).json({ error: 'الرجاء تعبئة الحقول المطلوبة (الكود، الاسم، المدة، عدد الدفعات)' });
    }

    const query = `
      INSERT INTO installment_plan_types (
        plan_code, plan_name_ar, plan_name_en, description_ar, description_en,
        duration_months, number_of_payments, payment_frequency,
        interest_rate, admin_fee, late_payment_fee,
        min_amount, max_amount,
        has_grace_period, grace_period_days, early_payment_discount,
        icon, color, badge_text,
        is_active, is_featured, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *
    `;
    
    const values = [
      plan_code,
      plan_name_ar,
      plan_name_en || null,
      description_ar || null,
      description_en || null,
      duration_months,
      number_of_payments,
      payment_frequency || 'MONTHLY',
      interest_rate || 0,
      admin_fee || 0,
      late_payment_fee || 0,
      min_amount || null,
      max_amount || null,
      has_grace_period || false,
      grace_period_days || 0,
      early_payment_discount || 0,
      icon || '📅',
      color || '#3b82f6',
      badge_text || null,
      is_active !== undefined ? is_active : true,
      is_featured || false,
      display_order || 0,
      created_by || null
    ];

    const result = await db.query(query, values);
    res.status(201).json({ success: true, planType: result.rows[0] });
  } catch (error) {
    console.error('Error creating installment plan type:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ error: 'كود خطة الأقساط موجود مسبقاً' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update installment plan type
app.put('/api/installment-plan-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plan_code,
      plan_name_ar,
      plan_name_en,
      description_ar,
      description_en,
      duration_months,
      number_of_payments,
      payment_frequency,
      interest_rate,
      admin_fee,
      late_payment_fee,
      min_amount,
      max_amount,
      has_grace_period,
      grace_period_days,
      early_payment_discount,
      icon,
      color,
      badge_text,
      is_active,
      is_featured,
      display_order
    } = req.body;

    const query = `
      UPDATE installment_plan_types 
      SET plan_code = COALESCE($1, plan_code),
          plan_name_ar = COALESCE($2, plan_name_ar),
          plan_name_en = COALESCE($3, plan_name_en),
          description_ar = COALESCE($4, description_ar),
          description_en = COALESCE($5, description_en),
          duration_months = COALESCE($6, duration_months),
          number_of_payments = COALESCE($7, number_of_payments),
          payment_frequency = COALESCE($8, payment_frequency),
          interest_rate = COALESCE($9, interest_rate),
          admin_fee = COALESCE($10, admin_fee),
          late_payment_fee = COALESCE($11, late_payment_fee),
          min_amount = COALESCE($12, min_amount),
          max_amount = COALESCE($13, max_amount),
          has_grace_period = COALESCE($14, has_grace_period),
          grace_period_days = COALESCE($15, grace_period_days),
          early_payment_discount = COALESCE($16, early_payment_discount),
          icon = COALESCE($17, icon),
          color = COALESCE($18, color),
          badge_text = COALESCE($19, badge_text),
          is_active = COALESCE($20, is_active),
          is_featured = COALESCE($21, is_featured),
          display_order = COALESCE($22, display_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $23
      RETURNING *
    `;
    
    const result = await db.query(query, [
      plan_code, plan_name_ar, plan_name_en, description_ar, description_en,
      duration_months, number_of_payments, payment_frequency,
      interest_rate, admin_fee, late_payment_fee,
      min_amount, max_amount,
      has_grace_period, grace_period_days, early_payment_discount,
      icon, color, badge_text,
      is_active, is_featured, display_order,
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'خطة الأقساط غير موجودة' });
    }
    
    res.json({ success: true, planType: result.rows[0] });
  } catch (error) {
    console.error('Error updating installment plan type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete installment plan type
app.delete('/api/installment-plan-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM installment_plan_types WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'خطة الأقساط غير موجودة' });
    }
    
    res.json({ success: true, message: 'تم حذف خطة الأقساط بنجاح' });
  } catch (error) {
    console.error('Error deleting installment plan type:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle installment plan type active status
app.patch('/api/installment-plan-types/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE installment_plan_types SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'خطة الأقساط غير موجودة' });
    }
    
    res.json({ success: true, planType: result.rows[0] });
  } catch (error) {
    console.error('Error toggling installment plan type status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// TAX SETTINGS APIs
// ========================================

// Get all tax settings
app.get('/api/tax-settings', async (req, res) => {
  try {
    const { is_active, branch_id, tax_type } = req.query;
    let query = 'SELECT * FROM tax_settings WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    if (branch_id !== undefined) {
      query += ` AND (branch_id = $${paramIndex} OR branch_id IS NULL)`;
      params.push(branch_id);
      paramIndex++;
    }

    if (tax_type) {
      query += ` AND tax_type = $${paramIndex}`;
      params.push(tax_type);
      paramIndex++;
    }

    query += ' ORDER BY branch_id DESC NULLS FIRST, priority, tax_name_ar';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tax setting by ID
app.get('/api/tax-settings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM tax_settings WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'إعداد الضريبة غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching tax setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new tax setting
app.post('/api/tax-settings', async (req, res) => {
  try {
    const {
      tax_code,
      tax_name_ar,
      tax_name_en,
      description_ar,
      description_en,
      tax_type,
      default_rate,
      branch_id,
      branch_name_ar,
      branch_specific_rate,
      is_active,
      applicable_on,
      calculation_method,
      include_in_total,
      is_default,
      priority,
      min_amount,
      max_amount,
      created_by
    } = req.body;

    if (!tax_code || !tax_name_ar || default_rate === undefined) {
      return res.status(400).json({ error: 'البيانات المطلوبة: tax_code, tax_name_ar, default_rate' });
    }

    const result = await db.query(
      `INSERT INTO tax_settings (
        tax_code, tax_name_ar, tax_name_en, description_ar, description_en, tax_type,
        default_rate, branch_id, branch_name_ar, branch_specific_rate, is_active,
        applicable_on, calculation_method, include_in_total, is_default, priority,
        min_amount, max_amount, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        tax_code, tax_name_ar, tax_name_en, description_ar, description_en,
        tax_type || 'VAT', default_rate, branch_id || null, branch_name_ar || null,
        branch_specific_rate || null, is_active !== false, applicable_on || 'invoice',
        calculation_method || 'percentage', include_in_total !== false, is_default || false,
        priority || 0, min_amount || null, max_amount || null, created_by || 'system'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tax setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update tax setting
app.put('/api/tax-settings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tax_code,
      tax_name_ar,
      tax_name_en,
      description_ar,
      description_en,
      tax_type,
      default_rate,
      branch_id,
      branch_name_ar,
      branch_specific_rate,
      is_active,
      applicable_on,
      calculation_method,
      include_in_total,
      is_default,
      priority,
      min_amount,
      max_amount,
      updated_by
    } = req.body;

    const result = await db.query(
      `UPDATE tax_settings SET
        tax_code = COALESCE($1, tax_code),
        tax_name_ar = COALESCE($2, tax_name_ar),
        tax_name_en = COALESCE($3, tax_name_en),
        description_ar = COALESCE($4, description_ar),
        description_en = COALESCE($5, description_en),
        tax_type = COALESCE($6, tax_type),
        default_rate = COALESCE($7, default_rate),
        branch_id = COALESCE($8, branch_id),
        branch_name_ar = COALESCE($9, branch_name_ar),
        branch_specific_rate = COALESCE($10, branch_specific_rate),
        is_active = COALESCE($11, is_active),
        applicable_on = COALESCE($12, applicable_on),
        calculation_method = COALESCE($13, calculation_method),
        include_in_total = COALESCE($14, include_in_total),
        is_default = COALESCE($15, is_default),
        priority = COALESCE($16, priority),
        min_amount = COALESCE($17, min_amount),
        max_amount = COALESCE($18, max_amount),
        updated_by = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *`,
      [
        tax_code, tax_name_ar, tax_name_en, description_ar, description_en, tax_type,
        default_rate, branch_id, branch_name_ar, branch_specific_rate, is_active,
        applicable_on, calculation_method, include_in_total, is_default, priority,
        min_amount, max_amount, updated_by || 'system', id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'إعداد الضريبة غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating tax setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete tax setting
app.delete('/api/tax-settings/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM tax_settings WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'إعداد الضريبة غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف إعداد الضريبة بنجاح' });
  } catch (error) {
    console.error('Error deleting tax setting:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle tax setting active status
app.patch('/api/tax-settings/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'UPDATE tax_settings SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'إعداد الضريبة غير موجود' });
    }

    res.json({ success: true, taxSetting: result.rows[0] });
  } catch (error) {
    console.error('Error toggling tax setting status:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// BRANCH RELATIONSHIPS APIs
// ========================================

// Get incubators for a specific branch
app.get('/api/branches/:branchId/incubators', async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const query = `
      SELECT 
        i.*,
        b.name as branch_name,
        b.code as branch_code
      FROM incubators i
      LEFT JOIN branches b ON i.branch_id = b.id
      WHERE i.branch_id = $1 AND i.is_active = true
      ORDER BY i.name
    `;
    
    const result = await db.query(query, [branchId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching branch incubators:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get platforms for a specific branch
app.get('/api/branches/:branchId/platforms', async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const query = `
      SELECT 
        p.*
      FROM platforms p
      JOIN incubators i ON p.incubator_id = i.id
      WHERE i.branch_id = $1 AND p.is_active = true
      ORDER BY p.name
    `;
    
    const result = await db.query(query, [branchId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching branch platforms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all branches with their relationship counts
app.get('/api/branches/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id,
        b.name,
        b.type,
        b.status,
        b.location,
        COUNT(DISTINCT bi.incubator_id) as incubator_count,
        COUNT(DISTINCT bp.platform_id) as platform_count
      FROM entities b
      LEFT JOIN branch_incubators bi ON b.id = bi.branch_id
      LEFT JOIN branch_platforms bp ON b.id = bp.branch_id
      WHERE b.type = 'BRANCH'
      GROUP BY b.id, b.name, b.type, b.status, b.location
      ORDER BY b.name
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching branch stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get merge statistics summary
app.get('/api/merge-stats', async (req, res) => {
  try {
    const branchesCount = await db.query(`SELECT COUNT(*) as count FROM entities WHERE type = 'BRANCH'`);
    const incubatorsCount = await db.query(`SELECT COUNT(*) as count FROM entities WHERE type = 'INCUBATOR'`);
    const platformsCount = await db.query(`SELECT COUNT(*) as count FROM entities WHERE type = 'PLATFORM'`);
    const branchIncubatorsCount = await db.query(`SELECT COUNT(*) as count FROM branch_incubators`);
    const branchPlatformsCount = await db.query(`SELECT COUNT(*) as count FROM branch_platforms`);
    
    res.json({
      entities: {
        branches: parseInt(branchesCount.rows[0].count),
        incubators: parseInt(incubatorsCount.rows[0].count),
        platforms: parseInt(platformsCount.rows[0].count)
      },
      merges: {
        branchIncubators: parseInt(branchIncubatorsCount.rows[0].count),
        branchPlatforms: parseInt(branchPlatformsCount.rows[0].count),
        total: parseInt(branchIncubatorsCount.rows[0].count) + parseInt(branchPlatformsCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching merge stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { entity_id } = req.query;
    let query = 'SELECT * FROM transactions WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    
    // Apply user's entity filter
    if (req.userEntity.type === 'HQ') {
      // HQ sees all transactions
    } else if (req.userEntity.type === 'BRANCH') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'INCUBATOR') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'PLATFORM') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'OFFICE') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    }
    
    // Additional entity_id filter if provided
    if (entity_id) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entity_id);
      paramIndex++;
    }
    
    query += ' ORDER BY transaction_date DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ledger entries with data isolation
app.get('/api/ledger', async (req, res) => {
  try {
    const { entity_id } = req.query;
    let query = 'SELECT * FROM ledger WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    
    // Apply user's entity filter
    if (req.userEntity.type === 'HQ') {
      // HQ sees all ledger entries
    } else if (req.userEntity.type === 'BRANCH') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'INCUBATOR') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'PLATFORM') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    } else if (req.userEntity.type === 'OFFICE') {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    }
    
    // Additional entity_id filter if provided
    if (entity_id) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entity_id);
      paramIndex++;
    }
    
    query += ' ORDER BY transaction_date DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all ads with data isolation
app.get('/api/ads', async (req, res) => {
  try {
    const { entity_id, status, level } = req.query;
    let query = 'SELECT * FROM ads WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    
    // Apply user's entity filter - use entity_id column for data isolation
    if (req.userEntity.type === 'HQ') {
      // HQ sees all ads
    } else {
      // Other entities see their own ads via entity_id
      query += ` AND entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    }
    
    // Additional filters
    if (entity_id) {
      query += ` AND entity_id = $${paramIndex}`;
      params.push(entity_id);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (level) {
      query += ` AND level = $${paramIndex}`;
      params.push(level);
      paramIndex++;
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new ad
app.post('/api/ads', async (req, res) => {
  try {
    const {
      title, content, level, scope, status, source_entity_id,
      source_type, target_ids, cost, budget, start_date, end_date
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO ads 
       (title, content, level, scope, status, source_entity_id, source_type, 
        target_ids, cost, budget, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [title, content, level, scope, status || 'PENDING', source_entity_id,
       source_type, target_ids || [], cost || 0, budget || 0, start_date, end_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ad
app.put('/api/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];
    
    const result = await db.query(
      `UPDATE ads SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const { entity_id } = req.query;
    
    const stats = {};
    
    // Total entities
    const entitiesCount = await db.query('SELECT COUNT(*) FROM entities');
    stats.totalEntities = parseInt(entitiesCount.rows[0].count);
    
    // Total users
    const usersCount = await db.query(
      entity_id 
        ? 'SELECT COUNT(*) FROM users WHERE entity_id = $1'
        : 'SELECT COUNT(*) FROM users',
      entity_id ? [entity_id] : []
    );
    stats.totalUsers = parseInt(usersCount.rows[0].count);
    
    // Total revenue
    const revenue = await db.query(
      entity_id
        ? 'SELECT SUM(paid_amount) as total FROM invoices WHERE entity_id = $1'
        : 'SELECT SUM(paid_amount) as total FROM invoices',
      entity_id ? [entity_id] : []
    );
    stats.totalRevenue = parseFloat(revenue.rows[0].total || 0);
    
    // Active ads
    const adsCount = await db.query(
      entity_id
        ? 'SELECT COUNT(*) FROM ads WHERE source_entity_id = $1 AND status = \'ACTIVE\''
        : 'SELECT COUNT(*) FROM ads WHERE status = \'ACTIVE\'',
      entity_id ? [entity_id] : []
    );
    stats.activeAds = parseInt(adsCount.rows[0].count);
    
    // Outstanding invoices
    const outstanding = await db.query(
      entity_id
        ? 'SELECT SUM(amount - paid_amount) as total FROM invoices WHERE entity_id = $1 AND status != \'PAID\''
        : 'SELECT SUM(amount - paid_amount) as total FROM invoices WHERE status != \'PAID\'',
      entity_id ? [entity_id] : []
    );
    stats.outstandingAmount = parseFloat(outstanding.rows[0].total || 0);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// APPROVAL WORKFLOWS ENDPOINTS
// ========================================

// Get all approval workflows
app.get('/api/approvals', async (req, res) => {
  try {
    const { entity_id, status, approver_id } = req.query;
    let query = `
      SELECT w.*, 
        (SELECT json_agg(s ORDER BY s.step_level) 
         FROM approval_steps s 
         WHERE s.workflow_id = w.id) as steps
      FROM approval_workflows w
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    // Apply user's entity filter
    if (req.userEntity.type !== 'HQ') {
      query += ` AND w.entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    }
    
    if (entity_id) {
      query += ` AND w.entity_id = $${paramIndex}`;
      params.push(entity_id);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND w.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (approver_id) {
      query += ` AND w.id IN (
        SELECT workflow_id FROM approval_steps 
        WHERE approver_id = $${paramIndex} AND status = 'PENDING'
      )`;
      params.push(approver_id);
    }
    
    query += ' ORDER BY w.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single approval workflow
app.get('/api/approvals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const workflow = await db.query(
      'SELECT * FROM approval_workflows WHERE id = $1',
      [id]
    );
    
    if (workflow.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    const steps = await db.query(
      'SELECT * FROM approval_steps WHERE workflow_id = $1 ORDER BY step_level',
      [id]
    );
    
    res.json({
      ...workflow.rows[0],
      steps: steps.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new approval workflow
app.post('/api/approvals', async (req, res) => {
  try {
    const {
      entity_id, item_type, item_id, item_title, amount,
      created_by, created_by_name, approval_levels
    } = req.body;
    
    // Create workflow
    const workflowResult = await db.query(
      `INSERT INTO approval_workflows 
       (entity_id, item_type, item_id, item_title, amount, created_by, created_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [entity_id, item_type, item_id, item_title, amount, created_by, created_by_name]
    );
    
    const workflowId = workflowResult.rows[0].id;
    
    // Create approval steps
    if (approval_levels && approval_levels.length > 0) {
      for (let i = 0; i < approval_levels.length; i++) {
        const level = approval_levels[i];
        await db.query(
          `INSERT INTO approval_steps 
           (workflow_id, step_level, approver_role, approver_id, approver_name)
           VALUES ($1, $2, $3, $4, $5)`,
          [workflowId, i + 1, level.role, level.approver_id, level.approver_name]
        );
        
        // Create notification for first approver
        if (i === 0) {
          await db.query(
            `INSERT INTO notifications 
             (user_id, entity_id, type, title, message, link_type, link_id, priority)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              level.approver_id,
              entity_id,
              'APPROVAL_REQUEST',
              'طلب موافقة جديد',
              `يرجى مراجعة واعتماد ${item_title} بقيمة ${amount} ريال`,
              'WORKFLOW',
              workflowId.toString(),
              'HIGH'
            ]
          );
        }
      }
    }
    
    res.status(201).json(workflowResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject a step
app.post('/api/approvals/:id/decide', async (req, res) => {
  try {
    const { id } = req.params;
    const { step_id, decision, comments, rejection_reason, approver_id } = req.body;
    
    // Update step
    await db.query(
      `UPDATE approval_steps 
       SET status = $1, decision_date = NOW(), comments = $2, rejection_reason = $3
       WHERE id = $4`,
      [decision, comments, rejection_reason, step_id]
    );
    
    // Get workflow and current step info
    const workflow = await db.query(
      'SELECT * FROM approval_workflows WHERE id = $1',
      [id]
    );
    
    const currentStep = await db.query(
      'SELECT * FROM approval_steps WHERE id = $1',
      [step_id]
    );
    
    if (decision === 'REJECTED') {
      // Reject entire workflow
      await db.query(
        'UPDATE approval_workflows SET status = $1, updated_at = NOW() WHERE id = $2',
        ['REJECTED', id]
      );
      
      // Notify creator
      await db.query(
        `INSERT INTO notifications 
         (user_id, entity_id, type, title, message, link_type, link_id, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          workflow.rows[0].created_by,
          workflow.rows[0].entity_id,
          'APPROVAL_REJECTED',
          'تم رفض طلب الموافقة',
          `تم رفض ${workflow.rows[0].item_title}. السبب: ${rejection_reason || 'غير محدد'}`,
          'WORKFLOW',
          id,
          'HIGH'
        ]
      );
    } else if (decision === 'APPROVED') {
      // Check if there are more steps
      const nextStep = await db.query(
        `SELECT * FROM approval_steps 
         WHERE workflow_id = $1 AND step_level > $2 AND status = 'PENDING'
         ORDER BY step_level LIMIT 1`,
        [id, currentStep.rows[0].step_level]
      );
      
      if (nextStep.rows.length > 0) {
        // Move to next step
        await db.query(
          'UPDATE approval_workflows SET current_level = $1, status = $2, updated_at = NOW() WHERE id = $3',
          [nextStep.rows[0].step_level, 'IN_REVIEW', id]
        );
        
        // Notify next approver
        await db.query(
          `INSERT INTO notifications 
           (user_id, entity_id, type, title, message, link_type, link_id, priority)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            nextStep.rows[0].approver_id,
            workflow.rows[0].entity_id,
            'APPROVAL_REQUEST',
            'طلب موافقة - المستوى التالي',
            `يرجى مراجعة واعتماد ${workflow.rows[0].item_title} بقيمة ${workflow.rows[0].amount} ريال`,
            'WORKFLOW',
            id,
            'HIGH'
          ]
        );
      } else {
        // All steps approved - complete workflow
        await db.query(
          'UPDATE approval_workflows SET status = $1, updated_at = NOW() WHERE id = $2',
          ['APPROVED', id]
        );
        
        // Notify creator
        await db.query(
          `INSERT INTO notifications 
           (user_id, entity_id, type, title, message, link_type, link_id, priority)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            workflow.rows[0].created_by,
            workflow.rows[0].entity_id,
            'APPROVAL_APPROVED',
            'تمت الموافقة على طلبك',
            `تمت الموافقة النهائية على ${workflow.rows[0].item_title}`,
            'WORKFLOW',
            id,
            'NORMAL'
          ]
        );
      }
    }
    
    res.json({ success: true, message: 'تم تحديث حالة الموافقة' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update approval workflow
app.put('/api/approvals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_title, amount, updated_by } = req.body;
    
    // Check if workflow exists
    const workflow = await db.query(
      'SELECT * FROM approval_workflows WHERE id = $1',
      [id]
    );
    
    if (workflow.rows.length === 0) {
      return res.status(404).json({ error: 'الموافقة غير موجودة' });
    }
    
    // Update workflow
    await db.query(
      `UPDATE approval_workflows 
       SET item_title = $1, amount = $2, updated_at = NOW()
       WHERE id = $3`,
      [item_title, amount, id]
    );
    
    // Create audit log
    await db.query(
      `INSERT INTO audit_log 
       (user_id, entity_id, action, entity_type, entity_name, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        updated_by,
        workflow.rows[0].entity_id,
        'UPDATE',
        'APPROVAL_WORKFLOW',
        item_title,
        `تم تعديل الموافقة: العنوان من "${workflow.rows[0].item_title}" إلى "${item_title}"، المبلغ من ${workflow.rows[0].amount} إلى ${amount}`
      ]
    );
    
    res.json({ success: true, message: 'تم تعديل الموافقة بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// NOTIFICATIONS ENDPOINTS
// ========================================

// Get notifications for a user
app.get('/api/notifications', async (req, res) => {
  try {
    const { user_id, is_read } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    
    if (user_id) {
      params.push(user_id);
      query += ` AND user_id = $${params.length}`;
    }
    
    if (is_read !== undefined) {
      params.push(is_read === 'true');
      query += ` AND is_read = $${params.length}`;
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1',
      [id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read for a user
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [user_id]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
app.get('/api/notifications/unread-count', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    const result = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [user_id]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- HeadQuarters APIs (المقرات الرئيسية) ----

// Get all headquarters
app.get('/api/headquarters', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM headquarters ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get headquarters by ID
app.get('/api/headquarters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM headquarters WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المقر الرئيسي غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new headquarters
app.post('/api/headquarters', async (req, res) => {
  try {
    const { name, code, description, country, contact_email, contact_phone, logo_url, settings } = req.body;
    const result = await db.query(
      `INSERT INTO headquarters (name, code, description, country, contact_email, contact_phone, logo_url, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, code, description, country, contact_email, contact_phone, logo_url, settings || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update headquarters
app.put('/api/headquarters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, country, contact_email, contact_phone, logo_url, settings, is_active } = req.body;
    const result = await db.query(
      `UPDATE headquarters 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           description = COALESCE($3, description),
           country = COALESCE($4, country),
           contact_email = COALESCE($5, contact_email),
           contact_phone = COALESCE($6, contact_phone),
           logo_url = COALESCE($7, logo_url),
           settings = COALESCE($8, settings),
           is_active = COALESCE($9, is_active)
       WHERE id = $10 RETURNING *`,
      [name, code, description, country, contact_email, contact_phone, logo_url, settings, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المقر الرئيسي غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete headquarters
app.delete('/api/headquarters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM headquarters WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المقر الرئيسي غير موجود' });
    }
    res.json({ message: 'تم حذف المقر الرئيسي بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Branches APIs (الفروع) ----

// Get all branches (with optional HQ filter)
app.get('/api/branches', async (req, res) => {
  try {
    const { hq_id } = req.query;
    let query = `
      SELECT b.*, hq.name as hq_name, hq.code as hq_code
      FROM branches b
      LEFT JOIN headquarters hq ON b.hq_id = hq.id
    `;
    const params = [];
    if (hq_id) {
      query += ' WHERE b.hq_id = $1';
      params.push(hq_id);
    }
    query += ' ORDER BY b.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get branch by ID
app.get('/api/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT b.*, hq.name as hq_name, hq.code as hq_code
      FROM branches b
      LEFT JOIN headquarters hq ON b.hq_id = hq.id
      WHERE b.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الفرع غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new branch
app.post('/api/branches', async (req, res) => {
  try {
    const { hq_id, name, code, description, country, city, address, contact_email, contact_phone, manager_name, settings } = req.body;
    const result = await db.query(
      `INSERT INTO branches (hq_id, name, code, description, country, city, address, contact_email, contact_phone, manager_name, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [hq_id, name, code, description, country, city, address, contact_email, contact_phone, manager_name, settings || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update branch
app.put('/api/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, country, city, address, contact_email, contact_phone, manager_name, settings, is_active } = req.body;
    const result = await db.query(
      `UPDATE branches 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           description = COALESCE($3, description),
           country = COALESCE($4, country),
           city = COALESCE($5, city),
           address = COALESCE($6, address),
           contact_email = COALESCE($7, contact_email),
           contact_phone = COALESCE($8, contact_phone),
           manager_name = COALESCE($9, manager_name),
           settings = COALESCE($10, settings),
           is_active = COALESCE($11, is_active)
       WHERE id = $12 RETURNING *`,
      [name, code, description, country, city, address, contact_email, contact_phone, manager_name, settings, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الفرع غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete branch
app.delete('/api/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM branches WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الفرع غير موجود' });
    }
    res.json({ message: 'تم حذف الفرع بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Incubators APIs (الحاضنات) ----

// Get all incubators (with optional branch filter using junction table)
app.get('/api/incubators', async (req, res) => {
  try {
    const { branch_id } = req.query;
    
    if (branch_id) {
      // Use branch_incubators junction table for merged relationships
      const query = `
        SELECT DISTINCT i.*, 
               bi.relationship_status,
               bi.assigned_date
        FROM entities i
        INNER JOIN branch_incubators bi ON i.id = bi.incubator_id
        WHERE bi.branch_id = $1 
          AND i.type = 'INCUBATOR'
          AND bi.relationship_status = 'ACTIVE'
        ORDER BY i.name
      `;
      const result = await db.query(query, [branch_id]);
      res.json(result.rows);
    } else {
      // Get all incubators
      const query = `SELECT * FROM entities WHERE type = 'INCUBATOR' ORDER BY created_at DESC`;
      const result = await db.query(query);
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching incubators:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get incubator by ID
app.get('/api/incubators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT i.*, 
             b.name as branch_name, b.code as branch_code,
             hq.name as hq_name, hq.code as hq_code
      FROM incubators i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN headquarters hq ON b.hq_id = hq.id
      WHERE i.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الحاضنة غير موجودة' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new incubator
app.post('/api/incubators', async (req, res) => {
  try {
    const { branch_id, name, code, description, program_type, capacity, contact_email, contact_phone, manager_name, start_date, end_date, settings } = req.body;
    const result = await db.query(
      `INSERT INTO incubators (branch_id, name, code, description, program_type, capacity, contact_email, contact_phone, manager_name, start_date, end_date, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [branch_id, name, code, description, program_type, capacity, contact_email, contact_phone, manager_name, start_date, end_date, settings || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update incubator
app.put('/api/incubators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, program_type, capacity, contact_email, contact_phone, manager_name, start_date, end_date, settings, is_active } = req.body;
    const result = await db.query(
      `UPDATE incubators 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           description = COALESCE($3, description),
           program_type = COALESCE($4, program_type),
           capacity = COALESCE($5, capacity),
           contact_email = COALESCE($6, contact_email),
           contact_phone = COALESCE($7, contact_phone),
           manager_name = COALESCE($8, manager_name),
           start_date = COALESCE($9, start_date),
           end_date = COALESCE($10, end_date),
           settings = COALESCE($11, settings),
           is_active = COALESCE($12, is_active)
       WHERE id = $13 RETURNING *`,
      [name, code, description, program_type, capacity, contact_email, contact_phone, manager_name, start_date, end_date, settings, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الحاضنة غير موجودة' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete incubator
app.delete('/api/incubators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM incubators WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الحاضنة غير موجودة' });
    }
    res.json({ message: 'تم حذف الحاضنة بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Platforms APIs (المنصات) ----

// Get all platforms (with optional incubator filter)
app.get('/api/platforms', async (req, res) => {
  try {
    const { incubator_id, branch_id } = req.query;
    
    if (branch_id) {
      // Use branch_platforms junction table for merged relationships
      const query = `
        SELECT DISTINCT p.*, 
               bp.relationship_status,
               bp.performance_score,
               bp.assigned_date
        FROM entities p
        INNER JOIN branch_platforms bp ON p.id = bp.platform_id
        WHERE bp.branch_id = $1 
          AND p.type = 'PLATFORM'
          AND bp.relationship_status = 'ACTIVE'
        ORDER BY p.name
      `;
      const result = await db.query(query, [branch_id]);
      res.json(result.rows);
    } else if (incubator_id) {
      // Filter by incubator (if needed for old system)
      const query = `SELECT * FROM entities WHERE incubator_id = $1 AND type = 'PLATFORM' ORDER BY created_at DESC`;
      const result = await db.query(query, [incubator_id]);
      res.json(result.rows);
    } else {
      // Get all platforms
      const query = `SELECT * FROM entities WHERE type = 'PLATFORM' ORDER BY created_at DESC`;
      const result = await db.query(query);
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get platform by ID
app.get('/api/platforms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT p.*, 
             i.name as incubator_name, i.code as incubator_code,
             b.name as branch_name,
             hq.name as hq_name
      FROM platforms p
      LEFT JOIN incubators i ON p.incubator_id = i.id
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN headquarters hq ON b.hq_id = hq.id
      WHERE p.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المنصة غير موجودة' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new platform
app.post('/api/platforms', async (req, res) => {
  try {
    const { incubator_id, name, code, description, platform_type, pricing_model, base_price, currency, features, settings } = req.body;
    const result = await db.query(
      `INSERT INTO platforms (incubator_id, name, code, description, platform_type, pricing_model, base_price, currency, features, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [incubator_id, name, code, description, platform_type, pricing_model, base_price || 0, currency || 'USD', features || [], settings || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update platform
app.put('/api/platforms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, platform_type, pricing_model, base_price, currency, features, settings, is_active } = req.body;
    const result = await db.query(
      `UPDATE platforms 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           description = COALESCE($3, description),
           platform_type = COALESCE($4, platform_type),
           pricing_model = COALESCE($5, pricing_model),
           base_price = COALESCE($6, base_price),
           currency = COALESCE($7, currency),
           features = COALESCE($8, features),
           settings = COALESCE($9, settings),
           is_active = COALESCE($10, is_active)
       WHERE id = $11 RETURNING *`,
      [name, code, description, platform_type, pricing_model, base_price, currency, features, settings, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المنصة غير موجودة' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete platform
app.delete('/api/platforms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM platforms WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المنصة غير موجودة' });
    }
    res.json({ message: 'تم حذف المنصة بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Offices APIs (المكاتب) ----

// Get all offices (with optional incubator filter)
app.get('/api/offices', async (req, res) => {
  try {
    const { incubator_id } = req.query;
    let query = `
      SELECT o.*, 
             i.name as incubator_name, i.code as incubator_code,
             b.name as branch_name,
             hq.name as hq_name
      FROM offices o
      LEFT JOIN incubators i ON o.incubator_id = i.id
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN headquarters hq ON b.hq_id = hq.id
    `;
    const params = [];
    if (incubator_id) {
      query += ' WHERE o.incubator_id = $1';
      params.push(incubator_id);
    }
    query += ' ORDER BY o.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get office by ID
app.get('/api/offices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT o.*, 
             i.name as incubator_name, i.code as incubator_code,
             b.name as branch_name,
             hq.name as hq_name
      FROM offices o
      LEFT JOIN incubators i ON o.incubator_id = i.id
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN headquarters hq ON b.hq_id = hq.id
      WHERE o.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المكتب غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new office
app.post('/api/offices', async (req, res) => {
  try {
    const { incubator_id, name, code, description, office_type, location, address, capacity, working_hours, contact_email, contact_phone, manager_name, settings } = req.body;
    const result = await db.query(
      `INSERT INTO offices (incubator_id, name, code, description, office_type, location, address, capacity, working_hours, contact_email, contact_phone, manager_name, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [incubator_id, name, code, description, office_type, location, address, capacity || 0, working_hours || {}, contact_email, contact_phone, manager_name, settings || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update office
app.put('/api/offices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, office_type, location, address, capacity, working_hours, contact_email, contact_phone, manager_name, settings, is_active } = req.body;
    const result = await db.query(
      `UPDATE offices 
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           description = COALESCE($3, description),
           office_type = COALESCE($4, office_type),
           location = COALESCE($5, location),
           address = COALESCE($6, address),
           capacity = COALESCE($7, capacity),
           working_hours = COALESCE($8, working_hours),
           contact_email = COALESCE($9, contact_email),
           contact_phone = COALESCE($10, contact_phone),
           manager_name = COALESCE($11, manager_name),
           settings = COALESCE($12, settings),
           is_active = COALESCE($13, is_active)
       WHERE id = $14 RETURNING *`,
      [name, code, description, office_type, location, address, capacity, working_hours, contact_email, contact_phone, manager_name, settings, is_active, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المكتب غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete office
app.delete('/api/offices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM offices WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المكتب غير موجود' });
    }
    res.json({ message: 'تم حذف المكتب بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get platforms for a specific office
app.get('/api/offices/:id/platforms', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT p.*, op.is_active as is_linked
      FROM office_platforms op
      JOIN platforms p ON op.platform_id = p.id
      WHERE op.office_id = $1 AND op.is_active = true
      ORDER BY p.name
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get platforms for a specific incubator or headquarters
app.get('/api/incubators/:id/platforms', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 Fetching platforms for:', id);
    
    let incubatorIds = [];
    const numericId = parseInt(id, 10);
    
    // Check if it's a headquarters entity_id (like 'HQ001')
    if (id.startsWith('HQ')) {
      console.log('→ Detected HQ entity_id, finding all incubators for HQ branches');
      
      // Get HQ ID
      const hqResult = await db.query(`
        SELECT id FROM headquarters WHERE entity_id = $1
      `, [id]);
      
      if (hqResult.rows.length === 0) {
        console.log('❌ HQ not found for entity_id:', id);
        return res.status(404).json({ error: 'Headquarters not found' });
      }
      
      const hqId = hqResult.rows[0].id;
      console.log('✅ Found HQ ID:', hqId);
      
      // Get all branches for this HQ
      const branchResult = await db.query(`
        SELECT id FROM branches WHERE hq_id = $1
      `, [hqId]);
      
      console.log('✅ Found branches:', branchResult.rows.length);
      
      if (branchResult.rows.length === 0) {
        console.log('⚠️  No branches found for HQ');
        return res.json([]);
      }
      
      const branchIds = branchResult.rows.map(b => b.id);
      
      // Get all incubators for these branches
      const incubatorResult = await db.query(`
        SELECT id FROM incubators WHERE branch_id = ANY($1)
      `, [branchIds]);
      
      console.log('✅ Found incubators:', incubatorResult.rows.length);
      
      if (incubatorResult.rows.length === 0) {
        console.log('⚠️  No incubators found for these branches');
        return res.json([]);
      }
      
      incubatorIds = incubatorResult.rows.map(i => i.id);
      
    } else if (isNaN(numericId) || id !== numericId.toString()) {
      // It's an incubator entity_id (like 'INC03')
      console.log('→ Looking up incubator entity_id:', id);
      const incubatorResult = await db.query(`
        SELECT id FROM incubators WHERE entity_id = $1
      `, [id]);
      
      if (incubatorResult.rows.length === 0) {
        console.log('❌ Incubator not found for entity_id:', id);
        return res.status(404).json({ error: 'Incubator not found' });
      }
      incubatorIds = [incubatorResult.rows[0].id];
      console.log('✅ Found incubator ID:', incubatorIds[0], 'for entity_id:', id);
    } else {
      // Numeric ID
      incubatorIds = [numericId];
      console.log('→ Using numeric ID:', numericId);
    }
    
    // Get platforms for all incubators
    const result = await db.query(`
      SELECT id, name, incubator_id, description, code
      FROM platforms
      WHERE incubator_id = ANY($1)
      ORDER BY name
    `, [incubatorIds]);
    
    console.log('✅ Found platforms:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching platforms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Link office to platform
app.post('/api/offices/:office_id/platforms/:platform_id', async (req, res) => {
  try {
    const { office_id, platform_id } = req.params;
    const result = await db.query(
      `INSERT INTO office_platforms (office_id, platform_id)
       VALUES ($1, $2)
       ON CONFLICT (office_id, platform_id) DO UPDATE SET is_active = true
       RETURNING *`,
      [office_id, platform_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlink office from platform
app.delete('/api/offices/:office_id/platforms/:platform_id', async (req, res) => {
  try {
    const { office_id, platform_id } = req.params;
    const result = await db.query(
      'DELETE FROM office_platforms WHERE office_id = $1 AND platform_id = $2 RETURNING *',
      [office_id, platform_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الربط غير موجود' });
    }
    res.json({ message: 'تم إلغاء ربط المكتب بالمنصة', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get full hierarchy view
app.get('/api/hierarchy', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM entity_hierarchy
      ORDER BY hq_id, branch_id, incubator_id, platform_id, office_id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hierarchy statistics
app.get('/api/hierarchy/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM headquarters WHERE is_active = true) as active_hqs,
        (SELECT COUNT(*) FROM branches WHERE is_active = true) as active_branches,
        (SELECT COUNT(*) FROM incubators WHERE is_active = true) as active_incubators,
        (SELECT COUNT(*) FROM platforms WHERE is_active = true) as active_platforms,
        (SELECT COUNT(*) FROM offices WHERE is_active = true) as active_offices,
        (SELECT COUNT(*) FROM office_platforms WHERE is_active = true) as active_links
    `);
    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// EMPLOYEES APIs
// ========================================

// Get all employees with data isolation
app.get('/api/employees', async (req, res) => {
  try {
    const { entity_type, entity_id, is_active } = req.query;
    
    // Build base query with data isolation
    let query = `
      SELECT 
        emp.id,
        emp.employee_number,
        emp.full_name,
        emp.email,
        emp.position,
        emp.department,
        emp.assigned_entity_type,
        COALESCE(hq.entity_id, b.entity_id, i.entity_id, p.entity_id, o.entity_id, 'HQ001') as entity_id,
        COALESCE(hq.name, b.name, i.name, p.name, o.name) as entity_name,
        COALESCE(b.code, i.code, p.code, o.code) as entity_code,
        emp.hire_date,
        emp.salary,
        emp.employment_type,
        emp.is_active
      FROM employees emp
      LEFT JOIN headquarters hq ON emp.hq_id = hq.id
      LEFT JOIN branches b ON emp.branch_id = b.id
      LEFT JOIN incubators i ON emp.incubator_id = i.id
      LEFT JOIN platforms p ON emp.platform_id = p.id
      LEFT JOIN offices o ON emp.office_id = o.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Apply user's entity filter by entity ID string
    if (req.userEntity.type !== 'HQ') {
      // Non-HQ entities see only their own employees
      // Use entity_id from the joined tables
      query += ` AND COALESCE(b.entity_id, i.entity_id, p.entity_id, o.entity_id) = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    }

    // Additional filters
    if (entity_type) {
      query += ` AND emp.assigned_entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (entity_id) {
      query += ` AND COALESCE(b.entity_id, i.entity_id, p.entity_id, o.entity_id) = $${paramIndex}`;
      params.push(entity_id);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND emp.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    query += ' ORDER BY emp.full_name';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee by ID
app.get('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM employees_with_entity WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الموظف غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create employee
app.post('/api/employees', async (req, res) => {
  try {
    const { 
      employee_number, full_name, email, phone, national_id, 
      position, department, assigned_entity_type,
      hq_id, branch_id, incubator_id, platform_id, office_id,
      hire_date, salary, employment_type, address, 
      emergency_contact, emergency_phone 
    } = req.body;

    console.log('Creating employee with data:', {
      employee_number, full_name, position, department, assigned_entity_type,
      hire_date, employment_type
    });

    const result = await db.query(
      `INSERT INTO employees (
        employee_number, full_name, email, phone, national_id,
        position, department, assigned_entity_type,
        hq_id, branch_id, incubator_id, platform_id, office_id,
        hire_date, salary, employment_type, address,
        emergency_contact, emergency_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) 
      RETURNING *`,
      [
        employee_number, full_name, email, phone, national_id,
        position, department, assigned_entity_type,
        hq_id, branch_id, incubator_id, platform_id, office_id,
        hire_date, salary, employment_type, address,
        emergency_contact, emergency_phone
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Employee creation error:', error.message, error.stack);
    res.status(500).json({ error: error.message, details: error.detail });
  }
});

// Update employee
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      full_name, email, phone, position, department,
      salary, employment_type, is_active, address,
      emergency_contact, emergency_phone
    } = req.body;

    const result = await db.query(
      `UPDATE employees SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        position = COALESCE($4, position),
        department = COALESCE($5, department),
        salary = COALESCE($6, salary),
        employment_type = COALESCE($7, employment_type),
        is_active = COALESCE($8, is_active),
        address = COALESCE($9, address),
        emergency_contact = COALESCE($10, emergency_contact),
        emergency_phone = COALESCE($11, emergency_phone),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 RETURNING *`,
      [full_name, email, phone, position, department, salary, employment_type, is_active, address, emergency_contact, emergency_phone, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الموظف غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الموظف غير موجود' });
    }
    res.json({ message: 'تم حذف الموظف بنجاح', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employees by entity
app.get('/api/entities/:entity_type/:entity_id/employees', async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const result = await db.query(
      'SELECT * FROM employees_with_entity WHERE assigned_entity_type = $1 AND CASE WHEN $1 = \'HQ\' THEN hq_id = $2 WHEN $1 = \'BRANCH\' THEN branch_id = $2 WHEN $1 = \'INCUBATOR\' THEN incubator_id = $2 WHEN $1 = \'PLATFORM\' THEN platform_id = $2 WHEN $1 = \'OFFICE\' THEN office_id = $2 END',
      [entity_type.toUpperCase(), entity_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ENHANCED USERS APIs (with entity relationships)
// ========================================

// Update user to link with new entities
app.put('/api/users/:id/link-entity', async (req, res) => {
  try {
    const { id } = req.params;
    const { entity_type, branch_id, incubator_id, platform_id, office_id } = req.body;

    const result = await db.query(
      `UPDATE users SET
        branch_id = $1,
        incubator_id = $2,
        platform_id = $3,
        office_id = $4,
        linked_entity_type = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 RETURNING *`,
      [branch_id, incubator_id, platform_id, office_id, entity_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users with full entity details
app.get('/api/users-with-entity', async (req, res) => {
  try {
    const { entity_type, is_active } = req.query;
    let query = 'SELECT * FROM users_with_entity WHERE 1=1';
    const params = [];

    if (entity_type) {
      query += ' AND (linked_entity_type = $1 OR tenant_type = $1)';
      params.push(entity_type);
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${params.length + 1}`;
      params.push(is_active === 'true');
    }

    query += ' ORDER BY name';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ENHANCED INVOICES APIs (with entity relationships)
// ========================================

// Get invoices with full details
app.get('/api/invoices-with-details', async (req, res) => {
  try {
    const { entity_type, status, user_id } = req.query;
    let query = 'SELECT * FROM invoices_with_details WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (entity_type) {
      query += ` AND issuer_entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (user_id) {
      query += ` AND user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    query += ' ORDER BY issue_date DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link invoice to user and entity
app.put('/api/invoices/:id/link', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, branch_id, office_id, incubator_id, issuer_entity_type } = req.body;

    const result = await db.query(
      `UPDATE invoices SET
        user_id = $1,
        branch_id = $2,
        office_id = $3,
        incubator_id = $4,
        issuer_entity_type = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 RETURNING *`,
      [user_id, branch_id, office_id, incubator_id, issuer_entity_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ENHANCED ADS APIs (with entity relationships)
// ========================================

// Get ads with source entity details
app.get('/api/ads-with-source', async (req, res) => {
  try {
    const { entity_type, status } = req.query;
    let query = 'SELECT * FROM ads_with_source WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (entity_type) {
      query += ` AND ad_source_entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Link ad to new hierarchy entity
app.put('/api/ads/:id/link-source', async (req, res) => {
  try {
    const { id } = req.params;
    const { entity_type, hq_id, branch_id, incubator_id, platform_id, office_id } = req.body;

    const result = await db.query(
      `UPDATE ads SET
        hq_id = $1,
        new_branch_id = $2,
        new_incubator_id = $3,
        new_platform_id = $4,
        new_office_id = $5,
        ad_source_entity_type = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 RETURNING *`,
      [hq_id, branch_id, incubator_id, platform_id, office_id, entity_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// DASHBOARD ENDPOINTS
// ========================================

// Incubator Dashboard - Customer Journey & Programs
app.get('/api/dashboard/incubator', async (req, res) => {
  try {
    const { entity_id } = req.query;
    const entityFilter = entity_id || req.userEntity.id;
    
    // Get beneficiaries (customers) with their journey status
    const beneficiariesResult = await db.query(`
      SELECT 
        b.*,
        b.full_name as name,
        COUNT(DISTINCT e.id) as enrollment_count,
        COUNT(DISTINCT ts.id) as sessions_attended,
        COALESCE(AVG(e.attendance_percentage), 0) as avg_completion
      FROM beneficiaries b
      LEFT JOIN enrollments e ON e.beneficiary_id = b.id
      LEFT JOIN training_sessions ts ON ts.id = e.session_id
      WHERE b.entity_id = $1
      GROUP BY b.id, b.full_name
      ORDER BY b.created_at DESC
    `, [entityFilter]);
    
    // Get training programs
    const programsResult = await db.query(`
      SELECT 
        tp.*,
        COUNT(DISTINCT ts.id) as total_sessions,
        COUNT(DISTINCT e.beneficiary_id) as total_beneficiaries,
        COALESCE(AVG(e.attendance_percentage), 0) as avg_completion_rate
      FROM training_programs tp
      LEFT JOIN training_sessions ts ON ts.program_id = tp.id
      LEFT JOIN enrollments e ON e.session_id = ts.id
      WHERE tp.entity_id = $1
      GROUP BY tp.id
      ORDER BY tp.created_at DESC
    `, [entityFilter]);
    
    // Get recent sessions
    const sessionsResult = await db.query(`
      SELECT 
        ts.*,
        tp.name as program_name,
        COUNT(DISTINCT e.beneficiary_id) as attendees_count
      FROM training_sessions ts
      JOIN training_programs tp ON tp.id = ts.program_id
      LEFT JOIN enrollments e ON e.session_id = ts.id
      WHERE ts.entity_id = $1
      GROUP BY ts.id, tp.name
      ORDER BY ts.start_date DESC
      LIMIT 10
    `, [entityFilter]);
    
    // Get statistics
    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM beneficiaries WHERE entity_id = $1) as total_beneficiaries,
        (SELECT COUNT(*) FROM training_programs WHERE entity_id = $1) as total_programs,
        (SELECT COUNT(*) FROM training_sessions WHERE entity_id = $1) as total_sessions,
        (SELECT COUNT(*) FROM enrollments e JOIN training_sessions ts ON ts.id = e.session_id WHERE ts.entity_id = $1) as total_enrollments,
        COALESCE((SELECT AVG(attendance_percentage) FROM enrollments e JOIN training_sessions ts ON ts.id = e.session_id WHERE ts.entity_id = $1), 0) as overall_completion_rate
    `, [entityFilter]);
    
    res.json({
      beneficiaries: beneficiariesResult.rows,
      programs: programsResult.rows,
      recent_sessions: sessionsResult.rows,
      statistics: statsResult.rows[0] || {}
    });
  } catch (error) {
    console.error('Incubator dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Platform Dashboard - Services/Content/Subscriptions
app.get('/api/dashboard/platform', async (req, res) => {
  try {
    const { entity_id } = req.query;
    const entityFilter = entity_id || req.userEntity.id;
    
    // Get services/products
    const servicesResult = await db.query(`
      SELECT 
        *
      FROM ads
      WHERE entity_id = $1 AND level = 'Platform'
      ORDER BY created_at DESC
    `, [entityFilter]);
    
    // Get subscriptions (from enrollments - treating them as subscriptions)
    const subscriptionsResult = await db.query(`
      SELECT 
        e.*,
        b.full_name as customer_name,
        b.email as customer_email,
        tp.name as service_name,
        tp.price
      FROM enrollments e
      JOIN beneficiaries b ON b.id = e.beneficiary_id
      JOIN training_sessions ts ON ts.id = e.session_id
      JOIN training_programs tp ON tp.id = ts.program_id
      WHERE ts.entity_id = $1
      ORDER BY e.created_at DESC
    `, [entityFilter]);
    
    // Get content/ads statistics
    const contentResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week
      FROM ads
      WHERE entity_id = $1
      GROUP BY status
    `, [entityFilter]);
    
    // Get revenue statistics (from transactions)
    const revenueResult = await db.query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE transaction_date >= NOW() - INTERVAL '30 days'), 0) as monthly_revenue,
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE transaction_date >= NOW() - INTERVAL '30 days') as monthly_transactions
      FROM transactions
      WHERE entity_id = $1 AND type = 'income'
    `, [entityFilter]);
    
    // Get statistics
    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM ads WHERE entity_id = $1 AND level = 'Platform') as total_services,
        (SELECT COUNT(*) FROM enrollments e JOIN training_sessions ts ON ts.id = e.session_id WHERE ts.entity_id = $1) as active_subscriptions,
        (SELECT COUNT(*) FROM beneficiaries WHERE entity_id = $1) as total_customers,
        COALESCE((SELECT SUM(amount) FROM transactions WHERE entity_id = $1 AND type = 'income'), 0) as total_revenue
    `, [entityFilter]);
    
    res.json({
      services: servicesResult.rows,
      subscriptions: subscriptionsResult.rows,
      content_stats: contentResult.rows,
      revenue: revenueResult.rows[0] || {},
      statistics: statsResult.rows[0] || {}
    });
  } catch (error) {
    console.error('Platform dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Office Dashboard - Service Execution & Customer Appointments
app.get('/api/dashboard/office', async (req, res) => {
  try {
    const { entity_id } = req.query;
    const entityFilter = entity_id || req.userEntity.id;
    
    // Get upcoming appointments (training sessions as appointments)
    const appointmentsResult = await db.query(`
      SELECT 
        ts.*,
        tp.name as service_name,
        tp.description,
        ts.current_participants as booked_slots,
        ts.max_participants as total_slots
      FROM training_sessions ts
      JOIN training_programs tp ON tp.id = ts.program_id
      WHERE ts.entity_id = $1
      ORDER BY ts.start_date ASC
    `, [entityFilter]);
    
    // Get customers with their appointments
    const customersResult = await db.query(`
      SELECT 
        b.*,
        b.full_name as name,
        COUNT(DISTINCT e.id) as total_bookings,
        COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as active_bookings,
        MAX(ts.start_date) as last_visit
      FROM beneficiaries b
      LEFT JOIN enrollments e ON e.beneficiary_id = b.id
      LEFT JOIN training_sessions ts ON ts.id = e.session_id
      WHERE b.entity_id = $1
      GROUP BY b.id, b.full_name
      ORDER BY last_visit DESC NULLS LAST
    `, [entityFilter]);
    
    // Get service execution status
    const executionResult = await db.query(`
      SELECT 
        ts.status,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE ts.start_date >= NOW()) as upcoming,
        COUNT(*) FILTER (WHERE ts.end_date < NOW()) as completed
      FROM training_sessions ts
      WHERE ts.entity_id = $1
      GROUP BY ts.status
    `, [entityFilter]);
    
    // Get daily schedule (today's appointments)
    const todayScheduleResult = await db.query(`
      SELECT 
        ts.*,
        tp.name as service_name,
        tp.duration_hours as duration,
        ts.current_participants as attendees
      FROM training_sessions ts
      JOIN training_programs tp ON tp.id = ts.program_id
      WHERE ts.entity_id = $1 
        AND DATE(ts.start_date) = CURRENT_DATE
      ORDER BY ts.start_date ASC
    `, [entityFilter]);
    
    // Get statistics
    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM training_sessions WHERE entity_id = $1) as total_appointments,
        (SELECT COUNT(*) FROM training_sessions WHERE entity_id = $1 AND start_date >= NOW()) as upcoming_appointments,
        (SELECT COUNT(*) FROM training_sessions WHERE entity_id = $1 AND DATE(start_date) = CURRENT_DATE) as today_appointments,
        (SELECT COUNT(*) FROM beneficiaries WHERE entity_id = $1) as total_customers,
        (SELECT COUNT(*) FROM enrollments e JOIN training_sessions ts ON ts.id = e.session_id WHERE ts.entity_id = $1 AND e.status = 'active') as active_services
    `, [entityFilter]);
    
    res.json({
      appointments: appointmentsResult.rows,
      customers: customersResult.rows,
      execution_status: executionResult.rows,
      today_schedule: todayScheduleResult.rows,
      statistics: statsResult.rows[0] || {}
    });
  } catch (error) {
    console.error('Office dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard type based on entity
app.get('/api/dashboard/type', async (req, res) => {
  try {
    const { entity_id } = req.query;
    const entityFilter = entity_id || req.userEntity.id;
    
    // Get entity information to determine dashboard type
    const entityResult = await db.query(`
      SELECT type, name FROM entities WHERE id = $1
    `, [entityFilter]);
    
    if (entityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    const entity = entityResult.rows[0];
    let dashboardType = 'general';
    
    // Determine dashboard type based on entity type
    if (entity.type === 'INCUBATOR') {
      dashboardType = 'incubator';
    } else if (entity.type === 'PLATFORM') {
      dashboardType = 'platform';
    } else if (entity.type === 'OFFICE') {
      dashboardType = 'office';
    }
    
    res.json({
      entity_id: entityFilter,
      entity_type: entity.type,
      entity_name: entity.name,
      dashboard_type: dashboardType
    });
  } catch (error) {
    console.error('Dashboard type error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// INCUBATOR SYSTEM ENDPOINTS
// ========================================

// Get incubator stats
app.get('/api/incubator/stats', async (req, res) => {
  try {
    const entityId = req.query.entity_id;
    
    if (!entityId) {
      return res.status(400).json({ error: 'entity_id is required' });
    }
    
    const filter = getEntityFilter(req.userEntity);
    
    // Get counts from database
    const programsResult = await db.query(
      `SELECT COUNT(*) as count FROM training_programs WHERE ${filter} AND is_active = true`
    );
    
    const beneficiariesResult = await db.query(
      `SELECT COUNT(*) as count FROM beneficiaries WHERE ${filter} AND status = 'ACTIVE'`
    );
    
    const sessionsResult = await db.query(
      `SELECT COUNT(*) as count FROM training_sessions WHERE ${filter} AND status = 'IN_PROGRESS'`
    );
    
    const certificatesResult = await db.query(
      `SELECT COUNT(*) as count FROM certificates WHERE ${filter} AND status = 'VALID'`
    );
    
    res.json({
      total_programs: parseInt(programsResult.rows[0]?.count || 0),
      total_beneficiaries: parseInt(beneficiariesResult.rows[0]?.count || 0),
      active_sessions: parseInt(sessionsResult.rows[0]?.count || 0),
      active_certificates: parseInt(certificatesResult.rows[0]?.count || 0),
      expired_certificates: 0
    });
  } catch (error) {
    console.error('Error fetching incubator stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Training Programs
app.get('/api/training-programs', async (req, res) => {
  try {
    const filter = getEntityFilter(req.userEntity);
    const result = await db.query(
      `SELECT * FROM training_programs WHERE ${filter} ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/training-programs', async (req, res) => {
  try {
    const { entity_id, name, code, description, duration_hours, max_participants, price, passing_score, certificate_validity_months, is_active } = req.body;
    
    const result = await db.query(
      `INSERT INTO training_programs (
        entity_id, name, code, description, duration_hours, max_participants, 
        price, passing_score, certificate_validity_months, is_active,
        incubator_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [entity_id, name, code, description, duration_hours, max_participants, price, passing_score, certificate_validity_months, is_active || true, entity_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating training program:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update training program
app.put('/api/training-programs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, duration_hours, max_participants, price, passing_score, certificate_validity_months, is_active } = req.body;
    
    console.log('📝 Updating training program:', id, req.body);
    
    const result = await db.query(
      `UPDATE training_programs 
       SET name = $1, code = $2, description = $3, duration_hours = $4, max_participants = $5,
           price = $6, passing_score = $7, certificate_validity_months = $8, is_active = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, code, description, duration_hours, max_participants, price, passing_score, certificate_validity_months, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training program not found' });
    }
    
    console.log('✅ Training program updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating training program:', error);
    res.status(500).json({ error: error.message });
  }
});

// Beneficiaries
app.get('/api/beneficiaries', async (req, res) => {
  try {
    const filter = getEntityFilter(req.userEntity);
    const result = await db.query(
      `SELECT * FROM beneficiaries WHERE ${filter} ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/beneficiaries', async (req, res) => {
  try {
    const { entity_id, full_name, national_id, phone, email, education_level, status } = req.body;
    
    const result = await db.query(
      `INSERT INTO beneficiaries (
        entity_id, full_name, national_id, phone, email, education_level, status,
        incubator_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [entity_id, full_name, national_id, phone, email, education_level, status || 'ACTIVE', entity_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating beneficiary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update beneficiary
app.put('/api/beneficiaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, national_id, phone, email, education_level, status } = req.body;
    
    console.log('📝 Updating beneficiary:', id, req.body);
    
    const result = await db.query(
      `UPDATE beneficiaries 
       SET full_name = $1, national_id = $2, phone = $3, email = $4,
           education_level = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [full_name, national_id, phone, email, education_level, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }
    
    console.log('✅ Beneficiary updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating beneficiary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Training Sessions
app.get('/api/training-sessions', async (req, res) => {
  try {
    const filter = getEntityFilter(req.userEntity);
    const result = await db.query(
      `SELECT 
        ts.*,
        tp.name as program_name,
        tp.code as program_code,
        tp.max_participants
      FROM training_sessions ts
      LEFT JOIN training_programs tp ON ts.program_id = tp.id
      WHERE ${filter.replace('ts.', 'ts.')}
      ORDER BY ts.start_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/training-sessions', async (req, res) => {
  try {
    const { entity_id, session_name, program_id, start_date, end_date, instructor_name, location, status } = req.body;
    
    console.log('📝 Creating training session with data:', {
      entity_id, session_name, program_id, start_date, end_date, instructor_name, location, status
    });
    
    // Validate required fields
    if (!entity_id || !session_name || !program_id || !start_date || !end_date) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: { entity_id, session_name, program_id, start_date, end_date }
      });
    }
    
    // Generate unique session code
    const session_code = `SESSION-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const result = await db.query(
      `INSERT INTO training_sessions (
        entity_id, session_name, session_code, program_id, start_date, end_date, 
        instructor_name, location, status, current_participants, max_participants
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [entity_id, session_name, session_code, program_id, start_date, end_date, instructor_name || null, location || null, status || 'PLANNED', 0, 30]
    );
    
    console.log('✅ Training session created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating training session:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: error.message, details: error.detail });
  }
});

// Update training session
app.put('/api/training-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { session_name, program_id, start_date, end_date, instructor_name, location, status } = req.body;
    
    console.log('📝 Updating training session:', id, req.body);
    
    const result = await db.query(
      `UPDATE training_sessions 
       SET session_name = $1, program_id = $2, start_date = $3, end_date = $4,
           instructor_name = $5, location = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [session_name, program_id, start_date, end_date, instructor_name, location, status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training session not found' });
    }
    
    console.log('✅ Training session updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating training session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const filter = getEntityFilter(req.userEntity);
    const result = await db.query(
      `SELECT 
        c.*,
        b.full_name,
        b.national_id,
        tp.name as program_name
      FROM certificates c
      LEFT JOIN beneficiaries b ON c.beneficiary_id = b.id
      LEFT JOIN training_programs tp ON c.program_id = tp.id
      WHERE ${filter.replace('c.', 'c.')}
      ORDER BY c.issue_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// ENROLLMENTS (Training Session Participants)
// ========================================

// Get enrollments
app.get('/api/enrollments', async (req, res) => {
  try {
    const { session_id, beneficiary_id } = req.query;
    
    let query = `
      SELECT 
        e.*,
        b.full_name as beneficiary_name,
        b.national_id as beneficiary_national_id,
        ts.session_name,
        tp.duration_hours,
        ROUND((a.score / a.max_score * 100)::numeric, 2) as final_grade
      FROM enrollments e
      LEFT JOIN beneficiaries b ON e.beneficiary_id = b.id
      LEFT JOIN training_sessions ts ON e.session_id = ts.id
      LEFT JOIN training_programs tp ON ts.program_id = tp.id
      LEFT JOIN assessments a ON e.id = a.enrollment_id
      WHERE 1=1
    `;
    const params = [];
    
    if (session_id) {
      params.push(session_id);
      query += ` AND e.session_id = $${params.length}`;
    }
    
    if (beneficiary_id) {
      params.push(beneficiary_id);
      query += ` AND e.beneficiary_id = $${params.length}`;
    }
    
    query += ' ORDER BY e.enrollment_date DESC';
    
    console.log('📋 [API] Fetching enrollments:', { session_id, beneficiary_id });
    const result = await db.query(query, params);
    console.log('✅ [API] Found enrollments:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ [API] Error fetching enrollments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create enrollment
app.post('/api/enrollments', async (req, res) => {
  try {
    const { session_id, beneficiary_id, enrollment_date, status } = req.body;
    
    console.log('📝 Creating enrollment:', { session_id, beneficiary_id, enrollment_date, status });
    
    // Check if already enrolled
    const existing = await db.query(
      'SELECT id FROM enrollments WHERE session_id = $1 AND beneficiary_id = $2',
      [session_id, beneficiary_id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'المتدرب مسجل بالفعل في هذه الدفعة' });
    }
    
    const result = await db.query(
      `INSERT INTO enrollments (
        session_id, beneficiary_id, enrollment_date, status,
        attendance_percentage
      ) VALUES ($1, $2, $3, $4, 0) RETURNING *`,
      [session_id, beneficiary_id, enrollment_date, status || 'REGISTERED']
    );
    
    // Update session participant count
    await db.query(
      `UPDATE training_sessions 
       SET current_participants = (SELECT COUNT(*) FROM enrollments WHERE session_id = $1)
       WHERE id = $1`,
      [session_id]
    );
    
    console.log('✅ Enrollment created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating enrollment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete enrollment
app.delete('/api/enrollments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get session_id before deleting
    const enrollment = await db.query('SELECT session_id FROM enrollments WHERE id = $1', [id]);
    
    if (enrollment.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    const session_id = enrollment.rows[0].session_id;
    
    // Delete enrollment
    await db.query('DELETE FROM enrollments WHERE id = $1', [id]);
    
    // Update session participant count
    await db.query(
      `UPDATE training_sessions 
       SET current_participants = (SELECT COUNT(*) FROM enrollments WHERE session_id = $1)
       WHERE id = $1`,
      [session_id]
    );
    
    console.log('✅ Enrollment deleted:', id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting enrollment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// Error handling middleware
// ========================================
// ========================================
// HIERARCHY DETAIL VIEW API
// ========================================

// Get entity details with all children based on entity type and ID
app.get('/api/hierarchy/entity/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const entityType = type.toUpperCase();
    const entityData = {};

    // Get entity basic info
    if (entityType === 'BRANCH') {
      const branch = await db.query(`
        SELECT b.*, hq.name as hq_name 
        FROM branches b
        LEFT JOIN headquarters hq ON b.hq_id = hq.id
        WHERE b.id = $1
      `, [id]);
      
      if (branch.rows.length === 0) {
        return res.status(404).json({ error: 'الفرع غير موجود' });
      }
      
      entityData.entity = branch.rows[0];
      entityData.entity.type = 'BRANCH';
      
      // Get incubators, platforms, and offices under this branch
      const incubators = await db.query('SELECT * FROM incubators WHERE branch_id = $1 AND is_active = true ORDER BY name', [id]);
      const platforms = await db.query(`
        SELECT p.* FROM platforms p
        INNER JOIN incubators i ON p.incubator_id = i.id
        WHERE i.branch_id = $1 AND p.is_active = true
        ORDER BY p.name
      `, [id]);
      const offices = await db.query(`
        SELECT o.* FROM offices o
        INNER JOIN incubators i ON o.incubator_id = i.id
        WHERE i.branch_id = $1 AND o.is_active = true
        ORDER BY o.name
      `, [id]);
      
      entityData.incubators = incubators.rows;
      entityData.platforms = platforms.rows;
      entityData.offices = offices.rows;
      
    } else if (entityType === 'INCUBATOR') {
      const incubator = await db.query(`
        SELECT i.*, b.name as branch_name, b.city, b.country 
        FROM incubators i
        LEFT JOIN branches b ON i.branch_id = b.id
        WHERE i.id = $1
      `, [id]);
      
      if (incubator.rows.length === 0) {
        return res.status(404).json({ error: 'الحاضنة غير موجودة' });
      }
      
      entityData.entity = incubator.rows[0];
      entityData.entity.type = 'INCUBATOR';
      
      // Get platforms and offices under this incubator
      const platforms = await db.query('SELECT * FROM platforms WHERE incubator_id = $1 AND is_active = true ORDER BY name', [id]);
      const offices = await db.query('SELECT * FROM offices WHERE incubator_id = $1 AND is_active = true ORDER BY name', [id]);
      
      entityData.platforms = platforms.rows;
      entityData.offices = offices.rows;
      entityData.incubators = []; // Incubators don't have child incubators
      
    } else if (entityType === 'PLATFORM') {
      const platform = await db.query(`
        SELECT p.*, i.name as incubator_name, b.name as branch_name 
        FROM platforms p
        LEFT JOIN incubators i ON p.incubator_id = i.id
        LEFT JOIN branches b ON i.branch_id = b.id
        WHERE p.id = $1
      `, [id]);
      
      if (platform.rows.length === 0) {
        return res.status(404).json({ error: 'المنصة غير موجودة' });
      }
      
      entityData.entity = platform.rows[0];
      entityData.entity.type = 'PLATFORM';
      
      // Get offices linked to this platform
      const offices = await db.query(`
        SELECT o.* FROM offices o
        INNER JOIN office_platforms op ON o.id = op.office_id
        WHERE op.platform_id = $1 AND op.is_active = true
        ORDER BY o.name
      `, [id]);
      
      entityData.platforms = []; // Platforms don't have child platforms
      entityData.offices = offices.rows;
      entityData.incubators = [];
      
    } else if (entityType === 'OFFICE') {
      const office = await db.query(`
        SELECT o.*, i.name as incubator_name, b.name as branch_name 
        FROM offices o
        LEFT JOIN incubators i ON o.incubator_id = i.id
        LEFT JOIN branches b ON i.branch_id = b.id
        WHERE o.id = $1
      `, [id]);
      
      if (office.rows.length === 0) {
        return res.status(404).json({ error: 'المكتب غير موجود' });
      }
      
      entityData.entity = office.rows[0];
      entityData.entity.type = 'OFFICE';
      
      // Get linked platforms
      const platforms = await db.query(`
        SELECT p.* FROM platforms p
        INNER JOIN office_platforms op ON p.id = op.platform_id
        WHERE op.office_id = $1 AND op.is_active = true
        ORDER BY p.name
      `, [id]);
      
      entityData.platforms = platforms.rows;
      entityData.offices = []; // Offices don't have child offices
      entityData.incubators = [];
      
    } else {
      return res.status(400).json({ error: 'نوع كيان غير صحيح' });
    }

    res.json(entityData);
  } catch (error) {
    console.error('Error fetching entity details:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// Strategic Management API Routes
// ========================================
// MUST BE BEFORE catch-all route!

// Executive Management KPIs
app.get('/api/executive-kpis', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM executive_kpis WHERE status = $1 ORDER BY created_at DESC', ['active']);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching executive KPIs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Executive Goals
app.get('/api/executive-goals', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM executive_goals ORDER BY target_date ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching executive goals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Executive Operations
app.get('/api/executive-operations', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM executive_operations ORDER BY start_date DESC LIMIT 10');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching executive operations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Digital Marketing Campaigns
app.get('/api/digital-marketing', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM digital_marketing_campaigns ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching digital marketing campaigns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Community Marketing
app.get('/api/community-marketing', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM community_marketing ORDER BY event_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching community marketing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Event Marketing
app.get('/api/event-marketing', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM event_marketing ORDER BY event_date ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching event marketing:', error);
    res.status(500).json({ error: error.message });
  }
});

// Training Courses
app.get('/api/training-courses', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM training_courses ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching training courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Skills Registry
app.get('/api/skills', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM skills_registry ORDER BY skill_name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: error.message });
  }
});

// Financial Policies
app.get('/api/financial-policies', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM financial_policies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching financial policies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Financial Manual
app.get('/api/financial-manual', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM financial_manual ORDER BY section_order ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching financial manual:', error);
    res.status(500).json({ error: error.message });
  }
});

// Financial News
app.get('/api/financial-news', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM financial_news ORDER BY published_date DESC LIMIT 20');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching financial news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Development Programs
app.get('/api/development-programs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM development_programs ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching development programs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quality Standards
app.get('/api/quality-standards', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM quality_standards ORDER BY standard_code ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quality standards:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quality Audits
app.get('/api/quality-audits', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM quality_audits ORDER BY audit_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching quality audits:', error);
    res.status(500).json({ error: error.message });
  }
});

// Evaluations
app.get('/api/evaluations', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM evaluations ORDER BY evaluation_date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Information Repository
app.get('/api/information-repository', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM information_repository ORDER BY category, title');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching information repository:', error);
    res.status(500).json({ error: error.message });
  }
});

// Knowledge Base
app.get('/api/knowledge-base', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM knowledge_base ORDER BY helpful_count DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch-all route for SPA - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ========================================
// Start Server
// ========================================
const HOST = process.env.HOST || '0.0.0.0';

// Handle uncaught errors
// ========================================
// PERMISSIONS TESTING API ENDPOINTS
// ========================================

// Get all roles with hierarchy levels
app.get('/api/permissions/roles', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        name_ar,
        job_title_ar,
        hierarchy_level,
        max_approval_limit,
        approval_notes_ar,
        description
      FROM roles
      ORDER BY hierarchy_level, job_title_ar
    `);
    
    res.json({
      success: true,
      roles: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get permissions for specific role
app.get('/api/permissions/role/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const result = await db.query(`
      SELECT 
        rsp.role_id,
        r.name as role_name,
        r.name_ar as role_name_ar,
        r.job_title_ar,
        s.name as system_name,
        s.name_ar as system_name_ar,
        s.description as system_description,
        pl.code as level_code,
        pl.name_ar as level_name_ar,
        pl.allowed_actions,
        pl.restrictions,
        rsp.notes
      FROM role_system_permissions rsp
      JOIN roles r ON r.id = rsp.role_id
      JOIN systems s ON s.id = rsp.system_id
      JOIN permission_levels pl ON pl.id = rsp.permission_level_id
      WHERE rsp.role_id = $1
      ORDER BY s.name
    `, [roleId]);
    
    res.json({
      success: true,
      permissions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get system statistics
app.get('/api/permissions/stats', async (req, res) => {
  try {
    const rolesCount = await db.query('SELECT COUNT(*) as count FROM roles');
    const systemsCount = await db.query('SELECT COUNT(*) as count FROM systems');
    const levelsCount = await db.query('SELECT COUNT(*) as count FROM permission_levels');
    const permissionsCount = await db.query('SELECT COUNT(*) as count FROM role_system_permissions');
    
    // Roles by hierarchy level
    const rolesByLevel = await db.query(`
      SELECT 
        hierarchy_level,
        COUNT(*) as count
      FROM roles
      GROUP BY hierarchy_level
      ORDER BY hierarchy_level
    `);
    
    res.json({
      success: true,
      stats: {
        total_roles: parseInt(rolesCount.rows[0].count),
        total_systems: parseInt(systemsCount.rows[0].count),
        total_permission_levels: parseInt(levelsCount.rows[0].count),
        total_permissions: parseInt(permissionsCount.rows[0].count),
        roles_by_level: rolesByLevel.rows
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get full permissions matrix
app.get('/api/permissions/matrix', async (req, res) => {
  try {
    // Get all systems
    const systems = await db.query(`
      SELECT id, name, name_ar, description
      FROM systems
      ORDER BY name
    `);
    
    // Get all roles with their permissions
    const roles = await db.query(`
      SELECT 
        r.id,
        r.name,
        r.name_ar,
        r.job_title_ar,
        r.hierarchy_level
      FROM roles r
      ORDER BY r.hierarchy_level, r.job_title_ar
    `);
    
    // Get all permissions
    const matrix = [];
    
    for (const role of roles.rows) {
      const permissions = await db.query(`
        SELECT 
          s.id as system_id,
          s.name as system_name,
          s.name_ar as system_name_ar,
          pl.code as level_code,
          pl.name_ar as level_name_ar
        FROM systems s
        LEFT JOIN role_system_permissions rsp ON rsp.system_id = s.id AND rsp.role_id = $1
        LEFT JOIN permission_levels pl ON pl.id = rsp.permission_level_id
        ORDER BY s.name
      `, [role.id]);
      
      matrix.push({
        role_id: role.id,
        role_name: role.name,
        role_name_ar: role.job_title_ar || role.name_ar,
        hierarchy_level: role.hierarchy_level,
        permissions: permissions.rows
      });
    }
    
    res.json({
      success: true,
      systems: systems.rows,
      matrix: matrix
    });
  } catch (error) {
    console.error('Error fetching matrix:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get permission levels
app.get('/api/permissions/levels', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        code,
        name_ar,
        color_code,
        allowed_actions,
        restrictions,
        description
      FROM permission_levels
      ORDER BY 
        CASE code
          WHEN 'FULL' THEN 1
          WHEN 'VIEW_APPROVE' THEN 2
          WHEN 'EXECUTIVE' THEN 3
          WHEN 'VIEW' THEN 4
          WHEN 'LIMITED' THEN 5
          WHEN 'NONE' THEN 6
        END
    `);
    
    res.json({
      success: true,
      levels: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching permission levels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all systems
app.get('/api/permissions/systems', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        name_ar,
        description,
        color_code,
        icon
      FROM systems
      ORDER BY name
    `);
    
    res.json({
      success: true,
      systems: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching systems:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check user permission for specific action
app.post('/api/permissions/check', async (req, res) => {
  try {
    const { roleId, systemName, action } = req.body;
    
    if (!roleId || !systemName || !action) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: roleId, systemName, action' 
      });
    }
    
    const result = await db.query(`
      SELECT 
        r.name as role_name,
        r.name_ar as role_name_ar,
        s.name as system_name,
        s.name_ar as system_name_ar,
        pl.code as permission_level,
        pl.name_ar as permission_name_ar,
        pl.allowed_actions,
        pl.restrictions,
        r.max_approval_limit
      FROM role_system_permissions rsp
      JOIN roles r ON r.id = rsp.role_id
      JOIN systems s ON s.id = rsp.system_id
      JOIN permission_levels pl ON pl.id = rsp.permission_level_id
      WHERE rsp.role_id = $1 AND s.name = $2
    `, [roleId, systemName]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        allowed: false,
        message: 'لا توجد صلاحيات لهذا الدور في هذا النظام'
      });
    }
    
    const permission = result.rows[0];
    const allowedActions = permission.allowed_actions || '';
    const isAllowed = permission.permission_level !== 'NONE' && 
                     (permission.permission_level === 'FULL' || allowedActions.includes(action));
    
    res.json({
      success: true,
      allowed: isAllowed,
      permission_level: permission.permission_level,
      permission_name_ar: permission.permission_name_ar,
      allowed_actions: permission.allowed_actions,
      restrictions: permission.restrictions,
      max_approval_limit: permission.max_approval_limit,
      message: isAllowed ? `مسموح: ${action}` : `غير مسموح: ${action}`
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get security policies
app.get('/api/permissions/security-policies', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        policy_number,
        policy_name_ar,
        description_ar,
        applies_to_levels,
        is_active
      FROM security_policies
      WHERE is_active = true
      ORDER BY policy_number
    `);
    
    res.json({
      success: true,
      policies: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching security policies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  // Don't exit - let the process continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let the process continue
});


const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 نظام نايوش يعمل على ${HOST}:${PORT}`);
  console.log(`📊 API متاح على: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Server is ready to accept connections`);
});

// Keep server alive - increase timeouts for Railway
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 121000;   // 121 seconds
server.timeout = 120000;          // 120 seconds

// Graceful shutdown
let isShuttingDown = false;
process.on('SIGTERM', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('⚠️  SIGTERM received, starting graceful shutdown...');
  
  // Give active connections time to finish
  server.close((err) => {
    if (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
    console.log('✅ Server closed gracefully');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('⚠️  SIGINT received, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
