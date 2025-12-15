import React from "react";

type Props = React.ComponentProps<"svg">;

const Unlink = (props: Props) => {
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
        d="M9.99756 9.11804C9.08006 10.5955 9.24311 12.5885 10.4867 13.8828C11.2046 14.63 12.1462 15.0024 13.0872 15C13.395 15.0008 13.7028 14.9614 14.0029 14.882C13.8645 15.1049 13.7015 15.3161 13.5138 15.5114L10.2744 18.8828C10.0507 19.1157 9.80522 19.3121 9.54482 19.4722C8.9697 19.8257 8.32172 20.0016 7.67408 20C6.73316 20.0024 5.79153 19.63 5.07363 18.8828C3.64237 17.3932 3.64237 14.9782 5.07363 13.4886L8.31305 10.1172C8.79606 9.61449 9.38035 9.28145 9.99756 9.11804Z"
        fill="currentColor"
      ></path>
      <path
        d="M10 13.229C10.1416 13.4609 10.3097 13.6804 10.5042 13.8828C11.7117 15.1395 13.5522 15.336 14.9576 14.4722C15.218 14.3121 15.4634 14.1157 15.6872 13.8828L18.9266 10.5114C20.3578 9.02184 20.3578 6.60676 18.9266 5.11718C17.4953 3.6276 15.1748 3.62761 13.7435 5.11718L13.03 5.85978"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      ></path>
      <path
        d="M10.9703 18.14L10.2565 18.8828C8.82526 20.3724 6.50471 20.3724 5.07345 18.8828C3.64218 17.3932 3.64218 14.9782 5.07345 13.4886L8.31287 10.1172C9.74413 8.62761 12.0647 8.6276 13.4959 10.1172C13.6904 10.3195 13.8584 10.539 14 10.7708"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      ></path>
      <path
        d="M21.0001 16H18.9212M16.0001 21L16.0001 18.9211"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3.00009 8H5.07898M8.00009 3L8.00009 5.07889"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export default Unlink;
