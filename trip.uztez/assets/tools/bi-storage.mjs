const isInBrowser = typeof window !== 'undefined';

const testHttpLocation = (key) => {
  // check if the key is a http location
  const url = new URL(key);
  return url.protocol === 'http:' || url.protocol === 'https:';
};

const testFileLocation = (key) => {
  // check if the key is a file location
  return key.startsWith('file://');
};

const testUrl = (key) => {
  // check if it's a valid url
  try {
    new URL(key);
    return true;
  } catch (e) {
    return false;
  }
};

const loadContent = async (key) => {
  if (testHttpLocation(key)) {
    // load from http location
    const response = await fetch(key);
    return await response.text();
  }
  if (testFileLocation(key)) {
    // throw error message if it's in browser
    if (isInBrowser) {
      throw new Error('File location is not supported in browser');
    }
    // load from file location
    const fs = import('fs');
    // normalize the path according to OS
    const path = key.replace(/^file:\/\//, '');
    const content = await fs.readFile(path, 'utf-8');
    return content;
    // 
  }
};

class BrowserStorage {}

class FileSystemStorage {}

export const BiStorage = globalThis.window ? BrowserStorage : FileSystemStorage;
export default BiStorage;
