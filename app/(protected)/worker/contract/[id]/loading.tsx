import { ContractDetailSkeleton } from '@/components/ui/Skeleton';

export default function WorkerContractDetailLoading() {
  return (
    <div className="min-h-screen">
      <ContractDetailSkeleton />
    </div>
  );
}
