// Reservations are durable before the paid call. Never retry an uncertain charge.
// The short global lock protects quotas across instances; no network I/O under it.
class VoiceStore {
  constructor(pool, blobs, limits) { this.pool = pool; this.blobs = blobs; this.limits = limits; }
  async reserve(key, owner, cost, now = new Date()) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '1500ms'");
      await client.query('SELECT pg_advisory_xact_lock(73120481)');
      const old = await client.query('SELECT state FROM ps_voice_jobs WHERE cache_key=$1', [key]);
      if (old.rows.length) { await client.query('COMMIT'); return old.rows[0].state; }
      const day=now.toISOString().slice(0,10), month=day.slice(0,7);
      const buckets = [
        ['total',1,this.limits.total], ['global-day:'+day,cost,this.limits.dailyCharacters],
        ['global-month:'+month,cost,this.limits.monthlyCharacters],
        ['user-day:'+owner+':'+day,1,this.limits.userDaily], ['user-month:'+owner+':'+month,1,this.limits.userMonthly]
      ];
      for (const [bucket,increment,limit] of buckets) {
        const row=await client.query('SELECT used FROM ps_voice_budgets WHERE bucket=$1',[bucket]);
        if ((row.rows[0]?.used || 0)+increment>limit) { await client.query('ROLLBACK'); return 'quota'; }
      }
      for (const [bucket,increment] of buckets) await client.query(
        'INSERT INTO ps_voice_budgets(bucket,used) VALUES($1,$2) ON CONFLICT(bucket) DO UPDATE SET used=ps_voice_budgets.used+EXCLUDED.used',[bucket,increment]);
      await client.query("INSERT INTO ps_voice_jobs(cache_key,owner_hash,state) VALUES($1,$2,'reserved')",[key,owner]);
      await client.query('COMMIT'); return 'new';
    } catch (e) { await client.query('ROLLBACK').catch(()=>{}); throw e; }
    finally { client.release(); }
  }
  async get(key) { const data=await this.blobs.get(key,{type:'arrayBuffer'}); return data ? Buffer.from(data) : null; }
  async save(key, data) {
    await this.blobs.set(key,data);
    await this.pool.query("UPDATE ps_voice_jobs SET state='ready' WHERE cache_key=$1 AND state='reserved'",[key]);
  }
  async fail(key) { await this.pool.query("UPDATE ps_voice_jobs SET state='failed' WHERE cache_key=$1 AND state='reserved'",[key]); }
}
module.exports={VoiceStore};
