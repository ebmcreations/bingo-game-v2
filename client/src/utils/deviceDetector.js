// deviceDetector.js
const getDeviceType = () => {
  const userAgent = navigator.userAgent;

  if (/mobile/i.test(userAgent)) {
    return 'mobile';
  }
  if (/tablet/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
};

export default getDeviceType;
