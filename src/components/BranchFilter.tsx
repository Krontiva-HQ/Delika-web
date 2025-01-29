import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useBranches } from '../hooks/useBranches';
import { useUserProfile } from '../hooks/useUserProfile';

interface BranchFilterProps {
  restaurantId: string | null;
  onBranchSelect: (branchId: string) => void;
  selectedBranchId: string;
  hideAllBranches?: boolean;
  className?: string;
}

const BranchFilter = ({ restaurantId, onBranchSelect, selectedBranchId, hideAllBranches, className }: BranchFilterProps) => {
  const { branches, isLoading } = useBranches(restaurantId);
  const { userProfile } = useUserProfile();
  const [selectedBranch, setSelectedBranch] = useState<string>(selectedBranchId);

  const handleBranchSelect = (branchName: string, branchId: string) => {
    if (userProfile?.role === 'Admin') {
      localStorage.setItem('selectedBranchId', branchId);
    }
    setSelectedBranch(branchId);
    onBranchSelect(branchId);
  };

  // Set default branch if none selected for Admin
  useEffect(() => {
    if (userProfile?.role === 'Admin' && !selectedBranch && branches.length > 0 && !isLoading) {
      const firstBranchId = branches[0].id;
      localStorage.setItem('selectedBranchId', firstBranchId);
      handleBranchSelect(branches[0].branchName, firstBranchId);
    }
  }, [branches, isLoading, selectedBranch, userProfile?.role]);

  return (
    <div className="relative">
      <select
        value={selectedBranch}
        onChange={(e) => handleBranchSelect(e.target.value, e.target.value)}
        className={className || "appearance-none bg-white border border-gray-300 rounded-md py-1 pl-2 pr-8 text-xs leading-tight focus:outline-none focus:border-blue-500 font-sans text-black"}
      >
        {isLoading ? (
          <option disabled>Loading...</option>
        ) : (
          branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.branchName}
            </option>
          ))
        )}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
};

export default BranchFilter; 