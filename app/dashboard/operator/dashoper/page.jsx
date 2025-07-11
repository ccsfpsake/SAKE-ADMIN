"use client";

import styles from "@/app/ui/dashboard/drivers/driversdashboard.module.css";
import Pagination from "@/app/ui/dashboard/pagination/pagination";
import Image from "next/image";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OperatorPage = () => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const operatorsPerPage = 5;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Operator"), (snapshot) => {
      const operatorsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOperators(operatorsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOperators = operators
    .filter((operator) => {
      if (statusFilter !== "All" && operator.Status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => (a.LName || "").localeCompare(b.LName || ""));

  const indexOfLastOperator = currentPage * operatorsPerPage;
  const indexOfFirstOperator = indexOfLastOperator - operatorsPerPage;
  const currentOperators = filteredOperators.slice(indexOfFirstOperator, indexOfLastOperator);

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      <div className={styles.top} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <h1 className={styles.semititle}>ROUTES</h1>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.statusDropdown}
          style={{ fontWeight: "bold", padding: "0.3rem 0.5rem" }}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Verified">Verified</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="2" className={styles.noData}>
                  Loading operators...
                </td>
              </tr>
            ) : currentOperators.length > 0 ? (
              currentOperators.map((operator) => (
                <tr key={operator.id}>
                  <td>
                    <div className={styles.user}>
                      <Image
                        src={operator.Avatar || "/noavatar.png"}
                        alt={`${operator.FName} ${operator.LName}'s Avatar`}
                        width={40}
                        height={40}
                        className={styles.userImage}
                      />
                      <span>
                        {operator.LName}, {operator.FName}{" "}
                        {operator.MName && `${operator.MName.charAt(0)}.`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        color:
                          operator.Status === "Verified"
                            ? "green"
                            : operator.Status === "Suspended"
                            ? "red"
                            : "orange",
                        fontWeight: "bold",
                      }}
                    >
                      {operator.Status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className={styles.noData}>
                  No data found or saved.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredOperators.length / operatorsPerPage)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default OperatorPage;
