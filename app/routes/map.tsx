import { useLoaderData } from "@remix-run/react";
import { Loader } from "@googlemaps/js-api-loader";
import React from "react";
import { PrismaClient } from "@prisma/client";

export async function loader() {
  const prisma = new PrismaClient();

  const locations = await prisma.location.findMany({
    select: { latitude: true, longitude: true, city: true, id: true },
    // where: {
    //   countryCode: {
    //     equals: "IT",
    //   },
    // },
  });

  return {
    googleMapsKey: process.env.GOOGLE_MAPS_KEY ?? "",
    locations,
  };
}

interface MapState {
  boundaries?: google.maps.LatLngBoundsLiteral;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
}

export default function () {
  const { googleMapsKey, locations } = useLoaderData<typeof loader>();
  const [filteredLocations, setFilteredLocations] = React.useState<
    typeof locations
  >([]);
  const [mapState, setMapState] = React.useState<MapState>();

  const [initialised, setInitialised] = React.useState(false);
  const gmapELRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<google.maps.Map | null>(null);
  const markersMapRef = React.useRef<Map<number, google.maps.Marker>>(
    new Map()
  );
  const [selectedLocations, setSelectedLocations] = React.useState<
    typeof locations
  >([]);

  React.useEffect(() => {
    const gmapsLoader = new Loader({
      apiKey: googleMapsKey,
      version: "weekly",
    });

    gmapsLoader.load().then(() => {
      setInitialised(true);
    });

    return () => {
      gmapsLoader.deleteScript();
      setInitialised(false);
    };
  }, [googleMapsKey]);

  React.useEffect(() => {
    if (!initialised || !gmapELRef.current) return;

    console.log("initmap effect");

    const mapState = localStorage.getItem("mapState")
      ? (JSON.parse(localStorage.getItem("mapState") ?? "") as MapState)
      : null;

    mapInstanceRef.current = new google.maps.Map(gmapELRef.current, {
      zoom: mapState?.zoom ?? 4,
      center: mapState?.center ?? { lat: 0, lng: 0 },
      fullscreenControlOptions: {},
    });

    mapInstanceRef.current.addListener("bounds_changed", (e: any) => {
      const boundaries = mapInstanceRef.current?.getBounds()?.toJSON();
      const center = mapInstanceRef.current?.getCenter()?.toJSON();
      const zoom = mapInstanceRef.current?.getZoom();

      localStorage.setItem(
        "mapState",
        JSON.stringify({
          center,
          zoom,
        })
      );

      setMapState({ boundaries, center, zoom });
    });

    const markersMap = markersMapRef.current;

    locations.forEach((location) => {
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        title: location.city,
        // label: location.city
      });

      marker.addListener("click", () => {
        if (marker.get("selected")) {
          setSelectedLocations((oldLocations) =>
            oldLocations.filter((loc) => loc !== location)
          );
        } else {
          setSelectedLocations((oldLocations) => [...oldLocations, location]);
        }
      });

      markersMap.set(location.id, marker);
    });

    return () => {
      mapInstanceRef.current = null;
      markersMap.clear();
    };
  }, [initialised, locations]);

  const handleShowMarkers = () => {
    const bounds = mapInstanceRef.current?.getBounds()?.toJSON();
    if (!bounds) return;

    const includedLocations = locations
      .filter(
        (location) =>
          bounds.north > location.latitude &&
          location.latitude > bounds.south &&
          bounds.east > location.longitude &&
          location.longitude > bounds.west
      )
      .slice(0, 400);

    setFilteredLocations(includedLocations);
  };

  React.useEffect(() => {
    const filteredLocationIds = filteredLocations.map(
      (location) => location.id
    );

    console.log(filteredLocationIds);
    markersMapRef.current.forEach((marker, id) => {
      if (filteredLocationIds.includes(id)) {
        if (!marker.getMap()) marker.setMap(mapInstanceRef.current);
      } else marker.setMap(null);
    });
  }, [filteredLocations]);

  React.useEffect(() => {
    const selectedLocationIds = selectedLocations.map(
      (selectedLocation) => selectedLocation.id
    );

    markersMapRef.current.forEach((marker, locationId) => {
      if (selectedLocationIds.includes(locationId) && !marker.get("selected")) {
        marker.setValues({ selected: true });
        marker.setLabel("X");
      } else if (
        !selectedLocationIds.includes(locationId) &&
        marker.get("selected")
      ) {
        marker.setValues({ selected: false });
        marker.setLabel(null);
      }
    });
  }, [selectedLocations]);

  return (
    <div style={{ height: "80%" }}>
      <button onClick={handleShowMarkers}>show markers</button>{" "}
      <span>
        Locations shown: {filteredLocations.length}/{locations.length}
      </span>
      {mapState?.boundaries && (
        <div>
          Boundaries: N: {mapState?.boundaries?.north}, S:{" "}
          {mapState?.boundaries?.south}, W:
          {mapState?.boundaries?.west}, E: {mapState?.boundaries?.east}
        </div>
      )}
      <div>
        {mapState?.center && (
          <span>
            Center: {mapState.center.lat}, {mapState.center.lng}
          </span>
        )}
        {mapState?.zoom && <span> Zoom: {mapState.zoom}</span>}
      </div>
      <div ref={gmapELRef} style={{ height: "100%" }} />
      <div>
        {selectedLocations.length > 0 &&
          selectedLocations.map((location) => (
            <p
              key={location.id}
              onClick={() => {
                setSelectedLocations((oldLocations) =>
                  oldLocations.filter((loc) => loc !== location)
                );
              }}
            >
              {location.city}
            </p>
          ))}
      </div>
    </div>
  );
}
