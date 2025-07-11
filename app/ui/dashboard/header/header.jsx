"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/lib/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Image from "next/image";
import styles from "./header.module.css";
import { FaSignOutAlt, FaCaretDown, FaBars } from "react-icons/fa";

const Header = ({ isSidebarOpen, toggleSidebar }) => {
  const router = useRouter();
  const dropdownRef = useRef(null); 
  const [userData, setUserData] = useState({
    name: "",
    Avatar: "/noavatar.png",
  });
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, "Admin", user.uid);

        const unsubscribeData = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const formattedData = {
              name: data.name || "",
              Avatar: data.Avatar && data.Avatar.trim() !== "" ? data.Avatar : "/noavatar.png",
            };
            setUserData(formattedData);
          } else {
            console.warn("No document found for user:", user.uid);
            setUserData({ name: "", Avatar: "/noavatar.png" });
          }
        });

        return () => unsubscribeData();
      } else {
        setUserData({ name: "", Avatar: "/noavatar.png" });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  return (
    <header className={`${styles.header} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.left}>
        <button className={styles.burger} onClick={toggleSidebar}>
          <FaBars />
        </button>
      </div>
      <div className={styles.right}>
        <div className={styles.profile} onClick={toggleDropdown} ref={dropdownRef}>
          {userData.Avatar && (
            <Image
              src={userData.Avatar}
              alt="User Avatar"
              width={40}
              height={40}
              className={styles.avatar}
              unoptimized 
            />
          )}
          <div className={styles.nameDropdown}>
            <span className={styles.name}>{userData.name}</span>
            <FaCaretDown className={styles.dropdownIcon} />
          </div>
          {dropdownVisible && (
            <div className={`${styles.dropdown} ${styles.visible}`}>
              <ul>
                <li onClick={handleLogout}>
                  <FaSignOutAlt className={styles.icon} />
                  Log Out
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
