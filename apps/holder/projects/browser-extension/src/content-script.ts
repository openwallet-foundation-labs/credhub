import jsQR from 'jsqr';

let codes: string[] = [];

/**
 * Gets the image data from the given url and sends it to the callback.
 * @param {HTMLImageElement} elemet
 */
function scanImage(element: HTMLImageElement) {
  if (element.src.startsWith('data:')) {
    readImage(element.src, element);
  } else {
    //TODO: this is not implemented
    chrome.runtime.sendMessage(
      { action: 'fetchImage', url: element.src },
      function (response) {
        readImage(response.imageData, element);
      }
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
  image.onload = function () {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = image.width;
    canvas.height = image.height;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    //check if the QR code is a valid credential offer or request
    const protocols = ['openid-credential-offer', 'openid4vp'];
    if (code && protocols.includes(code.data.split(':')[0])) {
      //TODO: in case we detected something, we could manipulate the DOM here by passing the html element
      htmlElement.style.border = '5px solid green';
      codes.push(code.data);
      chrome.runtime.sendMessage({ action: 'addQRCode', data: code.data });
    }
    toProcess--;
    if (toProcess === 0) {
      chrome.runtime.sendMessage({
        action: 'process',
        data: { action: 'scanned', value: codes },
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

chrome.runtime.onMessage.addListener(function (request) {
  if (request.action === 'rescanQRCode') {
    codes = [];
    chrome.runtime.sendMessage({ action: 'reset' });
    scanForQRCode();
  }
});

//TODO: maybe use an interval for this.
// Scan the page for QR codes when the page is loaded.
window.onload = scanForQRCode;
