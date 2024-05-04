import { authenticateWithKeycloak } from './auth';
import { config } from './config';
import './style.css';
import qrcode from 'qrcode';

interface RequestLinkBody {
  credentialSubject?: Record<string, unknown>;
  credentialId: string;
  pin?: boolean;
}

let loop: NodeJS.Timeout;

/**
 * Get the qr code, display it and start the loop to get the status
 */
async function getCode() {
  //TODO: this code will not check if the session is expired and the qr code is not valid anymore
  if (loop) {
    clearInterval(loop);
  }
  const body: RequestLinkBody = {
    credentialId: config.credentialId,
    credentialSubject: {
      prename: 'Max',
      surname: 'Mustermann',
    },
  };
  const accessToken = await authenticateWithKeycloak();
  fetch(`${config.issuerUrl}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .then((res) => {
      //display the qrocde
      qrcode.toDataURL(res.uri).then((url) => {
        (document.getElementById('qr') as HTMLElement).setAttribute('src', url);
        urlInput.value = res.uri;
        navigator.clipboard.writeText(res.uri);
      });
      getStatus(res.session.preAuthorizedCode);
      //request for the status update in the background with a loop
      loop = setInterval(() => getStatus(res.session.preAuthorizedCode), 2000);
    });
}

/**
 * Get the status of the session
 * @param id
 */
async function getStatus(id: string) {
  const accessToken = await authenticateWithKeycloak();
  fetch(`${config.issuerUrl}/sessions/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status === 'CREDENTIAL_ISSUED') {
        clearInterval(loop);
      }
      status.innerHTML = res.status;
    });
}

(document.querySelector<HTMLDivElement>('#app') as HTMLDivElement).innerHTML = `
  <button id="get">Get Code</button>
  <img id="qr" />
  <input type="text" id="url" />
  <div id="status"></div>
`;
const status = document.getElementById('status') as HTMLDivElement;
const urlInput = document.getElementById('url') as HTMLInputElement;
(document.getElementById('get') as HTMLElement).addEventListener(
  'click',
  getCode
);
