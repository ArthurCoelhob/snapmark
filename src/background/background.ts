chrome.runtime.onInstalled.addListener(() => {
    console.log('SnapMark Extension Installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'capture-tab') {
        chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error('Erro ao capturar aba:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }

            chrome.storage.local.set({ capturedImage: dataUrl }, () => {
                chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') }, () => {
                    sendResponse({ success: true });
                });
            });
        });

        return true;
    }
});
