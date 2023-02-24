import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
    _count: { countryName: true },
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

  React.useEffect(() => {
    console.log(countries);
  }, [countries]);

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
    <div>
      <p>Select one or more countries to load</p>
      <label htmlFor="filter">Filter country name</label>
      <input
        id="filter"
        type="text"
        onSubmit={() => console.log("submit")}
        value={textFilterValue}
        onChange={(e) => {
          setTextFilterValue(e.target.value);
        }}
      />
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
              {country.countryCode} - {country.countryName}
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
