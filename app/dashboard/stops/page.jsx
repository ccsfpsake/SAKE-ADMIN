"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";
import BusStopsPage from "./BusStopsPage";
import styles from "@/app/ui/dashboard/stops/index.module.css";

const StopsIndexPage = () => {
  const [lines, setLines] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Lines"), (snapshot) => {
      const linesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLines(linesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.containercard}>
        {!selectedLineId ? (
          <>
            <h2 className={styles.h2}>Select a Route</h2>
            <div className={styles.cardGrid}>
              {loading ? (
                <div className={styles.noData}>Loading routes...</div>
              ) : lines.length === 0 ? (
                <div className={styles.noData}>No route found.</div>
              ) : (
                lines.map((line) => (
                  <div
                    key={line.id}
                    className={styles.lineCard}
                    onClick={() => setSelectedLineId(line.id)}
                  >
                    <h3 className={styles.h3}>{line.name || line.id}</h3>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className={styles.backButtonWrapper}>
              <button
                className={styles.backButton}
                onClick={() => setSelectedLineId(null)}
              >
                ← Back to Routes
              </button>
            </div>
            <BusStopsPage lineId={selectedLineId} />
          </>
        )}
      </div>
    </div>
  );
};

export default StopsIndexPage;
