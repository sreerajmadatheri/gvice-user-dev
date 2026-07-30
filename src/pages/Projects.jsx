import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Footer from '../components/Footer';

const Projects = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const snap = await getDocs(collection(db, 'projects'));

        const data = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects:', err);
      }
    };

    fetchProjects();
  }, []);

  return (
      <>
        <div
            className="container"
            style={{
              paddingTop: '4rem',
              paddingBottom: '4rem',
              minHeight: 'calc(100vh - 300px)'
            }}
        >
          <div className="section-header">
            <h2>Active Projects</h2>
          </div>

          <div className="tenders-list glass-panel">
            <div
                className="tender-header"
                style={{
                  gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr'
                }}
            >
              <span>Project ID</span>
              <span>Name</span>
              <span>Sector</span>
              <span>Status</span>
              <span>Budget</span>
            </div>

            {projects.map(project => (
                <div
                    className="tender-row"
                    key={project.id}
                    style={{
                      gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr'
                    }}
                >
                  <span className="tender-id">{project.id}</span>
                  <span className="tender-title">{project.name}</span>
                  <span className="tender-client">{project.sector}</span>

                  <span className="tender-status status-open">
                {project.status}
              </span>

                  <span className="tender-value">
                {project.budget}
              </span>
                </div>
            ))}
          </div>
        </div>

        <Footer />
      </>
  );
};

export default Projects;