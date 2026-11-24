import React from "react";

interface RichTextProps {
  content: string;
}

export default function RichText({ content }: RichTextProps) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
