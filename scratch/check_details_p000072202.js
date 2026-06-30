process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
    
    // Fetch document details for P000072202
    const url = 'https://srvdms/dms/r/4fd39dfc-d88d-541f-8bfb-839608941ed4/o2/P000072202';
    const reqHeaders = new Headers();
    reqHeaders.set('Accept', 'application/hal+json, application/json');
    reqHeaders.set('Cookie', `AuthSessionId=${authSessionId}`);
    
    const res = await fetch(url, { headers: reqHeaders });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Links in P000072202:');
    console.log(JSON.stringify(data._links, null, 2));
    
    console.log('\nKeys in main body:');
    console.log(Object.keys(data));
    if (data.pdfInlineUri) {
      console.log('pdfInlineUri found in root:', data.pdfInlineUri);
    } else {
      console.log('No pdfInlineUri in root.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
