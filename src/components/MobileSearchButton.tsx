"use client";

import { useEffect, useState } from "react";
import { GlobalSearch } from "./GlobalSearch";

interface Props {
  data: {
    stocks: Array<{ name: string; ticker: string; themes: string[]; compositeScore?: number }>;
    themes: string[];
  };
}

export function MobileSearchButton({ data }: Props) {
  const [open, setOpen] = useState(false);

  // 寃???대졇????body ?ㅽ겕濡?留됯린
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="寃???닿린"
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-md text-zinc-700 hover:bg-zinc-100 transition shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-0 bg-white shadow-xl">
            <div className="flex items-center gap-2 px-3 py-3 border-b border-zinc-200">
              <div className="flex-1">
                <GlobalSearch stocks={data.stocks} themes={data.themes} />
              </div>
              <button
                type="button"
                aria-label="寃???リ린"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md text-zinc-500 hover:bg-zinc-100 transition shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
