process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function trySearch(authSessionId, propParam, desc) {
  const url = `https://srvdms/dms/r/4fd39dfc-d88d-541f-8bfb-839608941ed4/sr/?properties=${encodeURIComponent(propParam)}`;
  console.log(`--- Trying format: ${desc} ---`);
  console.log(`URL: ${url}`);
  
  const headers = new Headers();
  headers.set('Accept', 'application/hal+json, application/json');
  headers.set('Cookie', `AuthSessionId=${authSessionId}`);

  try {
    const res = await fetch(url, { headers });
    console.log('Status:', res.status);
    const data = await res.json();
    if (res.status === 200) {
      console.log('Success! Count:', data.count || 0);
      if (data.items) console.log('Sample item:', data.items[0]);
    } else {
      console.log('Error:', data.details || data.reason || data);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
  console.log('\n');
}

async function main() {
  const loginUrl = 'https://srvdms/identityprovider/login';
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + Buffer.from('rr\\simon:88171').toString('base64'));

  try {
    const loginRes = await fetch(loginUrl, { headers });
    const allCookies = loginRes.headers.getSetCookie();
    let authSessionId = null;
    for (let c of allCookies) {
      if (c && c.includes('AuthSessionId=')) {
        authSessionId = c.match(/AuthSessionId=([^;]+)/)[1];
        break;
      }
    }
    
    // Probing formats
    await trySearch(authSessionId, 'Artikelnummer,4778-0101-08', 'Direct comma');
    await trySearch(authSessionId, '["Artikelnummer","4778-0101-08"]', 'JSON array values');
    await trySearch(authSessionId, '{"Artikelnummer":["4778-0101-08"]}', 'JSON key-array object');
    await trySearch(authSessionId, 'Artikelnummer:4778-0101-08', 'Colon separator');
    await trySearch(authSessionId, 'Artikelnummer eq "4778-0101-08"', 'OData-like eq');
    await trySearch(authSessionId, 'Artikelnummer="4778-0101-08"', 'Equals sign');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
