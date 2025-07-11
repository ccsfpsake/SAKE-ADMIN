"use client";

import styles from "@/app/ui/dashboard/operator/operator.module.css";
import Pagination from "@/app/ui/dashboard/pagination/pagination";
import Search from "@/app/ui/dashboard/search/search";
import Image from "next/image";
import { deleteDoc, doc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaExclamationCircle } from "react-icons/fa";

const sendEmail = async ({ to, firstName, status, type }) => {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, firstName, status, type }),
    });

    if (!response.ok) throw new Error("Email sending failed");

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const OperatorPage = () => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState(null);
  const [statusModal, setStatusModal] = useState({ show: false, operatorId: null, newStatus: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const updateStatus = async (operatorId, newStatus) => {
    try {
      const operatorRef = doc(db, "Operator", operatorId);
      await updateDoc(operatorRef, { Status: newStatus });

      setOperators((prevOperators) =>
        prevOperators.map((operator) =>
          operator.id === operatorId ? { ...operator, Status: newStatus } : operator
        )
      );

      const updatedOperator = operators.find((operator) => operator.id === operatorId);
      const operatorFullName = updatedOperator
        ? `${updatedOperator.FName} ${updatedOperator.LName}`
        : "Operator";

      await sendEmail({
        to: updatedOperator.Email,
        firstName: updatedOperator.FName,
        status: newStatus,
        type: "status_update",
      });

      toast.success(`Status for ${operatorFullName} updated to ${newStatus}`, {
        theme: "colored",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status. Please try again.", {
        theme: "colored",
      });
    }
  };

  const handleDelete = async () => {
    if (selectedOperatorId) {
      try {
        await deleteDoc(doc(db, "Operator", selectedOperatorId));
        setOperators((prevOperators) =>
          prevOperators.filter((operator) => operator.id !== selectedOperatorId)
        );
        setShowModal(false);
        setSelectedOperatorId(null);
        toast.success("Operator deleted successfully.", { theme: "colored" });
      } catch (error) {
        console.error("Error deleting operator:", error);
        toast.error("Failed to delete operator.", { theme: "colored" });
      }
    }
  };

  const filteredOperators = operators
    .filter((operator) => {
      if (statusFilter !== "All" && operator.Status !== statusFilter) return false;
      return (
        operator.operatorID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.companyID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.FName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.LName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.Status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operator.Contact?.includes(searchTerm)
      );
    })
    .sort((a, b) => (a.LName || "").localeCompare(b.LName || ""));

  const indexOfLastOperator = currentPage * itemsPerPage;
  const indexOfFirstOperator = indexOfLastOperator - itemsPerPage;
  const currentOperators = filteredOperators.slice(indexOfFirstOperator, indexOfLastOperator);
  const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>
              <FaTrash />
            </div>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this account? This action cannot be undone.</p>
            <div className={styles.modalButtons}>
              <button className={`${styles.button} ${styles.cancel}`} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={`${styles.button} ${styles.delete}`} onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusModal.show && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <FaExclamationCircle className={styles.modalicon} />
            <h3>Confirm Status Change</h3>
            <p>
              Are you sure you want to change this operator’s status to{" "}
              <strong>{statusModal.newStatus}</strong>?
            </p>
            <div className={styles.modalButtons}>
              <button
                className={`${styles.button} ${styles.cancel}`}
                onClick={() => setStatusModal({ show: false, operatorId: null, newStatus: null })}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.update}`}
                onClick={() => {
                  updateStatus(statusModal.operatorId, statusModal.newStatus);
                  setStatusModal({ show: false, operatorId: null, newStatus: null });
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search */}
      <div className={styles.top} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
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
        <Search
          className={styles.search}
          placeholder="Search.."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Operator Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Operator ID</th>
              <th>Company ID</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className={styles.noData}>
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
                        {operator.LName}, {operator.FName} {operator.MName && `${operator.MName.charAt(0)}.`}
                      </span>
                    </div>
                  </td>
                  <td>{operator.operatorID || "N/A"}</td>
                  <td>{operator.companyID || "N/A"}</td>
                  <td>{operator.Email || "N/A"}</td>
                  <td>{operator.Contact || "N/A"}</td>
                  <td>
                    <select
                      value={operator.Status || "Pending"}
                      onChange={(e) =>
                        setStatusModal({
                          show: true,
                          operatorId: operator.id,
                          newStatus: e.target.value,
                        })
                      }
                      className={styles.statusDropdown}
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
                      <option value="Pending" style={{ color: "orange" }}>Pending</option>
                      <option value="Verified" style={{ color: "green" }}>Verified</option>
                      <option value="Suspended" style={{ color: "red" }}>Suspended</option>
                    </select>
                  </td>
                  <td>
                    <div className={styles.buttons}>
                      <button
                        className={`${styles.button} ${styles.delete}`}
                        onClick={() => {
                          setSelectedOperatorId(operator.id);
                          setShowModal(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={styles.noData}>
                  No data found or saved.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default OperatorPage;
