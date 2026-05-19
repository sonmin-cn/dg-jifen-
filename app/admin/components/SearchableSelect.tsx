"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export type SearchableSelectOption = {
  id: string;
  label: string;
  description?: string | null;
  searchText?: string;
};

type SearchableSelectProps = {
  name: string;
  options: SearchableSelectOption[];
  placeholder: string;
  emptyText?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  value?: string;
};

export function SearchableSelect({
  name,
  options,
  placeholder,
  emptyText = "未找到匹配项",
  required,
  onChange,
  value,
}: SearchableSelectProps) {
  const [query, setQuery] = useState("");
  const [internalValue, setInternalValue] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedValue = value ?? internalValue;
  const selectedOption = options.find((option) => option.id === selectedValue) || null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return options.slice(0, 20);
    }

    return options
      .filter((option) =>
        `${option.label} ${option.description || ""} ${option.searchText || ""}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 20);
  }, [normalizedQuery, options]);

  function selectOption(option: SearchableSelectOption) {
    setInternalValue(option.id);
    setQuery(option.label);
    setIsOpen(false);
    onChange?.(option.id);
  }

  function clearSelection() {
    setInternalValue("");
    setQuery("");
    onChange?.("");
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div className="relative space-y-2" ref={containerRef}>
      <input name={name} type="hidden" value={selectedValue} />
      <Input
        aria-label={placeholder}
        className="h-10"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          if (selectedValue) {
            setInternalValue("");
            onChange?.("");
          }
        }}
        placeholder={placeholder}
        value={query || selectedOption?.label || ""}
      />
      {selectedOption ? (
        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs">
          <span className="min-w-0 truncate">
            已选择：<span className="font-medium">{selectedOption.label}</span>
          </span>
          <button className="shrink-0 text-muted-foreground hover:text-foreground" onClick={clearSelection} type="button">
            清除
          </button>
        </div>
      ) : null}
      {isOpen ? (
        <div className="absolute left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-md border bg-background shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                  option.id === selectedValue ? "bg-muted" : ""
                }`}
                key={option.id}
                onClick={() => selectOption(option)}
                type="button"
              >
                <span className="block font-medium">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</p>
          )}
        </div>
      ) : null}
      {required && !selectedValue ? (
        <p className="text-xs text-muted-foreground">请搜索并选择一项。</p>
      ) : null}
    </div>
  );
}
