import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const ManageEquipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    company: '', name: '', sector: 'oil', price: '', img: '', featured: false, specs: []
  });

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'equipmentListings'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEquipment(data);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.specs];
    newSpecs[index][field] = value;
    setFormData(prev => ({ ...prev, specs: newSpecs }));
  };

  const addSpecRow = () => {
    setFormData(prev => ({ ...prev, specs: [...prev.specs, { label: '', val: '' }] }));
  };

  const removeSpecRow = (index) => {
    const newSpecs = formData.specs.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, specs: newSpecs }));
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData(item);
    } else {
      setEditingId(null);
      setFormData({ company: '', name: '', sector: 'oil', price: '', img: '', featured: false, specs: [] });
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
        await updateDoc(doc(db, 'equipmentListings', editingId), formData);
      } else {
        await addDoc(collection(db, 'equipmentListings'), formData);
      }
      closeModal();
      fetchEquipment();
    } catch (error) {
      console.error("Error saving equipment:", error);
      alert("Failed to save equipment listing.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteDoc(doc(db, 'equipmentListings', id));
        fetchEquipment();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h2>Manage Equipment Listings</h2>
        <button className="admin-btn" onClick={() => openModal()}>
          <Plus size={18} /> Add Equipment
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <p>Loading equipment...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Equipment Name</th>
                  <th>Company</th>
                  <th>Sector</th>
                  <th>Price</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.company}</td>
                    <td style={{ textTransform: 'capitalize' }}>{item.sector}</td>
                    <td>{item.price}</td>
                    <td>{item.featured ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-action-btn edit" onClick={() => openModal(item)}><Edit2 size={16} /></button>
                        <button className="icon-action-btn delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {equipment.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>No equipment listings found.</td></tr>
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
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h3>
              <button className="icon-action-btn" onClick={closeModal}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Equipment Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="admin-form-group">
                <label>Seller Company</label>
                <input type="text" name="company" value={formData.company} onChange={handleInputChange} required />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="admin-form-group" style={{ flex: 1 }}>
                  <label>Sector</label>
                  <select name="sector" value={formData.sector} onChange={handleInputChange}>
                    <option value="oil">Oil & Gas</option>
                    <option value="civil">Civil</option>
                    <option value="marine">Marine</option>
                  </select>
                </div>
                <div className="admin-form-group" style={{ flex: 1 }}>
                  <label>Asking Price</label>
                  <input type="text" name="price" value={formData.price} onChange={handleInputChange} placeholder="e.g. $4,200,000" required />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Image URL</label>
                <input type="url" name="img" value={formData.img} onChange={handleInputChange} placeholder="https://..." required />
              </div>

              <div className="admin-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Specifications</label>
                  <button type="button" onClick={addSpecRow} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Spec</button>
                </div>
                
                {formData.specs.map((spec, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Label (e.g. Capacity)" 
                      value={spec.label} 
                      onChange={(e) => handleSpecChange(idx, 'label', e.target.value)} 
                      style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Value (e.g. 750T)" 
                      value={spec.val} 
                      onChange={(e) => handleSpecChange(idx, 'val', e.target.value)} 
                      style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
                      required
                    />
                    <button type="button" onClick={() => removeSpecRow(idx)} className="icon-action-btn delete"><Trash2 size={18} /></button>
                  </div>
                ))}
                {formData.specs.length === 0 && <p style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>No specifications added.</p>}
              </div>

              <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                <input type="checkbox" name="featured" id="featuredEquipment" checked={formData.featured} onChange={handleInputChange} style={{ width: 'auto' }} />
                <label htmlFor="featuredEquipment" style={{ margin: 0 }}>Featured Listing</label>
              </div>

              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-btn">{editingId ? 'Save Changes' : 'Publish Listing'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEquipment;

