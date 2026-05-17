"use client";

import type { ServiceCategory } from "@prisma/client";
import { categoryLabels } from "@/types/status";

type CategoryValue = ServiceCategory | "all";

export function CategoryFilter({
  value,
  onChange
}: {
  value: CategoryValue;
  onChange: (value: CategoryValue) => void;
}) {
  const categories = Object.entries(categoryLabels) as Array<[ServiceCategory, string]>;

  return (
    <div className="category-tabs" role="tablist" aria-label="Категории сервисов">
      <button className="tab" data-active={value === "all"} onClick={() => onChange("all")} type="button">
        Все
      </button>
      {categories.map(([category, label]) => (
        <button
          className="tab"
          data-active={value === category}
          key={category}
          onClick={() => onChange(category)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
