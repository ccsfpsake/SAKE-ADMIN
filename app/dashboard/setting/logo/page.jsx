"use client";

import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { toast } from "react-toastify";
import styles from "@/app/ui/dashboard/setting/systemlogo.module.css";
import CropImageModal from "@/app/dashboard/crop/CropImageModal";
import Image from "next/image";

const SystemLogoPage = () => {
  const [logos, setLogos] = useState({ sake: null, favicon: null });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedLogoType, setSelectedLogoType] = useState("sake");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [croppedImage, setCroppedImage] = useState(null);
  const [previewURLs, setPreviewURLs] = useState({ sake: null, favicon: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchLogos = async () => {
    try {
      const storage = getStorage();
      const types = ["sake", "favicon"];
      const extensions = ["png", "jpg", "jpeg"];
      const newLogos = {};

      for (const type of types) {
        let found = false;
        for (const ext of extensions) {
          try {
            const fileRef = ref(storage, `Logo/${type}.${ext}`);
            const url = await getDownloadURL(fileRef);
            newLogos[type] = `${url}?t=${Date.now()}`;
            found = true;
            break;
          } catch (err) {
            // Try next extension
          }
        }
        if (!found) newLogos[type] = null;
      }

      setLogos(newLogos);
      setPreviewURLs(newLogos);
    } catch (error) {
      console.error("Error fetching logos:", error);
      toast.error("Failed to load logos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit.");
        return;
      }

      setSelectedFile(file);
      setCropModalOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!croppedImage) {
      toast.info("No image selected or cropped.");
      return;
    }

    const currentURL = logos[selectedLogoType];
    if (previewURLs[selectedLogoType] === currentURL) {
      toast.info("No changes detected.");
      return;
    }

    setIsUploading(true);

    try {
      const storage = getStorage();
      const extension = croppedImage.type === "image/jpeg" ? "jpg" : "png";
      const newLogoRef = ref(storage, `Logo/${selectedLogoType}.${extension}`);

      const oldExtensions = ["png", "jpg", "jpeg"];
      for (const ext of oldExtensions) {
        try {
          const oldRef = ref(storage, `Logo/${selectedLogoType}.${ext}`);
          await deleteObject(oldRef);
        } catch (error) {
          console.warn(`Could not delete old ${selectedLogoType}.${ext}:`, error.message);
        }
      }

      await uploadBytes(newLogoRef, croppedImage);
      const downloadURL = await getDownloadURL(newLogoRef);
      const newURLWithTimestamp = `${downloadURL}?t=${Date.now()}`;

      await setDoc(
        doc(db, "Setting", "SystemLogo"),
        { [selectedLogoType]: newURLWithTimestamp },
        { merge: true }
      );

      setLogos((prev) => ({ ...prev, [selectedLogoType]: newURLWithTimestamp }));
      setPreviewURLs((prev) => ({ ...prev, [selectedLogoType]: newURLWithTimestamp }));
      setSelectedFile(null);
      setCroppedImage(null);
      toast.success("Logo updated successfully.");
    } catch (error) {
      console.error("Error updating logo:", error);
      toast.error("Failed to update logo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoGrid}>
        {["sake", "favicon"].map((type) => (
          <div key={type} className={styles.logoCard}>
            <h4 className={styles.logoTitle}>
              {type === "sake" ? "Sake Logo" : "Favicon"}
            </h4>
            {isLoading ? (
              <div className={styles.loadingSpinner}></div>
            ) : previewURLs[type] ? (
              <Image
                src={previewURLs[type]}
                alt={`${type === "sake" ? "Sake Logo" : "Favicon"} Preview`}
                width={150}
                height={150}
                className={styles.logoImage}
                unoptimized
                onError={() => {
                  toast.error(`Failed to load ${type} logo.`);
                }}
              />
            ) : (
              <p>No logo found</p>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Select Logo Type:</label>
          <select
            value={selectedLogoType}
            onChange={(e) => setSelectedLogoType(e.target.value)}
            className={styles.select}
          >
            <option value="sake">Sake Logo</option>
            <option value="favicon">Favicon</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Upload New Logo:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          className={styles.button}
          disabled={!croppedImage || isUploading}
        >
          {isUploading ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {cropModalOpen && (
        <CropImageModal
          imageFile={selectedFile}
          onCrop={(croppedBlob) => {
            setCroppedImage(croppedBlob);
            const tempURL = URL.createObjectURL(croppedBlob);
            setPreviewURLs((prev) => ({
              ...prev,
              [selectedLogoType]: tempURL,
            }));
            setCropModalOpen(false);
          }}
          onClose={() => {
            setCropModalOpen(false);
            setSelectedFile(null);
            setCroppedImage(null);
          }}
        />
      )}
    </div>
  );
};

export default SystemLogoPage;
