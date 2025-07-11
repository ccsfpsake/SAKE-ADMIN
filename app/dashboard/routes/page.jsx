"use client";

import styles from "@/app/ui/dashboard/lines/lines.module.css";
import { db } from "@/app/lib/firebaseConfig";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import Search from "@/app/ui/dashboard/search/search";

const RoutePage = () => {
  const [lines, setLines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [newLine, setNewLine] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLines();
  }, []);

  const fetchLines = async () => {
    setLoading(true); 
    try {
      const snapshot = await getDocs(collection(db, "Lines"));
      const lineList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().Lines || doc.id,
      }));
      setLines(lineList);
    } catch (error) {
      toast.error("Failed to fetch routes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addLine = async () => {
    const trimmedLine = newLine.trim();
    if (!trimmedLine) {
      toast.error("Route name is required");
      return;
    }

    const exists = lines.some(
      (line) => line.name.toLowerCase() === trimmedLine.toLowerCase()
    );
    if (exists) {
      toast.error("This route already exists.");
      return;
    }

    try {
      await setDoc(doc(db, "Lines", trimmedLine), { Lines: trimmedLine });
      toast.success("Route successfully added to the database.");
      setNewLine("");
      setShowModal(false);
      fetchLines();
    } catch (error) {
      toast.error("Failed to add route");
      console.error(error);
    }
  };

  const confirmDelete = (line) => {
    setSelectedLine(line);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedLine) return;
    try {
      await deleteDoc(doc(db, "Lines", selectedLine.id));
      await deleteDoc(doc(db, "Bus Stops", selectedLine.id));
      toast.success("Route and related bus stop deleted");
      setShowDeleteModal(false);
      setSelectedLine(null);
      fetchLines();
    } catch (error) {
      toast.error("Failed to delete route");
      console.error(error);
    }
  };

  const filteredLines = lines.filter((line) =>
    line.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <ToastContainer theme="colored" position="top-right" autoClose={2500} />

      <div className={styles.actions}>
        <button className={styles.addButton} onClick={() => setShowModal(true)}>
          Add Route
        </button>
        <Search
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Route Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="2" className={styles.noData}>
                  Loading routes...
                </td>
              </tr>
            ) : filteredLines.length === 0 ? (
              <tr>
                <td colSpan="2" className={styles.noData}>
                  No route found.
                </td>
              </tr>
            ) : (
              filteredLines.map((line) => (
                <tr key={line.id}>
                  <td>{line.name}</td>
                  <td className={styles.buttons}>
                    <button
                      className={styles.delete}
                      onClick={() => confirmDelete(line)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Add New Route</h2>
            <input
              id="lineName"
              type="text"
              placeholder="Enter route name"
              value={newLine}
              onChange={(e) => setNewLine(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className={styles.addButton} onClick={addLine}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>
              <FaTrash />
            </div>
            <h3>Confirm Delete</h3>
            <p>
              Are you sure? Deleting this route will also remove the bus stop with
              the same ID. This action cannot be undone.
            </p>
            <div className={styles.modalButtons}>
              <button
                className={`${styles.button} ${styles.cancelButton}`}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.delete}`}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutePage;
