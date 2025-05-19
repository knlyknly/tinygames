const hasown = Object.prototype.hasOwnProperty;
const tostr = Object.prototype.toString;

const tester = type => {
  return {
    get test() {
      return value => {
        // test value base on __μετα__
        if (value && value.__μετα__ && value.__μετα__.__instanceof__) {
          return value.__μετα__.__instanceof__(type);
        }
        switch (type) {
          case undefined:
          case "Undefined":
            return target === undefined;
          case null:
          case "Null":
            return target === null;
          case Object:
          case "Object":
            return target && (typeof target === "object");
          case String:
          case "String":
            return typeof target === "string";
          case Boolean:
          case "Boolean":
            return typeof target === "boolean";
          case "NaN":
            return isNaN(target);
          case Number:
          case "Number":
            return typeof target === "number";
          case "Function":
            return typeof target === type.toLowerCase();
          case Array:
          case "Array":
            if (Array.isArray) {
              return Array.isArray(value);
            }
            return target && target.constructor === Array;
          case "Arguments":
            return tostr.call(target) === "[object Arguments]";
          case "PlainObject":
            var key;
            if (!target || tostr.call(target) !== "[object Object]" || target.nodeType || target === window) {
              return false;
            }
            try {
              // Not own constructor property must be Object
              if (target.constructor && !hasown.call(target, "constructor") && !hasown.call(target.constructor.prototype, "isPrototypeOf")) {
                return false;
              }
            } catch (e) {
              // IE8,9 Will throw exceptions on certain host objects #9897
              return false;
            }
            for (key in target) { }
            return key === undefined || hasown.call(target, key);
          default:
            // make is(NaN, NaN)===true
            if (typeof type === "number" && typeof target === "number" && isNaN(type) && isNaN(target)) {
              return true;
            }
            // understand path as class
            if (typeof type === "string") {
              type = nx.path(type);
            }
            // check normal functions
            if (target && type) {
              if (typeof type === "function") {
                // quick check 
                if (target instanceof type) {
                  return true;
                }
              } else if (type.prototype) {
                // FIXME it's not function in PhantomJS browser, so...
                return target instanceof type;
              }
            }
        }
        return false;
      }
    }
  }
};

"Undefined;Null;Object;String;String;Boolean;NaN;Number;Function;Array;Arguments;PlainObject".split(';').forEach(t => tester[t] = tester(t));

type.Nil = {
  get test() {
    return value => type.Undefined.test(value) || type.Null.test(value);
  }
};

export default type;