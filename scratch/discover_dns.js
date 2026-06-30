process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testFetch(url, name) {
  console.log(`--- Testing ${name}: ${url} ---`);
  const headers = new Headers();
  headers.set('Accept', 'application/hal+json, application/json');
  headers.set('Authorization', 'Basic ' + Buffer.from('rr\\simon:88171').toString('base64'));

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(url, { 
      headers, 
      signal: controller.signal 
    });
    clearTimeout(id);
    
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
  await testFetch('https://srvdms.rr.local/dms', 'HTTPS srvdms.rr.local/dms');
  await testFetch('https://srvdms.rr.local/', 'HTTPS srvdms.rr.local root');
  await testFetch('https://srvdms/dms', 'HTTPS srvdms/dms');
  await testFetch('https://srvdms/', 'HTTPS srvdms root');
  await testFetch('http://srvdms.rr.local/dms', 'HTTP srvdms.rr.local/dms');
  await testFetch('http://srvdms/dms', 'HTTP srvdms/dms');
}

main();
