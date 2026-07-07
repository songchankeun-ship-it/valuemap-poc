"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitCompare } from "lucide-react";
import {
  addToCompare,
  removeFromCompare,
  isInCompare,
  COMPARE_MAX,
} from "@/lib/compare";
import { FOCUS_RING } from "@/components/ui/controlStyles";

interface Props {
  ticker: string;
  name: string;
  compact?: boolean;
  /** compact이어도 짧은 텍스트 라벨(예: "비교")을 노출하고 싶을 때. 미지정 시 아이콘 전용. */
  label?: string;
}

export function AddToCompareButton({ ticker, name, compact = false, label }: Props) {
  const [inBasket, setInBasket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });

  useEffect(() => {
    let mounted = true;
    isInCompare(ticker).then((result) => {
      if (mounted) {
        setInBasket(result);
        setLoading(false);
      }
    });

    function onChange() {
      isInCompare(ticker).then((result) => {
        if (mounted) setInBasket(result);
      });
    }
    window.addEventListener("compare-basket-changed", onChange);
    return () => {
      mounted = false;
      window.removeEventListener("compare-basket-changed", onChange);
    };
  }, [ticker]);

  function showToast(msg: string) {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 3000);
  }

  async function toggle() {
    if (loading) return;

    if (inBasket) {
      setInBasket(false); // 낙관적
      await removeFromCompare(ticker);
      showToast(name + "을(를) 비교함에서 제거했습니다");
    } else {
      // 낙관적 업데이트 전에 결과 확인 필요 (최대 4개 제한)
      const result = await addToCompare(ticker);
      if (result.ok) {
        setInBasket(true);
        showToast(name + "을(를) 비교함에 추가했습니다");
      } else if (result.reason === "max") {
        showToast(`비교는 최대 ${COMPARE_MAX}개까지 가능해요 — 하나를 빼고 추가하세요`);
      } else {
        showToast("추가에 실패했습니다. 다시 시도해주세요.");
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className={"inline-flex items-center " + (compact && !label ? "justify-center w-11 px-0" : compact ? "gap-1 px-3" : "px-3.5") + " py-2.5 min-h-[44px] border rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed " + FOCUS_RING + " " + (
          inBasket
            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900 text-blue-700 dark:text-blue-300"
            : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-700 dark:hover:text-blue-400"
        )}
        title={name + " 비교 바스켓 " + (inBasket ? "제거" : "추가")}
      >
        <GitCompare className="h-4 w-4 shrink-0" aria-hidden="true" />
        {compact && !label ? (
          <span className="sr-only">{inBasket ? "비교에서 빼기" : "비교에 추가"}</span>
        ) : compact ? (
          <span className="truncate">{label}</span>
        ) : (
          <span className="ml-1.5">{inBasket ? "✓ 비교에서 빼기" : "+ 비교에 추가"}</span>
        )}
      </button>

      {toast.show ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm flex items-center gap-3 max-w-[90vw]">
          <span className="truncate">{toast.msg}</span>
          <Link
            href="/compare"
            className="text-blue-300 hover:text-blue-200 hover:underline shrink-0 font-medium"
          >
            비교 보기 →
          </Link>
        </div>
      ) : null}
    </>
  );
}
