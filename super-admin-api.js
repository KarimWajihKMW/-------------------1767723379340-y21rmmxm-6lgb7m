/**
 * Super Admin API Endpoints
 * إدارة الأدوار والصلاحيات بالكامل
 */

const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

const pool = new Pool({
    connectionString: 'postgresql://postgres:PddzJpAQYezqknsntSzmCUlQYuYJldcT@crossover.proxy.rlwy.net:44255/railway',
    ssl: false
});

// ========== Middleware للتحقق من Super Admin ==========
const verifySuperAdmin = async (req, res, next) => {
    try {
        const userId = req.userId || req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح - مطلوب تسجيل دخول' });
        }

        const result = await pool.query(`
            SELECT r.code, r.hierarchy_level
            FROM user_roles ur
            JOIN roles r ON ur.role_code = r.code
            WHERE ur.user_id = $1 AND ur.is_active = true
            ORDER BY r.hierarchy_level ASC
            LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'غير مصرح - لا يوجد دور نشط' });
        }

        const userRole = result.rows[0];

        // فقط CEO وCOO وCFO لديهم صلاحيات Super Admin
        const superAdminRoles = ['CEO', 'COO', 'CFO'];
        if (!superAdminRoles.includes(userRole.code)) {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح - يجب أن تكون CEO أو COO أو CFO للوصول لهذه الصفحة' 
            });
        }

        req.userRole = userRole;
        next();
    } catch (error) {
        console.error('خطأ في التحقق من Super Admin:', error);
        res.status(500).json({ success: false, message: 'خطأ في التحقق من الصلاحيات' });
    }
};

// ========== 1. جلب جميع الأدوار ==========
router.get('/roles', verifySuperAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.id,
                r.name as code,
                r.name_ar,
                r.job_title_ar as title_ar,
                r.job_title_en as title_en,
                r.description,
                r.hierarchy_level,
                r.min_approval_limit,
                r.max_approval_limit,
                r.is_active,
                r.created_at,
                COUNT(DISTINCT ur.user_id) as users_count,
                COUNT(DISTINCT rp.permission_id) as systems_count
            FROM roles r
            LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            GROUP BY r.id
            ORDER BY r.hierarchy_level ASC, r.job_title_ar ASC
        `);

        res.json({
            success: true,
            roles: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('خطأ في جلب الأدوار:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب الأدوار' });
    }
});

// ========== 2. جلب تفاصيل دور محدد ==========
router.get('/roles/:roleCode', verifySuperAdmin, async (req, res) => {
    try {
        const { roleCode } = req.params;

        const roleResult = await pool.query(`
            SELECT * FROM roles WHERE code = $1
        `, [roleCode]);

        if (roleResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الدور غير موجود' });
        }

        const permissionsResult = await pool.query(`
            SELECT 
                rp.*,
                s.name_ar as system_name_ar,
                s.name_en as system_name_en,
                pl.name_ar as permission_level_name_ar
            FROM role_permissions rp
            JOIN systems s ON rp.system_code = s.code
            JOIN permission_levels pl ON rp.permission_level = pl.code
            WHERE rp.role_code = $1
            ORDER BY s.name_ar
        `, [roleCode]);

        const usersResult = await pool.query(`
            SELECT 
                ur.user_id,
                ur.assigned_at,
                ur.is_active
            FROM user_roles ur
            WHERE ur.role_code = $1
            ORDER BY ur.assigned_at DESC
        `, [roleCode]);

        res.json({
            success: true,
            role: roleResult.rows[0],
            permissions: permissionsResult.rows,
            users: usersResult.rows
        });
    } catch (error) {
        console.error('خطأ في جلب تفاصيل الدور:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب التفاصيل' });
    }
});

