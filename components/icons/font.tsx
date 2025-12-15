import React from "react";

type Props = React.ComponentProps<"svg">;

const Font = (props: Props) => {
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
          d="M15.3516 21H9.35156"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M12.3516 2.99902V20.9998M12.3516 2.99902C13.739 2.99902 15.5211 3.02956 16.94 3.1755C17.5401 3.23721 17.8402 3.26807 18.1057 3.37692C18.6582 3.6033 19.1034 4.09964 19.271 4.67582C19.3516 4.95283 19.3516 5.26893 19.3516 5.90116M12.3516 2.99902C10.9642 2.99902 9.18203 3.02956 7.76317 3.1755C7.16306 3.23721 6.863 3.26807 6.59742 3.37692C6.045 3.6033 5.59972 4.09964 5.43213 4.67582C5.35156 4.95283 5.35156 5.26893 5.35156 5.90116"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        ></path>
      </g>
    </svg>
  );
};

export default Font;
