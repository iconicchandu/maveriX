import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Feed from '@/models/Feed';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = (session.user as any).id;
    const feed = await Feed.findById(params.id);

    if (!feed) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Only allow users to delete their own posts (or admin/hr can delete any)
    const role = (session.user as any).role;
    if (feed.userId.toString() !== userId && role !== 'admin' && role !== 'hr') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await Feed.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete feed error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

