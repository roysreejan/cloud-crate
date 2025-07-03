"use client";

import { Button } from "@/components/ui/button";
import { RiFileAddFill } from "@remixicon/react";
import { ChangeEvent } from "react";

const UploadButton = () => {
  async function handleFileChange(e: ChangeEvent<HTMLElement>) {
    console.log(e.target.files);
  }
  return (
    <>
      <Button
        onClick={() => {
          document.getElementById("file-upload")?.click();
        }}
      >
        <RiFileAddFill /> Upload
      </Button>

      <input
        type="file"
        className="hidden"
        id="file-upload"
        multiple
        onChange={handleFileChange}
      />
    </>
  );
};

export default UploadButton;
