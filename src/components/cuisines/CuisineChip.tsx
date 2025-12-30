import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { CuisineType } from '@/types/database';

interface CuisineChipProps {
  cuisine: CuisineType;
  className?: string;
}

export function CuisineChip({ cuisine, className }: CuisineChipProps) {
  return (
    <Link
      to={`/keukens/${cuisine.slug}`}
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground',
        className
      )}
    >
      <span className="text-lg">{cuisine.icon}</span>
      <span>{cuisine.name}</span>
    </Link>
  );
}
