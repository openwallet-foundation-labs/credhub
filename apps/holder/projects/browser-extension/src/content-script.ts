import jsQR from 'jsqr';
import crypto from "crypto";



let scannedQrCodeImages  = new Map();

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
    // const protocols = ['openid-credential-offer', 'openid4vp'];
    if (code) {
      //TODO: in case we detected something, we could manipulate the DOM here by passing the html element
      addScanButton(htmlElement as HTMLImageElement);
      scannedQrCodeImages.set(extractIdFromDataURL((htmlElement as HTMLImageElement).src), code.data);
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
  console.log("start scanning for QR Codes")
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
    scannedQrCodeImages = new Map();
    chrome.runtime.sendMessage({ action: 'reset' });
    scanForQRCode();
  }
});


/**
 *
 * function to add a button to the scanned QR code image
 * @param element
 * @returns
 */
function addScanButton(element:HTMLImageElement) {
  if (scannedQrCodeImages.has(`${extractIdFromDataURL(element.src)}`)) {
    console.log("QR code already scanned");
    return;
  }
  // Create button
  const button = document.createElement("button");
  button.id = element.src; // Set button id to the image src
  button.style.position = "absolute";
  button.style.top = element.offsetTop + "px";
  button.style.right = element.offsetLeft + "px";
  button.style.zIndex = "1000";
  button.style.backgroundColor = "#ff670096";
  button.style.color = "white";
  button.style.border = "none";
  button.style.padding = "10px";
  button.style.cursor = "pointer";
  button.style.borderRadius = "5px";
  button.onclick = () => {
    console.log(scannedQrCodeImages.get(element.src)); // Access button id directly
  };
  element.parentElement!.appendChild(button); // Removed the redundant exclamation mark
}

/**
 * Extracts the id from a data URL and hash it.
 * @param {string} imageSrc
 * @returns {string}
 */
function extractIdFromDataURL(imageSrc: string) {
  // Check if the URL starts with 'data:image'
  if (imageSrc.startsWith('data:image')) {
    // Split the URL by comma
    const parts = imageSrc.split(',');
    // Check if the URL has two parts (data type and data)
    if (parts.length === 2) {
      const dataPart = parts[1];
      const id = crypto.createHash("md5").update(dataPart).digest('hex')
      return id;
    }
    return imageSrc;
  } else {
    return imageSrc;
  }
}


scanForQRCode();
