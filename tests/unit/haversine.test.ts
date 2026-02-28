import { describe, expect, it } from "vitest";

import { findNearestLocation, haversineDistanceKm } from "@/lib/location/haversine";
import type { LocationOption } from "@/types/weather";

describe("haversine utilities", () => {
  it("calculates known distance bounds", () => {
    const distance = haversineDistanceKm(
      { lat: 3.139, lon: 101.6869 },
      { lat: 3.0738, lon: 101.5183 }
    );

    expect(distance).toBeGreaterThan(15);
    expect(distance).toBeLessThan(25);
  });

  it("finds nearest location", () => {
    const locations: LocationOption[] = [
      {
        locationId: "Kuching",
        name: "Kuching",
        state: "Sarawak",
        lat: 1.5533,
        lon: 110.3592,
        category: "DS"
      },
      {
        locationId: "Kuala Lumpur",
        name: "Kuala Lumpur",
        state: "WP Kuala Lumpur",
        lat: 3.139,
        lon: 101.6869,
        category: "DS"
      },
      {
        locationId: "Kota Bharu",
        name: "Kota Bharu",
        state: "Kelantan",
        lat: 6.1256,
        lon: 102.2383,
        category: "DS"
      }
    ];

    const nearest = findNearestLocation({ lat: 3.15, lon: 101.7 }, locations);

    expect(nearest?.locationId).toBe("Kuala Lumpur");
  });
});
