import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if ((session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all employees (excluding admin)
    const allEmployees = await User.find({
      role: { $ne: 'admin' },
      emailVerified: true,
      password: { $exists: true, $ne: null }
    })
      .select('_id name email profileImage designation')
      .lean();

    // Get all user IDs who have clocked in today
    const clockedInUserIds = await Attendance.distinct('userId', {
      clockIn: { $gte: today, $lt: tomorrow }
    });

    // Convert to string array for comparison
    const clockedInIds = clockedInUserIds.map(id => id.toString());

    // Filter employees who haven't clocked in today
    const notClockedIn = allEmployees
      .filter(emp => !clockedInIds.includes(emp._id.toString()))
      .map(emp => {
        // Ensure profileImage is included, even if it's null or undefined
        const profileImage = emp.profileImage && typeof emp.profileImage === 'string' && emp.profileImage.trim() !== '' 
          ? emp.profileImage 
          : null;
        
        return {
          _id: emp._id.toString(),
          name: emp.name || '',
          email: emp.email || '',
          profileImage: profileImage,
          designation: emp.designation || null,
        };
      });

    return NextResponse.json({
      employees: notClockedIn,
      count: notClockedIn.length,
    });
  } catch (error) {
    console.error('Error fetching not clocked in employees:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

