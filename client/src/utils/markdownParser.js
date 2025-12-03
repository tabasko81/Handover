import DOMPurify from 'dompurify';

// Configure DOMPurify with safe defaults (configured once)
const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'ul', 'ol', 'li', 'p', 'br', 'strong', 'em', 'div', 'span', 'a', 'code', 'pre'],
  ALLOWED_ATTR: ['style', 'class', 'href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false
};

// Setup hook only once (DOMPurify manages hooks internally, but we'll check if already added)
let hookAdded = false;
if (!hookAdded) {
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    // Sanitize style attribute
    if (data.attrName === 'style' && data.attrValue) {
      let style = data.attrValue;
      
      // Remove dangerous CSS expressions
      style = style.replace(/javascript:/gi, '');
      style = style.replace(/expression\s*\(/gi, '');
      style = style.replace(/url\s*\(\s*['"]?\s*javascript:/gi, '');
      
      // Only allow safe CSS properties
      const safeProperties = [
        'color', 'background-color', 'background', 'font-weight', 'font-size',
        'text-decoration', 'text-align', 'margin', 'padding', 'border',
        'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom'
      ];
      
      const properties = style.split(';').filter(prop => {
        const propName = prop.split(':')[0].trim().toLowerCase();
        return safeProperties.some(safe => propName.includes(safe));
      });
      
      data.attrValue = properties.join('; ');
    }
    
    // Sanitize href attribute - only allow http/https
    if (data.attrName === 'href' && data.attrValue) {
      const href = data.attrValue.trim();
      if (!/^https?:\/\//i.test(href) && !href.startsWith('#') && !href.startsWith('/')) {
        data.keepAttr = false;
      }
    }
  });
  hookAdded = true;
}

/**
 * Parser for rendering Markdown or HTML to HTML
 * Supports: bold, italic, headers, lists, links, code, mentions
 * Handles both HTML (from rich editor) and Markdown (backward compatibility)
 * All HTML is sanitized with DOMPurify before rendering
 */
export function parseMarkdown(text) {
  if (!text) return '';

  // Process text - if it contains escaped HTML, it should already be sanitized by server
  // But we'll still sanitize on client side as defense in depth
  let processedText = text;
  
  // Check if content is HTML - look for any HTML tags anywhere in the text
  // Use a comprehensive regex to detect any HTML tag
  const hasHTMLTag = /<[a-z]+[^>]*(?:\s+[^>]*)?>/i.test(processedText);
  const isHTML = hasHTMLTag || 
    processedText.includes('<div') || processedText.includes('</div>') ||
    processedText.includes('<p') || processedText.includes('</p>') ||
    processedText.includes('<h1') || processedText.includes('<h2') || processedText.includes('<h3') || 
    processedText.includes('<ul') || processedText.includes('<ol') || 
    processedText.includes('<strong') || processedText.includes('<em') || processedText.includes('<u') ||
    processedText.includes('<span') || processedText.includes('</span>') ||
    processedText.includes('<b') || processedText.includes('<i') ||
    processedText.includes('<a ') || processedText.includes('<br') || processedText.includes('<code') ||
    processedText.includes('<pre') || processedText.includes('<li') || processedText.includes('<table') ||
    processedText.includes('<tr') || processedText.includes('<td') || processedText.includes('<th');
  
  if (isHTML) {
    // Content is HTML from rich text editor
    // Process @mentions first, then sanitize
    let html = processedText;
    
    // Process @mentions in text content (but be careful not to break HTML)
    // Only process @mentions that are in text nodes, not in attributes
    html = html.replace(/>([^<@]+@\w+[^<]*)</g, (match, textContent) => {
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
    
    // Sanitize HTML with DOMPurify before returning
    return DOMPurify.sanitize(html, sanitizeConfig);
  }

  // Original markdown processing
  // Process markdown on the processed text first, then escape remaining HTML
  let html = processedText;

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

  // Links [text](url) - validate URL before creating link
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    // Validate URL - only allow http:// and https://
    const trimmedUrl = url.trim();
    if (/^https?:\/\//i.test(trimmedUrl)) {
      return `<a href="${trimmedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${linkText}</a>`;
    }
    // Invalid URL - return as plain text
    return linkText;
  });

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
  
  // Sanitize all HTML with DOMPurify before returning
  // This ensures any HTML created from markdown is safe
  return DOMPurify.sanitize(html, sanitizeConfig);
}

