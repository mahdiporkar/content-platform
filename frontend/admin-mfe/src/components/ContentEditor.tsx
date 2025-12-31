import React, { useMemo, useRef, useState } from "react";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
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

type MediaNodeViewProps = {
  node: { attrs: { src: string; width?: string; align?: string; float?: string } };
  updateAttributes: (attrs: Record<string, string>) => void;
  selected: boolean;
  editor: { view: { dom: HTMLElement } };
};

const clampWidth = (value: number) => Math.min(100, Math.max(20, value));

const ImageNodeView = ({ node, updateAttributes, selected, editor }: MediaNodeViewProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const startResize = (event: React.MouseEvent<HTMLButtonElement>, direction: "left" | "right") => {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = wrapperRef.current;
    const container = editor.view.dom;
    if (!wrapper || !container) {
      return;
    }
    const startX = event.clientX;
    const startWidth = wrapper.getBoundingClientRect().width;
    const containerWidth = container.getBoundingClientRect().width;

    const handleMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = direction === "right" ? startWidth + delta : startWidth - delta;
      const nextPercent = clampWidth((nextWidth / containerWidth) * 100);
      updateAttributes({ width: `${nextPercent}%` });
    };

    const stopResize = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopResize);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopResize);
  };

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`media-node ${selected ? "selected" : ""}`}
      data-align={node.attrs.align ?? "center"}
      data-float={node.attrs.float ?? "none"}
      style={{ width: node.attrs.width ?? "100%" }}
    >
      <img src={node.attrs.src} alt="" className="media-node__content" />
      <div className="media-node__handles">
        <button
          className="media-node__handle left"
          type="button"
          onMouseDown={(event) => startResize(event, "left")}
          aria-label="Resize image"
        />
        <button
          className="media-node__handle right"
          type="button"
          onMouseDown={(event) => startResize(event, "right")}
          aria-label="Resize image"
        />
      </div>
    </NodeViewWrapper>
  );
};

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.style.width || element.getAttribute("width") || "100%",
        renderHTML: (attributes) => ({ style: `width: ${attributes.width};` })
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align })
      },
      float: {
        default: "none",
        parseHTML: (element) => element.getAttribute("data-float") || "none",
        renderHTML: (attributes) => ({ "data-float": attributes.float })
      }
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  }
});

