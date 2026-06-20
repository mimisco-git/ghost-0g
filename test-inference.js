require('dotenv').config();

async function test() {
  const res = await fetch('https://router-api.0g.ai/v1/models', {
    headers: {
      'Authorization': `Bearer ${process.env.ROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    }
  });
  
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.slice(0, 500));
}

test().catch(err => console.error('Error:', err.message));
