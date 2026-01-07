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
    
    if (entity_id) {
      params.push(entity_id);
      query += ` AND w.entity_id = $${params.length}`;
    }
    
    if (status) {
      params.push(status);
      query += ` AND w.status = $${params.length}`;
    }
    
    if (approver_id) {
      query += ` AND w.id IN (
        SELECT workflow_id FROM approval_steps 
        WHERE approver_id = $${params.length + 1} AND status = 'PENDING'
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
