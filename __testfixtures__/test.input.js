import { styleText } from "node:util";

console.log(styleText("red", 'Hello'));
console.log(styleText(["blue", "bold"], 'World'));
console.log(styleText("green", 'Picocolors'));
console.log(styleText(["yellow", "dim"], 'Mixed'));

// Nested calls
console.log(styleText("red", styleText("blue", 'Nested')));

// Multiple arguments
console.log(styleText("cyan", 'Hello' + " " + 'World' + " " + 'Test'));
