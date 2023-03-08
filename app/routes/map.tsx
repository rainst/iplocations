import React from "react";
import { Form, useLoaderData } from "@remix-run/react";
import { type LoaderArgs, redirect } from "@remix-run/node";

import GoogleMap from "~/components/GoogleMap.tsx";
import { getIPLocations } from "~/utils/dbFunctions";

export interface ServerData {
  googleMapsKey: string;
  locations: Array<IPLocation>;
}

export async function loader(args: LoaderArgs) {
  const url = new URL(args.request.url);

  const countriesParam = url.searchParams.get("countries");

  const countries = countriesParam
    ? countriesParam.toUpperCase()?.split(",")
    : undefined;

  const locations = await getIPLocations(countries);

  if (locations.length === 0) return redirect("/");

  return {
    googleMapsKey: process.env.GOOGLE_MAPS_KEY ?? "",
    locations,
  };
}

export default function () {
  const { locations, googleMapsKey } = useLoaderData<ServerData>();

  const [selectedLocations, setSelectedLocations] = React.useState<
    typeof locations
  >([]);

  const toggleLocation = React.useCallback(
    (newLocation: IPLocation) => {
      setSelectedLocations((oldSelectedLocations) => {
        if (oldSelectedLocations.includes(newLocation))
          return oldSelectedLocations.filter(
            (loc) => loc.id !== newLocation.id
          );

        return [...oldSelectedLocations, newLocation];
      });
    },
    [setSelectedLocations]
  );

  return (
    <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
      <GoogleMap
        apiKey={googleMapsKey}
        locations={locations}
        onSelectLocation={toggleLocation}
        selectedLocations={selectedLocations}
      />
      {selectedLocations.length > 0 && (
        <div
          style={{ display: "flex", flexDirection: "column", maxHeight: "20%" }}
        >
          <p>
            Total ranges for selected locations:{" "}
            {selectedLocations.reduce(
              (acc, location) => acc + location.rangeCount,
              0
            )}
          </p>
          <div
            style={{
              overflow: "scroll",
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "baseline",
              alignContent: "baseline",
              flexGrow: 1,
            }}
          >
            {selectedLocations.map((location) => (
              <p
                key={location.id}
                style={{
                  margin: 5,
                  padding: 5,
                  backgroundColor: "blue",
                  borderRadius: 5,
                }}
              >
                {location.city} ({location.rangeCount})
                <span
                  style={{ cursor: "pointer", marginLeft: 5 }}
                  onClick={() => {
                    toggleLocation(location);
                  }}
                >
                  x
                </span>
              </p>
            ))}
          </div>
          <Form
            action="export"
            method="post"
            reloadDocument
            style={{ display: "flex" }}
          >
            <div className="row">
              <input
                name="locationIds"
                value={selectedLocations.map((location) =>
                  location.id.toString()
                )}
                type="hidden"
              />
              <label style={{ margin: "0 5px" }}>
                <input
                  type="radio"
                  value="json"
                  name="format"
                  defaultChecked
                  style={{ display: "inline" }}
                />{" "}
                JSON
              </label>
              <label style={{ margin: "0 5px" }}>
                <input
                  type="radio"
                  value="list"
                  name="format"
                  style={{ display: "inline" }}
                />{" "}
                txt list
              </label>
              <button type="submit">Export</button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
}
