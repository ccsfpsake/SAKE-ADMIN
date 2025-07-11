"use client";

import { useEffect, useState } from "react";
import styles from "../ui/dashboard/dashboard.module.css";

import Card from "../ui/dashboard/card/card";
import Card2 from "../ui/dashboard/card/card2";
import Card3 from "../ui/dashboard/card/card3";
import Card4 from "../ui/dashboard/card/card4";
import Dashboardroute from "./routes/dashboardroute/page";
import Usergraph from "./graph/users/page";
import OperatorStatusSummary from "./graph/OperatorStatusSummary/page";

const Dashboard = () => {
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    if (!isLoggedIn) {
      window.location.href = "/";
    } else {
      setIsAllowed(true);
    }
  }, []);

  // 🔒 Don't render anything while verifying
  if (!isAllowed) return null;

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.cards}>
          <Card4 />
          <Card3 />
          <Card2 />
          <Card />
        </div>

        <div className={styles.operatorRow}>
          <Dashboardroute />
          <OperatorStatusSummary />
        </div>

        <div className={styles.operatorRow}>
          <Usergraph />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
