// Vercel Serverless Function entry point.
// The Express application is compiled to JavaScript by `pnpm build`
// (turbo → @stokku/api tsc → apps/api/dist). We re-export the compiled
// app here so the @vercel/node builder does not type-check the source tree,
// which avoids fragile isolated TypeScript compilation in the lambda build.
module.exports = require('../apps/api/dist/app').default;
