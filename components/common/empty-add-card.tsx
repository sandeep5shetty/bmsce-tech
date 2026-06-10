import Link from "next/link";

import Plus from "@/components/icons/plus";

import { cn } from "@/lib/utils";

interface EmptyAddCardProps {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyAddCard({
  title,
  description,
  href,
  onClick,
  className,
  action,
}: EmptyAddCardProps) {
  const content = (
    <>
      <div className="from-primary/5 absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex flex-col items-center gap-3">
        <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105">
          <Plus className="h-7 w-7" />
        </div>

        <div className="text-center">
          <h3 className="mb-1 text-base font-semibold tracking-tight">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        {action}
      </div>
    </>
  );

  const classes = cn(
    "bg-card hover:shadow-primary/5 group hover:border-primary/30 relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300",
    (href || onClick) && "cursor-pointer",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <article
      className={classes}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {content}
    </article>
  );
}
