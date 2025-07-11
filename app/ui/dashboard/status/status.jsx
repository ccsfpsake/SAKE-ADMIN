"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig"; 
import styles from "./status.module.css";

const Status = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]); 

  useEffect(() => {
    const fetchBusesAndDrivers = async () => {
      try {
        const busSnapshot = await getDocs(collection(db, "Bus"));
        const busList = busSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBuses(busList);

        const driverIDs = busList.map((bus) => bus.driverID).filter(Boolean);

        let driverData = [];
        if (driverIDs.length > 0) {
          const driverSnapshots = await getDocs(
            query(collection(db, "Drivers"), where("driverID", "in", driverIDs))
          );
          driverData = driverSnapshots.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setDrivers(driverData);
        }

        // Sort after drivers are fetched
        const sortedBuses = [...busList].sort((a, b) => {
          const driverA = driverData.find((driver) => driver.driverID === a.driverID);
          const driverB = driverData.find((driver) => driver.driverID === b.driverID);
          const lastNameA = driverA?.LName?.toLowerCase() || "";
          const lastNameB = driverB?.LName?.toLowerCase() || "";
          return lastNameA.localeCompare(lastNameB);
        });

        setBuses(sortedBuses);
      } catch (error) {
        console.error("Error fetching buses and drivers:", error);
      }
    };

    fetchBusesAndDrivers();
  }, []);

  const toggleBusStatus = async (driverID, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const busSnapshot = await getDocs(collection(db, "Bus"));
      const busDoc = busSnapshot.docs.find((doc) => doc.data().driverID === driverID);

      if (busDoc) {
        const busRef = doc(db, "Bus", busDoc.id);
        await updateDoc(busRef, { status: newStatus });

        setBuses((prev) =>
          prev.map((bus) =>
            bus.driverID === driverID ? { ...bus, status: newStatus } : bus
          )
        );
      }
    } catch (error) {
      console.error("Error updating bus status:", error);
    }
  };

  const capitalizeName = (name) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const getDriverNameById = (driverID) => {
    const driver = drivers.find((d) => d.driverID === driverID);
    if (!driver || !driver.LName || !driver.FName) return null;
    return `${capitalizeName(driver.LName)}, ${capitalizeName(driver.FName)}`;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.semititle}>BUS STATUS</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Driver Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {buses.map((bus) => {
            const driverName = getDriverNameById(bus.driverID);
            if (!driverName) return null;

            return (
              <tr key={bus.id}>
                <td>{driverName}</td>
                <td>
                  <div
                    className={`${styles.toggleSwitch} ${
                      bus.status ? styles.active : styles.inactive
                    }`}
                    onClick={() => toggleBusStatus(bus.driverID, bus.status)}
                  >
                    <div className={styles.switchKnob}></div>
                  </div>
                  <span>{bus.status ? "Active" : "Inactive"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Status;
