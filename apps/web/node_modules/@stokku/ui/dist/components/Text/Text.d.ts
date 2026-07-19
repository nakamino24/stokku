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
export declare const Text: React.FC<TextProps>;
