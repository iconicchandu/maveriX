import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET - Get pending employees (admin/hr only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    if (userRole !== 'admin' && userRole !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Get employees who have verified email and set password but are not approved
    // Show employees where approved is false, null, or undefined (but not true)
    const pendingEmployees = await User.find({
      role: { $ne: 'admin' },
      emailVerified: true,
      password: { $exists: true, $ne: null },
      $or: [
        { approved: false },
        { approved: { $exists: false } },
        { approved: null },
      ],
    })
      .select('_id name email role designation profileImage emailVerified createdAt approved')
      .sort({ createdAt: -1 })
      .lean();
    
    // Filter out any employees that are explicitly approved (safety check)
    const filtered = pendingEmployees.filter((user: any) => user.approved !== true);

    return NextResponse.json({ employees: filtered });
  } catch (error: any) {
    console.error('Get pending employees error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

