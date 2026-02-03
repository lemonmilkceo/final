import { ContractDetailSkeleton } from '@/components/ui/Skeleton';

export default function ContractDetailLoading() {
  return (
    <div className="min-h-screen">
      <ContractDetailSkeleton />
    </div>
  );
}
