import React from 'react';
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
    options: SelectOption[];
    label?: string;
    error?: string;
    placeholder?: string;
    fullWidth?: boolean;
}
export declare const Select: React.FC<SelectProps>;
