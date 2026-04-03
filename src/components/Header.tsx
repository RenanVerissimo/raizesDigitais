import { Menu, Sprout } from 'lucide-react';

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#ff6900] rounded-full size-10 flex items-center justify-center">
              <Sprout className="size-6 text-white" />
            </div>
            <div>
              <p className="text-[#f54900]">AgroGestão</p>
              <p className="text-[#4a5565] text-xs">Olá, {userName}</p>
            </div>
          </div>
          <button className="p-2">
            <Menu className="size-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
