import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Trigger a browser notification for the current user
// This endpoint is called when a notification is created to immediately show it
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, notificationId, title, body, type, leaveId, feedId } = await request.json();

    if (!userId || !notificationId || !title || !body) {
      return NextResponse.json(
        { error: 'userId, notificationId, title, and body are required' },
        { status: 400 }
      );
    }

    const currentUserId = (session.user as any).id;

    // Only trigger notification if it's for the current user
    if (userId !== currentUserId) {
      return NextResponse.json({ message: 'Notification not for current user' });
    }

    // Determine URL based on notification type
    let url = '/';
    if (type === 'mention') {
      url = '/employee/feed';
    } else if (type === 'leave_approved' || type === 'leave_rejected') {
      url = '/employee/leaves';
    } else if (type === 'leave_request') {
      url = '/hr/leave-request';
    }

    // Return notification data - the client will show it
    return NextResponse.json({
      success: true,
      notification: {
        id: notificationId,
        title,
        body,
        type,
        url,
        leaveId,
        feedId,
      },
    });
  } catch (error: any) {
    console.error('Push trigger error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

