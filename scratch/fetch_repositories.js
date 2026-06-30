process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const url = 'https://srvdms/dms/r/';
  console.log(`Fetching repositories from ${url}...`);
  const headers = new Headers();
  headers.set('Accept', 'application/hal+json, application/json');
  headers.set('Authorization', 'Basic ' + Buffer.from('rr\\simon:88171').toString('base64'));

  try {
    const res = await fetch(url, { headers });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Repositories JSON:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
