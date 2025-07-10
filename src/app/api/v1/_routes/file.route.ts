import { getServerSession } from "@/action/auth.action";
import db from "@/lib/database/db";
import { File as DBFile } from "@/lib/database/schema/file.model";
import { Subscription } from "@/lib/database/schema/subscription.model";
import { pinata } from "@/lib/pinata/config";
import { getCategoryFromMimeType, parseError } from "@/lib/utils";
import { Hono } from "hono";
import { Readable } from "stream";

const fileRoute = new Hono();

interface UploadFile extends Blob {
  name: string;
}

fileRoute.post("/upload", async (c) => {
  try {
    await db();

    const data = await c.req.formData();
    const file = data.get("file") as UploadFile;

    if (!file || typeof file.arrayBuffer !== "function") {
      return c.json({ message: "No file provided" }, { status: 400 });
    }

    const session = await getServerSession();
    if (!session) {
      return c.json(
        {
          message: "Unauthorized",
          description: "You need to be logged in to upload files",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const name = session.user.name;

    const subs = await Subscription.findOne({ subscriber: userId });
    if (!subs) {
      return c.json(
        {
          message: "⚠️ Warning",
          category: null,
          description:
            "Subscription not found. Please log out and log in again to refresh your session.",
        },
        { status: 404 }
      );
    }

    if (subs.subscriptionType !== "free" && subs.status !== "activated") {
      return c.json(
        {
          message: "⚠️ Warning",
          category: null,
          description:
            "Your subscription has expired. Please re-subscribe to continue.",
        },
        { status: 400 }
      );
    }

    if (subs.selectedStorage <= subs.usedStorage) {
      return c.json(
        {
          message: "⚠️ Warning",
          category: null,
          description:
            "Storage limit exceeded. Please subscribe and select additional storage.",
          file: null,
        },
        { status: 400 }
      );
    }

    // Convert file to stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const keyvalues = {
      userId: String(userId),
      name: String(name),
    } as unknown as string | number | null;

    const uploadData = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: {
        name: file.name,
        keyvalues,
      },
    });

    const category = getCategoryFromMimeType(file.type);

    await DBFile.create({
      pinataId: uploadData.IpfsHash,
      name: file.name,
      mimeType: file.type,
      cid: uploadData.IpfsHash,
      size: file.size,
      userInfo: { id: userId, name },
      category,
    });

    await Subscription.updateOne(
      { subscriber: userId },
      { $inc: { usedStorage: file.size } }
    );

    return c.json(
      {
        message: "Upload Successful",
        category,
        description: `File: ${file.name}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in file uploading: ", error);
    const err = parseError(error);
    return c.json(
      { message: "Error", description: err, file: null },
      { status: 500 }
    );
  }
});

export default fileRoute;
