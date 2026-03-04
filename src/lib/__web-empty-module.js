// Empty module stub for native-only packages on web platform.
// Metro resolves native-only imports to this file when bundling for web.

// A recursive no-op proxy: any property access returns a no-op function,
// and calling any function also returns the proxy so chaining works.
function createNoopProxy() {
  var handler = {
    get: function (_target, prop) {
      if (prop === '__esModule') return true;
      if (prop === 'default') return proxy;
      if (prop === 'then') return undefined; // prevent Promise detection
      if (prop === Symbol.toPrimitive) return function () { return ''; };
      if (prop === Symbol.iterator) return function () { return { next: function () { return { done: true }; } }; };
      return noopFn;
    },
    apply: function () {
      return proxy;
    },
  };

  function noopFn() { return proxy; }
  var proxy = new Proxy(noopFn, handler);
  return proxy;
}

module.exports = createNoopProxy();
