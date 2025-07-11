'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/app/lib/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from '@/app/ui/dashboard/fare/fare.module.css';
import { FaExclamationCircle } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function FareSettings() {
  const [baseFare, setBaseFare] = useState(15);
  const [baseKm, setBaseKm] = useState(4);
  const [additionalPerKm, setAdditionalPerKm] = useState(2.2);
  const [discount, setDiscount] = useState(0.2);
  const [effectiveDate, setEffectiveDate] = useState('2023-10-08');
  const [fareTable, setFareTable] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'Farematrix', 'aircon_puj');
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBaseFare(data.baseFare);
        setBaseKm(data.baseKm);
        setAdditionalPerKm(data.additionalPerKm);
        setDiscount(data.discount);
        setEffectiveDate(data.effectiveDate);
        setFareTable(data.fareTable || []);
        setInitialData(data);
      }
    };
    fetchData();
  }, []);

  const hasChanges = useMemo(() => {
    return (
      !initialData ||
      baseFare !== initialData.baseFare ||
      baseKm !== initialData.baseKm ||
      additionalPerKm !== initialData.additionalPerKm ||
      discount !== initialData.discount ||
      effectiveDate !== initialData.effectiveDate ||
      JSON.stringify(fareTable) !== JSON.stringify(initialData.fareTable)
    );
  }, [baseFare, baseKm, additionalPerKm, discount, effectiveDate, fareTable, initialData]);

  const generateFareTable = () => {
    const table = [];
    for (let km = 1; km <= 50; km++) {
      let fare = km <= baseKm ? baseFare : baseFare + (km - baseKm) * additionalPerKm;
      fare = Math.round(fare * 4) / 4;
      const discounted = Math.round(fare * (1 - discount) * 4) / 4;
      table.push({ km, regular: fare, discounted });
    }
    setFareTable(table);
    setShowTable(true);
  };

  const handleSave = () => setShowModal(true);

  const confirmSave = async () => {

    if (baseFare <= 0 || baseKm <= 0 || additionalPerKm < 0 || discount < 0 || discount > 1) {
      toast.error("Please enter valid fare values.");
      setShowModal(false);
      return;
    }

    if (fareTable.length === 0) {
      toast.warning('Please generate the fare table before saving.');
      setShowModal(false);
      return;
    }

    if (!hasChanges) {
      toast.info('No changes detected.');
      setShowModal(false);
      return;
    }

    setIsSaving(true);
    try {
      const docRef = doc(db, 'Farematrix', 'aircon_puj');
      await setDoc(docRef, {
        baseFare,
        baseKm,
        additionalPerKm,
        discount,
        effectiveDate,
        fareTable,
        updatedAt: new Date().toISOString(), 
      });

      setInitialData({
        baseFare,
        baseKm,
        additionalPerKm,
        discount,
        effectiveDate,
        fareTable,
      });

      toast.success('Fare configuration updated successfully!');
    } catch (error) {
      toast.error('Failed to save changes.');
    }

    setIsSaving(false);
    setShowModal(false);
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      <h1 className={styles.title}>PUJ (Modern and Electric Airconditioned)</h1>

      <div className={styles.grid}>
        <label>
          <span className={styles.label}>Base Fare (₱)</span>
          <input
            type="number"
            step="0.25"
            value={baseFare}
            onChange={(e) => setBaseFare(parseFloat(e.target.value))}
            className={styles.input}
          />
        </label>

        <label>
          <span className={styles.label}>Base Kilometers</span>
          <input
            type="number"
            value={baseKm}
            onChange={(e) => setBaseKm(parseInt(e.target.value))}
            className={styles.input}
          />
        </label>

        <label>
          <span className={styles.label}>Additional Fare per Km (₱)</span>
          <input
            type="number"
            step="0.01"
            value={additionalPerKm}
            onChange={(e) => setAdditionalPerKm(parseFloat(e.target.value))}
            className={styles.input}
          />
        </label>

        <label>
          <span className={styles.label}>Discount (Student / Elderly / Disabled)</span>
          <input
            type="number"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value))}
            className={styles.input}
          />
        </label>

        <label>
          <span className={styles.label}>Effective Date</span>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className={styles.input}
          />
        </label>
      </div>

      <div className={styles.buttonGroup}>
        <button
          onClick={generateFareTable}
          className={`${styles.button} ${styles.generateButton}`}
          disabled={isSaving}
        >
          Generate Fare Table
        </button>
        <button
          onClick={handleSave}
          className={`${styles.button} ${styles.saveButton}`}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {showTable && fareTable.length > 0 && (
        <div className={styles.tableWrapper}>
          <div className={styles.tableHeader}>
            <h2 className={styles.subtitle}>Generated Fare Table</h2>
            <button onClick={() => setShowTable(false)} className={`${styles.button} ${styles.closeButton}`}>
              Close
            </button>
          </div>

          <div className={styles.tableOuter}>
            <div className={styles.tableBodyScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>KM</th>
                    <th>Regular</th>
                    <th>Discounted (Student / Elderly / Disabled)</th>
                  </tr>
                </thead>
                <tbody>
                  {fareTable.map(({ km, regular, discounted }) => (
                    <tr key={km}>
                      <td>{km}</td>
                      <td>₱{regular.toFixed(2)}</td>
                      <td>₱{discounted.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <FaExclamationCircle className={styles.modalicon} />
            <p>Are you sure you want to update the fare matrix?</p>
            <div className={styles.modalButtons}>
              <button className={`${styles.button} ${styles.cancel}`} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={`${styles.button} ${styles.update}`} onClick={confirmSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// fare for other type of vehicle
// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import { db } from '@/app/lib/firebaseConfig';
// import { doc, getDoc, setDoc } from 'firebase/firestore';
// import styles from '@/app/ui/dashboard/fare/fare.module.css';
// import { FaExclamationCircle } from 'react-icons/fa';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// export default function FareSettings() {
//   const vehicleOptions = ['aircon_puj', 'regular_puj', 'bus', 'van'];
//   const [vehicleType, setVehicleType] = useState('aircon_puj');

//   const [baseFare, setBaseFare] = useState(15);
//   const [baseKm, setBaseKm] = useState(4);
//   const [additionalPerKm, setAdditionalPerKm] = useState(2.2);
//   const [discount, setDiscount] = useState(0.2);
//   const [effectiveDate, setEffectiveDate] = useState('2023-10-08');
//   const [fareTable, setFareTable] = useState([]);
//   const [showTable, setShowTable] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [initialData, setInitialData] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       const ref = doc(db, 'Farematrix', vehicleType);
//       const snapshot = await getDoc(ref);
//       if (snapshot.exists()) {
//         const data = snapshot.data();
//         setBaseFare(data.baseFare);
//         setBaseKm(data.baseKm);
//         setAdditionalPerKm(data.additionalPerKm);
//         setDiscount(data.discount);
//         setEffectiveDate(data.effectiveDate);
//         setFareTable(data.fareTable || []);
//         setInitialData(data);
//       } else {
//         setBaseFare(15);
//         setBaseKm(4);
//         setAdditionalPerKm(2.2);
//         setDiscount(0.2);
//         setEffectiveDate('2023-10-08');
//         setFareTable([]);
//         setInitialData(null);
//       }
//     };
//     fetchData();
//   }, [vehicleType]);

//   const hasChanges = useMemo(() => {
//     return (
//       !initialData ||
//       baseFare !== initialData.baseFare ||
//       baseKm !== initialData.baseKm ||
//       additionalPerKm !== initialData.additionalPerKm ||
//       discount !== initialData.discount ||
//       effectiveDate !== initialData.effectiveDate ||
//       JSON.stringify(fareTable) !== JSON.stringify(initialData.fareTable)
//     );
//   }, [baseFare, baseKm, additionalPerKm, discount, effectiveDate, fareTable, initialData]);

//   const generateFareTable = () => {
//     const table = [];
//     for (let km = 1; km <= 50; km++) {
//       let fare = km <= baseKm ? baseFare : baseFare + (km - baseKm) * additionalPerKm;
//       fare = Math.round(fare * 4) / 4;
//       const discounted = Math.round(fare * (1 - discount) * 4) / 4;
//       table.push({ km, regular: fare, discounted });
//     }
//     setFareTable(table);
//     setShowTable(true);
//   };

//   const handleSave = () => setShowModal(true);

//   const confirmSave = async () => {
//     if (baseFare <= 0 || baseKm <= 0 || additionalPerKm < 0 || discount < 0 || discount > 1) {
//       toast.error("Please enter valid fare values.");
//       setShowModal(false);
//       return;
//     }

//     if (fareTable.length === 0) {
//       toast.warning('Please generate the fare table before saving.');
//       setShowModal(false);
//       return;
//     }

//     if (!hasChanges) {
//       toast.info('No changes detected.');
//       setShowModal(false);
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const docRef = doc(db, 'Farematrix', vehicleType);
//       await setDoc(docRef, {
//         baseFare,
//         baseKm,
//         additionalPerKm,
//         discount,
//         effectiveDate,
//         fareTable,
//         updatedAt: new Date().toISOString(),
//       });

//       setInitialData({
//         baseFare,
//         baseKm,
//         additionalPerKm,
//         discount,
//         effectiveDate,
//         fareTable,
//       });

//       toast.success('Fare configuration updated successfully!');
//     } catch (error) {
//       toast.error('Failed to save changes.');
//     }

//     setIsSaving(false);
//     setShowModal(false);
//   };

//   return (
//     <div className={styles.container}>
//       <ToastContainer position="top-right" autoClose={2500} theme="colored" />

//       <h1 className={styles.title}>PUJ Fare Settings</h1>

//       <div className={styles.grid}>
//         <label>
//           <span className={styles.label}>Vehicle Type</span>
//           <select
//             value={vehicleType}
//             onChange={(e) => setVehicleType(e.target.value)}
//             className={styles.input}
//           >
//             {vehicleOptions.map((v) => (
//               <option key={v} value={v}>{v.replace(/_/g, ' ').toUpperCase()}</option>
//             ))}
//           </select>
//         </label>

//         <label>
//           <span className={styles.label}>Base Fare (₱)</span>
//           <input
//             type="number"
//             step="0.25"
//             value={baseFare}
//             onChange={(e) => setBaseFare(parseFloat(e.target.value))}
//             className={styles.input}
//           />
//         </label>

//         <label>
//           <span className={styles.label}>Base Kilometers</span>
//           <input
//             type="number"
//             value={baseKm}
//             onChange={(e) => setBaseKm(parseInt(e.target.value))}
//             className={styles.input}
//           />
//         </label>

//         <label>
//           <span className={styles.label}>Additional Fare per Km (₱)</span>
//           <input
//             type="number"
//             step="0.01"
//             value={additionalPerKm}
//             onChange={(e) => setAdditionalPerKm(parseFloat(e.target.value))}
//             className={styles.input}
//           />
//         </label>

//         <label className={styles.halfWidth}>
//           <span className={styles.label}>Discount (Student / Elderly / Disabled)</span>
//           <input
//             type="number"
//             step="0.01"
//             value={discount}
//             onChange={(e) => setDiscount(parseFloat(e.target.value))}
//             className={styles.input}
//           />
//         </label>

//         <label className={styles.halfWidth}>
//           <span className={styles.label}>Effective Date</span>
//           <input
//             type="date"
//             value={effectiveDate}
//             onChange={(e) => setEffectiveDate(e.target.value)}
//             className={styles.input}
//           />
//         </label>
//       </div>

//       <div className={styles.buttonGroup}>
//         <button
//           onClick={generateFareTable}
//           className={`${styles.button} ${styles.generateButton}`}
//           disabled={isSaving}
//         >
//           Generate Fare Table
//         </button>
//         <button
//           onClick={handleSave}
//           className={`${styles.button} ${styles.saveButton}`}
//           disabled={isSaving}
//         >
//           {isSaving ? 'Saving...' : 'Save'}
//         </button>
//       </div>

//       {showTable && fareTable.length > 0 && (
//         <div className={styles.tableWrapper}>
//           <div className={styles.tableHeader}>
//             <h2 className={styles.subtitle}>Generated Fare Table</h2>
//             <button onClick={() => setShowTable(false)} className={`${styles.button} ${styles.closeButton}`}>
//               Close
//             </button>
//           </div>

//           <div className={styles.tableOuter}>
//             <div className={styles.tableBodyScroll}>
//               <table className={styles.table}>
//                 <thead>
//                   <tr>
//                     <th>KM</th>
//                     <th>Regular</th>
//                     <th>Discounted</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {fareTable.map(({ km, regular, discounted }) => (
//                     <tr key={km}>
//                       <td>{km}</td>
//                       <td>₱{regular.toFixed(2)}</td>
//                       <td>₱{discounted.toFixed(2)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}

//       {showModal && (
//         <div className={styles.modalOverlay}>
//           <div className={styles.modal}>
//             <FaExclamationCircle className={styles.modalicon} />
//             <p>Are you sure you want to update the fare matrix for <strong>{vehicleType.replace(/_/g, ' ')}</strong>?</p>
//             <div className={styles.modalButtons}>
//               <button className={`${styles.button} ${styles.cancel}`} onClick={() => setShowModal(false)}>
//                 Cancel
//               </button>
//               <button className={`${styles.button} ${styles.update}`} onClick={confirmSave} disabled={isSaving}>
//                 {isSaving ? 'Saving...' : 'Update'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
