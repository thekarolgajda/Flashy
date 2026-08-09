import { categoryFor } from "@/lib/categories";

/**
 * The category ornament, drawn on screen from the same path data the PDF
 * prints. Sharing the source is the point: the preview would otherwise show a
 * card that does not match the one coming out of the printer.
 */
export function CategoryMark({
  front,
  className = "",
}: {
  front: string;
  className?: string;
}) {
  const category = categoryFor(front);

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {category.fill && <path d={category.fill} fill="currentColor" />}
      <path
        d={category.stroke}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
