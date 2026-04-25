exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { amount, alias, anonymous } = JSON.parse(event.body);

    if (!amount || amount < 0.5) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    const donorName = anonymous ? 'Anonymous' : (alias && alias.trim() ? alias.trim() : 'Anonymous');

    const response = await fetch('https://api.monei.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': process.env.MONEI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'EUR',
        orderId: 'fnr-' + Date.now(),
        description: 'Donation — For No Reason',
        customer: {
          name: donorName,
        },
        metadata: {
          donor_name: donorName,
        },
        completeUrl: 'https://fornoreason.org?donated=true',
        cancelUrl: 'https://fornoreason.org',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'MONEI error');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url: data.nextAction.redirectUrl }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
