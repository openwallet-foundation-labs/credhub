import './style.css';
import qrcode from 'qrcode';

interface Meta {
  env: {
    VITE_VERIFIER_URL: string;
    VITE_CREDENTIAL_ID: string;
  };
}

interface RequestLinkBody {
  id: string;
}

// to laod the env variables
const env = (import.meta as unknown as Meta).env;

let loop: NodeJS.Timeout;

function getCode() {
  if (loop) {
    clearInterval(loop);
  }
  const body: RequestLinkBody = {
    id: env.VITE_CREDENTIAL_ID,
  };
  fetch(`${env.VITE_VERIFIER_URL}/request`, {
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
      // get correlecationId
      const correlationId = decodeURIComponent(res.uri)
        .split('/')
        .pop() as string;
      const rp = env.VITE_CREDENTIAL_ID;
      getStatus(rp, correlationId);
      loop = setInterval(() => getStatus(rp, correlationId), 2000);
    });
}

function getStatus(rp: string, correlationId: string) {
  fetch(
    `${env.VITE_VERIFIER_URL}/siop/${rp}/auth-request/${correlationId}/status`
  )
    .then((res) => res.json())
    .then((res) => {
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
