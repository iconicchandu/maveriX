import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export const dynamic = 'force-dynamic';

/**
 * DELETE endpoint to delete ALL attendance records
 * WARNING: This is a destructive operation that cannot be undone
 * Only accessible by admin users
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can delete all attendance records
    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    await connectDB();

    // Get count before deletion for reporting
    const countBefore = await Attendance.countDocuments();

    // Delete all attendance records
    const deleteResult = await Attendance.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all attendance records`,
      deletedCount: deleteResult.deletedCount,
      totalRecordsBefore: countBefore,
    });
  } catch (error: any) {
    console.error('Error deleting all attendance records:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete attendance records' },
      { status: 500 }
    );
  }
}

