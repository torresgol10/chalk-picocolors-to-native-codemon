
import { describe, it, expect } from 'vitest';
import { runInlineTest } from 'jscodeshift/dist/testUtils';
import transform from '../transform';

describe('chalk-to-native', () => {
  it('transforms chalk and picocolor to styleText', () => {
    const input = `
      import chalk from 'chalk';
      import pc from 'picocolor';
      console.log(chalk.red('Hello'));
      console.log(pc.blue('World'));
      console.log(chalk.bold.red('Chained'));
    `;

    // Note: The imports will be replaced, and new import added at top.
    // Order might vary, but logic should hold.
    const expectedOutput = `
      import { styleText } from "node:util";
      console.log(styleText('red', 'Hello'));
      console.log(styleText('blue', 'World'));
      console.log(styleText(['bold', 'red'], 'Chained'));
    `;

    // jscodeshift testUtils might be finicky with whitespace, 
    // but let's try standard testUtils first or just mock it if needed.
    // Actually runInlineTest is Jest specific often (DefinePlugin etc), 
    // but maybe works in Vitest if global 'jest' is not needed.
    // If it fails, we can just use the transform function directly.

    // Let's use logic directly if runInlineTest is not available or tailored for Jest.
    // runInlineTest(module, options, input, expectedOutput, options);

    // Testing low-level avoid jest dep:
    const jscodeshift = require('jscodeshift');
    const api = {
      jscodeshift,
      stats: () => { }
    };
    const out = transform({ source: input }, api);

    // Normalize whitespace for comparison
    const normalize = str => str.replace(/\s+/g, ' ').replace(/'/g, '"').trim();
    const normalizedOut = normalize(out);

    expect(normalizedOut).toContain('import { styleText } from "node:util"');
    expect(normalizedOut).toContain('styleText("red", "Hello")');
    expect(normalizedOut).toContain('styleText("blue", "World")');
    expect(normalizedOut).toContain('styleText(["bold", "red"], "Chained")');
  });
});
