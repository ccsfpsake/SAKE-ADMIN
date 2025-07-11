"use client";

import { useState } from "react";
import AboutUsPage from "../setting/aboutus/page";
import FAQsPage from "../setting/faqs/page";
import SocialMediaPage from "../setting/social/page";
import SystemLogoPage from "../setting/logo/page";
import styles from "@/app/ui/dashboard/setting/setting.module.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("aboutUs");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Settings</h1>
      <div className={styles.tabs}>
        <button
          onClick={() => handleTabClick("aboutUs")}
          className={activeTab === "aboutUs" ? `${styles.activeTab} ${styles.focused}` : ""}
        >
          About Us
        </button>
        <button
          onClick={() => handleTabClick("socialMedia")}
          className={activeTab === "socialMedia" ? `${styles.activeTab} ${styles.focused}` : ""}
        >
          Connect With Us
        </button> 
        <button
          onClick={() => handleTabClick("systemLogo")}
          className={activeTab === "systemLogo" ? `${styles.activeTab} ${styles.focused}` : ""}
        >
          System Logo
        </button>
      </div>

      <div className={styles.tabContent}>
        <div className={activeTab === "aboutUs" ? styles.active : ""}>
          <AboutUsPage />
        </div>
        <div className={activeTab === "faqs" ? styles.active : ""}>
          <FAQsPage />
        </div>
        <div className={activeTab === "socialMedia" ? styles.active : ""}>
          <SocialMediaPage />
        </div>
        <div className={activeTab === "systemLogo" ? styles.active : ""}>
          <SystemLogoPage />
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={1000}   theme="colored" />
    </div>
  );
};

export default SettingsPage;
