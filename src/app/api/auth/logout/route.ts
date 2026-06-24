import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Limpar cookie de sessão
  response.cookies.delete('token');

  return response;
}
