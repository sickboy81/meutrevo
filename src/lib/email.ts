import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function sendResetPasswordEmail(
  toEmail: string,
  name: string,
  token: string
) {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  // Define application URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a24; background-color: #fafafa; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px; padding: 10px; background-color: #08080f; border-radius: 8px;">
        <span style="color: #00ff88; font-size: 24px; font-weight: bold; font-family: monospace;">Meu Trevo</span>
      </div>
      <p>Olá, <strong>${name}</strong>,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no Meu Trevo.</p>
      <p>Para prosseguir e escolher uma nova senha, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: linear-gradient(90deg, #00f0ff, #00e5ff); color: #000; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 240, 255, 0.25);">
          Redefinir Minha Senha
        </a>
      </div>
      <p style="font-size: 0.85rem; color: #718096; line-height: 1.5;">
        Este link de redefinição é válido por <strong>1 hora</strong>. Se você não solicitou esta alteração, pode ignorar este e-mail com segurança.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 0.8rem; color: #a0aec0; text-align: center;">
        Meu Trevo &copy; ${new Date().getFullYear()} - Resultados & Estatísticas Inteligentes de Loterias
      </p>
    </div>
  `;

  return resend.emails.send({
    from: from,
    to: toEmail,
    subject: 'Recuperação de Senha - Meu Trevo',
    html: html,
  });
}
