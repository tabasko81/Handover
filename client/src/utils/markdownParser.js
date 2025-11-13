/**
 * Parser for rendering Markdown or HTML to HTML
 * Supports: bold, italic, headers, lists, links, code, mentions
 * Handles both HTML (from rich editor) and Markdown (backward compatibility)
 */
export function parseMarkdown(text) {
  if (!text) return '';

  // Check if content is already HTML (starts with < and contains HTML tags)
  const isHTML = /^[\s]*<[^>]+>/.test(text) || text.includes('<div') || text.includes('<p') || text.includes('<h1') || text.includes('<h2') || text.includes('<h3') || text.includes('<ul') || text.includes('<ol') || text.includes('<strong') || text.includes('<em') || text.includes('<u');
  
  if (isHTML) {
    // Content is HTML from rich text editor
    // Process @mentions in text content, but exclude emails
    let html = text;
    
    // Normalize line breaks and paragraphs for WYSIWYG display
    // The editor now uses <p> tags by default, but we still handle <div> tags for compatibility
    
    // First, handle empty divs and empty paragraphs (line breaks)
    html = html.replace(/<div([^>]*)><\/div>/g, '<br>');
    html = html.replace(/<div([^>]*)><br><\/div>/g, '<br>');
    html = html.replace(/<div([^>]*)>[\s]*<\/div>/g, '<br>');
    html = html.replace(/<p([^>]*)><\/p>/g, '<br>');
    html = html.replace(/<p([^>]*)><br><\/p>/g, '<br>');
    html = html.replace(/<p([^>]*)>[\s]*<\/p>/g, '<br>');
    
    // Process divs that contain content - ensure proper spacing
    html = html.replace(/<div([^>]*)>/g, (match, attrs) => {
      // Check if style attribute already exists
      if (attrs && attrs.includes('style=')) {
        // Add margin-bottom if not present
        if (!attrs.includes('margin-bottom')) {
          return match.replace(/style="([^"]*)"/, 'style="$1; margin-bottom: 0.75rem; display: block;"');
        }
        if (!attrs.includes('display:')) {
          return match.replace(/style="([^"]*)"/, 'style="$1; display: block;"');
        }
        return match;
      }
      // Add margin-bottom and display block style
      return `<div${attrs} style="margin-bottom: 0.75rem; display: block;">`;
    });
    
    // Ensure <p> tags have proper spacing (most common case now)
    html = html.replace(/<p([^>]*)>/g, (match, attrs) => {
      if (attrs && attrs.includes('style=')) {
        if (!attrs.includes('margin-bottom')) {
          return match.replace(/style="([^"]*)"/, 'style="$1; margin-bottom: 0.75rem; display: block;"');
        }
        if (!attrs.includes('display:')) {
          return match.replace(/style="([^"]*)"/, 'style="$1; display: block;"');
        }
        return match;
      }
      return `<p${attrs} style="margin-bottom: 0.75rem; display: block;">`;
    });
    
    // Process @mentions in text content
    html = html.replace(/>([^<]+)</g, (match, textContent, offset, string) => {
      // Process @mentions in text content only
      const processedText = textContent.replace(/(@\w+)/g, (mentionMatch, mention, mentionOffset, mentionString) => {
        // Check if there's a non-space character before @ (email case)
        if (mentionOffset > 0) {
          const charBefore = mentionString[mentionOffset - 1];
          // If there's a non-space character before @, it's likely an email
          if (charBefore && charBefore.match(/\S/)) {
            return mentionMatch; // Don't highlight
          }
        }
        // Valid mention - highlight it
        return '<span class="bg-yellow-200 font-semibold px-1 rounded">' + mention + '</span>';
      });
      return '>' + processedText + '<';
    });
    
    // Also handle @mentions at the start or end of content (not between tags)
    html = html.replace(/(^|>)(@\w+)(?![^<]*>)/g, (match, before, mention, offset, string) => {
      // Check if we're inside a tag
      const beforePos = string.substring(0, offset);
      const lastOpenTag = beforePos.lastIndexOf('<');
      const lastCloseTag = beforePos.lastIndexOf('>');
      
      if (lastOpenTag > lastCloseTag) {
        return match; // Inside a tag, don't process
      }
      
      return before + '<span class="bg-yellow-200 font-semibold px-1 rounded">' + mention + '</span>';
    });
    
    return html;
  }

  // Original markdown processing
  // Escape HTML first to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```code```)
  html = html.replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-2 rounded my-2"><code>$1</code></pre>');

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

  // Bold and italic (***bold italic***)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');

  // Bold (**bold** or __bold__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic (*italic* or _italic_)
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');

  // Numbered lists
  html = html.replace(/^(\d+)\. (.+)$/gim, '<li class="ml-4">$2</li>');
  html = html.replace(/(<li class="ml-4">.+<\/li>\n?)+/g, (match) => {
    return '<ol class="list-decimal list-inside space-y-1 my-2">' + match + '</ol>';
  });

  // Bullet lists
  html = html.replace(/^[-*] (.+)$/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li class="ml-4">.+<\/li>\n?)+/g, (match) => {
    // Check if already wrapped in <ol>
    if (!match.includes('<ol')) {
      return '<ul class="list-disc list-inside space-y-1 my-2">' + match + '</ul>';
    }
    return match;
  });

  // @mentions (highlight) - but exclude emails
  // Only match @mention if it's at start of string, after space, or after certain punctuation
  // Don't match if there's a non-space character before @ (likely email)
  html = html.replace(/(@\w+)/g, (match, mention, offset, string) => {
    // Check if there's a non-space character immediately before @ (email case)
    if (offset > 0) {
      const charBefore = string[offset - 1];
      // If there's a non-space character before @, it's likely an email - don't highlight
      if (charBefore && charBefore.match(/\S/)) {
        return match;
      }
    }
    
    return '<span class="bg-yellow-200 font-semibold px-1 rounded">' + mention + '</span>';
  });

  // Convert newlines to <br> (but preserve lists)
  html = html.replace(/\n/g, '<br>');

  // Clean up: remove <br> tags inside list items
  html = html.replace(/(<li[^>]*>)(.*?)<br>(.*?)(<\/li>)/g, '$1$2$3$4');

  return html;
}

