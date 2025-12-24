import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ScheduledEmail from '@/models/ScheduledEmail';
import User from '@/models/User';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// This endpoint processes and sends scheduled emails
// Can be called via POST (from client) or GET (from cron jobs)
// Should be called periodically (via cron job or scheduled task)
export async function GET(request: NextRequest) {
  // GET method for cron jobs and external services
  return await processScheduledEmails(request);
}

export async function POST(request: NextRequest) {
  // POST method for client-side calls
  return await processScheduledEmails(request);
}

async function processScheduledEmails(request: NextRequest) {
  try {
    // Check authentication - allow if:
    // 1. CRON_SECRET is not set (development)
    // 2. Authorization header matches CRON_SECRET
    // 3. Request comes from same origin (internal call from browser)
    // 4. Request is from Vercel Cron (has vercel-cron header)
    // 5. Request is from localhost (development script)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const vercelCron = request.headers.get('x-vercel-cron'); // Vercel Cron sends this header
    const origin = request.headers.get('origin') || request.headers.get('referer');
    const host = request.headers.get('host') || '';
    const isInternalCall = origin && (origin.includes('localhost') || origin.includes(process.env.NEXT_PUBLIC_BASE_URL || ''));
    const isVercelCron = vercelCron === '1'; // Vercel Cron sets this to '1'
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    // Allow if:
    // - It's a Vercel Cron request
    // - It's an internal call (same origin from browser)
    // - It's from localhost (development script)
    // - CRON_SECRET is not set (development)
    // - Authorization header matches CRON_SECRET
    if (cronSecret && !isInternalCall && !isVercelCron && !isLocalhost && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    
    // Find all unsent scheduled emails that are due
    const dueEmails = await ScheduledEmail.find({
      sent: false,
      scheduledFor: { $lte: now },
    })
      .populate('userIds', 'email name')
      .lean();

    if (dueEmails.length === 0) {
      return NextResponse.json({ message: 'No emails to send', processed: 0 });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return NextResponse.json(
        { error: 'SMTP configuration is missing' },
        { status: 500 }
      );
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

    let sentCount = 0;
    const errors: any[] = [];

    for (const scheduledEmail of dueEmails) {
      try {
        const recipients = (scheduledEmail.userIds as any[]).filter((u: any) => u?.email);
        
        if (recipients.length === 0) {
          // Mark as sent even if no recipients to avoid retrying
          await ScheduledEmail.findByIdAndUpdate(scheduledEmail._id, {
            sent: true,
            sentAt: now,
          });
          continue;
        }

        // Send personalized emails to each recipient
        const sendPromises = recipients.map(async (recipient: any) => {
          const personalizedHtml = scheduledEmail.html.replace(
            /\$\{data\.employeeName\}/g,
            recipient.name || 'Employee'
          );
          const personalizedSubject = scheduledEmail.subject.replace(
            /\$\{data\.employeeName\}/g,
            recipient.name || 'Employee'
          );

          return transporter.sendMail({
            from: smtpFrom,
            to: recipient.email,
            subject: personalizedSubject,
            html: personalizedHtml,
          });
        });

        await Promise.all(sendPromises);

        // Mark as sent
        await ScheduledEmail.findByIdAndUpdate(scheduledEmail._id, {
          sent: true,
          sentAt: now,
        });

        sentCount += recipients.length;
      } catch (error: any) {
        console.error(`Error sending scheduled email ${scheduledEmail._id}:`, error);
        errors.push({ id: scheduledEmail._id, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueEmails.length,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error processing scheduled emails:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

