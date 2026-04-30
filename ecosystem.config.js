module.exports = {
  apps: [
    {
      name: 'control-layer',
      script: 'backend/dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        DATA_LAYER_URL: 'http://localhost:8001'
      }
    },
    {
      name: 'data-layer',
      script: 'uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8001',
      cwd: 'data-service',
      interpreter: 'python3'
    }
  ]
};
