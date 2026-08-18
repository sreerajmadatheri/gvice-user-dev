import { useEffect, useMemo, useState } from "react";

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
    Search,
} from "lucide-react";

import { db } from "../../lib/firebase";

import "./Admin.css";


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

    const [searchTerm, setSearchTerm] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");


    // =====================================================
    // LOAD PROJECTS
    // =====================================================

    const loadProjects = async () => {

        setLoading(true);
        setError("");

        try {

            const snap =
                await getDocs(
                    collection(db, "projects")
                );


            /*
             * IMPORTANT:
             *
             * Firestore data first.
             * Actual Firestore document ID last.
             *
             * This prevents an old "id" field from
             * overriding the real document ID.
             */

            const data =
                snap.docs.map((item) => ({
                    ...item.data(),
                    id: item.id,
                }));


            setProjects(data);

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


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadProjects();

    }, []);


    // =====================================================
    // FILTER PROJECTS
    // =====================================================

    const filteredProjects =
        useMemo(() => {

            const search =
                searchTerm
                    .trim()
                    .toLowerCase();


            if (!search) {

                return projects;

            }


            return projects.filter(
                (project) =>
                    (project.name || "")
                        .toLowerCase()
                        .includes(search)
            );

        }, [
            projects,
            searchTerm,
        ]);


    // =====================================================
    // OPEN MODAL
    // =====================================================

    const openModal = (
        project = null
    ) => {

        setError("");

        if (project) {

            setEditingId(
                project.id
            );

            setFormData({
                name:
                    project.name || "",

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


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {

        if (saving) {
            return;
        }

        setEditingId(null);

        setShowModal(false);

        setFormData({
            ...EMPTY_PROJECT,
        });

        setError("");

    };


    // =====================================================
    // FORM CHANGE
    // =====================================================

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


    // =====================================================
    // SAVE PROJECT
    // =====================================================

    const saveProject = async (e) => {

        e.preventDefault();

        setSaving(true);
        setError("");


        try {

            // ---------------------------------------------
            // Validation
            // ---------------------------------------------

            const name =
                formData.name.trim();

            const sector =
                formData.sector.trim();

            const budget =
                formData.budget.trim();


            if (!name) {

                throw new Error(
                    "Project name is required."
                );

            }

            if (!sector) {

                throw new Error(
                    "Project sector is required."
                );

            }

            if (!budget) {

                throw new Error(
                    "Project budget is required."
                );

            }


            // ---------------------------------------------
            // Firestore payload
            // ---------------------------------------------

            const payload = {

                name,

                sector,

                status:
                    formData.status ||
                    "Planning",

                budget,

                updatedAt:
                    serverTimestamp(),

            };


            // ---------------------------------------------
            // UPDATE
            // ---------------------------------------------

            if (editingId) {

                await updateDoc(
                    doc(
                        db,
                        "projects",
                        editingId
                    ),
                    payload
                );

            }


                // ---------------------------------------------
                // CREATE
            // ---------------------------------------------

            else {

                await addDoc(
                    collection(
                        db,
                        "projects"
                    ),
                    {
                        ...payload,

                        createdAt:
                            serverTimestamp(),
                    }
                );

            }


            // ---------------------------------------------
            // Close + reload
            // ---------------------------------------------

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


    // =====================================================
    // DELETE PROJECT
    // =====================================================

    const removeProject = async (
        id
    ) => {

        if (
            !window.confirm(
                "Delete this project?"
            )
        ) {

            return;

        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "projects",
                    id
                )
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


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="admin-page">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="admin-page-header">

                <div>

                    <h2>
                        Manage Projects
                    </h2>

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


            {/* =================================================
                SEARCH
            ================================================= */}

            <div
                className="admin-card"
                style={{
                    marginBottom:
                        "1.5rem",
                }}
            >

                <div
                    style={{
                        position:
                            "relative",

                        maxWidth:
                            "500px",
                    }}
                >

                    <Search
                        size={18}
                        style={{
                            position:
                                "absolute",

                            left:
                                "0.85rem",

                            top:
                                "50%",

                            transform:
                                "translateY(-50%)",

                            color:
                                "#6b7280",

                            pointerEvents:
                                "none",
                        }}
                    />

                    <input
                        type="text"
                        value={
                            searchTerm
                        }
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                        placeholder="Search projects by name..."
                        style={{
                            width:
                                "100%",

                            padding:
                                "0.75rem 1rem 0.75rem 2.6rem",

                            border:
                                "1px solid #d1d5db",

                            borderRadius:
                                "0.375rem",

                            fontFamily:
                                "inherit",

                            fontSize:
                                "0.95rem",

                            boxSizing:
                                "border-box",

                            outline:
                                "none",
                        }}
                    />

                </div>


                {searchTerm && (

                    <p
                        style={{
                            margin:
                                "0.75rem 0 0",

                            color:
                                "#6b7280",

                            fontSize:
                                "0.9rem",
                        }}
                    >

                        Showing{" "}
                        <strong>
                            {
                                filteredProjects.length
                            }
                        </strong>{" "}
                        project
                        {
                            filteredProjects.length === 1
                                ? ""
                                : "s"
                        }{" "}
                        matching "
                        {searchTerm}
                        ".

                    </p>

                )}

            </div>


            {/* =================================================
                PROJECT TABLE
            ================================================= */}

            <div className="admin-card">

                {loading ? (

                    <p>
                        Loading projects...
                    </p>

                ) : error ? (

                    <p
                        style={{
                            color:
                                "#b91c1c",
                        }}
                    >
                        {error}
                    </p>

                ) : (

                    <div
                        className="admin-table-wrapper"
                    >

                        <table
                            className="admin-table"
                        >

                            <thead>

                            <tr>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Sector
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Budget
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                            </thead>


                            <tbody>

                            {filteredProjects.map(
                                (project) => (

                                    <tr
                                        key={
                                            project.id
                                        }
                                    >

                                        <td>
                                            {
                                                project.name
                                            }
                                        </td>

                                        <td>
                                            {
                                                project.sector
                                            }
                                        </td>

                                        <td>
                                            {
                                                project.status
                                            }
                                        </td>

                                        <td>
                                            {
                                                project.budget
                                            }
                                        </td>

                                        <td>

                                            <div
                                                className="action-btns"
                                            >

                                                {/* EDIT */}

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
                                                        size={
                                                            16
                                                        }
                                                    />

                                                </button>


                                                {/* DELETE */}

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
                                                        size={
                                                            16
                                                        }
                                                    />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )}


                            {filteredProjects.length ===
                                0 && (

                                    <tr>

                                        <td
                                            colSpan="5"
                                            style={{
                                                textAlign:
                                                    "center",

                                                padding:
                                                    "2rem",
                                            }}
                                        >

                                            {searchTerm
                                                ? `No projects found matching "${searchTerm}".`
                                                : "No projects found."}

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            {showModal && (

                <div
                    className="admin-modal-overlay"
                >

                    <div
                        className="admin-modal"
                    >

                        {/* -----------------------------------------
                            MODAL HEADER
                        ----------------------------------------- */}

                        <div
                            style={{
                                display:
                                    "flex",

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
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                                type="button"
                            >

                                <X size={20} />

                            </button>

                        </div>


                        {/* -----------------------------------------
                            ERROR
                        ----------------------------------------- */}

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

                                    borderRadius:
                                        6,
                                }}
                            >

                                {error}

                            </div>

                        )}


                        {/* -----------------------------------------
                            FORM
                        ----------------------------------------- */}

                        <form
                            onSubmit={
                                saveProject
                            }
                        >

                            {/* NAME */}

                            <div
                                className="admin-form-group"
                            >

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


                            {/* SECTOR */}

                            <div
                                className="admin-form-group"
                            >

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


                            {/* STATUS */}

                            <div
                                className="admin-form-group"
                            >

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

                                    <option value="Planning">
                                        Planning
                                    </option>

                                    <option value="Active">
                                        Active
                                    </option>

                                    <option value="Bidding">
                                        Bidding
                                    </option>

                                    <option value="Execution">
                                        Execution
                                    </option>

                                    <option value="Completed">
                                        Completed
                                    </option>

                                    <option value="On Hold">
                                        On Hold
                                    </option>

                                </select>

                            </div>


                            {/* BUDGET */}

                            <div
                                className="admin-form-group"
                            >

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


                            {/* FORM ACTIONS */}

                            <div
                                className="admin-form-actions"
                            >

                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                >

                                    Cancel

                                </button>


                                <button
                                    className="admin-btn"
                                    type="submit"
                                    disabled={
                                        saving
                                    }
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