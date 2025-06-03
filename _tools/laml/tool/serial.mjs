/**
 * Create a serial number.
 */
export default (function () {
    var id = 0xcafebabe;
    return function () {
        return ++id;
    };
})();