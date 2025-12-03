import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const setting = await Settings.findOne({ key: 'defaultClockInTimeLimit' });

    return NextResponse.json({
      defaultClockInTimeLimit: setting?.value || null,
    });
  } catch (error: any) {
    console.error('Error fetching default clock-in time limit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch default clock-in time limit' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || ((session.user as any).role !== 'admin' && (session.user as any).role !== 'hr')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeLimit } = await request.json();

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeLimit || !timeRegex.test(timeLimit)) {
      return NextResponse.json(
        { error: 'Invalid time format. Please use HH:mm format (e.g., 09:30)' },
        { status: 400 }
      );
    }

    await connectDB();

    const setting = await Settings.findOneAndUpdate(
      { key: 'defaultClockInTimeLimit' },
      { value: timeLimit },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Default clock-in time limit updated successfully',
      defaultClockInTimeLimit: setting.value,
    });
  } catch (error: any) {
    console.error('Error updating default clock-in time limit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update default clock-in time limit' },
      { status: 500 }
    );
  }
}

