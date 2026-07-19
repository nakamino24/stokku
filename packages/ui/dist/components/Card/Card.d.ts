import React from 'react';
export interface CardProps {
    children: React.ReactNode;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outlined' | 'elevated';
    style?: React.CSSProperties;
    className?: string;
    onClick?: () => void;
}
export declare const Card: React.FC<CardProps>;
export declare const CardHeader: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
}>;
export declare const CardBody: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
}>;
export declare const CardFooter: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
}>;
