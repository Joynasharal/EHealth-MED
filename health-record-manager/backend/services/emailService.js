const nodemailer = require('nodemailer');

// ─── Create transporter ───────────────────────────────────────────────────────
const createTransporter = () => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    console.warn('⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASS in .env');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─── Send password reset OTP ──────────────────────────────────────────────────
const sendPasswordResetOTP = async (toEmail, otp, fullName) => {
  const transporter = createTransporter();

  // Dev fallback: log OTP to console if email not configured
  if (!transporter) {
    console.log(`\n📧 [DEV MODE] Password reset OTP for ${toEmail}: ${otp}\n`);
    return { success: true, devMode: true };
  }

  const mailOptions = {
    from: `"Health Record Manager" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset OTP — Health Record Manager',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
                  <div style="width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                    <span style="font-size:24px;">🏥</span>
                  </div>
                  <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Health Record Manager</h1>
                  <p style="color:rgba(255,255,255,.75);margin:6px 0 0;font-size:14px;">Password Reset Request</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="color:#0f172a;font-size:16px;margin:0 0 8px;">Hi ${fullName || 'there'},</p>
                  <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px;">
                    We received a request to reset your password. Use the OTP below to proceed.
                    This code expires in <strong>10 minutes</strong>.
                  </p>

                  <!-- OTP Box -->
                  <div style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                    <p style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Your OTP Code</p>
                    <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#1d4ed8;font-family:'Courier New',monospace;">${otp}</div>
                    <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;">Valid for 10 minutes only</p>
                  </div>

                  <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;">
                    If you didn't request a password reset, you can safely ignore this email.
                    Your password will not be changed.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
                  <p style="color:#94a3b8;font-size:12px;margin:0;">
                    Health Record Manager · Secure Medical Records Platform
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { success: true, devMode: false };
};

module.exports = { sendPasswordResetOTP };
