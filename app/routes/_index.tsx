import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import React from "react";
import { PrismaClient } from "@prisma/client";

import styles from "~/css/countries.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export const loader = async () => {
  const prisma = new PrismaClient();

  const countries = await prisma.location.groupBy({
    where: {
      countryCode: { not: "-" },
    },
    by: ["countryName", "countryCode"],
    _count: { countryName: true, rangeCount: true },
    orderBy: { countryName: "asc" },
  });

  return json(countries);
};

export default function Index() {
  const [selectedCountries, setSelectedCountries] = React.useState<
    Array<string>
  >([]);
  const [textFilterValue, setTextFilterValue] = React.useState("");
  const countries = useLoaderData<typeof loader>();

  const handleSelectCountry = (countryCode: string) => () => {
    if (selectedCountries.includes(countryCode)) {
      setSelectedCountries(
        selectedCountries.filter((cc) => cc !== countryCode)
      );
    } else {
      setSelectedCountries([...selectedCountries, countryCode]);
    }
  };

  const filteredCountries = React.useMemo(() => {
    if (!textFilterValue) return countries;

    return countries.filter(
      (country) =>
        country.countryName.match(new RegExp(`${textFilterValue}`, "i")) ||
        country.countryCode.match(new RegExp(`${textFilterValue}`, "i"))
    );
  }, [textFilterValue, countries]);

  return (
    <div style={{ padding: 10 }}>
      <p style={{ marginBottom: 20 }}>
        Select one or more countries to load on the map:
      </p>
      <div className="row center">
        <input
          id="filter"
          type="text"
          value={textFilterValue}
          placeholder="Filter by name or country code"
          onChange={(e) => {
            setTextFilterValue(e.target.value);
          }}
        />
      </div>
      <Form action="/map">
        <div className="row center" style={{ margin: "1rem 0" }}>
          <input type="hidden" name="countries" value={selectedCountries} />
          <p>{selectedCountries.length} countries selected</p>
          <button
            type="submit"
            style={{
              marginLeft: "1rem",
            }}
            disabled={selectedCountries.length === 0}
          >
            Load on map
          </button>
          <button
            type="reset"
            disabled={selectedCountries.length === 0}
            onClick={() => setSelectedCountries([])}
          >
            Clear
          </button>
        </div>
      </Form>
      {filteredCountries.length > 0 && (
        <div className="countries">
          {filteredCountries.map((country) => (
            <div
              key={country.countryCode}
              onClick={handleSelectCountry(country.countryCode)}
              className={
                selectedCountries.includes(country.countryCode)
                  ? "country selected"
                  : "country"
              }
            >
              {country.countryCode} - {country.countryName} (
              {country._count.rangeCount})
            </div>
          ))}
        </div>
      )}
      {filteredCountries.length === 0 && countries.length === 0 && (
        <p>Country list not loaded</p>
      )}
      {filteredCountries.length === 0 && countries.length > 0 && (
        <p>No country matches your search</p>
      )}
    </div>
  );
}
