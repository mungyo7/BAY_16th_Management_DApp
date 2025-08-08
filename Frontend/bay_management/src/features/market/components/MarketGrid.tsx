import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { filteredProductsAtom, productsAtom, isLoadingAtom, selectedProductAtom, isPurchasingAtom } from '../store/marketAtoms';
import { useMarketplace } from '../hooks/useMarketplace';
import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const categoryColors: Record<string, string> = {
  'goods': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'voucher': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'education': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'service': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const categoryLabels: Record<string, string> = {
  'goods': '굿즈',
  'voucher': '이용권',
  'education': '교육',
  'service': '서비스',
};

interface MarketGridProps {
  selectedCategory: string | null;
}

// BAY token mint address (Token-2022)
const BAY_TOKEN_MINT = new PublicKey('bay3egCym863ziQsvesuGptuGDkekVN6jwwdPd3Ywu2'); 

export function MarketGrid({ }: MarketGridProps) {
  const filteredProducts = useAtomValue(filteredProductsAtom);
  const setProducts = useSetAtom(productsAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [selectedProduct, setSelectedProduct] = useAtom(selectedProductAtom);
  const [isPurchasing, setIsPurchasing] = useAtom(isPurchasingAtom);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  
  const { fetchProducts, purchaseProduct, program } = useMarketplace();
  
  // Load products when program is ready
  useEffect(() => {
    if (program) {
      loadProducts();
    }
  }, [program]);
  
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      console.log('Loading products...');
      const products = await fetchProducts();
      console.log('Loaded products:', products);
      setProducts(products);
      
      if (products.length === 0) {
        console.log('No products found. Make sure marketplace is initialized and has products.');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('상품을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePurchaseClick = (product: typeof filteredProducts[0]) => {
    setSelectedProduct(product);
    setPurchaseQuantity(1);
    setShowPurchaseDialog(true);
  };
  
  const handleConfirmPurchase = async () => {
    if (!selectedProduct) return;
    
    setIsPurchasing(true);
    try {
      const txSignature = await purchaseProduct(
        parseInt(selectedProduct.id),
        purchaseQuantity,
        BAY_TOKEN_MINT
      );
      
      if (txSignature) {
        // Close dialog immediately after transaction is sent
        setShowPurchaseDialog(false);
        setSelectedProduct(null);
        
        // Show loading toast while waiting for confirmation
        toast.loading('트랜잭션 확인 중...', { id: 'purchase-confirming' });
        
        // Wait a bit for blockchain state to update (confirmation already done in purchaseProduct)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dismiss loading toast and show success
        toast.dismiss('purchase-confirming');
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">구매가 완료되었습니다! 🎉</span>
            <span className="text-xs opacity-80">TX: {txSignature.slice(0, 8)}...</span>
          </div>,
          { duration: 5000 }
        );
        
        // Reload products to update stock
        await loadProducts();
      }
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // Dismiss any loading toast
      toast.dismiss('purchase-confirming');
      
      // Check for AlreadyProcessed error (which means success)
      const errorMessage = error.message || error.toString();
      if (errorMessage.includes('AlreadyProcessed') || 
          errorMessage.includes('already been processed')) {
        setShowPurchaseDialog(false);
        setSelectedProduct(null);
        
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">구매가 완료되었습니다! 🎉</span>
            <span className="text-xs opacity-80">트랜잭션이 이미 처리되었습니다.</span>
          </div>,
          { duration: 5000 }
        );
        
        // Wait and reload
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadProducts();
        return;
      }
      
      // Check if error indicates success (for Unknown Program Instruction cases)
      if (error.logs && Array.isArray(error.logs)) {
        const hasSuccess = error.logs.some((log: string) => 
          log.includes('Purchase successful') || 
          log.includes('Program returned success')
        );
        
        if (hasSuccess) {
          setShowPurchaseDialog(false);
          setSelectedProduct(null);
          
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">구매가 완료되었습니다! 🎉</span>
              <span className="text-xs opacity-80">상품을 성공적으로 구매했습니다.</span>
            </div>,
            { duration: 5000 }
          );
          
          // Wait and reload
          await new Promise(resolve => setTimeout(resolve, 1000));
          await loadProducts();
          return;
        }
      }
      
      toast.error(error.message || '구매에 실패했습니다.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">상품이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={categoryColors[item.category || 'goods']}>
                    {categoryLabels[item.category || 'goods']}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    재고: {item.stock}개
                  </span>
                </div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  {item.description}
                </p>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{item.price}</span>
                    <span className="text-sm text-muted-foreground">포인트</span>
                  </div>
                  {item.soldCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {item.soldCount}개 판매됨
                    </span>
                  )}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="default"
                  disabled={item.stock === 0}
                  onClick={() => handlePurchaseClick(item)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {item.stock > 0 ? '구매하기' : '품절'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>상품 구매</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}을(를) 구매하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  수량
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">가격</Label>
                <div className="col-span-3">
                  {selectedProduct.price} 포인트
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">총액</Label>
                <div className="col-span-3 font-bold">
                  {selectedProduct.price * purchaseQuantity} 포인트
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPurchaseDialog(false)}
              disabled={isPurchasing}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmPurchase}
              disabled={isPurchasing || !selectedProduct || purchaseQuantity < 1}
            >
              {isPurchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  구매 중...
                </>
              ) : (
                '구매하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}