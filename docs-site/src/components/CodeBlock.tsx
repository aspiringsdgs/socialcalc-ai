import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = "javascript" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-language-tag">{language}</span>
        <button
          className={`copy-code-btn ${copied ? "copied" : ""}`}
          onClick={handleCopy}
          title="Copy to clipboard"
          type="button"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};
