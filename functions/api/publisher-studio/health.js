export async function onRequestGet(context) {
  const db = context.env.PUBLISHER_STUDIO_DB;
  if (!db) {
    return Response.json({ ok: false, error: 'PUBLISHER_STUDIO_DB binding missing' }, { status: 500 });
  }

  try {
    const row = await db.prepare('SELECT 1 AS connected').first();
    const migration = await db.prepare(
      "SELECT version, applied_at FROM studio_schema_migrations ORDER BY applied_at DESC LIMIT 1"
    ).first();

    return Response.json({
      ok: row?.connected === 1,
      database: 'connected',
      migration: migration ?? null,
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    });
  } catch (error) {
    return Response.json({
      ok: false,
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error',
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
      },
    });
  }
}
