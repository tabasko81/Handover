// Simple Markdown parser for real-time preview
export const parseMarkdown = (markdown) => {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML to prevent XSS (except what we'll add)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```code```)
  html = html.replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-2 rounded my-1 overflow-x-auto"><code>$1</code></pre>');

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');

  // Headings (# ## ###)
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-2 mb-1">$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-3 mb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-3">$1</h1>');

  // Bold **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong class="font-bold">$1</strong>');

  // Italic *text* or _text_
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

  // Strikethrough ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<del class="line-through">$1</del>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">$1</a>');

  // Blockquotes (> text)
  html = html.replace(/^&gt; (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-3 my-2 italic text-gray-700">$1</blockquote>');

  // Horizontal rule (--- or ***)
  html = html.replace(/^(---|\*\*\*)$/gm, '<hr class="my-3 border-gray-300">');

  // Ordered lists (1. item)
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>');
  
  // Unordered lists (- item or * item)
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Wrap consecutive list items in <ul> or <ol>
  html = html.replace(/(<li class="ml-4 list-disc">[^<]+<\/li>(?:\s*<li class="ml-4 list-disc">[^<]+<\/li>)*)/g, '<ul class="list-disc pl-5 my-1">$1</ul>');
  html = html.replace(/(<li class="ml-4 list-decimal">[^<]+<\/li>(?:\s*<li class="ml-4 list-decimal">[^<]+<\/li>)*)/g, '<ol class="list-decimal pl-5 my-1">$1</ol>');

  // Process paragraphs: split by double newlines
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();
    if (!trimmed) return '';
    
    // Check if it's already a block element (heading, list, etc.)
    if (trimmed.match(/^<(h[1-6]|pre|blockquote|ul|ol|hr|li)/)) {
      return trimmed;
    }
    
    // Convert single newlines to <br> within paragraphs
    const withBreaks = trimmed.replace(/\n/g, '<br>');
    return `<p class="my-2">${withBreaks}</p>`;
  }).join('');

  // Highlight @mentions (after all other processing)
  html = html.replace(/(@\w+)/g, '<span class="bg-yellow-200 font-semibold px-1 rounded">$1</span>');

  return html;
};

