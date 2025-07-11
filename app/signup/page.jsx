// "use client";
// import "react-toastify/dist/ReactToastify.css";
// import { useState } from "react";
// import { ToastContainer, toast } from "react-toastify";
// import Link from "next/link";
// import { db, auth } from "@/app/lib/firebaseConfig";
// import { createUserWithEmailAndPassword } from "firebase/auth";
// import { doc, setDoc } from "firebase/firestore";
// import { useRouter } from "next/navigation";
// import styles from "@/app/ui/signup/signup.module.css";
// import { FaCircleExclamation } from "react-icons/fa6";
// import { FaTimes } from 'react-icons/fa'; 
// import Image from "next/image";

// const SignupPage = () => {
//   const [currentStep, setCurrentStep] = useState(1);
//   const [formData, setFormData] = useState({
//     adminID: "",
//     FName: "",
//     MName: "",
//     LName: "",
//     Email: "",
//     Contact: "",
//     Password: "",
//     ConfirmPassword: "",
//     Role: "Admin"
//   });
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [showTermsModal, setShowTermsModal] = useState(false);
//   const [termsAccepted, setTermsAccepted] = useState(false);

//   const router = useRouter();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault(); 

//     if (currentStep === 1) {
//       if (formData.Password !== formData.ConfirmPassword) {
//         setMessage("Passwords do not match.");
//         toast.error("Passwords do not match.", {
//           position: "top-right",
//           autoClose: 3000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           theme: "colored",
//         });
//         return;
//       }
    
//       if (formData.Password.length < 6) {
//         setMessage("Password should be at least 6 characters.");
//         toast.error("Password should be at least 6 characters.", {
//           position: "top-right",
//           autoClose: 3000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           theme: "colored",
//         });
//         return;
//       }
    
//       setMessage("");
//       setCurrentStep(2);
//     } else if (currentStep === 2) {
//       setMessage("");
//       setCurrentStep(3);
//     } else if (currentStep === 3) {
//       if (!termsAccepted) {
//          toast.info("You must accept the terms and conditions to continue.", {
//           position: "top-right",
//           autoClose: 3000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           theme: "colored",
//         });
//         return;
//       }    

//       setLoading(true);

//       try {
//         const userCredential = await createUserWithEmailAndPassword(
//           auth,
//           formData.Email,
//           formData.Password
//         );

//         await setDoc(doc(db, "Admin", userCredential.user.uid), {
//           FName: formData.FName,
//           MName: formData.MName,
//           LName: formData.LName,
//           Email: formData.Email,
//           Contact: formData.Contact,
//           Status: "Pending",
//           adminID: formData.adminID,
//         });

//         setShowModal(true);
//         setFormData({
//           FName: "",
//           MName: "",
//           LName: "",
//           Email: "",
//           Contact: "",
//           Password: "",
//           ConfirmPassword: "",
//           adminID: "",
//         });
//       } catch (error) {
//         if (error.code === "auth/email-already-in-use") {
//           toast.error("The email address is already in use.", {
//             position: "top-right",
//             autoClose: 3000,
//             hideProgressBar: false,
//             closeOnClick: true,
//             pauseOnHover: true,
//             draggable: true,
//             theme: "colored",
//             style: { backgroundColor: "#FF4C4C", color: "#FFF" },
//           });
//         } else {
//           toast.error("An error occurred. Please try again.", {
//             position: "top-right",
//             autoClose: 3000,
//             hideProgressBar: false,
//             closeOnClick: true,
//             pauseOnHover: true,
//             draggable: true,
//             theme: "colored",
//           });
//         }
//       } finally {
//         setLoading(false);
//       }
//     }
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//     toast.success("Signup complete! Wait for the verification email before logging in.", {
//       position: "top-right",
//       autoClose: 1500,
//     });
//     setTimeout(() => {
//       router.push("/login");
//     }, 2000);
//   };

//   const handleAgree = () => {
//     setTermsAccepted(true);
//     setShowTermsModal(false); 
//   };

//   const handleClose = () => {
//     setTermsAccepted(false);
//     setShowTermsModal(false); 
//   };

