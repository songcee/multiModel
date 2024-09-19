const proxy = {
  proxyURL() {
    const urlProxy = URL;
    const NEW_DOMAIN = 'copilot-proxy.myhexin.com';
    const PROXY_PREFIX_PATH = '/copilot-ai-plugins';

    URL = class extends urlProxy {
      constructor(input, base) {
        console.log('[qwen] proxyURL:', input, base);

        if ((base && base.includes('telemetry')) || input.includes('telemetry')) {
          const url = new urlProxy(base || input);
          const newUrl = `${url.protocol}//${NEW_DOMAIN}${PROXY_PREFIX_PATH}/${url.hostname}${url.pathname}${url.search}`;
          console.log('[qwen] proxyURL newUrl:', newUrl);
          super(newUrl);
        } else {
          super(input, base);
        }
      }
    };
  },
  proxyFetch() {
    const fetchProxy = this.ctx.get(qa).fetch;
    this.ctx.get(qa).fetch = function (...args) {
      console.log('[qwen] fetch:', ...args);
      if (args[0].indexOf('telemetry') > 0) {
        console.log('[qwen] telemetry');
        return;
      }
      fetchProxy(...args);
    };
  },
};
export { proxy };
