"use client";

import Link from "next/link";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { getUser } from "@/actions/user";

import { Github } from "@/components/icons";

export function GetStartedButton() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: 1000 * 60 * 5,
  });

  const href = user ? "/dashboard" : "/auth/login";

  return (
    <Button asChild>
      <Link href={href}>
        Get Started
        <svg
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
          className="-rotate-45"
        >
          <g fill="currentColor">
            <path
              d="M9 1C4.589 1 1 4.589 1 9C1 13.411 4.589 17 9 17C13.411 17 17 13.411 17 9C17 4.589 13.411 1 9 1Z"
              fill="currentColor"
              opacity="0.4"
            />
            <path
              d="M8.47 11.72C8.177 12.013 8.177 12.488 8.47 12.781C8.616 12.927 8.808 13.001 9 13.001C9.192 13.001 9.384 12.928 9.53 12.781L12.78 9.53103C13.073 9.23803 13.073 8.76299 12.78 8.46999L9.53 5.21999C9.237 4.92699 8.762 4.92699 8.469 5.21999C8.176 5.51299 8.176 5.98803 8.469 6.28103L10.439 8.251H1.75C1.336 8.251 1 8.587 1 9.001C1 9.415 1.336 9.751 1.75 9.751H10.439L8.469 11.721L8.47 11.72Z"
              fill="currentColor"
            />
          </g>
        </svg>
      </Link>
    </Button>
  );
}

export function OpenSourceButton() {
  return (
    <Button asChild variant="outline">
      <Link href="https://github.com/sandeep5shetty/bmsce-tech" target="_blank">
        Open Source
        <Github />
      </Link>
    </Button>
  );
}
