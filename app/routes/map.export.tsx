import { type ActionArgs } from "@remix-run/node";

import { getFullLocations } from "~/utils/dbFunctions";

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

  const locations = await getFullLocations(locationIds);

  let bodyResponse = "";
  let responseHeaders: ResponseInit["headers"] = {};

  if (format === "json") {
    responseHeaders = {
      "Content-Type": "text/json;charset=UTF-8",
      "Content-Disposition": 'attachment; filename="ranges.json"',
    };

    bodyResponse = JSON.stringify(locations, undefined, 2);
  }

  if (format === "list") {
    responseHeaders = {
      "Content-Type": "text/plain;charset=UTF-8",
      "Content-Disposition": 'attachment; filename="ranges.txt"',
    };

    bodyResponse = locations.reduce((acc, location) => {
      return acc + location.ranges.join("\n");
    }, "");
  }

  return new Response(bodyResponse, {
    status: 200,
    headers: responseHeaders,
  });
}
