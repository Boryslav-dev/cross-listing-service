import { useEditor, EditorContent, Extension } from '@tiptap/react'
import { useEffect } from 'react'
import { InputRule } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { cn } from '../../utils/cn'

// Custom FontSize extension built on top of TextStyle
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => el.style.fontSize?.replace('px', '') || null,
          renderHTML: (attrs) => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}px` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: (size) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

// ─── Icons ────────────────────────────────────────────────────────────────────
const BoldIcon = () => <strong className="text-sm font-bold">B</strong>
const ItalicIcon = () => <em className="text-sm italic font-semibold">I</em>
const UnderlineIcon = () => <span className="text-sm underline font-semibold">U</span>
const StrikeIcon = () => <span className="text-sm line-through font-semibold">S</span>

const ListBulletIcon = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
    <circle cx="2" cy="4.5" r="1.2"/><rect x="5" y="3.8" width="9" height="1.4" rx="0.7"/>
    <circle cx="2" cy="8" r="1.2"/><rect x="5" y="7.3" width="9" height="1.4" rx="0.7"/>
    <circle cx="2" cy="11.5" r="1.2"/><rect x="5" y="10.8" width="9" height="1.4" rx="0.7"/>
  </svg>
)
const ListNumberIcon = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
    <text x="0.5" y="5.5" fontSize="4.5" fontFamily="sans-serif">1.</text>
    <text x="0.5" y="9.5" fontSize="4.5" fontFamily="sans-serif">2.</text>
    <text x="0.5" y="13.5" fontSize="4.5" fontFamily="sans-serif">3.</text>
    <rect x="6.5" y="3.8" width="8.5" height="1.4" rx="0.7"/>
    <rect x="6.5" y="7.8" width="8.5" height="1.4" rx="0.7"/>
    <rect x="6.5" y="11.8" width="8.5" height="1.4" rx="0.7"/>
  </svg>
)
const AlignLeftIcon = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
    <rect x="1" y="2.5" width="14" height="1.5" rx="0.75"/>
    <rect x="1" y="5.5" width="9" height="1.5" rx="0.75"/>
    <rect x="1" y="8.5" width="14" height="1.5" rx="0.75"/>
    <rect x="1" y="11.5" width="7" height="1.5" rx="0.75"/>
  </svg>
)
const AlignCenterIcon = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
    <rect x="1" y="2.5" width="14" height="1.5" rx="0.75"/>
    <rect x="3.5" y="5.5" width="9" height="1.5" rx="0.75"/>
    <rect x="1" y="8.5" width="14" height="1.5" rx="0.75"/>
    <rect x="4.5" y="11.5" width="7" height="1.5" rx="0.75"/>
  </svg>
)
const AlignRightIcon = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
    <rect x="1" y="2.5" width="14" height="1.5" rx="0.75"/>
    <rect x="6" y="5.5" width="9" height="1.5" rx="0.75"/>
    <rect x="1" y="8.5" width="14" height="1.5" rx="0.75"/>
    <rect x="8" y="11.5" width="7" height="1.5" rx="0.75"/>
  </svg>
)
const AlignJustifyIcon = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
    <rect x="1" y="2.5" width="14" height="1.5" rx="0.75"/>
    <rect x="1" y="5.5" width="14" height="1.5" rx="0.75"/>
    <rect x="1" y="8.5" width="14" height="1.5" rx="0.75"/>
    <rect x="1" y="11.5" width="14" height="1.5" rx="0.75"/>
  </svg>
)
const UndoIcon = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 6.5 C3.5 4 5.5 2.5 8 2.5 C10.5 2.5 12.5 4.5 12.5 7 C12.5 9.5 10.5 11.5 8 11.5"/>
    <polyline points="3.5,3.5 3.5,6.5 6.5,6.5"/>
  </svg>
)
const RedoIcon = () => (
  <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.5 6.5 C12.5 4 10.5 2.5 8 2.5 C5.5 2.5 3.5 4.5 3.5 7 C3.5 9.5 5.5 11.5 8 11.5"/>
    <polyline points="12.5,3.5 12.5,6.5 9.5,6.5"/>
  </svg>
)

// ─── Sub-components ───────────────────────────────────────────────────────────
const Separator = () => <div className="w-px h-5 bg-divider mx-0.5 shrink-0" />

const TbBtn = ({ onClick, active, title, disabled, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick() }}
    title={title}
    className={cn(
      'flex items-center justify-center min-w-[28px] h-7 px-1 rounded text-sm transition-colors shrink-0',
      active ? 'bg-primary text-white' : 'text-text-primary hover:bg-gray-100',
      disabled && 'opacity-40 cursor-not-allowed',
    )}
  >
    {children}
  </button>
)

// Heading/paragraph select
const HEADING_OPTIONS = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
]

const FONT_SIZE_OPTIONS = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48]

function getActiveHeading(editor) {
  if (editor.isActive('heading', { level: 1 })) return 'h1'
  if (editor.isActive('heading', { level: 2 })) return 'h2'
  if (editor.isActive('heading', { level: 3 })) return 'h3'
  return 'paragraph'
}

function applyHeading(editor, value) {
  if (value === 'paragraph') editor.chain().focus().setParagraph().run()
  else editor.chain().focus().toggleHeading({ level: Number(value[1]) }).run()
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RichTextEditor({ value, onChange, label, error, disabled, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false, blockquote: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontSize,
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.isEmpty ? '' : editor.getHTML())
    },
  })

  // Sync editor content when value changes externally (e.g. form reset after data load)
  useEffect(() => {
    if (!editor) return
    const incoming = value || ''
    const current = editor.isEmpty ? '' : editor.getHTML()
    if (incoming !== current && !editor.isFocused) {
      editor.commands.setContent(incoming, false)
    }
  }, [value, editor])

  if (!editor) return null

  const activeHeading = getActiveHeading(editor)

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text-primary">{label}</label>}

      <div className={cn(
        'rounded-md border bg-white transition-colors',
        error ? 'border-danger' : 'border-divider focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
        disabled && 'opacity-50 pointer-events-none bg-gray-50',
      )}>

        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-divider px-2 py-1.5">

          {/* Heading select */}
          <select
            value={activeHeading}
            onChange={(e) => applyHeading(editor, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-7 px-1.5 text-xs rounded border border-divider bg-white text-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 mr-1"
          >
            {HEADING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Font size select */}
          <select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              if (v) editor.chain().focus().setFontSize(v).run()
              else editor.chain().focus().unsetFontSize().run()
              e.target.value = ''
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-7 px-1.5 text-xs rounded border border-divider bg-white text-text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 mr-1"
          >
            <option value="">Size</option>
            {FONT_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <Separator />

          {/* Formatting */}
          <TbBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><BoldIcon /></TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><ItalicIcon /></TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon /></TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><StrikeIcon /></TbBtn>

          <Separator />

          {/* Lists */}
          <TbBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><ListBulletIcon /></TbBtn>
          <TbBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListNumberIcon /></TbBtn>

          <Separator />

          {/* Alignment */}
          <TbBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeftIcon /></TbBtn>
          <TbBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenterIcon /></TbBtn>
          <TbBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRightIcon /></TbBtn>
          <TbBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify"><AlignJustifyIcon /></TbBtn>

          <Separator />

          {/* History */}
          <TbBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo"><UndoIcon /></TbBtn>
          <TbBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo"><RedoIcon /></TbBtn>
        </div>

        {/* ── Editor area ── */}
        <EditorContent
          editor={editor}
          className={cn(
            'px-3 py-2.5 min-h-[160px] text-sm text-text-primary',
            '[&_.tiptap]:outline-none [&_.tiptap]:min-h-[140px]',
            '[&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-2',
            '[&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-bold [&_.tiptap_h2]:mb-2',
            '[&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold [&_.tiptap_h3]:mb-1',
            '[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5',
            '[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5',
            '[&_.tiptap_p:not(:last-child)]:mb-2',
            '[&_.tiptap_li]:mb-0.5',
          )}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
