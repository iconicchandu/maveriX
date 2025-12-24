# Scheduled Emails Setup Guide

Scheduled emails need to be processed by a server-side cron job to work even when the browser tab is closed.

## 🏠 Localhost Development

For **localhost development**, you have two options:

### Option A: Run with Background Service (Recommended)

Run both the Next.js server and the email cron service together:

```bash
npm run dev:with-cron
```

This will start:
- Next.js dev server on `http://localhost:3000`
- Email cron service in the background (processes emails every minute)

### Option B: Run Separately

1. Start Next.js dev server in one terminal:
   ```bash
   npm run dev
   ```

2. Start email cron service in another terminal:
   ```bash
   npm run cron
   ```

**Note:** The email cron service must be running for scheduled emails to be sent when the browser tab is closed.

## ☁️ Production: Vercel Cron (Recommended if using Vercel)

If you're deploying on Vercel, the `vercel.json` file is already configured. Vercel will automatically call the endpoint every minute.

**No additional setup needed!** Just deploy to Vercel and it will work automatically.

## 🌐 Production: External Cron Service

If you're not using Vercel, set up an external cron service to call the endpoint:

### Using EasyCron (Free tier available)
1. Go to https://www.easycron.com/
2. Create a free account
3. Add a new cron job:
   - **URL**: `https://your-domain.com/api/hr/wishing/scheduled`
   - **Schedule**: Every minute (`* * * * *`)
   - **Method**: GET
   - **Headers**: 
     - `Authorization: Bearer YOUR_CRON_SECRET`
   - (Only if you set CRON_SECRET in your .env)

### Using cron-job.org (Free)
1. Go to https://cron-job.org/
2. Create a free account
3. Add a new cron job:
   - **URL**: `https://your-domain.com/api/hr/wishing/scheduled`
   - **Schedule**: Every minute
   - **Method**: GET
   - **Headers**: Add `Authorization: Bearer YOUR_CRON_SECRET` if CRON_SECRET is set

### Using cPanel Cron Jobs (if you have cPanel)
1. Go to cPanel → Cron Jobs
2. Add a new cron job:
   - **Command**: `curl -X GET "https://your-domain.com/api/hr/wishing/scheduled" -H "Authorization: Bearer YOUR_CRON_SECRET"`
   - **Schedule**: `* * * * *` (every minute)

### Using Linux/Mac Cron (if you have server access)
Add to crontab:
```bash
* * * * * curl -X GET "https://your-domain.com/api/hr/wishing/scheduled" -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Security Note

If you set `CRON_SECRET` in your `.env.local` file, make sure to:
1. Use the same secret in your cron job configuration
2. Keep the secret secure and don't share it publicly

## Testing

You can test the endpoint manually by visiting:
```
https://your-domain.com/api/hr/wishing/scheduled
```

Or using curl:
```bash
curl -X GET "https://your-domain.com/api/hr/wishing/scheduled" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How It Works

1. When you schedule an email, it's saved to the database
2. The cron job calls the endpoint every minute
3. The endpoint checks for scheduled emails that are due
4. Due emails are sent automatically
5. The status is updated in the database

This ensures emails are sent even when no one has the page open!

