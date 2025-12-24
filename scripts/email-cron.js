/**
 * Background service for processing scheduled emails on localhost
 * This script runs alongside the Next.js dev server and processes scheduled emails every minute
 * 
 * Usage: node scripts/email-cron.js
 * Or run: npm run dev:with-cron (which runs both Next.js and this script)
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;
const ENDPOINT = `${BASE_URL}/api/hr/wishing/scheduled`;

console.log('📧 Email Cron Service Started');
console.log(`📍 Endpoint: ${ENDPOINT}`);
console.log(`⏰ Checking every 60 seconds...`);
console.log('');

let isProcessing = false;

async function processScheduledEmails() {
  // Prevent overlapping executions
  if (isProcessing) {
    console.log('⏳ Previous process still running, skipping...');
    return;
  }

  isProcessing = true;
  const startTime = new Date().toISOString();

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if CRON_SECRET is set
    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`;
    }

    const response = await fetch(ENDPOINT, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (response.ok) {
      if (data.processed > 0) {
        console.log(`✅ [${startTime}] Processed ${data.processed} email(s), sent ${data.sent || 0} message(s)`);
        if (data.errors && data.errors.length > 0) {
          console.log(`⚠️  Errors: ${JSON.stringify(data.errors)}`);
        }
      } else {
        // Only log when there are emails to process to reduce noise
        // Uncomment the line below if you want to see all checks
        // console.log(`ℹ️  [${startTime}] No emails to send`);
      }
    } else {
      console.error(`❌ [${startTime}] Error: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`❌ [${startTime}] Failed to process: ${error.message}`);
  } finally {
    isProcessing = false;
  }
}

// Process immediately on start
processScheduledEmails();

// Then process every minute (60000ms)
const interval = setInterval(processScheduledEmails, 60000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Email Cron Service...');
  clearInterval(interval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Email Cron Service...');
  clearInterval(interval);
  process.exit(0);
});

