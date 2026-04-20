import React from 'react';
import { twMerge } from 'tailwind-merge';

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={twMerge('bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}