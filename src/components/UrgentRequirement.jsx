import React from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import './UrgentRequirement.css';

const UrgentRequirementSection = () => {
  return (
    <section className="urgent-section container" data-scroll-section data-bgcolor="#111827" data-textcolor="#ffffff">
      <div className="urgent-container glass-panel">
        <div className="urgent-image-side">
          <img 
            src="/images/Second%20Post-02.jpg" 
            alt="Urgent Purchase Requirement: Used Nitrogen Unit and Pumping Unit in Saudi Arabia" 
          />
        </div>
        
        <div className="urgent-content-side">
          <div className="urgent-header">
            <span className="urgent-badge pulse-anim">URGENT PURCHASE REQUIREMENT IN KSA</span>
            <h2 title="Purchase Requirement: Used Nitrogen Unit and Pumping Unit – Saudi Arabia">
              We urgently need to purchase Used Nitrogen & Pumping Units in Saudi Arabia
            </h2>
          </div>
          
          <div className="urgent-body">
            <p>We are looking to purchase the following used equipment currently available in Saudi Arabia:</p>
            <ul>
              <li>USA-made nitrogen unit with Caterpillar engine</li>
              <li>High-pressure pumping unit</li>
            </ul>
            <p>The equipment must be in good operational condition and available for physical inspection in the Kingdom.</p>
            <p>Interested equipment owners or direct sellers should post their contact number and equipment location in the comments or contact us. Our technical team will contact you, visit the site, inspect and verify the equipment, and proceed with the purchase if it meets our requirements.</p>
            <p className="broker-warning">Brokers without direct access to the equipment should not respond.</p>
          </div>

          <div className="urgent-tags">
            <span>#NitrogenUnit</span>
            <span>#PumpingUnit</span>
            <span>#Caterpillar</span>
            <span>#OilAndGasEquipment</span>
            <span>#UsedEquipment</span>
            <span>#WellServices</span>
            <span>#SaudiArabia</span>
            <span>#EquipmentPurchase</span>
          </div>

          <div className="urgent-actions">
            <Link to="/auction" className="primary-btn light-btn">
              View in Marketplace <ArrowRight size={18} />
            </Link>
            <a href="https://www.linkedin.com/in/gvice/" target="_blank" rel="noopener noreferrer" className="linkedin-link-btn">
              Connect on LinkedIn <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UrgentRequirementSection;

