import React from "react";

export function GzLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-white border border-border shadow-sm overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[70%] h-[70%] text-teal-700"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Exact GZ Monogram Lineart Path */}
        <path
          d="M66 28C59 20 48 16 36 16C19.4315 16 6 29.4315 6 46C6 62.5685 19.4315 76 36 76C50.5 76 62.5 64 65 48H48V36H82V48C79.5 69 61 82 36 82C16.1177 82 0 65.8823 0 46C0 26.1177 16.1177 10 36 10C51.5 10 64.5 20 71 34L66 28Z"
          fill="currentColor"
        />
        <path d="M42 46H86L54 78H88V84H36L68 52H42V46Z" fill="currentColor" />
      </svg>
    </div>
  );
}
