const GRADIENTS = [
  "from-blue-500 to-emerald-500",
  "from-orange-500 to-slate-800",
  "from-slate-900 to-slate-600",
  "from-sky-500 to-teal-400",
  "from-violet-500 to-fuchsia-500",
  "from-rose-500 to-orange-400",
  "from-indigo-500 to-blue-400",
  "from-emerald-500 to-lime-400",
  "from-pink-500 to-rose-400",
  "from-cyan-500 to-blue-500",
];

export function companyGradient(companyName: string): string {
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = (hash << 5) - hash + companyName.charCodeAt(i);
    hash |= 0;
  }
  const gradient = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return gradient ?? GRADIENTS[0]!;
}

export function companyInitial(companyName: string): string {
  return companyName.trim().charAt(0).toUpperCase() || "?";
}
