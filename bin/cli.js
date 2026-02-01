#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
chalk-to-native - Migrate chalk/picocolors to native Node.js styleText

Usage:
  npx chalk-to-native <path> [options]

Examples:
  npx chalk-to-native src/
  npx chalk-to-native src/index.js
  npx chalk-to-native src/ --dry
  npx chalk-to-native src/ --print

Options:
  --dry      Dry run (don't modify files)
  --print    Print transformed output
  --help     Show this help message
`);
    process.exit(0);
}

if (args.includes('--help')) {
    console.log(`
chalk-to-native - Migrate chalk/picocolors to native Node.js styleText

Usage:
  npx chalk-to-native <path> [options]

Examples:
  npx chalk-to-native src/
  npx chalk-to-native src/index.js
  npx chalk-to-native src/ --dry

Options:
  --dry      Dry run (don't modify files)
  --print    Print transformed output
  --help     Show this help message
`);
    process.exit(0);
}

const transformPath = path.join(__dirname, '..', 'transform.js');
const command = `npx jscodeshift -t "${transformPath}" ${args.join(' ')}`;

try {
    execSync(command, { stdio: 'inherit' });
} catch (error) {
    process.exit(1);
}
