"use client";

interface InputProps {
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  error,
}: InputProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-[#655d53] mb-1">
          {label}
          {required && <span className="text-[#9b7440] ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d9bf94] focus:border-transparent transition-colors ${
          error
            ? "border-[#d4b08a] focus:ring-[#d4b08a]"
            : "border-[#d8cec2]"
        } ${disabled ? "bg-[#f5f1ea] opacity-60" : ""}`}
      />
      {error && <p className="mt-1 text-sm text-[#7a5a2f]">{error}</p>}
    </div>
  );
}