// ========== 3. تحديث صلاحيات دور ==========
router.put('/roles/:roleCode/permissions', verifySuperAdmin, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { roleCode } = req.params;
        const { permissions } = req.body; // [{system_code, permission_level}, ...]

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ success: false, message: 'يجب أن تكون الصلاحيات مصفوفة' });
        }

        await client.query('BEGIN');

        // حذف الصلاحيات القديمة
        await client.query('DELETE FROM role_permissions WHERE role_code = $1', [roleCode]);

        // إضافة الصلاحيات الجديدة
        for (const perm of permissions) {
            if (!perm.system_code || !perm.permission_level) continue;

            await client.query(`
                INSERT INTO role_permissions (role_code, system_code, permission_level)
                VALUES ($1, $2, $3)
                ON CONFLICT (role_code, system_code) 
                DO UPDATE SET permission_level = $3
            `, [roleCode, perm.system_code, perm.permission_level]);
        }

        await client.query('COMMIT');

        // سجل في audit log
        await pool.query(`
            INSERT INTO audit_log (
                entity_type, entity_id, action, 
                performed_by, details
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            'role_permissions',
            roleCode,
            'UPDATE',
            req.userId || 'super-admin',
            JSON.stringify({ permissions_count: permissions.length })
        ]);

        res.json({
            success: true,
            message: 'تم تحديث الصلاحيات بنجاح',
            updated_count: permissions.length
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('خطأ في تحديث الصلاحيات:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث الصلاحيات' });
    } finally {
        client.release();
    }
});

// ========== 4. تحديث معلومات دور ==========
router.put('/roles/:roleCode', verifySuperAdmin, async (req, res) => {
    try {
        const { roleCode } = req.params;
        const { 
            title_ar, 
            title_en, 
            description, 
            hierarchy_level,
            min_approval_limit,
            max_approval_limit,
            is_active
        } = req.body;

        const result = await pool.query(`
            UPDATE roles SET
                title_ar = COALESCE($1, title_ar),
                title_en = COALESCE($2, title_en),
                description = COALESCE($3, description),
                hierarchy_level = COALESCE($4, hierarchy_level),
                min_approval_limit = COALESCE($5, min_approval_limit),
                max_approval_limit = COALESCE($6, max_approval_limit),
                is_active = COALESCE($7, is_active)
            WHERE code = $8
            RETURNING *
        `, [
            title_ar, 
            title_en, 
            description, 
            hierarchy_level,
            min_approval_limit,
            max_approval_limit,
            is_active,
            roleCode
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الدور غير موجود' });
        }

        // سجل في audit log
        await pool.query(`
            INSERT INTO audit_log (
                entity_type, entity_id, action, 
                performed_by, details
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            'roles',
            roleCode,
            'UPDATE',
            req.userId || 'super-admin',
            JSON.stringify(req.body)
        ]);

        res.json({
            success: true,
            message: 'تم تحديث الدور بنجاح',
            role: result.rows[0]
        });
    } catch (error) {
        console.error('خطأ في تحديث الدور:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث الدور' });
    }
});

// ========== 5. إنشاء دور جديد ==========
router.post('/roles', verifySuperAdmin, async (req, res) => {
    try {
        const {
            code,
            title_ar,
            title_en,
            description,
            hierarchy_level,
            min_approval_limit,
            max_approval_limit
        } = req.body;

        // التحقق من البيانات المطلوبة
        if (!code || !title_ar || !title_en || hierarchy_level === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'البيانات المطلوبة: code, title_ar, title_en, hierarchy_level' 
            });
        }

        const result = await pool.query(`
            INSERT INTO roles (
                code, title_ar, title_en, description,
                hierarchy_level, min_approval_limit, max_approval_limit,
                is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING *
        `, [
            code,
            title_ar,
            title_en,
            description || null,
            hierarchy_level,
            min_approval_limit || 0,
            max_approval_limit || 0
        ]);

        // سجل في audit log
        await pool.query(`
            INSERT INTO audit_log (
                entity_type, entity_id, action, 
                performed_by, details
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            'roles',
            code,
            'CREATE',
            req.userId || 'super-admin',
            JSON.stringify(req.body)
        ]);

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الدور بنجاح',
            role: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') { // unique violation
            return res.status(400).json({ success: false, message: 'الدور موجود بالفعل' });
        }
        console.error('خطأ في إنشاء الدور:', error);
        res.status(500).json({ success: false, message: 'خطأ في إنشاء الدور' });
    }
});

// ========== 6. حذف دور ==========
router.delete('/roles/:roleCode', verifySuperAdmin, async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { roleCode } = req.params;

        // التحقق من عدم وجود مستخدمين نشطين بهذا الدور
        const usersCheck = await client.query(`
            SELECT COUNT(*) as count 
            FROM user_roles 
            WHERE role_code = $1 AND is_active = true
        `, [roleCode]);

        if (parseInt(usersCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'لا يمكن حذف الدور - يوجد مستخدمين نشطين بهذا الدور' 
            });
        }

        await client.query('BEGIN');

        // حذف الصلاحيات
        await client.query('DELETE FROM role_permissions WHERE role_code = $1', [roleCode]);

        // حذف الدور
        const result = await client.query('DELETE FROM roles WHERE code = $1 RETURNING *', [roleCode]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'الدور غير موجود' });
        }

        await client.query('COMMIT');

        // سجل في audit log
        await pool.query(`
            INSERT INTO audit_log (
                entity_type, entity_id, action, 
                performed_by, details
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            'roles',
            roleCode,
            'DELETE',
            req.userId || 'super-admin',
            JSON.stringify({ deleted_role: result.rows[0] })
        ]);

        res.json({
            success: true,
            message: 'تم حذف الدور بنجاح'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('خطأ في حذف الدور:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف الدور' });
    } finally {
        client.release();
    }
});

