import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PremiumModal from "../components/PremiumModal"; // Adjust path as necessary

function PricingPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true); // Modal is open by default on this page

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Navigate to a sensible default, e.g., home page, or use navigate(-1) to go back
    navigate("/");
  };

  // If the modal is programmatically closed (e.g. by an action inside it other than the main close button),
  // we should also navigate away.
  useEffect(() => {
    if (!isModalOpen) {
      navigate("/");
    }
  }, [isModalOpen, navigate]);

  return (
    <>
      {/* 
        This page primarily serves to display the PremiumModal.
        The underlying App.jsx structure (Sidebar, main content area) will still be there,
        and the PremiumModal will overlay it with its backdrop.
      */}
      {isModalOpen && <PremiumModal onClose={handleModalClose} />}
    </>
  );
}

export default PricingPage;
