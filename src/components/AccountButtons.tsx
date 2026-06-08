"use client";

import { useState, useEffect } from "react";
import { Heart, GitCompare, Bot, Bell, X } from "lucide-react";

export function AccountButtons() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:inline-block px-3 py-1.5 text-zinc-600 hover:text-zinc-900 transition text-sm"
      >
        로그인
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition text-sm font-medium"
      >
        시작하기
        <span className="text-[9px] px-1 py-0.5 rounded bg-amber-300 text-amber-900 font-bold">SOON</span>
      </button>

      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 z-[80] backdrop-blur-sm"
            aria-hidden
          />
          <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-500 transition"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>

              <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-2">
                Coming Soon
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">
                계정 기능은 준비 중이에요
              </h2>
              <p className="text-sm text-zinc-600 mb-5 leading-relaxed">
                현재는 로그인 없이도 사이트의 모든 분석 기능을 자유롭게 쓸 수 있어요. 곧 다음 기능들이 추가됩니다.
              </p>

              <ul className="space-y-3 mb-5">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-pink-50 text-pink-700 flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4" fill="currentColor" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">관심 종목 동기화</div>
                    <div className="text-xs text-zinc-600 mt-0.5">여러 기기에서 같은 관심 종목 이어보기</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <GitCompare className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">비교 목록 저장</div>
                    <div className="text-xs text-zinc-600 mt-0.5">자주 비교하는 종목 조합 영구 저장</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">AI 분석 기록</div>
                    <div className="text-xs text-zinc-600 mt-0.5">받았던 Claude 분석을 다시 찾아보기</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">공시·지표 알림</div>
                    <div className="text-xs text-zinc-600 mt-0.5">관심 종목 공시 신호와 지표 변화 알림</div>
                  </div>
                </li>
              </ul>

              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 mb-4">
                <p className="text-xs text-zinc-700 leading-relaxed">
                  지금은 <strong>이 브라우저</strong>에 관심 종목·비교 목록을 저장합니다. 계정 기능이 출시되면 자동으로 옮길 수 있게 준비하고 있어요.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full px-4 py-2.5 bg-zinc-900 text-white rounded-md text-sm font-medium hover:bg-zinc-800 transition"
              >
                알겠어요
              </button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}