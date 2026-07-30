import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { mockNews } from '../data/mockData';
import NewsCard from '../components/NewsCard';
import Footer from '../components/Footer';

const NewsRoom = () => {
  const [newsList, setNewsList] = useState(mockNews);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const snap = await getDocs(collection(db, 'news'));
        if (!snap.empty) {
          const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNewsList(data);
        }
      } catch (error) {
        console.warn("Firebase not configured or error fetching news. Using mock data.", error);
      }
    };
    fetchNews();
  }, []);

  return (
    <>
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', minHeight: 'calc(100vh - 300px)' }}>
        <div className="section-header">
          <h2>News Room</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {newsList.map(news => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NewsRoom;

