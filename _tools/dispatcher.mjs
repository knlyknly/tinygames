export class Dispatcher {
  constructor() {
    const listeners = {};
    Object.assign(this, {
      addListener: (key, listener) => {
        let list = listeners[key];
        if (!list) {
          list = [];
          listeners[key] = list;
        }
        const index = list.indexOf(listener);
        if (index < 0) {
          list.push(listener);
        }
      },
      removeListener: (key, listener) => {
        let list = listeners[key];
        if (list) {
          const index = list.indexOf(listener);
          if (index >= 0) {
            list.splice(index, 1);
            if (!list.length) {
              delete listeners[key];
            }
          }
        }
      },
      dispatch: (key, ...data) => {
        const list = listeners[key];
        if (list) {
          list.forEach((listener) => {
            listener(...data);
          });
        }
      },
    });
  }
}
