const { SmartAPI } = require('smartapi-javascript');
const api = new SmartAPI({ api_key: 'test' });
console.log('SmartAPI keys:', Object.keys(api));
console.log('SmartAPI proto keys:', Object.keys(Object.getPrototypeOf(api)));
console.log('Methods in api:', Object.getOwnPropertyNames(api));
