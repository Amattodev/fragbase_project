"use client";
import { useState, useRef, useEffect } from "react";
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
        className="w-full justify-between bg-[#2B2B2B] border-gray-600 text-[#F5F5F5] hover:bg-[#3B3B3B]"
      >
        <span className="truncate">{getDisplayText()}</span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </Button>

      {/* ドロップダウンリスト */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#2B2B2B] border border-gray-600 rounded-md mt-1 z-20 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex items-center px-3 py-2 hover:bg-[#3B3B3B] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.name)}
                onChange={() => toggleOption(option.name)}
                className="mr-2 rounded"
              />
              <span className="text-[#F5F5F5]">{option.displayName}</span>
            </label>
          ))}
        </div>
      )}

      {/* 選択済みアイテムの表示 */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map((value) => {
            const option = options.find((opt) => opt.name === value);
            const displayName = option ? option.displayName : value;

            return (
              <span
                key={value}
                className="bg-[#7DB7E8] text-black px-2 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {displayName}
                <button
                  type="button"
                  onClick={() => removeOption(value)}
                  className="hover:bg-black hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
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
