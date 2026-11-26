const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = (process.argv[2] || '').toLowerCase().trim();

const mapping = {
  mysql: 'schema.mysql.prisma',
  postgres: 'schema.postgresql.prisma',
  postgresql: 'schema.postgresql.prisma',
};

const schemaFileName = mapping[target];

if (!schemaFileName) {
  console.error('Invalid database target specified.');
  console.log('Usage: npm run db:switch <mysql|postgres>');
  console.log('Examples:');
  console.log('  npm run db:use:mysql');
  console.log('  npm run db:use:postgres');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'prisma', schemaFileName);
const destinationPath = path.join(rootDir, 'prisma', 'schema.prisma');

if (!fs.existsSync(sourcePath)) {
  console.error(`Source schema file not found: ${sourcePath}`);
  process.exit(1);
}

// Copy the selected database schema to schema.prisma
fs.copyFileSync(sourcePath, destinationPath);
console.log(`[OK] Switched active schema (prisma/schema.prisma) -> ${schemaFileName}`);

// Regenerate Prisma client
try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });
  console.log(`[SUCCESS] Database provider successfully switched to ${target.toUpperCase()}!`);
} catch (error) {
  const combined = (error.stdout?.toString() || '') + (error.stderr?.toString() || '') + (error.message || '');
  if (combined.includes('EPERM')) {
    console.warn('\n[NOTE] Windows file lock detected: The Next.js dev server has the Prisma binary loaded in memory.');
    console.warn('The schema file was updated successfully. When you restart the dev server, run:');
    console.warn('  npx prisma generate');
  } else {
    console.error('[FAILED] Failed to regenerate Prisma Client:', error.message);
  }
}

console.log('\nMake sure your DATABASE_URL in .env matches:');
if (target === 'mysql') {
  console.log('  DATABASE_URL="mysql://admin:admin@localhost:3306/db"');
} else {
  console.log('  DATABASE_URL="postgresql://safebd:safebd@localhost:5432/safebd?schema=public"');
}
