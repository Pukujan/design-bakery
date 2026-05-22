import { useState, useEffect } from 'react';
import { Moon, Sun, Info, Phone, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

export function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(true);

  useEffect(() => {
    const savedMode = localStorage.getItem('mode');
    
    if (savedMode === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mode', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mode', 'light');
    }
  };

  return (
    <div className="">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDarkMode}
        className="rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-yellow-300 dark:hover:bg-yellow-600 transition-all w-14 h-14"
      >
        {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
      </Button>
   
    </div>
  );
}
