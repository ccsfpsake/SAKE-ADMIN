"use client";

import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import styles from "@/app/ui/dashboard/setting/socialmedia.module.css";

const SocialMediaPage = () => {
  const [socialMediaData, setSocialMediaData] = useState({
    Phone: "",
    Email: "",
    Facebook: "",
    YouTube: "",
    Instagram: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "Setting", "Social Media Accounts");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSocialMediaData(docSnap.data());
          setOriginalData(docSnap.data());
        } else {
          toast.info("No social media data found.");
        }
      } catch (error) {
        console.error("Error fetching social media data:", error);
        toast.error("Failed to fetch social media data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSocialMediaData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const isDataChanged = () => {
    return JSON.stringify(socialMediaData) !== JSON.stringify(originalData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDataChanged()) {
      toast.info("No changes detected.");
      return;
    }

    try {
      const docRef = doc(db, "Setting", "Social Media Accounts");
      await setDoc(docRef, socialMediaData);
      setOriginalData(socialMediaData);
      toast.success("Social Media Accounts updated successfully.");
    } catch (error) {
      console.error("Error updating social media data:", error);
      toast.error("Failed to update social media data.");
    }
  };

  const fieldOrder = ["Email", "Phone", "Facebook", "YouTube", "Instagram"];

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {fieldOrder.map((field) => (
          <div className={styles.formGroup} key={field}>
            <label htmlFor={field} className={styles.label}>{field}</label>
            <input
              type="text"
              id={field}
              name={field}
              value={socialMediaData[field]}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
        ))}
        <button type="submit" className={styles.button}>Save Changes</button>
      </form>
    </div>
  );
};

export default SocialMediaPage;
