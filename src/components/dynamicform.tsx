"use client";

import React, { useState, useEffect } from "react";

const Button = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <button
    className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`border rounded-md px-3 py-2 w-full text-base focus:ring-2 focus:ring-offset-2 ${className}`}
    {...props}
  />
);

const Label = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <label className={`block font-medium text-sm ${className}`} {...props}>
    {children}
  </label>
);

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "password"
  | "textarea"
  | "select"
  | "checkbox"
  | "date";

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
  helperText?: string;
}

export interface ThemeConfig {
  primaryColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  destructiveColor?: string;
  mutedTextColor?: string;
}

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (formData: Record<string, any>) => void | Promise<void>;
  submitButtonText?: string;
  title?: string;
  description?: string;
  isLoading?: boolean;
  theme?: ThemeConfig;

  // ✅ NEW
  formSubmitted?: boolean;
  initialValues?: Record<string, any>;
}

export function DynamicForm({
  fields,
  onSubmit,
  submitButtonText = "Submit",
  title = "Form",
  description = "",
  isLoading = false,
  theme = {},

  formSubmitted = false,
  initialValues = {},
}: DynamicFormProps) {
  const defaultValues = fields.reduce((acc, f) => {
    acc[f.name] = f.type === "checkbox" ? false : "";
    return acc;
  }, {} as Record<string, any>);

  const [formData, setFormData] = useState<Record<string, any>>(
    initialValues && Object.keys(initialValues).length > 0
      ? initialValues
      : defaultValues
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Rebuild the form when initialValues change
  useEffect(() => {
    if (formSubmitted && initialValues) {
      setFormData(initialValues);
    }
  }, [formSubmitted, initialValues]);

  const {
    primaryColor = "bg-blue-600",
    backgroundColor = "bg-white",
    borderColor = "border-gray-300",
    textColor = "text-gray-900",
    destructiveColor = "text-red-600",
    mutedTextColor = "text-gray-500",
  } = theme;

  const handleChange = (name: string, value: any, type: FieldType) => {
    if (formSubmitted) return;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? !prev[name] : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const e = { ...prev };
        delete e[name];
        return e;
      });
    }
  };

  const validateForm = (): boolean => {
    if (formSubmitted) return false;

    const newErrors: Record<string, string> = {};

    fields.forEach((f) => {
      const value = formData[f.name];
      if (f.required && (!value || value === ""))
        newErrors[f.name] = `${f.label} is required.`;

      if (f.type === "email" && value) {
        const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!re.test(value)) newErrors[f.name] = "Invalid email address.";
      }

      if (f.validation) {
        const err = f.validation(value);
        if (err) newErrors[f.name] = err;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitted) return;

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name];
    const error = errors[field.name];
    const inputId = `field-${field.name}`;

    const disabled = formSubmitted;

    const baseInputClass = `w-full rounded-md border ${borderColor} px-3 py-2 text-base ${
      disabled ? "opacity-60 cursor-not-allowed" : ""
    } ${textColor}`;

    const errorClass = error ? `${destructiveColor} border-red-500` : "";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            id={inputId}
            disabled={disabled}
            placeholder={field.placeholder}
            className={`${baseInputClass} min-h-24 ${errorClass}`}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
          />
        );

      case "select":
        return (
          <select
            id={inputId}
            disabled={disabled}
            className={`${baseInputClass} ${errorClass}`}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value, field.type)}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={inputId}
              disabled={disabled}
              checked={value}
              onChange={(e) =>
                handleChange(field.name, e.target.checked, field.type)
              }
              className="h-4 w-4 cursor-pointer accent-current"
            />
            <Label htmlFor={inputId} className={textColor}>
              {field.label}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            id={inputId}
            disabled={disabled}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e:any) =>
              handleChange(field.name, e.target.value, field.type)
            }
            className={`${baseInputClass} ${errorClass}`}
          />
        );
    }
  };

  return (
    <Card className={`w-full ${backgroundColor} ${textColor}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              {field.type !== "checkbox" && (
                <Label htmlFor={`field-${field.name}`}>
                  {field.label}
                  {field.required && (
                    <span className={`${destructiveColor} ml-1`}>*</span>
                  )}
                </Label>
              )}

              {renderField(field)}

              {field.helperText && (
                <p className={`text-sm ${mutedTextColor}`}>{field.helperText}</p>
              )}

              {errors[field.name] && (
                <p className={`text-sm ${destructiveColor}`}>
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}

          {!formSubmitted && (
            <Button
              type="submit"
              className={`w-full ${primaryColor} text-white`}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? "Submitting..." : submitButtonText}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
