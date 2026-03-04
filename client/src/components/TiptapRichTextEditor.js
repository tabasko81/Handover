import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';

/* Emoji names in English for hover tooltip */
const EMOJI_NAMES = {
  '😊': 'Smiling Face', '😃': 'Grinning Face', '😄': 'Grinning Face with Smiling Eyes', '😁': 'Beaming Face',
  '🙂': 'Slightly Smiling Face', '😅': 'Grinning Face with Sweat', '😂': 'Face with Tears of Joy', '👍': 'Thumbs Up',
  '👎': 'Thumbs Down', '👌': 'OK Hand', '😢': 'Crying Face', '😞': 'Disappointed Face', '😔': 'Pensive Face',
  '😟': 'Worried Face', '😕': 'Confused Face', '🙁': 'Slightly Frowning Face', '😣': 'Persevering Face',
  '😫': 'Tired Face', '😩': 'Weary Face', '🥺': 'Pleading Face', '😡': 'Enraged Face', '😤': 'Face with Steam',
  '😠': 'Angry Face', '🤬': 'Face with Symbols', '🤦': 'Person Facepalming', '🤦‍♂️': 'Man Facepalming',
  '🤦‍♀️': 'Woman Facepalming', '😮': 'Face with Open Mouth', '😲': 'Astonished Face', '😳': 'Flushed Face',
  '😴': 'Sleeping Face', '😪': 'Sleepy Face', '😓': 'Downcast Face with Sweat', '😰': 'Anxious Face',
  '😨': 'Fearful Face', '😱': 'Face Screaming in Fear', '🤯': 'Exploding Head', '😏': 'Smirking Face',
  '😒': 'Unamused Face', '🙄': 'Face with Rolling Eyes', '✅': 'Check Mark', '❌': 'Cross Mark',
  '⚠️': 'Warning', '🔴': 'Red Circle', '🟡': 'Yellow Circle', '🟢': 'Green Circle', '✔️': 'Check Mark',
  '✖️': 'Multiplication Sign', '⭕': 'Hollow Red Circle', '🚫': 'Prohibited', '⛔': 'No Entry',
  '📋': 'Clipboard', '📝': 'Memo', '📌': 'Pushpin', '📎': 'Paperclip', '📄': 'Page', '📑': 'Bookmark Tabs',
  '📂': 'Open Folder', '📁': 'Folder', '📃': 'Page with Curl', '💬': 'Speech Balloon', '📱': 'Mobile Phone',
  '📞': 'Telephone', '📧': 'Email', '👋': 'Waving Hand', '✉️': 'Envelope', '📨': 'Incoming Envelope',
  '📩': 'Envelope with Arrow', '💭': 'Thought Balloon', '⏰': 'Alarm Clock', '🕐': 'One O\'Clock',
  '⏳': 'Hourglass', '⌛': 'Hourglass Done', '🚨': 'Police Car Light', '🆘': 'SOS', '⏱️': 'Stopwatch',
  '🕒': 'Three O\'Clock', '📅': 'Calendar', '🔧': 'Wrench', '🛠️': 'Hammer and Wrench', '📦': 'Package',
  '🔄': 'Counterclockwise Arrows', '⚙️': 'Gear', '🔨': 'Hammer', '📊': 'Bar Chart', '📈': 'Chart Increasing',
  '📉': 'Chart Decreasing', '👤': 'Bust in Silhouette', '👥': 'Busts in Silhouette', '👨‍💼': 'Man Office Worker',
  '👩‍💼': 'Woman Office Worker', '🧑‍💼': 'Office Worker', '👷': 'Construction Worker', '🕵️': 'Detective',
  '👨‍🔧': 'Man Mechanic', '👩‍🔧': 'Woman Mechanic', 'ℹ️': 'Information', '➕': 'Plus Sign', '➖': 'Minus Sign',
  '⭐': 'Star', '❗': 'Exclamation Mark', '❓': 'Question Mark', '💯': 'Hundred Points', '🔔': 'Bell'
};

