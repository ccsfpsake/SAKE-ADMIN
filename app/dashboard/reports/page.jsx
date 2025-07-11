"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc
} from "firebase/firestore";
import Link from "next/link";
import { db } from "../../lib/firebaseConfig";
import Image from "next/image";
import {
  FaPaperPlane,
  FaPlus,
  FaDownload,
  FaTimes,
} from "react-icons/fa";
import moment from "moment";
import Search from "@/app/ui/dashboard/search/search";
import { FaArrowLeftLong } from "react-icons/fa6";
import styles from "./reportlist.module.css";

const AdminReportPage = () => {
  const [companyData, setCompanyData] = useState([]);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [modalSrc, setModalSrc] = useState(null);
  const [modalFileName, setModalFileName] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [visibleTimestamps, setVisibleTimestamps] = useState([]);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "busReports"), (snap) => {
      const grouped = {};
      const tempUnreadMap = {};
      const unsubMessagesListeners = [];

      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const companyID = data.companyID;

        if (!grouped[companyID]) grouped[companyID] = [];
        grouped[companyID].push({ id: docSnap.id, ...data });

        const messagesRef = collection(db, "busReports", docSnap.id, "messages");

        const unsubMsg = onSnapshot(
          query(messagesRef, where("senderRole", "==", "operator"), where("seen", "==", false)),
          (msgSnap) => {
            if (!msgSnap.empty || !data.adminSeen) {
              tempUnreadMap[companyID] = true;
            }

            const allCompanyIDs = Object.keys(grouped);
            setCompanyData(() =>
              allCompanyIDs.map((id) => ({
                id,
                hasUnread: !!tempUnreadMap[id],
              }))
            );
          }
        );

        unsubMessagesListeners.push(unsubMsg);
      });

      return () => {
        unsubMessagesListeners.forEach((unsub) => unsub());
      };
    });

    return () => unsub();
  }, []);

  const filteredCompanies = companyData
    .filter((c) => c.id.toLowerCase().includes(companySearch.toLowerCase()))
    .sort((a, b) => {
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;
      return a.id.localeCompare(b.id);
    });

  useEffect(() => {
    if (!selectedCompany) return;

    const q = query(collection(db, "busReports"), where("companyID", "==", selectedCompany));
    const unsubReports = onSnapshot(q, (snapshot) => {
      const unsubMessageListeners = [];

      const updatedReports = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const reportData = {
          id: docSnap.id,
          ...data,
          hasUnreadMessages: !data.adminSeen, 
        };
        const messagesRef = collection(db, "busReports", docSnap.id, "messages");

        const unsub = onSnapshot(
          query(messagesRef, where("senderRole", "==", "operator"), where("seen", "==", false)),
          () => {}
        );


        unsubMessageListeners.push(unsub);
        return reportData;
      });

      setReports(updatedReports);

      return () => {
        unsubMessageListeners.forEach((unsub) => unsub());
      };
    });

    return () => unsubReports();
  }, [selectedCompany]);

