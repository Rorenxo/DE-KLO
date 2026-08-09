import React, { useState, useEffect, useRef } from 'react'

export default function Input({
  id,
  name,
  label,
  type = 'text',
  value = '',
  onChange,
  placeholder = '',
  error,
  icon: Icon,
  rightElement,
  disabled = false,
  required = false,
  autoComplete,
}) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)

  const hasValue = value !== undefined && value !== null && String(value).trim().length > 0
  const isFloating = isFocused || hasValue

  useEffect(() => {
    if (inputRef.current) {
      const checkAutofill = () => {
        try {
          if (inputRef.current.matches(':-webkit-autofill')) {
            setIsFocused(true)
          }
        } catch (e) {}
      }
      checkAutofill()
      const timer = setTimeout(checkAutofill, 100)
      return () => clearTimeout(timer)
    }
  }, [value])

  return (
    <div className="relative w-full text-left pt-4 sm:pt-5 pb-0.5 select-none">
      <div 
        className="relative flex items-center cursor-text min-h-[40px]"
        onClick={() => inputRef.current?.focus()}
      >
        {Icon && (
          <div className="absolute left-0 bottom-1.5 text-[#808a92] pointer-events-none pr-2">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <label
          htmlFor={id || name}
          className={`
            absolute left-0 pointer-events-none select-none transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1) origin-left
            ${Icon ? 'pl-6' : 'pl-0'}
            ${
              isFloating
                ? 'top-0 -translate-y-3.5 text-[10px] sm:text-[11px] font-medium tracking-wider uppercase ' +
                  (isFocused ? 'text-[#bdc7ce]' : 'text-[#808a92]')
                : 'top-1.5 text-xs sm:text-sm ' +
                  (isFocused ? 'text-[#bdc7ce]' : 'text-[#808a92]')
            }
          `}
        >
          {label}
        </label>

        <input
          ref={inputRef}
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused && placeholder ? placeholder : ''}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          className={`
            w-full bg-transparent text-white text-xs sm:text-sm outline-none transition-colors duration-200
            ${Icon ? 'pl-6' : 'pl-0'}
            ${rightElement ? 'pr-8' : 'pr-0'}
            py-1 min-h-[32px]
          `}
        />

        {rightElement && (
          <div 
            className="absolute right-0 bottom-1.5 flex items-center justify-center text-[#808a92] hover:text-[#bdc7ce] transition-colors cursor-pointer z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {rightElement}
          </div>
        )}
      </div>

      <div className="relative w-full h-[1px] bg-[#4a5156]/70 mt-0.5 overflow-hidden">
        <div
          className={`
            absolute left-0 top-0 h-full w-full transition-all duration-250 ease-out origin-left
            ${
              error
                ? 'bg-[#bdc7ce] h-[2px]'
                : isFocused
                ? 'bg-[#bdc7ce] h-[2px] scale-x-100'
                : 'bg-[#bdc7ce] h-[1px] scale-x-0'
            }
          `}
        />
      </div>

      {error && (
        <p className="text-[10px] text-[#bdc7ce] mt-0.5 pl-0.5 font-medium animate-fade-in flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-[#bdc7ce]"></span>
          {error}
        </p>
      )}
    </div>
  )
}
