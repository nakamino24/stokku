import React from 'react';
export type InputSize = 'sm' | 'md' | 'lg';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    inputSize?: InputSize;
    label?: string;
    error?: string;
    hint?: string;
    fullWidth?: boolean;
}
export declare const Input: React.FC<InputProps>;
