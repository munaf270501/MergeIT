import Razorpay from 'razorpay';

// Pricing plans definition
const PLANS = {
  '2h': {
    id: '2h',
    name: '2-Hour Interview Pass',
    amountPaise: 4900, // ₹49
    priceDisplay: '₹49',
    duration: '2 Full Hours (120 Minutes)',
    prefix: 'MERGE-2H-',
  },
  '7d': {
    id: '7d',
    name: '7-Day Sprint Pass',
    amountPaise: 29900, // ₹299
    priceDisplay: '₹299',
    duration: '7 Days',
    prefix: 'MERGE-7D-',
  },
  '30d': {
    id: '30d',
    name: '1-Month Season Pass',
    amountPaise: 99900, // ₹999
    priceDisplay: '₹999',
    duration: '30 Days (1 Month)',
    prefix: 'MERGE-30D-',
  },
};

export default async function handler(req, res) {
  // Set CORS headers
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
    const { planId, email } = req.body || {};
    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({ success: false, error: 'Invalid plan selected' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured in environment');
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: plan.amountPaise,
      currency: 'INR',
      receipt: `rcpt_${planId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      notes: {
        plan: plan.name,
        email: email,
      },
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      plan: plan,
    });
  } catch (err) {
    console.error('❌ Razorpay Create Order Error:', err);
    return res.status(500).json({
      success: false,
      error: err.description || err.message || 'Failed to create payment order',
    });
  }
}
