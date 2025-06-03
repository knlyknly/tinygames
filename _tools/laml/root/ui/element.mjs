export const properties = {
  cssclass: (_self) => {
    return {
      get: () => _self.cssclass,
      set: (value) => {
        _self.cssclass = value;
        _self.element.className = value;
      },
    };
  },
};
