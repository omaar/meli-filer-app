import axios from "axios";

// initializing axios
const api = axios.create({
  baseURL: "/",
});

// original source: https://github.com/pilovm/multithreaded-uploader/blob/master/frontend/uploader.js
export class Uploader {
  constructor(options) {
    options.chunkSize = options.chunkSize || 0;
    this.chunkSize = Math.max(1024 * 1024 * options.chunkSize, 1024 * 1024 * 5);
    // number of parallel uploads
    options.threadsQuantity = options.threadsQuantity || 0;
    this.threadsQuantity = Math.min(options.threadsQuantity || 5, 15);
    // adjust the timeout value to activate exponential backoff retry strategy
    this.timeout = 0;
    this.file = options.file;
    this.fileName = options.fileName;
    this.aborted = false;
    this.uploadedSize = 0;
    this.progressCache = {};
    this.activeConnections = {};
    this.parts = [];
    this.uploadedParts = [];
    this.fileId = null;
    this.fileKey = null;
    this.onProgressFn = () => {};
    this.onErrorFn = () => {};
    this.onCompleteFn = () => {};
    this.baseURL = options.baseURL;
  }

  start() {
    this.initialize();
  }

  async initialize() {
    try {
      // adding the the file extension (if present) to fileName
      let fileName = this.file.name;

      // initializing the multipart request
      const requestBody = {
        fileName: fileName,
      };
      const initializeReponse = await api.request({
        url: "/upload/start",
        method: "POST",
        data: requestBody,
        baseURL: this.baseURL,
      });

      const AWSFileDataOutput = initializeReponse.data;

      this.fileName = this.file.name;
      this.uploadId = AWSFileDataOutput.uploadId;

      // retrieving the pre-signed URLs
      const numberOfparts = Math.ceil(this.file.size / this.chunkSize);

      const AWSMultipartFileDataInput = {
        fileName: this.fileName,
        uploadId: this.uploadId,
        parts: numberOfparts,
      };

      const urlsResponse = await api.request({
        url: "/upload/chunk/sign",
        method: "POST",
        data: AWSMultipartFileDataInput,
        baseURL: this.baseURL,
      });

      const newParts = urlsResponse.data.urlsSigned;
      this.parts.push(...newParts);

      this.sendNext();
    } catch (error) {
      await this.complete(error);
    }
  }

  sendNext(retry = 0) {
    const activeConnections = Object.keys(this.activeConnections).length;

    if (activeConnections >= this.threadsQuantity) {
      return;
    }

    if (!this.parts.length) {
      if (!activeConnections) {
        this.complete();
      }

      return;
    }

    const part = this.parts.pop();
    if (this.file && part) {
      const sentSize = (part.partNumber - 1) * this.chunkSize;
      const chunk = this.file.slice(sentSize, sentSize + this.chunkSize);

      const sendChunkStarted = () => {
        this.sendNext();
      };

      this.sendChunk(chunk, part, sendChunkStarted)
        .then(() => {
          this.sendNext();
        })
        .catch((error) => {
          if (retry <= 6) {
            retry++;
            const wait = (ms) => new Promise((res) => setTimeout(res, ms));
            //exponential backoff retry before giving up
            console.log(
              `Part#${part.partNumber} failed to upload, backing off ${2 ** retry * 100} before retrying...`
            );
            wait(2 ** retry * 100).then(() => {
              this.parts.push(part);
              this.sendNext(retry);
            });
          } else {
            console.log(`Part#${part.partNumber} failed to upload, giving up`);
            this.complete(error);
          }
        });
    }
  }

  async complete(error) {
    if (error && !this.aborted) {
      this.onErrorFn(error);
      return;
    }

    if (error) {
      this.onErrorFn(error);
      return;
    }

    try {
      await this.sendCompleteRequest();
    } catch (error) {
      this.onErrorFn(error);
    }
  }

  async sendCompleteRequest() {
    if (this.fileName && this.uploadId) {
      const requestBody = {
        fileName: this.fileName,
        uploadId: this.uploadId,
        parts: this.uploadedParts,
      };

      try {
        const { data } = await api.request({
          url: "/upload/complete",
          method: "POST",
          data: requestBody,
          baseURL: this.baseURL,
        });

        this.onCompleteFn({ data });
      } catch (error) {
        throw new Error(error, "Failed to complete upload");
      }
    }
  }

  sendChunk(chunk, part, sendChunkStarted) {
    return new Promise((resolve, reject) => {
      this.upload(chunk, part, sendChunkStarted)
        .then((status) => {
          if (status !== 200) {
            reject(new Error("Failed chunk upload"));
            return;
          }

          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  handleProgress(part, event) {
    if (this.file) {
      if (
        event.type === "progress" ||
        event.type === "error" ||
        event.type === "abort"
      ) {
        this.progressCache[part] = event.loaded;
      }

      if (event.type === "uploaded") {
        this.uploadedSize += this.progressCache[part] || 0;
        delete this.progressCache[part];
      }

      const inProgress = Object.keys(this.progressCache)
        .map(Number)
        .reduce((memo, id) => (memo += this.progressCache[id]), 0);

      const sent = Math.min(this.uploadedSize + inProgress, this.file.size);

      const total = this.file.size;

      const percentage = Math.round((sent / total) * 100);

      this.onProgressFn({
        sent: sent,
        total: total,
        percentage: percentage,
      });
    }
  }

  upload(file, part, sendChunkStarted) {
    // uploading each part with its pre-signed URL
    return new Promise((resolve, reject) => {
      const throwXHRError = (error, part, abortFx) => {
        delete this.activeConnections[part.partNumber - 1];
        reject(error);
        window.removeEventListener("offline", abortFx);
      };
      if (this.fileName && this.uploadId) {
        if (!window.navigator.onLine) reject(new Error("System is offline"));

        const xhr = (this.activeConnections[part.partNumber - 1] =
          new XMLHttpRequest());
        xhr.timeout = this.timeout;
        sendChunkStarted();

        const progressListener = this.handleProgress.bind(
          this,
          part.partNumber - 1
        );

        xhr.upload.addEventListener("progress", progressListener);

        xhr.addEventListener("error", progressListener);
        xhr.addEventListener("abort", progressListener);
        xhr.addEventListener("loadend", progressListener);

        xhr.open("PUT", part.signedUrl);
        const abortXHR = () => xhr.abort();
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4 && xhr.status === 200) {
            const ETag = xhr.getResponseHeader("ETag");

            if (ETag) {
              const uploadedPart = {
                PartNumber: part.partNumber,
                ETag: ETag.replaceAll('"', ""),
              };

              this.uploadedParts.push(uploadedPart);

              resolve(xhr.status);
              delete this.activeConnections[part.partNumber - 1];
              window.removeEventListener("offline", abortXHR);
            }
          }
        };

        xhr.onerror = (error) => {
          throwXHRError(error, part, abortXHR);
        };
        xhr.ontimeout = (error) => {
          throwXHRError(error, part, abortXHR);
        };
        xhr.onabort = () => {
          throwXHRError(new Error("Upload canceled by user or system"), part);
        };
        window.addEventListener("offline", abortXHR);
        xhr.send(file);
      }
    });
  }

  onProgress(onProgress) {
    this.onProgressFn = onProgress;
    return this;
  }

  onError(onError) {
    this.onErrorFn = onError;
    return this;
  }

  onComplete(onComplete) {
    this.onCompleteFn = onComplete;
    return this;
  }

  abort() {
    Object.keys(this.activeConnections)
      .map(Number)
      .forEach((id) => {
        this.activeConnections[id].abort();
      });

    this.aborted = true;
  }
}
