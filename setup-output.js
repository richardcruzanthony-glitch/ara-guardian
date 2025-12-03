// Setup output directory for deployment
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Creating entry point...');

const entryPoint = `import { mastra } from './src/mastra/index.js';

const port = process.env.PORT || 5000;
console.log(\`Starting Mastra server on port \${port}...\`);

// Start the server
await mastra.serve();
`;

writeFileSync(join(__dirname, '.mastra', 'output', 'index.mjs'), entryPoint);
writeFileSync(join(__dirname, '.mastra', 'output', 'instrumentation.mjs'), '');

console.log('Build setup complete!');
