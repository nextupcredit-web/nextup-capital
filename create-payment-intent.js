const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, email, name } = JSON.parse(event.body);
    if (!items || !items.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items provided' }) };
    }

    const amount = items.reduce((sum, item) => sum + item.price, 0) * 100; // cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      receipt_email: email || undefined,
      description: items.map(i => i.name).join(', '),
      metadata: {
        customer_name: name || '',
        customer_email: email || '',
        items: items.map(i => i.name).join(', '),
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret }),
    };

  } catch (err) {
    console.error('PaymentIntent error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
