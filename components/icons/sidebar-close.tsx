import React from "react";

type Props = React.ComponentProps<"svg">;

const SidebarClose = (props: Props) => {
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
        opacity="0.4"
        d="M20.7583 19.682C22.0005 18.364 22.0005 16.2426 22.0005 12C22.0005 7.75736 22.0005 5.63604 20.7583 4.31802C19.516 3 17.5167 3 13.518 3C11.867 3 10.5568 3 9.49998 3.09278L9.49998 20.9072C10.5568 21 11.867 21 13.518 21C17.5167 21 19.516 21 20.7583 19.682Z"
        fill="currentColor"
      ></path>
      <path
        d="M2 12C2 8.25028 2 6.37542 2.95491 5.06109C3.26331 4.63662 3.6366 4.26333 4.06107 3.95493C5.3754 3.00002 7.25027 3.00002 11 3.00002H13C16.7497 3.00002 18.6246 3.00002 19.9389 3.95493C20.3634 4.26333 20.7367 4.63662 21.0451 5.06109C22 6.37542 22 8.25028 22 12C22 15.7497 22 17.6246 21.0451 18.9389C20.7367 19.3634 20.3634 19.7367 19.9389 20.0451C18.6246 21 16.7497 21 13 21H11C7.25027 21 5.3754 21 4.06107 20.0451C3.6366 19.7367 3.26331 19.3634 2.95491 18.9389C2 17.6246 2 15.7497 2 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      ></path>
      <path
        d="M9.5 3.50002L9.5 20.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      ></path>
      <path
        d="M5 7C5 7 5.91421 7 6.5 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M5 11H6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M17 10L15.7735 11.0572C15.2578 11.5016 15 11.7239 15 12C15 12.2761 15.2578 12.4984 15.7735 12.9428L17 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export default SidebarClose;
