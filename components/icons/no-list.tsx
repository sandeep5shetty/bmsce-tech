import React from "react";

type Props = React.ComponentProps<"svg">;

const NoList = (props: Props) => {
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
        d="M11.4997 21.999H12.4996C16.2709 21.999 18.1565 21.999 19.328 20.8275C19.5849 20.5706 19.9997 20 19.9997 20L3.99969 4C3.44216 5.20312 3.49975 7.0547 3.49972 9.99897L3.49969 13.999C3.49966 17.7702 3.49964 19.6559 4.67121 20.8275C5.84279 21.999 7.72842 21.999 11.4997 21.999Z"
        fill="currentColor"
      ></path>
      <path
        d="M2 2L22 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M8.5 17H16.5M8.5 12H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M3.99969 4C3.44216 5.20312 3.49975 7.0547 3.49972 9.99897L3.49969 13.999C3.49966 17.7702 3.49964 19.6559 4.67121 20.8275C5.84279 21.999 7.72842 21.999 11.4997 21.999H12.4996C16.2709 21.999 18.1565 21.999 19.328 20.8275C19.5849 20.5706 19.9997 20 19.9997 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        opacity="0.4"
        d="M20.4814 16.5L20.4994 10C20.4994 6.22876 20.4994 4.34315 19.3278 3.17157C18.1563 2 16.2706 2 12.4994 2H11.4995C9.24022 2 7.65768 2 6.5 2.25191"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
};

export default NoList;
