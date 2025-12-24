import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ScheduledEmail from '@/models/ScheduledEmail';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as any)?.role;
    if (role !== 'hr' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userIds, subject, html, schedule, scheduledFor } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No recipients selected' }, { status: 400 });
    }
    if (!subject || !html) {
      return NextResponse.json({ error: 'Subject and HTML body are required' }, { status: 400 });
    }

    await connectDB();

    // If scheduling, save to database
    if (schedule && scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
        return NextResponse.json({ error: 'Invalid scheduled date. Must be in the future.' }, { status: 400 });
      }

      const scheduledEmail = new ScheduledEmail({
        userIds,
        subject,
        html,
        scheduledFor: scheduledDate,
        createdBy: (session.user as any).id,
      });

      await scheduledEmail.save();

      return NextResponse.json({ 
        success: true, 
        scheduled: true, 
        scheduledFor: scheduledDate.toISOString(),
        message: 'Email scheduled successfully'
      });
    }

    // Send immediately
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return NextResponse.json(
        { error: 'SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.' },
        { status: 500 }
      );
    }

    const recipients = await User.find({ _id: { $in: userIds } })
      .select('email name')
      .lean();

    const validRecipients = recipients.filter((u: any) => u?.email);

    if (validRecipients.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses found.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Send personalized emails to each recipient
    const sendPromises = validRecipients.map(async (recipient: any) => {
      // Replace ${data.employeeName} with actual employee name
      const personalizedHtml = html.replace(/\$\{data\.employeeName\}/g, recipient.name || 'Employee');
      const personalizedSubject = subject.replace(/\$\{data\.employeeName\}/g, recipient.name || 'Employee');

      return transporter.sendMail({
        from: smtpFrom,
        to: recipient.email,
        subject: personalizedSubject,
        html: personalizedHtml,
      });
    });

    await Promise.all(sendPromises);

    // Save to email history
    const emailHistory = new ScheduledEmail({
      userIds,
      subject,
      html,
      sent: true,
      sentAt: new Date(),
      createdBy: (session.user as any).id,
    });

    await emailHistory.save();

    return NextResponse.json({ success: true, sent: validRecipients.length });
  } catch (error: any) {
    console.error('HR wishing send error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    // Get scheduled (unsent) emails
    const scheduledEmails = await ScheduledEmail.find({ sent: false })
      .populate('userIds', 'name email profileImage')
      .populate('createdBy', 'name email')
      .sort({ scheduledFor: 1 })
      .lean();

    // Get sent email history (last 50)
    const emailHistory = await ScheduledEmail.find({ sent: true })
      .populate('userIds', 'name email profileImage')
      .populate('createdBy', 'name email')
      .sort({ sentAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ scheduledEmails, emailHistory });
  } catch (error: any) {
    console.error('Error fetching scheduled emails:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

