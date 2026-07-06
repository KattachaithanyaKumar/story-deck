//@ts-nocheck
import React from "react";

interface MarkdownViewerProps {
  text?: string;
}

export function MarkdownViewer({ text = "" }: MarkdownViewerProps) {
  if (!text.trim()) {
    return <span className="text-slate-400 italic text-sm">No description provided.</span>;
  }

  const lines = text.split("\n");

  const renderedLines = lines.map((line, idx) => {
    let trimmed = line.trim();

    // Check headings
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={idx} className="text-base font-bold text-slate-100 mt-3 mb-1 font-display">
          {parseInlineMarkdown(trimmed.substring(4))}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={idx} className="text-lg font-bold text-slate-100 mt-4 mb-2 font-display">
          {parseInlineMarkdown(trimmed.substring(3))}
        </h3>
      );
    }
    if (trimmed.startsWith("# ")) {
      return (
        <h2 key={idx} className="text-xl font-bold text-slate-100 mt-5 mb-3 font-display">
          {parseInlineMarkdown(trimmed.substring(2))}
        </h2>
      );
    }

    // Check list item
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <li key={idx} className="ml-4 list-disc text-slate-300 text-sm py-0.5">
          {parseInlineMarkdown(trimmed.substring(2))}
        </li>
      );
    }

    // Numbered list item
    const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
    if (numMatch) {
      return (
        <li key={idx} className="ml-4 list-decimal text-slate-300 text-sm py-0.5" value={parseInt(numMatch[1], 10)}>
          {parseInlineMarkdown(numMatch[2])}
        </li>
      );
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      return (
        <blockquote key={idx} className="border-l-4 border-slate-600 pl-3 italic text-slate-400 my-2 text-sm">
          {parseInlineMarkdown(trimmed.substring(2))}
        </blockquote>
      );
    }

    // Empty line
    if (trimmed === "") {
      return <div key={idx} className="h-2" />;
    }

    // Standard paragraph
    return (
      <p key={idx} className="text-slate-300 text-sm leading-relaxed mb-1.5">
        {parseInlineMarkdown(line)}
      </p>
    );
  });

  return <div className="space-y-1">{renderedLines}</div>;
}

// Simple parser for inline elements: **, *, `, [text](url)
function parseInlineMarkdown(text: string): React.ReactNode[] {
  let parts: React.ReactNode[] = [text];

  // Helper function to process regex replacements in parts
  function processRegex(
    regex: RegExp,
    replacer: (match: string, p1: string, p2?: string) => React.ReactNode
  ) {
    const nextParts: React.ReactNode[] = [];
    for (const part of parts) {
      if (typeof part !== "string") {
        nextParts.push(part);
        continue;
      }

      let lastIndex = 0;
      let match;
      regex.lastIndex = 0; // reset

      while ((match = regex.exec(part)) !== null) {
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
          nextParts.push(part.substring(lastIndex, matchIndex));
        }

        // p1 is typically first capture group, p2 is optional second
        nextParts.push(replacer(match[0], match[1], match[2]));
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < part.length) {
        nextParts.push(part.substring(lastIndex));
      }
    }
    parts = nextParts;
  }

  // Links: [label](url)
  processRegex(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
      id={`md-link-${Math.random().toString(36).substr(2, 5)}`}
    >
      {label}
    </a>
  ));

  // Bold: **text**
  processRegex(/\*\*([^*]+)\*\*/g, (_, boldText) => (
    <strong className="font-semibold text-white">{boldText}</strong>
  ));

  // Italic: *text*
  processRegex(/\*([^*]+)\*/g, (_, italicText) => (
    <em className="italic text-slate-200">{italicText}</em>
  ));

  // Inline Code: `code`
  processRegex(/`([^`]+)`/g, (_, codeText) => (
    <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700/50">
      {codeText}
    </code>
  ));

  return parts;
}
