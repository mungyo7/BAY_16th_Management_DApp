import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { ThemeSelect } from '@/components/theme-select';
import { Home, Users, Calendar, Trophy, User } from 'lucide-react';

export function Header() {
  const location = useLocation();
  
  const navigation = [
    { name: '홈', href: '/', icon: Home },
    { name: '출석체크', href: '/attendance', icon: Calendar },
    { name: '프로필', href: '/profile', icon: User },
    { name: '포인트', href: '/points', icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">BAY</span>
            </div>
            <span className="hidden font-bold sm:inline-block">
              BAY Management
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`transition-colors hover:text-foreground/80 ${
                    location.pathname === item.href
                      ? 'text-foreground'
                      : 'text-foreground/60'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className="relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
            >
              <span className="hidden lg:inline-flex">검색...</span>
              <span className="inline-flex lg:hidden">검색...</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeSelect />
            <Button variant="outline" size="sm" className="h-8 px-3">
              지갑 연결
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}