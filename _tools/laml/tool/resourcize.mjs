import serial from './serial.mjs';

export const resourcize = (target) => {
  const resources = {};
  Object.assign(target, {
    reserve: (key, resource) => {
      // resource could be anonymous, use param 0 as resource if only 1 params occurs
      if (resource === undefined) {
        resource = key;
        key = serial();
      }
      // release it if resource specified by key already occurs in resources
      if (resources[key]) {
        resources[key].release();
        delete resources[key];
      }
      // add resource to resources
      resources[key] = resource;
      // return resource
      return resource;
    },
    release: (key) => {
      // release all resources if no key is specified
      if (!key) {
        Object.keys(resources).forEach((key) => {
          this.release(key);
        });
      } else {
        const resource = resources[key];
        if (resource) {
          resource.release();
          delete resources[key];
        }
      }
    },
  });
  return target;
};

export class Resource {
  constructor() {
    resourcize(this);
  }
}

export default resourcize;
