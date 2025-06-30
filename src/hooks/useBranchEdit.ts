import { useState } from 'react';
import { Branch } from '../types/branch';
import { updateBranch as updateBranchAPI } from '../services/api';

export const useBranchEdit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateBranch = async (branchId: string, formData: Branch) => {
    setIsLoading(true);
    setError(null);

    try {
      // Data Validation
      // 1. Missing Times Check: Ensures all days have both opening and closing times set
      const missingTimes = formData.activeHours.some(hour => 
        !hour.openingTime || !hour.closingTime
      );

      if (missingTimes) {
        throw new Error('Please set opening and closing times for all days');
      }

      // 2. Time Order Validation: Verifies that closing time comes after opening time for each day
      const invalidTimes = formData.activeHours.some(hour => {
        const openTime = new Date(`1970-01-01 ${hour.openingTime}`);
        const closeTime = new Date(`1970-01-01 ${hour.closingTime}`);
        return closeTime <= openTime;
      });

      if (invalidTimes) {
        throw new Error('Closing time must be after opening time for all days');
      }

      // 3. Data Preparation
      const submitData = {
        ...formData,
        activeHours: formData.activeHours.map(hour => ({
          day: hour.day,
          openingTime: hour.openingTime,
          closingTime: hour.closingTime
        }))
      };

      // 4. API Call
      const response = await updateBranchAPI(branchId, submitData);
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update branch';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateBranch,
    isLoading,
    error
  };
}; 