import React from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './UrgentModal.css';

const UrgentModal = ({ onClose }) => {
  const navigate = useNavigate();

  const handleActionClick = () => {
    onClose();
    navigate('/auction');
  };

  return (
    <div className="urgent-modal-overlay" onClick={onClose}>
      <div className="urgent-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="urgent-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={24} />
        </button>
        
        <div className="urgent-modal-image" onClick={handleActionClick} style={{ cursor: 'pointer' }}>
          <img src="/images/Second Post-02.jpg" alt="Purchase Requirement: Used Nitrogen Unit and Pumping Unit" />
        </div>
        
        <div className="urgent-modal-text">
          <span className="urgent-badge">URGENT REQUIREMENT</span>
          <h2>Purchase Requirement: Used Nitrogen Unit and Pumping Unit – Saudi Arabia</h2>
          
          <p>We are looking to purchase the following used equipment currently available in Saudi Arabia:</p>
          <ul>
            <li>USA-made nitrogen unit with Caterpillar engine</li>
            <li>High-pressure pumping unit</li>
          </ul>
          <p>The equipment must be in good operational condition and available for physical inspection in the Kingdom.</p>
          <p>Interested equipment owners or direct sellers should post their contact number and equipment location in the comments. Our technical team will contact you, visit the site, inspect and verify the equipment, and proceed with the purchase if it meets our requirements.</p>
          <p className="urgent-note">Brokers without direct access to the equipment should not respond.</p>
          
          <div className="urgent-tags">
            <span>#NitrogenUnit</span>
            <span>#PumpingUnit</span>
            <span>#Caterpillar</span>
            <span>#OilAndGasEquipment</span>
            <span>#UsedEquipment</span>
            <span>#WellServices</span>
            <span>#SaudiArabia</span>
            <span>#KSA</span>
            <span>#EquipmentPurchase</span>
            <span>#OilfieldEquipment</span>
          </div>

          <button className="urgent-action-btn" onClick={handleActionClick}>
            Go to Marketplace Listings
          </button>
        </div>
      </div>
    </div>
  );
};

export default UrgentModal;