/* Emojis for handovers: emotions/reactions + status, documents, communication, time, tasks */
const HANDOVER_EMOJIS = [
  /* Emotions & reactions */
  '😊', '😃', '😄', '😁', '🙂', '😅', '😂', '👍', '👎', '👌',
  '😢', '😞', '😔', '😟', '😕', '🙁', '😣', '😫', '😩', '🥺',
  '😡', '😤', '😠', '🤬', '🤦', '🤦‍♂️', '🤦‍♀️', '😮', '😲', '😳',
  '😴', '😪', '😓', '😰', '😨', '😱', '🤯', '😏', '😒', '🙄',
  /* Status */
  '✅', '❌', '⚠️', '🔴', '🟡', '🟢', '✔️', '✖️', '⭕', '🚫', '⛔',
  /* Documents & notes */
  '📋', '📝', '📌', '📎', '📄', '📑', '📂', '📁', '📃',
  /* Communication */
  '💬', '📱', '📞', '📧', '👋', '✉️', '📨', '📩', '💭',
  /* Time & urgency */
  '⏰', '🕐', '⏳', '⌛', '🚨', '🆘', '⏱️', '🕒', '📅',
  /* Work & tasks */
  '🔧', '🛠️', '📦', '🔄', '⚙️', '🔨', '📊', '📈', '📉',
  /* People */
  '👤', '👥', '👨‍💼', '👩‍💼', '🧑‍💼', '👷', '🕵️', '👨‍🔧', '👩‍🔧',
  /* Symbols */
  'ℹ️', '➕', '➖', '⭐', '❗', '❓', '💯', '🔔'
];

/* Palette structure: No Fill, neutrals, theme, vibrant - like Character Highlighting Colour picker */
const NEUTRAL_COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF'];
const THEME_COLORS = ['#38BDF8', '#22C55E', '#F59E0B', '#EF4444', '#0EA5E9', '#16A34A', '#D97706', '#DC2626'];
const VIBRANT_COLORS = [
  '#FF0000', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00',
  '#CCFF00', '#99FF00', '#66FF00', '#33FF00', '#00FF00',
  '#00FF33', '#00FF66', '#00FF99', '#00FFCC', '#00FFFF',
  '#0099FF', '#0066FF', '#0033FF', '#0000FF', '#3300FF',
  '#6600FF', '#9900FF', '#CC00FF', '#FF00FF', '#FF00CC'
];

