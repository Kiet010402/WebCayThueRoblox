/**
 * Script để lấy OAuth2 Refresh Token cho Gmail
 * 
 * Hướng dẫn sử dụng:
 * 1. Tạo OAuth2 credentials tại Google Cloud Console
 * 2. Download credentials.json và đặt vào thư mục server/
 * 3. Chạy: node scripts/get-oauth2-token.js
 * 4. Copy refresh token vào .env
 */

const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');

/**
 * Đọc credentials từ file
 */
function loadCredentials() {
  try {
    return JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  } catch (err) {
    console.error('Error loading credentials file:', err);
    console.error('\nVui lòng tạo file credentials.json trong thư mục server/');
    console.error('Xem hướng dẫn tại: server/GUIDE_OAUTH2_SETUP.md');
    process.exit(1);
  }
}

/**
 * Tạo OAuth2 client và lấy authorization URL
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Kiểm tra xem đã có token chưa
  try {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    console.log('Token đã tồn tại:', token.refresh_token);
    return oAuth2Client;
  } catch (err) {
    // Chưa có token, cần lấy mới
  }

  return getNewToken(oAuth2Client);
}

/**
 * Lấy token mới từ user
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  
  console.log('\n========================================');
  console.log('BƯỚC 1: Mở URL này trong trình duyệt:');
  console.log('========================================\n');
  console.log(authUrl);
  console.log('\n========================================');
  console.log('BƯỚC 2: Sau khi authorize, copy code từ URL');
  console.log('(sẽ có dạng: ?code=4/0A...&scope=...)');
  console.log('========================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('Nhập code từ URL: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error('Error retrieving access token', err);
          return reject(err);
        }
        
        // Lưu token vào file
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('\n========================================');
        console.log('THÀNH CÔNG! Refresh Token:');
        console.log('========================================\n');
        console.log(token.refresh_token);
        console.log('\n========================================');
        console.log('Copy refresh token này vào .env:');
        console.log('GMAIL_REFRESH_TOKEN=' + token.refresh_token);
        console.log('========================================\n');
        
        oAuth2Client.setCredentials(token);
        resolve(oAuth2Client);
      });
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Đang tải credentials...');
  const credentials = loadCredentials();
  console.log('Đang tạo OAuth2 client...');
  await authorize(credentials);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { authorize, loadCredentials };
