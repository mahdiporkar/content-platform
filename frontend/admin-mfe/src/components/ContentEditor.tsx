import React, { useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { uploadMedia } from "../api/media";
import type { MediaKind } from "../api/media";
import type { MediaUploadResponse } from "../types";

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.style.width || element.getAttribute("width") || "100%",
        renderHTML: (attributes) => ({ style: `width: ${attributes.width};` })
      }
    };
  }
});

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      width: { default: "100%" }
    };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, { controls: HTMLAttributes.controls ? "controls" : null })
    ];
  }
});

const toolbarImageWidths = [
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" }
];

type Props = {
  applicationId: string | null;
  value: string;
  onChange: (value: string) => void;
};

export const ContentEditor = ({ applicationId, value, onChange }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: true }),
      Underline,
      Highlight,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Video
    ],
    content: value,
    onUpdate: ({ editor: tiptap }) => onChange(tiptap.getHTML())
  });

  const canUpload = Boolean(applicationId);

  const handleUpload = async (file: File, kind: MediaKind) => {
    if (!canUpload || !applicationId || !editor) {
      setError("Application ID is required before uploading media.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const response: MediaUploadResponse = await uploadMedia(file, applicationId, kind);
      if (kind === "image") {
        editor.chain().focus().setImage({ src: response.url, alt: file.name, width: "100%" }).run();
      } else if (kind === "video") {
        editor.chain().focus().insertContent({ type: "video", attrs: { src: response.url } }).run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent(
            `<a href="${response.url}" target="_blank" rel="noopener noreferrer">${file.name}</a>`
          )
          .run();
      }
    } catch (err) {
      setError("Media upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, kind: MediaKind) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleUpload(file, kind);
    }
    event.target.value = "";
  };

  const setLink = () => {
    if (!editor) {
      return;
    }
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Paste the link URL", previousUrl);
    if (url === null) {
      return;
    }
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const imageSizeButtons = useMemo(
    () =>
      toolbarImageWidths.map((option) => (
        <button
          key={option.value}
          type="button"
          className="editor-button"
          onClick={() => editor?.chain().focus().updateAttributes("image", { width: option.value }).run()}
          disabled={!editor || !editor.isActive("image")}
        >
          {option.label}
        </button>
      )),
    [editor]
  );

  if (!editor) {
    return <div className="muted">Loading editor...</div>;
  }

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div className="editor-group">
          <button
            type="button"
            className={`editor-button ${editor.isActive("heading", { level: 1 }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("heading", { level: 2 }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("heading", { level: 3 }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </button>
        </div>
        <div className="editor-group">
          <button
            type="button"
            className={`editor-button ${editor.isActive("bold") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            Bold
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("italic") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            Italic
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("underline") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            Underline
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("strike") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            Strike
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("highlight") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            Highlight
          </button>
          <label className="editor-color">
            <span>Color</span>
            <input
              type="color"
              onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
            />
          </label>
        </div>
        <div className="editor-group">
          <button
            type="button"
            className={`editor-button ${editor.isActive("bulletList") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            Bullet
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("orderedList") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            Numbered
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("blockquote") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            Quote
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive("codeBlock") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            Code
          </button>
        </div>
        <div className="editor-group">
          <button
            type="button"
            className={`editor-button ${editor.isActive({ textAlign: "left" }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            Left
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive({ textAlign: "center" }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            Center
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive({ textAlign: "right" }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            Right
          </button>
          <button
            type="button"
            className={`editor-button ${editor.isActive({ textAlign: "justify" }) ? "active" : ""}`}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            Justify
          </button>
        </div>
        <div className="editor-group">
          <button type="button" className="editor-button" onClick={setLink}>
            Link
          </button>
          <button
            type="button"
            className="editor-button"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            Unlink
          </button>
          <button
            type="button"
            className="editor-button"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            Table
          </button>
          <button
            type="button"
            className="editor-button"
            onClick={() => editor.chain().focus().toggleHorizontalRule().run()}
          >
            Divider
          </button>
        </div>
        <div className="editor-group">
          <button
            type="button"
            className="editor-button"
            onClick={() => imageInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            Image
          </button>
          <button
            type="button"
            className="editor-button"
            onClick={() => videoInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            Video
          </button>
          <button
            type="button"
            className="editor-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            File
          </button>
        </div>
        <div className="editor-group">{imageSizeButtons}</div>
        <div className="editor-group">
          <button
            type="button"
            className="editor-button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            Undo
          </button>
          <button
            type="button"
            className="editor-button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            Redo
          </button>
        </div>
      </div>
      {error && <div className="editor-error">{error}</div>}
      <EditorContent editor={editor} className="editor-content" />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => handleInputChange(event, "image")}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(event) => handleInputChange(event, "video")}
      />
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={(event) => handleInputChange(event, "file")}
      />
    </div>
  );
};
