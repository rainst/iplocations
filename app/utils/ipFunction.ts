export const decimalToIP = (decimalIP: number | string) => {
  if (typeof decimalIP === "string") decimalIP = parseInt(decimalIP, 10);

  const binary = decimalIP.toString(2).padStart(32, "0");
  const parts = [];

  for (let i = 0; i < 4; i++) {
    const part = parseInt(binary.slice(i * 8, (i + 1) * 8), 2);
    parts.push(part);
  }

  return parts.join(".");
};

export const iprange2cidr = (
  startIP: number | string,
  endIP: number | string
) => {
  if (typeof startIP === "string") startIP = parseInt(startIP, 10);
  if (typeof endIP === "string") endIP = parseInt(endIP, 10);

  const results: Array<string> = [];

  while (endIP >= startIP) {
    let maxSize = 32;

    while (maxSize > 0) {
      const mask = parseInt(iMask(maxSize - 1), 16);

      const maskBase: number = largeBitwiseAND(startIP, mask);

      if (maskBase != startIP) break;

      maxSize--;
    }

    const x = Math.log(endIP - startIP + 1) / Math.log(2);

    const maxDiff = Math.floor(32 - Math.floor(x));

    if (maxSize < maxDiff) maxSize = maxDiff;

    results.push(`${decimalToIP(startIP)}/${maxSize}`);

    startIP += 2 ** (32 - maxSize);
  }

  return results;
};

const iMask = (size: number) => {
  const mask = 2 ** 32 - 2 ** (32 - size);

  return mask.toString(16);
};

/**
 * javascript can do bitwise operation `&` with numbers up to 32 bits, ip numbers can be larger than 32 bits
 *
 */

function largeBitwiseAND(val1: number, val2: number) {
  let shift = 0,
    result = 0;
  const mask = ~(~0 << 30); // Gives us a bit mask like 01111..1 (30 ones)
  let divisor = 1 << 30; // To work with the bit mask, we need to clear bits at a time

  while (val1 != 0 && val2 != 0) {
    let rs = mask & val1 & (mask & val2);
    val1 = Math.floor(val1 / divisor); // val1 >>> 30
    val2 = Math.floor(val2 / divisor); // val2 >>> 30

    for (let i = shift++; i--; ) {
      rs *= divisor; // rs << 30
    }

    result += rs;
  }

  return result;
}
