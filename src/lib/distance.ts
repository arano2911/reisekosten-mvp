type GeoResult = {
  features: {
    geometry: { coordinates: [number, number] };
  }[];
};

async function geocode(address: string) {
  const key = process.env.OPENROUTE_API_KEY;

  const url = `https://api.openrouteservice.org/geocode/search?api_key=${key}&text=${encodeURIComponent(address)}`;

  const res = await fetch(url);
  const data: GeoResult = await res.json();

  if (!data.features || !data.features.length) {
    throw new Error("Adresse nicht gefunden");
  }

  return data.features[0].geometry.coordinates;
}

export async function calculateDistance(from: string, to: string) {
  const key = process.env.OPENROUTE_API_KEY;

  const fromCoords = await geocode(from);
  const toCoords = await geocode(to);

  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car",
    {
      method: "POST",
      headers: {
        Authorization: key!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: [fromCoords, toCoords]
      })
    }
  );

  const data = await res.json();

  if (!data.routes || !data.routes.length) {
    throw new Error("Route konnte nicht berechnet werden");
  }

  const meters = data.routes[0].summary.distance;
  const km = meters / 1000;

  return Math.round(km * 10) / 10; // 1 Nachkommastelle
}
