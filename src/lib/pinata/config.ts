import PinataSDK from "@pinata/sdk";

if (!process.env.PINATA_JWT) {
  throw new Error("PINATA_JWT environment variable is required");
}

export const pinata = new PinataSDK({
  pinataJWTKey: process.env.PINATA_JWT,
});

export const pinataGateway =
  process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud";
