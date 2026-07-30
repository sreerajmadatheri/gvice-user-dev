import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Newspaper, Gavel, Tractor, FolderKanban } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    news: 0,
    tenders: 0,
    equipment: 0,
    projects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [newsSnap, tendersSnap, equipSnap, projectSnap] = await Promise.all([
          getDocs(collection(db, 'news')),
          getDocs(collection(db, 'tenders')),
          getDocs(collection(db, 'equipmentListings')),
          getDocs(collection(db, 'projects'))
        ]);

        setStats({
          news: newsSnap.size,
          tenders: tendersSnap.size,
          equipment: equipSnap.size,
          projects: projectSnap.size,
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '0.5rem' }}>
            <Newspaper size={32} />
          </div>
          <div>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Total News</p>
            <h3 style={{ margin: 0, fontSize: '1.875rem' }}>{stats.news}</h3>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem' }}>
            <Gavel size={32} />
          </div>
          <div>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Total Tenders</p>
            <h3 style={{ margin: 0, fontSize: '1.875rem' }}>{stats.tenders}</h3>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '0.5rem' }}>
            <Tractor size={32} />
          </div>
          <div>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Equipment Listed</p>
            <h3 style={{ margin: 0, fontSize: '1.875rem' }}>{stats.equipment}</h3>
          </div>
        </div>

        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(245,158,11,.1)', color: '#f59e0b', borderRadius: '0.5rem' }}>
            <FolderKanban size={32}/>
          </div>

          <div>
            <p style={{ color:'#6b7280', margin:0, fontSize:'0.875rem' }}>
              Total Projects
            </p>

            <h3 style={{ margin:0, fontSize:'1.875rem' }}>
              {stats.projects}
            </h3>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;

