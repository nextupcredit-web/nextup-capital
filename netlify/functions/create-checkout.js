const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { items } = JSON.parse(event.body);
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: item.price * 100,
      },
      quantity: 1,
    }));
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${event.headers.origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin}/services.html`,
      billing_address_collection: 'required',
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (error) {
    console.error('Stripe error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
