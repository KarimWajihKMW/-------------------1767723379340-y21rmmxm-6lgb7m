const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:PddzJpAQYezqknsntSzmCUlQYuYJldcT@crossover.proxy.rlwy.net:44255/railway'
});

async function checkColumns() {
    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check entities table structure
        const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'entities'
            ORDER BY ordinal_position;
        `;
        
        const result = await client.query(columnsQuery);
        console.log('\n📋 Entities Table Columns:');
        console.log('==========================');
        result.rows.forEach(col => {
            console.log(`${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
        });

        // Sample data to see what we have
        const sampleQuery = `SELECT * FROM entities LIMIT 5`;
        const sampleResult = await client.query(sampleQuery);
        console.log('\n📊 Sample Data:');
        console.log('==========================');
        console.log(sampleResult.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkColumns();
