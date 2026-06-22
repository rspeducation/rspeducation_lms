// supabase/functions/send-welcome/index.ts
// Deno Edge Function to send welcome emails via Resend
// import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Payload = {
  to: string;
  name: string;
  email: string;
  studentCode: string;   // 8-char Student ID (password)
  loginUrl: string;      // e.g., https://your-site.netlify.app/login
  zoomLink?: string;
  extraInfo?: string;
};

async function sendWithResend(p: Payload) {
//   const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;padding:16px">
      <h2 style="margin:0 0 12px">Welcome to AzureRaju</h2>
      <p>Hi ${p.name}, your student portal account is ready.</p>
      <h3 style="margin:16px 0 8px">Login details</h3>
      <ul>
        <li><strong>Email:</strong> ${p.email}</li>
        <li><strong>Password (Student ID):</strong> ${p.studentCode}</li>
      </ul>
      <p>
        <a href="${p.loginUrl}" target="_blank"
           style="display:inline-block;background:#2563eb;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">
          Sign in
        </a>
      </p>
      ${p.zoomLink ? `<p><strong>Zoom:</strong> <a href="${p.zoomLink}" target="_blank">${p.zoomLink}</a></p>` : ``}
      ${p.extraInfo ? `<p>${p.extraInfo}</p>` : ``}
      <p style="margin-top:16px;color:#555">Tip: Change your password after first login.</p>
    </div>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "rspteam4@gmail.com",      // SENDER: verify this address in your provider
      reply_to: "rspteam4@gmail.com",  // Optional: allow replies
      to: [p.to],
      subject: "Your AzureRaju student login",
      html,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Resend error: ${resp.status} ${errText}`);
  }
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
    const payload = (await req.json()) as Payload;

    if (!payload?.to || !payload?.email || !payload?.studentCode || !payload?.loginUrl) {
      return new Response("Missing fields", { status: 400 });
    }

    await sendWithResend(payload);
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
