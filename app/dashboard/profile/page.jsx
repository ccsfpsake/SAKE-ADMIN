"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import styles from "@/app/ui/dashboard/profile/profile.module.css";
import Image from "next/image";

const Profile = () => {
  const [userData, setUserData] = useState({
    FName: "",
    MName: "",
    LName: "",
    Email: "",
    Contact: "",
    Password: "",
    Avatar: "/defaultavatar.png",
    Role: "",
  });

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const collectionName = "Admin";
          const userRef = doc(db, collectionName, user.uid);
          const docSnapshot = await getDoc(userRef);
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();

            setUserData({
              ...data,
              Role: collectionName,
            });
          } else {
            console.warn("No user data found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        router.push("/");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  if (loading) {
    return <div className={styles.profile}>Loading...</div>;
  }

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <Image
          src={userData.Avatar || "/noavatar.png"}
          alt={`${userData.FName} ${userData.LName}'s Avatar`}
          width={120}
          height={120}
          className={styles.avatar}
        />
        <h1>
          {userData.FName} {userData.MName ? `${userData.MName.charAt(0)}.` : ""} {userData.LName}
        </h1>
        {userData.Role && <p className={styles.role}>{userData.Role}</p>}
      </div>
      <div className={styles.details}>
        <p>
          <strong>Email:</strong> {userData.Email || "Not specified"}
        </p>
        <p>
          <strong>Phone Number:</strong> {userData.Contact || "Not available"}
        </p>
      </div>
    </div>
  );
};

export default Profile;
