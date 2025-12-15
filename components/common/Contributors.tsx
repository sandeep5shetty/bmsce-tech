"use client";

import React from "react";

import { AnimatedTooltip } from "../ui/animated-tooltip";

const people = [
  {
    id: 1,
    name: "Sandeep Shetty",
    designation: "Full Stack Developer",
    image: "/sandy.jpg",
  },
  {
    id: 2,
    name: "Shrilaxmi Heralagi",
    designation: "Full Stack Developer",
    image: "/shrilaxmi.jpeg",
  },
  {
    id: 3,
    name: "Tarun G Naidu",
    designation: "Backend Developer",
    image: "/tarun.jpg",
  },
  /* {
    id: 4,
    name: "Wish to Contribute?",
    designation: "Join us on GitHub",
    image: "plus",
    link: "https://github.com/sandeep5shetty/bmsce-tech/",
  }, */
];

export function Contributors() {
  return (
    <div className="mb-6 flex w-full flex-row items-center justify-center">
      <AnimatedTooltip items={people} />
    </div>
  );
}
