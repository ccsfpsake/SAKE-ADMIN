
"use client"

import { useState, useEffect } from 'react';
import { db } from '@/app/lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import styles from '@/app/ui/dashboard/terms/terms.module.css'; 

const TermsOfUse = () => {
const [aboutUsData, setAboutUsData] = useState(null);
const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'Setting', 'Terms of Use for Admin'); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAboutUsData(docSnap.data()); 
        } else {
          setError('No data found.');
        }
      } catch (error) {
        setError('Error fetching data.');
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <main>
        <div className={styles.container}>
            <section>
            <h1 className={styles.heading}>Terms of Use</h1>
          </section>
          <section>
            <h2 className={styles.subheading}>Account Management</h2>
            <p className={styles.paragraph}>{aboutUsData?.Account_Management}</p>
          </section>
          <section>
            <h2 className={styles.subheading}>Viewing and Monitoring</h2>
            <p className={styles.paragraph}>{aboutUsData?.Viewing_and_Monitoring}</p>
          </section>
          <section>
            <h2 className={styles.subheading}>Compliance and Security Oversight</h2>
            <p className={styles.paragraph}>{aboutUsData?.Compliance_and_Security_Oversight}</p>
          </section>
          <section>
            <h2 className={styles.subheading}>Confidentiality and Ethical Responsibility </h2>
            <p className={styles.paragraph}>{aboutUsData?.Confidentiality_and_Ethical_Responsibility}</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsOfUse;

