// ☁️🏛️ cloud.museum - A Static Site Generator Coded 100% by AI
// 💡 Description: An AI-generated static site generator that converts Markdown files to HTML pages with custom templates.
// Created on the 30th of March 2023 by ChatGPT + gurugeek
// Over 100 interactions with ChatGPT were necessary to create this code

// 📦 Import required modules
const fs = require('fs');
const path = require('path');

// 📁 Directories for input and output
const inputDirectory = path.join(__dirname, 'markdown');
const outputDirectory = path.join(__dirname, 'deploy');
const templatesDirectory = path.join(__dirname, 'templates');

// 📚 Function to parse markdown content
function parseMarkdown(markdown) {
  let html = '';
  let inList = false;
  let inCodeBlock = false;
  let inFrontMatter = false;
  const lines = markdown.split('\n');

  for (const line of lines) {
	const trimmed = line.trim();

	if (inFrontMatter) {
	  if (trimmed === '---') {
		inFrontMatter = false;
	  }
	  continue;
	}

	if (inCodeBlock) {
	  if (trimmed === '```') {
		html += '</pre>\n';
		inCodeBlock = false;
	  } else {
		html += line + '\n';
	  }
	  continue;
	}

	if (trimmed.startsWith('---')) {
	  inFrontMatter = true;
	  continue;
	}

	if (trimmed.startsWith('#')) {
	  const level = trimmed.match(/^#+/)[0].length;
	  const content = trimmed.slice(level).trim();
	  html += `<h${level}>${content}</h${level}>\n`;
	} else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
	  if (!inList) {
		html += '<ul>\n';
		inList = true;
	  }
	  const content = trimmed.slice(2);
	  html += `<li>${content}</li>\n`;
	} else if (trimmed.startsWith('![')) {
	  const regex = /!\[(.*)\]\((.*)\)/;
	  const match = regex.exec(trimmed);
	  if (match) {
		const altText = match[1];
		const imageUrl = match[2];
		html += `<img src="${imageUrl}" alt="${altText}">\n`;
	  }
	} else if (trimmed === '```') {
	  html += '<pre>\n';
	  inCodeBlock = true;
	} else {
	  if (inList) {
		html += '</ul>\n';
		inList = false;
	  }
	  const updatedLine = parseInlineMarkdown(line);
	  html += `<p>${updatedLine}</p>\n`;
	}
  }

  if (inList) {
	html += '</ul>\n';
  }

  return html;
}

// 📖 Function to parse inline markdown elements
function parseInlineMarkdown(text) {
  const rules = [
	{ pattern: /\*\*(.+?)\*\*/g, replaceWith: '<strong>$1</strong>' },
	{ pattern: /\*(.+?)\*/g, replaceWith: '<em>$1</em>' },
	{ pattern: /\[(.+?)\]\((.+?)\)/g, replaceWith: '<a href="$2">$1</a>' },
	// Add rule to convert markdown heading to HTML heading
	{ pattern: /^#\s(.*)/gm, replaceWith: '<h1>$1</h1>' }
  ];

  let result = text;

  for (const rule of rules) {
	result = result.replace(rule.pattern, rule.replaceWith);
  }

  return result;
}

//🧹 Function to clear output directory
function clearOutputDirectory() {
  if (fs.existsSync(outputDirectory)) {
	const files = fs.readdirSync(outputDirectory);
	for (const file of files) {
	  if (file !== 'public') {
		fs.rmSync(path.join(outputDirectory, file), { recursive: true, force: true });
	  }
	}
  }
}

// 🐌 Function to generate a slug from a string
function slugify(string) {
  const allowedCharacterSet = /[^a-zA-Z0-9_-]/g;
  const slug = string.trim()
	.normalize('NFD')
	.replace(allowedCharacterSet, '-')
	.toLowerCase();
  return slug;
}

// 🗂️ Function to parse markdown files in the input directory
function parseMarkdownFiles() {
  let results = [];

  if (fs.existsSync(inputDirectory)) {
	const files = fs.readdirSync(inputDirectory);
	const markdownFiles = files.filter(file => file.endsWith('.md'));

	for (const file of markdownFiles) {
	  const filePath = path.join(inputDirectory, file);
	  const fileContent = fs.readFileSync(filePath, 'utf8');
	  let inFrontMatter = false;
	  const lines = fileContent.split('\n');
	  const dateLine = lines.find(line => line.startsWith('Date:'));
	  const dateString = dateLine ? dateLine.replace('Date:', '').trim() : '';
	  const date = new Date(dateString);
	  let markdown = '';

	  // Extract the title from the front matter
	  const titleLine = lines.find(line => line.startsWith('Title:'));
	  const title = titleLine ? titleLine.replace('Title:', '').trim() : file.replace('.md', '');

	  for (const line of lines) {
		const trimmed = line.trim();

		if (inFrontMatter) {
		  if (trimmed === '---') {
			inFrontMatter = false;
		  }
		  continue;
		}

		if (trimmed.startsWith('---')) {
		  inFrontMatter = true;
		  continue;
		}

		markdown += line + '\n';
	  }

	  const html = parseMarkdown(markdown);
	  const slug = slugify(title);
	  results.push({ title, slug, html, date });
	}
  }

  return results;
}


// 📝 Function to write the HTML file	
function writeHTMLFile({ slug, title, content, date, pages, templateName }) {
	  const templatePath = path.join(templatesDirectory, templateName + '.html');
	  const isIndexPage = slug === 'index';
	  const outputPath = isIndexPage ? path.join(outputDirectory, 'index.html') : path.join(outputDirectory, slug, 'index.html');
	
	  const templateContent = fs.readFileSync(templatePath, 'utf8');
	  const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });
	
	  const outputContent = templateContent
		.replace(/{{ title }}/g, title)
		.replace(/{{ content }}/g, content)
		.replace(/{{ date }}/g, date ? dateFormatter.format(date) : '')
		.replace(/{{ pages }}/g, pages || '');
	
	  if (isIndexPage) {
		fs.writeFileSync(outputPath, outputContent, 'utf8');
	  } else {
		fs.mkdirSync(path.dirname(outputPath), { recursive: true });
		fs.writeFileSync(outputPath, outputContent, 'utf8');
	  }
	}

// 🏠 Function to create the index page	
function createIndexPage(files) {
	  const indexSlug = 'index';
	  const indexFile = files.find(file => file.slug === indexSlug);
	  const templateName = 'index';
	  const otherPagesHTML = files
		.filter(file => file.slug !== indexSlug)
		.sort((a, b) => a.title.localeCompare(b.title))
		.map(file => `<li><a href="./${file.slug}/index.html">${file.title}</a></li>`)
		.join('\n');
	
	  // Convert the markdown heading to HTML
	  const content = parseInlineMarkdown(indexFile.html);
	
	  writeHTMLFile({ ...indexFile, content, pages: otherPagesHTML, templateName });
	}


// 🚀 Main function to execute the static site generator
	function main() {
	  clearOutputDirectory();
	  const files = parseMarkdownFiles();
	
	  for (const file of files) {
		if (file.slug === 'index') {
		  continue;
		}
		const templateName = 'pages';
		writeHTMLFile({ ...file, content: file.html, pages: null, templateName }); // Replace 'content' with 'file.html'
	  }
	
	  createIndexPage(files);
	}
// 🏁 Execute the main function
	main();
