import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const ManageNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', category: '', author: '', date: '', excerpt: '', body: '', image: '', featured: false
  });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'news'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNews(data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModal = (newsItem = null) => {
    if (newsItem) {
      setEditingId(newsItem.id);
      setFormData(newsItem);
    } else {
      setEditingId(null);
      setFormData({ title: '', category: '', author: '', date: new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}), excerpt: '', body: '', image: '', featured: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'news', editingId), formData);
      } else {
        await addDoc(collection(db, 'news'), formData);
      }
      closeModal();
      fetchNews();
    } catch (error) {
      console.error("Error saving news:", error);
      alert("Failed to save news article.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteDoc(doc(db, 'news', id));
        fetchNews();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h2>Manage News</h2>
        <button className="admin-btn" onClick={() => openModal()}>
          <Plus size={18} /> Add Article
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <p>Loading news...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {news.map(item => (
                  <tr key={item.id}>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </td>
                    <td>{item.category}</td>
                    <td>{item.date}</td>
                    <td>{item.featured ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-action-btn edit" onClick={() => openModal(item)}><Edit2 size={16} /></button>
                        <button className="icon-action-btn delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {news.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No news articles found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Article' : 'Add New Article'}</h3>
              <button className="icon-action-btn" onClick={closeModal}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="admin-form-group" style={{ flex: 1 }}>
                  <label>Category</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange} required />
                </div>
                <div className="admin-form-group" style={{ flex: 1 }}>
                  <label>Author</label>
                  <input type="text" name="author" value={formData.author} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Date (e.g. July 17, 2026)</label>
                <input type="text" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="admin-form-group">
                <label>Image URL</label>
                <input type="url" name="image" value={formData.image} onChange={handleInputChange} placeholder="https://..." required />
              </div>
              <div className="admin-form-group">
                <label>Excerpt</label>
                <textarea name="excerpt" value={formData.excerpt} onChange={handleInputChange} rows="2" required></textarea>
              </div>
              <div className="admin-form-group">
                <label>Body (HTML allowed)</label>
                <textarea name="body" value={formData.body} onChange={handleInputChange} rows="6" required></textarea>
              </div>
              <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" name="featured" id="featured" checked={formData.featured} onChange={handleInputChange} style={{ width: 'auto' }} />
                <label htmlFor="featured" style={{ margin: 0 }}>Featured Article (Shows in large Hero card)</label>
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-btn">{editingId ? 'Save Changes' : 'Publish Article'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNews;

