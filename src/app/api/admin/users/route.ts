import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { internalServerError, requireRole } from '@/lib/api-auth';

export async function GET() {
  try {
    const { response } = await requireRole(['admin']);
    if (response) return response;

    // Query statistics
    const totalUsersQuery = await db.execute(
      'SELECT COUNT(*) as count FROM users'
    );
    const proUsersQuery = await db.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'pro'"
    );
    const adminUsersQuery = await db.execute(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
    );

    const totalCount = Number(totalUsersQuery.rows[0].count);
    const proCount = Number(proUsersQuery.rows[0].count);
    const adminCount = Number(adminUsersQuery.rows[0].count);

    // List all users (excluding passwords)
    const usersQuery = await db.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    const users = usersQuery.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role || 'free',
      created_at: row.created_at,
    }));

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
