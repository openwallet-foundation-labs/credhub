import fs from 'fs';
import chromeWebstoreUpload from 'chrome-webstore-upload';
import dotenv from 'dotenv';

dotenv.config();
//https://chrome.google.com/webstore/devconsole/10725024-b20f-4469-bfe4-66706bc30d57

const store = chromeWebstoreUpload({
  extensionId: process.env.EXTENSION_ID,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN
});
const myZipFile = fs.createReadStream('./application.zip');
store.uploadExisting(myZipFile).then(res => {
  console.log('Upload response:', res);
  return store.publish('default');
});
