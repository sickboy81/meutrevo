import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { internalServerError } from '../../../../lib/api-auth';
import { validateBody } from '../../../../lib/validate';
import { resetSchema } from '../../../../schemas/auth';

export async function POST(request: Request) {
  try {
    const validation = validateBody(
      resetSchema,
      await request.json().catch(() => ({}))
    );
    if (validation.error) return validation.error;
    const accessToken = request.headers
      .get('authorization')
      ?.replace(/^Bearer\s+/i, '');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!accessToken || !url || !key)
      return NextResponse.json(
        { error: 'Sessão de recuperação inválida' },
        { status: 401 }
      );
    const client = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { error } = await client.auth.updateUser({
      password: validation.data!.newPassword,
    });
    if (error)
      return NextResponse.json(
        { error: 'Link inválido ou expirado' },
        { status: 400 }
      );
    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso!',
    });
  } catch (error) {
    return internalServerError('Reset password error:', error);
  }
}
