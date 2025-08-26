import { getServerSession } from "@/action/auth.action";
import db from "@/lib/database/db";
import { File as DBFile } from "@/lib/database/schema/file.model";
import { Subscription } from "@/lib/database/schema/subscription.model";
import { pinata } from "@/lib/pinata/config";
import { getCategoryFromMimeType, parseError } from "@/lib/utils";
import { Hono } from "hono";

const fileRoute = new Hono();

fileRoute.get("/:page", async (c) => {
  try {
    await db();
    const category = c.req.param("page");
    const page = Number(c.req.query("page"));
    const session = await getServerSession();
    const FILE_SIZE = 9;

    if (!session) {
      return c.json(
        {
          message: "Unauthorized",
          description: "You need to be logged in to upload files",
        },
        { status: 401 }
      );
    }

    const {
      user: { id: userId, email: userEmail },
    } = session;

    // handle share file logic

    const totalFiles = await DBFile.countDocuments({
      "userInfo.id": userId,
      category,
    });

    const files = await DBFile.find({ "userInfo.id": userId, category })
      .skip((page - 1) * FILE_SIZE)
      .limit(FILE_SIZE)
      .sort({ createdAt: -1 })
      .lean();

    return c.json(
      {
        message: "Success",
        description: "",
        data: {
          files,
          total: totalFiles,
          currentPage: page,
          totalPages: Math.ceil(totalFiles / FILE_SIZE),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error in fetching files: ", error);
    const err = parseError(error);

    return c.json(
      {
        message: "Error",
        description: err,
        data: null,
      },
      { status: 500 }
    );
  }
});

fileRoute.post("/upload", async (c) => {
  try {
    await db();

    const data = await c.req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return c.json(
        { message: "No file provided", file: null },
        { status: 400 }
      );
    }

    const session = await getServerSession();
    if (!session) {
      return c.json(
        {
          file: null,
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
          description:
            "Subscription not found. Please log out and log in again to refresh your session.",
          file: null,
        },
        { status: 404 }
      );
    }

    if (subs.subscriptionType !== "free" && subs.status !== "activated") {
      return c.json(
        {
          message: "⚠️ Warning",
          description:
            "Your subscription has expired. Please re-subscribe to continue.",
          file: null,
        },
        { status: 400 }
      );
    }

    if (subs.selectedStorage <= subs.usedStorage) {
      return c.json(
        {
          message: "⚠️ Warning",
          description:
            "Storage limit exceeded. Please subscribe and select additional storage.",
          file: null,
        },
        { status: 400 }
      );
    }

    // Upload to Pinata
    const uploadData = await pinata.upload.public
      .file(file)
      .name(file.name)
      .keyvalues({ userId, name });

    const category = getCategoryFromMimeType(uploadData.mime_type);

    const uploadedFile = await DBFile.create({
      pinataId: uploadData.id,
      name: uploadData.name,
      mimeType: uploadData.mime_type,
      cid: uploadData.cid,
      size: uploadData.size,
      userInfo: { id: userId, name },
      category,
    });

    await Subscription.updateOne(
      { subscriber: userId },
      { $inc: { usedStorage: uploadData.size } }
    );

    return c.json(
      {
        message: "Upload Successful",
        category,
        description: `File: ${uploadData.name}`,
        file: uploadedFile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error in file uploading: ", error);
    return c.json(
      { message: "Error", description: parseError(error), file: null },
      { status: 500 }
    );
  }
});

export default fileRoute;
