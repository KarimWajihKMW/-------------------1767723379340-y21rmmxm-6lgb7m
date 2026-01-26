const express = require('express');
const router = express.Router();
const db = require('../../db');

// ========================================
// CASHFLOW APIs - الصفحة 1
// ========================================
// تطبيق التدفقات الثلاثة + التوقعات AI

// Helper function for entity filter
const getEntityFilter = (userEntity, tableAlias = '') => {
  const alias = tableAlias ? `${tableAlias}.` : '';
  
  if (userEntity.type === 'HQ') {
    return '1=1';
  } else if (userEntity.type === 'BRANCH') {
    return `${alias}branch_id = '${userEntity.id}' OR ${alias}entity_id = '${userEntity.id}'`;
  } else if (userEntity.type === 'INCUBATOR') {
    return `${alias}incubator_id = '${userEntity.id}' OR ${alias}entity_id = '${userEntity.id}'`;
  }
  
  return `${alias}entity_id = '${userEntity.id}'`;
};

// ========================================
// 1. التدفقات التشغيلية - Operating Cash Flow
// ========================================

// Get Operating Cash Flow
router.get('/operating', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { from_date, to_date, fiscal_year, fiscal_period } = req.query;
    
    let query = `
      SELECT 
        cf.*,
        CASE 
          WHEN cf.flow_direction = 'IN' THEN cf.amount
          ELSE -cf.amount
        END as net_amount
      FROM finance_cashflow cf
      WHERE ${getEntityFilter(userEntity, 'cf')}
        AND cf.flow_type = 'OPERATING'
    `;
    
    const params = [];
    
    if (from_date) {
      params.push(from_date);
      query += ` AND cf.transaction_date >= $${params.length}`;
    }
    
    if (to_date) {
      params.push(to_date);
      query += ` AND cf.transaction_date <= $${params.length}`;
    }
    
    if (fiscal_year) {
      params.push(fiscal_year);
      query += ` AND cf.fiscal_year = $${params.length}`;
    }
    
    if (fiscal_period) {
      params.push(fiscal_period);
      query += ` AND cf.fiscal_period = $${params.length}`;
    }
    
    query += ` ORDER BY cf.transaction_date DESC`;
    
    const result = await db.query(query, params);
    
    // حساب الإجماليات
    const totalIn = result.rows
      .filter(r => r.flow_direction === 'IN')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const totalOut = result.rows
      .filter(r => r.flow_direction === 'OUT')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const netOperatingCashFlow = totalIn - totalOut;
    
    res.json({
      success: true,
      count: result.rows.length,
      summary: {
        total_inflow: totalIn,
        total_outflow: totalOut,
        net_operating_cashflow: netOperatingCashFlow
      },
      flows: result.rows
    });
  } catch (error) {
    console.error('Error fetching operating cashflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record Operating Cash Flow
router.post('/operating', async (req, res) => {
  try {
    const {
      transaction_date,
      flow_category, // 'CUSTOMER_COLLECTIONS', 'VENDOR_PAYMENTS', 'SALARIES', 'OPERATING_EXPENSES'
      amount,
      flow_direction, // 'IN' or 'OUT'
      description,
      reference_type,
      reference_id,
      entity_type,
      entity_id,
      branch_id,
      incubator_id,
      fiscal_year,
      fiscal_period
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO finance_cashflow 
       (transaction_date, flow_type, flow_category, amount, flow_direction, description,
        reference_type, reference_id, entity_type, entity_id, branch_id, incubator_id,
        fiscal_year, fiscal_period)
       VALUES ($1, 'OPERATING', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [transaction_date, flow_category, amount, flow_direction, description,
       reference_type, reference_id, entity_type, entity_id, branch_id, incubator_id,
       fiscal_year, fiscal_period]
    );
    
    res.status(201).json({
      success: true,
      cashflow: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording operating cashflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// 2. التدفقات الاستثمارية - Investing Cash Flow
// ========================================

// Get Investing Cash Flow
router.get('/investing', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { from_date, to_date, fiscal_year } = req.query;
    
    let query = `
      SELECT 
        cf.*,
        CASE 
          WHEN cf.flow_direction = 'IN' THEN cf.amount
          ELSE -cf.amount
        END as net_amount
      FROM finance_cashflow cf
      WHERE ${getEntityFilter(userEntity, 'cf')}
        AND cf.flow_type = 'INVESTING'
    `;
    
    const params = [];
    
    if (from_date) {
      params.push(from_date);
      query += ` AND cf.transaction_date >= $${params.length}`;
    }
    
    if (to_date) {
      params.push(to_date);
      query += ` AND cf.transaction_date <= $${params.length}`;
    }
    
    if (fiscal_year) {
      params.push(fiscal_year);
      query += ` AND cf.fiscal_year = $${params.length}`;
    }
    
    query += ` ORDER BY cf.transaction_date DESC`;
    
    const result = await db.query(query, params);
    
    const totalIn = result.rows
      .filter(r => r.flow_direction === 'IN')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const totalOut = result.rows
      .filter(r => r.flow_direction === 'OUT')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const netInvestingCashFlow = totalIn - totalOut;
    
    res.json({
      success: true,
      count: result.rows.length,
      summary: {
        total_inflow: totalIn,
        total_outflow: totalOut,
        net_investing_cashflow: netInvestingCashFlow
      },
      flows: result.rows
    });
  } catch (error) {
    console.error('Error fetching investing cashflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record Investing Cash Flow
router.post('/investing', async (req, res) => {
  try {
    const {
      transaction_date,
      flow_category, // 'ASSET_PURCHASE', 'ASSET_SALE', 'PLATFORM_INVESTMENT'
      amount,
      flow_direction,
      description,
      reference_type,
      reference_id,
      entity_type,
      entity_id,
      branch_id,
      incubator_id,
      fiscal_year,
      fiscal_period
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO finance_cashflow 
       (transaction_date, flow_type, flow_category, amount, flow_direction, description,
        reference_type, reference_id, entity_type, entity_id, branch_id, incubator_id,
        fiscal_year, fiscal_period)
       VALUES ($1, 'INVESTING', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [transaction_date, flow_category, amount, flow_direction, description,
       reference_type, reference_id, entity_type, entity_id, branch_id, incubator_id,
       fiscal_year, fiscal_period]
    );
    
    res.status(201).json({
      success: true,
      cashflow: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording investing cashflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// 3. التدفقات التمويلية - Financing Cash Flow
// ========================================

// Get Financing Cash Flow
router.get('/financing', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { from_date, to_date, fiscal_year } = req.query;
    
    let query = `
      SELECT 
        cf.*,
        CASE 
          WHEN cf.flow_direction = 'IN' THEN cf.amount
          ELSE -cf.amount
        END as net_amount
      FROM finance_cashflow cf
      WHERE ${getEntityFilter(userEntity, 'cf')}
        AND cf.flow_type = 'FINANCING'
    `;
    
    const params = [];
    
    if (from_date) {
      params.push(from_date);
      query += ` AND cf.transaction_date >= $${params.length}`;
    }
    
    if (to_date) {
      params.push(to_date);
      query += ` AND cf.transaction_date <= $${params.length}`;
    }
    
    if (fiscal_year) {
      params.push(fiscal_year);
      query += ` AND cf.fiscal_year = $${params.length}`;
    }
    
    query += ` ORDER BY cf.transaction_date DESC`;
    
    const result = await db.query(query, params);
    
    const totalIn = result.rows
      .filter(r => r.flow_direction === 'IN')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const totalOut = result.rows
      .filter(r => r.flow_direction === 'OUT')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const netFinancingCashFlow = totalIn - totalOut;
    
    res.json({
      success: true,
      count: result.rows.length,
      summary: {
        total_inflow: totalIn,
        total_outflow: totalOut,
        net_financing_cashflow: netFinancingCashFlow
      },
      flows: result.rows
    });
  } catch (error) {
    console.error('Error fetching financing cashflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Record Financing Cash Flow
router.post('/financing', async (req, res) => {
  try {
    const {
      transaction_date,
      flow_category, // 'LOANS', 'LOAN_REPAYMENT', 'CAPITAL_INCREASE'
      amount,
      flow_direction,
      description,
      reference_type,
      reference_id,
      entity_type,
      entity_id,
      branch_id,
      incubator_id,
      fiscal_year,
      fiscal_period
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO finance_cashflow 
       (transaction_date, flow_type, flow_category, amount, flow_direction, description,
        reference_type, reference_id, entity_type, entity_id, branch_id, incubator_id,
        fiscal_year, fiscal_period)
       VALUES ($1, 'FINANCING', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [transaction_date, flow_category, amount, flow_direction, description,
       reference_type, reference_id, entity_type, entity_id, branch_id, incubator_id,
       fiscal_year, fiscal_period]
    );
    
    res.status(201).json({
      success: true,
      cashflow: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording financing cashflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// 4. التوقعات المستقبلية - AI Forecasting
// ========================================

// Get AI Cashflow Forecast
router.get('/forecast', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { forecast_type, forecast_period } = req.query;
    
    let query = `
      SELECT 
        af.*,
        CASE 
          WHEN af.forecasted_value > 0 THEN 'SURPLUS'
          WHEN af.forecasted_value < 0 THEN 'DEFICIT'
          ELSE 'NEUTRAL'
        END as forecast_status
      FROM finance_ai_forecasts af
      WHERE ${getEntityFilter(userEntity, 'af')}
    `;
    
    const params = [];
    
    if (forecast_type) {
      params.push(forecast_type);
      query += ` AND af.forecast_type = $${params.length}`;
    }
    
    if (forecast_period) {
      params.push(forecast_period);
      query += ` AND af.forecast_period = $${params.length}`;
    }
    
    query += ` ORDER BY af.forecast_date DESC, af.start_date ASC`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      forecasts: result.rows
    });
  } catch (error) {
    console.error('Error fetching AI forecasts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create AI Cashflow Forecast (Basic - سيتم تطويره لاحقاً)
router.post('/forecast', async (req, res) => {
  try {
    const {
      forecast_type, // 'CASHFLOW', 'DEFICIT', 'SURPLUS'
      forecast_period, // 'MONTHLY', 'QUARTERLY', 'ANNUAL'
      forecast_date,
      start_date,
      end_date,
      forecasted_value,
      confidence_level,
      lower_bound,
      upper_bound,
      entity_type,
      entity_id,
      branch_id,
      incubator_id,
      model_version = 'v1.0',
      input_data,
      model_parameters
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO finance_ai_forecasts 
       (forecast_type, forecast_period, forecast_date, start_date, end_date,
        forecasted_value, confidence_level, lower_bound, upper_bound,
        entity_type, entity_id, branch_id, incubator_id,
        model_version, input_data, model_parameters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [forecast_type, forecast_period, forecast_date, start_date, end_date,
       forecasted_value, confidence_level, lower_bound, upper_bound,
       entity_type, entity_id, branch_id, incubator_id,
       model_version, input_data, model_parameters]
    );
    
    res.status(201).json({
      success: true,
      forecast: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating AI forecast:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// 5. Comprehensive Cashflow Report (All Three Types)
// ========================================

router.get('/comprehensive', async (req, res) => {
  try {
    const userEntity = req.userEntity || { type: 'HQ', id: 'HQ001' };
    const { from_date, to_date, fiscal_year } = req.query;
    
    let query = `
      SELECT 
        flow_type,
        flow_category,
        flow_direction,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM finance_cashflow
      WHERE ${getEntityFilter(userEntity)}
    `;
    
    const params = [];
    
    if (from_date) {
      params.push(from_date);
      query += ` AND transaction_date >= $${params.length}`;
    }
    
    if (to_date) {
      params.push(to_date);
      query += ` AND transaction_date <= $${params.length}`;
    }
    
    if (fiscal_year) {
      params.push(fiscal_year);
      query += ` AND fiscal_year = $${params.length}`;
    }
    
    query += ` GROUP BY flow_type, flow_category, flow_direction
               ORDER BY flow_type, flow_category`;
    
    const result = await db.query(query, params);
    
    // تنظيم النتائج حسب نوع التدفق
    const operating = result.rows.filter(r => r.flow_type === 'OPERATING');
    const investing = result.rows.filter(r => r.flow_type === 'INVESTING');
    const financing = result.rows.filter(r => r.flow_type === 'FINANCING');
    
    // حساب الإجماليات لكل نوع
    const calcNetFlow = (flows) => {
      const inflow = flows
        .filter(f => f.flow_direction === 'IN')
        .reduce((sum, f) => sum + parseFloat(f.total_amount), 0);
      const outflow = flows
        .filter(f => f.flow_direction === 'OUT')
        .reduce((sum, f) => sum + parseFloat(f.total_amount), 0);
      return { inflow, outflow, net: inflow - outflow };
    };
    
    const operatingNet = calcNetFlow(operating);
    const investingNet = calcNetFlow(investing);
    const financingNet = calcNetFlow(financing);
    
    const totalNetCashFlow = operatingNet.net + investingNet.net + financingNet.net;
    
    res.json({
      success: true,
      summary: {
        operating: operatingNet,
        investing: investingNet,
        financing: financingNet,
        total_net_cashflow: totalNetCashFlow
      },
      details: {
        operating: operating,
        investing: investing,
        financing: financing
      }
    });
  } catch (error) {
    console.error('Error fetching comprehensive cashflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
