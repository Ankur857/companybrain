import JSZip from 'jszip';
import path from 'path';

export class ArchiveService {
  /**
   * File extensions permitted for source code & documentation extraction
   */
  static ALLOWED_EXTENSIONS = new Set([
    '.md', '.markdown', '.txt',
    '.json', '.yaml', '.yml', '.toml', '.xml',
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp', '.cs',
    '.sql', '.prisma',
    '.html', '.css',
    '.sh', '.bash', '.env.example', 'dockerfile'
  ]);

  /**
   * Directories strictly excluded from code extraction to avoid noise
   */
  static IGNORED_DIRECTORIES = [
    'node_modules',
    'vendor',
    '.git',
    '.github',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'out',
    'coverage',
    '.vscode',
    '.idea',
    '__pycache__',
    '.pytest_cache',
    '.venv',
    'env',
    'target',
    'bin',
    'obj'
  ];

  /**
   * Files strictly ignored (lockfiles, binary metadata, system files)
   */
  static IGNORED_FILES = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'composer.lock',
    'pipfile.lock',
    'poetry.lock',
    '.ds_store',
    'thumbs.db'
  ];

  /**
   * Max size for an individual source file extracted (e.g. 500 KB)
   */
  static MAX_FILE_SIZE = 500 * 1024;

  /**
   * Unpacks a repository zip buffer and extracts key documents and code
   *
   * @param {Buffer|ArrayBuffer|string} zipInput - Zip buffer or base64 string
   * @param {Object} options - Options for extraction
   * @param {string} options.repositoryName - Optional custom repository name
   * @returns {Promise<{ repositoryName: string, totalFiles: number, manifest: Object, files: Array }>}
   */
  static async unpackRepositoryZip(zipInput, options = {}) {
    let buffer = zipInput;
    if (typeof zipInput === 'string') {
      // Clean data URL prefix if present
      const base64Data = zipInput.replace(/^data:.*?;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    }

    const zip = await JSZip.loadAsync(buffer);
    const extractedFiles = [];
    const treeList = [];
    let detectedRepoName = options.repositoryName || 'GitHub Repository';
    let packageInfo = null;

    const entries = Object.keys(zip.files);
    
    // Check if zip is wrapped in a top-level folder (standard for GitHub archive downloads)
    const firstSlashIndex = entries[0]?.indexOf('/');
    const commonPrefix = firstSlashIndex !== -1 ? entries[0].slice(0, firstSlashIndex + 1) : '';
    const hasCommonPrefix = commonPrefix && entries.every(e => e.startsWith(commonPrefix));

    for (const rawPath of entries) {
      const fileEntry = zip.files[rawPath];
      if (fileEntry.dir) continue;

      // Strip common root folder if downloaded directly from GitHub (e.g. 'repo-main/')
      let cleanPath = hasCommonPrefix ? rawPath.slice(commonPrefix.length) : rawPath;
      cleanPath = cleanPath.replace(/^\/+/, '');
      if (!cleanPath) continue;

      const pathParts = cleanPath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const lowerFileName = fileName.toLowerCase();
      const ext = path.extname(cleanPath).toLowerCase();

      // Skip ignored directories
      const hasIgnoredDir = pathParts.some((part) =>
        ArchiveService.IGNORED_DIRECTORIES.includes(part.toLowerCase())
      );
      if (hasIgnoredDir) continue;

      // Skip ignored specific files
      if (ArchiveService.IGNORED_FILES.includes(lowerFileName)) continue;

      // Skip binary and non-text files
      const isAllowedExt =
        ArchiveService.ALLOWED_EXTENSIONS.has(ext) ||
        lowerFileName === 'dockerfile' ||
        lowerFileName.startsWith('dockerfile.') ||
        lowerFileName === 'makefile' ||
        lowerFileName === 'procfile';

      if (!isAllowedExt) continue;

      // Read file content
      const content = await fileEntry.async('string');
      if (!content || content.trim().length === 0) continue;
      if (content.length > ArchiveService.MAX_FILE_SIZE) continue;

      // Check for package.json to discover repository name and scripts
      if (lowerFileName === 'package.json' && pathParts.length === 1) {
        try {
          packageInfo = JSON.parse(content);
          if (packageInfo.name && !options.repositoryName) {
            detectedRepoName = packageInfo.name;
          }
        } catch (_) {}
      }

      // Categorize file
      const category = ArchiveService.categorizeFile(cleanPath, lowerFileName);

      treeList.push({ path: cleanPath, category });

      extractedFiles.push({
        path: cleanPath,
        fileName,
        title: `${cleanPath}`,
        category,
        content,
        sizeBytes: content.length,
        extension: ext || 'text'
      });
    }

    // Generate Repository Architecture Manifest
    const manifest = ArchiveService.buildRepositoryManifest({
      repoName: detectedRepoName,
      extractedFiles,
      treeList,
      packageInfo
    });

    const categoryBreakdown = {};
    for (const f of extractedFiles) {
      categoryBreakdown[f.category] = (categoryBreakdown[f.category] || 0) + 1;
    }

    return {
      repositoryName: detectedRepoName,
      totalFiles: extractedFiles.length,
      manifest,
      files: extractedFiles,
      categoryBreakdown
    };
  }

  /**
   * Categorize source file based on path and purpose
   */
  static categorizeFile(filePath, lowerFileName) {
    const p = filePath.toLowerCase();

    if (
      lowerFileName.includes('readme') ||
      lowerFileName.includes('architecture') ||
      lowerFileName.includes('contributing') ||
      lowerFileName.includes('license') ||
      p.includes('/docs/') ||
      p.includes('/doc/')
    ) {
      return 'Documentation';
    }

    if (
      p.endsWith('.sql') ||
      lowerFileName.includes('schema') ||
      p.includes('/models/') ||
      p.includes('/model/') ||
      p.includes('/entities/') ||
      p.includes('/migrations/') ||
      lowerFileName.endsWith('.prisma')
    ) {
      return 'Database & Schema';
    }

    if (
      p.includes('/routes/') ||
      p.includes('/route/') ||
      p.includes('/controllers/') ||
      p.includes('/controller/') ||
      p.includes('/api/') ||
      p.includes('/endpoints/') ||
      p.includes('/handlers/')
    ) {
      return 'API Routes & Endpoints';
    }

    if (
      lowerFileName === 'package.json' ||
      lowerFileName === 'dockerfile' ||
      lowerFileName.includes('docker-compose') ||
      lowerFileName === 'requirements.txt' ||
      lowerFileName === 'go.mod' ||
      lowerFileName === 'pom.xml' ||
      lowerFileName.endsWith('.yaml') ||
      lowerFileName.endsWith('.yml') ||
      lowerFileName.includes('tsconfig') ||
      lowerFileName.includes('.env.example')
    ) {
      return 'Configuration & Deployment';
    }

    return 'Source Code';
  }

  /**
   * Builds an executive Repository Architecture Manifest document
   */
  static buildRepositoryManifest({ repoName, extractedFiles, treeList, packageInfo }) {
    const categories = {
      'Documentation': [],
      'Configuration & Deployment': [],
      'Database & Schema': [],
      'API Routes & Endpoints': [],
      'Source Code': []
    };

    for (const f of extractedFiles) {
      if (categories[f.category]) {
        categories[f.category].push(f.path);
      }
    }

    const dependencies = packageInfo?.dependencies ? Object.keys(packageInfo.dependencies).slice(0, 15) : [];
    const devDependencies = packageInfo?.devDependencies ? Object.keys(packageInfo.devDependencies).slice(0, 10) : [];
    const scripts = packageInfo?.scripts ? Object.entries(packageInfo.scripts) : [];

    const content = `# Repository Architecture Manifest: ${repoName}

## 1. Executive Summary
- **Repository Name:** ${repoName}
- **Description:** ${packageInfo?.description || 'Extracted GitHub codebase ingested into CompanyBrain Project Intelligence.'}
- **Total Ingested Source Files:** ${extractedFiles.length}

## 2. Technology Stack & Dependencies
${dependencies.length > 0 ? `### Core Dependencies:\n${dependencies.map(d => `- \`${d}\``).join('\n')}\n` : ''}
${devDependencies.length > 0 ? `### Developer Tooling:\n${devDependencies.map(d => `- \`${d}\``).join('\n')}\n` : ''}
${scripts.length > 0 ? `### Run & Build Scripts:\n${scripts.map(([name, cmd]) => `- \`npm run ${name}\`: ${cmd}`).join('\n')}\n` : ''}

## 3. Structural Breakdown by Category
### Documentation (${categories['Documentation'].length} files):
${categories['Documentation'].slice(0, 15).map(p => `- \`${p}\``).join('\n') || '- None detected'}

### Database & Schemas (${categories['Database & Schema'].length} files):
${categories['Database & Schema'].slice(0, 20).map(p => `- \`${p}\``).join('\n') || '- None detected'}

### API Routes & Controllers (${categories['API Routes & Endpoints'].length} files):
${categories['API Routes & Endpoints'].slice(0, 25).map(p => `- \`${p}\``).join('\n') || '- None detected'}

### Configuration & CI/CD (${categories['Configuration & Deployment'].length} files):
${categories['Configuration & Deployment'].slice(0, 15).map(p => `- \`${p}\``).join('\n') || '- None detected'}

### Core Source Code (${categories['Source Code'].length} files):
${categories['Source Code'].slice(0, 30).map(p => `- \`${p}\``).join('\n')}
${categories['Source Code'].length > 30 ? `*...and ${categories['Source Code'].length - 30} more source files.*` : ''}
`;

    return {
      title: `${repoName} - Architecture & Repository Manifest`,
      content,
      category: 'Documentation',
      source_type: 'github_zip',
      classification: 'INTERNAL'
    };
  }
}
