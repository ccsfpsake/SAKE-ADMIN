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

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isLoggingIn = sessionStorage.getItem("isLoggingIn");
    if (isLoggingIn) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        sessionStorage.removeItem("isLoggingIn");
        setIsLoading(false);
      }, 1000); // Simulated delay. Adjust if needed.
      return () => clearTimeout(timer);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={styles.spinnerContainer}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

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
