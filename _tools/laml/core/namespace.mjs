import { yaml } from "../index.mjs";
import access from "../lang/access.mjs";

const REG_URL = /^[\w-]+:/;

const registry = {};

const load = async (url) => {
  let value = undefined;
  try {
    value = (await import(`${url}.mjs`)).default;
    return value;
  } catch (e) {
    try {
      value = (await fetch(`${url}.json`)).text();
      value = JSON.parse(value);
    } catch (e) {
      value = (await fetch(`${url}.yaml`)).text();
      value = yaml.parse(value);
    }
    // TODO generator?
    return value;
  }
}

export const register = (namespace, value) => {
  if (access(registry, namespace) !== value) {
    // TODO show namespace conflict warning
  }
  // TODO check URL not end with '/'
  access(registry, namespace, value);
};

export const resolve = async (namespace) => {
  const path = namespace.split('.');
  let p = p = path.length
  for (; p > 0; p--) {
    const p1 = path.slice(0, p);
    const p2 = path.slice(p);
    const value = access(registry, p1);
    if (!value) continue;
    if (type.String.test(value) && REG_URL.test(value)) {
      const url = [value, ...p2].join('/');
      return await load(url);
    } else {
      return access(value, p2);
    }
  }
};

export default { register, resolve };