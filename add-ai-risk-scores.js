const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:PddzJpAQYezqknsntSzmCUlQYuYJldcT@crossover.proxy.rlwy.net:44255/railway';
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const TARGETS = [
  {
    entityId: process.env.SEED_ENTITY_ID || 'HQ001',
    entityType: process.env.SEED_ENTITY_TYPE || 'HQ',
    records: [
      { customer_id: 1, score: 86, daysAgo: 2, factors: { late_payments: 3, exposure: 'credit', concentration_ratio: 0.32 }, details: { liquidity_ratio: 0.9, revenue_trend: 'down', volatility: 'high' }, recommendations: 'راجع حدود الائتمان وخفّض السقوف للعملاء مرتفعي المخاطر.', actions: ['تفعيل إنذار تأخر سداد', 'طلب ضمان إضافي'], model_version: 'v1.2.0' },
      { customer_id: 3, score: 64, daysAgo: 5, factors: { churn_risk: 'medium', sector: 'retail', dispute_tickets: 1 }, details: { on_time_payments: 88, dispute_ratio: 0.02 }, recommendations: 'تابع سلوك السداد خلال الشهر القادم مع وضع مراقبة متوسطة.', actions: ['متابعة أسبوعية', 'تذكير آلي قبل الاستحقاق'], model_version: 'v1.2.0' },
      { customer_id: 4, score: 42, daysAgo: 9, factors: { payment_behavior: 'stable', contract_tenure_months: 18 }, details: { mrr_growth: 0.12, tickets_open: 0 }, recommendations: 'الحفاظ على نفس حدود الائتمان مع متابعة ربع سنوية.', actions: ['تقرير ربع سنوي'], model_version: 'v1.2.0' },
      { customer_id: 5, score: 78, daysAgo: 13, factors: { exposure: 'fx', hedging: 'partial', geo_score: 0.72 }, details: { fx_buffer_days: 18, coverage_ratio: 0.7 }, recommendations: 'أكمل التحوط بنسبة أعلى لحماية الهامش.', actions: ['زيادة نسبة التحوط إلى 90%'], model_version: 'v1.2.0' },
      { customer_id: 6, score: 91, daysAgo: 17, factors: { overdue_invoices: 4, dispute_tickets: 2 }, details: { avg_delay_days: 19, credit_limit_utilization: 0.95 }, recommendations: 'أوقف طلبات جديدة حتى يتم تسوية المتأخرات.', actions: ['إيقاف أوامر الشحن', 'تسوية فورية للمتأخرات'], model_version: 'v1.2.0' },
      { customer_id: 7, score: 58, daysAgo: 20, factors: { supplier_dependency: 0.6, diversification: 'medium' }, details: { alt_suppliers: 3, fulfilment_stability: 0.8 }, recommendations: 'خطط لمورّد بديل لتقليل التركّز.', actions: ['تأهيل مورّد إضافي'], model_version: 'v1.2.0' },
      { customer_id: 8, score: 33, daysAgo: 25, factors: { cash_reserves_months: 4, burn_rate: 'healthy' }, details: { liquidity_ratio: 1.4, collection_speed_days: 22 }, recommendations: 'لا توجد إجراءات حرجة حالياً.', actions: ['استمرار المراقبة الشهرية'], model_version: 'v1.2.0' },
      { customer_id: 9, score: 74, daysAgo: 28, factors: { contract_type: 'project', delivery_milestones: 'tight' }, details: { milestone_slippage_days: 6, cost_variance: 0.08 }, recommendations: 'أعد ضبط الجدول الزمني مع العميل لتفادي الغرامات.', actions: ['اجتماع مع العميل', 'إعادة ترتيب الموارد'], model_version: 'v1.2.0' },
      { customer_id: 10, score: 82, daysAgo: 32, factors: { segment: 'enterprise', avg_ticket: 95000 }, details: { renewal_probability: 0.76, nps: 42 }, recommendations: 'تأمين عقد خدمة ممتد لخفض المخاطر.', actions: ['عرض عقد دعم ممتد'], model_version: 'v1.2.0' },
      { customer_id: 11, score: 67, daysAgo: 37, factors: { ops_incidents_last90d: 1, uptime: 99.1 }, details: { incident_severity: 'low', recovery_time: 22 }, recommendations: 'عزز خطط الاسترداد لتحسين الوقت.', actions: ['اختبار خطة الطوارئ'], model_version: 'v1.2.0' },
      { customer_id: 3, score: 49, daysAgo: 41, factors: { margin_pressure: 0.14, discounting: 'low' }, details: { gross_margin: 0.37, net_retention: 1.05 }, recommendations: 'تابع الأداء المالي مع عدم تغيير الضوابط الحالية.', actions: ['مراجعة شهرية للهامش'], model_version: 'v1.2.0' },
      { customer_id: 4, score: 88, daysAgo: 45, factors: { overdue_invoices: 2, region_risk: 'elevated' }, details: { avg_delay_days: 12, fx_exposure: 0.33 }, recommendations: 'أعد تقييم شروط الدفع وربطها بالتحويل المسبق.', actions: ['تغيير شروط الدفع إلى 50% مقدّم'], model_version: 'v1.2.0' },
      { customer_id: 5, score: 71, daysAgo: 51, factors: { churn_risk: 'medium', dependency_ratio: 0.41 }, details: { support_tickets_last30d: 4, satisfaction: 0.79 }, recommendations: 'حافظ على تواصل استباقي لتقليل احتمالية الانسحاب.', actions: ['جلسة نجاح ربع سنوية'], model_version: 'v1.2.0' },
      { customer_id: 6, score: 55, daysAgo: 57, factors: { audit_findings: 1, compliance: 'partial' }, details: { remediation_progress: 0.6, next_audit_days: 40 }, recommendations: 'أغلق ملاحظات التدقيق قبل الموعد القادم.', actions: ['خطة إغلاق خلال أسبوعين'], model_version: 'v1.2.0' },
      { customer_id: 7, score: 95, daysAgo: 62, factors: { fraud_signals: 2, device_risk: 'high' }, details: { velocity_alerts: 3, geo_mismatch: true }, recommendations: 'إيقاف الحساب مؤقتاً ومراجعة استخدام غير اعتيادي.', actions: ['تجميد المعاملات', 'التحقيق في النشاط'], model_version: 'v1.2.0' }
    ]
  }
];

