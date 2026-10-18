# Render Deployment Sources

- https://render.com/docs/deploy-node-express-app — Render Node/Express quickstart: create New > Web Service, connect Git repository, set build/start commands; linked branch can auto-deploy on push.
- https://render.com/docs/configure-environment-variables — Render environment variables and secrets: configure from Dashboard > Environment; values are injected at runtime and can trigger rebuild/deploy; do not commit `.env` or secret values.
- https://render.com/docs/web-services — Render Web Services: service must bind to `0.0.0.0` and should use `process.env.PORT`; default Render port is 10000; supports Git deployment, health check path, custom domains, logs, and rollbacks.
- https://render.com/docs/deploy-mysql — Render MySQL manual deployment: private Docker service with persistent disk mounted at `/var/lib/mysql`; recommends database-native backup/restore rather than disk snapshot restoration.

Project-specific findings: package.json uses `pnpm build` equivalent `vite build && esbuild server/_core/index.ts ... --outdir=dist`; production start is `NODE_ENV=production node dist/index.js`; `server/_core/index.ts` reads `process.env.PORT || 3000`; database driver is MySQL/TiDB via `DATABASE_URL`; required runtime environment includes database, OAuth, JWT, Forge/S3, and Vite public configuration variables. External Render deployment requires replacing Manus-provided OAuth/Forge/S3 integrations or supplying compatible production endpoints and secrets; it is not a simple static upload.
