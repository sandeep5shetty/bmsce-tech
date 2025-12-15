import React from "react";

type Props = React.ComponentProps<"svg">;

const Cursor = ({ ...props }: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="24"
      viewBox="4 4 24 26"
      fill="none"
      {...props}
    >
      <path
        d="M10.994 27.1417L7.02441 6.49976L24.4907 16.8207L15.7575 19.2025L10.994 27.1417Z"
        fill="var(--color-primary)"
        stroke="var(--color-primary)"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Cursor;
