// Allow self-signed SSL certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testFetch(url, name) {
  console.log(`--- Testing ${name}: ${url} ---`);
  const headers = new Headers();
  headers.set('Accept', 'application/hal+json, application/json');
  // Add Basic Auth credentials provided by user
  headers.set('Authorization', 'Basic ' + Buffer.from('rr\\simon:88171').toString('base64'));

  try {
    const res = await fetch(url, { headers, timeout: 5000 });
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Response body (first 1000 chars):');
    console.log(text.slice(0, 1000));
  } catch (err) {
    console.error('Error fetching:', err.message);
  }
  console.log('\n');
}

async function main() {
  // Test both with and without /dms
  await testFetch('https://192.168.100.8/dms', 'HTTPS with /dms');
  await testFetch('https://192.168.100.8/', 'HTTPS root');
  await testFetch('http://192.168.100.8/dms', 'HTTP with /dms');
  await testFetch('http://192.168.100.8/', 'HTTP root');
}

main();