function resolveLevel(score) {
  if (score >= 80) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

function buildDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function seedRiskScores() {
  for (const target of TARGETS) {
    const { entityId, entityType, records } = target;
    console.log(`\n🛡️ Seeding AI risk scores for ${entityId} (${entityType})...`);

    const existing = await pool.query('SELECT COUNT(*) FROM finance_ai_risk_scores WHERE entity_id = $1', [entityId]);
    const existingCount = Number(existing.rows[0].count || 0);

    if (existingCount > 0) {
      console.log(`   • Removing ${existingCount} existing rows for ${entityId} to reseed clean data...`);
      await pool.query('DELETE FROM finance_ai_risk_scores WHERE entity_id = $1', [entityId]);
    }

    let inserted = 0;

    for (const rec of records) {
      const assessmentDate = buildDate(rec.daysAgo || 0);
      const riskLevel = rec.risk_level || resolveLevel(rec.score);

      await pool.query(
        `INSERT INTO finance_ai_risk_scores (
          customer_id,
          assessment_date,
          risk_score,
          risk_level,
          risk_factors,
          calculation_details,
          recommendations,
          suggested_actions,
          entity_type,
          entity_id,
          model_version,
          created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
        [
          rec.customer_id,
          assessmentDate,
          rec.score,
          riskLevel,
          JSON.stringify(rec.factors || {}),
          JSON.stringify(rec.details || {}),
          rec.recommendations,
          JSON.stringify(rec.actions || []),
          entityType,
          entityId,
          rec.model_version || 'v1.0.0'
        ]
      );

      inserted += 1;
    }

    const finalCount = await pool.query('SELECT COUNT(*) FROM finance_ai_risk_scores WHERE entity_id = $1', [entityId]);
    console.log(`   ✅ Inserted ${inserted} rows. Total now: ${finalCount.rows[0].count}`);
  }
}

seedRiskScores()
  .then(() => {
    console.log('\n🎉 AI risk score dataset ready.');
    return pool.end();
  })
  .catch(async (err) => {
    console.error('❌ Error seeding AI risk scores:', err);
    await pool.end();
    process.exit(1);
  });
