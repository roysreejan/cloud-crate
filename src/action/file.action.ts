import { FIVE_MINUTES } from "@/lib/contants";
import { pinata } from "@/lib/pinata/config";
import { parseError } from "@/lib/utils";

export async function generateUrl(cid: string) {
  try {
    const url = pinata.gateways.createSignedURL({
      cid,
      expires: FIVE_MINUTES,
    });
    return { data: url, status: 201 };
  } catch (error) {
    console.log("Error in generating files: ", error);
    const err = parseError(error);

    return { data: `${err}`, status: 500 };
  }
}
