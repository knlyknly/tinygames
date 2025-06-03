export const properties = {
  bind: (self) => {
    let bindings = self.bindings;
    if (!bindings) {
      bindings = self.bindings = [];
    }
    return {
      value: (key, resource) => {
        // TODO
      },
    };
  },
  dispatch: (self) => {
    let resources = self.resources;
    if (!resources) {
      resources = self.resources = {};
    }
    return {
      value: (key) => {
        // TODO
      },
    };
  },
};
