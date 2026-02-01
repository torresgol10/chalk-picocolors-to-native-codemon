/**
 * This codemod migrates `chalk` and `picocolors` usage to native Node.js `styleText`.
 *
 * It transforms:
 *   - Imports/Requires: `import chalk from 'chalk'` -> `import { styleText } from 'node:util'`
 *   - Basic Usage: `chalk.red('text')` -> `styleText('red', 'text')`
 *   - Chained Usage: `chalk.red.bold('text')` -> `styleText(['red', 'bold'], 'text')`
 *   - Multiple args: `chalk.red('a', 'b')` -> `styleText('red', 'a' + ' ' + 'b')`
 *   - Nested calls: `chalk.red(chalk.blue('text'))` -> properly transforms inner first
 */

module.exports = function (file, api) {
    const j = api.jscodeshift;
    const root = j(file.source);
    let hasModifications = false;
    let addedStyleTextImport = false;
    let importType = 'esm'; // 'esm' or 'cjs'

    // Helper to find and remove imports/requires
    const findImports = (pkgName) => {
        let localNames = [];

        // ESM Imports
        root.find(j.ImportDeclaration, { source: { value: pkgName } }).forEach((path) => {
            if (path.value.specifiers) {
                path.value.specifiers.forEach((specifier) => {
                    if (specifier.type === 'ImportDefaultSpecifier' || specifier.type === 'ImportNamespaceSpecifier') {
                        localNames.push(specifier.local.name);
                    }
                });
            }
            j(path).remove();
            hasModifications = true;
            importType = 'esm';
        });

        // CJS Requires
        root.find(j.VariableDeclarator, {
            init: {
                callee: { name: 'require' },
                arguments: [{ value: pkgName }]
            }
        }).forEach((path) => {
            if (path.value.id.type === 'Identifier') {
                localNames.push(path.value.id.name);

                // Check if we should remove the entire declaration or just the declarator
                const varDeclaration = j(path).closest(j.VariableDeclaration);
                if (varDeclaration.size() > 0 && varDeclaration.get().node.declarations.length === 1) {
                    varDeclaration.remove();
                } else {
                    j(path).remove();
                }
                hasModifications = true;
                importType = 'cjs';
            }
        });

        return localNames;
    };

    // Find imports for chalk and picocolors (with 's')
    const chalkNames = findImports('chalk');
    const picocolorsNames = findImports('picocolors');
    // Also support legacy "picocolor" without 's' for backwards compatibility
    const picocolorNames = findImports('picocolor');
    const allNames = [...chalkNames, ...picocolorsNames, ...picocolorNames];

    if (allNames.length === 0) {
        return root.toSource();
    }

    // Helper to collect modifiers from a MemberExpression chain
    const collectModifiers = (node, modifiers = []) => {
        if (node.type === 'MemberExpression') {
            modifiers.unshift(node.property.name);
            return collectModifiers(node.object, modifiers);
        } else if (node.type === 'Identifier') {
            return { name: node.name, modifiers };
        }
        return null;
    };

    // Helper to create concatenation of multiple arguments with spaces
    const createConcatenatedArgs = (args) => {
        if (args.length === 1) {
            return args[0];
        }

        // Create: arg1 + ' ' + arg2 + ' ' + arg3 ...
        let result = args[0];
        for (let i = 1; i < args.length; i++) {
            // result + ' '
            result = j.binaryExpression('+', result, j.literal(' '));
            // (result + ' ') + args[i]
            result = j.binaryExpression('+', result, args[i]);
        }
        return result;
    };

    // Transform calls - process innermost first by sorting by depth
    const callExpressions = [];
    root.find(j.CallExpression).forEach((path) => {
        const callee = path.value.callee;
        if (callee.type === 'MemberExpression') {
            const result = collectModifiers(callee);
            if (result && allNames.includes(result.name)) {
                // Calculate depth (number of ancestors)
                let depth = 0;
                let p = path;
                while (p.parent) {
                    depth++;
                    p = p.parent;
                }
                callExpressions.push({ path, result, depth });
            }
        }
    });

    // Sort by depth descending (deepest/innermost first)
    callExpressions.sort((a, b) => b.depth - a.depth);

    // Now transform in order (innermost first)
    callExpressions.forEach(({ path, result }) => {
        const args = path.value.arguments;
        if (args.length === 0) return;

        // Create styleText call
        let formatArg;
        if (result.modifiers.length === 1) {
            formatArg = j.literal(result.modifiers[0]);
        } else {
            formatArg = j.arrayExpression(result.modifiers.map(m => j.literal(m)));
        }

        // Handle multiple arguments by concatenating with spaces
        const textArg = createConcatenatedArgs(args);

        const newCall = j.callExpression(
            j.identifier('styleText'),
            [formatArg, textArg]
        );

        j(path).replaceWith(newCall);
        hasModifications = true;
        addedStyleTextImport = true;
    });

    // Add Import/Require for styleText
    if (addedStyleTextImport) {
        if (importType === 'esm') {
            const existingImport = root.find(j.ImportDeclaration, { source: { value: 'node:util' } });
            if (existingImport.size() > 0) {
                const hasStyleText = existingImport.find(j.ImportSpecifier, { imported: { name: 'styleText' } }).size() > 0;
                if (!hasStyleText) {
                    existingImport.get(0).node.specifiers.push(j.importSpecifier(j.identifier('styleText')));
                }
            } else {
                const newImport = j.importDeclaration(
                    [j.importSpecifier(j.identifier('styleText'))],
                    j.literal('node:util')
                );
                root.get().node.program.body.unshift(newImport);
            }
        } else {
            const newRequire = j.variableDeclaration('const', [
                j.variableDeclarator(
                    j.objectPattern([j.property.from({
                        kind: 'init',
                        key: j.identifier('styleText'),
                        value: j.identifier('styleText'),
                        shorthand: true
                    })]),
                    j.callExpression(j.identifier('require'), [j.literal('node:util')])
                )
            ]);
            root.get().node.program.body.unshift(newRequire);
        }
    }

    return root.toSource();
};
