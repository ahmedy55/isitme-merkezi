'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface CustomSelectProps {
  value: string;
  options: (string | SelectOption)[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function CustomSelect({
  value,
  options,
  onChange,
  placeholder = 'Seçiniz...',
  disabled = false,
  style,
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value) || (value ? { value, label: value } : null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{ position: 'relative', width: '100%', userSelect: 'none', ...style }}
    >
      {/* Trigger Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          minHeight: 42,
          padding: '8px 14px',
          borderRadius: 10,
          background: '#ffffff',
          border: isOpen ? '2px solid #3b82f6' : '1px solid #cbd5e1',
          boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
          {selectedOption ? (
            <>
              {selectedOption.color && (
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: selectedOption.color,
                    flexShrink: 0
                  }}
                />
              )}
              {selectedOption.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{selectedOption.icon}</span>}
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>

        {/* Chevron arrow */}
        <span
          style={{
            marginLeft: 8,
            color: isOpen ? '#3b82f6' : '#94a3b8',
            fontSize: '0.75rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.18s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          ▼
        </span>
      </div>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 14px 35px -6px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            padding: 6,
            boxSizing: 'border-box',
            animation: 'customDropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            maxHeight: 250,
            overflowY: 'auto'
          }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#0f172a' : '#334155',
                  background: isSelected ? '#e0f2fe' : 'transparent',
                  marginBottom: 2,
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt.color && (
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: opt.color,
                      flexShrink: 0
                    }}
                  />
                )}
                {opt.icon && <span style={{ display: 'flex', flexShrink: 0 }}>{opt.icon}</span>}
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {opt.label}
                </span>
                {isSelected && (
                  <span style={{ color: '#0284c7', fontSize: '0.85rem', fontWeight: 700 }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
