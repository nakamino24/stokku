import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const repositoryRoot = resolve(import.meta.dirname, '..');
const docsDirectory = join(repositoryRoot, 'docs');
const markdownFiles = [];

function collectMarkdownFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collectMarkdownFiles(path);
    else if (entry.isFile() && entry.name.endsWith('.md')) markdownFiles.push(path);
  }
}

collectMarkdownFiles(docsDirectory);

const missingReferences = [];
const referencePattern = /\bdocs\/([A-Za-z0-9_./-]+\.md)\b/g;

for (const file of markdownFiles) {
  const contents = readFileSync(file, 'utf8');
  for (const match of contents.matchAll(referencePattern)) {
    const target = join(repositoryRoot, 'docs', match[1]);
    if (!existsSync(target)) {
      missingReferences.push(`${relative(repositoryRoot, file)} -> docs/${match[1]}`);
    }
  }
}

const canonicalDocuments = [
  'README.md',
  'PRD.md',
  'SRS.md',
  'architecture.md',
  'Database.md',
  'API.md',
  'Security.md',
  'UX.md',
  'Operations.md',
  'ProductionReadiness.md',
  'DefinitionOfDone.md',
  'repository-structure.md',
  'adr/README.md',
];

for (const document of canonicalDocuments) {
  if (!existsSync(join(docsDirectory, document))) {
    missingReferences.push(`canonical document missing: docs/${document}`);
  }
}

if (missingReferences.length > 0) {
  console.error('Documentation reference validation failed:');
  for (const reference of missingReferences) console.error(`- ${reference}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation reference validation passed (${markdownFiles.length} Markdown files checked).`);
}
