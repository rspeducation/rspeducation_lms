// File: supabase/functions/admin-set-password/index.ts
// Purpose: securely set the admin password via service role (run once; never from client)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Simple protection so only you can run this
    const AUTH = req.headers.get("x-setup-token");
    if (!AUTH || AUTH !== Deno.env.get("SETUP_TOKEN")) {
      return new Response("Unauthorized", { status: 401 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { email, password } = await req.json() as { email: string; password: string };
    if (!email || !password) return new Response("Missing email/password", { status: 400 });

    // Fetch user by email
    const { data: userData, error: getErr } = await admin.auth.admin.getUserByEmail(email);
    if (getErr) return new Response(getErr.message, { status: 400 });
    if (!userData?.user) return new Response("User not found", { status: 404 });

    // Set password
    const { error: updErr } = await admin.auth.admin.updateUserById(userData.user.id, { password });
    if (updErr) return new Response(updErr.message, { status: 400 });

    return new Response(JSON.stringify({ ok: true, id: userData.user.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
