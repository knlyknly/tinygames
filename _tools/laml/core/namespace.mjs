const packageMatcher = (packagename) => (key) =>
  key === packagename || key.indexOf(packagename + '.') === 0;
const lengthComparer = (a, b) => b.length - a.length;
const resolvePackageName = (url, packagename, ext) => {
  const urlObj = new URL(url);
  packagename = packagename.replace(/\./g, '/');
  urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
  urlObj.pathname += '/' + packagename + '.' + ext;
  return urlObj.href;
};

const registry = {};

export const register = (pkg, url) => {
  if (registry[pkg] && registry[pkg] !== url) {
    // TODO show namespace conflict warning
    return;
  }
  // TODO check URL not end with '/'
  registry[pkg] = url;
};

export const resolve = async (namespace, ext = 'yaml') => {
  const matchedKey = Object.keys(registry)
    .filter(packageMatcher(namespace))
    .sort(lengthComparer)
    .shift();
  // for all unmatched keys, use the root package
  if (!matchedKey) {
    return resolvePackageName(import.meta.resolve('../root/'), namespace, ext);
  }
  // resolve by the matched key
  const matchedUrl = registry[matchedKey];
  const restPackageName = namespace.substring(matchedKey.length + 1);
  return resolvePackageName(matchedUrl, restPackageName, ext);
};

export const namespace = { register, resolve };

export default namespace;
