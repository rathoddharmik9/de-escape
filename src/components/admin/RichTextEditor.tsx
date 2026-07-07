"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect, useCallback } from "react";

/* ─── Toolbar button ─── */
function Btn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-[var(--green)] text-[var(--cream)] shadow-sm"
          : "text-[var(--ink-dim)] hover:bg-[var(--cream-deep)] hover:text-[var(--green-ink)]"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Separator ─── */
function Sep() {
  return <div className="w-px h-5 bg-[var(--surface-border)] mx-0.5" />;
}

/* ─── Toolbar ─── */
function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-[var(--surface-border)] bg-[var(--cream-soft)]/60 rounded-t-xl">
      {/* Text style */}
      <Btn
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading"
      >
        H2
      </Btn>
      <Btn
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Sub-heading"
      >
        H3
      </Btn>

      <Sep />

      {/* Inline marks */}
      <Btn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (⌘B)"
      >
        <strong>B</strong>
      </Btn>
      <Btn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (⌘I)"
      >
        <em>I</em>
      </Btn>
      <Btn
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (⌘U)"
      >
        <u>U</u>
      </Btn>
      <Btn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <s>S</s>
      </Btn>

      <Sep />

      {/* Lists */}
      <Btn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        • List
      </Btn>
      <Btn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        1. List
      </Btn>

      <Sep />

      {/* Block elements */}
      <Btn
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        ❝ Quote
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        ― Line
      </Btn>
    </div>
  );
}

/* ─── Initial Value Formatting Helper ─── */
function formatInitialValue(val: string): string {
  if (!val) return "";
  // If the content already contains HTML block tags, use it as-is
  if (/<(?:p|h[1-6]|ul|ol|li|blockquote|hr)\b/i.test(val)) {
    return val;
  }
  // Convert legacy plain-text: double newlines → paragraph breaks, single newlines → line breaks
  return val
    .replace(/(?:\r\n|\r|\n){2,}/g, "</p><p>")
    .replace(/(?:\r\n|\r|\n)/g, "<br />")
    .replace(/^/, "<p>").replace(/$/, "</p>");
}

/* ─── Main Editor Component ─── */
interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your event description…",
  error,
}: RichTextEditorProps) {
  const handleUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: formatInitialValue(value),
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none px-4 py-3 min-h-[200px] outline-none focus:outline-none text-[var(--green-ink)] leading-relaxed",
      },
    },
  });

  // Sync external value changes (e.g. initial load)
  useEffect(() => {
    if (editor) {
      const formatted = formatInitialValue(value);
      if (formatted !== editor.getHTML()) {
        editor.commands.setContent(formatted, { emitUpdate: false });
      }
    }
    // Only re-sync when value changes externally, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={`w-full rounded-xl border bg-[var(--cream-soft)] min-h-[200px] animate-pulse ${
          error ? "border-[var(--danger)]" : "border-[var(--surface-border)]"
        }`}
      />
    );
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-200 bg-[var(--cream-soft)] ${
        error
          ? "border-[var(--danger)]"
          : editor.isFocused
          ? "border-[var(--green)] shadow-[0_0_0_3px_rgba(200,241,53,0.25)]"
          : "border-[var(--surface-border)]"
      }`}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
