import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.database_url!);

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, role, parts
      FROM messages
      ORDER BY created_at ASC;
    `;

    const data = rows.map((row) => ({
      id: row.id,
      role: row.role,
      parts: typeof row.parts === "string" ? JSON.parse(row.parts) : row.parts,
    }));

    return Response.json(data, { status: 200 });
  } catch (err) {
    console.error("GET /messages error:", err);
    return Response.json({ error: "DB fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // shape: { id, role, parts, conversation_id }

    await sql`
      INSERT INTO messages (id, role, parts, conversation_id)
      VALUES (
        ${body.id},
        ${body.role},
        ${JSON.stringify(body.parts)}::jsonb,
        ${body.conversation_id}
      )
      ON CONFLICT (id) DO UPDATE
      SET
        role = EXCLUDED.role,
        parts = EXCLUDED.parts,
        conversation_id = EXCLUDED.conversation_id;
    `;

    return Response.json({ success: true });
  } catch (err) {
    console.error("POST /messages error:", err);
    return Response.json({ error: "Insert/update failed" }, { status: 500 });
  }
}

