# MyWeatherCard

MyWeatherCard is a client-only Next.js app that turns Malaysian weather data into clean, share-ready cards.

## Highlights

- App Router + TypeScript + Tailwind
- 4:5 weather card optimized for social sharing
- Auto geolocation with manual location search fallback
- `data.gov.my` forecast/warning + Open-Meteo current humidity/temperature
- Web Share API first, PNG download fallback
- Overlay mode with photo upload, drag/resize weather blocks, and layout persistence

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - run app locally
- `npm run build` - production build
- `npm run lint` - lint checks
- `npm run test:unit` - unit tests (Vitest)
- `npm run test:components` - component tests (Vitest + Testing Library)
- `npm run test:e2e` - Playwright tests
- `npm run generate:locations` - regenerate `src/data/location-index.json` from public APIs

## Data model

- Official forecast/warnings: `https://api.data.gov.my/weather/*`
- Current instant metrics: `https://api.open-meteo.com/v1/forecast`
- Timezone rendering: `Asia/Kuala_Lumpur`

## Notes

- No backend routes, database, or server-side storage are used.
- `src/data/location-index.json` is committed for fast client startup.
- Run `npm run generate:locations` when you want to rebuild full district/station coverage from live sources.
