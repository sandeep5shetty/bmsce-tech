"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Pusher from "pusher-js";
import Link from "next/link";
import Image from "next/image";

type WordItem = {
  text: string;
  count: number;
  lastUpdated: number;
};

export default function LiveResponsesWall() {
  const params = useParams();
  const questionId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const [words, setWords] = useState<Record<string, WordItem>>({});

  /* ===============================
     REALTIME PUSHER LISTENER
     =============================== */
  useEffect(() => {
    if (!questionId) return;

    const pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      }
    );

    const channel = pusher.subscribe(`question-${questionId}`);

    channel.bind("new-response", (data: any) => {
      const normalized = data.answer.trim().toLowerCase();

      setWords((prev) => {
        const existing = prev[normalized];

        return {
          ...prev,
          [normalized]: {
            text: data.answer,
            count: existing ? existing.count + 1 : 1,
            lastUpdated: Date.now(),
          },
        };
      });
    });

    return () => {
      pusher.unsubscribe(`question-${questionId}`);
      pusher.disconnect();
    };
  }, [questionId]);

  /* ===============================
     AUTO REMOVE OLD WORDS (30s)
     =============================== */
  useEffect(() => {
    const interval = setInterval(() => {
      setWords((prev) => {
        const now = Date.now();
        const updated: typeof prev = {};

        Object.entries(prev).forEach(([key, value]) => {
          if (now - value.lastUpdated < 30000) {
            updated[key] = value;
          }
        });

        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* ===============================
     SIZE BASED ON COUNT
     =============================== */
  const getSizeClass = (count: number) => {
    if (count >= 10) return "text-7xl";
    if (count >= 7) return "text-6xl";
    if (count >= 5) return "text-5xl";
    if (count >= 3) return "text-4xl";
    return "text-2xl";
  };

  const colors = [
    "text-red-400",
    "text-green-400",
    "text-blue-400",
    "text-yellow-400",
    "text-pink-400",
    "text-purple-400",
    "text-orange-400",
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="p-4 flex justify-between items-center border-b border-white/10">
        <Link href="/">
          <Image src="/logo.svg" alt="logo" width={100} height={40} />
        </Link>
        <span className="text-sm opacity-70">
          Live Response Wall
        </span>
      </header>

      {/* WORD CLOUD */}
      <main className="flex-1 flex items-center justify-center p-8">
        {Object.keys(words).length === 0 ? (
          <div className="text-white/50 text-xl animate-pulse">
            Waiting for responses…
          </div>
        ) : (
          <div className="flex flex-wrap gap-8 justify-center items-center">
            {Object.values(words).map((word) => (
              <span
                key={word.text}
                className={`
                  font-extrabold tracking-wide
                  ${getSizeClass(word.count)}
                  ${colors[Math.floor(Math.random() * colors.length)]}
                  transition-all duration-700 ease-out
                  animate-fade-in
                `}
              >
                {word.text}
              </span>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
