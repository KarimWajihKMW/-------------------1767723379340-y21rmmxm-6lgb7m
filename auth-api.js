const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const crypto = require('crypto');

const router = express.Router();

const pool = new Pool({
    connectionString: 'postgresql://postgres:PddzJpAQYezqknsntSzmCUlQYuYJldcT@crossover.proxy.rlwy.net:44255/railway',
    ssl: { rejectUnauthorized: false }
});

// ============================================
// 1. تسجيل الدخول - POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
            });
        }
        
        // 1. جلب بيانات الاعتماد من خلال البريد الإلكتروني
        const credQuery = `
            SELECT uc.id as cred_id, uc.user_id, uc.password_hash, 
                   uc.is_active, uc.failed_attempts, uc.locked_until,
                   u.id, u.name, u.email, u.entity_id, u.entity_name,
                   u.role, u.tenant_type, u.is_active as user_active
            FROM user_credentials uc
            JOIN users u ON uc.user_id = u.id
            WHERE u.email = $1
        `;
        
        const credResult = await client.query(credQuery, [email]);
        
        if (credResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }
        
        const credential = credResult.rows[0];
        
        // 2. التحقق من الحساب مقفل
        if (credential.locked_until && new Date(credential.locked_until) > new Date()) {
            return res.status(403).json({
                success: false,
                message: 'الحساب مقفل مؤقتاً. يرجى المحاولة لاحقاً'
            });
        }
        
        // 3. التحقق من الحساب نشط
        if (!credential.is_active || !credential.user_active) {
            return res.status(403).json({
                success: false,
                message: 'الحساب غير نشط'
            });
        }
        
        // 4. التحقق من كلمة المرور
        const isPasswordValid = await bcrypt.compare(password, credential.password_hash);
        
        if (!isPasswordValid) {
            // زيادة عدد المحاولات الفاشلة
            const failedAttempts = credential.failed_attempts + 1;
            let lockQuery = '';
            
            if (failedAttempts >= 5) {
                // قفل الحساب لمدة 15 دقيقة
                const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                lockQuery = `, locked_until = $2`;
                await client.query(
                    `UPDATE user_credentials SET failed_attempts = $1 ${lockQuery} WHERE id = $3`,
                    [failedAttempts, lockUntil, credential.cred_id]
                );
                
                return res.status(403).json({
                    success: false,
                    message: 'تم قفل الحساب بسبب المحاولات الفاشلة المتكررة'
                });
            } else {
                await client.query(
                    'UPDATE user_credentials SET failed_attempts = $1 WHERE id = $2',
                    [failedAttempts, credential.cred_id]
                );
                
                return res.status(401).json({
                    success: false,
                    message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                });
            }
        }
        
        // 5. إعادة تعيين المحاولات الفاشلة وتحديث آخر دخول
        await client.query(
            'UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
            [credential.cred_id]
        );
        
        // 6. إنشاء session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة
        
        await client.query(`
            INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
            VALUES ($1, $2, $3, $4, $5)
        `, [
            credential.user_id,
            sessionToken,
            req.ip || req.connection.remoteAddress,
            req.headers['user-agent'],
            expiresAt
        ]);
        
        // 7. جلب صلاحيات المستخدم
        const rolesQuery = `
            SELECT r.id, r.name, r.name_ar, r.job_title_ar, r.hierarchy_level
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 AND ur.is_active = true
        `;
        const rolesResult = await client.query(rolesQuery, [credential.user_id]);
        
        // 8. جلب القائمة الجانبية للمستخدم
        const menuQuery = `
            SELECT id, title_ar, title_en, icon, url, display_order
            FROM sidebar_menu
            WHERE is_active = true
            AND (required_entity_id IS NULL OR required_entity_id = $1)
            ORDER BY display_order
        `;
        const menuResult = await client.query(menuQuery, [credential.entity_id]);
        
        // 9. إرسال الاستجابة
        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: {
                user: {
                    id: credential.user_id,
                    name: credential.name,
                    email: credential.email,
                    entity_id: credential.entity_id,
                    entity_name: credential.entity_name,
                    role: credential.role,
                    tenant_type: credential.tenant_type
                },
                roles: rolesResult.rows,
                menu: menuResult.rows.map(item => ({
                    id: item.id,
                    title: item.title_ar,
                    titleEn: item.title_en,
                    icon: item.icon,
                    url: item.url,
                    order: item.display_order
                })),
                session: {
                    token: sessionToken,
                    expires_at: expiresAt
                }
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تسجيل الدخول'
        });
    } finally {
        client.release();
    }
});

