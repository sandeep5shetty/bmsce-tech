"use client";

import { useEffect, useRef, useState } from "react";

import { useParams } from "next/navigation";

import { Response } from "@/types";

type WordItem = { text: string; count: number; colorIdx: number };

const COLORS = [
  "text-red-400",
  "text-green-400",
  "text-blue-400",
  "text-yellow-400",
  "text-pink-400",
  "text-purple-400",
  "text-orange-400",
  "text-cyan-400",
  "text-emerald-400",
];

function sizeClass(count: number) {
  if (count >= 12) return "text-8xl";
  if (count >= 8) return "text-7xl";
  if (count >= 5) return "text-5xl";
  if (count >= 3) return "text-4xl";
  if (count >= 2) return "text-3xl";
  return "text-2xl";
}

export default function LiveWallPage() {
  const params = useParams();
  const questionId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  const [words, setWords] = useState<Record<string, WordItem>>({});
  const [questionText, setQuestionText] = useState("");
  const colorCounterRef = useRef(0);

  function buildWordMap(responses: Response[]) {
    const map: Record<string, WordItem> = {};
    responses.forEach((r) => {
      const key = r.answer.trim().toLowerCase();
      if (!key) return;
      if (map[key]) {
        map[key].count++;
      } else {
        map[key] = {
          text: r.answer.trim(),
          count: 1,
          colorIdx: colorCounterRef.current++ % COLORS.length,
        };
      }
    });
    return map;
  }

  useEffect(() => {
    if (!questionId) return;

    async function poll() {
      const [qRes, rRes] = await Promise.all([
        fetch(`/api/questions/${questionId}`),
        fetch(`/api/poll-responses/${questionId}`),
      ]);
      if (qRes.ok) {
        const q = await qRes.json();
        setQuestionText(q.question ?? "");
      }
      if (rRes.ok) {
        const responses: Response[] = await rRes.json();
        setWords(buildWordMap(responses));
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const wordList = Object.values(words).sort((a, b) => b.count - a.count);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <header className="flex items-center justify-between border-b border-white/10 p-4">
        <div>
          <span className="font-serif text-lg font-semibold">BMSCE.tech</span>
          <span className="text-white/40 ml-2 text-xs">Live Wall</span>
        </div>
        {questionText && (
          <p className="text-white/60 max-w-md truncate text-sm">{questionText}</p>
        )}
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-white/60 text-xs">Live</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-8">
        {wordList.length === 0 ? (
          <p className="animate-pulse text-xl text-white/40">
            Waiting for responses…
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8">
            {wordList.map((word) => (
              <span
                key={word.text}
                className={`font-extrabold tracking-wide transition-all duration-700 ${sizeClass(word.count)} ${COLORS[word.colorIdx]}`}
              >
                {word.text}
              </span>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-4 py-2 text-center">
        <p className="text-white/30 text-xs">
          Polling for updates every 3 seconds &middot;{" "}
          {wordList.reduce((s, w) => s + w.count, 0)} response(s)
        </p>
      </footer>
    </div>
  );
}
