import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// POST - Approve an employee (admin/hr only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    if (userRole !== 'admin' && userRole !== 'hr') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employeeId = params.id;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    await connectDB();

    const employee = await User.findById(employeeId);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (employee.role === 'admin') {
      return NextResponse.json({ error: 'Cannot approve admin users' }, { status: 400 });
    }

    // Check if employee has verified email and set password
    if (!employee.emailVerified) {
      return NextResponse.json({ error: 'Employee email not verified' }, { status: 400 });
    }

    if (!employee.password) {
      return NextResponse.json({ error: 'Employee password not set' }, { status: 400 });
    }

    employee.approved = true;
    await employee.save();

    return NextResponse.json({
      message: 'Employee approved successfully',
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        approved: employee.approved,
      },
    });
  } catch (error: any) {
    console.error('Approve employee error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

