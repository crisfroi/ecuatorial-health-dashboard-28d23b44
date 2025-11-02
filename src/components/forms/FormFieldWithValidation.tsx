import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date';

export interface ValidationRule {
  type:
    | 'required'
    | 'email'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'custom'
    | 'match';
  message: string;
  value?: any;
  validate?: (value: any) => boolean;
}

interface FormFieldWithValidationProps {
  name: string;
  label: string;
  type?: FieldType;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  validationRules?: ValidationRule[];
  options?: Array<{ value: string; label: string }>;
  showValidationIcon?: boolean;
  className?: string;
}

export const FormFieldWithValidation: React.FC<FormFieldWithValidationProps> = ({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  helpText,
  validationRules = [],
  options = [],
  showValidationIcon = true,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Validar campo
  const validateField = useCallback((fieldValue: any) => {
    const errors: string[] = [];
    setIsValidating(true);

    try {
      for (const rule of validationRules) {
        let isValid = true;

        switch (rule.type) {
          case 'required':
            isValid = fieldValue && fieldValue.toString().trim() !== '';
            break;

          case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue || '');
            break;

          case 'minLength':
            isValid = (fieldValue || '').length >= (rule.value || 0);
            break;

          case 'maxLength':
            isValid = (fieldValue || '').length <= (rule.value || 999999);
            break;

          case 'pattern':
            isValid = new RegExp(rule.value).test(fieldValue || '');
            break;

          case 'custom':
            isValid = rule.validate ? rule.validate(fieldValue) : true;
            break;

          case 'match':
            // Para validaciones de coincidencia se maneja externamente
            isValid = rule.validate ? rule.validate(fieldValue) : true;
            break;
        }

        if (!isValid) {
          errors.push(rule.message);
        }
      }

      setValidationErrors(errors);
    } finally {
      setIsValidating(false);
    }
  }, [validationRules]);

  // Manejar cambio
  const handleChange = (fieldValue: any) => {
    onChange(fieldValue);
    if (isBlurred) {
      validateField(fieldValue);
    }
  };

  // Manejar blur
  const handleBlur = () => {
    setIsBlurred(true);
    setIsFocused(false);
    validateField(value);
    onBlur?.();
  };

  const hasError = validationErrors.length > 0;
  const isValid = isBlurred && !hasError && value && value.toString().trim() !== '';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className={required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}>
          {label}
        </Label>
        {showValidationIcon && isFocused && isValidating && (
          <Clock className="w-4 h-4 text-blue-500 animate-spin" />
        )}
        {showValidationIcon && isBlurred && isValid && (
          <CheckCircle className="w-4 h-4 text-green-600" />
        )}
        {showValidationIcon && hasError && (
          <AlertCircle className="w-4 h-4 text-red-600" />
        )}
      </div>

      {/* Input Field */}
      <div className="relative">
        {type === 'text' && (
          <Input
            id={name}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              transition-colors
              ${hasError ? 'border-red-500 focus-visible:ring-red-500' : isValid ? 'border-green-500 focus-visible:ring-green-500' : 'focus-visible:ring-blue-500'}
            `}
          />
        )}

        {type === 'email' && (
          <Input
            id={name}
            type="email"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              transition-colors
              ${hasError ? 'border-red-500 focus-visible:ring-red-500' : isValid ? 'border-green-500 focus-visible:ring-green-500' : 'focus-visible:ring-blue-500'}
            `}
          />
        )}

        {type === 'password' && (
          <div className="relative">
            <Input
              id={name}
              type={showPassword ? 'text' : 'password'}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={`
                pr-10 transition-colors
                ${hasError ? 'border-red-500 focus-visible:ring-red-500' : isValid ? 'border-green-500 focus-visible:ring-green-500' : 'focus-visible:ring-blue-500'}
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        )}

        {type === 'number' && (
          <Input
            id={name}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value === '' ? '' : Number(e.target.value))}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              transition-colors
              ${hasError ? 'border-red-500 focus-visible:ring-red-500' : isValid ? 'border-green-500 focus-visible:ring-green-500' : 'focus-visible:ring-blue-500'}
            `}
          />
        )}

        {type === 'textarea' && (
          <Textarea
            id={name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              transition-colors resize-none
              ${hasError ? 'border-red-500 focus-visible:ring-red-500' : isValid ? 'border-green-500 focus-visible:ring-green-500' : 'focus-visible:ring-blue-500'}
            `}
          />
        )}

        {type === 'select' && (
          <Select value={value || ''} onValueChange={handleChange}>
            <SelectTrigger
              onBlur={handleBlur}
              className={`
                transition-colors
                ${hasError ? 'border-red-500' : isValid ? 'border-green-500' : ''}
              `}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {type === 'date' && (
          <Input
            id={name}
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            disabled={disabled}
            className={`
              transition-colors
              ${hasError ? 'border-red-500 focus-visible:ring-red-500' : isValid ? 'border-green-500 focus-visible:ring-green-500' : 'focus-visible:ring-blue-500'}
            `}
          />
        )}
      </div>

      {/* Help Text */}
      {helpText && !hasError && (
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <Info className="w-4 h-4" />
          {helpText}
        </p>
      )}

      {/* Error Messages */}
      {hasError && (
        <div className="space-y-1">
          {validationErrors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Success Message */}
      {isValid && (
        <p className="text-sm text-green-600 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          Campo válido
        </p>
      )}
    </div>
  );
};
