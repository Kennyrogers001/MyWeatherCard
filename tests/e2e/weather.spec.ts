import path from "node:path";

import { expect, test } from "@playwright/test";

const forecastPayload = [
  {
    date: "2026-02-28T08:00:00+08:00",
    summary_forecast: "Cloudy in most areas",
    min_temp: 24,
    max_temp: 33,
    location: {
      location_id: "Kuala Lumpur",
      location_name: "Kuala Lumpur",
      state: "Wilayah Persekutuan Kuala Lumpur"
    }
  }
];

const warningPayload = [
  {
    date: "2026-02-28T08:00:00+08:00",
    warning: "Thunderstorm warning",
    warning_level: "Yellow",
    location: {
      location_id: "Kuala Lumpur"
    }
  }
];

const openMeteoPayload = {
  current: {
    time: "2026-02-28T08:00:00+08:00",
    temperature_2m: 30,
    relative_humidity_2m: 78,
    weather_code: 3
  }
};

test.beforeEach(async ({ page }) => {
  await page.route("https://api.data.gov.my/weather/forecast**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(forecastPayload)
    });
  });

  await page.route("https://api.data.gov.my/weather/warning**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(warningPayload)
    });
  });

  await page.route("https://api.open-meteo.com/v1/forecast**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(openMeteoPayload)
    });
  });
});

test("geolocation granted auto-selects nearest location", async ({ context, page }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 3.139, longitude: 101.6869 });

  await page.goto("/");

  await expect(page.getByText("Kuala Lumpur").first()).toBeVisible();
  await expect(page.getByText("30°C")).toBeVisible();
});

test("geolocation denied falls back gracefully", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByText("Location permission denied. Showing saved/default location.")
  ).toBeVisible();
});

test("download action exports PNG", async ({ page }) => {
  await page.goto("/");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toContain("myweathercard-");
  expect(download.suggestedFilename()).toContain(".png");
});

test("overlay mode supports upload, drag persistence, and export", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Image overlay" }).click();

  const fixturePath = path.resolve(process.cwd(), "tests/fixtures/photo.png");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);

  const draggableBlock = page
    .locator('[data-export-target="overlay-card"] .react-draggable')
    .first();
  const draggableBox = await draggableBlock.boundingBox();

  if (draggableBox) {
    await page.mouse.move(draggableBox.x + 20, draggableBox.y + 20);
    await page.mouse.down();
    await page.mouse.move(draggableBox.x + 90, draggableBox.y + 110);
    await page.mouse.up();
  }

  const storedLayout = await page.evaluate(() => window.localStorage.getItem("myweathercard.overlay.layout"));
  expect(storedLayout).not.toBeNull();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toContain(".png");
});
