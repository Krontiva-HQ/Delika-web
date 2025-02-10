import { LoadScript } from '@react-google-maps/api';

const MapComponent = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error('Google Maps API key is not defined');
    return <div>Map cannot be loaded</div>;
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={['places']}
    >
      {/* Your map components */}
    </LoadScript>
  );
};

// Remove or comment out this entire section as it's causing conflicts
// const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// const mapScript = document.createElement('script');
// mapScript.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
// mapScript.async = true; 