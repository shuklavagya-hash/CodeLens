// parserService.js
// =====================================================================
// KAAM: Ek file ke andar se "kis-kis doosri file ko import/require kiya
// gaya hai" nikalna. Ye humein per-file dependency list deta hai, jisse
// baad mein graphService poora graph banata hai.
//
// NOTE (important decision): Humne yahan tree-sitter (real AST parser)
// use NAHI kiya — kyunki uska native build Windows pe bahut friction
// deta hai (Visual Studio Build Tools chahiye hote hain). Iski jagah
// regex use kar rahe hain — thoda kam "perfect" hai (comments/strings
// ke andar likhe fake imports ko bhi pakad sakta hai kabhi-kabhi), lekin
// 95% real-world code ke liye reliably kaam karta hai aur installation
// mein zero risk hai. Hackathon ke liye ye sahi trade-off hai.
// =====================================================================

// Ye regex 2 patterns pakadta hai:
// 1) import X from './something'   (ES modules)
// 2) require('./something')         (CommonJS)
const IMPORT_REGEX = /import\s+(?:.+?\s+from\s+)?['"](.+?)['"]/g;
const REQUIRE_REGEX = /require\(\s*['"](.+?)['"]\s*\)/g;

/**
 * Ek file ke content se saare imported paths nikaalta hai.
 * @param {string} fileContent - file ka poora text
 * @returns {string[]} - jaise ['./sessionService.js', '../utils/foo']
 */
export function extractImportPaths(fileContent) {
  const paths = new Set();

  // Global regex ko baar-baar exec karna padta hai saare matches ke liye
  let match;
  while ((match = IMPORT_REGEX.exec(fileContent)) !== null) {
    paths.add(match[1]);
  }
  while ((match = REQUIRE_REGEX.exec(fileContent)) !== null) {
    paths.add(match[1]);
  }

  // Sirf relative imports rakhte hain (./ ya ../ se shuru hone wale)
  // — npm packages (jaise 'express') ko graph mein nahi dikhana,
  // wo humare apne codebase ka hissa nahi hain.
  return Array.from(paths).filter((p) => p.startsWith('.') || p.startsWith('/'));
}

/**
 * Ek imported path (jaise './services/sessionService.js' ya '../foo')
 * ko match karta hai uploaded files ki list mein se sahi file se.
 * Matching filename ke aakhri hisse (basename) se hoti hai, kyunki
 * upload karte waqt poora folder-structure preserve nahi hota.
 *
 * @param {string} importPath - jo import statement se mila
 * @param {string[]} allFileNames - saari uploaded files ke naam
 * @returns {string|null} - matched fileName, ya null agar kuch na mile
 */
export function resolveImportToFile(importPath, allFileNames) {
  // './sessionService.js' -> 'sessionService.js'
  // '../services/foo'     -> 'foo'
  const cleaned = importPath.replace(/^[./]+/, '');
  const baseName = cleaned.split('/').pop();

  // Extension ke saath aur bina extension ke, dono try karte hain
  const candidates = [baseName, `${baseName}.js`, `${baseName}.jsx`, `${baseName}.ts`];

  for (const fileName of allFileNames) {
    // fileName kabhi poora path ho sakta hai (jaise "services/sessionService.js"),
    // isliye uska bhi basename nikaal ke compare karte hain
    const fileBaseName = fileName.split('/').pop();
    if (candidates.includes(fileBaseName)) {
      return fileName;
    }
  }

  return null; // is import ka koi match uploaded files mein nahi mila (external package ho sakta hai)
}
