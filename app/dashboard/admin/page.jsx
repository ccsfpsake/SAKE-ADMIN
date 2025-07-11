"use client";

import styles from "@/app/ui/dashboard/drivers/drivers.module.css";
import Pagination from "@/app/ui/dashboard/pagination/pagination";
import Search from "@/app/ui/dashboard/search/search";
import Image from "next/image";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTrash } from "react-icons/fa";

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

const AdminPage = () => {
  const [admins, setAdmins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const adminsPerPage = 10;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "Admin"), (snapshot) => {
      const adminsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAdmins(adminsList);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (adminId, newStatus) => {
    try {
      const adminRef = doc(db, "Admin", adminId);
      await updateDoc(adminRef, { Status: newStatus });

      setAdmins((prevAdmins) =>
        prevAdmins.map((admin) =>
          admin.id === adminId ? { ...admin, Status: newStatus } : admin
        )
      );

      const updatedAdmin = admins.find((admin) => admin.id === adminId);
      const operatorFullName = updatedAdmin
        ? `${updatedAdmin.FName} ${updatedAdmin.LName}`
        : "Admin";

      // Send Email Notification
      await sendEmail({
        to: updatedAdmin.Email,
        firstName: updatedAdmin.FName,
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
    if (selectedAdminId) {
      try {
        await deleteDoc(doc(db, "Admin", selectedAdminId));
        setAdmins((prevAdmins) =>
          prevAdmins.filter((admin) => admin.id !== selectedAdminId)
        );
        setShowModal(false);
        setSelectedAdminId(null);
        toast.success("Admin deleted successfully.", { theme: "colored" });
      } catch (error) {
        console.error("Error deleting admin:", error);
        toast.error("Failed to delete admin.", { theme: "colored" });
      }
    }
  };

  const filteredAdmins = admins
    .filter(
      (admin) =>
        admin.adminID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.FName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.FName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.LName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.Email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.Status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.Contact?.includes(searchTerm)
    )
    .sort((a, b) => (a.LName || "").localeCompare(b.LName || ""));

  const indexOfLastAdmin = currentPage * adminsPerPage;
  const indexOfFirstAdmin = indexOfLastAdmin - adminsPerPage;
  const currentAdmins = filteredAdmins.slice(indexOfFirstAdmin, indexOfLastAdmin);

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
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

      <div className={styles.top}>
        <Search
          className={styles.search}
          placeholder="Search.."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
            <th>Name</th>
              <th>ID No.</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentAdmins.length > 0 ? (
              currentAdmins.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <div className={styles.user}>
                      <Image
                        src={admin.Avatar || "/noavatar.png"} 
                        alt={`${admin.FName} ${admin.LName}'s Avatar`}
                        width={40}
                        height={40}
                        className={styles.userImage}
                      />
                      <span>
                        {admin.LName}, {admin.FName} {admin.MName && `${admin.MName.charAt(0)}.`}
                      </span>
                    </div>
                  </td>
                  <td>{admin.adminID || "N/A"}</td>
                  <td>{admin.Email || "N/A"}</td>
                  <td>{admin.Contact || "N/A"}</td>
                    <td>
                      <select
                        value={admin.Status || "Pending"}
                        onChange={(e) => updateStatus(admin.id, e.target.value)}
                        className={styles.statusDropdown}
                        style={{
                          color:
                            admin.Status === "Verified"
                              ? "green"
                              : admin.Status === "Suspended"
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
                          setSelectedAdminId(admin.id);
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
                <td colSpan="5" className={styles.noData}>
                No data found or saved.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        totalItems={filteredAdmins.length}
        itemsPerPage={adminsPerPage}
        paginate={(pageNumber) => setCurrentPage(pageNumber)}
        currentPage={currentPage}
      />
    </div>
  );
};

export default AdminPage;
