const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:PddzJpAQYezqknsntSzmCUlQYuYJldcT@crossover.proxy.rlwy.net:44255/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkCurrentRoles() {
  try {
    console.log('🔍 فحص الأدوار الحالية في قاعدة البيانات...\n');

    // فحص هيكل جدول roles
    const structure = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'roles'
      ORDER BY ordinal_position
    `);

    console.log('📋 هيكل جدول roles:');
    structure.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
    });

    // عرض الأدوار الموجودة
    const roles = await pool.query(`
      SELECT id, name, description, created_at
      FROM roles
      ORDER BY name
    `);

    console.log(`\n📊 الأدوار الموجودة حالياً (${roles.rowCount}):`);
    roles.rows.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.name}`);
    });

    // التحقق من التكرارات
    const duplicates = await pool.query(`
      SELECT name, COUNT(*) as count
      FROM roles
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if (duplicates.rowCount > 0) {
      console.log(`\n⚠️ تكرارات موجودة (${duplicates.rowCount}):`);
      duplicates.rows.forEach(dup => {
        console.log(`   - ${dup.name}: ${dup.count} مرات`);
      });
    } else {
      console.log('\n✅ لا توجد تكرارات');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

checkCurrentRoles();
