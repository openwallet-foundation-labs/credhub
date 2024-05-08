import jsQR from 'jsqr';

const scannedQrCodeImages = new Map();

/**
 * Gets the image data from the given url and sends it to the callback.
 * @param {HTMLImageElement} elemet
 */
function scanImage(element: HTMLImageElement) {
  if (!element.src) return;
  if (element.src.startsWith('data:')) {
    readImage(element.src, element);
  } else {
    chrome.runtime.sendMessage(
      { action: 'fetchImage', url: element.src },
      (response) => readImage(response.imageData, element)
    );
  }
}

/**
 * Scans the given image data for a QR code.
 * @param {string} imageDataUrl
 */
function readImage(
  imageDataUrl: string,
  htmlElement: HTMLImageElement | HTMLCanvasElement
) {
  const image = new Image();
  image.onload = async () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    //check if the QR code is a valid credential offer or request
    const protocols = ['openid-credential-offer', 'openid'];
    if (code && protocols.includes(code.data.split(':')[0])) {
      const id = await getUniqueHash(code.data);
      await addScanButton(htmlElement as HTMLImageElement, id, code.data);
      scannedQrCodeImages.set(id, code.data);
      chrome.runtime.sendMessage({ action: 'addQRCode', data: code.data });
    }
    toProcess--;
    if (toProcess === 0) {
      chrome.runtime.sendMessage({
        action: 'process',
        data: { action: 'scanned', value: scannedQrCodeImages },
      });
    }
  };
  image.src = imageDataUrl;
}

let toProcess = 0;
/**
 * Scans the current page for QR codes.
 */
function scanForQRCode() {
  const images = document.querySelectorAll('img');
  const canvases = document.querySelectorAll('canvas');
  toProcess = canvases.length + images.length;
  chrome.runtime.sendMessage({ action: 'process', data: 'scanning' });
  images.forEach((image) => scanImage(image));
  canvases.forEach((canvas) => {
    const imageData = canvas.toDataURL();
    readImage(imageData, canvas);
  });
}

/**
 *
 * function to add a button to the scanned QR code image
 * @param element
 * @returns
 */
async function addScanButton(
  element: HTMLImageElement,
  id: string,
  url: string
) {
  if (scannedQrCodeImages.has(id)) return;
  // Create button
  const button = document.createElement('button');
  button.style.position = 'absolute';
  button.style.top = `${element.offsetTop + element.height}px`;
  //substract with with of the button to align it to the right
  button.style.left = `${element.offsetLeft + element.width - 110}px`;
  button.style.zIndex = '1000';
  button.style.backgroundColor = '#ff670096';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.padding = '10px';
  button.style.cursor = 'pointer';
  button.style.borderRadius = '5px';
  button.innerText = 'Scan QR Code';
  button.onclick = () => {
    chrome.runtime.sendMessage({
      action: 'open',
      data: { url },
    });
  };
  element.parentElement?.appendChild(button); // Removed the redundant exclamation mark
}

/**
 * Create the hash of the given data url and return a hex string.
 */
function getUniqueHash(dataUrl: string) {
  return window.crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(dataUrl))
    .then((hash) => {
      let result = '';
      const view = new DataView(hash);
      for (let i = 0; i < view.byteLength; i += 4) {
        result += `00000000${view.getUint32(i).toString(16)}`.slice(-8);
      }
      return result;
    });
}

console.log('start scanning for QR Codes');
setInterval(() => {
  scanForQRCode();
}, 1000);
scanForQRCode();
