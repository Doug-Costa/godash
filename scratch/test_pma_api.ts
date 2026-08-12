import http from 'http';
import querystring from 'querystring';

const BASE_HOST = '187.77.48.78';
const BASE_PORT = 8888;
const USER = 'xkey';
const PASS = 'xkey@2026*';
const DB = 'dentalgo_production';

async function pmaQuery(sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // 1. Get login page token and cookie
    const req1 = http.request(
      {
        host: BASE_HOST,
        port: BASE_PORT,
        path: '/index.php',
        method: 'GET',
      },
      (res1) => {
        let body1 = '';
        const cookies = res1.headers['set-cookie'] || [];
        const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');

        res1.on('data', (chunk) => (body1 += chunk));
        res1.on('end', () => {
          // Extract token
          const tokenMatch = body1.match(/name="token"\s+value="([^"]+)"/);
          const token = tokenMatch ? tokenMatch[1] : '';

          // 2. Perform Login POST
          const postData = querystring.stringify({
            pma_username: USER,
            pma_password: PASS,
            server: '1',
            target: 'index.php',
            token: token,
          });

          const req2 = http.request(
            {
              host: BASE_HOST,
              port: BASE_PORT,
              path: '/index.php',
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                Cookie: cookieHeader,
              },
            },
            (res2) => {
              let body2 = '';
              const cookies2 = res2.headers['set-cookie'] || cookies;
              const cookieHeader2 = cookies2.map((c) => c.split(';')[0]).join('; ');

              res2.on('data', (chunk) => (body2 += chunk));
              res2.on('end', () => {
                const tokenMatch2 = body2.match(/token=([a-f0-9]+)/i) || body1.match(/name="token"\s+value="([^"]+)"/);
                const token2 = tokenMatch2 ? tokenMatch2[1] : token;

                // 3. Post SQL Query
                const sqlPostData = querystring.stringify({
                  db: DB,
                  sql_query: sql,
                  token: token2,
                  ajax_request: 'true',
                });

                const req3 = http.request(
                  {
                    host: BASE_HOST,
                    port: BASE_PORT,
                    path: `/index.php?route=/import`,
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'Content-Length': Buffer.byteLength(sqlPostData),
                      Cookie: cookieHeader2,
                      'X-Requested-With': 'XMLHttpRequest',
                    },
                  },
                  (res3) => {
                    let body3 = '';
                    res3.on('data', (chunk) => (body3 += chunk));
                    res3.on('end', () => {
                      try {
                        const json = JSON.parse(body3);
                        resolve(json);
                      } catch (e) {
                        resolve([{ raw: body3 }]);
                      }
                    });
                  }
                );

                req3.on('error', reject);
                req3.write(sqlPostData);
                req3.end();
              });
            }
          );

          req2.on('error', reject);
          req2.write(postData);
          req2.end();
        });
      }
    );

    req1.on('error', reject);
    req1.end();
  });
}

async function run() {
  console.log('Testing phpMyAdmin HTTP SQL Bridge...');
  try {
    const res = await pmaQuery('SELECT id, fullName, email, phoneNumber FROM people LIMIT 5');
    console.log('Bridge Response:', JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error('Bridge Error:', err.message);
  }
  process.exit(0);
}

run();
