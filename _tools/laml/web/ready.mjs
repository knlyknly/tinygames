import { Resource } from '../tool/resourcize.mjs';

export const ready = (fn) => {
  let resource = new Resource();
  let callback = () => {
    resource.release('recursive');
    // attach the class or call a function
    if (typeof fn === 'function') {
      resource.reserve('recursive', fn());
    }
  };
  // make sure to call the callback, even if loaded.
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
    resource.reserve('recursive', {
      release: () => window.removeEventListener('load', callback),
    });
  }
  return resource;
};
