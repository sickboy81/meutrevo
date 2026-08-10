import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireRole } from '@/lib/api-auth';
import { isAdminEmail } from '@/lib/admin';

export async function GET() {
  try {
    const { response } = await requireRole(['admin']);
    if (response) return response;

    // Query statistics
    const totalUsersQuery = await db.execute(
      'SELECT COUNT(*) as count FROM users'
    );
    const totalCount = Number(totalUsersQuery.rows[0].count);

    // List all users (excluding passwords)
    const usersQuery = await db.execute(
      'SELECT id, name, email, role, blocked, created_at FROM users ORDER BY created_at DESC'
    );
    const users = usersQuery.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: isAdminEmail(String(row.email)) ? 'admin' : row.role || 'free',
      blocked: row.blocked === true || Number(row.blocked || 0) === 1,
      created_at: row.created_at,
    }));
    const proCount = users.filter((user) => user.role === 'pro').length;
    const adminCount = users.filter((user) => user.role === 'admin').length;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalCount,
        proUsers: proCount,
        adminUsers: adminCount,
        freeUsers: totalCount - proCount - adminCount,
      },
      users,
    });
  } catch (err: unknown) {
    return internalServerError('Admin users error:', err);
  }
}
