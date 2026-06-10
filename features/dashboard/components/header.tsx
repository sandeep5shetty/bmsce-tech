interface DashboardHeaderProps {
  name?: string;
}

export function DashboardHeader({ name }: DashboardHeaderProps) {
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold tracking-wider sm:text-2xl">
        Dashboard
      </h2>
      <p className="text-muted-foreground text-sm">
        {name ? (
          <>
            Welcome back,{" "}
            <span className="font-serif tracking-wider italic">{name}</span>.
            Choose a tool to get started.
          </>
        ) : (
          <>Choose a tool below to get started.</>
        )}
      </p>
    </div>
  );
}
