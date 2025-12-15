import React from "react";

type Props = React.ComponentProps<"svg">;

const ChevronUpDown = (props: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <path
        d="M17.9999 14C17.9999 14 13.581 19 11.9999 19C10.4188 19 5.99994 14 5.99994 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M17.9999 9.99996C17.9999 9.99996 13.581 5.00001 11.9999 5C10.4188 4.99999 5.99994 10 5.99994 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export default ChevronUpDown;
