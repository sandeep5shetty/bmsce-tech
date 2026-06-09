export default function QuizPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-[100dvh]">{children}</div>;
}
