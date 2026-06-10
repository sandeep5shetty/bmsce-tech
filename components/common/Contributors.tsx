"use client";

import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const people = [
  {
    id: 1,
    name: "Sandeep Shetty",
    image: "/sandy.jpg",
  },
  {
    id: 2,
    name: "Shrilaxmi Heralagi",
    image: "/shrilaxmi.jpeg",
  },
  {
    id: 3,
    name: "Tarun G Naidu",
    image: "/tarun.jpg",
  },
];

export function Contributors() {
  return (
    <div className="mb-6 flex w-full flex-row items-center justify-center">
      {people.map((person) => (
        <Tooltip key={person.id}>
          <TooltipTrigger asChild>
            <div className="relative -mr-4 block">
              <Image
                height={100}
                width={100}
                src={person.image}
                alt={person.name}
                className="relative size-12 cursor-pointer rounded-full border border-neutral-700 object-cover object-top transition duration-300 hover:z-10 hover:scale-105 dark:border-neutral-200"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8}>
            {person.name}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
