import React from 'react';
import './SubscriptionSection.css';

const SubscriptionSection = () => {
  return (
    <section className="subscription-section">
      <div className="container sub-container">
        
        {/* Top Info Area */}
        <div className="sub-top">
          <div className="sub-text-content">
            <h2 className="sub-title">A GVICE Subscription...</h2>
            <p className="sub-desc">
              Subscribe or upgrade your current GVICE.com package to support your strategic planning with the MENA region's best source of business information. Proceed to our online shop below to find out more about the features in each package.
            </p>
            <p className="sub-desc">
              Take advantage of our introductory offers below for new subscribers and purchase your access today! If you are an existing client, please reach out to your account manager.
            </p>
          </div>
          
          <div className="sub-image-content">
            {/* Using a placeholder tech/dashboard mockup to represent the devices in the reference image */}
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" 
              alt="GVICE platform on multiple devices" 
              className="sub-devices-img"
            />
          </div>
        </div>

        {/* Bottom Pricing Area */}
        <div className="sub-pricing">
          <div className="pricing-card">
            <h3>Digital Subscription</h3>
            <div className="price">$100</div>
          </div>
          
          <div className="pricing-card premium">
            <div className="best-value-tag">Best Value</div>
            <h3>Premium Subscription</h3>
            <div className="price">$200</div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SubscriptionSection;

