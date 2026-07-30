import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const emptyProject = {
    name: "",
    sector: "",
    status: "Planning",
    budget: "",
};

export default function ManageProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState(emptyProject);

    async function loadProjects() {
        setLoading(true);

        try {
            const snap = await getDocs(collection(db, "projects"));

            setProjects(
                snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }))
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProjects();
    }, []);

    function openModal(project = null) {
        if (project) {
            setEditingId(project.id);
            setFormData(project);
        } else {
            setEditingId(null);
            setFormData(emptyProject);
        }

        setShowModal(true);
    }

    function closeModal() {
        setEditingId(null);
        setShowModal(false);
    }

    function handleChange(e) {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    }

    async function saveProject(e) {
        e.preventDefault();

        if (editingId) {
            await updateDoc(doc(db, "projects", editingId), formData);
        } else {
            await addDoc(collection(db, "projects"), formData);
        }

        closeModal();
        loadProjects();
    }

    async function removeProject(id) {
        if (!window.confirm("Delete this project?")) return;

        await deleteDoc(doc(db, "projects", id));

        loadProjects();
    }

    return (
        <>
            <div className="admin-page-header">
                <h2>Manage Projects</h2>

                <button className="admin-btn" onClick={() => openModal()}>
                    <Plus size={18} />
                    Add Project
                </button>
            </div>

            <div className="admin-card">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Sector</th>
                                <th>Status</th>
                                <th>Budget</th>
                                <th>Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td>{project.name}</td>
                                    <td>{project.sector}</td>
                                    <td>{project.status}</td>
                                    <td>{project.budget}</td>

                                    <td>
                                        <div className="action-btns">
                                            <button
                                                className="icon-action-btn edit"
                                                onClick={() => openModal(project)}
                                            >
                                                <Edit2 size={16} />
                                            </button>

                                            <button
                                                className="icon-action-btn delete"
                                                onClick={() => removeProject(project.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!projects.length && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center" }}>
                                        No projects found
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "1rem",
                            }}
                        >
                            <h3>
                                {editingId ? "Edit Project" : "Add Project"}
                            </h3>

                            <button
                                className="icon-action-btn"
                                onClick={closeModal}
                            >
                                <X />
                            </button>
                        </div>

                        <form onSubmit={saveProject}>
                            <div className="admin-form-group">
                                <label>Name</label>

                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Sector</label>

                                <input
                                    name="sector"
                                    value={formData.sector}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>Status</label>

                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option>Planning</option>
                                    <option>Active</option>
                                    <option>Completed</option>
                                    <option>On Hold</option>
                                </select>
                            </div>

                            <div className="admin-form-group">
                                <label>Budget</label>

                                <input
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="admin-form-actions">
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="admin-btn"
                                    type="submit"
                                >
                                    {editingId ? "Save" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
