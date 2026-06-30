process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const url = 'https://srvdms/identityprovider/login';
  console.log(`Sending GET with Basic Auth to ${url}...`);
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + Buffer.from('rr\\simon:88171').toString('base64'));

  try {
    const res = await fetch(url, { headers });
    console.log('Status:', res.status);
    console.log('All Response Headers:');
    res.headers.forEach((val, key) => {
      console.log(`  ${key}: ${val}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
