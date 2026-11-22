// Vite inlines a stylesheet as its text when the import ends in `?raw`; this declares that module shape
// for the type checker. It has no runtime effect.
declare module "*.css?raw" {
  const content: string;
  export default content;
}
