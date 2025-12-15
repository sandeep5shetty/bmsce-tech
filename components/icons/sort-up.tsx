import React from "react";

type Props = React.ComponentProps<"svg">;

const SortUp = (props: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="128"
      height="128"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M3 15L14 14.9999"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3 9H10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3 21H19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        opacity="0.4"
        d="M18.5 3V15M18.5 3C17.7998 3 16.4915 4.9943 16 5.5M18.5 3C19.2002 3 20.5085 4.9943 21 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export default SortUp;
