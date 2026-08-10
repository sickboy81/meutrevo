import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderEmail(params: {
  name: string;
  title: string;
  content: string;
  preheader: string;
}) {
  const name = escapeHtml(params.name);
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(params.title)}</title>
  </head>
  <body style="margin:0;background:#07080f;color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(params.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07080f;">
      <tr><td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#10121c;border:1px solid #263042;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:26px 32px;background:linear-gradient(135deg,#111827,#171128);border-bottom:1px solid #263042;">
            <div style="font-size:24px;font-weight:800;letter-spacing:.2px;color:#22d3ee;">Meu <span style="color:#c084fc;">Trevo</span></div>
            <div style="margin-top:6px;color:#94a3b8;font-size:12px;letter-spacing:1.2px;text-transform:uppercase;">Resultados + estratégia</div>
          </td></tr>
          <tr><td style="padding:34px 32px 28px;">
            <p style="margin:0 0 10px;color:#94a3b8;font-size:14px;">Olá, <strong style="color:#f8fafc;">${name}</strong>.</p>
            <h1 style="margin:0 0 18px;color:#f8fafc;font-size:26px;line-height:1.25;">${escapeHtml(params.title)}</h1>
            <div style="color:#cbd5e1;font-size:16px;line-height:1.65;">${params.content}</div>
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #263042;color:#64748b;font-size:12px;line-height:1.6;">
            Você recebeu este e-mail porque possui uma conta no Meu Trevo.<br />
            © ${year} Meu Trevo. Todos os direitos reservados.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendResetPasswordEmail(
  toEmail: string,
  name: string,
  token: string
) {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const button = `<p style="margin:28px 0;text-align:center;"><a href="${resetUrl}" style="display:inline-block;background:#22d3ee;color:#071018;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;">Redefinir minha senha</a></p>`;
  const fallback = `<p style="font-size:13px;color:#94a3b8;word-break:break-all;">Se o botão não abrir, use este link:<br /><a href="${resetUrl}" style="color:#67e8f9;">${resetUrl}</a></p>`;

  return resend.emails.send({
    from,
    to: toEmail,
    subject: 'Redefinição de senha | Meu Trevo',
    html: renderEmail({
      name,
      title: 'Redefina sua senha',
      preheader: 'Use este link para criar uma nova senha no Meu Trevo.',
      content: `<p>Recebemos uma solicitação para alterar a senha da sua conta.</p>${button}<p style="font-size:13px;color:#94a3b8;">Este link é válido por 1 hora. Se você não fez esta solicitação, ignore este e-mail.</p>${fallback}`,
    }),
  });
}

export async function sendCustomEmail(
  toEmail: string,
  subject: string,
  name: string,
  messageHtml: string
) {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  return resend.emails.send({
    from,
    to: toEmail,
    subject,
    html: renderEmail({
      name,
      title: subject,
      preheader: subject,
      content: messageHtml,
    }),
  });
}
