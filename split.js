const fs = require('fs');

let content = fs.readFileSync('./每天习题背诵.md', 'utf8');
let lines = content.split('\n');

// ====== Step 1: Fix gray text (4+ space indentation) ======
// Strategy: detect code blocks (Java, XML, YAML, etc.) and wrap with ```
// Non-code indented text: remove extra indentation

let result = [];
let inCodeBlock = false;
let codeLang = '';

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let trimmed = line.trimStart();
  let indent = line.length - trimmed.length;

  // Check if this is a code-like line (4+ spaces, looks like code)
  if (indent >= 4 && trimmed.length > 0) {
    // Detect if it's code content
    let isCode = false;

    // Java/class/method keywords
    if (/^(public|private|protected|static|final|class|interface|void|int|String|return|if|for|while|try|catch|throw|new|import|@Override|@Service|@Autowired|@Transactional|@Component|@Configuration|@Bean|@RequestMapping)/.test(trimmed)) {
      isCode = true; codeLang = 'java';
    }
    // Code with braces/semicolons
    else if (/[{;}]\s*$/.test(trimmed) && !/^\d+[.、]/.test(trimmed)) {
      isCode = true;
    }
    // XML/HTML tags
    else if (/^<[/]?[a-zA-Z]/.test(trimmed)) {
      isCode = true; codeLang = 'xml';
    }
    // YAML config lines
    else if (/^(uri|predicates|filters|default-filters|globalcors|corsConfigurations|allowedOrigins|allowedMethods|allowedHeaders|allowCredentials|maxAge|add-to-simple|port|sentinel|cluster|bind|daemonize|replica|protected-mode|databases|logfile|dir|seata|data-source)/.test(trimmed)) {
      isCode = true; codeLang = 'yaml';
    }
    // Lines with typical code patterns
    else if (/^\s*(this\.|super\.|System\.|jdbcTemplate|singleton|single\s*=|if\s*\(|private\s|public\s)/.test(line)) {
      isCode = true;
    }
    // Shell/commands
    else if (/^(Jmap|jps|Jstat|jmap|docker|Docker|redis|\.\/)/.test(trimmed)) {
      isCode = true;
    }
    // Lines inside an already detected code block
    else if (inCodeBlock) {
      isCode = true;
    }

    if (isCode) {
      if (!inCodeBlock) {
        result.push('```' + (codeLang || ''));
        inCodeBlock = true;
      }
      // Dedent: remove common 4-space prefix but keep relative indentation
      let dedented = line;
      if (indent >= 4) {
        dedented = '  '.repeat(Math.floor((indent - 4) / 2)) + trimmed;
      }
      result.push(dedented);
      continue;
    }
  }

  // Check if we need to close code block
  if (inCodeBlock) {
    // Close if: empty line followed by non-code, or non-indented line
    if (indent < 4 && trimmed.length > 0) {
      result.push('```');
      inCodeBlock = false;
      codeLang = '';
    } else if (trimmed.length === 0) {
      // Empty line in code block - keep it but check if next line ends the block
      let nextNonEmpty = i + 1;
      while (nextNonEmpty < lines.length && lines[nextNonEmpty].trimStart().length === 0) nextNonEmpty++;
      if (nextNonEmpty < lines.length) {
        let nextTrimmed = lines[nextNonEmpty].trimStart();
        let nextIndent = lines[nextNonEmpty].length - nextTrimmed.length;
        // If next non-empty line is not code-like, close the block
        if (nextIndent < 4 && nextTrimmed.length > 0) {
          result.push('```');
          inCodeBlock = false;
          codeLang = '';
        }
      }
    }
  }

  // Non-code indented lines: just dedent to max 2 spaces for lists
  if (indent >= 4 && !inCodeBlock && trimmed.length > 0) {
    // Keep list indentation reasonable (2 spaces per level)
    let level = Math.floor(indent / 4);
    result.push('  '.repeat(Math.min(level, 3)) + trimmed);
  } else {
    result.push(line);
  }
}

// Close any remaining code block
if (inCodeBlock) {
  result.push('```');
}

// Also handle standalone code blocks that aren't indented (like the Java classes in the doc)
// These appear as consecutive lines starting with keywords like "public class"
content = result.join('\n');

// ====== Step 2: Fix non-indented code blocks ======
// Detect Java/XML/YAML blocks that aren't indented and wrap them
let lines2 = content.split('\n');
let result2 = [];
let inBlock = false;
let blockLang = '';
let blockLines = [];

// Patterns that indicate start of a code block
const codeStartPatterns = [
  { regex: /^public\s+class\s/, lang: 'java' },
  { regex: /^@Service$/, lang: 'java' },
  { regex: /^@Component$/, lang: 'java' },
  { regex: /^private\s+/, lang: 'java' },
  { regex: /^public\s+static\s/, lang: 'java' },
  { regex: /^<resultMap/, lang: 'xml' },
  { regex: /^<select/, lang: 'xml' },
  { regex: /^<insert/, lang: 'xml' },
  { regex: /^<mapper/, lang: 'xml' },
  { regex: /^<configuration>/, lang: 'xml' },
  { regex: /^<setting/, lang: 'xml' },
  { regex: /^gateway:/, lang: 'yaml' },
  { regex: /^routes:/, lang: 'yaml' },
];

