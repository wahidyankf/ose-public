import React from "react";

interface HighlightTextProps {
  text: string;
  searchTerm: string;
}

export const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-300 text-gray-900">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

export const HighlightText: React.FC<HighlightTextProps> = ({ text, searchTerm }) => {
  return <>{highlightText(text, searchTerm)}</>;
};
