declare interface IPLocation {
  id: number;
  latitude: number;
  longitude: number;
  city: string;
  rangeCount: number;
}

declare interface IPFullLocationRaw extends IPLocation {
  countryCode: string;
  countryName: string;
  region: string;
  ranges: string;
}

declare interface IPFullLocation extends Omit<IPFullLocationRaw, "ranges"> {
  ranges: Array<string>;
}

declare interface IPCountry {
  rangeCount: number;
  countryName: string;
  countryCode: string;
}