const codeContinuePatterns = [
  /^\s*$/,  // empty lines
  /^\s*public\s/, /^\s*private\s/, /^\s*protected\s/, /^\s*static\s/,
  /^\s*return\s/, /^\s*if\s*\(/, /^\s*}\s*$/, /^\s*{\s*$/,
  /^\s*@/, /^\s*\/\/.*$/, /^\s*this\./, /^\s*super\./,
  /^\s*void\s/, /^\s*int\s/, /^\s*String\s/,
  /^\s*<[/]?[a-zA-Z]/, /^\s*gateway:/, /^\s*routes:/,
  /^\s*-\s*(id|uri|predicates|filters|path)/i,
  /^\s*SELECT\s/i, /^\s*FROM\s/i, /^\s*WHERE\s/i,
  /^\s*INSERT\s/i, /^\s*VALUES\s/i, /^\s*CREATE\s/i,
  /^\s*jdbcTemplate/, /^\s*throw\s/,
  /^\s*port\s/, /^\s*sentinel\s/, /^\s*cluster/,
  /^\s*bind\s/, /^\s*daemonize/, /^\s*protected-mode/,
  /^\s*databases\s/, /^\s*logfile\s/, /^\s*dir\s/,
  /^\s*replica-/, /^\s*seata:/, /^\s*data-source/,
  /^\s*\.\/redis/,
];

for (let i = 0; i < lines2.length; i++) {
  let line = lines2[i];
  let trimmed = line.trimStart();

  // Check if this line starts a code block
  let startLang = '';
  for (let p of codeStartPatterns) {
    if (p.regex.test(trimmed)) {
      startLang = p.lang;
      break;
    }
  }

  if (!inBlock && startLang) {
    // Look ahead to see if next few lines are also code
    let codeCount = 0;
    for (let j = i + 1; j < Math.min(i + 5, lines2.length); j++) {
      let t = lines2[j].trimStart();
      for (let cp of codeContinuePatterns) {
        if (cp.test(lines2[j])) { codeCount++; break; }
      }
    }
    if (codeCount >= 2 || startLang === 'java') {
      inBlock = true;
      blockLang = startLang;
      result2.push('```' + blockLang);
      result2.push(line);
      continue;
    }
  }

  if (inBlock) {
    // Check if line continues code
    let isContinue = false;
    for (let cp of codeContinuePatterns) {
      if (cp.test(line)) { isContinue = true; break; }
    }
    // Also check specific patterns
    if (/^\s*\}/.test(line)) isContinue = true;
    if (/^\s*\)/.test(line)) isContinue = true;

    if (isContinue) {
      result2.push(line);
      continue;
    } else {
      // End of code block
      result2.push('```');
      inBlock = false;
      result2.push(line);
      continue;
    }
  }

  result2.push(line);
}

if (inBlock) result2.push('```');

content = result2.join('\n');

// ====== Step 3: Clean up multiple blank lines ======
content = content.replace(/\n{3,}/g, '\n\n');

// ====== Step 4: Split by chapters ======
const chapters = [];
const chapterPattern = /^# (.+)$/gm;
let match;
let chapterPositions = [];

while ((match = chapterPattern.exec(content)) !== null) {
  chapterPositions.push({ title: match[1], start: match.index });
}

// Add end position
for (let i = 0; i < chapterPositions.length; i++) {
  let start = chapterPositions[i].start;
  let end = i < chapterPositions.length.length - 1 ? chapterPositions[i + 1].start : content.length;
  // Actually find end: next chapter start or end of file
  end = i + 1 < chapterPositions.length ? chapterPositions[i + 1].start : content.length;
  let chapterContent = content.substring(start, end).trim();

  // Remove the # heading from content (it becomes the filename)
  let lines = chapterContent.split('\n');
  // Keep the # heading as first line

  chapters.push({
    title: chapterPositions[i].title,
    content: chapterContent + '\n'
  });
}

// Create output directory
const outputDir = './每天习题背诵';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Map chapter titles to filenames
const filenameMap = {
  'Java 基础相关知识：': 'Java基础.md',
  'Spring 框架 知识：': 'Spring框架.md',
  'Springboot相关知识：': 'SpringBoot.md',
  'Springcloud 相关知识：': 'SpringCloud.md',
  'Springmvc 相关知识：': 'SpringMVC.md',
  'Mybatis 相关知识：': 'Mybatis.md',
  'Mysql 相关知识：': 'MySQL.md',
  'Docker和Linux 相关知识：': 'Docker和Linux.md',
  '微服务组件相关知识：': '微服务组件.md',
  'Sentinel相关：': 'Sentinel.md',
  '微服务如何进行分布式事务处理？': '分布式事务.md',
  'Redis 缓存相关：': 'Redis.md',
};

// Write chapter files
for (let ch of chapters) {
  let filename = filenameMap[ch.title] || ch.title.replace(/[：:?？]/g, '') + '.md';
  let filepath = outputDir + '/' + filename;
  fs.writeFileSync(filepath, ch.content, 'utf8');
  console.log(`Created: ${filename} (${ch.content.length} bytes)`);
}

// Also create an index/overview file
let indexContent = '# 每天习题背诵\n\n';
for (let ch of chapters) {
  let filename = filenameMap[ch.title] || ch.title.replace(/[：:?？]/g, '') + '.md';
  indexContent += `- [[${filename.replace('.md', '')}|${ch.title}]]\n`;
}
fs.writeFileSync(outputDir + '/README.md', indexContent, 'utf8');
console.log(`\nCreated: README.md (index)`);

// Remove original single file
fs.unlinkSync('./每天习题背诵.md');
console.log('\nRemoved original 每天习题背诵.md');
