import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { hashPassword } from '../../../../lib/auth-utils';
import { internalServerError } from '../../../../lib/api-auth';
import { validateBody } from '../../../../lib/validate';
import { resetSchema } from '../../../../schemas/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = validateBody(resetSchema, body);
    if (validation.error) return validation.error;

    const { token, newPassword } = validation.data!;

    // Buscar usuário com o token correspondente
    const res = await db.execute({
      sql: 'SELECT id, reset_token_expires FROM users WHERE reset_token = ? LIMIT 1',
      args: [token],
    });

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    const user = res.rows[0];
    const userId = user.id as string;
    const expiresStr = user.reset_token_expires as string;

    if (!expiresStr || new Date(expiresStr).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = hashPassword(newPassword);

    // Atualizar senha no banco de dados e limpar as colunas de recuperação
    await db.execute({
      sql: 'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      args: [hashedPassword, userId],
    });

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso!',
    });
  } catch (err: unknown) {
    return internalServerError('Reset password error:', err);
  }
}
