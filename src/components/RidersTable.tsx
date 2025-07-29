import { FunctionComponent, useEffect, useState } from 'react';
import { RiDeleteBin5Line } from "react-icons/ri";
import { CiEdit } from "react-icons/ci";
import { getRidersByBranch } from '../services/api';

export interface Rider {
  id: string;
  userId: string;
  userTable?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phoneNumber?: string;
  };
  fullName?: string;
  email?: string;
  role?: string;
  phoneNumber?: string;
}

interface RidersTableProps {
  branchName: string;
  onDeleteRider?: (riderId: string) => void;
  onEditRider?: (rider: Rider) => void;
}

const RidersTable: FunctionComponent<RidersTableProps> = ({ branchName, onDeleteRider, onEditRider }) => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiders = async () => {
      if (!branchName) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await getRidersByBranch(branchName);
        setRiders(response.data);
      } catch (err) {
        setError('Failed to fetch riders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiders();
  }, [branchName]);

  const handleDelete = (e: React.MouseEvent, rider: Rider) => {
    e.preventDefault();
    e.stopPropagation();
    

    // Use either userId or userTable.id, whichever is available
    const userIdToDelete = rider.userId || rider.userTable?.id;
    
    if (onDeleteRider && userIdToDelete) {
      onDeleteRider(userIdToDelete);
    } else {
      console.error('Cannot delete rider: Missing user ID', {
        userId: rider.userId,
        userTableId: rider.userTable?.id
      });
    }
  };

  const handleEdit = (rider: Rider) => {
    if (onEditRider) {
      onEditRider(rider);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading riders...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (riders.length === 0) {
    return <div className="text-center py-4">No riders found for this branch</div>;
  }

  return (
    <>
      {/* Table Headers */}
      <div className="grid grid-cols-[200px_1fr_1fr_1fr_100px] items-center p-3 bg-white dark:bg-black text-black dark:text-white font-sans">
        <div className="text-[12px] flex items-center">Name</div>
        <div className="text-[12px]">Email</div>
        <div className="text-[12px]">Courier Phone Number</div>
        <div className="text-[12px]">Role</div>
        <div className="text-[12px]">Action</div>
      </div>

      {/* Table Body */}
      {riders.map((rider) => {
        const fullName = rider.userTable?.fullName || rider.fullName || 'N/A';
        const email = rider.userTable?.email || rider.email || 'N/A';
        const role = rider.userTable?.role || rider.role || 'N/A';

        return (
          <div key={rider.id} className="grid grid-cols-[200px_1fr_1fr_1fr_100px] items-center gap-2 p-3 border-t border-gray-200 dark:border-[#333] font-sans bg-white dark:bg-black text-black dark:text-white">
            <div className="text-[12px] flex items-center gap-1 min-h-[24px]">
              <img 
                src={'/default-profile.jpg'} 
                alt={fullName}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="truncate">{fullName}</span>
            </div>
            <div className="text-[12px] truncate">{email}</div>
            <div className="text-[12px] truncate">{rider.userTable?.phoneNumber || rider.phoneNumber || 'N/A'}</div>
            <div className="text-[12px] truncate">{role}</div>
            <div className="flex items-center gap-1">
              <button 
                type="button"
                className="p-1.5 border-[1px] border-solid border-red-600 text-orange-600 rounded-[4px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[11px] font-sans"
                onClick={(e) => handleDelete(e, rider)}
              >
                <RiDeleteBin5Line className="w-4 h-4" />
              </button>
              <button 
                className="p-1.5 border-[1px] border-solid border-blue-600 text-blue-600 rounded-[4px] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[11px] font-sans"
                onClick={() => handleEdit(rider)}
              >
                <CiEdit className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default RidersTable; 