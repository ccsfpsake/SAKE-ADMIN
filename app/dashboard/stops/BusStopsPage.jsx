"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebaseConfig";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { GeoPoint } from "firebase/firestore";
import { FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/app/ui/dashboard/stops/stops.module.css";
import Pagination from "@/app/ui/dashboard/pagination/pagination";
import Search from "@/app/ui/dashboard/search/search";

const BusStopsPage = ({ lineId }) => {
  const [busStops, setBusStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newStop, setNewStop] = useState({
    name: "",
    locID: "",
    latitude: "",
    longitude: "",
  });

  const [editStop, setEditStop] = useState(null);
  const [selectedBusStop, setSelectedBusStop] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredStops = busStops.filter((stop) =>
    `${stop.locID} ${stop.name} ${stop.geo?.latitude ?? ""} ${stop.geo?.longitude ?? ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStops = filteredStops.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStops.length / itemsPerPage);

  useEffect(() => {
    if (!lineId) return;

    const stopsRef = collection(db, "Bus Stops", lineId, "Stops");

    const unsubscribe = onSnapshot(stopsRef, (snapshot) => {
   const stops = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      stops.sort((a, b) => {
      const numA = parseInt(a.locID.replace(/[^\d]/g, ""), 10);
      const numB = parseInt(b.locID.replace(/[^\d]/g, ""), 10);
        return numA - numB;
      });
      setBusStops(stops);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [lineId]);

  const handleAddStop = async () => {
    const { locID, name, latitude, longitude } = newStop;

    if (!locID.trim() || !name.trim() || !latitude.trim() || !longitude.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Latitude and Longitude must be valid numbers.");
      return;
    }

    const existingStop = busStops.find((stop) => stop.locID === locID);
    if (existingStop) {
      toast.error(`Location ID '${locID}' already exists. Please enter a unique one.`);
      return;
    }

    try {
      const stopRef = doc(db, "Bus Stops", lineId, "Stops", locID);
      await setDoc(stopRef, {
        locID,
        name,
        geo: new GeoPoint(latNum, lngNum),
      });

      toast.success("Bus stop added successfully.");
      setNewStop({ name: "", locID: "", latitude: "", longitude: "" });
      setShowAddModal(false);
    } catch (error) {
      toast.error("Failed to add stop.");
    }
  };

  const confirmDeleteStop = (stop) => {
    setSelectedBusStop(stop);
    setShowDeleteModal(true);
  };

  const handleDeleteBusStop = async () => {
    if (!selectedBusStop) return;

    try {
      await deleteDoc(doc(db, "Bus Stops", lineId, "Stops", selectedBusStop.locID));
      toast.success("Stop deleted successfully.");
      setShowDeleteModal(false);
      setSelectedBusStop(null);
    } catch (error) {
      toast.error("Failed to delete stop.");
    }
  };

  const openEditModal = (stop) => {
    setEditStop({
      locID: stop.locID,
      name: stop.name,
      latitude: stop.geo?.latitude?.toString() ?? "",
      longitude: stop.geo?.longitude?.toString() ?? "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const { locID, name, latitude, longitude } = editStop;

    const nameStr = String(name).trim();
    const latStr = String(latitude).trim();
    const lngStr = String(longitude).trim();

    if (!nameStr || !latStr || !lngStr) {
      toast.error("Please fill in all fields.");
      return;
    }

    const latNum = parseFloat(latStr);
    const lngNum = parseFloat(lngStr);

    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error("Latitude and Longitude must be valid numbers.");
      return;
    }

    const original = busStops.find((stop) => stop.locID === locID);

    const originalName = original?.name ?? "";
    const originalLat = original?.geo?.latitude ?? null;
    const originalLng = original?.geo?.longitude ?? null;

    if (
      nameStr === originalName &&
      latNum === originalLat &&
      lngNum === originalLng
    ) {
      toast.info("No changes made.");
      return;
    }

    try {
      const stopRef = doc(db, "Bus Stops", lineId, "Stops", locID);
      await setDoc(stopRef, {
        locID,
        name: nameStr,
        geo: new GeoPoint(latNum, lngNum),
      });

      toast.success("Stop updated successfully.");
      setEditStop(null);
      setShowEditModal(false);
    } catch (error) {
      toast.error("Failed to update stop.");
    }
  };

  const toggleAddModal = (show) => {
    setShowAddModal(show);
    setNewStop({ name: "", locID: "", latitude: "", longitude: "" });
  };

  return (
    <div className={styles.busStopContainer}>
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      <div className={styles.headerRow}>
        <button className={styles.addButton} onClick={() => toggleAddModal(true)}>
          Add Stop
        </button>
        <Search
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Add New Stop</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddStop();
              }}
            >
              <input
                type="text"
                placeholder="locID"
                title="Please enter a unique stop ID"
                value={newStop.locID}
                onChange={(e) => setNewStop({ ...newStop, locID: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Name"
                value={newStop.name}
                onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                required
              />
              <input
                type="text"
                step="any"
                placeholder="Latitude"
                value={newStop.latitude}
                onChange={(e) => setNewStop({ ...newStop, latitude: e.target.value })}
                required
              />
              <input
                type="text"
                step="any"
                placeholder="Longitude"
                value={newStop.longitude}
                onChange={(e) => setNewStop({ ...newStop, longitude: e.target.value })}
                required
              />
              <div className={styles.modalActions}>
                <button type="button" className={`${styles.button} ${styles.cancelButton}`} onClick={() => toggleAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.button} ${styles.saveButton}`}>
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editStop && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContents}>
            <h3>Edit Stop</h3>
            <label>
              <p>Location ID</p>
              <input type="text" value={editStop.locID} disabled />
            </label>
            <label>
              <p>Name</p>
              <input
                type="text"
                value={editStop.name}
                onChange={(e) => setEditStop({ ...editStop, name: e.target.value })}
              />
            </label>
            <label>
              <p>Latitude</p>
              <input
                type="text"
                value={editStop.latitude}
                onChange={(e) => setEditStop({ ...editStop, latitude: e.target.value })}
              />
            </label>
            <label>
              <p>Longitude</p>
              <input
                type="text"
                value={editStop.longitude}
                onChange={(e) => setEditStop({ ...editStop, longitude: e.target.value })}
              />
            </label>
            <div className={styles.modalActions}>
              <button className={`${styles.button} ${styles.cancelButton}`} onClick={() => { setShowEditModal(false); setEditStop(null); }}>
                Cancel
              </button>
              <button className={`${styles.button} ${styles.saveButton}`} onClick={handleSaveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedBusStop && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}><FaTrash /></div>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this stop? This action cannot be undone.</p>
            <div className={styles.modalButtons}>
              <button className={`${styles.button} ${styles.cancelButton}`} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className={`${styles.button} ${styles.delete}`} onClick={handleDeleteBusStop}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className={styles.noData}>Loading stops...</p>
      ) : (
        <div className={styles["table-wrapper"]}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Location ID</th>
                <th>Name</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStops.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.noData}>No data found.</td>
                </tr>
              ) : (
                currentStops.map((stop) => (
                  <tr key={stop.id}>
                    <td>{stop.locID}</td>
                    <td>{stop.name}</td>
                    <td>{stop.geo?.latitude ?? "N/A"}</td>
                    <td>{stop.geo?.longitude ?? "N/A"}</td>
                    <td>
                      <div className={styles.buttons}>
                        <button className={`${styles.button} ${styles.edit}`} onClick={() => openEditModal(stop)}>Edit</button>
                        <button className={`${styles.button} ${styles.delete}`} onClick={() => confirmDeleteStop(stop)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default BusStopsPage;
