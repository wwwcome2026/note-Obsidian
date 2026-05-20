const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// ============================================================
// Step 1: Convert docx to raw markdown, extract images
// ============================================================
mammoth.convertToMarkdown({path: './temp_input.docx'})
  .then(result => {
    let content = result.value;

    // Extract base64 images to files
    const imgDir = './每天习题背诵/每天习题背诵_assets';
    if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

    let imgIndex = 0;
    content = content.replace(/!\[([^\]]*)\]\(data:image\/(png|jpeg|jpg|gif);base64,([A-Za-z0-9+/=]+)\)/g, (match, alt, ext, b64) => {
      imgIndex++;
      const filename = `image_${String(imgIndex).padStart(2, '0')}.${ext === 'jpeg' ? 'jpg' : ext}`;
      fs.writeFileSync(path.join(imgDir, filename), Buffer.from(b64, 'base64'));
      return `![${alt}](每天习题背诵_assets/${filename})`;
    });
    console.log(`Extracted ${imgIndex} images`);

    // ============================================================
    // Step 2: Clean up mammoth escaping
    // ============================================================
    content = content.replace(/\\\(/g, '(');
    content = content.replace(/\\\)/g, ')');
    content = content.replace(/\\\./g, '.');
    content = content.replace(/\\-/g, '-');
    content = content.replace(/\\\{/g, '{');
    content = content.replace(/\\\}/g, '}');
    content = content.replace(/\\\*/g, '*');
    content = content.replace(/\\_/g, '_');
    content = content.replace(/\\>/g, '→');
    content = content.replace(/🡪/g, '→');

    // Fix numbered headings
    content = content.replace(/^(#+)\s+(\d+)\\\.\s*/gm, '$1 $2. ');

    // Fix __text__ → **text**
    content = content.replace(/____([^_]+?)____/g, '**$1**');
    content = content.replace(/__([^_]+?)__/g, '**$1**');
    content = content.replace(/\*\*__([^_]+?)__\*\*/g, '**$1**');
    content = content.replace(/__\*\*([^*]+?)\*\*__/g, '**$1**');

    // Fix leftover **** markers
    content = content.replace(/\*{4,}/g, '**');

    // Fix B+Tree
    content = content.replace(/B\\?\+Tree/g, 'B+Tree');

    // Fix (+、-、*、/)
    content = content.replace(/（\\?\+、-、\*、\/）/g, '（+、-、*、/）');

    // Clean up multiple blank lines
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.split('\n').map(l => l.trimEnd()).join('\n').trimEnd() + '\n';

    // ============================================================
    // Step 3: Fix gray text - detect and wrap code blocks with ```
    // ============================================================
    // Strategy: scan line by line, detect consecutive "code-like" lines
    // and wrap them with ``` fences. Everything else gets de-indented.

    const lines = content.split('\n');
    const output = [];

    // A line is "code-like" if it's indented >= 4 spaces AND matches code patterns
    function isCodeLike(line) {
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;
      if (indent < 4 || trimmed.length === 0) return false;

      // Java / code keywords
      if (/^(public |private |protected |static |final |class |interface |void |return |if\s*\(|for\s*\(|while\s*\(|try\s*{|catch\s*\(|throw |new |import |@Override|@Service|@Autowired|@Transactional|@Component|@Configuration|@Bean|@RequestMapping|@Aspect|@Pointcut|@Before|@After|@Around|@PostConstruct|@PreDestroy|@RefreshScope|@Value|@Param|@Mapper)/.test(trimmed)) return true;
      // Ends with { } ; typical code
      if (/[{};]\s*$/.test(trimmed) && !/^\d+[.、）)]/.test(trimmed) && !/^答[：:]/.test(trimmed)) return true;
      // XML/HTML
      if (/^<[/]?[a-zA-Z]/.test(trimmed)) return true;
      // this.xxx single = xxx
      if (/^\s*(this\.|super\.|single\s*=|jdbcTemplate|singleton)/.test(trimmed)) return true;
      // Jmap/jps commands
      if (/^Jmap|^jps|^Jstat|^jmap/.test(trimmed)) return true;
      // SQL
      if (/^(SELECT|FROM|WHERE|INSERT|VALUES|CREATE|DROP|UPDATE|SET)/i.test(trimmed)) return true;

      return false;
    }

    let inFence = false;
    let fenceLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;

      if (!inFence) {
        // Not in a code block - check if we should start one
        if (isCodeLike(line)) {
          // Look ahead: are the next 2+ lines also code-like?
          let codeRun = 1;
          for (let j = i + 1; j < lines.length && codeRun < 10; j++) {
            const nt = lines[j].trimStart();
            const ni = lines[j].length - nt.length;
            if (ni >= 4 && isCodeLike(lines[j])) codeRun++;
            else if (nt.length === 0) codeRun++; // empty lines within code
            else break;
          }
          if (codeRun >= 3) {
            // Determine language
            if (/^(public |private |class |@Service|@Component|@Autowired|@Transactional)/.test(trimmed)) fenceLang = 'java';
            else if (/^<[/]?[a-zA-Z]/.test(trimmed)) fenceLang = 'xml';
            else fenceLang = '';

            inFence = true;
            output.push('```' + fenceLang);
            output.push(trimmed); // dedent
            continue;
          }
        }

        // Not starting a code block
        // If line has 4+ spaces but isn't part of a code block, just dedent it
        if (indent >= 4 && trimmed.length > 0) {
          // Keep minimal indentation for nested lists (2 spaces per level)
          const level = Math.floor((indent - 4) / 4);
          output.push('  '.repeat(Math.min(level, 2)) + trimmed);
        } else {
          output.push(line);
        }
      } else {
        // We're inside a code block
        // Check if this line should end the code block
        if (trimmed.length > 0 && indent < 4 && !isCodeLike(line)) {
          // End code block
          output.push('```');
          inFence = false;
          output.push(line);
          continue;
        }

        // Still in code block - add trimmed content
        if (indent >= 4) {
          // Keep relative indentation but shift left by 4
          output.push('  '.repeat(Math.max(0, Math.floor((indent - 4) / 2))) + trimmed);
        } else {
          output.push(trimmed);
        }
      }
    }
    if (inFence) output.push('```');

    content = output.join('\n');
    content = content.replace(/\n{3,}/g, '\n\n');

    // ============================================================
    // Step 4: Fix ## misuse on answer lines
    // ============================================================
    const mainSections = [
      'Java 基础相关知识', 'Spring 框架 知识', 'Springboot相关知识',
      'Springcloud 相关知识', 'Springmvc 相关知识', 'Mybatis 相关知识',
      'Mysql 相关知识', 'Docker和Linux 相关知识', '微服务组件相关知识',
      'Sentinel相关', '微服务如何进行分布式事务处理', 'Redis 缓存相关',
      'RabbitMQ 相关',
    ];

    function isQuestion(line) {
      if (line.includes('？')) return true;
      if (/^##\s+\d+\./.test(line)) return true;
      if (/^##\s+(什么是|说说|简单|如何|为什么|哪些|能不能|请说|有没有)/.test(line)) return true;
      for (const s of mainSections) {
        if (line.trim() === '## ' + s || line.trim() === '## ' + s + '：') return true;
      }
      return false;
    }

    const lines2 = content.split('\n');
    for (let i = 0; i < lines2.length; i++) {
      if (lines2[i].startsWith('## ') && !isQuestion(lines2[i])) {
        lines2[i] = lines2[i].replace(/^##\s+/, '');
      }
    }
    content = lines2.join('\n');

    // Fix "1.**text**" → "1. **text**"
    content = content.replace(/^(\d+)\.\*\*/gm, '$1. **');

    // Clean up remaining __ pairs
    content = content.replace(/__([^_]+?)__/g, '**$1**');

    // Fix section separators
    content = content.replace(/^={3,}$/gm, '---');

    // Clean up multiple blank lines
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.split('\n').map(l => l.trimEnd()).join('\n').trimEnd() + '\n';

    // ============================================================
    // Step 5: Split by chapters into separate files
    // ============================================================
    const chapterPattern = /^# (.+)$/gm;
    let match;
    const chapterPositions = [];
    while ((match = chapterPattern.exec(content)) !== null) {
      chapterPositions.push({ title: match[1], start: match.index });
    }

    const chapters = [];
    for (let i = 0; i < chapterPositions.length; i++) {
      const start = chapterPositions[i].start;
      const end = i + 1 < chapterPositions.length ? chapterPositions[i + 1].start : content.length;
      let chapterContent = content.substring(start, end).trim();
      // Remove leading separator line if present
      chapterContent = chapterContent.replace(/^\n*---\n*/, '');
      chapters.push({ title: chapterPositions[i].title, content: chapterContent + '\n' });
    }

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

    for (const ch of chapters) {
      const filename = filenameMap[ch.title] || ch.title.replace(/[：:?？\s]/g, '') + '.md';
      fs.writeFileSync('./每天习题背诵/' + filename, ch.content, 'utf8');
      console.log(`Created: ${filename} (${Buffer.byteLength(ch.content, 'utf8')} bytes, ${ch.content.split('\n').length} lines)`);
    }

    // Create index file
    let indexContent = '# 每天习题背诵\n\n';
    for (const ch of chapters) {
      const filename = filenameMap[ch.title] || ch.title.replace(/[：:?？\s]/g, '') + '.md';
      const name = filename.replace('.md', '');
      indexContent += `- [[${name}|${ch.title}]]\n`;
    }
    fs.writeFileSync('./每天习题背诵/README.md', indexContent, 'utf8');
    console.log('\nCreated: README.md (index with Obsidian links)');

    // Cleanup
    fs.unlinkSync('./temp_input.docx');
    console.log('\nCleaned up temp files');
  })
  .catch(err => console.error('Error:', err));
