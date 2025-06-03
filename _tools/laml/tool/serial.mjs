/**
 * Create a serial number.
 */
export const serial = (function () {
  var id = 0xcafebabe;
  return function () {
    return ++id;
  };
})();

export default serial;
