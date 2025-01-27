import { useState } from 'react';

export const useOrderNotifications = () => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    isSending,
    error
  };
}; 