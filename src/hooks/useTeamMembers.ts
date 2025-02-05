import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserProfile } from './useUserProfile';

interface TeamMemberResponse {
  id: string;
  created_at: number;
  restaurantId: string;
  branchId: string;
  email: string;
  role: string;
  userName: string;
  fullName: string;
  phoneNumber: string;
  Status: boolean;
  image: {
    url: string;
  };
  branchesTable: {
    id: string;
    branchName: string;
    branchPhoneNumber: string;
  };
}

interface UseTeamMembersProps {
  restaurantId: string;
  branchId: string;
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  Status: boolean;
  created_at: number;
  userName: string;
  city: string;
  phoneNumber: string;
  address: string;
  postalCode: string;
  country: string;
  restaurantId: string;
  branchId: string;
  image?: {
    url: string;
  };
}

export const useTeamMembers = ({ restaurantId, branchId }: UseTeamMembersProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useUserProfile();

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      
      if (userProfile?.role === 'Admin') {
        // Use admin endpoint
        response = await axios.post(
          'https://api-server.krontiva.africa/api:uEBBwbSs/get/team/members/admin',
          { restaurantId }
        );
      } else {
        // Use regular endpoint
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/get/team/members`,
          { restaurantId, branchId }
        );
      }
      
      setTeamMembers(response.data);
    } catch (err) {
      setError('Failed to fetch team members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId && (userProfile?.role === 'Admin' || branchId)) {
      fetchTeamMembers();
    }
  }, [restaurantId, branchId, userProfile?.role]);

  return { teamMembers, isLoading, error, refetch: fetchTeamMembers };
}; 