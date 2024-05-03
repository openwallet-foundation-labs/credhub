import './style.css';
import qrcode from 'qrcode';

interface Meta {
  env: {
    VITE_ISSUER_URL: string;
    VITE_CREDENTIAL_ID: string;
  };
}

interface RequestLinkBody {
  credentialSubject?: Record<string, unknown>;
  credentialId: string;
  pin?: boolean;
}

// to laod the env variables
const env = (import.meta as unknown as Meta).env;

let loop: NodeJS.Timeout;

function getCode() {
  if (loop) {
    clearInterval(loop);
  }
  const body: RequestLinkBody = {
    credentialId: env.VITE_CREDENTIAL_ID,
  };
  fetch(`${env.VITE_ISSUER_URL}/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .then((res) => {
      //display the qrocde
      qrcode
        .toDataURL(res.uri)
        .then((url) =>
          (document.getElementById('qr') as HTMLElement).setAttribute(
            'src',
            url
          )
        );
      getStatus(res.session.preAuthorizedCode);
      //request for the status update in the background with a loop
      loop = setInterval(() => getStatus(res.session.preAuthorizedCode), 2000);
    });
}

function getStatus(id: string) {
  fetch(`${env.VITE_ISSUER_URL}/sessions/${id}`)
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
      status.innerHTML = res.status;
    });
}

(document.querySelector<HTMLDivElement>('#app') as HTMLDivElement).innerHTML = `
  <button id="get">Get Code</button>
  <img id="qr" />
  <div id="status"></div>
`;
const status = document.getElementById('status') as HTMLDivElement;
(document.getElementById('get') as HTMLElement).addEventListener(
  'click',
  getCode
);
