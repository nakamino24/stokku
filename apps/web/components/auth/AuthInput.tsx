import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: any;
  type?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon: Icon, type = 'text', id, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const [focused, setFocused] = useState(false);

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: '#1e293b' }}
        >
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Icon className={`w-4 h-4 ${focused ? 'text-indigo-500' : 'text-slate-400'}`} />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            autoComplete={isPassword ? 'current-password' : type === 'email' ? 'email' : undefined}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
            className={`
              block w-full rounded-lg border bg-white text-sm
              transition-all duration-150
              placeholder:text-slate-400
              ${Icon ? 'pl-10' : 'pl-3.5'} pr-10 py-2.5
              ${error
                ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
              }
              ${className || ''}
            `}
            style={{
              outline: 'none',
              color: '#0f172a',
              height: '44px',
            }}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1 animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
