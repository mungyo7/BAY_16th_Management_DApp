import { MarketGrid, CategoryFilter } from '@/features/market';
import { WalletGuard } from '@/components/WalletGuard';
import { useAtomValue } from 'jotai';
import { profileAtom } from '@/features/profile/store/profileAtoms';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export function MarketPage() {
  return (
    <WalletGuard message="마켓플레이스를 이용하려면 지갑 연결이 필요합니다.">
      <MarketPageContent />
    </WalletGuard>
  );
}

function MarketPageContent() {
  const profile = useAtomValue(profileAtom);
  const isAdmin = profile?.role === 'admin';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">BAY 포인트 마켓</h1>
          <p className="text-muted-foreground">
            포인트로 상품을 구매할 수 있습니다.
          </p>
        </div>
        {isAdmin && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            상품 등록
          </Button>
        )}
      </div>

      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      <MarketGrid selectedCategory={selectedCategory} />
    </div>
  );
}