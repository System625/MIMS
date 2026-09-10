'use client';

import { useState } from 'react';
import { Button } from './ui';

/**
 * "Copy all part numbers" — the action a workshop takes first, because pasting
 * five numbers into a supplier chat beats reading them one at a time.
 */
export function CopyAllNumbers({ numbers, className }: { numbers: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      size="md"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(numbers);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Blocked clipboard. Each number remains selectable in place.
        }
      }}
    >
      {copied ? 'Copied' : 'Copy all part numbers'}
    </Button>
  );
}
