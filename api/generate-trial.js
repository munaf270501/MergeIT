const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SHEET_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbxBlng9kSDXLLhTkKhlhONp5tDgB2zQTiOL5URk8wjgg5yRnEMmQoFRWmnTCBm6_iBi/exec';

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
    const { name, email, phone } = req.body || {};

    // 1. Validation
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const rawPhone = (phone || '').toString().trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');

    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your full name (at least 2 characters).'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address.'
      });
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid phone number (at least 10 digits).'
      });
    }

    // 2. Query Google Apps Script Web App
    const targetUrl = `${GOOGLE_SCRIPT_URL}?action=create_trial&name=${encodeURIComponent(trimmedName)}&email=${encodeURIComponent(trimmedEmail)}&phone=${encodeURIComponent(rawPhone)}`;

    const scriptRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'MergeIt-Web-Backend',
        'Accept': 'application/json'
      }
    });

    if (!scriptRes.ok) {
      throw new Error(`Google Apps Script returned status ${scriptRes.status}`);
    }

    const scriptData = await scriptRes.json();

    if (!scriptData.success) {
      return res.status(400).json({
        success: false,
        isTrialExhausted: !!scriptData.isTrialExhausted,
        error: scriptData.message || 'This contact has already claimed a free trial.'
      });
    }

    return res.status(200).json({
      success: true,
      code: scriptData.code,
      name: trimmedName,
      email: trimmedEmail,
      phone: rawPhone,
      message: scriptData.message || 'Trial pass generated successfully!'
    });
  } catch (err) {
    console.error('❌ Generate Trial Server Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Unable to contact licensing server. Please check your connection and try again.'
    });
  }
}
