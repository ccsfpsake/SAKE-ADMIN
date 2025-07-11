"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import MenuLink from "./menuLink/menuLink";
import styles from "./sidebar.module.css";
import { IoBusOutline } from "react-icons/io5";
import { TbBusStop, TbCurrencyPeso } from "react-icons/tb";
import { FaTimes } from "react-icons/fa";
import {
  MdReportGmailerrorred,
  MdOutlinePolicy,
  MdDashboard,
  MdPerson,
  MdRoute,
  MdSettings,
} from "react-icons/md";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db } from "@/app/lib/firebaseConfig";
import {
  collection,
  collectionGroup,
  onSnapshot,
} from "firebase/firestore";

const menuItems = [
  {
    title: "PAGES",
    list: [
      { title: "Dashboard", path: "/dashboard", icon: <MdDashboard className={styles.icon} /> },
      { title: "Operators", path: "/dashboard/operator", icon: <MdPerson className={styles.icon} /> },
      { title: "Fare", path: "/dashboard/fare", icon: <TbCurrencyPeso className={styles.icon} /> },
      { title: "Route", path: "/dashboard/routes", icon: <MdRoute className={styles.icon} /> },
      { title: "Location", path: "/dashboard/location", icon: <IoBusOutline className={styles.icon} /> },
      { title: "Stops", path: "/dashboard/stops", icon: <TbBusStop className={styles.icon} /> },
      { title: "Reports", path: "/dashboard/reports", icon: <MdReportGmailerrorred className={styles.icon} /> },
    ],
  },
  {
    title: "USER",
    list: [
      { title: "Setting", path: "/dashboard/setting", icon: <MdSettings className={styles.icon} /> },
      { title: "Terms of Use", path: "/dashboard/terms", icon: <MdOutlinePolicy className={styles.icon} /> },
    ],
  },
];

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const [logoUrl, setLogoUrl] = useState("");

  const [hasLocationNotif, setHasLocationNotif] = useState(false);
  const [hasReportNotif, setHasReportNotif] = useState(false);

  useEffect(() => {
    const cachedUrl = localStorage.getItem("sakeLogo");

    if (cachedUrl) {
      setLogoUrl(cachedUrl);
    } else {
      const fetchLogo = async () => {
        try {
          const storage = getStorage();
          const logoRef = ref(storage, "Logo/sake.png");
          const url = await getDownloadURL(logoRef);
          setLogoUrl(url);
          localStorage.setItem("sakeLogo", url);
        } catch (error) {
          console.error("Error fetching sake logo:", error);
        }
      };

      fetchLogo();
    }
  }, []);

  useEffect(() => {
    const unsubMessages = onSnapshot(collectionGroup(db, "messages"), (snapshot) => {
      let foundUnread = false;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const path = doc.ref.path;

        if (!data.seen && path.includes("busReports") && data.senderRole === "operator") {
          foundUnread = true;
        }
      });

      if (foundUnread) {
        setHasReportNotif(true);
      } else {
        const unsubReports = onSnapshot(collection(db, "busReports"), (reportSnap) => {
          let hasNew = false;
          reportSnap.forEach((doc) => {
            const report = doc.data();
            if (!report.adminSeen) {
              hasNew = true;
            }
          });
          setHasReportNotif(hasNew);
        });

        return () => unsubReports();
      }
    });

    return () => unsubMessages();
  }, []);

  useEffect(() => {
    const CCSFP_C3_LAT = 15.06137;
    const CCSFP_C3_LNG = 120.643928;

    const isAtCCSFP_C3 = (lat, lng) =>
      Math.abs(lat - CCSFP_C3_LAT) < 0.0005 && Math.abs(lng - CCSFP_C3_LNG) < 0.0005;

    const unsub = onSnapshot(collection(db, "BusLocation"), (snapshot) => {
      let hasIdle = false;
      const now = Date.now();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const lastUpdate = data.timestamp?.toDate?.();
        const idleTime = lastUpdate ? (now - lastUpdate.getTime()) / 60000 : 0;

        const lat = data.currentLocation?.latitude;
        const lng = data.currentLocation?.longitude;

        if (lat && lng) {
          const atCCSFP = isAtCCSFP_C3(lat, lng);
          const threshold = atCCSFP ? 16 : 11;

          if (idleTime >= threshold) {
            hasIdle = true;
          }
        }
      });

      setHasLocationNotif(hasIdle);
    });

    return () => unsub();
  }, []);

  return (
    <div className={`${styles.container} ${isSidebarOpen ? styles.open : styles.closed}`}>
      <div className={styles.header}>
        <div className={styles.logoWrapper}>
          {logoUrl && (
        <Image
          src={logoUrl}
          alt="SAKE Logo"
          width={140}
          height={60}
          className={styles.logo}
          loading="lazy"
        />
          )}
        </div>
        <button className={styles.closeButton} onClick={toggleSidebar}>
          <FaTimes />
        </button>
      </div>

      <ul className={styles.list}>
        {menuItems.map((cat) => (
          <li key={cat.title}>
            <span className={styles.cat}>{cat.title}</span>
            {cat.list.map((item) => (
              <MenuLink
                key={item.title}
                item={item}
                hasNotification={
                  (item.path === "/dashboard/location" && hasLocationNotif) ||
                  (item.path === "/dashboard/reports" && hasReportNotif)
                }
              />
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
