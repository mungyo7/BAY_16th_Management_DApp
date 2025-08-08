import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { profileAtom } from '@/features/profile/store/profileAtoms';

interface MarketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: number;
  image?: string;
}

const mockItems: MarketItem[] = [
  {
    id: '1',
    name: 'BAY 티셔츠',
    description: '학회 공식 티셔츠입니다. 편안한 착용감과 세련된 디자인.',
    price: 50,
    category: 'goods',
    available: 15,
  },
  {
    id: '2',
    name: '스터디룸 이용권 (1일)',
    description: '학회 전용 스터디룸을 하루 동안 이용할 수 있습니다.',
    price: 20,
    category: 'voucher',
    available: 20,
  },
  {
    id: '3',
    name: '블록체인 입문 교육',
    description: '초보자를 위한 블록체인 기초 교육 과정입니다.',
    price: 30,
    category: 'education',
    available: 100,
  },
  {
    id: '4',
    name: 'BAY 스티커 세트',
    description: '학회 로고 스티커 10장 세트입니다.',
    price: 10,
    category: 'goods',
    available: 50,
  },
  {
    id: '5',
    name: '1:1 멘토링 (1시간)',
    description: '선배 개발자와 1대1 멘토링 세션입니다.',
    price: 40,
    category: 'service',
    available: 5,
  },
  {
    id: '6',
    name: '회의실 이용권 (2시간)',
    description: '팀 프로젝트를 위한 회의실 2시간 이용권입니다.',
    price: 15,
    category: 'voucher',
    available: 10,
  },
];

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

export function MarketGrid({ selectedCategory }: MarketGridProps) {
  const profile = useAtomValue(profileAtom);
  const isAdmin = profile?.role === 'admin';
  
  const filteredItems = selectedCategory 
    ? mockItems.filter(item => item.category === selectedCategory)
    : mockItems;
  
  const handlePurchase = (item: MarketItem) => {
    // TODO: Implement purchase logic with Solana contract
    console.log('Purchase item:', item);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredItems.map((item) => (
        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <Badge className={categoryColors[item.category]}>
                {categoryLabels[item.category]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                재고: {item.available}개
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
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full" 
              variant="default"
              disabled={item.available === 0}
              onClick={() => handlePurchase(item)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {item.available > 0 ? '구매하기' : '품절'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}