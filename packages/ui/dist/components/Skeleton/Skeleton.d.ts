import React from 'react';
export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';
export interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    count?: number;
    style?: React.CSSProperties;
}
export declare const Skeleton: React.FC<SkeletonProps>;
export declare const SkeletonCard: React.FC<{
    count?: number;
}>;
