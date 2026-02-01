# chalk-to-native

> 🚀 Codemod to migrate from `chalk` and `picocolors` to Node.js native `util.styleText`

[![Node.js](https://img.shields.io/badge/Node.js-v22.9+-green.svg)](https://nodejs.org/)

## ¿Por qué migrar?

Node.js v21.7+ y v22.9+ incluyen `util.styleText`, una API nativa para estilizar texto en la terminal. Esto permite eliminar dependencias externas como `chalk` o `picocolors`.

## 🚀 Uso rápido (sin instalar nada)

```bash
npx chalk-to-native src/
```

## 🔧 Ejemplos de uso

### Transformar un archivo específico

```bash
npx chalk-to-native ruta/al/archivo.js
```

### Transformar un directorio completo

```bash
npx chalk-to-native src/
```

### Modo dry-run (sin modificar archivos)

```bash
npx chalk-to-native src/ --dry
```

### Ver output transformado

```bash
npx chalk-to-native src/ --print
```

## ✨ Transformaciones

Este codemod transforma automáticamente:

| Antes (chalk/picocolors) | Después (nativo) |
|--------------------------|------------------|
| `import chalk from 'chalk'` | `import { styleText } from 'node:util'` |
| `const chalk = require('chalk')` | `const { styleText } = require('node:util')` |
| `chalk.red('texto')` | `styleText('red', 'texto')` |
| `chalk.red.bold('texto')` | `styleText(['red', 'bold'], 'texto')` |
| `chalk.red('a', 'b', 'c')` | `styleText('red', 'a' + ' ' + 'b' + ' ' + 'c')` |

## 📌 Ejemplo completo

**Entrada:**
```javascript
import chalk from 'chalk';

console.log(chalk.red('Error!'));
console.log(chalk.green.bold('Success!'));
```

**Salida:**
```javascript
import { styleText } from 'node:util';

console.log(styleText('red', 'Error!'));
console.log(styleText(['green', 'bold'], 'Success!'));
```

## 🧪 Tests

```bash
npm test
```

## 📖 Requisitos

- **Node.js v22.9+** (para `util.styleText` estable)
- O **Node.js v21.7+** (experimental con `--experimental-text-formatting`)

## 🎨 Estilos soportados

Todos los modificadores de `chalk` están soportados por `styleText`:

- **Colores**: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`
- **Fondos**: `bgBlack`, `bgRed`, `bgGreen`, `bgYellow`, `bgBlue`, `bgMagenta`, `bgCyan`, `bgWhite`
- **Modificadores**: `bold`, `dim`, `italic`, `underline`, `inverse`, `strikethrough`

## 📄 Licencia

ISC
