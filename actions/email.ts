"use server";

import transporter from "@/lib/email";

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  try {
    const response = await transporter.sendMail({
      from: "rvyu.app@gmail.com",
      to,
      subject,
      text,
    });

    console.log(response);
  } catch (error) {
    console.log(error);
  }
}
