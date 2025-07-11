"use client";

import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import styles from "@/app/ui/dashboard/setting/aboutus.module.css";

const AboutUsEditPage = () => {
  const [aboutUsData, setAboutUsData] = useState({
    AboutUs: "",
    Mission: "",
    Vision: "",
  });

  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "Setting", "About Us");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAboutUsData(data);
          setOriginalData(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error.message);
        toast.error("Failed to load About Us data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAboutUsData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedData = {
      AboutUs: aboutUsData.AboutUs.trim(),
      Mission: aboutUsData.Mission.trim(),
      Vision: aboutUsData.Vision.trim(),
    };

    const hasChanges = Object.keys(trimmedData).some(
      (key) => trimmedData[key] !== originalData[key]
    );

    if (!hasChanges) {
      toast.info("No changes detected.");
      return;
    }

    if (!trimmedData.AboutUs || !trimmedData.Mission || !trimmedData.Vision) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = doc(db, "Setting", "About Us");
      await setDoc(docRef, trimmedData);
      setOriginalData(trimmedData);
      toast.success("About Us updated successfully.");
    } catch (error) {
      console.error("Error updating data:", error.message);
      toast.error("Failed to update About Us.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.aboutUsEditContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="AboutUs" className={styles.label}>
            About Us
          </label>
          <textarea
            id="AboutUs"
            name="AboutUs"
            value={aboutUsData.AboutUs}
            onChange={handleChange}
            className={styles.textarea}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="Mission" className={styles.label}>
            Mission
          </label>
          <textarea
            id="Mission"
            name="Mission"
            value={aboutUsData.Mission}
            onChange={handleChange}
            className={styles.textarea}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="Vision" className={styles.label}>
            Vision
          </label>
          <textarea
            id="Vision"
            name="Vision"
            value={aboutUsData.Vision}
            onChange={handleChange}
            className={styles.textarea}
            required
          />
        </div>

        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default AboutUsEditPage;
