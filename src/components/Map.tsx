import { LoadScript } from '@react-google-maps/api';

const MapComponent = () => {
  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={['places']}
    >
      {/* Your map components */}
    </LoadScript>
  );
};

// If you're loading the script directly in your component
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// When loading the script
const mapScript = document.createElement('script');
mapScript.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
mapScript.async = true; 