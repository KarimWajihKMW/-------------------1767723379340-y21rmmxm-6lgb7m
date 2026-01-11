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

// Get all users with data isolation
app.get('/api/users', async (req, res) => {
  try {
    const entityFilter = getEntityFilter(req.userEntity);
    
    const query = `
      SELECT u.*, 
        COALESCE(e.name, 'غير محدد') as entity_name
      FROM users u
      LEFT JOIN entities e ON u.entity_id = e.id
      WHERE ${entityFilter}
      ORDER BY u.created_at DESC
    `;
    
    const result = await db.query(query);
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
    
    // Apply user's entity filter - ads are scoped by source_entity_id
    if (req.userEntity.type === 'HQ') {
      // HQ sees all ads
    } else {
      // Other entities see their own ads
      query += ` AND source_entity_id = $${paramIndex}`;
      params.push(req.userEntity.id);
      paramIndex++;
    }
    
    // Additional filters
    if (entity_id) {
      query += ` AND source_entity_id = $${paramIndex}`;
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
// INCUBATOR TRAINING SYSTEM ENDPOINTS
// نظام حاضنة السلامة
// ========================================

// Get all training programs
app.get('/api/training-programs', async (req, res) => {
  try {
    const { entity_id } = req.query;
    
    let query = 'SELECT * FROM training_programs';
    let params = [];
    
    if (entity_id) {
      query += ' WHERE entity_id = $1';
      params = [entity_id];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single training program
app.get('/api/training-programs/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM training_programs WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create training program
app.post('/api/training-programs', async (req, res) => {
  try {
    const { entity_id, code, name, description, category, duration_hours, max_participants, price, passing_score, certificate_validity_months } = req.body;
    
    const result = await db.query(
      `INSERT INTO training_programs 
       (entity_id, code, name, description, category, duration_hours, max_participants, price, passing_score, certificate_validity_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [entity_id, code, name, description, category, duration_hours, max_participants, price, passing_score, certificate_validity_months]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all beneficiaries
app.get('/api/beneficiaries', async (req, res) => {
  try {
    const { entity_id } = req.query;
    
    let query = 'SELECT * FROM beneficiaries';
    let params = [];
    
    if (entity_id) {
      query += ' WHERE entity_id = $1';
      params = [entity_id];
    }
    
    query += ' ORDER BY registration_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single beneficiary with training records
app.get('/api/beneficiaries/:id', async (req, res) => {
  try {
    const beneficiary = await db.query(
      'SELECT * FROM beneficiaries WHERE id = $1',
      [req.params.id]
    );
    
    if (beneficiary.rows.length === 0) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }
    
    // Get training records
    const records = await db.query(
      `SELECT tr.*, tp.name as program_name, tp.code as program_code, 
              c.certificate_number, c.issue_date, c.expiry_date
       FROM training_records tr
       JOIN training_programs tp ON tr.program_id = tp.id
       LEFT JOIN certificates c ON tr.certificate_id = c.id
       WHERE tr.beneficiary_id = $1
       ORDER BY tr.created_at DESC`,
      [req.params.id]
    );
    
    res.json({
      ...beneficiary.rows[0],
      training_records: records.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create beneficiary
app.post('/api/beneficiaries', async (req, res) => {
  try {
    const { entity_id, national_id, full_name, email, phone, date_of_birth, gender, education_level, occupation } = req.body;
    
    const result = await db.query(
      `INSERT INTO beneficiaries 
       (entity_id, national_id, full_name, email, phone, date_of_birth, gender, education_level, occupation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [entity_id, national_id, full_name, email, phone, date_of_birth, gender, education_level, occupation]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all training sessions
app.get('/api/training-sessions', async (req, res) => {
  try {
    const { entity_id, program_id, status } = req.query;
    
    let query = `
      SELECT ts.*, tp.name as program_name, tp.code as program_code
      FROM training_sessions ts
      JOIN training_programs tp ON ts.program_id = tp.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 1;
    
    if (entity_id) {
      query += ` AND ts.entity_id = $${paramCount}`;
      params.push(entity_id);
      paramCount++;
    }
    
    if (program_id) {
      query += ` AND ts.program_id = $${paramCount}`;
      params.push(program_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND ts.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY ts.start_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single training session with enrollments
app.get('/api/training-sessions/:id', async (req, res) => {
  try {
    const session = await db.query(
      `SELECT ts.*, tp.name as program_name, tp.code as program_code, tp.duration_hours
       FROM training_sessions ts
       JOIN training_programs tp ON ts.program_id = tp.id
       WHERE ts.id = $1`,
      [req.params.id]
    );
    
    if (session.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get enrollments
    const enrollments = await db.query(
      `SELECT e.*, b.full_name, b.national_id, b.email, b.phone
       FROM enrollments e
       JOIN beneficiaries b ON e.beneficiary_id = b.id
       WHERE e.session_id = $1
       ORDER BY e.enrollment_date DESC`,
      [req.params.id]
    );
    
    res.json({
      ...session.rows[0],
      enrollments: enrollments.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create training session
app.post('/api/training-sessions', async (req, res) => {
  try {
    const { program_id, entity_id, session_code, session_name, start_date, end_date, location, instructor_name, max_participants } = req.body;
    
    const result = await db.query(
      `INSERT INTO training_sessions 
       (program_id, entity_id, session_code, session_name, start_date, end_date, location, instructor_name, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [program_id, entity_id, session_code, session_name, start_date, end_date, location, instructor_name, max_participants]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all enrollments
app.get('/api/enrollments', async (req, res) => {
  try {
    const { session_id, beneficiary_id, status } = req.query;
    
    let query = `
      SELECT e.*, b.full_name, b.national_id, ts.session_name, tp.name as program_name
      FROM enrollments e
      JOIN beneficiaries b ON e.beneficiary_id = b.id
      JOIN training_sessions ts ON e.session_id = ts.id
      JOIN training_programs tp ON ts.program_id = tp.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 1;
    
    if (session_id) {
      query += ` AND e.session_id = $${paramCount}`;
      params.push(session_id);
      paramCount++;
    }
    
    if (beneficiary_id) {
      query += ` AND e.beneficiary_id = $${paramCount}`;
      params.push(beneficiary_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY e.enrollment_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create enrollment
app.post('/api/enrollments', async (req, res) => {
  try {
    const { session_id, beneficiary_id, notes } = req.body;
    
    // Check if session is full
    const session = await db.query(
      'SELECT max_participants, current_participants FROM training_sessions WHERE id = $1',
      [session_id]
    );
    
    if (session.rows[0].current_participants >= session.rows[0].max_participants) {
      return res.status(400).json({ error: 'Session is full' });
    }
    
    const result = await db.query(
      `INSERT INTO enrollments (session_id, beneficiary_id, notes)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [session_id, beneficiary_id, notes]
    );
    
    // Update session participant count
    await db.query(
      'UPDATE training_sessions SET current_participants = current_participants + 1 WHERE id = $1',
      [session_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all assessments
app.get('/api/assessments', async (req, res) => {
  try {
    const { enrollment_id } = req.query;
    
    let query = `
      SELECT a.*, e.beneficiary_id, b.full_name
      FROM assessments a
      JOIN enrollments e ON a.enrollment_id = e.id
      JOIN beneficiaries b ON e.beneficiary_id = b.id
      WHERE 1=1
    `;
    let params = [];
    
    if (enrollment_id) {
      query += ' AND a.enrollment_id = $1';
      params = [enrollment_id];
    }
    
    query += ' ORDER BY a.assessment_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create assessment
app.post('/api/assessments', async (req, res) => {
  try {
    const { enrollment_id, assessment_type, assessment_date, score, max_score, assessor_name, feedback } = req.body;
    
    const passed = score >= (max_score * 0.7); // 70% passing grade
    
    const result = await db.query(
      `INSERT INTO assessments 
       (enrollment_id, assessment_type, assessment_date, score, max_score, passed, assessor_name, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [enrollment_id, assessment_type, assessment_date, score, max_score, passed, assessor_name, feedback]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const { beneficiary_id, status } = req.query;
    
    let query = `
      SELECT c.*, b.full_name, b.national_id, tp.name as program_name, tp.code as program_code
      FROM certificates c
      JOIN beneficiaries b ON c.beneficiary_id = b.id
      JOIN training_programs tp ON c.program_id = tp.id
      WHERE 1=1
    `;
    let params = [];
    let paramCount = 1;
    
    if (beneficiary_id) {
      query += ` AND c.beneficiary_id = $${paramCount}`;
      params.push(beneficiary_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    query += ' ORDER BY c.issue_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single certificate
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, b.full_name, b.national_id, b.email, 
              tp.name as program_name, tp.code as program_code, tp.duration_hours,
              ts.session_name, ts.start_date, ts.end_date
       FROM certificates c
       JOIN beneficiaries b ON c.beneficiary_id = b.id
       JOIN training_programs tp ON c.program_id = tp.id
       JOIN enrollments e ON c.enrollment_id = e.id
       JOIN training_sessions ts ON e.session_id = ts.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify certificate by number
app.get('/api/certificates/verify/:certificate_number', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, b.full_name, b.national_id, tp.name as program_name, tp.code as program_code
       FROM certificates c
       JOIN beneficiaries b ON c.beneficiary_id = b.id
       JOIN training_programs tp ON c.program_id = tp.id
       WHERE c.certificate_number = $1`,
      [req.params.certificate_number]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found', valid: false });
    }
    
    const cert = result.rows[0];
    const isValid = cert.status === 'VALID' && (!cert.expiry_date || new Date(cert.expiry_date) > new Date());
    
    res.json({
      ...cert,
      valid: isValid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Issue certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const { enrollment_id, beneficiary_id, program_id, certificate_number, final_score, grade, issued_by } = req.body;
    
    // Get program details for validity period
    const program = await db.query(
      'SELECT certificate_validity_months FROM training_programs WHERE id = $1',
      [program_id]
    );
    
    const validity_months = program.rows[0].certificate_validity_months || 12;
    const issue_date = new Date();
    const expiry_date = new Date();
    expiry_date.setMonth(expiry_date.getMonth() + validity_months);
    
    // Generate QR code data
    const qr_code = `QR:${certificate_number}:${beneficiary_id}:${issue_date.toISOString().split('T')[0]}`;
    const verification_url = `https://nayosh.sa/verify/${certificate_number}`;
    
    const result = await db.query(
      `INSERT INTO certificates 
       (enrollment_id, beneficiary_id, program_id, certificate_number, issue_date, expiry_date, 
        qr_code, final_score, grade, issued_by, verification_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [enrollment_id, beneficiary_id, program_id, certificate_number, issue_date, expiry_date, 
       qr_code, final_score, grade, issued_by, verification_url]
    );
    
    // Update enrollment status
    await db.query(
      'UPDATE enrollments SET status = $1 WHERE id = $2',
      ['COMPLETED', enrollment_id]
    );
    
    // Create training record
    const session = await db.query(
      'SELECT session_id FROM enrollments WHERE id = $1',
      [enrollment_id]
    );
    
    const programDetails = await db.query(
      'SELECT duration_hours FROM training_programs WHERE id = $1',
      [program_id]
    );
    
    await db.query(
      `INSERT INTO training_records 
       (beneficiary_id, program_id, session_id, certificate_id, completion_date, total_hours, final_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [beneficiary_id, program_id, session.rows[0].session_id, result.rows[0].id, 
       issue_date, programDetails.rows[0].duration_hours, final_score, 'COMPLETED']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get training records
app.get('/api/training-records', async (req, res) => {
  try {
    const { beneficiary_id } = req.query;
    
    let query = `
      SELECT tr.*, tp.name as program_name, tp.code as program_code,
             ts.session_name, c.certificate_number, c.issue_date, c.expiry_date
      FROM training_records tr
      JOIN training_programs tp ON tr.program_id = tp.id
      JOIN training_sessions ts ON tr.session_id = ts.id
      LEFT JOIN certificates c ON tr.certificate_id = c.id
      WHERE 1=1
    `;
    let params = [];
    
    if (beneficiary_id) {
      query += ' AND tr.beneficiary_id = $1';
      params = [beneficiary_id];
    }
    
    query += ' ORDER BY tr.created_at DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get renewals
app.get('/api/renewals', async (req, res) => {
  try {
    const { certificate_id } = req.query;
    
    let query = `
      SELECT r.*, c.certificate_number as old_cert_number, nc.certificate_number as new_cert_number
      FROM renewals r
      JOIN certificates c ON r.original_certificate_id = c.id
      JOIN certificates nc ON r.new_certificate_id = nc.id
      WHERE 1=1
    `;
    let params = [];
    
    if (certificate_id) {
      query += ' AND r.original_certificate_id = $1';
      params = [certificate_id];
    }
    
    query += ' ORDER BY r.renewal_date DESC';
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create renewal
app.post('/api/renewals', async (req, res) => {
  try {
    const { original_certificate_id, renewal_type, notes } = req.body;
    
    // Get original certificate
    const original = await db.query('SELECT * FROM certificates WHERE id = $1', [original_certificate_id]);
    if (original.rows.length === 0) return res.status(404).json({ error: 'Original certificate not found' });
    
    const cert = original.rows[0];
    
    // Create new certificate number
    const new_cert_number = cert.certificate_number + '-R' + Math.floor(Math.random() * 1000);
    
    // Calculate new dates
    const issue_date = new Date();
    // Get validity from program
     const program = await db.query(
      'SELECT certificate_validity_months FROM training_programs WHERE id = $1',
      [cert.program_id]
    );
    const validity_months = program.rows[0].certificate_validity_months || 12;
    const expiry_date = new Date();
    expiry_date.setMonth(expiry_date.getMonth() + validity_months);
    
    // Generate QR code data
    const qr_code = `QR:${new_cert_number}:${cert.beneficiary_id}:${issue_date.toISOString().split('T')[0]}`;
    const verification_url = `https://nayosh.sa/verify/${new_cert_number}`;
    
    const newCert = await db.query(
      `INSERT INTO certificates 
       (enrollment_id, beneficiary_id, program_id, certificate_number, issue_date, expiry_date, 
        qr_code, final_score, grade, issued_by, verification_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'VALID')
       RETURNING *`,
      [cert.enrollment_id, cert.beneficiary_id, cert.program_id, new_cert_number, issue_date, expiry_date, 
       qr_code, cert.final_score, cert.grade, cert.issued_by, verification_url]
    );
    
    // Mark old certificate as RENEWED
    await db.query('UPDATE certificates SET status = $1 WHERE id = $2', ['RENEWED', original_certificate_id]);
    
    // Create renewal record
    const result = await db.query(
      `INSERT INTO renewals (original_certificate_id, new_certificate_id, renewal_type, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [original_certificate_id, newCert.rows[0].id, renewal_type, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Incubator dashboard statistics
app.get('/api/incubator/stats', async (req, res) => {
  try {
    const { entity_id } = req.query;
    
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM training_programs WHERE entity_id = $1) as total_programs,
        (SELECT COUNT(*) FROM beneficiaries WHERE entity_id = $1) as total_beneficiaries,
        (SELECT COUNT(*) FROM training_sessions WHERE entity_id = $1) as total_sessions,
        (SELECT COUNT(*) FROM training_sessions WHERE entity_id = $1 AND status = 'IN_PROGRESS') as active_sessions,
        (SELECT COUNT(*) FROM enrollments e 
         JOIN training_sessions ts ON e.session_id = ts.id 
         WHERE ts.entity_id = $1 AND e.status = 'ATTENDING') as current_enrollments,
        (SELECT COUNT(*) FROM certificates c 
         JOIN training_programs tp ON c.program_id = tp.id 
         WHERE tp.entity_id = $1 AND c.status = 'VALID') as active_certificates,
        (SELECT COUNT(*) FROM certificates c 
         JOIN training_programs tp ON c.program_id = tp.id 
         WHERE tp.entity_id = $1 AND c.expiry_date < CURRENT_DATE) as expired_certificates
    `, [entity_id]);
    
    res.json(stats.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// Multi-Tenant APIs - نظام متعدد المستأجرين
// ========================================

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

// Get all incubators (with optional branch filter)
app.get('/api/incubators', async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = `
      SELECT i.*, 
             b.name as branch_name, b.code as branch_code,
             hq.name as hq_name, hq.code as hq_code
      FROM incubators i
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN headquarters hq ON b.hq_id = hq.id
    `;
    const params = [];
    if (branch_id) {
      query += ' WHERE i.branch_id = $1';
      params.push(branch_id);
    }
    query += ' ORDER BY i.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
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
    const { incubator_id } = req.query;
    let query = `
      SELECT p.*, 
             i.name as incubator_name, i.code as incubator_code,
             b.name as branch_name,
             hq.name as hq_name
      FROM platforms p
      LEFT JOIN incubators i ON p.incubator_id = i.id
      LEFT JOIN branches b ON i.branch_id = b.id
      LEFT JOIN headquarters hq ON b.hq_id = hq.id
    `;
    const params = [];
    if (incubator_id) {
      query += ' WHERE p.incubator_id = $1';
      params.push(incubator_id);
    }
    query += ' ORDER BY p.created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
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
    
    // First, resolve the user's entity string ID to the numeric DB ID if needed
    let userEntityDbId = req.userEntity.id;
    
    if (req.userEntity.type !== 'HQ') {
      // Try to resolve the entity ID to get its numeric DB ID
      const entityRes = await db.query(
        'SELECT id FROM entities WHERE id = $1', 
        [req.userEntity.id]
      );
      if (entityRes.rows.length === 0) {
        // Entity not found
        return res.json([]);
      }
      userEntityDbId = entityRes.rows[0].id;
    }
    
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

    // Apply user's entity filter
    if (req.userEntity.type !== 'HQ') {
      // Non-HQ entities see only their own employees
      if (req.userEntity.type === 'BRANCH') {
        query += ` AND emp.branch_id = $${paramIndex}`;
      } else if (req.userEntity.type === 'INCUBATOR') {
        query += ` AND emp.incubator_id = $${paramIndex}`;
      } else if (req.userEntity.type === 'PLATFORM') {
        query += ` AND emp.platform_id = $${paramIndex}`;
      } else if (req.userEntity.type === 'OFFICE') {
        query += ` AND emp.office_id = $${paramIndex}`;
      }
      params.push(userEntityDbId);
      paramIndex++;
    }

    // Additional filters
    if (entity_type) {
      query += ` AND emp.assigned_entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (entity_id) {
      // Resolve entity_id to numeric DB ID
      const eidRes = await db.query(
        'SELECT id FROM entities WHERE id = $1 OR id::text = $1',
        [entity_id]
      );
      if (eidRes.rows.length > 0) {
        query += ` AND COALESCE(emp.hq_id, emp.branch_id, emp.incubator_id, emp.platform_id, emp.office_id) = $${paramIndex}`;
        params.push(eidRes.rows[0].id);
        paramIndex++;
      } else {
        return res.json([]);
      }
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
    res.status(500).json({ error: error.message });
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
// Error handling middleware
// ========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ========================================
// Start Server
// ========================================
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 نظام نايوش يعمل على ${HOST}:${PORT}`);
  console.log(`📊 API متاح على: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Server is ready to accept connections`);
});

// Keep server alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
