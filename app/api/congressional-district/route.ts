import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEOCODIO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Geocodio API key is not configured" },
      { status: 500 }
    );
  }

  const geocodioUrl = `https://api.geocod.io/v1.9/reverse?q=${encodeURIComponent(`${lat},${lng}`)}&fields=cd&api_key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(geocodioUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Geocodio" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const ocdId = data?.results?.[0]?.fields?.congressional_districts?.[0]?.ocd_id;

    if (!ocdId) {
      return NextResponse.json(
        { error: "Congressional district not found for the given coordinates" },
        { status: 404 }
      );
    }

    const match = ocdId.match(/ocd-division\/country:us\/state:(\w\w)\/cd:(\d+)/);
    if (!match || match.length !== 3) {
      return NextResponse.json(
        { error: "Could not parse congressional district from response" },
        { status: 500 }
      );
    }

    const district = `${match[1].toUpperCase()}-${match[2]}`;

    return NextResponse.json({ district });
  } catch {
    return NextResponse.json(
      { error: "An error occurred while looking up the congressional district" },
      { status: 500 }
    );
  }
}
