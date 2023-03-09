import { PrismaClient } from "@prisma/client";
import Database from "better-sqlite3";

import { iprange2cidr } from "./ipFunction";

const prismaAvailable = !!process.env.PRISMA_DB_URL;

export async function getCountrylist(): Promise<Array<IPCountry>> {
  if (!prismaAvailable) {
    const db = getSqliteDatabase();
    const query = db.prepare(
      `SELECT
        COUNT("main"."Location"."rangeCount") AS rangeCount, 
        "main"."Location"."countryName", "main"."Location"."countryCode"
        FROM "main"."Location"
        WHERE "main"."Location"."countryCode" <> '-'
              GROUP BY "main"."Location"."countryName", "main"."Location"."countryCode"
              ORDER BY "main"."Location"."countryName" ASC LIMIT ? OFFSET ?`
    );

    const res = query.all([-1, 0]) as Array<IPCountry>;
    return res;
  }

  const prismaClient = getPrismaClient();

  const countries = await prismaClient.location.groupBy({
    where: {
      countryCode: { not: "-" },
    },
    by: ["countryName", "countryCode"],
    _count: { rangeCount: true },
    orderBy: { countryName: "asc" },
  });

  return countries.map(
    ({ countryCode, countryName, _count: { rangeCount } }) => ({
      countryCode,
      countryName,
      rangeCount,
    })
  );
}

export async function getIPLocations(
  countries?: Array<string>
): Promise<Array<IPLocation>> {
  if (!countries || countries.length === 0) return [];

  if (!prismaAvailable) {
    const db = getSqliteDatabase();
    const query = db.prepare(
      `SELECT "main"."Location"."id", "main"."Location"."latitude", "main"."Location"."longitude", "main"."Location"."city", "main"."Location"."rangeCount"
      FROM "main"."Location"
      WHERE "main"."Location"."countryCode" IN (${countries
        .map((country) => `'${country}'`)
        .join(", ")}) LIMIT ? OFFSET ?`
    );

    const res = query.all([-1, 0]) as Array<IPLocation>;
    return res;
  }

  const prismaClient = getPrismaClient();

  const locations = await prismaClient.location.findMany({
    select: {
      latitude: true,
      longitude: true,
      city: true,
      id: true,
      rangeCount: true,
    },
    where: {
      countryCode: {
        in: countries,
      },
    },
  });

  return locations;
}

export async function getFullLocations(
  locationIds?: Array<number>
): Promise<Array<IPFullLocation>> {
  const locations: Array<IPFullLocation> = [];
  if (!locationIds || locationIds.length === 0) return locations;

  let rawLocations: Array<IPFullLocationRaw>;

  if (!prismaAvailable) {
    const db = getSqliteDatabase();
    const query = db.prepare(
      `SELECT 'main'.'Location'.'id', 'main'.'Location'.'latitude', 'main'.'Location'.'longitude', 'main'.'Location'.'countryCode', 'main'.'Location'.'countryName', 'main'.'Location'.'region', 'main'.'Location'.'city', 'main'.'Location'.'rangeCount', 'main'.'Location'.'ranges'
      FROM 'main'.'Location'
      WHERE 'main'.'Location'.'id' IN (${locationIds
        .map((id) => `${id}`)
        .join(", ")}) LIMIT ? OFFSET ?`
    );

    rawLocations = query.all([-1, 0]);
  } else {
    const prismaClient = getPrismaClient();

    rawLocations = await prismaClient.location.findMany({
      where: {
        id: { in: locationIds },
      },
    });
  }

  rawLocations.forEach((location) => {
    const ranges = JSON.parse(location.ranges) as Array<string>;
    const cidrRanges: Array<string> = [];

    ranges.forEach((range) => {
      const [startIP, endIP] = range.split("-");

      iprange2cidr(startIP, endIP).forEach((cidrRange) => {
        cidrRanges.push(cidrRange);
      });
    });

    locations.push({
      id: location.id,
      latitude: location.latitude,
      longitude: location.longitude,
      countryCode: location.countryCode,
      countryName: location.countryName,
      region: location.region,
      city: location.city,
      rangeCount: location.rangeCount,
      ranges: cidrRanges,
    });
  });

  return locations;
}

function getPrismaClient() {
  console.log("using prisma", process.env.PRISMA_DB_URL);
  return new PrismaClient({
    log: process.env.NODE_ENV !== "production" ? ["query"] : undefined,
  });
}

function getSqliteDatabase() {
  const db = new Database("./db/iplocations.db", {
    readonly: true,
  });

  db.pragma("journal_mode = OFF");

  return db;
}
