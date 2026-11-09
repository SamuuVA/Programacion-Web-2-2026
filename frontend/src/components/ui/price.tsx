export function Price({
  value,
  size = "md",
  className
}: {
  value: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const classes = ["price", size === "lg" ? "price-lg" : "", className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{value}</span>;
}