useEffect(() => {
  if (!selectedReport) return;

  // ✅ Mark report as seen by admin
  const markReportSeen = async () => {
    try {
      await updateDoc(doc(db, "busReports", selectedReport.id), { adminSeen: true });
      // ✅ Update local state to remove "unread" status
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id ? { ...r, hasUnreadMessages: false } : r
        )
      );
    } catch (err) {
      console.error("Failed to mark adminSeen:", err);
    }
  };

  markReportSeen();

  const messagesRef = collection(db, "busReports", selectedReport.id, "messages");
  const unsubMessages = onSnapshot(query(messagesRef, orderBy("createdAt", "asc")), (snapshot) => {
    const fetched = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    setMessages(fetched);

    fetched.forEach((msg) => {
      if (!msg.seen && msg.senderRole === "operator") {
        updateDoc(doc(db, "busReports", selectedReport.id, "messages", msg.id), { seen: true });
      }
    });
  });

  const typingRef = doc(db, "busReports", selectedReport.id, "typing", "operator");
  const unsubTyping = onSnapshot(typingRef, (snap) => {
    setOtherTyping(snap.exists() && snap.data().isTyping);
  });

  return () => {
    unsubMessages();
    unsubTyping();
  };
}, [selectedReport]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedReport) return;
    const typingDoc = doc(db, "busReports", selectedReport.id, "typing", "admin");

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (newMessage.trim().length > 0) {
      setDoc(typingDoc, { isTyping: true });
      typingTimeoutRef.current = setTimeout(() => setDoc(typingDoc, { isTyping: false }), 1000);
    } else {
      setDoc(typingDoc, { isTyping: false });
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [newMessage, selectedReport]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    fileInputRef.current.value = "";
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFileType(selected.type.startsWith("image/") ? "image" : "document");
    };
    reader.readAsDataURL(selected);
    setFile(selected);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !file) || !selectedReport) return;
    const messagesRef = collection(db, "busReports", selectedReport.id, "messages");
    const newMsg = {
      text: newMessage,
      imageUrl: fileType === "image" ? preview : "",
      docUrl: fileType === "document" ? preview : "",
      filename: fileType === "document" ? file.name : "",
      senderRole: "admin",
      senderID: localStorage.getItem("adminID"),
      createdAt: serverTimestamp(),
      seen: false,
      status: "sending",
    };
    try {
      const docRef = await addDoc(messagesRef, newMsg);
      await updateDoc(docRef, { status: "delivered" });
    } catch (err) {
      console.error("Message failed to send:", err);
    }
    setNewMessage("");
    setFile(null);
    setPreview(null);
    setFileType(null);
  };

  const toggleTimestamp = (id) => {
    setVisibleTimestamps((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formatDate = (ts) => moment(ts?.toDate()).format("MMMM D, YYYY");
  const formatTime = (ts) => moment(ts?.toDate()).format("h:mm A");
  const shouldShowDate = (current, previous) => {
    if (!previous) return true;
    return moment(current?.toDate()).format("YYYY-MM-DD") !== moment(previous?.toDate()).format("YYYY-MM-DD");
  };

return (
  <div className={styles.container}>
    {!selectedCompany ? (
      <>
        <div className={styles.top}>
          <h2>Reports</h2>
          <Search
            placeholder="Search..."
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
          />
        </div>
        <div className={styles.companyGrid}>
          {filteredCompanies.length === 0 ? (
            <p className={styles.noData}>No active reports available.</p>
          ) : (
            filteredCompanies.map((company) => (
              <div
                key={company.id}
                className={styles.companyCard}
                onClick={() => {
                  setSelectedCompany(company.id);
                  setSelectedReport(null);
                }}
              >
                <p className={styles.companyID}>{company.id}</p>
                {company.hasUnread && <span className={styles.notificationDot} />}
              </div>
            ))
          )}
        </div>

      </>
    ) : (
        <>
          <div className={styles.selectedCompanyLayout}>
          <div className={styles.reportList}>
            <div className={styles.top}>
            <button
              className={styles.backButton}
              onClick={() => {
                setSelectedCompany(null);
                setSelectedReport(null); 
              }}
            >
              <FaArrowLeftLong />
          </button>
                  <div className={styles.historyLinkContainer}>
            <Link 
            href={{
              pathname: "/dashboard/reports/history",
              query: { companyID: selectedCompany },
            }}
            className={styles.historyLink}
          >
            View History
          </Link>
        </div>
        </div>
    <h3>{selectedCompany}</h3>
      {reports === null ? (
        <p className={styles.loading}>Loading reports...</p>
      ) : reports.filter((r) => r.status !== "settled").length === 0 ? (
        <p className={styles.noData}>No pending reports available.</p>
      ) : (
        reports
          .filter((report) => report.status === "pending")
          .map((report) => (
<div
  key={report.id}
  className={`
    ${styles.reportItem}
    ${report.hasUnreadMessages ? styles.unread : ""}
    ${selectedReport?.id === report.id ? styles.selectedReport : ""}
  `}
  onClick={() => setSelectedReport(report)}
>

              <p><strong>Plate:</strong> {report.busPlateNumber}</p>
              <p><strong>Type:</strong> {report.reportType}</p>

              {report.status !== "settled" && selectedReport?.id === report.id && (
                <button
                  className={styles.settledButton}
                  onClick={async (e) => {
                    e.stopPropagation(); 
                    try {
                      const reportRef = doc(db, "busReports", report.id);
                      await updateDoc(reportRef, { status: "settled" });
                      setSelectedReport((prev) => ({ ...prev, status: "settled" }));
                    } catch (err) {
                      console.error("Failed to update status to Settled:", err);
                    }
                  }}
                >
                Settled
                </button>
              )}
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
                  <p><strong>Type:</strong> {selectedReport.reportType}</p>
                  <p><strong>Description:</strong> {selectedReport.description}</p>
                </div>
                
                  {selectedReport.imageUrl && (
                    <div className={styles.reportImage}>
                    <Image
                      src={selectedReport.imageUrl}
                      alt="Report Image"
                      width={250}
                      height={200}
                      className={styles.fullMedia}
                      onClick={() => {
                        setModalSrc(selectedReport.imageUrl);
                        setModalType("image");
                      }}
                      style={{ objectFit: "cover", borderRadius: "8px", cursor: "pointer" }}
                    />

                    </div>
                  )}
                </div>
              </div>
              <div className={styles.chatBox}>
                {messages.length === 0 ? (
                  <div className={styles.noMessages}>No messages yet.</div>
                ) : (
                  messages.map((msg, i) => {
                    const prev = messages[i - 1];
                    const isAdmin = msg.senderRole === "admin";
                    const isLastAdminMsg = isAdmin && i === messages.length - 1;
                    return (
                      <div key={msg.id}>
                        {shouldShowDate(msg.createdAt, prev?.createdAt) && (
                          <div className={styles.dateDivider}>{formatDate(msg.createdAt)}</div>
                        )}
                        {visibleTimestamps.includes(msg.id) && (
                          <div className={styles.timestampTopCenter}>{formatTime(msg.createdAt)}</div>
                        )}
                        <div
                          className={`${styles.messageRow} ${isAdmin ? styles.right : styles.left}`}
                          onClick={() => toggleTimestamp(msg.id)}
                        >
                          <div className={styles.messageBubble}>
                            {msg.text && <p>{msg.text}</p>}
                            {msg.imageUrl && (
                              <Image
                                src={msg.imageUrl}
                                alt="Chat Image"
                                width={300}
                                height={200}
                                className={styles.media}
                                style={{ objectFit: "cover", cursor: "pointer" }}
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
                        {isLastAdminMsg && (
                          <div className={styles.statusBottom}>
                            {msg.status === "sending" && <span>Sending...</span>}
                            {msg.status === "delivered" && !msg.seen && <span>Delivered</span>}
                            {msg.seen && <span>Seen</span>}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {otherTyping && <div className={styles.typingIndicator}>typing...</div>}
                <div ref={chatEndRef} />
              </div>
              <div className={styles.inputArea}>
                <button className={styles.addButton} onClick={() => fileInputRef.current.click()}><FaPlus /></button>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." rows={1} />
           
                <input type="file" accept="image/*,application/pdf,.doc,.docx" onChange={handleFileChange} style={{ display: "none" }} ref={fileInputRef} />
            <button onClick={sendMessage} className={styles.sendButton} disabled={!newMessage.trim() && !file}>
              <FaPaperPlane />
            </button>
              </div>
                {preview && (
          <div className={styles.previewAttachment}>
            {fileType === "image" ? (
              <Image
                src={preview}
                alt="Preview"
                width={150}
                height={100}
                className={styles.preview}
                style={{ objectFit: "cover", borderRadius: "8px" }}
              />

            ) : (
              <p>{file.name}</p>
            )}
            <button
              className={styles.removePreviewButton}
              onClick={() => {
                setPreview(null);
                setFile(null);
                setFileType(null);
              }}
            >
              <FaTimes />
            </button>
          </div>
        )}
            </div>
          )}
          </div>
        </>
      )}

{modalSrc && (
  <div className={styles.modalOverlay} onClick={() => setModalSrc(null)}>
    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
      {modalType === "image" ? (
       <Image
        src={modalSrc}
        alt="Full View"
        width={600}
        height={400}
        className={styles.fullMedia}
        style={{ objectFit: "contain" }}
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

export default AdminReportPage;

