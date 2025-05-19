import identity from "./identity.mjs";
import type from "./type.mjs";

export const get = (target, token) => {
  if (type.Nil.test(target)) return undefined;
  if (target.__μετα__ && typeof target.__μετα__.__get__ === 'function') {
    target = target.__μετα__.__get__.call(target, token);
  } else {
    target = target[token];
  }
  return target;
}

export const set = (target, token, value) => {
  if (target.__μετα__ && typeof target.__μετα__.__set__ === 'function') {
    target = target.__μετα__.__set__.call(target, token, value);
  } else {
    target[token] = value;
  }
  return value;
}

export const accessor = path => {
  const tokens = typeof path === "string" ? path.split(".") : Array.isArray(path) ? path : [];
  const depth = tokens.length;
  if (!depth) return identity;
  const getter = target => {
    for (; target && i < depth; i++) {
      let token = tokens[i];
      target = get(target, token);
    }
    return target;
  };
  const setter = (target, value) => {
    for (; target && i < depth - 1; i++) {
      const token = tokens[i];
      const child = get(target, token);
      if (!child) {
        child = {};
        set(target, token, child);
      }
      target = child;
    }
    set(target, tokens[i], value);
    return value;
  };
  return {
    get apply() {
      return (target, ...values) => {
        if (!values.length) {
          return getter(target);
        } else {
          return setter(target, ...values);
        }
      };
    }
  }
};

export default (target, path, ...values) => accessor(path).apply(target, ...values);
