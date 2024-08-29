import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Progress } from "@nextui-org/progress";
import { Snippet } from "@nextui-org/snippet";
import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import formatBytes from "@/utils/formatBytes";
import { Uploader } from "@/utils/Uploader";
import { apiUrl, reCaptchaSiteKey } from "@/config/site";

import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";

export default function FileUploader() {
  return (
    <div className="flex gap-3">
      <GoogleReCaptchaProvider reCaptchaKey={reCaptchaSiteKey}>
        <MyUploader />
      </GoogleReCaptchaProvider>
    </div>
  );
}

const MyUploader = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const uploadRef = useRef(null);
  const uploaderRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [publicUrl, setPublicUrl] = useState(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;

    if (files) {
      const file = files[0];
      setSelectedFile(file);
    }
  };

  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!uploadRef || !uploadRef.current) return;

    if (selectedFile) {
      try {
        const stToken = await getToken("start_token");
        const ndToken = await getToken("send_token");
        handleFileUpload(selectedFile, { token1: stToken, token2: ndToken });
      } catch (error) {
        console.error("Error getting tokens", error);
      }
    } else if (publicUrl) {
      window.open(publicUrl);
      setPublicUrl(null);
    } else {
      uploadRef.current.click();
    }
  };

  const handleFileUpload = async (file, tokens) => {
    if (file) {
      const uploaderOptions = {
        file: file,
        baseURL: apiUrl,
        chunkSize: 5,
        threadsQuantity: 10,
        recaptchaTokens: tokens,
      };

      let percentage = 0;
      const uploader = new Uploader(uploaderOptions);
      uploaderRef.current = uploader;
      uploader
        .onProgress(({ percentage: newPercentage }) => {
          // to avoid the same percentage to be logged twice
          // console.log(`${newPercentage}%`);
          if (newPercentage !== percentage) {
            percentage = newPercentage;
            setProgress(percentage);
          }
        })
        .onUpload(async () => {
          // console.log("Uploading...");
          try {
            const nToken = await getToken("complete_token");
            await uploader.sendCompleteRequest(nToken);
          } catch (error) {
            throw new Error("Error sending complete request");
          }
        })
        .onComplete(({ data }) => {
          console.log(data.location);
          setPublicUrl(data.location);
          setSelectedFile(null);
          setProgress(0);
          setIsUploading(false);
        })
        .onError((error) => {
          console.error(error);
          setProgress(0);
          setIsUploading(false);
          setPublicUrl(null);
        });
      uploader.start();
      setIsUploading(true);
      setPublicUrl(null);
    }
  };

  const handleCancelButton = () => {
    if (uploaderRef.current) {
      uploaderRef.current.abort();
    }
    setSelectedFile(null);
    setProgress(0);
    setIsUploading(false);
  };

  const getToken = useCallback(
    async (id_action) => {
      if (!executeRecaptcha) return;

      try {
        const nToken = await executeRecaptcha(id_action);
        // console.log("New Token:", nToken);
        return nToken;
      } catch (error) {
        console.error("Error executing recaptcha", error);
        return null;
      }
    },
    [executeRecaptcha]
  );

  return (
    <Snippet hideCopyButton hideSymbol variant="bordered">
      {!isUploading ? (
        <span className="space-x-2">
          {selectedFile
            ? `[${formatBytes(selectedFile.size)}] ${selectedFile.name}  `
            : "Haz click aqui para "}
          <Button
            href={publicUrl ? publicUrl : ""}
            showAnchorIcon={publicUrl ? true : false}
            as={publicUrl ? Link : Button}
            onClick={handleButtonClick}
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            color="primary"
          >
            {selectedFile
              ? `Subir archivo`
              : publicUrl
                ? "Ver archivo"
                : "elegir archivo"}
          </Button>
          {selectedFile && (
            <Button
              onClick={handleCancelButton}
              className={buttonStyles({
                color: "default",
                radius: "full",
                variant: "shadow",
              })}
              color="primary"
            >
              Cancelar
            </Button>
          )}
          <input
            className="hidden"
            ref={uploadRef}
            type="file"
            onChange={handleUpload}
          />
        </span>
      ) : (
        <span className="flex gap-3 space-x-4">
          <Progress
            label="Subiendo... "
            size="md"
            value={progress}
            maxValue={100}
            color="primary"
            formatOptions={{ style: "percent", percent: "%" }}
            showValueLabel={true}
            className="max-w-md"
          />
          <br />
          <Button
            onClick={handleCancelButton}
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            color="primary"
          >
            Cancelar
          </Button>
        </span>
      )}
    </Snippet>
  );
};
