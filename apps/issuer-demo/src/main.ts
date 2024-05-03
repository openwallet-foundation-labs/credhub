import './style.css';
import qrcode from 'qrcode';

interface RequestLinkBody {
  credentialSubject?: Record<string, unknown>;
  credentialId: string;
  pin?: boolean;
}

interface Config {
  issuerUrl: string;
  credentialId: string;
}

let config: Config;

//fetch the config
fetch('/config.json')
  .then((res) => res.json())
  .then((res) => {
    config = res;
  });

let loop: NodeJS.Timeout;

function getCode() {
  if (loop) {
    clearInterval(loop);
  }
  const body: RequestLinkBody = {
    credentialId: config.credentialId,
  };
  fetch(`${config.issuerUrl}/request`, {
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
  fetch(`${config.issuerUrl}/sessions/${id}`)
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
