import type { SharedContextProps } from "~/data/CommonTypes";
import { useOutletContext } from "react-router";
import Cropper, { Area } from "react-easy-crop";
import { CSSProperties, useRef, useState } from "react";
import { logError } from "~/database/Auth";
import { Icon } from "../Icon";
import { getCroppedImg, uploadImage } from "./ImageHandlerBL";
import { DateTime } from "luxon";
import { IoniconName } from "~/data/Ionicons";

export interface ImageHandlerProps {
  /**The supabase bucket to upload to */
  bucket: string;
  /**The filepath in supabase (i.e. `${session.user.id}/${new Date.toIsoString()}_profile`) */
  filePath: string;
  /**Size in bytes (mb * 1 000 000) */
  maxSize?: number;
  /**File types the handler accepts */
  accept?: string;
  /**Pass in a default image for when there's no url */
  defaultImage?: string | undefined;
  /**An icon for before a user selects an image */
  placeholderIcon?: IoniconName | undefined;
  style?: CSSProperties;

  /*********************************
   * After the image is cropped and
   * uploaded, use this function to perform actions
   */
  onChange: (path: string) => void;
}

/******************************
 * ImageHandler component:
 * Handles selecting, cropping and processing images
 * using the 'react-easy-crop' library
 */
export function ImageHandler({
  bucket,
  filePath,
  maxSize = 5000000,
  accept = "image/*",
  defaultImage,
  placeholderIcon,
  style = {
    height: 200,
    aspectRatio: 1,
    borderRadius: "var(--border)",
  },
  onChange,
}: ImageHandlerProps) {
  const context: SharedContextProps = useOutletContext();
  const pickerRef = useRef<HTMLInputElement>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string>();
  const [downloadLogoUrl, setDownloadLogoUrl] = useState<string>();
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>();

  /**************************************
   * Allow user to pick an image from their
   * file explorer
   */
  function pickImage() {
    setCroppedImage(undefined);
    setDownloadImage(undefined);
    setDownloadLogoUrl(undefined);
    pickerRef.current?.click();
  }

  /***************************************
   * Handle uploading images to the server
   * and updating state
   * @param file
   * @returns
   */
  async function setDownloadImage(file: File | undefined) {
    if (!file) return;
    if (file.size > maxSize) {
      context.popAlert(
        `Your image must be smaller than ${maxSize / 1000000}mb`,
        undefined,
        true
      );
      return;
    }

    try {
      const url = (
        await uploadImage(
          bucket,
          `${filePath}_${DateTime.now().toMillis()}`,
          file
        )
      ).url;
      if (!url) return;
      setDownloadLogoUrl(url);
      return url;
    } catch (error) {
      logError(error, ["ImageHandler", "Set download Image"]);
      context.popAlert(
        "There was an issue uploading this image.",
        "Refresh the page and try again",
        true
      );
    }
  }

  /*************************************
   * Finally, handle cropping an image to 1 x 1 format
   */
  async function createCroppedImage() {
    if (!downloadLogoUrl) return;

    try {
      const croppedImage = (await getCroppedImg(
        downloadLogoUrl,
        croppedAreaPixels,
        0
      )) as File;
      let url = await setDownloadImage(croppedImage);
      setCroppedImage(url || undefined);
      url && onChange(url);
    } catch (error: any) {
      await logError(error, ["createCroppedImage"]);
      return;
    }
  }

  /****************************************************
   * Update the state variable showing what's croppped
   * @param pixels
   */
  const onCropComplete = (pixels: Area) => {
    setCroppedAreaPixels(pixels);
  };

  return (
    <div className="fade-sm boxed row">
      {downloadLogoUrl ? (
        logoLoading ? (
          <div className="middle center ">
            <p>Loading...</p>
          </div>
        ) : croppedImage ? (
          <div className="p-10" style={style}>
            <img
              className="basicImage clickable"
              onClick={() => pickImage()}
              src={croppedImage}
              style={{...style, border: "none"}}
              alt={`image`}
            />
          </div>
        ) : (
          <div className="col w-100 middle center p0">
            <div style={{ ...style, position: "relative" }}>
              <Cropper
                objectFit="cover"
                image={downloadLogoUrl}
                crop={crop}
                onCropChange={setCrop}
                zoom={zoom}
                onZoomChange={setZoom}
                onCropComplete={(area, pixels) =>
                  onCropComplete(pixels)
                }
                style={{
                  containerStyle: { ...style, border: "none" },
                }}
                aspect={(style?.aspectRatio as number) || 1}
              />
            </div>
            <div className="row mt-10 gap5">
              <button
                onClick={createCroppedImage}
                className="w-100 accent row middle center gap5 "
                type="button"
              >
                <Icon name="checkmark-circle" color="var(--txt)" />
                Add image
              </button>
              <button
                onClick={() => pickImage()}
                className="row middle center gap5 p0"
                type="button"
              >
                <Icon
                  name="close-circle"
                  color="var(--txt)"
                  size={20}
                />
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="col middle center w-100 p-10">
          <div
            className="col middle center clickable p-10 boxed"
            style={style}
            onClick={() => pickImage()}
          >
            {defaultImage ? (
              <div className="row w-100 center p-10">
                <img style={style} src={defaultImage} />
              </div>
            ) : (
              <Icon
                name={placeholderIcon || "image-outline"}
                size={(style?.height as number) / 2 || 100}
                color="var(--accent-md)"
              />
            )}
          </div>
          <input
            ref={pickerRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) =>
              setDownloadImage(
                (e.target.files && e.target.files[0]) || undefined
              )
            }
          />
        </div>
      )}
    </div>
  );
}
