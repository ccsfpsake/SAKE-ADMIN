"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import styles from "@/app/ui/dashboard/setting/editfaqs.module.css";

const FAQPage = () => {
  const [faqs, setFaqs] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentFAQ, setCurrentFAQ] = useState({
    question: "",
    category: "",
    directions: [{ text: "", imageUrl: "" }],
  });

  useEffect(() => {
    const fetchFAQs = async () => {
      const faqsRef = doc(db, "Setting", "faqs");
      const faqsSnap = await getDoc(faqsRef);

      if (faqsSnap.exists()) {
        const data = faqsSnap.data();
        const storedFaqs = data.faqs || {};
        setFaqs(storedFaqs);
        const categories = Object.keys(storedFaqs);
        if (categories.length > 0) setSelectedCategory(categories[0]);
      } else {
        console.error("FAQs document not found.");
      }
    };

    fetchFAQs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const faqsRef = doc(db, "Setting", "faqs");

    try {
      const updatedFaqs = { ...faqs };
      if (!updatedFaqs[currentFAQ.category]) {
        updatedFaqs[currentFAQ.category] = [];
      }

      updatedFaqs[currentFAQ.category].push({
        question: currentFAQ.question,
        category: currentFAQ.category,
        directions: currentFAQ.directions,
      });

      await updateDoc(faqsRef, {
        faqs: updatedFaqs,
        updatedAt: serverTimestamp(),
      });

      setModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error adding FAQ:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h2>FAQs</h2>
      <div>
        <button onClick={() => {
          setCurrentFAQ({
            question: "",
            category: selectedCategory,
            directions: [{ text: "", imageUrl: "" }],
          });
          setModalOpen(true);
        }}>+ Add FAQ</button>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Add FAQ</h2>
            <form onSubmit={handleSubmit}>
              <label>Question:</label>
              <input
                type="text"
                value={currentFAQ.question}
                onChange={(e) => setCurrentFAQ({ ...currentFAQ, question: e.target.value })}
                required
              />

              <label>Category:</label>
<select
  value={currentFAQ.category || ""}
  onChange={(e) => setCurrentFAQ({ ...currentFAQ, category: e.target.value })}
>
  <option value="General">General</option>
  {Object.keys(faqs)
    .filter((cat) => cat !== "General")
    .map((cat) => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
</select>



              <label>Directions:</label>
              {currentFAQ.directions.map((step, index) => (
                <div key={index}>
                  <input
                    type="text"
                    value={step.text}
                    onChange={(e) => {
                      const newDirections = [...currentFAQ.directions];
                      newDirections[index].text = e.target.value;
                      setCurrentFAQ({ ...currentFAQ, directions: newDirections });
                    }}
                  />
                </div>
              ))}

              <button type="submit">Save</button>
              <button type="button" onClick={() => setModalOpen(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQPage;
