import { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Calendar, ShoppingCart, Coins } from 'lucide-react';
import { 
  isMyProductsModalOpenAtom, 
  userPurchasesAtom,
  isLoadingPurchasesAtom 
} from '../store/marketAtoms';
import { useUserPurchases } from '../hooks/useUserPurchases';

export function MyProductsModal() {
  const [isOpen, setIsOpen] = useAtom(isMyProductsModalOpenAtom);
  const userPurchases = useAtomValue(userPurchasesAtom);
  const isLoading = useAtomValue(isLoadingPurchasesAtom);
  const { fetchUserPurchases } = useUserPurchases();

  useEffect(() => {
    if (isOpen) {
      fetchUserPurchases();
    }
  }, [isOpen, fetchUserPurchases]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            내 구매 내역
          </DialogTitle>
          <DialogDescription>
            BAY 포인트로 구매한 상품 목록입니다.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userPurchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">구매 내역이 없습니다</h3>
              <p className="text-muted-foreground">
                아직 구매한 상품이 없습니다. 마켓에서 상품을 구매해보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPurchases.map((purchase) => (
                <Card key={purchase.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{purchase.productName}</CardTitle>
                        <CardDescription className="text-sm">
                          {purchase.productDescription}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        수량: {purchase.quantity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">개당 가격</p>
                          <p className="font-semibold">{purchase.pricePerItem.toLocaleString()} BAY</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">총 결제 금액</p>
                          <p className="font-semibold text-primary">
                            {purchase.totalPrice.toLocaleString()} BAY
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">구매 일시</p>
                          <p className="font-medium">{formatDate(purchase.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}