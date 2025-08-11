import { useState, useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { productsAtom, isLoadingAtom, editingProductAtom, isEditProductModalOpenAtom } from '../store/marketAtoms';
import { useMarketplace } from '../hooks/useMarketplace';
import { profileAtom } from '@/features/profile/store/profileAtoms';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';
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
import { toast } from 'sonner';

export function ProductManagement() {
  const profile = useAtomValue(profileAtom);
  const products = useAtomValue(productsAtom);
  const setProducts = useSetAtom(productsAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [editingProduct, setEditingProduct] = useAtom(editingProductAtom);
  const [isEditOpen, setIsEditOpen] = useAtom(isEditProductModalOpenAtom);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  
  const { fetchProducts, updateProduct, deactivateProduct, program } = useMarketplace();
  
  const isAdmin = profile?.role === 'admin';
  
  useEffect(() => {
    if (program) {
      loadProducts();
    }
  }, [program]);
  
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      console.log('Loading products in ProductManagement...');
      const products = await fetchProducts();
      console.log('Products loaded:', products);
      setProducts(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('상품을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditClick = (product: typeof products[0]) => {
    setEditingProduct(product);
    setEditPrice(product.price.toString());
    setEditStock(product.stock.toString());
    setIsEditOpen(true);
  };
  
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    
    const price = editPrice ? parseInt(editPrice) : undefined;
    const stock = editStock ? parseInt(editStock) : undefined;
    
    if (price !== undefined && price <= 0) {
      toast.error('가격은 0보다 커야 합니다.');
      return;
    }
    
    if (stock !== undefined && stock < 0) {
      toast.error('재고는 0 이상이어야 합니다.');
      return;
    }
    
    setIsUpdating(true);
    try {
      await updateProduct(parseInt(editingProduct.id), price, stock);
      toast.success('상품이 업데이트되었습니다.');
      setIsEditOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.message || '업데이트에 실패했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeactivateProduct = async (productId: string) => {
    setIsDeactivating(true);
    setDeactivatingId(productId);
    try {
      await deactivateProduct(parseInt(productId));
      toast.success('상품이 비활성화되었습니다.');
      await loadProducts();
    } catch (error: any) {
      console.error('Deactivate failed:', error);
      toast.error(error.message || '비활성화에 실패했습니다.');
    } finally {
      setIsDeactivating(false);
      setDeactivatingId(null);
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">관리자만 접근 가능합니다.</p>
      </div>
    );
  }
  
  const categoryColors: Record<string, string> = {
    'goods': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'voucher': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'education': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'service': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  
  const categoryLabels: Record<string, string> = {
    'gifticon': '기프티콘',
    'coupon': '쿠폰',
    'prize': '상품',
    'service': '서비스',
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">상품 관리</h2>
          <Button onClick={loadProducts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">등록된 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>가격</TableHead>
                  <TableHead>재고</TableHead>
                  <TableHead>판매량</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      <Badge className={categoryColors[product.category || 'goods']}>
                        {categoryLabels[product.category || 'goods']}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.price} 포인트</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.soldCount}</TableCell>
                    <TableCell>
                      {product.isActive ? (
                        <Badge variant="default">활성</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(product)}
                          disabled={!product.isActive}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivateProduct(product.id)}
                          disabled={
                            !product.isActive || 
                            (isDeactivating && deactivatingId === product.id)
                          }
                        >
                          {isDeactivating && deactivatingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>상품 수정</DialogTitle>
            <DialogDescription>
              {editingProduct?.name}의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  가격
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="col-span-3"
                  placeholder="변경하지 않으려면 비워두세요"
                  disabled={isUpdating}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-stock" className="text-right">
                  재고
                </Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="col-span-3"
                  placeholder="변경하지 않으려면 비워두세요"
                  disabled={isUpdating}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isUpdating}
            >
              취소
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={isUpdating || (!editPrice && !editStock)}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  수정 중...
                </>
              ) : (
                '수정하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}