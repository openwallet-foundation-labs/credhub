let qrCodes: string[] = [];
let scanningStatus: string;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchImage') {
    fetch(request.url)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ imageData: reader.result });
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => console.error('Error fetching image:', error));
    return true; // Indicates that you wish to send a response asynchronously
  }

  if (request.action === 'addQRCode') {
    if (qrCodes.includes(request.data)) {
      return;
    }
    qrCodes.push(request.data);
    chrome.action.setBadgeText({
      text: qrCodes.length.toString(),
      tabId: sender.tab!.id,
    });
  }
  if (request.action === 'getQRCodes') {
    sendResponse(qrCodes);
  }

  if (request.action === 'reset') {
    // reset qrCodes and scanningStatus
    qrCodes = [];
    chrome.action.setBadgeText({
      text: qrCodes.length.toString(),
      tabId: sender.tab!.id,
    });
  }

  if (request.action === 'process') {
    scanningStatus = request.data;
  }

  if (request.action === 'status') {
    console.log('status', scanningStatus);
    sendResponse(scanningStatus);
  }
  return true;
});
