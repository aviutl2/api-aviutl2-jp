export function dedent(text: string): string {
  const lines = text.split("\n");
  const trimmedLines = lines.map((line) => line.trimEnd());

  // Remove leading empty lines
  while (trimmedLines.length > 0 && trimmedLines[0].trim() === "") {
    trimmedLines.shift();
  }
  // Remove trailing empty lines
  while (trimmedLines.length > 0 && trimmedLines[trimmedLines.length - 1].trim() === "") {
    trimmedLines.pop();
  }

  // Find the minimum indentation
  const indentLengths = trimmedLines
    .filter((line) => line.trim().length > 0)
    .map((line) => line.match(/^(\s*)/)![1].length);
  const minIndent = Math.min(...indentLengths);

  // Remove the minimum indentation from each line
  const dedentedLines = trimmedLines.map((line) => line.slice(minIndent));

  return dedentedLines.join("\n");
}
