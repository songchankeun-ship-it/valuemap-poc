"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  ticker: string;
  name: string;
}

const STORAGE_KEY = "valuemap_compare_basket";

export function AddToCompareButton({ ticker, name }: Props) {
  const [inBasket, setInBasket] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const list: string[] = JSON.parse(raw);
      setInBasket(list.includes(ticker));
    } catch {}
  }, [ticker]);

  const toggle = () => {
    let list: string[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) list = JSON.parse(raw);
    } catch {}
    const willBeInBasket = !inBasket;
    if (inBasket) {
      list = list.filter((t) => t !== ticker);
    } else {
      if (list.length >= 4) {
        setToast({ msg: "비교는 최대 4개까지 가능합니다", show: true });
        setTimeout(() => setToast({ msg: "", show: false }), 3000);
        return;
      }
      list.push(ticker);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setInBasket(willBeInBasket);
    window.dispatchEvent(new CustomEvent("compare-basket-changed"));
    setToast({
      msg: willBeInBasket
        ? name + "을(를) 비교함에 추가했습니다"
        : name + "을(를) 비교함에서 제거했습니다",
      show: true,
    });
    setTimeout(() => setToast({ msg: "", show: false }), 3000);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        className={"px-3 py-1.5 border rounded-md text-sm transition " + (
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