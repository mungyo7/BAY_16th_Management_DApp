import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const categories = [
  { id: 'all', name: '전체', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  { id: 'gifticon', name: '기프티콘', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300' },
  { id: 'coupon', name: '쿠폰', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { id: 'prize', name: '상품', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { id: 'service', name: '서비스', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
];

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id || (category.id === 'all' && !selectedCategory) ? 'default' : 'outline'}
            className={`cursor-pointer hover:opacity-80 transition-opacity ${
              selectedCategory === category.id || (category.id === 'all' && !selectedCategory) 
                ? '' 
                : category.color
            }`}
            onClick={() => onCategoryChange(category.id === 'all' ? null : category.id)}
          >
            {category.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}