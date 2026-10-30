"use client";

import Field from "@/components/ui/Field";
import { findLatexErrors } from "@/lib/latex";

export default function LatexEditor({
  id,
  value,
  onChange,
  rows,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const errors = value.trim() ? findLatexErrors(value) : [];
  return (
    <div>
      <Field
        id={id}
        value={value}
        onChange={onChange}
        multiline
        rows={rows ?? 8}
        placeholder={placeholder}
      />
      {errors.length > 0 && (
        <ul role="alert" className="mt-2 text-[0.9375rem] text-muted">
          {errors.map((e, i) => (
            <li key={i}>LaTeX note: {e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
