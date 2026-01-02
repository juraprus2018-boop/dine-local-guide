import { Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ClaimButtonProps {
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  citySlug: string;
  isClaimed?: boolean;
}

export function ClaimButton({ restaurantId, restaurantSlug, citySlug, isClaimed }: ClaimButtonProps) {
  if (isClaimed) {
    return null;
  }

  return (
    <Button variant="outline" asChild>
      <Link to={`/claimen/${citySlug}/${restaurantSlug}`}>
        <Flag className="mr-2 h-4 w-4" />
        Eigenaar? Claim dit restaurant
      </Link>
    </Button>
  );
}
