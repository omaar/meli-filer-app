import React, { useRef } from "react";
import { Button } from "@nextui-org/button";
import { Snippet } from "@nextui-org/snippet";
import { button as buttonStyles } from "@nextui-org/theme";

export default function FileUploader() {
  const uploadRef = useRef(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files) {
      const file = files[0];
      console.log(file);
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!uploadRef || !uploadRef.current) return;

    uploadRef.current.click();
  };

  return (
    <div className="flex gap-3">
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <span>
          Haz click aqui para{" "}
          <Button
            onClick={handleButtonClick}
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            color="primary"
          >
            elegir archivo
          </Button>
        </span>
      </Snippet>
      <input
        className="hidden"
        ref={uploadRef}
        type="file"
        onChange={handleUpload}
      />
    </div>
  );
}