// ============================================
// 2. التحقق من الجلسة - GET /api/auth/verify
// ============================================
router.get('/verify', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'لم يتم توفير رمز الجلسة'
            });
        }
        
        // التحقق من الجلسة
        const sessionQuery = `
            SELECT s.user_id, s.expires_at,
                   u.name, u.email, u.entity_id, u.entity_name, u.role, u.tenant_type
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = $1 AND s.expires_at > NOW()
        `;
        
        const sessionResult = await client.query(sessionQuery, [token]);
        
        if (sessionResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'الجلسة غير صالحة أو منتهية'
            });
        }
        
        const session = sessionResult.rows[0];
        
        // تحديث آخر نشاط
        await client.query(
            'UPDATE user_sessions SET last_activity = NOW() WHERE session_token = $1',
            [token]
        );
        
        res.json({
            success: true,
            user: {
                id: session.user_id,
                name: session.name,
                email: session.email,
                entity_id: session.entity_id,
                entity_name: session.entity_name,
                role: session.role,
                tenant_type: session.tenant_type
            }
        });
        
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء التحقق من الجلسة'
        });
    } finally {
        client.release();
    }
});

// ============================================
// 3. تسجيل الخروج - POST /api/auth/logout
// ============================================
router.post('/logout', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'لم يتم توفير رمز الجلسة'
            });
        }
        
        // حذف الجلسة
        await client.query('DELETE FROM user_sessions WHERE session_token = $1', [token]);
        
        res.json({
            success: true,
            message: 'تم تسجيل الخروج بنجاح'
        });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تسجيل الخروج'
        });
    } finally {
        client.release();
    }
});

// ============================================
// 4. تغيير كلمة المرور - POST /api/auth/change-password
// ============================================
router.post('/change-password', async (req, res) => {
    const client = await pool.connect();
    
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const { old_password, new_password } = req.body;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح'
            });
        }
        
        if (!old_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال كلمة المرور القديمة والجديدة'
            });
        }
        
        // التحقق من الجلسة
        const sessionQuery = 'SELECT user_id FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()';
        const sessionResult = await client.query(sessionQuery, [token]);
        
        if (sessionResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'الجلسة غير صالحة'
            });
        }
        
        const userId = sessionResult.rows[0].user_id;
        
        // جلب كلمة المرور الحالية
        const credQuery = 'SELECT id, password_hash FROM user_credentials WHERE user_id = $1';
        const credResult = await client.query(credQuery, [userId]);
        
        if (credResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'بيانات الاعتماد غير موجودة'
            });
        }
        
        const credential = credResult.rows[0];
        
        // التحقق من كلمة المرور القديمة
        const isOldPasswordValid = await bcrypt.compare(old_password, credential.password_hash);
        
        if (!isOldPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'كلمة المرور القديمة غير صحيحة'
            });
        }
        
        // تشفير كلمة المرور الجديدة
        const hashedPassword = await bcrypt.hash(new_password, 10);
        
        // تحديث كلمة المرور
        await client.query(
            'UPDATE user_credentials SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, credential.id]
        );
        
        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تغيير كلمة المرور'
        });
    } finally {
        client.release();
    }
});

module.exports = router;
