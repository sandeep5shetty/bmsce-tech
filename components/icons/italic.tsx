import React from "react";

type Props = React.ComponentProps<"svg">;

const Italic = (props: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <g opacity="0.4">
        <path
          d="M12 4H19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        ></path>
        <path
          d="M8 20L16 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        ></path>
        <path
          d="M5 20H12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        ></path>
      </g>
    </svg>
  );
};

export default Italic;
