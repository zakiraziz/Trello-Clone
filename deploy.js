const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FRONTEND_DIR = path.join(__dirname, 'Frontend');
const DIST_DIR = path.join(FRONTEND_DIR, 'dist');

console.log('🚀 Deploying Trello SaaS\n');

// Step 1: Build the frontend
console.log('📦 Building frontend...');
execSync('npm run build', { cwd: FRONTEND_DIR, stdio: 'inherit' });
console.log('✅ Build complete!\n');

// Step 2: Verify dist exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ dist folder not found!');
  process.exit(1);
}

// Step 3: Create Netlify site via API
console.log('🌐 Creating Netlify site...');
try {
  const site = JSON.parse(
    execSync(
      `npx netlify api createSite --data '{"name":"trello-saas-live","account_slug":"zakiraziz","force_ssl":true}'`,
      { cwd: FRONTEND_DIR, encoding: 'utf8' }
    )
  );
  const siteId = site.id;
  const siteUrl = site.ssl_url || site.url;
  console.log(`✅ Site created: ${siteUrl}\n`);

  // Step 4: Link and deploy
  console.log('📤 Deploying to Netlify...');
  execSync(`npx netlify link --id ${siteId}`, { cwd: FRONTEND_DIR, stdio: 'pipe' });
  const deploy = execSync(
    `npx netlify deploy --prod --dir="${DIST_DIR}"`,
    { cwd: FRONTEND_DIR, encoding: 'utf8' }
  );
  console.log(deploy);
  console.log(`\n✅ Deployed successfully!`);
  console.log(`🌍 URL: ${siteUrl}`);
} catch (error) {
  console.log('\n⚠️ Auto-deploy failed, but your site is ready on GitHub.');
  console.log('Just do this:\n');
  console.log('1. Go to https://app.netlify.com');
  console.log('2. Click "Add new site" → "Import an existing project"');
  console.log('3. Select GitHub repo: zakiraziz/Trello-Clone');
  console.log('4. Configure:');
  console.log('   - Base directory: Frontend');
  console.log('   - Build command: npm run build');
  console.log('   - Publish directory: Frontend/dist');
  console.log('5. Add env var: VITE_API_URL = https://your-backend.onrender.com/api');
  console.log('6. Click "Deploy"');
  console.log('\nOR just drag & drop the "Frontend/dist" folder onto netlify.app');
}