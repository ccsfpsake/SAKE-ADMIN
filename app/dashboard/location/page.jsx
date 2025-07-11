/* global Set */

"use client";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
  TrafficLayer,
} from "@react-google-maps/api";
import {
  collection,
  collectionGroup,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import styles from "@/app/ui/dashboard/location/location.module.css";
import ChatBox from "./chatbox/ChatBox";

const containerStyle = { width: "100%", height: "50vh" };
const center = { lat: 15.05, lng: 120.66 };
const BUS_ICON_SIZE = 45;

export default function AdminBusLocationPage() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const [busLocations, setBusLocations] = useState([]);
  const [busStops, setBusStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [, setMap] = useState(null);
  const [zoom] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState({});
  const [allCompanyIDs, setAllCompanyIDs] = useState([]);

  const busRefs = useRef({});

  const mapOptions = useMemo(
    () => ({
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
        { featureType: "administrative", stylers: [{ visibility: "off" }] },
        { featureType: "landscape", stylers: [{ color: "#f5f5f5" }] },
        { featureType: "water", stylers: [{ color: "#d6e9f8" }] },
      ],
    }),
    []
  );

  useEffect(() => {
    if (typeof window !== "undefined" && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collectionGroup(db, "messages"), (snapshot) => {
      const unreadMap = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const company = doc.ref.parent.parent?.id;
        if (!data.seen && data.senderRole !== "operator" && company) {
          unreadMap[company] = true;
        }
      });
      setHasUnreadMessages(unreadMap);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (expandedCompany) {
      const q = query(
        collection(db, "Chat", expandedCompany, "messages"),
        orderBy("createdAt", "asc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.seen && data.senderRole !== "operator") {
            updateDoc(doc(db, "Chat", expandedCompany, "messages", docSnap.id), {
              seen: true,
            });
          }
        });
      });
      return () => unsubscribe();
    }
  }, [expandedCompany]);

  const fetchDriversStatus = async () => {
    const snapshot = await getDocs(collection(db, "Drivers"));
    const map = {};
    const companySet = new Set(); // ✅ Valid use of Set
    snapshot.forEach((doc) => {
      const d = doc.data();
      if (d.driverID) {
        map[d.driverID] = {
          companyID: d.companyID,
          status: d.status || "inactive",
          imageUrl: d.imageUrl || null,
          LName: d.LName || "",
          FName: d.FName || "",
          MName: d.MName || "",
        };
        if (d.companyID) companySet.add(d.companyID);
      }
    });
    setAllCompanyIDs(Array.from(companySet));
    return map;
  };

  const fetchRoutePlateNumbers = async () => {
    const snapshot = await getDocs(collection(db, "Route"));
    const map = {};
    snapshot.forEach((doc) => {
      const d = doc.data();
      if (d.driverID) {
        map[d.driverID] = {
          plateNumber: d.plateNumber,
          route: d.route || null,
        };
      }
    });
    return map;
  };

  useEffect(() => {
    let unsubBuses = null;
    let unsubStops = null;

    const loadData = async () => {
      const driverMap = await fetchDriversStatus();
      const routeMap = await fetchRoutePlateNumbers();

      unsubBuses = onSnapshot(collection(db, "BusLocation"), (snap) => {
        const buses = snap.docs.map((doc) => {
          const d = doc.data();
          const route = routeMap[d.driverID] || {};
          const driver = driverMap[d.driverID] || {};
          return {
            id: doc.id,
            ...d,
            plateNumber: route.plateNumber || null,
            route: route.route || null,
            companyID: driver.companyID || null,
            status: driver.status || "inactive",
            imageUrl: driver.imageUrl || null,
            LName: driver.LName || "",
            FName: driver.FName || "",
            MName: driver.MName || "",
          };
        });
        setBusLocations(buses.filter((b) => b.status === "active"));
      });

      unsubStops = onSnapshot(collectionGroup(db, "Stops"), (snap) => {
        const stops = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            locID: data.locID,
            geo: data.geo,
            parentDocId: doc.ref.parent.parent?.id || "unknown",
          };
        });
        setBusStops(stops);
      });
    };

    loadData();
    return () => {
      if (unsubBuses) unsubBuses();
      if (unsubStops) unsubStops();
    };
  }, []);

  const getIdleMinutes = (bus) => {
    if (bus.timestamp?.toDate) {
      const diff = Date.now() - bus.timestamp.toDate().getTime();
      return Math.floor(diff / 60000);
    }
    return 0;
  };

  const getIdleTime = useCallback((bus) => {
    const mins = getIdleMinutes(bus);
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `Not moved for ${h} hour${h > 1 ? "s" : ""}${m > 0 ? ` ${m} min` : ""}`;
    }
    return mins > 0 ? `Not moved for ${mins} min` : "Moving";
  }, []);

  const CCSFP_C3_LAT = 15.06137;
  const CCSFP_C3_LNG = 120.643928;
  const isAtCCSFP_C3 = (lat, lng) =>
    Math.abs(lat - CCSFP_C3_LAT) < 0.0005 && Math.abs(lng - CCSFP_C3_LNG) < 0.0005;

  const idleBusesByCompany = useMemo(() => {
    const grouped = {};
    busLocations.forEach((bus) => {
      const lat = bus.currentLocation?.latitude;
      const lng = bus.currentLocation?.longitude;
      const mins = getIdleMinutes(bus);

      if (lat && lng) {
        const atCCSFP = isAtCCSFP_C3(lat, lng);
        const threshold = atCCSFP ? 16 : 11;

        if (mins >= threshold) {
          let label = getIdleTime(bus);
          if (atCCSFP) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            label = `Not moved for ${h > 0 ? `${h} hour${h > 1 ? "s" : ""} ` : ""}${m} min (CCSFP-C3)`;
          }

          if (!grouped[bus.companyID]) grouped[bus.companyID] = [];
          grouped[bus.companyID].push({ ...bus, idleLabel: label });
        }
      }
    });
    return grouped;
  }, [busLocations, getIdleTime]);

  const filteredBuses = useMemo(() => {
    return busLocations.filter(
      (bus) =>
        bus.driverID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bus.companyID?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [busLocations, searchTerm]);

  const handleBusClick = useCallback((bus) => setSelectedBus(bus), []);
  const handleStopClick = useCallback((stop) => setSelectedStop(stop), []);

  if (!isLoaded) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mapContainer}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          onLoad={setMap}
          options={mapOptions}
        >
          <TrafficLayer />
          {filteredBuses.map((bus) => {
            const pos = {
              lat: bus.currentLocation?.latitude ?? center.lat,
              lng: bus.currentLocation?.longitude ?? center.lng,
            };
            busRefs.current[bus.id] = pos;

            return (
              <Marker
                key={bus.id}
                position={pos}
                icon={{
                  url: "/puj.png",
                  scaledSize: new window.google.maps.Size(BUS_ICON_SIZE, BUS_ICON_SIZE),
                  anchor: new window.google.maps.Point(BUS_ICON_SIZE / 2, BUS_ICON_SIZE / 2),
                }}
                zIndex={2}
                onClick={() => handleBusClick(bus)}
              />
            );
          })}

          {zoom >= 15 &&
            busStops.map((stop) => (
              <Marker
                key={stop.id}
                position={{ lat: stop.geo.latitude, lng: stop.geo.longitude }}
                icon={{ url: "/stop-icon.png", scaledSize: new window.google.maps.Size(25, 25) }}
                zIndex={1}
                onClick={() => handleStopClick(stop)}
              />
            ))}

          {selectedBus && (
            <InfoWindow
              position={busRefs.current[selectedBus.id]}
              onCloseClick={() => setSelectedBus(null)}
            >
              <div>
                <strong>Driver ID:</strong> {selectedBus.driverID} <br />
                <strong>Plate Number:</strong> {selectedBus.plateNumber} <br />
                <strong>Route:</strong> {selectedBus.route} <br />
                <strong>Company:</strong> {selectedBus.companyID} <br />
                <strong style={{ color: "blue" }}>{getIdleTime(selectedBus)}</strong>
              </div>
            </InfoWindow>
          )}

          {selectedStop && (
            <InfoWindow
              position={{ lat: selectedStop.geo.latitude, lng: selectedStop.geo.longitude }}
              onCloseClick={() => setSelectedStop(null)}
            >
              <div>
                <strong>Location ID:</strong> {selectedStop.locID} <br />
                <strong>Stop Name:</strong> {selectedStop.name}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <div className={styles.idleContainer}>
        <h3>Idle Time Report</h3>

        {expandedCompany ? (
          <div className={styles.idleCard}>
            <button
              onClick={() => setExpandedCompany(null)}
              className={styles.idleCardButtons}
            >
              {expandedCompany} ({(idleBusesByCompany[expandedCompany] || []).length})
            </button>

            {(idleBusesByCompany[expandedCompany] || []).length > 0 ? (
              <div className={styles.idleTableWrapper}>
                <table className={styles.idleTable}>
                  <thead>
                    <tr>
                      <th>Company ID</th>
                      <th>Driver ID</th>
                      <th>Plate Number</th>
                      <th>Status</th>
                      <th>Idle Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {idleBusesByCompany[expandedCompany].map((bus) => (
                      <tr key={bus.id}>
                        <td>{bus.companyID}</td>
                        <td>{bus.driverID}</td>
                        <td>{bus.plateNumber}</td>
                        <td>{bus.status}</td>
                        <td>{bus.idleLabel || getIdleTime(bus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={styles.noData}>
                No drivers have been idle report for this company.
              </p>
            )}

            <div className={styles.ChatBox}>
              <ChatBox companyID={expandedCompany} />
            </div>
          </div>
        ) : (
          allCompanyIDs.map((companyID) => {
            const buses = idleBusesByCompany[companyID] || [];
            return (
              <div key={companyID} className={styles.idleCard}>
                <button
                  onClick={() => setExpandedCompany(companyID)}
                  className={styles.idleCardButtons}
                >
                  {companyID} ({buses.length})
                  {hasUnreadMessages[companyID] && (
                    <span className={styles.notificationDot} />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
