export const getCapturedImage = (): Promise<string | null> => {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    chrome.storage.local.get('capturedImage', (result) => {
      resolve(typeof result.capturedImage === 'string' ? result.capturedImage : null);
    });
  });
};
