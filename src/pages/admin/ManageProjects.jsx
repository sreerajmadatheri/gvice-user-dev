import { useEffect, useState } from "react";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";

import {
    Plus,
    Edit2,
    Trash2,
    X,
} from "lucide-react";

import { db } from "../../lib/firebase";

const EMPTY_PROJECT = {
    name: "",
    sector: "",
    status: "Planning",
    budget: "",
};

const ManageProjects = () => {
    const [projects, setProjects] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [editingId, setEditingId] =
        useState(null);

    const [showModal, setShowModal] =
        useState(false);

    const [formData, setFormData] =
        useState({
            ...EMPTY_PROJECT,
        });

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const loadProjects = async () => {
        setLoading(true);
        setError("");

        try {
            const snap = await getDocs(
                collection(db, "projects")
            );

            setProjects(
                snap.docs.map((item) => ({
                    id: item.id,
                    ...item.data(),
                }))
            );
        } catch (err) {
            console.error(
                "Error loading projects:",
                err
            );

            setError(
                "Unable to load projects."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const openModal = (
        project = null
    ) => {
        setError("");

        if (project) {
            setEditingId(project.id);

            setFormData({
                name: project.name || "",
                sector:
                    project.sector || "",
                status:
                    project.status ||
                    "Planning",
                budget:
                    project.budget || "",
            });
        } else {
            setEditingId(null);

            setFormData({
                ...EMPTY_PROJECT,
            });
        }

        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;

        setEditingId(null);
        setShowModal(false);

        setFormData({
            ...EMPTY_PROJECT,
        });

        setError("");
    };

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const saveProject = async (e) => {
        e.preventDefault();

        setSaving(true);
        setError("");

        try {
            const payload = {
                name: formData.name.trim(),
                sector:
                    formData.sector.trim(),
                status: formData.status,
                budget:
                    formData.budget.trim(),
                updatedAt:
                    serverTimestamp(),
            };

            if (editingId) {
                await updateDoc(
                    doc(
                        db,
                        "projects",
                        editingId
                    ),
                    payload
                );
            } else {
                await addDoc(
                    collection(db, "projects"),
                    {
                        ...payload,
                        createdAt:
                            serverTimestamp(),
                    }
                );
            }

            closeModal();
            await loadProjects();
        } catch (err) {
            console.error(
                "Error saving project:",
                err
            );

            setError(
                err.message ||
                "Unable to save project."
            );
        } finally {
            setSaving(false);
        }
    };

    const removeProject = async (id) => {
        if (
            !window.confirm(
                "Delete this project?"
            )
        ) {
            return;
        }

        try {
            await deleteDoc(
                doc(db, "projects", id)
            );

            await loadProjects();
        } catch (err) {
            console.error(
                "Error deleting project:",
                err
            );

            alert(
                "Unable to delete project."
            );
        }
    };

    return (
        <div className="admin-page">

            <div className="admin-page-header">

                <div>
                    <h2>Manage Projects</h2>

                    <p
                        style={{
                            marginTop:
                                "0.35rem",
                            color:
                                "#6b7280",
                        }}
                    >
                        Manage projects stored
                        in Firestore.
                    </p>
                </div>

                <button
                    className="admin-btn"
                    onClick={() =>
                        openModal()
                    }
                >
                    <Plus size={18} />
                    Add Project
                </button>

            </div>

            <div className="admin-card">

                {loading ? (
                    <p>Loading projects...</p>
                ) : error ? (
                    <p
                        style={{
                            color: "#b91c1c",
                        }}
                    >
                        {error}
                    </p>
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

                            {projects.map(
                                (project) => (

                                    <tr
                                        key={project.id}
                                    >

                                        <td>
                                            {project.name}
                                        </td>

                                        <td>
                                            {project.sector}
                                        </td>

                                        <td>
                                            {project.status}
                                        </td>

                                        <td>
                                            {project.budget}
                                        </td>

                                        <td>

                                            <div className="action-btns">

                                                <button
                                                    className="icon-action-btn edit"
                                                    onClick={() =>
                                                        openModal(
                                                            project
                                                        )
                                                    }
                                                    title="Edit"
                                                >
                                                    <Edit2
                                                        size={16}
                                                    />
                                                </button>

                                                <button
                                                    className="icon-action-btn delete"
                                                    onClick={() =>
                                                        removeProject(
                                                            project.id
                                                        )
                                                    }
                                                    title="Delete"
                                                >
                                                    <Trash2
                                                        size={16}
                                                    />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )}

                            {projects.length ===
                                0 && (

                                    <tr>
                                        <td
                                            colSpan="5"
                                            style={{
                                                textAlign:
                                                    "center",
                                            }}
                                        >
                                            No projects found.
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
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                marginBottom:
                                    "1rem",
                            }}
                        >

                            <h3>
                                {editingId
                                    ? "Edit Project"
                                    : "Add Project"}
                            </h3>

                            <button
                                className="icon-action-btn"
                                onClick={closeModal}
                                disabled={saving}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {error && (
                            <div
                                style={{
                                    marginBottom:
                                        "1rem",
                                    padding:
                                        "0.75rem",
                                    background:
                                        "#fef2f2",
                                    color:
                                        "#b91c1c",
                                    border:
                                        "1px solid #fecaca",
                                    borderRadius: 6,
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={saveProject}
                        >

                            <div className="admin-form-group">

                                <label>
                                    Name
                                </label>

                                <input
                                    name="name"
                                    value={
                                        formData.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            <div className="admin-form-group">

                                <label>
                                    Sector
                                </label>

                                <input
                                    name="sector"
                                    value={
                                        formData.sector
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            <div className="admin-form-group">

                                <label>
                                    Status
                                </label>

                                <select
                                    name="status"
                                    value={
                                        formData.status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                >
                                    <option>
                                        Planning
                                    </option>

                                    <option>
                                        Active
                                    </option>

                                    <option>
                                        Completed
                                    </option>

                                    <option>
                                        On Hold
                                    </option>
                                </select>

                            </div>

                            <div className="admin-form-group">

                                <label>
                                    Budget
                                </label>

                                <input
                                    name="budget"
                                    value={
                                        formData.budget
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                            <div className="admin-form-actions">

                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="admin-btn"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Save"
                                            : "Create"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

export default ManageProjects;