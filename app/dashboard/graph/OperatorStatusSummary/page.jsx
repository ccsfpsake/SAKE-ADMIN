"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import styles from "./operatorStatusSummary.module.css";

const OperatorStatusSummary = () => {
  const [counts, setCounts] = useState({
    Pending: 0,
    Verified: 0,
    Suspended: 0,
    Total: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Operator"), (snapshot) => {
      const statusCounts = {
        Pending: 0,
        Verified: 0,
        Suspended: 0,
      };

      snapshot.forEach((doc) => {
        const status = doc.data().Status;
        if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
          statusCounts[status]++;
        }
      });

      setCounts({
        ...statusCounts,
        Total: snapshot.size,
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <section className={styles.wrapper} role="status" aria-live="polite">
      <h3 className={styles.heading}>Operator Status Summary</h3>

      <div className={styles.container}>
        {loading ? (
          <p className={styles.loading}>Loading operator summary...</p>
        ) : (
          <>
            <div className={`${styles.card} ${styles.pending}`}>
              <h4>⏳ Pending</h4>
              <p>{counts.Pending}</p>
            </div>
            <div className={`${styles.card} ${styles.verified}`}>
              <h4>✅ Verified</h4>
              <p>{counts.Verified}</p>
            </div>
            <div className={`${styles.card} ${styles.suspended}`}>
              <h4>⛔ Suspended</h4>
              <p>{counts.Suspended}</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default OperatorStatusSummary;
