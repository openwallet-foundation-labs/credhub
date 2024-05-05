import { authenticateWithKeycloak } from './auth';
import { config } from './config';
import './style.css';
import qrcode from 'qrcode';

let loop: NodeJS.Timeout;

async function getCode() {
  if (loop) {
    clearInterval(loop);
  }
  const accessToken = await authenticateWithKeycloak();
  fetch(`${config.verifierUrl}/siop/${config.credentialId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      //display the qrocde
      qrcode.toDataURL(res.uri).then((url) => {
        (document.getElementById('qr') as HTMLElement).setAttribute('src', url);
        urlInput.value = res.uri;
        navigator.clipboard.writeText(res.uri);
      });
      // get correlecationId
      const correlationId = decodeURIComponent(res.uri)
        .split('/')
        .pop() as string;
      const rp = config.credentialId;
      getStatus(rp, correlationId);
      loop = setInterval(() => getStatus(rp, correlationId), 2000);
    });
}

async function getStatus(rp: string, correlationId: string) {
  const accessToken = await authenticateWithKeycloak();
  fetch(
    `${config.verifierUrl}/siop/${rp}/auth-request/${correlationId}/status`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
    .then((res) => res.json())
    .then((res) => {
      if (res.status === 'verified') {
        clearInterval(loop);
      }
      status.innerHTML = res.status;
    });
}

(document.querySelector<HTMLDivElement>('#app') as HTMLDivElement).innerHTML = `
<div class="mdc-card" style="padding: 20px;">
<button id="get" class="mdc-button mdc-button--outlined" style="margin-top: 10px;">
  <div class="mdc-button__ripple"></div>
  <span class="mdc-button__label">Generate QR Code</span>
</button>
<img id="qr" style="margin-top: 20px;" />
<div class="mdc-text-field mdc-text-field--outlined" style="width: 300px;">
  <input type="text" id="url" class="mdc-text-field__input">
  <div class="mdc-notched-outline">
    <div class="mdc-notched-outline__leading"></div>    
    <div class="mdc-notched-outline__trailing"></div>
  </div>
</div>
<div style="margin-top: 20px;">Status: <span id="status"></span></div>
</div>
`;
const status = document.getElementById('status') as HTMLDivElement;
const urlInput = document.getElementById('url') as HTMLInputElement;
(document.getElementById('get') as HTMLElement).addEventListener(
  'click',
  getCode
);
