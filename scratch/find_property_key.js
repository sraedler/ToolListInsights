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
    
    // Fetch complete storedoctype
    const url = 'https://srvdms/dms/r/4fd39dfc-d88d-541f-8bfb-839608941ed4/storedoctype';
    const reqHeaders = new Headers();
    reqHeaders.set('Accept', 'application/hal+json, application/json');
    reqHeaders.set('Cookie', `AuthSessionId=${authSessionId}`);
    
    const res = await fetch(url, { headers: reqHeaders });
    const data = await res.json();
    
    console.log('--- Searching for Artikeldokument (Zeichnung) in storageDocumentTypes ---');
    if (data.storageDocumentTypes) {
      for (let dt of data.storageDocumentTypes) {
        console.log(`Document Type: "${dt.displayName}" (ID: ${dt.id})`);
        
        // Find property displaying 'Artikelnummer'
        if (dt.extendedProperties) {
          dt.extendedProperties.forEach(p => {
            if (p.displayName.toLowerCase().includes('artikelnummer') || p.displayName.toLowerCase().includes('zeichnung')) {
              console.log(`  -> Matched Property: "${p.displayName}" | ID / Key: "${p.id}" | DataType: ${p.dataType}`);
            }
          });
        }
        console.log('------------------------------------');
      }
    } else {
      console.log('No storageDocumentTypes found.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
