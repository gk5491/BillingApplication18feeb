import { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return <AppShell>{children}</AppShell>;
};

export default MainLayout;
