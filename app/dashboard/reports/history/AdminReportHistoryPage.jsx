"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import moment from "moment";
import styles from "./history.module.css";
import { FaArrowLeftLong, FaDownload } from "react-icons/fa6";
import { FaTimes } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import Search from "@/app/ui/dashboard/search/search";

const AdminReportHistoryPage = () => {
  const searchParams = useSearchParams();
  const companyIDParam = searchParams.get("companyID");

  const [companyID, setCompanyID] = useState(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [visibleTimestamps, setVisibleTimestamps] = useState([]);
  const [modalSrc, setModalSrc] = useState(null);
  const [modalFileName, setModalFileName] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companySearch, setCompanySearch] = useState("");

  const chatEndRef = useRef(null);
  const currentMonth = moment().month();
  const currentYear = moment().year();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const months = moment.months();
  const years = [2023, 2024, 2025, 2026];

  useEffect(() => {
    if (companyIDParam) {
      setCompanyID(companyIDParam);
    }
  }, [companyIDParam]);

  useEffect(() => {
    if (!companyID) return;
    const q = query(
      collection(db, "busReports"),
      where("companyID", "==", companyID),
      where("status", "==", "settled")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(all);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyID]);

  useEffect(() => {
    const filtered = reports.filter((report) => {
      const date = report.createdAt?.toDate();
      return (
        date &&
        moment(date).month() === parseInt(selectedMonth) &&
        moment(date).year() === parseInt(selectedYear)
      );
    });

    const searched = filtered.filter((report) => {
      const search = companySearch.toLowerCase();
      return (
        report.busPlateNumber?.toLowerCase().includes(search) ||
        report.reportType?.toLowerCase().includes(search) ||
        report.description?.toLowerCase().includes(search)
      );
    });

    setFilteredReports(searched);
  }, [reports, selectedMonth, selectedYear, companySearch]);

  useEffect(() => {
    if (!selectedReport) return;

    const q = query(
      collection(db, "busReports", selectedReport.id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedReport]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDate = (ts) => moment(ts?.toDate()).format("MMMM D, YYYY");
  const formatTime = (ts) => moment(ts?.toDate()).format("h:mm A");
  const shouldShowDate = (current, previous) => {
    if (!previous) return true;
    return (
      moment(current?.toDate()).format("YYYY-MM-DD") !==
      moment(previous?.toDate()).format("YYYY-MM-DD")
    );
  };

  const toggleTimestamp = (id) => {
    setVisibleTimestamps((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.reportList}>
        <div className={styles.historyLinkContainer}>
          <div className={styles.top}>
            <Link href="/dashboard/reports" className={styles.historyLink}>
              <button>
                <FaArrowLeftLong />
              </button>
            </Link>

            <Search
              className={styles.search}
              placeholder="Search..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
            />

            <div className={styles.filterContainer}>
              <select
                className={styles.select}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                className={styles.select}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <p className={styles.loading}>Loading reports...</p>
        ) : filteredReports.length === 0 ? (
          <p className={styles.noData}>
            No settled reports found for {months[selectedMonth]} {selectedYear}.
          </p>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className={`${styles.reportItem} ${
                selectedReport?.id === report.id ? styles.selectedReport : ""
              }`}
              onClick={() => setSelectedReport(report)}
            >
              <p>
                <strong>Plate Number:</strong> {report.busPlateNumber}
              </p>
              <p>
                <strong>Type:</strong> {report.reportType}
              </p>
              <p>
                <strong>Status:</strong> {report.status}
              </p>
            </div>
          ))
        )}
      </div>

      {selectedReport && (
        <div className={styles.chatSection}>
          <div className={styles.reportTop}>
            <div className={styles.reportInfoContainer}>
              <div className={styles.reportText}>
                <h3>Plate Number: {selectedReport.busPlateNumber}</h3>
                <p>
                  <strong>Type:</strong> {selectedReport.reportType}
                </p>
                <p>
                  <strong>Description:</strong> {selectedReport.description}
                </p>
              </div>
              {selectedReport.imageUrl && (
                <div className={styles.reportImage}>
                  <Image
                    src={selectedReport.imageUrl}
                    alt="Report"
                    className={styles.fullMedia}
                    width={250}
                    height={250}
                    onClick={() => {
                      setModalSrc(selectedReport.imageUrl);
                      setModalType("image");
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.chatBox}>
            {messages.length === 0 ? (
              <div className={styles.noData}>No messages available.</div>
            ) : (
              messages.map((msg, i) => {
                const prev = messages[i - 1];
                const isOperator = msg.senderRole === "operator";
                return (
                  <div key={msg.id}>
                    {shouldShowDate(msg.createdAt, prev?.createdAt) && (
                      <div className={styles.dateDivider}>
                        {formatDate(msg.createdAt)}
                      </div>
                    )}
                    {visibleTimestamps.includes(msg.id) && (
                      <div className={styles.timestampTopCenter}>
                        {formatTime(msg.createdAt)}
                      </div>
                    )}
                    <div
                      className={`${styles.messageRow} ${
                        isOperator ? styles.right : styles.left
                      }`}
                      onClick={() => toggleTimestamp(msg.id)}
                    >
                      <div className={styles.messageBubble}>
                        {msg.text && <p>{msg.text}</p>}
                        {msg.imageUrl && (
                          <Image
                            src={msg.imageUrl}
                            alt="Attached"
                            className={styles.media}
                            width={250}
                            height={250}
                            onClick={() => {
                              setModalSrc(msg.imageUrl);
                              setModalType("image");
                            }}
                          />
                        )}
                        {msg.docUrl && (
                          <div className={styles.docContainer}>
                            <span
                              onClick={() => {
                                setModalSrc(msg.docUrl);
                                setModalFileName(msg.filename);
                                setModalType("document");
                              }}
                            >
                              {msg.filename || "Open Document"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {modalSrc && (
        <div className={styles.modalOverlay} onClick={() => setModalSrc(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {modalType === "image" ? (
              <Image
                src={modalSrc}
                alt="Full View"
                className={styles.fullMedia}
                width={600}
                height={400}
              />
            ) : (
              <iframe
                src={modalSrc}
                className={styles.fullMedia}
                title="Document Preview"
              ></iframe>
            )}

            <div className={styles.modalButtons}>
              <a
                href={modalSrc}
                download={modalFileName || true}
                target="_blank"
                rel="noreferrer"
                className={styles.modalIconButton}
                title="Download"
              >
                <FaDownload />
              </a>
              <button
                onClick={() => setModalSrc(null)}
                className={styles.modalIconButton}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportHistoryPage;