//   return (
//     <div className={styles.container}>
//       <div className={styles.logoSection}>
//     <Image
//       src="/signup.png"
//       alt="Signup Logo"
//       width={700} 
//       height={auto}
//       className={styles.logo}
//     />
//       </div>
//       <div className={styles.card}>
//         <h1 className={styles.title}>Admin Signup</h1>
//         <div className={styles.progressBar}>
//           <div className={`${styles.step} ${currentStep >= 1 ? styles.completed : ""}`}>
//             <div className={styles.stepNumber}>1</div>
//             <div className={styles.stepLabel}>Account Credentials</div>
//           </div>
//           <div className={styles.stepSeparator} />
//           <div className={`${styles.step} ${currentStep >= 2 ? styles.completed : ""}`}>
//             <div className={styles.stepNumber}>2</div>
//             <div className={styles.stepLabel}>Personal Information</div>
//           </div>
//           <div className={styles.stepSeparator} />
//           <div className={`${styles.step} ${currentStep >= 3 ? styles.completed : ""}`}>
//             <div className={styles.stepNumber}>3</div>
//             <div className={styles.stepLabel}>Preview Information</div>
//           </div>
//         </div>  

//         <form className={styles.form} onSubmit={handleSubmit}>
//           {currentStep === 1 && (
//             <>
//               <div className={styles.inputGroup}>
//                 <label htmlFor="Email" className={styles.label}>Email Address*</label>
//                 <input
//                   type="email"
//                   id="Email"
//                   name="Email"
//                   className={styles.input}
//                   onChange={handleChange}
//                   value={formData.Email}
//                   required
//                 />
//               </div>
//               <div className={styles.inputGroup}>
//                 <label htmlFor="adminID" className={styles.label}>Admin ID*</label>
//                 <input
//                   type="text"
//                   id="adminID"
//                   name="adminID"
//                   className={styles.input}
//                   onChange={handleChange}
//                   value={formData.adminID}
//                   required
//                 />
//               </div>
//               <div className={styles.inputGroup}>
//                 <label htmlFor="Password" className={styles.label}>Password*</label>
//                 <input
//                   type="password"
//                   id="Password"
//                   name="Password"
//                   className={styles.input}
//                   onChange={handleChange}
//                   value={formData.Password}
//                   required
//                 />
//               </div>
//               <div className={styles.inputGroup}>
//                 <label htmlFor="ConfirmPassword" className={styles.label}>Confirm Password*</label>
//                 <input
//                   type="password"
//                   id="ConfirmPassword"
//                   name="ConfirmPassword"
//                   className={styles.input}
//                   onChange={handleChange}
//                   value={formData.ConfirmPassword}
//                   required
//                 />
//               </div>
//             </>
//           )}

//           {currentStep === 2 && (
//             <>
//               <div className={styles.nameRow}>
//                 <div className={styles.inputGroup}>
//                   <label htmlFor="FName" className={styles.label}>First Name*</label>
//                   <input
//                     type="text"
//                     id="FName"
//                     name="FName"
//                     className={styles.input}
//                     onChange={handleChange}
//                     value={formData.FName}
//                     required
//                   />
//                 </div>

//                 <div className={styles.inputGroup}>
//                   <label htmlFor="MName" className={styles.label}>Middle Name</label>
//                   <input
//                     type="text"
//                     id="MName"
//                     name="MName"
//                     className={styles.input}
//                     onChange={handleChange}
//                     value={formData.MName}
//                   />
//                 </div>

//                 <div className={styles.inputGroup}>
//                   <label htmlFor="LName" className={styles.label}>Last Name*</label>
//                   <input
//                     type="text"
//                     id="LName"
//                     name="LName"
//                     className={styles.input}
//                     onChange={handleChange}
//                     value={formData.LName}
//                     required
//                   />
//                 </div>
//               </div>

//               <div className={styles.inputGroup}>
//             <label htmlFor="Contact" className={styles.label}>Phone Number*</label>
//             <input
//               type="tel"
//               id="Contact"
//               name="Contact"
//               className={styles.input}
//               onChange={handleChange}
//               value={formData.Contact}
//               required
//               pattern="[0-9]*"
//               onInvalid={(e) => e.target.setCustomValidity("Please enter numbers only (0–9).")}
//               onInput={(e) => e.target.setCustomValidity("")} 
//             />
//           </div>
//             </>
//           )}

