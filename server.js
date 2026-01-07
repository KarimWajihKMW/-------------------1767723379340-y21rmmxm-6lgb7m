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
