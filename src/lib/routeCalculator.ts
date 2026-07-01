// src/lib/routeCalculator.ts

interface Coords {
  lat: number;
  lng: number;
}

export async function calculatePickupDeviation(
  origin: Coords,
  destination: Coords,
  pickup: Coords,
  pricePerKm: number = 20
) {
  try {
    const buildUrl = (points: Coords[]) => {
      const coordsString = points.map(p => `${p.lng},${p.lat}`).join(';');
      return `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false`;
    };

    const directRes = await fetch(buildUrl([origin, destination]));
    const directData = await directRes.json();
    const directDistanceMeters = directData.routes[0].distance;

    const detourRes = await fetch(buildUrl([origin, pickup, destination]));
    const detourData = await detourRes.json();
    const detourDistanceMeters = detourData.routes[0].distance;

    const extraDistanceMeters = detourDistanceMeters - directDistanceMeters;
    let extraKm = extraDistanceMeters / 1000;

    // 🚨 [FIXED]: Ab koi 1km ka free buffer nahi hai. 0 se upar jate hi charge shuru.
    if (extraKm <= 0) {
      extraKm = 0;
    } else {
      // Decimal ke ek point tak round off karega (e.g. 0.4 km)
      extraKm = Math.round(extraKm * 10) / 10;
    }

    const extraCharge = Math.ceil(extraKm * pricePerKm);

    return {
      isDeviated: extraKm > 0,
      extraKm: extraKm,
      extraCharge: extraCharge,
      directDistance: Math.round(directDistanceMeters / 1000),
      detourDistance: Math.round(detourDistanceMeters / 1000)
    };
  } catch (error) {
    console.error("Route calculation failed:", error);
    return null;
  }
}