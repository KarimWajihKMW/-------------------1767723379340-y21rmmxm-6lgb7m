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

const ensureOfficePageAccessTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS office_page_access (
            id SERIAL PRIMARY KEY,
            office_id INTEGER NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
            page_key VARCHAR(120) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(office_id, page_key)
        )
    `);
};

// ========== Middleware للتحقق من Super Admin ==========
const verifySuperAdmin = async (req, res, next) => {
    try {
        const userId = req.userId || req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'غير مصرح - مطلوب تسجيل دخول' });
        }

        const result = await pool.query(`
            SELECT r.name, r.hierarchy_level
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 AND ur.is_active = true
            ORDER BY r.hierarchy_level ASC
            LIMIT 1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'غير مصرح - لا يوجد دور نشط' });
        }

        const userRole = result.rows[0];

        // فقط المستخدمين بمستوى 0 (القيادة العليا) لديهم صلاحيات Super Admin
        if (userRole.hierarchy_level !== 0) {
            return res.status(403).json({ 
                success: false, 
                message: 'غير مصرح - يجب أن تكون من القيادة العليا للوصول لهذه الصفحة' 
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
                COUNT(DISTINCT ur.user_id) FILTER (WHERE ur.is_active = true) as users_count,
                0 as systems_count
            FROM roles r
            LEFT JOIN user_roles ur ON r.id = ur.role_id
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

        // يمكن أن يكون roleCode إما id أو name
        const roleResult = await pool.query(`
            SELECT 
                id,
                name as code,
                name_ar,
                job_title_ar as title_ar,
                job_title_en as title_en,
                description,
                hierarchy_level,
                min_approval_limit,
                max_approval_limit,
                is_active
            FROM roles 
            WHERE name = $1 OR id::text = $1
        `, [roleCode]);

        if (roleResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الدور غير موجود' });
        }

        // جلب المستخدمين المعينين لهذا الدور
        const usersResult = await pool.query(`
            SELECT 
                ur.user_id,
                ur.granted_at as assigned_at,
                ur.is_active
            FROM user_roles ur
            WHERE ur.role_id = $1
            ORDER BY ur.granted_at DESC
        `, [roleResult.rows[0].id]);

        res.json({
            success: true,
            role: roleResult.rows[0],
            permissions: [], // سيتم إضافتها لاحقاً
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
                entity_type, entity_reference_id, action_type, 
                user_name, description
            ) VALUES ($1, $2, $3, $4, $5)
        `, [
            'role',
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
                entity_type, entity_reference_id, action_type, 
                user_name, description
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
            max_approval_limit,
            level
        } = req.body;

        // التحقق من البيانات المطلوبة
        if (!code || !title_ar || hierarchy_level === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'البيانات المطلوبة: code, title_ar, hierarchy_level' 
            });
        }

        const result = await pool.query(`
            INSERT INTO roles (
                name, name_ar, job_title_ar, job_title_en, description,
                level, hierarchy_level, min_approval_limit, max_approval_limit,
                is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
            RETURNING *
        `, [
            code,                           // name
            code,                           // name_ar (نفس الكود)
            title_ar,                       // job_title_ar
            title_en || title_ar,          // job_title_en
            description || null,
            level || 'OPERATIONAL',        // level
            hierarchy_level,
            min_approval_limit || 0,
            max_approval_limit || null
        ]);

        // سجل في audit log
        await pool.query(`
            INSERT INTO audit_log (
                entity_type, entity_reference_id, action_type, 
                user_name, description
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

        // جلب معلومات الدور أولاً
        const roleCheck = await client.query('SELECT id, name, job_title_ar FROM roles WHERE name = $1', [roleCode]);
        
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الدور غير موجود' });
        }
        
        const roleId = roleCheck.rows[0].id;
        const roleInfo = roleCheck.rows[0];

        // التحقق من عدم وجود مستخدمين نشطين بهذا الدور
        const usersCheck = await client.query(`
            SELECT COUNT(*) as count 
            FROM user_roles ur
            WHERE ur.role_id = $1 AND ur.is_active = true
        `, [roleId]);

        if (parseInt(usersCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'لا يمكن حذف الدور - يوجد مستخدمين نشطين بهذا الدور' 
            });
        }

        await client.query('BEGIN');

        // حذف الصلاحيات (إذا كانت موجودة) - استخدام role_id
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

        // حذف الدور - استخدام id أفضل من name
        const result = await client.query('DELETE FROM roles WHERE id = $1 RETURNING *', [roleId]);

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'الدور غير موجود' });
        }

        await client.query('COMMIT');

        // سجل في audit log
        await pool.query(`
            INSERT INTO audit_log (
                entity_type, entity_reference_id, action_type, 
                user_name, description
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
router.get('/metadata', async (req, res) => {
    try {
        // جلب الأنظمة
        const systemsResult = await pool.query(`
            SELECT system_code as code, system_name_ar as name_ar, system_name_en as name_en, description_ar as description
            FROM systems
            WHERE is_active = true
            ORDER BY display_order, system_name_ar
        `);

        // جلب مستويات الصلاحيات (إذا كان الجدول موجوداً)
        let permissionLevels = [];
        try {
            const permissionLevelsResult = await pool.query(`
                SELECT level_code as code, level_name_ar as name_ar, level_name_en as name_en, 
                       color_code as color, description_ar as description, priority_order as priority
                FROM permission_levels
                ORDER BY priority_order DESC
            `);
            permissionLevels = permissionLevelsResult.rows;
        } catch (err) {
            console.log('⚠️  جدول permission_levels غير موجود، سيتم استخدام قيم افتراضية');
            permissionLevels = [
                { code: 'FULL', name_ar: 'كامل', name_en: 'Full', color: '#10B981', priority: 5 },
                { code: 'EXECUTIVE', name_ar: 'تنفيذي', name_en: 'Executive', color: '#3B82F6', priority: 4 },
                { code: 'VIEW', name_ar: 'عرض فقط', name_en: 'View Only', color: '#6B7280', priority: 3 }
            ];
        }

        const hierarchyLevelsResult = await pool.query(`
            SELECT DISTINCT hierarchy_level
            FROM roles
            WHERE is_active = true
            ORDER BY hierarchy_level ASC
        `);

        res.json({
            success: true,
            systems: systemsResult.rows,
            permission_levels: permissionLevels,
            hierarchy_levels: hierarchyLevelsResult.rows.map(r => r.hierarchy_level)
        });
    } catch (error) {
        console.error('خطأ في جلب البيانات الوصفية:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب البيانات' });
    }
});

// ========== 7.5. جلب معلومات مستخدم ==========
router.get('/users/:userId', verifySuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        // جلب معلومات المستخدم
        const userResult = await pool.query(`
            SELECT id, name, email, entity_id, entity_name, is_active
            FROM users
            WHERE id = $1
        `, [userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'المستخدم غير موجود' 
            });
        }

        const user = userResult.rows[0];

        // جلب الدور الحالي للمستخدم
        const roleResult = await pool.query(`
            SELECT r.id as role_id, r.name_ar as role_name, ur.is_active
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 AND ur.is_active = true
            LIMIT 1
        `, [userId]);

        const currentRole = roleResult.rows.length > 0 ? roleResult.rows[0] : null;

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                entity_id: user.entity_id,
                entity_name: user.entity_name,
                is_active: user.is_active,
                current_role: currentRole
            }
        });
    } catch (error) {
        console.error('خطأ في جلب معلومات المستخدم:', error);
        res.status(500).json({ 
            success: false, 
            message: 'حدث خطأ في جلب معلومات المستخدم',
            error: error.message 
        });
    }
});

// ========== 7.6. جلب صلاحيات صفحات المكاتب ==========
router.get('/office-page-access', verifySuperAdmin, async (req, res) => {
    try {
        const { office_id } = req.query;
        if (!office_id) {
            return res.status(400).json({ success: false, message: 'office_id مطلوب' });
        }

        await ensureOfficePageAccessTable();

        // تحسين البحث ليدعم ID, code, entity_id, أو اسم المكتب
        const officeResult = await pool.query(`
            SELECT id, name, code, entity_id
            FROM offices
            WHERE id::text = $1 
               OR UPPER(code) = UPPER($1)
               OR entity_id = $1
               OR UPPER(name) LIKE UPPER($1 || '%')
            LIMIT 1
        `, [office_id]);

        if (officeResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'المكتب غير موجود. تأكد من إدخال رقم المكتب (ID) أو كود المكتب (مثل: OFF-5657-FIN)' 
            });
        }

        const office = officeResult.rows[0];
        const pagesResult = await pool.query(`
            SELECT page_key
            FROM office_page_access
            WHERE office_id = $1
            ORDER BY page_key
        `, [office.id]);

        res.json({
            success: true,
            office: {
                id: office.id,
                name: office.name,
                code: office.code,
                entity_id: office.entity_id
            },
            pages: pagesResult.rows.map(row => row.page_key)
        });
    } catch (error) {
        console.error('خطأ في جلب صلاحيات صفحات المكتب:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب صلاحيات المكتب' });
    }
});

// ========== 7.7. حفظ صلاحيات صفحات المكاتب ==========
router.post('/office-page-access', verifySuperAdmin, async (req, res) => {
    let client;
    try {
        const { office_id, pages } = req.body;
        if (!office_id || !Array.isArray(pages)) {
            return res.status(400).json({ success: false, message: 'office_id و pages مطلوبين' });
        }

        client = await pool.connect();
        await ensureOfficePageAccessTable();

        const officeResult = await client.query(`
            SELECT id, name, code, entity_id
            FROM offices
            WHERE id::text = $1 OR code = $1 OR entity_id = $1
            LIMIT 1
        `, [office_id]);

        if (officeResult.rows.length === 0) {
            client.release();
            return res.status(404).json({ success: false, message: 'المكتب غير موجود' });
        }

        const office = officeResult.rows[0];
        const cleanPages = [...new Set(pages.filter(Boolean))];

        await client.query('BEGIN');
        await client.query('DELETE FROM office_page_access WHERE office_id = $1', [office.id]);

        for (const pageKey of cleanPages) {
            await client.query(`
                INSERT INTO office_page_access (office_id, page_key)
                VALUES ($1, $2)
                ON CONFLICT (office_id, page_key) DO NOTHING
            `, [office.id, pageKey]);
        }
        await client.query('COMMIT');

        try {
            await pool.query(`
                INSERT INTO audit_log (
                    entity_type, entity_reference_id, action_type,
                    user_name, description
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                'office_page_access',
                office.entity_id || office.id,
                'UPDATE',
                req.userId || req.headers['x-user-id'] || 'super-admin',
                JSON.stringify({ office_id: office.id, pages: cleanPages })
            ]);
        } catch (auditError) {
            console.log('⚠️  لم يتم تسجيل صلاحيات المكتب في audit log:', auditError.message);
        }

        res.json({
            success: true,
            message: 'تم حفظ صلاحيات صفحات المكتب بنجاح',
            office: {
                id: office.id,
                name: office.name,
                code: office.code,
                entity_id: office.entity_id
            },
            pages: cleanPages
        });
    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('خطأ في حفظ صلاحيات صفحات المكتب:', error);
        res.status(500).json({ success: false, message: 'خطأ في حفظ صلاحيات المكتب' });
    } finally {
        if (client) {
            client.release();
        }
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

        // التحقق من وجود المستخدم
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        // التحقق من وجود الدور والحصول على role_id
        const roleCheck = await pool.query('SELECT id, name, job_title_ar FROM roles WHERE name = $1', [role_code]);
        if (roleCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'الدور غير موجود' });
        }

        const roleId = roleCheck.rows[0].id;
        const roleName = roleCheck.rows[0].job_title_ar;

        // إلغاء تفعيل الأدوار القديمة
        await pool.query(`
            UPDATE user_roles 
            SET is_active = false 
            WHERE user_id = $1
        `, [userId]);

        // البحث عن سجل موجود لنفس user_id و role_id
        const existingRole = await pool.query(`
            SELECT id FROM user_roles 
            WHERE user_id = $1 AND role_id = $2 
            AND (entity_id IS NULL OR entity_id = '')
            LIMIT 1
        `, [userId, roleId]);

        let result;
        if (existingRole.rows.length > 0) {
            // تحديث السجل الموجود
            result = await pool.query(`
                UPDATE user_roles 
                SET is_active = true, granted_at = NOW()
                WHERE id = $1
                RETURNING *
            `, [existingRole.rows[0].id]);
        } else {
            // إنشاء سجل جديد
            result = await pool.query(`
                INSERT INTO user_roles (user_id, role_id, entity_id, is_active, granted_at)
                VALUES ($1, $2, NULL, true, NOW())
                RETURNING *
            `, [userId, roleId]);
        }

        // سجل في audit log (إذا كان الجدول موجوداً)
        try {
            await pool.query(`
                INSERT INTO audit_log (
                    entity_type, entity_reference_id, action_type, 
                    user_name, description
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                'user_roles',
                userId,
                'ASSIGN_ROLE',
                req.userId || req.headers['x-user-id'] || 'super-admin',
                JSON.stringify({ role_code, role_name: roleName, user_id: userId })
            ]);
        } catch (auditError) {
            console.log('⚠️  لم يتم تسجيل في audit log:', auditError.message);
        }

        res.json({
            success: true,
            message: `تم تعيين الدور "${roleName}" بنجاح`,
            user_role: result.rows[0]
        });
    } catch (error) {
        console.error('خطأ في تعيين الدور:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في تعيين الدور: ' + error.message 
        });
    }
});

// ========== 9. إلغاء دور من مستخدم ==========
router.delete('/users/:userId/role', verifySuperAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        // التحقق من وجود المستخدم
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        // إلغاء تفعيل جميع الأدوار
        const result = await pool.query(`
            UPDATE user_roles 
            SET is_active = false 
            WHERE user_id = $1
            RETURNING *
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'لا توجد أدوار مُعينة لهذا المستخدم' });
        }

        // سجل في audit log (إذا كان الجدول موجوداً)
        try {
            await pool.query(`
                INSERT INTO audit_log (
                    entity_type, entity_reference_id, action_type, 
                    user_name, description
                ) VALUES ($1, $2, $3, $4, $5)
            `, [
                'user_roles',
                userId,
                'REVOKE_ROLE',
                req.userId || req.headers['x-user-id'] || 'super-admin',
                JSON.stringify({ user_id: userId, revoked_count: result.rows.length })
            ]);
        } catch (auditError) {
            console.log('⚠️  لم يتم تسجيل في audit log:', auditError.message);
        }

        res.json({
            success: true,
            message: `تم إلغاء ${result.rows.length} دور بنجاح`
        });
    } catch (error) {
        console.error('خطأ في إلغاء الدور:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في إلغاء الدور: ' + error.message 
        });
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
