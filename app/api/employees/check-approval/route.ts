import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'employee') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const user = await User.findById(userId).select('approved emailVerified password').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user has verified email and set password, check approval status
    // If approved is undefined/null, treat as approved (for existing employees)
    // Only return false if explicitly set to false
    const isApproved = user.approved === true || (user.approved !== false && user.emailVerified && user.password);

    return NextResponse.json({
      approved: isApproved,
    });
  } catch (error: any) {
    console.error('Check approval error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

