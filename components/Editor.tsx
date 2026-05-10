"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Quote,
  Heading2, Heading3, Link as LinkIcon, Undo2, Redo2, Code,
} from "lucide-react";
import { useCallback } from "react";

interface EditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function Editor({ value, onChange, placeholder = "Commencez à écrire…" }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none focus:outline-none min-h-[400px] py-6 px-6 " +
          "prose-headings:font-semibold prose-headings:text-[#0a0a0a] " +
          "prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 " +
          "prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 " +
          "prose-p:text-[#404040] prose-p:leading-relaxed " +
          "prose-a:text-[#0a0a0a] prose-a:underline prose-a:underline-offset-2 " +
          "prose-strong:text-[#0a0a0a] " +
          "prose-blockquote:border-l-[3px] prose-blockquote:border-[#0a0a0a] prose-blockquote:text-[#525252]",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien (vide pour retirer)", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-[#e5e5e5] rounded-xl bg-white">
        <div className="border-b border-[#e5e5e5] h-11 bg-[#fafafa] rounded-t-xl" />
        <div className="min-h-[400px] py-6 px-6 text-sm text-[#b0b0b0]">Chargement de l'éditeur…</div>
      </div>
    );
  }

  return (
    <div className="border border-[#e5e5e5] rounded-xl bg-white overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#e5e5e5] bg-[#fafafa] px-2 py-1.5">
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Titre H2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Titre H3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras (⌘B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique (⌘I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Barré"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Code inline"
        >
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
        >
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citation"
        >
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>

        <ToolbarSep />

        <ToolbarButton
          active={editor.isActive("link")}
          onClick={setLink}
          title="Lien"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolbarButton>

        <div className="flex-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Annuler (⌘Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rétablir (⌘⇧Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
        active
          ? "bg-[#0a0a0a] text-white"
          : "text-[#737373] hover:bg-[#ebebeb] hover:text-[#0a0a0a]"
      } disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <div className="w-px h-5 bg-[#e5e5e5] mx-1" />;
}
