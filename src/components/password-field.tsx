import React from "react";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export function PasswordField({ id, label, ...props }: PasswordFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 my-3">
      <label htmlFor={id} className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-hidden focus:border-primary transition-colors"
        {...props}
      />
    </div>
  );
}
