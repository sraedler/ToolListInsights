process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
  const loginUrl = 'https://srvdms/identityprovider/login';
  console.log(`Logging in to ${loginUrl}...`);
  
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + Buffer.from('rr\\simon:88171').toString('base64'));

  try {
    const loginRes = await fetch(loginUrl, { headers });
    console.log('Login Status:', loginRes.status);
    
    // Get cookies
    const cookieHeader = loginRes.headers.get('set-cookie');
    console.log('Set-Cookie raw:', cookieHeader);
    
    // Node headers might have multiple set-cookie entries. We need to extract AuthSessionId.
    // In node-fetch or native fetch, get('set-cookie') might join them with commas or require getSetCookie()
    const allCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [cookieHeader];
    console.log('All set-cookies:', allCookies);
    
    let authSessionId = null;
    for (let c of allCookies) {
      if (c && c.includes('AuthSessionId=')) {
        const match = c.match(/AuthSessionId=([^;]+)/);
        if (match) {
          authSessionId = match[1];
          break;
        }
      }
    }
    
    if (!authSessionId) {
      console.error('AuthSessionId cookie not found in response!');
      return;
    }
    console.log('AuthSessionId extracted:', authSessionId.slice(0, 30) + '...');
    
    // Now request https://srvdms/dms/r/ with the AuthSessionId cookie!
    const reposUrl = 'https://srvdms/dms/r/';
    const reposHeaders = new Headers();
    reposHeaders.set('Accept', 'application/hal+json, application/json');
    reposHeaders.set('Cookie', `AuthSessionId=${authSessionId}`);
    
    console.log(`Fetching repositories from ${reposUrl} using Cookie auth...`);
    const reposRes = await fetch(reposUrl, { headers: reposHeaders });
    console.log('Repos Status:', reposRes.status);
    const reposData = await reposRes.json();
    console.log('Repos JSON:');
    console.log(JSON.stringify(reposData, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
