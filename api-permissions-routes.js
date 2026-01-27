const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all roles with hierarchy levels
router.get('/roles', async (req, res) => {
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
        description,
        is_active,
        created_at
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
router.get('/role/:roleId', async (req, res) => {
  try {
    const { roleId } = req.params;
    
    const result = await db.query(`
      SELECT 
        rsp.role_id,
        rsp.system_id,
        rsp.permission_level_id,
        s.system_code,
        s.system_name_ar,
        pl.level_code,
        pl.level_name_ar
      FROM role_system_permissions rsp
      JOIN systems s ON rsp.system_id = s.id
      JOIN permission_levels pl ON rsp.permission_level_id = pl.id
      WHERE rsp.role_id = $1
      ORDER BY s.system_code
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

// Get permissions statistics
router.get('/stats', async (req, res) => {
  try {
    const rolesCount = await db.query('SELECT COUNT(*) as count FROM roles WHERE is_active = true');
    const systemsCount = await db.query('SELECT COUNT(*) as count FROM systems');
    const levelsCount = await db.query('SELECT COUNT(*) as count FROM permission_levels');
    const permissionsCount = await db.query('SELECT COUNT(*) as count FROM role_system_permissions');
    
    // Roles by hierarchy level
    const rolesByLevel = await db.query(`
      SELECT 
        hierarchy_level,
        COUNT(*) as count
      FROM roles
      WHERE is_active = true
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
router.get('/matrix', async (req, res) => {
  try {
    // Get all systems
    const systems = await db.query(`
      SELECT id, system_code, system_name_ar, description_ar
      FROM systems
      WHERE is_active = true
      ORDER BY display_order
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
      WHERE r.is_active = true
      ORDER BY r.hierarchy_level, r.job_title_ar
    `);
    
    // Get all permission mappings
    const permissions = await db.query(`
      SELECT 
        rsp.role_id,
        rsp.system_id,
        rsp.permission_level_id,
        pl.level_code,
        pl.level_name_ar
      FROM role_system_permissions rsp
      JOIN permission_levels pl ON rsp.permission_level_id = pl.id
    `);
    
    res.json({
      success: true,
      matrix: {
        systems: systems.rows,
        roles: roles.rows,
        permissions: permissions.rows
      }
    });
  } catch (error) {
    console.error('Error fetching matrix:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all permission levels
router.get('/levels', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        level_code,
        level_name_ar,
        level_name_en,
        description_ar,
        description_en,
        color_code,
        priority_order,
        created_at
      FROM permission_levels
      ORDER BY priority_order
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

module.exports = router;
