'use client';

import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AdaptiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  maxHeight?: string;
}

const AdaptiveTextarea = forwardRef<HTMLTextAreaElement, AdaptiveTextareaProps>(
  ({ className, error, maxHeight = '300px', ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [height, setHeight] = useState('auto');

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate new height based on scrollHeight
      const newHeight = `${Math.min(textarea.scrollHeight, parseInt(maxHeight))}px`;
      textarea.style.height = newHeight;
      setHeight(newHeight);
    };

    useEffect(() => {
      // Set the forwarded ref to our internal ref
      if (typeof ref === 'function') {
        ref(textareaRef.current);
      } else if (ref) {
        ref.current = textareaRef.current;
      }

      adjustHeight();
    }, [ref, props.value]);

    return (
      <textarea
        ref={textareaRef}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        style={{ height, overflow: height === maxHeight ? 'auto' : 'hidden' }}
        onChange={(e) => {
          adjustHeight();
          props.onChange?.(e);
        }}
        {...props}
      />
    );
  }
);

AdaptiveTextarea.displayName = "AdaptiveTextarea";

export default AdaptiveTextarea;