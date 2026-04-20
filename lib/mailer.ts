import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function emailWrapper(content: string) {
  const logo = process.env.CORP_LOGO_URL;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9f9f9;padding:32px 16px">
      <div style="max-width:520px;margin:auto;background:#fff;border-radius:16px;border:1px solid #e5e5e5;overflow:hidden">
        <div style="background:#0a0a0a;padding:20px 28px">
          ${logo ? `<img src="${logo}" alt="Corporus" style="height:28px;object-fit:contain" />` : `<span style="color:#fff;font-weight:700;font-size:16px">Corporus</span>`}
        </div>
        <div style="padding:28px">
          ${content}
        </div>
        <div style="padding:16px 28px;border-top:1px solid #e5e5e5;background:#f9f9f9">
          <p style="margin:0;font-size:11px;color:#b0b0b0">Corporus Software — Plateforme Admin Maysanté</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    html: emailWrapper(html),
  });
}
