import { useLoaderData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";

import GoogleMap from "~/components/GoogleMap.tsx";

export async function loader(args: LoaderArgs) {
  const countries = args.params.countries
    ? args.params.countries.toUpperCase().split(",")
    : undefined;

  const prisma = new PrismaClient();

  const locations = await prisma.location.findMany({
    select: { latitude: true, longitude: true, city: true, id: true },
    where: {
      countryCode: {
        in: countries,
      },
    },
  });

  return {
    googleMapsKey: process.env.GOOGLE_MAPS_KEY ?? "",
    locations,
  };
}

export default function () {
  const { googleMapsKey, locations } = useLoaderData<typeof loader>();

  return <GoogleMap apiKey={googleMapsKey} locations={locations} />;
}
