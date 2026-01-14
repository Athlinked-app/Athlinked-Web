'use client';

import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMention } from './useMention';
import MentionSuggestions from './MentionSuggestions';

interface MentionInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  currentUserId: string;
  className?: string;
  disabled?: boolean;
  type?: 'input' | 'textarea';
  rows?: number;
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

export default function MentionInputField({
  value,
  onChange,
  placeholder = '',
  currentUserId,
  className = '',
  disabled = false,
  type = 'input',
  rows = 3,
  onKeyDown,
}: MentionInputFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [suggestionPosition, setSuggestionPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const {
    showSuggestions,
    suggestions,
    selectedIndex,
    handleInputChange,
    handleKeyDown: mentionHandleKeyDown,
    insertMention,
  } = useMention({
    currentUserId,
    value,
    onChange,
  });

  // Update suggestion position when it should be shown
  useEffect(() => {
    const updatePosition = () => {
      if (showSuggestions && suggestions.length > 0 && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setSuggestionPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      } else {
        setSuggestionPosition(null);
      }
    };

    updatePosition();

    // Update position on scroll and resize
    if (showSuggestions && suggestions.length > 0) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showSuggestions, suggestions.length]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    mentionHandleKeyDown(e);
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleMentionSelect = (follower: (typeof suggestions)[0]) => {
    const newCursorPos = insertMention(follower);
    if (inputRef.current && newCursorPos !== undefined) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (
          inputRef.current instanceof HTMLInputElement ||
          inputRef.current instanceof HTMLTextAreaElement
        ) {
          try {
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          } catch (e) {
            // Ignore selection errors
          }
        }
      }, 0);
    }
  };

  const baseClassName = className.includes('rounded-full')
    ? `w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 ${className}`
    : `w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#CB9729] ${className}`;

  const commonProps = {
    ref: inputRef as any,
    value,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    placeholder,
    disabled,
    className: baseClassName,
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0 || !suggestionPosition)
      return null;

    const suggestionsElement = (
      <div
        className="fixed bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[9999]"
        style={{
          top: `${suggestionPosition.top}px`,
          left: `${suggestionPosition.left}px`,
          width: `${suggestionPosition.width}px`,
        }}
      >
        <MentionSuggestions
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleMentionSelect}
        />
      </div>
    );

    // Use portal to render outside the DOM hierarchy to avoid overflow clipping
    if (typeof window !== 'undefined') {
      return createPortal(suggestionsElement, document.body);
    }
    return null;
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        {type === 'textarea' ? (
          <textarea {...commonProps} rows={rows} />
        ) : (
          <input {...commonProps} type="text" />
        )}
      </div>
      {renderSuggestions()}
    </>
  );
}
