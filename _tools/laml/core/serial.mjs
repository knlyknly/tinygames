export default (function () {
  var id = 1;
  return () => {
    return id++;
  };
})();
