import { useState } from 'react';
import { useAtom } from 'jotai';
import { isAddProductModalOpenAtom } from '../store/marketAtoms';
import { useMarketplace } from '../hooks/useMarketplace';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { value: 'gifticon', label: '기프티콘' },
  { value: 'coupon', label: '쿠폰' },
  { value: 'prize', label: '상품' },
  { value: 'service', label: '서비스' },
];

export function AddProductModal() {
  const [isOpen, setIsOpen] = useAtom(isAddProductModalOpenAtom);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('goods');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addProduct } = useMarketplace();
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setCategory('goods');
  };
  
  const handleSubmit = async () => {
    // Validation
    if (!name || !description || !price || !stock) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }
    
    const priceNum = parseInt(price);
    const stockNum = parseInt(stock);
    
    if (priceNum <= 0) {
      toast.error('가격은 0보다 커야 합니다.');
      return;
    }
    
    if (stockNum <= 0) {
      toast.error('재고는 0보다 커야 합니다.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Add category info to the name or description for now
      // Since the contract doesn't have a category field
      const productName = `[${categories.find(c => c.value === category)?.label}] ${name}`;
      
      const result = await addProduct(productName, description, priceNum, stockNum);
      
      // If result is null, it means the transaction was successful but returned "Unknown Program Instruction"
      if (result === null || result) {
        resetForm();
        setIsOpen(false);
        
        // Reload products after a short delay to ensure the blockchain state is updated
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Failed to add product:', error);
      
      // Check if it's an "AlreadyProcessed" error
      if (error.message?.includes('AlreadyProcessed') || error.message?.includes('already been processed')) {
        toast.info('트랜잭션이 이미 처리되었습니다. 페이지를 새로고침합니다.');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(error.message || '상품 등록에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>상품 등록</DialogTitle>
          <DialogDescription>
            마켓플레이스에 새로운 상품을 등록합니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">상품명</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: BAY 티셔츠"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">상품 설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품에 대한 자세한 설명을 입력하세요."
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="price">가격 (포인트)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50"
                disabled={isSubmitting}
                min="1"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="stock">재고 수량</Label>
            <Input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="100"
              disabled={isSubmitting}
              min="1"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name || !description || !price || !stock}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : (
              '상품 등록'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}