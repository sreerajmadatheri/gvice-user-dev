import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const ManageTenders = () => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', client: '', value: '', status: 'Open'
  });

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'tenders'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTenders(data);
    } catch (error) {
      console.error("Error fetching tenders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (tenderItem = null) => {
    if (tenderItem) {
      setEditingId(tenderItem.id);
      setFormData(tenderItem);
    } else {
      setEditingId(null);
      setFormData({ title: '', client: '', value: '', status: 'Open' });
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
        await updateDoc(doc(db, 'tenders', editingId), formData);
      } else {
        await addDoc(collection(db, 'tenders'), formData);
      }
      closeModal();
      fetchTenders();
    } catch (error) {
      console.error("Error saving tender:", error);
      alert("Failed to save tender.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tender?')) {
      try {
        await deleteDoc(doc(db, 'tenders', id));
        fetchTenders();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h2>Manage Tenders</h2>
        <button className="admin-btn" onClick={() => openModal()}>
          <Plus size={18} /> Add Tender
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <p>Loading tenders...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenders.map(item => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>{item.client}</td>
                    <td>{item.value}</td>
                    <td>
                      <span className={`tender-status status-${item.status.toLowerCase().replace(' ', '-')}`} style={{ display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-action-btn edit" onClick={() => openModal(item)}><Edit2 size={16} /></button>
                        <button className="icon-action-btn delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tenders.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>No tenders found.</td></tr>
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
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Tender' : 'Add New Tender'}</h3>
              <button className="icon-action-btn" onClick={closeModal}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Tender Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>
              <div className="admin-form-group">
                <label>Client</label>
                <input type="text" name="client" value={formData.client} onChange={handleInputChange} required />
              </div>
              <div className="admin-form-group">
                <label>Value (e.g. $1.2B)</label>
                <input type="text" name="value" value={formData.value} onChange={handleInputChange} required />
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Open">Open</option>
                  <option value="Under Evaluation">Under Evaluation</option>
                  <option value="Awarded">Awarded</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-btn">{editingId ? 'Save Changes' : 'Publish Tender'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTenders;

