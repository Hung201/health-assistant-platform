'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, Heading2, List, ListOrdered, Undo, Redo } from 'lucide-react';

export default function TipTapEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    // Fix hydration mismatch in Next.js App Router.
    immediatelyRender: false,
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL ẢNh');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const buttonStyle = "p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground";
  const activeStyle = "p-2 rounded bg-muted text-foreground font-bold";

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-2">
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? activeStyle : buttonStyle}
          type="button" title="In đậm"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? activeStyle : buttonStyle}
          type="button" title="In nghiêng"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }}
          className={editor.isActive('heading', { level: 2 }) ? activeStyle : buttonStyle}
          type="button" title="Tiêu đề 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
          className={editor.isActive('bulletList') ? activeStyle : buttonStyle}
          type="button" title="Danh sách"
        >
          <List size={16} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
          className={editor.isActive('orderedList') ? activeStyle : buttonStyle}
          type="button" title="Danh sách số"
        >
          <ListOrdered size={16} />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button onClick={(e) => { e.preventDefault(); setLink() }} className={editor.isActive('link') ? activeStyle : buttonStyle} type="button" title="Chèn link">
          <LinkIcon size={16} />
        </button>
        <button onClick={(e) => { e.preventDefault(); addImage() }} className={buttonStyle} type="button" title="Chèn ảnh">
          <ImageIcon size={16} />
        </button>
        <div className="flex-1" />
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().undo().run() }}
          disabled={!editor.can().chain().focus().undo().run()}
          className={buttonStyle} type="button" title="Hoàn tác"
        >
          <Undo size={16} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); editor.chain().focus().redo().run() }}
          disabled={!editor.can().chain().focus().redo().run()}
          className={buttonStyle} type="button" title="Làm lại"
        >
          <Redo size={16} />
        </button>
      </div>
      
      {/* Scrollable Container for tiptap content */}
      <div className="flex-1 max-h-[500px] overflow-y-auto cursor-text px-4 py-2">
         <EditorContent editor={editor} />
      </div>
    </div>
  );
}
