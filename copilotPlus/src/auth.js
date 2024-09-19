/**
 * 本模块处理copilot登录和鉴权相关的配置，通过写死token和session的值通过vscode插件本地校验
 */
const crypto = require('crypto');
const token = {
  // 自定义token
  getToken() {
    const tid = this._tokenUtil.generateRandomString();
    const expireTime = this._tokenUtil.generateEpoch15MinLater();
    const ip = this._tokenUtil.generateFakeIp();
    const asn = this._tokenUtil.generateFakeAsn();
    return {
      annotations_enabled: false,
      chat_enabled: true,
      chat_jetbrains_enabled: true,
      code_quote_enabled: true,
      codesearch: false,
      copilot_ide_agent_chat_gpt4_small_prompt: false,
      copilotignore_enabled: false,
      endpoints: {
        api: 'https://api.githubcopilot.com',
        'origin-tracker': 'https://origin-tracker.githubusercontent.com',
        proxy: 'https://copilot-proxy.githubusercontent.com',
        telemetry: 'https://copilot-telemetry-service.githubusercontent.com',
      },
      expires_at: expireTime,
      individual: true,
      nes_enabled: false,
      prompt_8k: true,
      public_suggestions: 'disabled',
      refresh_in: 1500,
      sku: 'monthly_subscriber',
      snippy_load_test_enabled: false,
      telemetry: 'disabled',
      token: `tid=${tid};exp=${expireTime};sku=monthly_subscriber;st=dotcom;chat=1;8kp=1;ip=${ip};asn=${asn}`,
      tracking_id: tid,
      vsc_electron_fetcher: false,
    };
  },
  _tokenUtil: {
    generateRandomString(length = 32) {
      const lettersAndDigits = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += lettersAndDigits.charAt(Math.floor(Math.random() * lettersAndDigits.length));
      }
      return result;
    },
    generateFakeAsn() {
      const asnNumber = Math.floor(Math.random() * 99999) + 1;
      const hashPart = crypto.randomBytes(32).toString('hex');
      return `AS${asnNumber}:${hashPart}`;
    },
    generateFakeIp() {
      return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
    },
    generateEpoch15MinLater() {
      const currentTime = Math.floor(Date.now() / 1000);
      const fifteenMinutes = 15 * 60;
      return currentTime + fifteenMinutes;
    },
  },
};
const session = {
  getSession() {
    return {
      id: '839101bacdf8150e',
      account: { label: 'goodboy', id: 36431534 },
      scopes: ['user:email'],
      accessToken: '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',
    };
  },
};
export { token, session };