// ========== 7. جلب جميع الأنظمة ومستويات الصلاحيات ==========
router.get('/metadata', verifySuperAdmin, async (req, res) => {
    try {
        const systemsResult = await pool.query(`
            SELECT code, name_ar, name_en, description
            FROM systems
            ORDER BY name_ar
        `);

        const permissionLevelsResult = await pool.query(`
            SELECT code, name_ar, name_en, color, description, priority
            FROM permission_levels
            ORDER BY priority DESC
        `);

        const hierarchyLevelsResult = await pool.query(`
            SELECT DISTINCT hierarchy_level
            FROM roles
            WHERE is_active = true
            ORDER BY hierarchy_level ASC
        `);

        res.json({
            success: true,
            systems: systemsResult.rows,
            permission_levels: permissionLevelsResult.rows,
            hierarchy_levels: hierarchyLevelsResult.rows.map(r => r.hierarchy_level)
        });
    } catch (error) {
        console.error('خطأ في جلب البيانات الوصفية:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
    }
});

// ========== 8. تعيين دور لمستخدم ==========
router.post('/users/:userId/role', verifySuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { role_code } = req.body;

        if (!role_code) {
            return res.status(400).json({ success: false, message: 'role_code مطلوب' });
        }

        // التحقق من وجود الدور
        const roleCheck = await pool.query('SELECT code FROM roles WHERE code = $1', [role_code]);
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الدور غير موجود' });
        }

        // إلغاء تفعيل الدور القديم
        await pool.query(`
            UPDATE user_roles 
            SET is_active = false 
            WHERE user_id = $1
        `, [userId]);

        // إضافة الدور الجديد
        const result = await pool.query(`
            INSERT INTO user_roles (user_id, role_code, is_active, assigned_at)
            VALUES ($1, $2, true, NOW())
            ON CONFLICT (user_id, role_code) 
            DO UPDATE SET is_active = true, assigned_at = NOW()
            RETURNING *
        `, [userId, role_code]);

        // سجل في audit log
        await pool.query(`
            INSERT INTO audit_log (
                entity_type, entity_id, action, 
                performed_by, details
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            'user_roles',
            userId,
            'ASSIGN_ROLE',
            req.userId || 'super-admin',
            JSON.stringify({ role_code, user_id: userId })
        ]);

        res.json({
            success: true,
            message: 'تم تعيين الدور بنجاح',
            user_role: result.rows[0]
        });
    } catch (error) {
        console.error('خطأ في تعيين الدور:', error);
        res.status(500).json({ success: false, message: 'خطأ في تعيين الدور' });
    }
});

// ========== 9. إلغاء دور من مستخدم ==========
router.delete('/users/:userId/role', verifySuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        await pool.query(`
            UPDATE user_roles 
            SET is_active = false 
            WHERE user_id = $1
        `, [userId]);

        // سجل في audit log
        await pool.query(`
            INSERT INTO audit_log (
                entity_type, entity_id, action, 
                performed_by, details
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            'user_roles',
            userId,
            'REVOKE_ROLE',
            req.userId || 'super-admin',
            JSON.stringify({ user_id: userId })
        ]);

        res.json({
            success: true,
            message: 'تم إلغاء الدور بنجاح'
        });
    } catch (error) {
        console.error('خطأ في إلغاء الدور:', error);
        res.status(500).json({ success: false, message: 'خطأ في إلغاء الدور' });
    }
});

// ========== 10. سجل التعديلات (Audit Log) ==========
router.get('/audit-log', verifySuperAdmin, async (req, res) => {
    try {
        const { limit = 50, offset = 0, entity_type } = req.query;

        let query = `
            SELECT *
            FROM audit_log
            WHERE entity_type IN ('roles', 'role_permissions', 'user_roles')
        `;

        const params = [];
        if (entity_type) {
            params.push(entity_type);
            query += ` AND entity_type = $${params.length}`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const countResult = await pool.query(`
            SELECT COUNT(*) as total
            FROM audit_log
            WHERE entity_type IN ('roles', 'role_permissions', 'user_roles')
            ${entity_type ? 'AND entity_type = $1' : ''}
        `, entity_type ? [entity_type] : []);

        res.json({
            success: true,
            logs: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('خطأ في جلب سجل التعديلات:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب السجل' });
    }
});

module.exports = router;
