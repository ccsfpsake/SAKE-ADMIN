"use client";

import styles from "@/app/ui/dashboard/stops/dashstop.module.css";
import Pagination from "@/app/ui/dashboard/pagination/pagination";
import Search from "@/app/ui/dashboard/search/search";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";

const Dashboardstop = () => {
  const [busStops, setBusStops] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const busStopsPerPage = 10;

  const capitalizeText = (text) => {
    if (!text) return "N/A";
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    const fetchBusStops = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Bus Stops"));
        const busStopsList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "",
            locID: data.locID || "",
          };
        });
        setBusStops(busStopsList);
      } catch (error) {
        console.error("Error fetching bus stops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusStops();
  }, []);

  const filteredBusStops = busStops
    .filter((busStop) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (busStop.name && busStop.name.toLowerCase().includes(searchLower)) ||
        (busStop.locID && busStop.locID.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const locID_a = parseInt(a.locID.replace(/\D/g, ""));
      const locID_b = parseInt(b.locID.replace(/\D/g, ""));
      return locID_a - locID_b;
    });

  const indexOfLastBusStop = currentPage * busStopsPerPage;
  const indexOfFirstBusStop = indexOfLastBusStop - busStopsPerPage;
  const currentBusStops = filteredBusStops.slice(indexOfFirstBusStop, indexOfLastBusStop);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <h1 className={styles.semititle}>STOPS</h1>
        <Search
          placeholder="Search.."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className={styles["table-wrapper"]}>
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Location ID</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {currentBusStops.length > 0 ? (
                currentBusStops.map((busStop) => (
                  <tr key={busStop.id}>
                    <td>{capitalizeText(busStop.locID)}</td>
                    <td>{capitalizeText(busStop.name)}</td>
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
        )}
      </div>

      {!loading && filteredBusStops.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredBusStops.length}
          itemsPerPage={busStopsPerPage}
          paginate={paginate}
        />
      )}
    </div>
  );
};

export default Dashboardstop;



