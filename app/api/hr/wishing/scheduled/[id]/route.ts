import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ScheduledEmail from '@/models/ScheduledEmail';

export const dynamic = 'force-dynamic';

// Delete a scheduled email
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as any)?.role;
    if (role !== 'hr' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const scheduledEmail = await ScheduledEmail.findById(params.id);

    if (!scheduledEmail) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Allow deletion of both scheduled and sent emails
    await ScheduledEmail.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, message: 'Email deleted' });
  } catch (error: any) {
    console.error('Error deleting scheduled email:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

