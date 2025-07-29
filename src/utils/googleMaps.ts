// Add the API key directly
const GOOGLE_MAPS_API_KEY = 'AIzaSyAdv28EbwKXqvlKo2henxsKMD-4EKB20l8';

export const initGoogleMaps = () => {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
  });
}; 