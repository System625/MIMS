'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A manufacturer part number, treated as the load-bearing string it is.
 *
 * The user may read this aloud to a dealer over a bad line, or type it into a
 * counter terminal. So it is set in mono at 14px, `user-select: all` makes it a
 * one-tap selection, `overflow-wrap: anywhere` stops it truncating, and the
 * whole field is the copy target rather than a small icon beside it.
 */
export function PartNumber({ value }: { value: string | null }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (value === null) {
    return (
      <span className="border-edge-2 bg-panel-3 text-faint flex min-h-[42px] items-center border-[1.5px] border-dashed px-[10px] font-mono text-[12px] font-bold uppercase leading-[1.3] tracking-[0.06em]">
        Not on file
      </span>
    );
  }

  async function copy() {
    if (value === null) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard is blocked on insecure origins and some in-app browsers.
      // The number is still selectable, which is the actual guarantee.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy part number ${value}`}
      className="border-ink flex min-h-[42px] w-full items-center gap-2 border-[1.5px] bg-white px-[10px] text-left"
    >
      <span className="select-part-number min-w-0 flex-1 font-mono text-[14px] font-bold leading-[1.2]">
        {value}
      </span>
      <span
        aria-hidden
        className="text-flag-deep flex-none font-mono text-[11px] font-bold leading-none tracking-[0.08em]"
      >
        {copied ? 'COPIED' : 'COPY'}
      </span>
    </button>
  );
}
