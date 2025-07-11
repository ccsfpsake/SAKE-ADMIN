"use client";

import { useEffect, useState } from "react";
import styles from "./TopDrivers.module.css";
import { db } from "@/app/lib/firebaseConfig";
import { collection, onSnapshot, getDocs } from "firebase/firestore";
import { FiCalendar } from "react-icons/fi";
import Image from "next/image";
import dayjs from "dayjs";

const TopDrivers = () => {
  const [topDrivers, setTopDrivers] = useState([]);
  const [timeFilter, setTimeFilter] = useState("weekly");
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    const now = dayjs();
    let startDate;
    let label = "";

    if (timeFilter === "weekly") {
      startDate = now.subtract(7, "day").startOf("day");
      label = `Week: ${startDate.format("MMM D")} - ${now.format("MMM D, YYYY")}`;
    } else if (timeFilter === "monthly") {
      startDate = now.subtract(1, "month").startOf("day");
      label = `Month: ${now.format("MMMM YYYY")}`;
    } else if (timeFilter === "yearly") {
      startDate = now.subtract(1, "year").startOf("day");
      label = `Year: ${now.format("YYYY")}`;
    }

    setDateLabel(label);

    const unsub = onSnapshot(collection(db, "DriverHistory"), async (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const filtered = data.filter((item) => item.endTime?.toDate() >= startDate.toDate());

      // Group by driverID and sum fareCollected
      const fareMap = {};
      filtered.forEach((item) => {
        if (!fareMap[item.driverID]) fareMap[item.driverID] = 0;
        fareMap[item.driverID] += item.fareCollected || 0;
      });

      const sortedDrivers = Object.entries(fareMap)
        .map(([driverID, totalFare]) => ({ driverID, totalFare }))
        .sort((a, b) => b.totalFare - a.totalFare)
        .slice(0, 5);

      // Fetch driver profiles
      const driversRef = collection(db, "Drivers");
      const driverDocs = await getDocs(driversRef);
      const driversData = driverDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const enrichedDrivers = sortedDrivers.map((d) => {
        const profile = driversData.find((p) => p.driverID === d.driverID);
        return {
          ...d,
          name: profile ? `${profile.FName} ${profile.LName}` : "Unknown",
          imageUrl: profile?.imageUrl || "/default-avatar.png",
        };
      });

      setTopDrivers(enrichedDrivers);
    });

    return () => unsub();
  }, [timeFilter]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Top 5 Drivers</h2>
        <select
          className={styles.select}
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <p className={styles.dateLabel}><FiCalendar className={styles.icon} />{dateLabel}</p>

      <ul className={styles.driverList}>
        {topDrivers.map((driver, index) => (
          <li key={index} className={styles.driverCard}>
            <span className={styles.rank}>{index + 1}</span>
              <Image
                src={driver.imageUrl}
                alt={driver.name}
                width={60}
                height={60}
                className={styles.avatar}
              />

            <div className={styles.driverInfo}>
              <div className={styles.name}>{driver.name}</div>
              <div className={styles.fare}>₱ {(Number(driver.totalFare) || 0).toFixed(2)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopDrivers;
