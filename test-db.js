const db = require('./db');

async function testDatabase() {
  console.log('🔄 جاري اختبار الاتصال بقاعدة البيانات...\n');

  try {
    // Test 1: Connection
    console.log('✅ اختبار 1: الاتصال بقاعدة البيانات');
    const timeResult = await db.query('SELECT NOW()');
    console.log('   ⏰ الوقت الحالي:', timeResult.rows[0].now);
    
    // Test 2: Check if tables exist
    console.log('\n✅ اختبار 2: التحقق من وجود الجداول');
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('   📊 الجداول الموجودة:');
    tablesResult.rows.forEach(row => {
      console.log(`      - ${row.table_name}`);
    });

    // Test 3: Count records
    console.log('\n✅ اختبار 3: عدد السجلات في كل جدول');
    
    const entities = await db.query('SELECT COUNT(*) FROM entities');
    console.log(`   - entities: ${entities.rows[0].count} سجل`);
    
    const users = await db.query('SELECT COUNT(*) FROM users');
    console.log(`   - users: ${users.rows[0].count} سجل`);
    
    const invoices = await db.query('SELECT COUNT(*) FROM invoices');
    console.log(`   - invoices: ${invoices.rows[0].count} سجل`);
    
    const transactions = await db.query('SELECT COUNT(*) FROM transactions');
    console.log(`   - transactions: ${transactions.rows[0].count} سجل`);
    
    const ledger = await db.query('SELECT COUNT(*) FROM ledger');
    console.log(`   - ledger: ${ledger.rows[0].count} سجل`);
    
    const ads = await db.query('SELECT COUNT(*) FROM ads');
    console.log(`   - ads: ${ads.rows[0].count} سجل`);

    // Test 4: Sample data queries
    console.log('\n✅ اختبار 4: استعلام بيانات نموذجية');
    
    const sampleEntity = await db.query('SELECT * FROM entities LIMIT 1');
    console.log('   📌 مثال على كيان:', sampleEntity.rows[0]?.name || 'لا يوجد');
    
    const sampleUser = await db.query('SELECT * FROM users LIMIT 1');
    console.log('   👤 مثال على مستخدم:', sampleUser.rows[0]?.name || 'لا يوجد');

    console.log('\n✅ جميع الاختبارات نجحت! قاعدة البيانات جاهزة للاستخدام 🎉\n');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    console.error(error);
  } finally {
    await db.pool.end();
    process.exit(0);
  }
}

testDatabase();