//           {currentStep === 3 && (
//             <div className={styles.preview}>
//               <h3>Preview Your Information</h3>
//               <p><strong>Email:</strong> {formData.Email}</p>
//               <p><strong>Admin ID:</strong> {formData.adminID}</p>
//               <p><strong>First Name:</strong> {formData.FName}</p>
//               <p><strong>Middle Name:</strong> {formData.MName}</p>
//               <p><strong>Last Name:</strong> {formData.LName}</p>
//               <p><strong>Contact:</strong> {formData.Contact}</p>
//               <div className={styles.inputGroup}>
//                 <input
//                   type="checkbox"
//                   id="terms"
//                   name="terms"
//                   checked={termsAccepted}
//                   onChange={() => setTermsAccepted(!termsAccepted)}
//                 />
//                 <label htmlFor="terms" className={styles.label}>
//                   I agree to the{" "}
//                   <span
//                     className={styles.link}
//                     onClick={() => setShowTermsModal(true)}
//                   >
//                     terms and conditions
//                   </span>.
//                 </label>
//               </div>
//             </div>
//           )}

//           <div className={styles.buttonGroup}>
//             {currentStep > 1 && (
//               <button
//                 type="button"
//                 className={`${styles.button} ${styles.grayButton}`}
//                 onClick={() => setCurrentStep(currentStep - 1)}
//                 disabled={loading}
//               >
//                 Previous
//               </button>
//             )}
//             {currentStep < 3 && (
//               <button
//                 type="submit"
//                 className={`${styles.button} ${styles.blueButton}`}
//                 disabled={loading}
//               >
//                 {loading ? "Processing..." : "Next"}
//               </button>
//             )}
//             {currentStep === 3 && (
//               <button
//                 type="submit"
//                 className={`${styles.button} ${styles.blueButton}`}
//                 disabled={loading}
//               >
//                 {loading ? "Processing.." : "Submit"}
//               </button>
//             )}
//           </div>
//         </form>

//         <div className={styles.loginLink}>
//           <p>
//             Already have an account? <Link href="/login" className={styles.link}>Login here</Link>
//           </p>
//         </div>

//         {showModal && (
//           <div className={styles.modalOverlay}>
//             <div className={styles.modal}>
//               <div className={styles.icon}>
//               <FaCircleExclamation className={styles.icons} />
//               </div>
//               <p>Your account is pending for verification. Please wait for the verification email.</p>
//               <button onClick={handleCloseModal} className={`${styles.parentContainer} ${styles.blueButton}`}>OK</button>
//             </div>
//           </div>
//         )}

//         {showTermsModal && (
//           <div className={styles.modalOver}>
//             <div className={styles.modalterm}>
//       <button onClick={handleClose} className={styles.closeButton}>
//         <FaTimes size={20} />
//       </button>
//               <h2>Terms and Conditions</h2>
//               <p>
//                 By signing up as an Admin on the SAKE Transport System, you agree to follow these terms:
//               </p>
//               <div>
//                 <strong>Account Responsibilities</strong>
//                 <p>Keep your login details secure. Ensure your information is accurate. Manage  Admin and Operator accounts and platform performance.</p>
                
//                 <strong>Platform Use</strong>
//                 <p>Manage and oversee the platform's functions. Monitor Admin and Operator accounts and activity. Ensure that all users comply with the platform's guidelines.</p>
                
//                 <strong>Prohibited Activities</strong>
//                 <p>Use the platform for illegal or unauthorized activities. Share your login details with others. Misuse user data or engage in fraud.</p>
                
//                 <strong>Privacy and Data Protection</strong>
//                 <p>Your personal data and information will be protected as per our Privacy Policy. Admins are responsible for ensuring data security.</p>
                
//                 <strong>Account Termination</strong>
//                 <p>Your Admin account may be terminated if:</p>
//                 <p>You violate these terms. Your actions harm the platform's integrity or security.</p>
                
//                 <strong>Contact Us</strong>
//                 <p>If you have any questions, please contact us at ccsfpsake@gmail.com</p>
//               </div>

//               <div className={styles.buttonmodal}>
//                 <button onClick={handleAgree} className={`${styles.button} ${styles.greenButton}`}>
//                   Agree
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//       <ToastContainer />
//     </div>
//   );
// };

// export default SignupPage;


