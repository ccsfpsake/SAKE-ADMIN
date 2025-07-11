"use client";

import React, { useState } from "react";
import { auth, db } from "@/app/lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import styles from "@/app/ui/login/login.module.css";
import Image from "next/image"; // ✅ use next/image for optimization

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.toLowerCase();
      const q = query(collection(db, "Admin"), where("Email", "==", normalizedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("No user found with this email.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      const adminData = querySnapshot.docs[0].data();

      if (adminData.Status === "Pending") {
        toast.warning("Your account is pending approval.", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      if (adminData.Status === "Suspended") {
        toast.error("Your account has been suspended. Please contact support at ccsfpsake@gmail.com", {
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
        });
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, normalizedEmail, password);
      sessionStorage.setItem("isLoggedIn", "true");
      router.push("/dashboard");

    } catch (error) {
      console.log("Error caught:", error);

      let errorMessage = "Password is incorrect. Please try again.";
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        errorMessage = "No user found with this email or the email format is invalid.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Password is incorrect. Please try again.";
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        theme: "colored",
      });

      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logoSection}>
        <Image
          src="/login.png"
          alt="Login Logo"
          className={styles.logo}
          width={700}
          height={400}
          unoptimized
        />
      </div>
      <div className={styles.card}>
        <h1 className={styles.title}>Admin Login</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
        <div className={styles.links}>
          <Link href="/forgotpassword" className={styles.link}>Forgot Password?</Link>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;
