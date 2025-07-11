"use client"

import { useEffect, useState } from 'react';
import { FaUserGear  } from "react-icons/fa6";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig"; 
import styles from './card.module.css';

const OperatorCard = () => {
    const [operatorCount, setOperatorCount] = useState(0);

    useEffect(() => {
        const fetchOperatorCount = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'Operator'));
                setOperatorCount(querySnapshot.size);
            } catch (error) {
                console.error("Error fetching operator count:", error);
            }
        };

        fetchOperatorCount();
    }, []);

    return (
        <div className={styles.card}>
            <div className={styles.texts}>
                <span className={styles.number}>{operatorCount}</span>
                <span className={styles.title}>Total Operators</span>
            </div>
            <div className={styles.icon}>
                <FaUserGear size={28} />
            </div>
        </div>
    );
};

export default OperatorCard;
