export const properties = {
  reserve: (self) => {
    let resources = self.__μετα__.resources;
    if (!resources) {
      resources = self.__μετα__.resources = [];
    }
    return {
      value: (key, resource) => {
        // TODO
      },
    };
  },
  release: (self) => {
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
