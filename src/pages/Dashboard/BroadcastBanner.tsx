import { useEffect, useState } from 'react';

interface BroadcastBannerProps {
  restaurantId: string; // Accept restaurantId as a prop
}

export const BroadcastBanner: React.FC<BroadcastBannerProps> = ({ restaurantId }) => {
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // State for the image URL
  const [expiryDate, setExpiryDate] = useState<string | null>(null); // State for the expiry date
  const [header, setHeader] = useState<string | null>(null); // State for the header

  const fetchBroadcastMessage = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/delikaquickshipper_broadcast_table`);
      if (response.ok) {
        const data = await response.json();
        const restaurantBroadcast = data.find((broadcast: any) =>
          broadcast.restaurants.some((restaurant: { restaurantId: string }) => restaurant.restaurantId === restaurantId)
        );
        if (restaurantBroadcast) {
          setBroadcastMessage(restaurantBroadcast.Body);
          setHeader(restaurantBroadcast.Header);
          if (restaurantBroadcast.Image && restaurantBroadcast.Image.url) {
            setImageUrl(restaurantBroadcast.Image.url);
          }
          setExpiryDate(restaurantBroadcast.ExpiryDate);
        }
      } else {
        // Handle error silently
      }
    } catch (error) {
      // Handle error silently
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchBroadcastMessage();
      const interval = setInterval(fetchBroadcastMessage, 60000);
      return () => clearInterval(interval);
    }
  }, [restaurantId]);

  // Check if the banner should be displayed based on the expiry date
  const isExpired = expiryDate ? new Date(expiryDate).setHours(23, 59, 59, 999) < new Date().getTime() : false;

  if (!broadcastMessage || isExpired) return null; // Hide the banner if expired

  return (
    <div className="bg-blue-100 mb-4 rounded-xl flex items-center p-4">
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="Broadcast" 
          className="h-20 w-20 mr-4 rounded-full" // Adjust size and margin
        />
      )}
      <div className="flex-1">
        {header && <h2 className="font-bold text-lg ml-4 font-sans">{header}</h2>}
        <p className="text-sm ml-4 font-sans">{broadcastMessage}</p>
      </div>
    </div>
  );
}; 