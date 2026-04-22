const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { amount, alias, anonymous, custom } = JSON.parse(event.body);
    const donorName = anonymous ? 'Anonymous' : (alias && alias.trim() ? alias.trim() : 'Anonymous');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Donation — For No Reason',
            description: 'A social experiment. No cause. No reason.',
          },
          unit_amount: custom ? undefined : Math.round((amount || 1) * 100),
          ...(custom && { unit_amount: 100 }),
        },
        quantity: 1,
        ...(custom && { adjustable_quantity: { enabled: true, minimum: 1 } }),
      }],
      mode: 'payment',
      success_url: 'https://fornoreason.org?donated=true',
      cancel_url: 'https://fornoreason.org',
      metadata: { donor_name: donorName },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
