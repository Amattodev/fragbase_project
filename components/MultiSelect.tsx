"use client";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

interface Option {
  id: number;
  name: string;
  displayName: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "選択してください",
  className = "",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleOption = (optionName: string) => {
    if (selectedValues.includes(optionName)) {
      onChange(selectedValues.filter((value) => value !== optionName));
    } else {
      onChange([...selectedValues, optionName]);
    }
  };

  const removeOption = (optionName: string) => {
    onChange(selectedValues.filter((value) => value !== optionName));
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    const firstOption = options.find((opt) => opt.name === selectedValues[0]);
    const firstName = firstOption ? firstOption.displayName : selectedValues[0];

    if (selectedValues.length === 1) {
      return firstName;
    }

    return `${firstName} +${selectedValues.length - 1}個`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* メインボタン */}
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full justify-between border-gray-600 bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
      >
        <span className="truncate">{getDisplayText()}</span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </Button>

      {/* ドロップダウンリスト */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-600 bg-[var(--color-surface)]">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center px-3 py-2 hover:bg-[var(--color-surface-hover)]"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.name)}
                onChange={() => toggleOption(option.name)}
                className="mr-2 rounded"
              />
              <span className="text-[var(--color-text)]">{option.displayName}</span>
            </label>
          ))}
        </div>
      )}

      {/* 選択済みアイテムの表示 */}
      {selectedValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedValues.map((value) => {
            const option = options.find((opt) => opt.name === value);
            const displayName = option ? option.displayName : value;

            return (
              <span
                key={value}
                className="flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-2 py-1 text-sm text-black"
              >
                {displayName}
                <button
                  type="button"
                  onClick={() => removeOption(value)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-xs hover:bg-black hover:text-white"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
