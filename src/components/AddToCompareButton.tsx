"use client";

import { useEffect, useState } from "react";

interface Props {
  ticker: string;
  name: string;
}

const STORAGE_KEY = "valuemap_compare_basket";

export function AddToCompareButton({ ticker, name }: Props) {
  const [inBasket, setInBasket] = useState(false);

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
    if (inBasket) {
      list = list.filter((t) => t !== ticker);
    } else {
      if (list.length >= 4) {
        alert("비교는 최대 4개까지 가능합니다.");
        return;
      }
      list.push(ticker);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setInBasket(!inBasket);
    window.dispatchEvent(new CustomEvent("compare-basket-changed"));
  };

  return (
    <button
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
  );
}