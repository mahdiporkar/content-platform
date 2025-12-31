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

type IconProps = {
  children: React.ReactNode;
  viewBox?: string;
};

const Icon = ({ children, viewBox = "0 0 24 24" }: IconProps) => (
  <svg
    className="editor-icon"
    viewBox={viewBox}
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

type IconButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

const IconButton = ({ label, onClick, active, disabled, children }: IconButtonProps) => (
  <button
    type="button"
    className={`editor-button icon ${active ? "active" : ""}`}
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
  >
    {children}
  </button>
);

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
          <IconButton
            label="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <span className="editor-text">H1</span>
          </IconButton>
          <IconButton
            label="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <span className="editor-text">H2</span>
          </IconButton>
          <IconButton
            label="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <span className="editor-text">H3</span>
          </IconButton>
        </div>
        <div className="editor-group">
          <IconButton
            label="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Icon>
              <path d="M7 4h6a3 3 0 0 1 0 6H7V4zm0 6h7a3 3 0 0 1 0 6H7v-6z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Icon>
              <path d="M10 4h8v2h-3l-4 12h3v2H6v-2h3l4-12h-3z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Icon>
              <path d="M7 4v6a5 5 0 0 0 10 0V4h2v6a7 7 0 0 1-14 0V4h2zm-2 16h14v2H5v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Icon>
              <path d="M4 11h16v2H4v-2zm4-5h4a4 4 0 0 1 4 4h-2a2 2 0 0 0-2-2H8V6zm0 12h4a4 4 0 0 0 4-4h-2a2 2 0 0 1-2 2H8v2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Highlight"
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Icon>
              <path d="M6 2h12v6l-6 6-6-6V2zm-1 18h14v2H5v-2z" />
            </Icon>
          </IconButton>
          <label className="editor-color">
            <span>Color</span>
            <input
              type="color"
              onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
            />
          </label>
        </div>
        <div className="editor-group">
          <IconButton
            label="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <Icon>
              <path d="M4 6h2v2H4V6zm4 0h12v2H8V6zm-4 5h2v2H4v-2zm4 0h12v2H8v-2zm-4 5h2v2H4v-2zm4 0h12v2H8v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <Icon>
              <path d="M4 6h2v2H4V6zm4 0h12v2H8V6zm-4 5h2v2H4v-2zm4 0h12v2H8v-2zm-4 5h2v2H4v-2zm4 0h12v2H8v-2z" />
              <path d="M2 7h1v6H2V7zm1 10H2v-1h1v1z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Icon>
              <path d="M6 6h6v4H8v8H6V6zm8 0h6v4h-4v8h-2V6z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Code block"
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Icon>
              <path d="M9 6 5 12l4 6M15 6l4 6-4 6" />
            </Icon>
          </IconButton>
        </div>
        <div className="editor-group">
          <IconButton
            label="Align left"
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <Icon>
              <path d="M4 6h12v2H4V6zm0 5h16v2H4v-2zm0 5h12v2H4v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Align center"
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <Icon>
              <path d="M6 6h12v2H6V6zm-2 5h16v2H4v-2zm2 5h12v2H6v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Align right"
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <Icon>
              <path d="M8 6h12v2H8V6zM4 11h16v2H4v-2zm4 5h12v2H8v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Justify"
            active={editor.isActive({ textAlign: "justify" })}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <Icon>
              <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
            </Icon>
          </IconButton>
        </div>
        <div className="editor-group">
          <IconButton label="Insert link" onClick={setLink}>
            <Icon>
              <path d="M10 7h3v2h-3a2 2 0 1 0 0 4h3v2h-3a4 4 0 1 1 0-8zm4 0h3a4 4 0 1 1 0 8h-3v-2h3a2 2 0 1 0 0-4h-3V7zM11 10h2v4h-2v-4z" />
            </Icon>
          </IconButton>
          <IconButton label="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
            <Icon>
              <path d="M10 7h3v2h-3a2 2 0 1 0 0 4h3v2h-3a4 4 0 1 1 0-8z" />
              <path d="M14 7h3a4 4 0 1 1 0 8h-3" />
              <path d="M4 4l16 16" />
            </Icon>
          </IconButton>
          <IconButton
            label="Insert table"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <Icon>
              <path d="M4 5h16v14H4V5zm2 2v4h5V7H6zm7 0v4h5V7h-5zm-7 6v4h5v-4H6zm7 0v4h5v-4h-5z" />
            </Icon>
          </IconButton>
          <IconButton label="Insert divider" onClick={() => editor.chain().focus().toggleHorizontalRule().run()}>
            <Icon>
              <path d="M4 11h16v2H4v-2z" />
            </Icon>
          </IconButton>
        </div>
        <div className="editor-group">
          <IconButton
            label="Insert image"
            onClick={() => imageInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            <Icon>
              <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 6 3-3 4 4H8zm8-5a2 2 0 1 0 0.001-0.001z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Insert video"
            onClick={() => videoInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            <Icon>
              <path d="M4 6h12v12H4V6zm12 3 4-2v10l-4-2V9z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            <Icon>
              <path d="M6 4h8l4 4v12H6V4zm8 1.5V8h2.5L14 5.5z" />
            </Icon>
          </IconButton>
        </div>
        <div className="editor-group">{imageSizeButtons}</div>
        <div className="editor-group">
          <IconButton
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Icon>
              <path d="M7 7 3 11l4 4v-3h7a4 4 0 1 1 0 8h-2v2h2a6 6 0 1 0 0-12H7V7z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Icon>
              <path d="M17 7v3h-7a4 4 0 1 0 0 8h2v2h-2a6 6 0 1 1 0-12h7V7l4 4-4 4V7z" />
            </Icon>
          </IconButton>
        </div>
      </div>
      <div className="editor-asset-bar">
        <div>
          <div className="asset-title">Media & attachments</div>
          <div className="muted">Upload assets and they will be inserted in the content.</div>
        </div>
        <div className="asset-actions">
          <button
            type="button"
            className="asset-button"
            onClick={() => imageInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            Add image
          </button>
          <button
            type="button"
            className="asset-button"
            onClick={() => videoInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            Add video
          </button>
          <button
            type="button"
            className="asset-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUpload || uploading}
          >
            Attach file
          </button>
        </div>
        {uploading && <div className="asset-status">Uploading...</div>}
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
