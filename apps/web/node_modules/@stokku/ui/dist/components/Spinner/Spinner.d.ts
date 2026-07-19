import React from 'react';
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export interface SpinnerProps {
    size?: SpinnerSize;
    color?: string;
    style?: React.CSSProperties;
}
export declare const Spinner: React.FC<SpinnerProps>;
