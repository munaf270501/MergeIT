import crypto from 'crypto';
import nodemailer from 'nodemailer';

const PLANS = {
  '2h': {
    id: '2h',
    name: '2-Hour Interview Pass',
    priceDisplay: '₹49',
    duration: '2 Full Hours (120 Minutes)',
    prefix: 'MERGE-2H-',
  },
  '7d': {
    id: '7d',
    name: '7-Day Sprint Pass',
    priceDisplay: '₹299',
    duration: '7 Days',
    prefix: 'MERGE-7D-',
  },
  '30d': {
    id: '30d',
    name: '1-Month Season Pass',
    priceDisplay: '₹999',
    duration: '30 Days (1 Month)',
    prefix: 'MERGE-30D-',
  },
};

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SHEET_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbxBlng9kSDXLLhTkKhlhONp5tDgB2zQTiOL5URk8wjgg5yRnEMmQoFRWmnTCBm6_iBi/exec';

function generateRandomCode(prefix) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 5; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${rand}`;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, email } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing payment signature verification data' });
    }

    const plan = PLANS[planId] || PLANS['2h'];
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('Razorpay secret not configured in environment');
    }
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Cryptographic HMAC-SHA256 signature verification
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
    }

    // Generate unique license code with plan prefix
    const licenseCode = generateRandomCode(plan.prefix);

    // Sync new paid key to Google Sheets (non-blocking)
    try {
      const sheetUrl = `${GOOGLE_SCRIPT_URL}?action=create_paid&code=${encodeURIComponent(licenseCode)}&plan=${encodeURIComponent(plan.id)}&email=${encodeURIComponent(email)}&paymentId=${encodeURIComponent(razorpay_payment_id)}`;
      fetch(sheetUrl, { method: 'GET' }).catch(() => {});
    } catch (sheetErr) {
      console.warn('⚠️ Google Sheet log notice:', sheetErr);
    }

    // Send transactional license key email via Brevo SMTP
    let emailSent = false;
    try {
      const mailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const downloadUrl = process.env.APP_DOWNLOAD_URL || 'https://mergeit.in/downloads/MergeIt-AI-v1.0.zip';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #07080c; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #0d1017; border: 1px solid #1f293d; border-radius: 16px; padding: 32px; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 20px; font-weight: bold; color: #10b981; }
    .title { font-size: 24px; font-weight: 800; color: #ffffff; margin-top: 8px; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #9ca3af; }
    .key-box { background: #000000; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .key-label { font-size: 11px; text-transform: uppercase; color: #10b981; font-weight: bold; letter-spacing: 1px; margin-bottom: 6px; }
    .key-code { font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 900; letter-spacing: 3px; color: #ffffff; }
    .timer-note { font-size: 12px; color: #34d399; margin-top: 8px; font-weight: 600; }
    .details { background: #161a24; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13px; }
    .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #232a3b; }
    .details-row:last-child { border-bottom: none; }
    .details-label { color: #9ca3af; }
    .details-val { color: #ffffff; font-weight: 600; }
    .steps { margin: 24px 0; font-size: 13px; line-height: 1.6; color: #d1d5db; }
    .btn { display: block; text-align: center; background: #10b981; color: #000000; font-weight: bold; padding: 14px 24px; border-radius: 10px; text-decoration: none; margin: 24px 0; font-size: 15px; }
    .footer { text-align: center; font-size: 11px; color: #6b7280; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">MERGEIT AI</div>
      <div class="title">Your Access Pass is Ready</div>
      <div class="subtitle">Thank you for your purchase. Here is your official license key.</div>
    </div>

    <div class="key-box">
      <div class="key-label">YOUR ACCESS CODE</div>
      <div class="key-code">${licenseCode}</div>
      <div class="timer-note">⏳ Timer begins ONLY when you first enter this code into the desktop app.</div>
    </div>

    <div class="details">
      <div class="details-row">
        <span class="details-label">Plan Purchased:</span>
        <span class="details-val">${plan.name} (${plan.priceDisplay})</span>
      </div>
      <div class="details-row">
        <span class="details-label">Active Duration:</span>
        <span class="details-val">${plan.duration}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Order Reference:</span>
        <span class="details-val">${razorpay_payment_id}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Hardware Lock:</span>
        <span class="details-val">Locks to 1st PC Activated</span>
      </div>
    </div>

    <div class="steps">
      <strong>Quick Activation Instructions:</strong><br/>
      1. Download the Windows application if you haven't yet.<br/>
      2. Extract the archive and launch <strong>Mirage.exe</strong>.<br/>
      3. Paste your code <strong>${licenseCode}</strong> into the passcode prompt.<br/>
      4. Your ${plan.duration} timer begins immediately with 100% screen-share invisibility!
    </div>

    <a href="${downloadUrl}" class="btn">Download MergeIt AI for Windows (116 MB)</a>

    <div class="footer">
      MergeIt AI • Real-Time AI Copilot for Live Interviews<br/>
      If you need assistance, reply directly to this email or reach us at ${process.env.EMAIL_FROM || 'support@clutchpad.in'}
    </div>
  </div>
</body>
</html>
      `;

      const sendResult = await mailTransporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'MergeIt AI Official'}" <${process.env.EMAIL_FROM || 'support@clutchpad.in'}>`,
        to: email,
        subject: `Your MergeIt AI License Key: ${licenseCode} (${plan.name})`,
        html: emailHtml,
      });

      console.log(`📧 Email dispatched to ${email} (MessageId: ${sendResult.messageId})`);
      emailSent = true;
    } catch (mailErr) {
      console.error('❌ Failed to dispatch Brevo license email:', mailErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and license key generated successfully',
      code: licenseCode,
      plan: plan,
      email: email,
      emailSent: emailSent,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    console.error('❌ Verify Payment Server Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Payment verification processing error' });
  }
}
