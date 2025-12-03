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

    const setting = await Settings.findOne({ key: 'maxLateDays' });

    return NextResponse.json({
      maxLateDays: setting?.value !== undefined ? setting.value : 0,
    });
  } catch (error: any) {
    console.error('Error fetching max late days:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch max late days' },
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

    const { maxLateDays } = await request.json();

    // Validate maxLateDays
    if (maxLateDays === undefined || maxLateDays === null) {
      return NextResponse.json(
        { error: 'Max late days is required' },
        { status: 400 }
      );
    }

    const maxDays = parseInt(maxLateDays);
    if (isNaN(maxDays) || maxDays < 0) {
      return NextResponse.json(
        { error: 'Max late days must be a non-negative number' },
        { status: 400 }
      );
    }

    await connectDB();

    const setting = await Settings.findOneAndUpdate(
      { key: 'maxLateDays' },
      { value: maxDays },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Max late days updated successfully',
      maxLateDays: setting.value,
    });
  } catch (error: any) {
    console.error('Error updating max late days:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update max late days' },
      { status: 500 }
    );
  }
}

