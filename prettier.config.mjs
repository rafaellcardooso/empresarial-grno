/** @type {import("prettier").Config} */
const config = {
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  printWidth: 100,
  endOfLine: "lf",
  overrides: [
    {
      files: ["*.mdc"],
      options: { parser: "markdown" },
    },
  ],
};

export default config;
