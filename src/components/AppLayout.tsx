import { ReactNode } from 'react';
import BottomNav from './BottomNav';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showNav?: boolean;
}

export default function AppLayout({ title, subtitle, children, showNav = true }: Props) {
  return (
    <div className="min-h-screen bg-background">
      {/* Gradient top bar */}
      <div className="h-[1.5px] gradient-header" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-[672px] mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-micro text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[672px] mx-auto px-4 py-4 pb-20 space-y-4">
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}
