import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Gets the formatted "from" email address with optional display name
 * Reads FROM_NAME and FROM_EMAIL from environment variables
 * @returns Formatted email string like "Display Name <email@example.com>" or just "email@example.com"
 */
function getFromEmail(): string {
  const fromEmail = process.env.FROM_EMAIL || '';
  const fromName = process.env.FROM_NAME;

  if (fromName && fromName.trim()) {
    return `${fromName.trim()} <${fromEmail}>`;
  }

  return fromEmail;
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`;

  const mailOptions = {
    from: getFromEmail(),
    to: email,
    subject: 'Verify Your Email - MM HRM',
    html: `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
    <!-- Fallback to system fonts for broad email client support -->
</head>
<body style="font-family: 'Trebuchet MS', Arial, sans-serif; line-height: 1.6; color: #202124; max-width: 600px; margin: 0 auto; padding: 0; ">

    <!-- Outer Container/Spacer -->
    <div style="padding: 10px 0 0 0;">
        
        <!-- Email Content Card Container -->
        <div style="border-radius: 12px; overflow: hidden; background: #ffffff; max-width: 500px; margin: 0 auto; border: 1px solid #e8e8e8;">

            <!-- Header Section (Logo/Brand) -->
            <div style="background-color: #ffffff; padding: 30px 40px 20px; text-align: center;">
                <!-- Logo/Brand Text - Enhanced with more space -->
                <img src="https://image.s7.sfmc-content.com/lib/fe2a11717d640474741277/m/1/7698e693-e9b1-4d90-8eab-2403bd4d6d8c.png" width="120px" alt="MaveriX Logo" style="display: block; margin: 0 auto;">
            </div>

            <!-- Main Body Content Section -->
            <div style="padding: 0 40px 40px 40px; background: #ffffff; text-align: center;">
                
                <!-- Primary Heading -->
                <h1 style="color: #202124; margin-top: 0; font-size: 28px; font-weight: 700; margin-bottom: 15px;">You're Almost There!</h1>
                
                <!-- Subheading/Email Indicator -->
                <p style="font-size: 16px; color: #5f6368; margin-bottom: 30px;">
                    We just need to confirm your email address.
                </p>

                <!-- Horizontal Divider (Aesthetic separation) -->
                <div style="border-top: 1px solid #f0f0f0; margin-bottom: 30px;"></div>

                <!-- Main Content Paragraphs -->
                <p style="margin-bottom: 25px; font-size: 16px; color: #5f6368; text-align: left;">
                    Thank you for joining the <b>MaveriX</b>! Click the secure button below to verify your email address and finalize your account setup.
                </p>
                <p style="margin-bottom: 40px; font-size: 16px; color: #5f6368; text-align: left;">
                
                <!-- Call to Action Button (Vibrant Blue, Soft Shadow) -->
                <div style="text-align: center; margin: 10px 0;">
                    <a href="${verificationUrl}" 
                        style="background-color: #1a73e8; 
                                color: white; 
                                padding: 14px 30px; 
                                text-decoration: none; 
                                border-radius: 8px; 
                                display: inline-block; 
                                font-weight: 600; 
                                font-size: 17px; 
                                text-transform: none;
                                box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4); 
                                border: none;">
                        Verify My Email Address
                    </a>
                </div>

            </div>
            
            <!-- Footer Section (Smaller, Lighter Text, Full Width Gray) -->
            <div style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e8e8e8;">
                <img src="https://image.s7.sfmc-content.com/lib/fe2a11717d640474741277/m/1/7698e693-e9b1-4d90-8eab-2403bd4d6d8c.png" width="50px" alt="MaveriX Logo" style="display: block; margin: 0 auto;">
                <p style="margin-top: 5px; margin-bottom: 0;">&copy; All Rights Reserved. Made with ❤️ by <b>Chandu</b></p>
            </div>

        </div> <!-- End Email Content Card -->
        
    </div> <!-- End Outer Container/Spacer -->

</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: getFromEmail(),
    to: email,
    subject: 'Reset Your Password - MM HRM',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">MM HRM</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p>You requested to reset your password. Click the button below to set a new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour.</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

