/**
 * Broadcasts a Realtime event to a session channel via the Supabase
 * Realtime REST endpoint.
 */
export async function broadcastSessionEvent(
  sessionId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return;

  try {
    await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: `session:${sessionId}`,
            event,
            payload,
            private: false,
          },
        ],
      }),
    });
  } catch {
    // Broadcasts are best-effort — never fail the API call because of one.
  }
}
