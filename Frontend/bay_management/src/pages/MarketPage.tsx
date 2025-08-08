import { MarketGrid, CategoryFilter } from '@/features/market';
import { WalletGuard } from '@/components/WalletGuard';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { profileAtom } from '@/features/profile/store/profileAtoms';
import { 
  isAddProductModalOpenAtom, 
  selectedCategoryAtom,
  marketplaceStateAtom,
  userTokenBalanceAtom
} from '@/features/market/store/marketAtoms';
import { AddProductModal } from '@/features/market/components/AddProductModal';
import { ProductManagement } from '@/features/market/components/ProductManagement';
import { BAYTokenBalance } from '@/features/market/components/BAYTokenBalance';
import { useMarketplace } from '@/features/market/hooks/useMarketplace';
import { useBAYToken } from '@/features/market/hooks/useBAYToken';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, ShoppingBag, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BAY_TOKEN_MINT } from '@/features/market/utils/token-config';

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
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const setIsAddProductModalOpen = useSetAtom(isAddProductModalOpenAtom);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const setMarketplaceState = useSetAtom(marketplaceStateAtom);
  const [activeTab, setActiveTab] = useState('shop');
  
  const { fetchMarketplaceState, initializeMarketplace, program } = useMarketplace();
  const { balance: bayBalance } = useBAYToken();
  
  // Check marketplace initialization status when program is ready
  useEffect(() => {
    const checkStatus = async () => {
      if (program) {
        console.log('Program is ready, checking marketplace status...');
        await checkMarketplaceStatus();
      }
    };
    checkStatus();
  }, [program]);
  
  const checkMarketplaceStatus = async () => {
    try {
      const state = await fetchMarketplaceState();
      console.log('Fetched marketplace state:', state);
      if (state) {
        setIsInitialized(state.isInitialized);
        setMarketplaceState(state);
      } else {
        console.log('No marketplace state found');
        setIsInitialized(false);
      }
    } catch (error) {
      console.error('Failed to check marketplace status:', error);
      setIsInitialized(false);
    }
  };
  
  const handleInitializeMarketplace = async () => {
    setIsInitializing(true);
    try {
      await initializeMarketplace(BAY_TOKEN_MINT);
      await checkMarketplaceStatus();
      toast.success('마켓플레이스가 초기화되었습니다.');
    } catch (error: any) {
      console.error('Failed to initialize marketplace:', error);
      
      // Check if marketplace is already initialized
      if (error.message?.includes('already in use') || error.message?.includes('already initialized')) {
        toast.info('마켓플레이스가 이미 초기화되어 있습니다.');
        // Re-fetch the marketplace state
        await checkMarketplaceStatus();
      } else {
        toast.error(error.message || '초기화에 실패했습니다.');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* BAY Token Balance Card */}
      <div className="mb-6">
        <BAYTokenBalance />
      </div>
      
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">BAY 포인트 마켓</h1>
            <p className="text-muted-foreground">
              포인트로 상품을 구매할 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && isInitialized && (
              <Button onClick={() => setIsAddProductModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                상품 등록
              </Button>
            )}
          </div>
        </div>
        
        {!isInitialized && isAdmin && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
              마켓플레이스가 아직 초기화되지 않았습니다.
            </p>
            <Button 
              onClick={handleInitializeMarketplace}
              disabled={isInitializing}
              size="sm"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  초기화 중...
                </>
              ) : (
                '마켓플레이스 초기화'
              )}
            </Button>
          </div>
        )}
      </div>

      {isInitialized ? (
        isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="shop">
                <ShoppingBag className="h-4 w-4 mr-2" />
                상점
              </TabsTrigger>
              <TabsTrigger value="manage">
                <Settings className="h-4 w-4 mr-2" />
                관리
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="shop">
              <CategoryFilter 
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
              <MarketGrid selectedCategory={selectedCategory} />
            </TabsContent>
            
            <TabsContent value="manage">
              <ProductManagement />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <CategoryFilter 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            <MarketGrid selectedCategory={selectedCategory} />
          </>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isAdmin 
              ? '마켓플레이스를 초기화해주세요.' 
              : '마켓플레이스가 준비 중입니다.'}
          </p>
        </div>
      )}
      
      <AddProductModal />
    </div>
  );
}