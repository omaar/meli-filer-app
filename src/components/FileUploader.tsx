import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Progress } from "@nextui-org/progress";
import { Snippet } from "@nextui-org/snippet";
import { button as buttonStyles } from "@nextui-org/theme";
import formatBytes from "@/utils/formatBytes";
import { Uploader } from "@/utils/Uploader";
import { apiUrl, reCaptchaSiteKey } from "@/config/site";

import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";

export default function FileUploader() {
  const uploadRef = useRef(null);
  const uploaderRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const [tokens, setTokens] = useState({ token1: "", token2: "", token3: "" });
  const [refreshTokens, setRefreshTokens] = useState(false);
  const handleTokens = (token1, token2, token3) => {
    setTokens({ token1, token2, token3 });
    console.log("Tokens received:", token1, token2, token3);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files) {
      const file = files[0];
      setSelectedFile(file);
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!uploadRef || !uploadRef.current) return;

    if (selectedFile) {
      setRefreshTokens(!refreshTokens);
      handleFileUpload(selectedFile);
    } else {
      uploadRef.current.click();
    }
  };

  const handleFileUpload = async (file) => {
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
        .onError((error) => {
          console.error(error);
          setProgress(0);
          setRefreshTokens(!refreshTokens);
        })
        .onComplete(({ data }) => {
          console.log(data.location);
          setSelectedFile(null);
          setProgress(0);
          setRefreshTokens(!refreshTokens);
        });
      uploader.start();
    }
  };

  const handleCancelButton = () => {
    if (uploaderRef.current) {
      uploaderRef.current.abort();
    }
    setSelectedFile(null);
    setProgress(0);
    setRefreshTokens(!refreshTokens);
  };

  return (
    <div className="flex gap-3">
      <Snippet hideCopyButton hideSymbol variant="bordered">
        <GoogleReCaptchaProvider reCaptchaKey={reCaptchaSiteKey}>
          <CaptchaComponent
            onTokensGenerated={handleTokens}
            refreshTokens={refreshTokens}
          />
        </GoogleReCaptchaProvider>
        {progress <= 0 ? (
          <span className="space-x-2">
            {selectedFile
              ? `[${formatBytes(selectedFile.size)}] ${selectedFile.name}  `
              : "Haz click aqui para "}
            <Button
              onClick={handleButtonClick}
              className={buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })}
              color="primary"
            >
              {selectedFile ? `Subir archivo` : "elegir archivo"}
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
    </div>
  );
}

const CaptchaComponent = ({ onTokensGenerated, refreshTokens }) => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getTokens = useCallback(async () => {
    if (!executeRecaptcha) return;

    try {
      const token1 = await executeRecaptcha("action1");
      const token2 = await executeRecaptcha("action2");
      const token3 = await executeRecaptcha("action3");

      // console.log("Token 1:", token1);
      // console.log("Token 2:", token2);
      // console.log("Token 3:", token3);
      onTokensGenerated(token1, token2, token3);
    } catch (error) {
      console.error("Error executing recaptcha", error);
    }
  }, [executeRecaptcha]);

  useEffect(() => {
    getTokens();
  }, [refreshTokens]);

  useEffect(() => {
    getTokens();
  }, [getTokens]);

  return <div className="hidden"></div>;
};
