import axios from 'axios';

interface TwoFAEmailResponse {
  success: boolean;
  message?: string;
}

export const useTwoFAEmail = () => {
  const sendTwoFAEmail = async (email: string): Promise<TwoFAEmailResponse> => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/reset/user/password/email`,
        { email }
      );
      
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send 2FA email'
      };
    }
  };

  return { sendTwoFAEmail };
}; 