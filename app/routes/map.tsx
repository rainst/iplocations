import { useLoaderData } from "@remix-run/react";
import { PrismaClient } from "@prisma/client";

import GoogleMap from "~/components/GoogleMap.tsx";

export async function loader() {
  const prisma = new PrismaClient();

  const locations = await prisma.location.findMany({
    select: { latitude: true, longitude: true, city: true, id: true },
    where: {
      countryCode: {
        equals: "IT",
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
