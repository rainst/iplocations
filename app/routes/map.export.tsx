import { PrismaClient } from "@prisma/client";
import { ActionArgs } from "@remix-run/node";
import { iprange2cidr } from "~/utils/ipFunction";

const prisma = new PrismaClient();

export async function action({ request }: ActionArgs) {
  const body = await request.formData();
  
  if (!body.get("locationIds")) {
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "json/application",
        "Content-Disposition": 'attachment; filename="action.json"',
      },
    });
  }

  const locationIds = (body.get("locationIds") as string)
    .split(",")
    .map((el) => parseInt(el, 10));

  const format = body.get("format") ?? "json";

  const locations = await prisma.location.findMany({
    where: {
      id: { in: locationIds },
    },
  });

  let bodyResponse = "";
  let responseHeaders: ResponseInit["headers"] = {};

  if (format === "json") {
    const exportLocations: Array<{
      id: number;
      latitude: number;
      longitude: number;
      countryCode: string;
      countryName: string;
      region: string;
      city: string;
      rangeCount: number;
      cidrRanges: Array<string>;
    }> = [];

    locations.forEach((location) => {
      responseHeaders = {
        "Content-Type": "json/application;charset=UTF-8",
        "Content-Disposition": 'attachment; filename="ranges.json"',
      };

      const ranges = JSON.parse(location.ranges) as Array<string>;
      const cidrRanges: Array<string> = [];

      ranges.forEach((range) => {
        const [startIP, endIP] = range.split("-");

        iprange2cidr(startIP, endIP).forEach((cidrRange) => {
          cidrRanges.push(cidrRange);
        });
      });

      exportLocations.push({
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        countryCode: location.countryCode,
        countryName: location.countryName,
        region: location.region,
        city: location.city,
        rangeCount: location.rangeCount,
        cidrRanges,
      });
    });

    bodyResponse = JSON.stringify(exportLocations, undefined, 2);
  }

  if (format === "list") {
    responseHeaders = {
      "Content-Type": "text/plain;charset=UTF-8",
      "Content-Disposition": 'attachment; filename="ranges.txt"',
    };

    const exportRanges: Array<string> = [];

    locations.forEach((location) => {
      const ranges = JSON.parse(location.ranges) as Array<string>;
      const cidrRanges: Array<string> = [];

      ranges.forEach((range) => {
        const [startIP, endIP] = range.split("-");

        iprange2cidr(startIP, endIP).forEach((cidrRange) => {
          cidrRanges.push(cidrRange);
        });
      });

      exportRanges.push(...cidrRanges);
    });

    bodyResponse = exportRanges.join("\n");
  }

  return new Response(bodyResponse, {
    status: 200,
    headers: responseHeaders,
  });
}
