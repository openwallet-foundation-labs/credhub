let qrCodes: string[] = [];
let scanningStatus: string;
let walletenWindow: chrome.windows.Window | null = null;

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
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
      .catch(() => {
        // just catch it
      });
    return true; // Indicates that you wish to send a response asynchronously
  }

  if (request.action === 'addQRCode') {
    if (qrCodes.includes(request.data)) {
      return;
    }
    qrCodes.push(request.data);
    chrome.action.setBadgeText({
      text: qrCodes.length.toString(),
      tabId: (sender.tab as chrome.tabs.Tab).id,
    });
  }
  if (request.action === 'getQRCodes') {
    sendResponse(qrCodes);
  }

  if (request.action === 'open') {
    const id = request.data.url;
    const url = chrome.runtime.getURL(
      `index.html#/scan/${encodeURIComponent(id)}`
    );
    if (walletenWindow !== null) {
      console.log('removing window');
      chrome.windows.remove(
        (walletenWindow as chrome.windows.Window).id as number
      );
    }
    walletenWindow = await chrome.windows.create({
      url,
      type: 'panel',
      width: 400,
      height: 700,
      focused: true,
    });
  }

  if (request.action === 'reset') {
    // reset qrCodes and scanningStatus
    qrCodes = [];
    chrome.action.setBadgeText({
      text: qrCodes.length.toString(),
      tabId: (sender.tab as chrome.tabs.Tab).id,
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
