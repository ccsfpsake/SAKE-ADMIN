"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/app/lib/firebaseConfig";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import Image from "next/image";
import styles from "@/app/ui/dashboard/accountsetting/accountsetting.module.css";
import { FaCamera } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import CropImageModal from "@/app/dashboard/crop/CropImageModal";

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    FName: "",
    LName: "",
    MName: "",
    Email: "",
    Contact: "",
    Avatar: "",
    adminID: "",
  });

  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "Admin", user.uid);
        const docSnapshot = await getDoc(userRef);
        if (docSnapshot.exists()) {
          setUserData(docSnapshot.data());
        }
      }
    };
    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      setCropModalOpen(true);
    } else {
      toast.error("Please upload a valid image file.", { theme: "colored" });
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const user = auth.currentUser;

    if (user) {
      try {
        let avatarUrl = userData.Avatar;

        if (croppedImage) {
          const storage = getStorage();
          const avatarRef = ref(storage, `Admin/${user.uid}/avatar.jpg`);
          const snapshot = await uploadBytes(avatarRef, croppedImage);
          avatarUrl = await getDownloadURL(snapshot.ref);
        }

        const userRef = doc(db, "Admin", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const existingData = userSnapshot.data();
          const isDataChanged = Object.keys(userData).some(
            (key) => userData[key] !== existingData[key]
          );
          const isAvatarChanged = avatarUrl !== existingData.Avatar;

          if (!isDataChanged && !isAvatarChanged) {
            toast.info("No changes detected.", { theme: "colored" });
            setLoading(false);
            return;
          }
        }

        await updateDoc(userRef, {
          ...userData,
          Avatar: avatarUrl,
        });

        setUserData((prev) => ({ ...prev, Avatar: avatarUrl }));
        toast.success("User information updated successfully.", {
          theme: "colored",
        });
      } catch (error) {
        toast.error("Error updating user information. Please try again.", {
          theme: "colored",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    const user = auth.currentUser;

    if (user && newPassword && currentPassword && confirmPassword) {
      if (newPassword.length < 6) {
        toast.error("New password must be at least 6 characters long.", {
          theme: "colored",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New password and confirmation password do not match.", {
          theme: "colored",
        });
        return;
      }

      const credentials = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      try {
        await reauthenticateWithCredential(user, credentials);
        await updatePassword(user, newPassword);
        toast.success("Password updated successfully.", { theme: "colored" });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        toast.error("Failed to update password. Please try again.", {
          theme: "colored",
        });
      }
    } else {
      toast.error("Please enter all password fields.", { theme: "colored" });
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className={styles.card}>
        <h1 className={styles.title}>Account Settings</h1>

        <div className={styles.avatarContainer}>
          <div className={styles.avatarWrapper}>
            <Image
              src={
                croppedImage
                  ? URL.createObjectURL(croppedImage)
                  : userData.Avatar || "/noavatar.png"
              }
              alt="User Avatar"
              width={150}
              height={150}
              className={styles.avatar}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
              id="avatarInput"
            />
            <label htmlFor="avatarInput" className={styles.editIcon}>
              <FaCamera />
            </label>
          </div>
        </div>

        {cropModalOpen && (
          <CropImageModal
            imageFile={avatarFile}
            onCrop={(cropped) => {
              setCroppedImage(cropped);
              setCropModalOpen(false);
            }}
            onClose={() => setCropModalOpen(false)}
          />
        )}

        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "personal" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("personal")}
          >
            Personal Information
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "password" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("password")}
          >
            Change Password
          </button>
        </div>

        {activeTab === "personal" && (
          <form onSubmit={handlePersonalInfoSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="adminID" className={styles.label}>
                Admin ID:
              </label>
              <input
                type="text"
                id="adminID"
                name="adminID"
                className={styles.input}
                value={userData.adminID}
                onChange={handleInputChange}
                disabled
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="Email" className={styles.label}>
                Email:
              </label>
              <input
                type="email"
                id="Email"
                name="Email"
                className={styles.input}
                value={userData.Email}
                onChange={handleInputChange}
                disabled
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="FName" className={styles.label}>
                First Name:
              </label>
              <input
                type="text"
                id="FName"
                name="FName"
                className={styles.input}
                value={userData.FName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="MName" className={styles.label}>
                Middle Name:
              </label>
              <input
                type="text"
                id="MName"
                name="MName"
                className={styles.input}
                value={userData.MName}
                onChange={handleInputChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="LName" className={styles.label}>
                Last Name:
              </label>
              <input
                type="text"
                id="LName"
                name="LName"
                className={styles.input}
                value={userData.LName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="Contact" className={styles.label}>
                Contact:
              </label>
              <input
                type="text"
                id="Contact"
                name="Contact"
                className={styles.input}
                value={userData.Contact}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Updating..." : "Update Information"}
            </button>
          </form>
        )}

        {activeTab === "password" && (
          <form onSubmit={handlePasswordChangeSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword" className={styles.label}>
                Current Password:
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="newPassword" className={styles.label}>
                New Password:
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm New Password:
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            {passwordError && <p className={styles.error}>{passwordError}</p>}

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Updating..." : "Change Password"}
            </button>
          </form>
        )}

        {showSuccessModal && (
          <div className={styles.successModal}>
            <div className={styles.successModalContent}>
              <h2>Success!</h2>
              <button
                onClick={() => setShowSuccessModal(false)}
                className={styles.button}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
