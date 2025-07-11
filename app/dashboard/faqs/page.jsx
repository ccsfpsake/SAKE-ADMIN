"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import styles from "@/app/ui/dashboard/faqs/faqs.module.css";
import Image from "next/image";

const FAQPage = () => {
  const [faqs, setFaqs] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      const querySnapshot = await getDocs(collection(db, "FAQs"));
      const fetchedFAQs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filteredFAQs = fetchedFAQs.filter(
        (faq) =>
          faq.category === "Admin" ||
          faq.category === "Operator" ||
          faq.category === "Route" ||
          faq.category === "Stops" ||
          faq.category === "Settings"
      );

      filteredFAQs.sort((a, b) => a.createdAt - b.createdAt);

      const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
      }, {});

      setFaqs(groupedFAQs);

      const categories = Object.keys(groupedFAQs);
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    };

    fetchFAQs();
  }, []);

  const toggleFAQ = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <Image
          src="/question.png"
          alt="FAQ Illustration"
          width={150}
          height={150}
          className={styles.faqImage}
        />

        <div>
          <h2 className={styles.title}>FAQs</h2>
          <p className={styles.subtitle}>
            Have questions? Find the answers most valued by our users, along
            with step-by-step instructions and support.
          </p>
        </div>
      </div>

      <div className={styles.faqContainer}>

        <div className={styles.sidebar}>
          <ul>
            {Object.keys(faqs).map((category) => (
              <li
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category ? styles.activeCategory : ""
                }
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.faqContent}>
          {Object.keys(faqs).map((category) => {
    
            if (category !== selectedCategory) return null;

            return (
              <div key={category} className={styles.categorySection}>
                <h3 className={styles.categoryTitle}>{category}</h3>
                {faqs[category].map((faq) => (
                  <div key={faq.id} className={styles.faqItem}>
                    <button
                      className={styles.question}
                      onClick={() => toggleFAQ(faq.id)}
                    >
                      {faq.question}
                      {expanded === faq.id ? (
                        <BiChevronUp className={styles.icon} />
                      ) : (
                        <BiChevronDown className={styles.icon} />
                      )}
                    </button>
                    {expanded === faq.id && (
                      <div className={styles.answer}>
                        {faq.directions.map((step, index) => (
                          <div key={index} className={styles.direction}>
                            <p>{step.text}</p>
                            {step.imageUrl && (
                              <Image
                              src={step.imageUrl}
                              alt="Step"
                              width={200}
                              height={150}
                            />

                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
