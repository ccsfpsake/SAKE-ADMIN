"use client";

import styles from "@/app/ui/dashboard/drivers/drivers.module.css";
import Pagination from "@/app/ui/dashboard/pagination/pagination";
import Search from "@/app/ui/dashboard/search/search";
import Image from "next/image";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";

const DriversdashboardPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [driversPerPage] = useState(10); 

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Drivers"));
        const driversList = [];

        for (const doc of querySnapshot.docs) {
          const driverData = doc.data();
          const driverId = doc.id;

          if (driverData.imageUrl) {
            const storage = getStorage();
            const imageRef = ref(storage, driverData.imageUrl);
            try {
              const imageUrl = await getDownloadURL(imageRef);
              driverData.imageUrl = imageUrl; 
            } catch (error) {
              console.error("Error fetching image URL:", error);
              driverData.imageUrl = "/noavatar.png"; 
            }
          }

          driversList.push({ id: driverId, ...driverData });
        }

        setDrivers(driversList);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      }
    };

    fetchDrivers();
  }, []);

  const capitalizeName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const capitalizeAddressPart = (part) => {
    if (!part) return "";
    return part
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const renderAddress = (driver) => {
    const parts = [driver.houseno, driver.Barangay, driver.City, driver.Province].filter(
      (part) => part
    );
    return parts.length > 0
      ? parts.map((part) => capitalizeAddressPart(part)).join(", ")
      : "Address not available";
  };

  const filteredDrivers = drivers.filter((driver) => {
    return (
      (driver.FName && driver.FName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.LName && driver.LName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.Email && driver.Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.Contact && driver.Contact.includes(searchTerm)) ||
      (driver.driverID && driver.driverID.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const indexOfLastDriver = currentPage * driversPerPage;
  const indexOfFirstDriver = indexOfLastDriver - driversPerPage;
  const currentDrivers = filteredDrivers.slice(indexOfFirstDriver, indexOfLastDriver);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <Search placeholder="Search for a driver.." value={searchTerm} onChange={handleSearch} />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Driver ID</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          {currentDrivers.length > 0 ? (
            currentDrivers.map((driver) => (
              <tr key={driver.id}>
                <td>
                  <div className={styles.user}>
                    <Image
                      src={driver.imageUrl || "/noavatar.png"}
                      alt={`${driver.FName} ${driver.LName}'s Avatar`}
                      width={40}
                      height={40}
                      className={styles.userImage}
                    />
                    <span>
                      {capitalizeName(driver.LName)}, {capitalizeName(driver.FName)}{" "}
                      {driver.MName && `${capitalizeName(driver.MName.charAt(0))}.`}
                    </span>
                  </div>
                </td>
                <td>{driver.driverID || "N/A"}</td>
                <td>{driver.Email || "N/A"}</td>
                <td>{driver.Contact || "N/A"}</td>
                <td>{renderAddress(driver)}</td>
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

      <Pagination
        totalItems={filteredDrivers.length}
        itemsPerPage={driversPerPage}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
};

export default DriversdashboardPage;
