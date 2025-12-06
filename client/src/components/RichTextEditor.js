import React, { useRef, useEffect, useState } from 'react';

function RichTextEditor({ value, onChange, maxLength = 1000, placeholder = '' }) {
  const editorRef = useRef(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
    '#FF0000', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00',
    '#CCFF00', '#99FF00', '#66FF00', '#33FF00', '#00FF00',
    '#00FF33', '#00FF66', '#00FF99', '#00FFCC', '#00FFFF',
    '#0099FF', '#0066FF', '#0033FF', '#0000FF', '#3300FF',
    '#6600FF', '#9900FF', '#CC00FF', '#FF00FF', '#FF00CC'
  ];

  useEffect(() => {
    // Configure editor to use paragraphs instead of divs for better WYSIWYG
    if (editorRef.current) {
      // Set default paragraph separator to 'p' instead of 'div'
      document.execCommand('defaultParagraphSeparator', false, 'p');
      
      // Set initial content
      if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  // Function to detect URLs and convert them to links (but not emails)
  const detectAndLinkUrls = (text) => {
    // URL regex pattern - matches http://, https://, www., or domain patterns
    // But excludes email addresses (text before @)
    const urlPattern = /(?:^|[\s>])((?:https?:\/\/|www\.)[^\s<>@]+(?:\.[^\s<>@]+)*)/gi;
    
    return text.replace(urlPattern, (match, url, offset, string) => {
      // Check if this is part of an email (has @ before it)
      const matchIndex = offset;
      const beforeMatch = string.substring(Math.max(0, matchIndex - 50), matchIndex);
      
      // If there's an @ before this and it looks like an email, don't convert
      if (beforeMatch.includes('@') && /[\w.-]+@/.test(beforeMatch)) {
        return match; // Return as-is, it's likely part of an email
      }
      
      // Ensure URL has protocol
      let fullUrl = url.trim();
      if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
        fullUrl = 'https://' + fullUrl;
      }
      
      // Create link
      const prefix = match.startsWith(' ') ? ' ' : (match.startsWith('>') ? '>' : '');
      return prefix + `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
    });
  };

  // Function to remove empty lines (paragraphs with only whitespace)
  const removeEmptyLines = (html) => {
    if (!html) return html;
    
    // Create a temporary DOM element to process HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find and remove empty elements
    const emptyElements = tempDiv.querySelectorAll('p, div, br');
    emptyElements.forEach((el) => {
      // Check if element is empty or contains only whitespace/&nbsp;
      const textContent = el.textContent || '';
      const innerHTML = el.innerHTML || '';
      
      // Check if it's truly empty (no text, or only whitespace/&nbsp;/zero-width spaces)
      const isEmpty = !textContent.trim() && 
                      (!innerHTML || innerHTML.match(/^[\s\u00A0\u200B-\u200D\uFEFF]*$/));
      
      if (isEmpty) {
        // For <br> tags, just remove them
        if (el.tagName === 'BR') {
          el.remove();
        } else {
          // For <p> and <div>, remove the element but preserve its children if any
          const parent = el.parentNode;
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
        }
      }
    });
    
    // Also remove consecutive <br> tags
    const brs = tempDiv.querySelectorAll('br');
    let previousBr = null;
    brs.forEach((br) => {
      if (previousBr && br.previousSibling === previousBr) {
        br.remove();
      } else {
        previousBr = br;
      }
    });
    
    return tempDiv.innerHTML;
  };
  
  // Function to remove empty lines from plain text (for paste)
  const removeEmptyLinesFromText = (text) => {
    if (!text) return text;
    
    // Split by newlines and filter out empty lines
    const lines = text.split(/\r?\n/);
    const filteredLines = lines.filter(line => {
      // Remove lines that are empty or contain only whitespace
      return line.trim().length > 0;
    });
    
    return filteredLines.join('\n');
  };

  const handlePaste = (e) => {
    e.preventDefault();
    
    // Get pasted text
    const pastedText = (e.clipboardData || window.clipboardData).getData('text/plain');
    
    if (!pastedText) return;
    
    // Remove empty lines from text first
    let processedText = removeEmptyLinesFromText(pastedText);
    
    // Detect URLs and convert to links
    processedText = detectAndLinkUrls(processedText);
    
    // Insert processed text at cursor position
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedText;
      
      // Remove empty lines from the HTML structure
      const cleanedHTML = removeEmptyLines(tempDiv.innerHTML);
      tempDiv.innerHTML = cleanedHTML;
      
      // Insert nodes
      const fragment = document.createDocumentFragment();
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
      }
      
      range.insertNode(fragment);
      
      // Move cursor to end of inserted content
      range.setStartAfter(fragment.lastChild || range.startContainer);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger input event to update state
      handleInput();
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    
    // Ensure paragraph separator is set
    document.execCommand('defaultParagraphSeparator', false, 'p');
    
    let html = editorRef.current.innerHTML;
    
    // Remove empty lines from the HTML
    html = removeEmptyLines(html);
    
    // Update the editor content if it changed
    if (html !== editorRef.current.innerHTML) {
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const cursorPosition = range ? range.startOffset : 0;
      
      editorRef.current.innerHTML = html;
      
      // Try to restore cursor position
      if (range) {
        try {
          const newRange = document.createRange();
          const textNodes = [];
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null
          );
          let node;
          while ((node = walker.nextNode())) {
            textNodes.push(node);
          }
          
          if (textNodes.length > 0) {
            const targetNode = textNodes[Math.min(cursorPosition, textNodes.length - 1)];
            newRange.setStart(targetNode, Math.min(cursorPosition, targetNode.textContent.length));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } catch (e) {
          // If cursor restoration fails, just set cursor to end
          const newRange = document.createRange();
          newRange.selectNodeContents(editorRef.current);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
    
    // Count text characters (excluding HTML tags)
    const textContent = editorRef.current.textContent || '';
    
    if (textContent.length > maxLength) {
      // Truncate if needed - simple approach: limit text content
      // Try to preserve some formatting by keeping HTML structure
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      truncateTextNode(tempDiv, maxLength);
      editorRef.current.innerHTML = tempDiv.innerHTML;
      
      // Move cursor to end
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    onChange(editorRef.current.innerHTML);
  };

  const truncateTextNode = (node, maxLength) => {
    let currentLength = 0;
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let textNode;
    while ((textNode = walker.nextNode())) {
      const nodeLength = textNode.textContent.length;
      if (currentLength + nodeLength > maxLength) {
        textNode.textContent = textNode.textContent.substring(0, maxLength - currentLength);
        // Remove all following nodes
        let next = textNode.nextSibling;
        while (next) {
          const toRemove = next;
          next = next.nextSibling;
          toRemove.remove();
        }
        // Remove all children of parent
        let parent = textNode.parentNode;
        while (parent && parent !== node) {
          let sibling = parent.nextSibling;
          while (sibling) {
            const toRemove = sibling;
            sibling = sibling.nextSibling;
            toRemove.remove();
          }
          parent = parent.parentNode;
        }
        break;
      }
      currentLength += nodeLength;
    }
  };


  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const applyHighlight = (color = '#ffff00') => {
    document.execCommand('backColor', false, color);
    editorRef.current?.focus();
    handleInput();
  };

  const applyTextColor = (color) => {
    document.execCommand('foreColor', false, color);
    editorRef.current?.focus();
    handleInput();
  };

  const insertEmoji = (emoji) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    let range;
    
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else {
      // Create a range at the end of the editor
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
    }
    
    // Delete any selected content
    range.deleteContents();
    
    // Insert emoji as text node
    const textNode = document.createTextNode(emoji);
    range.insertNode(textNode);
    
    // Move cursor after the inserted emoji
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    editorRef.current.focus();
    handleInput();
    setShowEmojiPicker(false);
  };

  // Common emojis organized by category
  const emojiCategories = {
    'Smileys & People': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓'],
    'Objects': ['📱', '💻', '⌚', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡'],
    'Symbols & Signs': ['✅', '❌', '⚠️', '🚫', '⛔', '🚷', '🚯', '🚱', '🚳', '📛', '🔰', '⭕', '✅', '☑️', '✔️', '✖️', '❌', '❎', '➕', '➖', '➗', '✖️', '💯', '🔢', '🔟', '🔠', '🔡', '🔤', '🅰️', '🆎', '🅱️', '🆑', '🆒', '🆓', 'ℹ️', '🆔', 'Ⓜ️', '🆕', '🆖', '🅾️', '🆗', '🅿️', '🆘', '🆙', '🆚', '🈁', '🈂️', '🈷️', '🈶', '🈯', '🉐', '🈹', '🈲', '🉑', '🈸', '🈴', '🈳', '㊗️', '㊙️', '🈺', '🈵'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣', '🥊', '🥋', '🎽', '⛸️', '🥌', '🛷', '🎿', '⛷️', '🏂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
    'Flags': ['🇵🇹', '🇬🇧', '🇺🇸', '🇪🇸', '🇫🇷', '🇩🇪', '🇮🇹', '🇧🇷', '🇨🇦', '🇦🇺', '🇯🇵', '🇨🇳', '🇮🇳', '🇷🇺', '🇰🇷'],
    'Common': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦵', '🦶', '👂', '🦻', '👃', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🤦', '🤷', '👮', '🕵️', '💂', '🥷', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🧍', '🧎', '🏃', '💃', '🕺', '🕴️', '👯', '🧘', '🧗', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏄', '🚣', '🏊', '⛹️', '🏋️', '🚴', '🚵', '🤸', '🤼', '🤽', '🤾', '🤹', '🧗', '🚵', '🏋️', '🤸', '🤼', '🤽', '🤾', '🤹']
  };

  const getCharacterCount = () => {
    if (!editorRef.current) return 0;
    return (editorRef.current.textContent || '').length;
  };

  const isActive = (command) => {
    if (!editorRef.current) return false;
    return document.queryCommandState(command);
  };

  return (
    <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            isActive('bold')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            isActive('italic')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            isActive('underline')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => execCommand('strikeThrough')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            isActive('strikeThrough')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Strikethrough"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowHighlightColorPicker(!showHighlightColorPicker)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            title="Highlight Color"
          >
            <span className="bg-yellow-200 px-1 rounded">A</span>
          </button>
          {showHighlightColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-50" style={{ width: '200px' }}>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      applyHighlight(color);
                      setShowHighlightColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
            className="px-3 py-1.5 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            title="Text Color"
          >
            <span className="text-blue-600">A</span>
          </button>
          {showTextColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-50" style={{ width: '200px' }}>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      applyTextColor(color);
                      setShowTextColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-px bg-gray-300 mx-1"></div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-3 py-1.5 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 transition-colors"
            title="Insert Emoji"
          >
            😀
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 z-50" style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
              <div className="space-y-3">
                {Object.entries(emojiCategories).map(([category, emojis]) => (
                  <div key={category}>
                    <div className="text-xs font-semibold text-gray-600 mb-2 uppercase">{category}</div>
                    <div className="grid grid-cols-8 gap-1">
                      {emojis.map((emoji, index) => (
                        <button
                          key={`${category}-${index}`}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="px-3 py-1.5 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 transition-colors"
          title="Remove Formatting"
        >
          ✕
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => {
            // Ensure paragraph separator is set when focused
            document.execCommand('defaultParagraphSeparator', false, 'p');
          }}
          className="min-h-[150px] px-3 py-2 text-sm text-gray-900 outline-none wysiwyg-editor"
          style={{
            wordWrap: 'break-word',
            maxHeight: '400px',
            overflowY: 'auto',
            lineHeight: '1.6'
          }}
          data-placeholder={placeholder || 'Type your text here... Use @user or @all to mention someone.'}
          suppressContentEditableWarning
        />
      </div>

      {/* Character count */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500 text-right">
        {getCharacterCount()}/{maxLength} characters
      </div>

      {/* CSS for WYSIWYG editor and placeholder */}
      <style>{`
        .wysiwyg-editor {
          line-height: 1.6;
        }
        .wysiwyg-editor p {
          display: block;
          margin-bottom: 0.75rem;
          margin-top: 0;
        }
        .wysiwyg-editor p:first-child {
          margin-top: 0;
        }
        .wysiwyg-editor p:last-child {
          margin-bottom: 0;
        }
        .wysiwyg-editor div {
          display: block;
          margin-bottom: 0.75rem;
          margin-top: 0;
        }
        .wysiwyg-editor div:first-child {
          margin-top: 0;
        }
        .wysiwyg-editor div:last-child {
          margin-bottom: 0;
        }
        .wysiwyg-editor br {
          line-height: 1.6;
        }
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        [contenteditable][data-placeholder]:not(:empty):before {
          display: none;
        }
      `}</style>
      
      {/* Close pickers when clicking outside */}
      {(showTextColorPicker || showHighlightColorPicker || showEmojiPicker) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowTextColorPicker(false);
            setShowHighlightColorPicker(false);
            setShowEmojiPicker(false);
          }}
        />
      )}
    </div>
  );
}

export default RichTextEditor;

