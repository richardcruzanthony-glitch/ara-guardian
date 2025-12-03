// Simple build script that compiles TypeScript and sets up for deployment
import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔨 Building ara-guardian for deployment...\n');

try {
  // Ensure dist directory exists
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  // Clean and compile TypeScript
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });
  
  // Create entry point
  console.log('📝 Creating entry point...');
  const entryPoint = `import { mastra } from './src/mastra/index.js';

console.log('🚀 Starting Mastra server...');
const port = process.env.PORT || 5000;

mastra.serve().then(() => {
  console.log(\`✅ Server running on port \${port}\`);
}).catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
`;

  writeFileSync(join(__dirname, 'dist', 'index.js'), entryPoint);
  
  console.log('\n✅ Build complete!');
  console.log('📂 Output directory: dist/');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
