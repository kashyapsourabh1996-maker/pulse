/**
 * PM2 process configuration for Pulse (single-server deployment).
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup   (auto-start on reboot)
 *
 * See DEPLOYMENT.md → Option B for full instructions.
 */
module.exports = {
  apps: [
    {
      name: 'pulse-web',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '512M',
    },
    {
      name: 'pulse-socket',
      cwd: `${__dirname}/mini-services/chat-service`,
      script: 'index.ts',
      env: {
        SOCKET_PORT: '3003',
        SOCKET_PATH: '/socket.io',
        SOCKET_CORS_ORIGIN: 'https://pulse.yourdomain.com',
      },
      max_memory_restart: '256M',
    },
  ],
}
