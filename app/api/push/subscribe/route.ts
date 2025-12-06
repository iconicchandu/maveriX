import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// POST - Register a push subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      endpoint: subscription.endpoint,
    });

    if (existingSubscription) {
      // Update if it belongs to a different user
      if (existingSubscription.userId.toString() !== userId) {
        existingSubscription.userId = new mongoose.Types.ObjectId(userId);
        await existingSubscription.save();
      }
      return NextResponse.json({ message: 'Subscription updated' });
    }

    // Create new subscription
    const pushSubscription = new PushSubscription({
      userId: new mongoose.Types.ObjectId(userId),
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    await pushSubscription.save();

    return NextResponse.json({ message: 'Subscription registered successfully' });
  } catch (error: any) {
    console.error('Push subscription error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE - Unregister a push subscription
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = (session.user as any).id;

    // Delete subscription if it belongs to the user
    await PushSubscription.deleteOne({
      endpoint,
      userId: new mongoose.Types.ObjectId(userId),
    });

    return NextResponse.json({ message: 'Subscription unregistered successfully' });
  } catch (error: any) {
    console.error('Push unsubscription error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

