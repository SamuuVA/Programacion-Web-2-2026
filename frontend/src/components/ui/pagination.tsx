import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from "@/components/icons";

export function Pagination({
  page,
  totalPages,
  basePath,
  query = {}
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Readonly<Record<string, string | undefined>>;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (target: number): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key !== "page" && value) {
        params.set(key, value);
      }
    }
    if (target > 1) {
      params.set("page", String(target));
    }
    const suffix = params.toString();
    return suffix ? `${basePath}?${suffix}` : basePath;
  };

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="pagination" aria-label="Paginación del catálogo">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" aria-label="Página anterior">
          <ChevronLeftIcon />
        </Link>
      ) : (
        <span className="disabled" aria-hidden="true">
          <ChevronLeftIcon />
        </span>
      )}

      {pages.map((item, index) =>
        item === null ? (
          <span key={`gap-${index}`} aria-hidden="true">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page">
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefFor(item)} aria-label={`Página ${item}`}>
            {item}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" aria-label="Página siguiente">
          <ChevronRightIcon />
        </Link>
      ) : (
        <span className="disabled" aria-hidden="true">
          <ChevronRightIcon />
        </span>
      )}
    </nav>
  );
}

function pageWindow(page: number, totalPages: number): Array<number | null> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: Array<number | null> = [];
  sorted.forEach((value, index) => {
    if (index > 0 && value - sorted[index - 1]! > 1) {
      result.push(null);
    }
    result.push(value);
  });
  return result;
}
