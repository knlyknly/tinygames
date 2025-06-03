import { META_KEY } from './constants.mjs';

export const generate = (def, args) => {
  const o = {};
  const meta = {};
  Object.defineProperty(o, META_KEY, {
    value: meta,
    enumerable: false,
    configurable: false,
    writable: false,
  });
};

export default generate;
