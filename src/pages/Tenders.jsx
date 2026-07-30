import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mockTenders } from '../data/mockData';
import Footer from '../components/Footer';
import '../pages/Home.css'; // Reusing tenders-list styles

const Tenders = () => {
  const [tendersList, setTendersList] = useState(mockTenders);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const snap = await getDocs(collection(db, 'tenders'));
        if (!snap.empty) {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTendersList(data);
        }
      } catch (error) {
        console.warn("Firebase not configured or error fetching tenders. Using mock data.", error);
      }
    };
    fetchTenders();
  }, []);

  return (
    <>
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', minHeight: 'calc(100vh - 300px)' }}>
        <div className="section-header">
          <h2>All Tenders</h2>
        </div>
        <div className="tenders-list glass-panel">
          <div className="tender-header">
            <span>Tender ID</span>
            <span>Title</span>
            <span>Client</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {tendersList.map(tender => (
            <div className="tender-row" key={tender.id}>
              <span className="tender-id">{tender.id}</span>
              <span className="tender-title">{tender.title}</span>
              <span className="tender-client">{tender.client}</span>
              <span className="tender-value">{tender.value}</span>
              <span className={`tender-status status-${tender.status.toLowerCase().replace(' ', '-')}`}>
                {tender.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Tenders;


