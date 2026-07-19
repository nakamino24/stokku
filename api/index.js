// Vercel Serverless Function entry point.
// The Express application is compiled to JavaScript by `pnpm build`
// (turbo → @stokku/api tsc → apps/api/dist/app.js). We load the compiled
// artifact explicitly by absolute path so the @vercel/node bundler does not
// re-resolve the import to the TypeScript source tree.
const path = require('path');

const appPath = path.join(__dirname, '..', 'apps', 'api', 'dist', 'app.js');
module.exports = require(appPath).default;
