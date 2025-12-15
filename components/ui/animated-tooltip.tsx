"use client";

import React, { useRef, useState } from "react";

import Image from "next/image";

import { Plus } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

export const AnimatedTooltip = ({
  items,
}: {
  items: {
    id: number;
    name: string;
    designation: string;
    image: string;
    link?: string;
  }[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const halfWidth = event.currentTarget.offsetWidth / 2;
    const offsetX = event.nativeEvent.offsetX;

    animationFrameRef.current = requestAnimationFrame(() => {
      x.set(offsetX - halfWidth);
    });
  };

  return (
    <>
      {items.map((item) => {
        const content = (
          <>
            <AnimatePresence>
              {hoveredIndex === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.6 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 260,
                      damping: 10,
                    },
                  }}
                  exit={{ opacity: 0, y: 20, scale: 0.6 }}
                  style={{
                    translateX: translateX,
                    rotate: rotate,
                    whiteSpace: "nowrap",
                  }}
                  className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs shadow-xl"
                >
                  <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-linear-to-r from-transparent via-emerald-500 to-transparent" />
                  <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-linear-to-r from-transparent via-sky-500 to-transparent" />
                  <div className="relative z-30 text-base font-bold text-white">
                    {item.name}
                  </div>
                  <div className="text-xs text-white">{item.designation}</div>
                </motion.div>
              )}
            </AnimatePresence>
            {item.image === "plus" ? (
              <div className="dark:border-neutral-00 relative z-0 flex size-12 cursor-pointer items-center justify-center rounded-full border border-neutral-400 bg-slate-200 transition duration-500 group-hover:z-30 group-hover:scale-105 dark:bg-gray-200">
                <Plus className="h-5 w-5 text-slate-700 dark:text-neutral-800" />
              </div>
            ) : (
              <Image
                onMouseMove={handleMouseMove}
                height={100}
                width={100}
                src={item.image}
                alt={item.name}
                className="relative m-0! size-12 cursor-pointer rounded-full border border-neutral-700 object-cover object-top p-0 transition duration-500 group-hover:z-30 group-hover:scale-105 dark:border-neutral-200"
              />
            )}
          </>
        );

        return item.link ? (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative -mr-4 block"
            onMouseEnter={() => setHoveredIndex(item.id)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {content}
          </a>
        ) : (
          <div
            key={item.id}
            className="group relative -mr-4 block"
            onMouseEnter={() => setHoveredIndex(item.id)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {content}
          </div>
        );
      })}
    </>
  );
};
