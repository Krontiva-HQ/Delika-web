import { useState, useEffect } from 'react';
import { getTeamMembers, getTeamMembersAdmin } from '../services/api';
import { useUserProfile } from './useUserProfile';

interface UserTableResponse {
  id: string;
  created_at: number;
  restaurantId: string;
  branchId: string;
  email: string;
  password: string;
  OTP: string;
  role: string;
  userName: string;
  fullName: string;
  phoneNumber: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  dateOfBirth: string | null;
  Status: boolean;
  deviceId: string;
  tripCount: number;
  onTrip: boolean;
  countryCode: string;
  session: boolean;
  image: {
    access: string;
    path: string;
    name: string;
    type: string;
    size: number;
    mime: string;
    meta: {
      width: number;
      height: number;
    };
    url: string;
  };
  Location: {
    long: string;
    lat: string;
  };
}

interface BranchTableResponse {
  id: string;
  created_at: number;
  branchName: string;
  restaurantID: string;
  branchLocation: string;
  branchPhoneNumber: string;
  branchCity: string;
  branchLatitude: number;
  branchLongitude: number;
  openTime: string;
  closeTime: string;
  active: boolean;
  branchUrl: string;
}

interface TeamMemberResponse {
  id: string;
  created_at: number;
  userId: string;
  restaurantId: string;
  branchId: string;
  role: string;
  userTable: UserTableResponse;
  branchTable: BranchTableResponse;
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
        console.log('Fetching team members as Admin...');
        response = await getTeamMembersAdmin({ restaurantId });
        console.log('Admin Team Members API Response:', {
          status: response.status,
          data: response.data.map((member: TeamMemberResponse) => ({
            id: member.id,
            userId: member.userId,
            role: member.role,
            userInfo: {
              email: member.userTable.email,
              fullName: member.userTable.fullName || 'N/A',
              userName: member.userTable.userName || 'N/A',
              phoneNumber: member.userTable.phoneNumber,
              status: member.userTable.Status,
            },
            branchInfo: {
              name: member.branchTable.branchName,
              location: member.branchTable.branchLocation,
              city: member.branchTable.branchCity,
            },
            imageUrl: member.userTable.image?.url || null,
          })),
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Fetching team members as non-Admin...');
        response = await getTeamMembers({ restaurantId, branchId });
        console.log('Regular Team Members API Response:', {
          status: response.status,
          data: response.data,
          timestamp: new Date().toISOString()
        });
      }
      
      setTeamMembers(response.data);
    } catch (err) {
      console.error('Error fetching team members:', err);
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