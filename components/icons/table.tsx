import React from "react";

type Props = React.ComponentProps<"svg">;

const Table = (props: Props) => {
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
        opacity="0.4"
        d="M20.1049 20.1128C21.4961 18.7216 21.4961 16.4824 21.4961 12.0041C21.4961 7.52575 21.4961 5.28657 20.1048 3.89533C18.7136 2.50409 16.4744 2.50409 11.9961 2.50409L8.99609 2.50409L8.99609 21.4813C9.86701 21.5041 10.8594 21.5041 11.9961 21.5041C16.4744 21.5041 18.7136 21.5041 20.1049 20.1128Z"
        fill="currentColor"
      ></path>
      <path
        d="M20.1078 20.1088C18.7165 21.5 16.4774 21.5 11.999 21.5C7.52068 21.5 5.28151 21.5 3.89027 20.1088C2.49902 18.7175 2.49902 16.4783 2.49902 12C2.49902 7.52166 2.49902 5.28249 3.89026 3.89124C5.28151 2.5 7.52068 2.5 11.999 2.5C16.4774 2.5 18.7165 2.5 20.1078 3.89124C21.499 5.28249 21.499 7.52166 21.499 12C21.499 16.4783 21.499 18.7175 20.1078 20.1088Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M8.99902 21.5L8.99902 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      ></path>
      <path
        d="M21.499 8L2.49902 8"
        stroke="currentColor"
        strokeWidth="1.5"
      ></path>
      <path
        d="M21.499 16H2.49902"
        stroke="currentColor"
        strokeWidth="1.5"
      ></path>
    </svg>
  );
};

export default Table;
