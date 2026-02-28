export const en = {
  appTitle: "MyWeatherCard",
  appSubtitle: "Minimal Malaysian weather cards for instant sharing",
  locationSearchLabel: "Search location",
  locationSearchPlaceholder: "Type district, station, or state",
  autoLocation: "Use my location",
  refresh: "Refresh",
  weatherNow: "Weather now",
  humidity: "Humidity",
  forecast: "Forecast",
  sourceOfficial: "Official forecast source",
  sourceCurrent: "Current metrics source",
  stale: "Showing last successful update",
  unavailable: "Unavailable",
  share: "Share",
  download: "Download PNG",
  generate: "Generate image",
  overlayMode: "Image overlay",
  cardMode: "Weather card",
  uploadPhoto: "Upload photo",
  uploadHint: "JPG/PNG up to 10MB",
  noPhoto: "Upload a photo to start overlay mode",
  geolocationDenied: "Location permission denied. Showing saved/default location.",
  geolocationError: "Unable to resolve your location."
} as const;

export type EnglishStrings = typeof en;
