"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addToCompare,
  removeFromCompare,
  isInCompare,
  COMPARE_MAX,
} from "@/lib/compare";

interface Props {
  ticker: string;
  name: string;
}

export function AddToCompareButton({ ticker, name }: Props) {
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
        showToast(`비교는 최대 ${COMPARE_MAX}개까지 가능합니다`);
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
        className={"px-3 py-1.5 border rounded-md text-sm transition disabled:opacity-50 " + (
          inBasket
            ? "bg-blue-50 border-blue-300 text-blue-700"
            : "border-zinc-300 text-zinc-700 hover:border-blue-300 hover:text-blue-600"
        )}
        title={name + " 비교 바스켓 " + (inBasket ? "제거" : "추가")}
      >
        {inBasket ? "✓ 비교에서 빼기" : "+ 비교에 추가"}
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