function TiptapRichTextEditor({ value, onChange, maxLength = 1000, placeholder = '' }) {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightColorPicker, setShowHighlightColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        hardBreak: false,
        link: false
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Type your text here... Use @user or @all to mention someone.'
      }),
      CharacterCount.configure({
        limit: maxLength
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-600 hover:underline'
        }
      })
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content min-h-[150px] px-3 py-2 text-sm outline-none focus:outline-none',
        style: 'word-wrap: break-word; max-height: 400px; overflow-y: auto; line-height: 1.6;'
      }
    }
  }, []);

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const insertEmoji = useCallback((emoji) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji).run();
      setShowEmojiPicker(false);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const charCount = (typeof editor.storage?.characterCount?.characters === 'function')
    ? editor.storage.characterCount.characters()
    : editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ').length;

  return (
    <div className="border rounded-md focus-within:ring-2 focus-within:ring-blue-500 tiptap-editor-wrapper" style={{ borderColor: 'var(--border-color)' }}>
      {/* Toolbar */}
      <div className="border-b p-2 flex flex-wrap gap-1 tiptap-toolbar" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold tiptap-toolbar-btn ${editor.isActive('bold') ? 'tiptap-toolbar-btn-active' : ''}`}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded text-sm tiptap-toolbar-btn ${editor.isActive('italic') ? 'tiptap-toolbar-btn-active' : ''}`}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1.5 rounded text-sm tiptap-toolbar-btn ${editor.isActive('underline') ? 'tiptap-toolbar-btn-active' : ''}`}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded text-sm tiptap-toolbar-btn ${editor.isActive('strike') ? 'tiptap-toolbar-btn-active' : ''}`}
          title="Strikethrough"
        >
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </button>
        <div className="w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTextColorPicker(false);
              setShowHighlightColorPicker(!showHighlightColorPicker);
            }}
            className="px-3 py-1.5 rounded text-sm tiptap-toolbar-btn"
            title="Highlight Color"
          >
            <span className="px-1 rounded" style={{ backgroundColor: 'var(--warning)', opacity: 0.8 }}>A</span>
          </button>
          {showHighlightColorPicker && (
            <div className="absolute top-full left-0 mt-1 border rounded-md shadow-lg p-2 z-50" style={{ width: '220px', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setShowHighlightColorPicker(false);
                  }}
                  className="w-full px-2 py-1.5 rounded text-left text-xs tiptap-picker-btn flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}
                  title="No Fill"
                >
                  <span className="w-5 h-5 rounded border flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} />
                  No Fill
                </button>
              </div>
              <div className="text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Theme colours</div>
              <div className="grid grid-cols-4 gap-1 mb-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setShowHighlightColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border hover:border-gray-500"
                    style={{ backgroundColor: color, borderColor: 'var(--border-color)' }}
                    title={color}
                  />
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {NEUTRAL_COLORS.map((color) => (
                  <button
                    key={`n-${color}`}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setShowHighlightColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border hover:border-gray-500"
                    style={{ backgroundColor: color, borderColor: color === '#FFFFFF' ? 'var(--border-color)' : 'transparent' }}
                    title={color}
                  />
                ))}
                {VIBRANT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setShowHighlightColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border hover:border-gray-500"
                    style={{ backgroundColor: color, borderColor: 'var(--border-color)' }}
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
            onClick={() => {
              setShowHighlightColorPicker(false);
              setShowTextColorPicker(!showTextColorPicker);
            }}
            className="px-3 py-1.5 rounded text-sm tiptap-toolbar-btn"
            title="Text Color"
          >
            <span style={{ color: 'var(--accent)' }}>A</span>
          </button>
          {showTextColorPicker && (
            <div className="absolute top-full left-0 mt-1 border rounded-md shadow-lg p-2 z-50" style={{ width: '220px', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowTextColorPicker(false);
                  }}
                  className="w-full px-2 py-1.5 rounded text-left text-xs tiptap-picker-btn flex items-center gap-2"
                  style={{ color: 'var(--text-primary)' }}
                  title="No Fill"
                >
                  <span className="w-5 h-5 rounded border flex-shrink-0" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }} />
                  No Fill
                </button>
              </div>
              <div className="text-xs font-semibold mb-1 uppercase" style={{ color: 'var(--text-secondary)' }}>Theme colours</div>
              <div className="grid grid-cols-4 gap-1 mb-2">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowTextColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border hover:border-gray-500"
                    style={{ backgroundColor: color, borderColor: 'var(--border-color)' }}
                    title={color}
                  />
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {NEUTRAL_COLORS.map((color) => (
                  <button
                    key={`n-${color}`}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowTextColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border hover:border-gray-500"
                    style={{ backgroundColor: color, borderColor: color === '#FFFFFF' ? 'var(--border-color)' : 'transparent' }}
                    title={color}
                  />
                ))}
                {VIBRANT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowTextColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border hover:border-gray-500"
                    style={{ backgroundColor: color, borderColor: 'var(--border-color)' }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-3 py-1.5 rounded text-sm tiptap-toolbar-btn"
            title="Insert Emoji"
          >
            <span className="text-sm leading-none">😊</span>
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-1 border rounded-md shadow-lg p-3 z-50" style={{ width: '320px', maxHeight: '400px', overflowY: 'auto', backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <div className="grid grid-cols-8 gap-1">
                {HANDOVER_EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl tiptap-picker-btn rounded p-1 transition-colors"
                    title={EMOJI_NAMES[emoji] || emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-px mx-1" style={{ backgroundColor: 'var(--border-color)' }} />
        <button
          type="button"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-3 py-1.5 rounded text-sm tiptap-toolbar-btn"
          title="Remove Formatting"
        >
          ✕
        </button>
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>

      {/* Character count */}
      <div className="border-t px-3 py-1 text-xs text-right" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
        {charCount}/{maxLength} characters
      </div>
    </div>
  );
}

export default TiptapRichTextEditor;
