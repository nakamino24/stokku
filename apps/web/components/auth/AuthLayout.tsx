import { ReactNode } from 'react';
import BrandPanel from './BrandPanel';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 30% 70%, rgba(99,102,241,0.08) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(129,140,248,0.06) 0%, transparent 50%)
            `,
          }}
        />
        <BrandPanel />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 bg-surface-secondary">
        <div className="w-full max-w-md animate-scale-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-slate-900 text-lg font-semibold">Stokku</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