const VideoNodeView = ({ node, updateAttributes, selected, editor }: MediaNodeViewProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const startResize = (event: React.MouseEvent<HTMLButtonElement>, direction: "left" | "right") => {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = wrapperRef.current;
    const container = editor.view.dom;
    if (!wrapper || !container) {
      return;
    }
    const startX = event.clientX;
    const startWidth = wrapper.getBoundingClientRect().width;
    const containerWidth = container.getBoundingClientRect().width;

    const handleMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const nextWidth = direction === "right" ? startWidth + delta : startWidth - delta;
      const nextPercent = clampWidth((nextWidth / containerWidth) * 100);
      updateAttributes({ width: `${nextPercent}%` });
    };

    const stopResize = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stopResize);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stopResize);
  };

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className={`media-node ${selected ? "selected" : ""}`}
      data-align={node.attrs.align ?? "center"}
      data-float={node.attrs.float ?? "none"}
      style={{ width: node.attrs.width ?? "100%" }}
    >
      <video src={node.attrs.src} controls className="media-node__content" />
      <div className="media-node__handles">
        <button
          className="media-node__handle left"
          type="button"
          onMouseDown={(event) => startResize(event, "left")}
          aria-label="Resize video"
        />
        <button
          className="media-node__handle right"
          type="button"
          onMouseDown={(event) => startResize(event, "right")}
          aria-label="Resize video"
        />
      </div>
    </NodeViewWrapper>
  );
};

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      controls: { default: true },
      width: { default: "100%" },
      align: { default: "center" },
      float: { default: "none" }
    };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: HTMLAttributes.controls ? "controls" : null,
        "data-align": HTMLAttributes.align,
        "data-float": HTMLAttributes.float
      })
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
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
  const [imageWidthValue, setImageWidthValue] = useState(100);
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
    onUpdate: ({ editor: tiptap }) => onChange(tiptap.getHTML()),
    onSelectionUpdate: ({ editor: tiptap }) => {
      if (!tiptap.isActive("image")) {
        return;
      }
      const width = tiptap.getAttributes("image")?.width;
      if (typeof width === "string") {
        const numeric = Number(width.replace("%", ""));
        if (!Number.isNaN(numeric)) {
          setImageWidthValue(Math.min(100, Math.max(20, numeric)));
        }
      }
    }
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
        editor
          .chain()
          .focus()
          .setImage({ src: response.url, alt: file.name, width: "100%", align: "center", float: "none" })
          .run();
      } else if (kind === "video") {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "video",
            attrs: { src: response.url, width: "100%", align: "center", float: "none" }
          })
          .run();
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

  const handleImageResize = (value: number) => {
    const clamped = Math.min(100, Math.max(20, value));
    setImageWidthValue(clamped);
    editor.chain().focus().updateAttributes("image", { width: `${clamped}%` }).run();
  };

  const setImageAlign = (align: "left" | "center" | "right") => {
    if (!editor.isActive("image")) {
      return;
    }
    editor.chain().focus().updateAttributes("image", { align, float: "none" }).run();
  };

  const setImageFloat = (float: "left" | "right" | "none") => {
    if (!editor.isActive("image")) {
      return;
    }
    editor.chain().focus().updateAttributes("image", { float, align: "center" }).run();
  };

  const setVideoAlign = (align: "left" | "center" | "right") => {
    if (!editor.isActive("video")) {
      return;
    }
    editor.chain().focus().updateAttributes("video", { align, float: "none" }).run();
  };

  const setVideoFloat = (float: "left" | "right" | "none") => {
    if (!editor.isActive("video")) {
      return;
    }
    editor.chain().focus().updateAttributes("video", { float, align: "center" }).run();
  };

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
        <div className={`editor-group editor-resize ${editor.isActive("image") ? "" : "disabled"}`}>
          <span className="editor-label">Image size</span>
          <input
            className="editor-slider"
            type="range"
            min={20}
            max={100}
            value={imageWidthValue}
            onChange={(event) => handleImageResize(Number(event.target.value))}
            disabled={!editor.isActive("image")}
          />
          <span className="editor-value">{imageWidthValue}%</span>
          <button
            type="button"
            className="editor-button"
            onClick={() => handleImageResize(100)}
            disabled={!editor.isActive("image")}
          >
            Reset
          </button>
        </div>
        <div className={`editor-group editor-align ${editor.isActive("image") ? "" : "disabled"}`}>
          <span className="editor-label">Image align</span>
          <IconButton
            label="Align image left"
            active={editor.isActive("image") && editor.getAttributes("image").align === "left"}
            onClick={() => setImageAlign("left")}
            disabled={!editor.isActive("image")}
          >
            <Icon>
              <path d="M4 7h10v2H4V7zm0 4h14v2H4v-2zm0 4h10v2H4v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Align image center"
            active={editor.isActive("image") && editor.getAttributes("image").align === "center"}
            onClick={() => setImageAlign("center")}
            disabled={!editor.isActive("image")}
          >
            <Icon>
              <path d="M7 7h10v2H7V7zm-2 4h14v2H5v-2zm2 4h10v2H7v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Align image right"
            active={editor.isActive("image") && editor.getAttributes("image").align === "right"}
            onClick={() => setImageAlign("right")}
            disabled={!editor.isActive("image")}
          >
            <Icon>
              <path d="M10 7h10v2H10V7zm-4 4h14v2H6v-2zm4 4h10v2H10v-2z" />
            </Icon>
          </IconButton>
        </div>
        <div className={`editor-group editor-float ${editor.isActive("image") ? "" : "disabled"}`}>
          <span className="editor-label">Wrap text</span>
          <IconButton
            label="Float image left"
            active={editor.isActive("image") && editor.getAttributes("image").float === "left"}
            onClick={() => setImageFloat("left")}
            disabled={!editor.isActive("image")}
          >
            <Icon>
              <path d="M4 7h8v6H4V7zm10 0h6v2h-6V7zm0 4h6v2h-6v-2zm-10 6h16v2H4v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Float image right"
            active={editor.isActive("image") && editor.getAttributes("image").float === "right"}
            onClick={() => setImageFloat("right")}
            disabled={!editor.isActive("image")}
          >
            <Icon>
              <path d="M12 7h8v6h-8V7zM4 7h6v2H4V7zm0 4h6v2H4v-2zm0 6h16v2H4v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Clear float"
            active={editor.isActive("image") && editor.getAttributes("image").float === "none"}
            onClick={() => setImageFloat("none")}
            disabled={!editor.isActive("image")}
          >
            <Icon>
              <path d="M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
            </Icon>
          </IconButton>
        </div>
        <div className={`editor-group editor-align ${editor.isActive("video") ? "" : "disabled"}`}>
          <span className="editor-label">Video align</span>
          <IconButton
            label="Align video left"
            active={editor.isActive("video") && editor.getAttributes("video").align === "left"}
            onClick={() => setVideoAlign("left")}
            disabled={!editor.isActive("video")}
          >
            <Icon>
              <path d="M4 7h10v2H4V7zm0 4h14v2H4v-2zm0 4h10v2H4v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Align video center"
            active={editor.isActive("video") && editor.getAttributes("video").align === "center"}
            onClick={() => setVideoAlign("center")}
            disabled={!editor.isActive("video")}
          >
            <Icon>
              <path d="M7 7h10v2H7V7zm-2 4h14v2H5v-2zm2 4h10v2H7v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Align video right"
            active={editor.isActive("video") && editor.getAttributes("video").align === "right"}
            onClick={() => setVideoAlign("right")}
            disabled={!editor.isActive("video")}
          >
            <Icon>
              <path d="M10 7h10v2H10V7zm-4 4h14v2H6v-2zm4 4h10v2H10v-2z" />
            </Icon>
          </IconButton>
        </div>
        <div className={`editor-group editor-float ${editor.isActive("video") ? "" : "disabled"}`}>
          <span className="editor-label">Wrap video</span>
          <IconButton
            label="Float video left"
            active={editor.isActive("video") && editor.getAttributes("video").float === "left"}
            onClick={() => setVideoFloat("left")}
            disabled={!editor.isActive("video")}
          >
            <Icon>
              <path d="M4 7h8v6H4V7zm10 0h6v2h-6V7zm0 4h6v2h-6v-2zm-10 6h16v2H4v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Float video right"
            active={editor.isActive("video") && editor.getAttributes("video").float === "right"}
            onClick={() => setVideoFloat("right")}
            disabled={!editor.isActive("video")}
          >
            <Icon>
              <path d="M12 7h8v6h-8V7zM4 7h6v2H4V7zm0 4h6v2H4v-2zm0 6h16v2H4v-2z" />
            </Icon>
          </IconButton>
          <IconButton
            label="Clear video float"
            active={editor.isActive("video") && editor.getAttributes("video").float === "none"}
            onClick={() => setVideoFloat("none")}
            disabled={!editor.isActive("video")}
          >
            <Icon>
              <path d="M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z" />
            </Icon>
          </IconButton>
        </div>
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
