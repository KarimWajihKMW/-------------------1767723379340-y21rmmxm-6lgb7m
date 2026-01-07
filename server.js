const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

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

// Get all entities
app.get('/api/entities', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM entities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
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

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { entity_id } = req.query;
    let query = 'SELECT * FROM users ORDER BY created_at DESC';
    let params = [];
    
    if (entity_id) {
      query = 'SELECT * FROM users WHERE entity_id = $1 ORDER BY created_at DESC';
      params = [entity_id];
    }
    
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

// Get all invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const { entity_id, status } = req.query;
    let query = 'SELECT * FROM invoices ORDER BY created_at DESC';
    let params = [];
    
    if (entity_id && status) {
      query = 'SELECT * FROM invoices WHERE entity_id = $1 AND status = $2 ORDER BY created_at DESC';
      params = [entity_id, status];
    } else if (entity_id) {
      query = 'SELECT * FROM invoices WHERE entity_id = $1 ORDER BY created_at DESC';
      params = [entity_id];
    } else if (status) {
      query = 'SELECT * FROM invoices WHERE status = $1 ORDER BY created_at DESC';
      params = [status];
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { entity_id } = req.query;
    let query = 'SELECT * FROM transactions ORDER BY transaction_date DESC';
    let params = [];
    
    if (entity_id) {
      query = 'SELECT * FROM transactions WHERE entity_id = $1 ORDER BY transaction_date DESC';
      params = [entity_id];
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ledger entries
app.get('/api/ledger', async (req, res) => {
  try {
    const { entity_id } = req.query;
    let query = 'SELECT * FROM ledger ORDER BY transaction_date DESC';
    let params = [];
    
    if (entity_id) {
      query = 'SELECT * FROM ledger WHERE entity_id = $1 ORDER BY transaction_date DESC';
      params = [entity_id];
    }
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all ads
app.get('/api/ads', async (req, res) => {
  try {
    const { entity_id, status, level } = req.query;
    let query = 'SELECT * FROM ads ORDER BY created_at DESC';
    let params = [];
    
    if (entity_id && status) {
      query = 'SELECT * FROM ads WHERE source_entity_id = $1 AND status = $2 ORDER BY created_at DESC';
      params = [entity_id, status];
    } else if (entity_id) {
      query = 'SELECT * FROM ads WHERE source_entity_id = $1 ORDER BY created_at DESC';
      params = [entity_id];
    } else if (status) {
      query = 'SELECT * FROM ads WHERE status = $1 ORDER BY created_at DESC';
      params = [status];
    } else if (level) {
      query = 'SELECT * FROM ads WHERE level = $1 ORDER BY created_at DESC';
      params = [level];
    }
    
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
// Error handling middleware
// ========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ========================================
// Start Server
// ========================================
app.listen(PORT, () => {
  console.log(`🚀 نظام نايوش يعمل على المنفذ ${PORT}`);
  console.log(`📊 API متاح على: http://localhost:${PORT}/api`);
});
