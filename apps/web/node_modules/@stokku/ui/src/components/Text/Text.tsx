import React from 'react';

export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption' | 'label';
export type TextColor = 'default' | 'muted' | 'primary' | 'danger' | 'success' | 'white';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TextAlign = 'left' | 'center' | 'right';

export interface TextProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
  align?: TextAlign;
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const variantDefaults: Record<TextVariant, { tag: keyof JSX.IntrinsicElements; style: React.CSSProperties }> = {
  h1: { tag: 'h1', style: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.25 } },
  h2: { tag: 'h2', style: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.3 } },
  h3: { tag: 'h3', style: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 } },
  h4: { tag: 'h4', style: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 } },
  body: { tag: 'p', style: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6 } },
  'body-sm': { tag: 'p', style: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 } },
  caption: { tag: 'span', style: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4 } },
  label: { tag: 'label', style: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 } },
};

const colorStyles: Record<TextColor, string> = {
  default: '#111827',
  muted: '#6b7280',
  primary: '#4f46e5',
  danger: '#dc2626',
  success: '#16a34a',
  white: '#ffffff',
};

const weightStyles: Record<TextWeight, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'default',
  weight,
  align,
  as: asProp,
  children,
  style,
  className,
}) => {
  const v = variantDefaults[variant];
  const Component = asProp || v.tag;

  return (
    <Component
      className={className}
      style={{
        margin: 0,
        color: colorStyles[color],
        fontWeight: weight ? weightStyles[weight] : v.style.fontWeight,
        textAlign: align,
        ...v.style,
        ...style,
      }}
    >
      {children}
    </Component>
  );
};
