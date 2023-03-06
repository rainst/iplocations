import { Loader } from "@googlemaps/js-api-loader";
import React from "react";

import type { IPLocation } from "~/routes/map";
import { getObject, storeObject } from "~/utils/localstorage";
import MapStatus from "./MapStatus";

interface Props {
  apiKey: string;
  locations: Array<IPLocation>;
  onSelectLocation: (newLocations: IPLocation) => void;
  selectedLocations: Array<IPLocation>;
}

export interface MapState {
  boundaries?: google.maps.LatLngBoundsLiteral;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
}

const mapStateLocalStorageKey = "mapState";

const GoogleMap = ({
  apiKey,
  locations,
  selectedLocations,
  onSelectLocation,
}: Props) => {
  const [mapState, setMapState] = React.useState<MapState>();
  const [initialised, setInitialised] = React.useState(false);
  const [markersVisible, setMarkersVisible] = React.useState(true);

  const mapInstanceRef = React.useRef<google.maps.Map | null>(null);
  const markersMapRef = React.useRef<Map<number, google.maps.Marker>>(
    new Map()
  );
  const gmapELRef = React.useRef<HTMLDivElement>(null);

  // Load google maps script, initialise the map and attach events to it
  React.useEffect(() => {
    const gmapsLoader = new Loader({
      apiKey,
      version: "weekly",
    });

    gmapsLoader.load().then(() => {
      if (!gmapELRef.current) return;

      const storedState = getObject<{
        zoom: number;
        center: { lat: number; lng: number };
      }>(mapStateLocalStorageKey, { zoom: 4, center: { lat: 0, lng: 0 } });

      const mapInstance = new google.maps.Map(gmapELRef.current, {
        zoom: storedState.zoom,
        center: storedState.center,
        fullscreenControlOptions: {},
      });

      mapInstanceRef.current = mapInstance;

      mapInstance.addListener("bounds_changed", () => {
        const boundaries = mapInstance.getBounds()?.toJSON();
        const center = mapInstance?.getCenter()?.toJSON();
        const zoom = mapInstance?.getZoom();

        setMapState({ boundaries, center, zoom });
        setInitialised(true);
      });
    });

    return () => {
      gmapsLoader.deleteScript();
      mapInstanceRef.current = null;
      setInitialised(false);
    };
  }, [apiKey]);

  // Create markers for each locations and attach events
  React.useEffect(() => {
    // console.log("create marker effect", initialised);
    if (!initialised) return;

    const markersMap = markersMapRef.current;

    locations.forEach((location) => {
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        title: location.city,
      });

      marker.addListener("click", () => {
        onSelectLocation(location);
      });

      markersMap.set(location.id, marker);
    });

    return () => {
      markersMap.clear();
    };
  }, [locations, initialised]);

  // store mapState in local storage
  React.useEffect(() => {
    if (mapState) storeObject(mapState, mapStateLocalStorageKey);
  }, [mapState]);

  // hide/show markers
  React.useEffect(() => {
    // console.log("markers visibility", initialised);
    if (!initialised) return;

    markersMapRef.current.forEach((marker) => {
      marker.setMap(markersVisible ? mapInstanceRef.current : null);
    });
  }, [markersVisible, initialised]);

  // when a location is selected/unselected
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
    <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
      <MapStatus
        locationsCount={locations.length}
        mapState={mapState}
        toggleMarkersVisibility={() => setMarkersVisible(!markersVisible)}
        markersVisible={markersVisible}
      />
      <div ref={gmapELRef} style={{ flexGrow: 1 }} />
    </div>
  );
};

export default GoogleMap;
