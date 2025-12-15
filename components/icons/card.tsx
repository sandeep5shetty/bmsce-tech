import React from "react";

type Props = React.ComponentProps<"svg">;

const Card = (props: Props) => {
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
        d="M10.5 20H13.5C17.2586 20 19.1379 20 20.3925 19.0091C20.5932 18.8506 20.7788 18.676 20.9472 18.4871C22 17.3062 22 15.5375 22 12C22 10.8169 22 9.8316 21.9606 9H2.03939C2 9.8316 2 10.8169 2 12C2 15.5375 2 17.3062 3.0528 18.4871C3.22119 18.676 3.40678 18.8506 3.60746 19.0091C4.86213 20 6.74142 20 10.5 20Z"
        fill="currentColor"
      ></path>
      <path
        d="M2 12C2 8.46252 2 6.69377 3.0528 5.5129C3.22119 5.32403 3.40678 5.14935 3.60746 4.99087C4.86213 4 6.74142 4 10.5 4H13.5C17.2586 4 19.1379 4 20.3925 4.99087C20.5932 5.14935 20.7788 5.32403 20.9472 5.5129C22 6.69377 22 8.46252 22 12C22 15.5375 22 17.3062 20.9472 18.4871C20.7788 18.676 20.5932 18.8506 20.3925 19.0091C19.1379 20 17.2586 20 13.5 20H10.5C6.74142 20 4.86213 20 3.60746 19.0091C3.40678 18.8506 3.22119 18.676 3.0528 18.4871C2 17.3062 2 15.5375 2 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M10 16H11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M14.5 16L18 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M2 9H22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export default Card;
