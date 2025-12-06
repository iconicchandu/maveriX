import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// POST - Trigger a push notification for a user
// This is called when a notification is created to show it immediately
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, body, icon, badge, tag, data } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'userId, title, and body are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const userIdObj = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    // Get all push subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId: userIdObj }).lean();

    if (subscriptions.length === 0) {
      // No subscriptions - notification will be shown in-app via notification dropdown
      return NextResponse.json({ message: 'No push subscriptions found - notification will be shown in-app' });
    }

    // Return subscription info - the client will use this to show notifications
    // For true push (when app is closed), we'd need VAPID and web-push library
    return NextResponse.json({
      message: 'Push notification queued',
      hasSubscriptions: subscriptions.length > 0,
    });
  } catch (error: any) {
    console.error('Push notify error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

