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

const EMPTY_FORM = {
  title: "",
  client: "",
  value: "",
  status: "Open",
};

const ManageTenders = () => {
  const [tenders, setTenders] =
      useState([]);

  const [loading, setLoading] =
      useState(true);

  const [isModalOpen, setIsModalOpen] =
      useState(false);

  const [editingId, setEditingId] =
      useState(null);

  const [formData, setFormData] =
      useState(EMPTY_FORM);

  const [saving, setSaving] =
      useState(false);

  const [error, setError] =
      useState("");

  const fetchTenders = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(
          collection(db, "tenders")
      );

      setTenders(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
      );
    } catch (err) {
      console.error(
          "Error fetching tenders:",
          err
      );

      setError(
          "Unable to load tenders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const handleInputChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openModal = (
      tenderItem = null
  ) => {
    setError("");

    if (tenderItem) {
      setEditingId(tenderItem.id);

      setFormData({
        title:
            tenderItem.title || "",
        client:
            tenderItem.client || "",
        value:
            tenderItem.value || "",
        status:
            tenderItem.status ||
            "Open",
      });
    } else {
      setEditingId(null);
      setFormData({
        ...EMPTY_FORM,
      });
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        title: formData.title.trim(),
        client: formData.client.trim(),
        value: formData.value.trim(),
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
            doc(db, "tenders", editingId),
            payload
        );
      } else {
        await addDoc(
            collection(db, "tenders"),
            {
              ...payload,
              createdAt:
                  serverTimestamp(),
            }
        );
      }

      closeModal();
      await fetchTenders();
    } catch (err) {
      console.error(
          "Error saving tender:",
          err
      );

      setError(
          err.message ||
          "Failed to save tender."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
        !window.confirm(
            "Are you sure you want to delete this tender?"
        )
    ) {
      return;
    }

    try {
      await deleteDoc(
          doc(db, "tenders", id)
      );

      await fetchTenders();
    } catch (err) {
      console.error(
          "Error deleting tender:",
          err
      );

      alert(
          "Unable to delete tender."
      );
    }
  };

  return (
      <div className="admin-page">

        <div className="admin-page-header">

          <div>
            <h2>Manage Tenders</h2>

            <p
                style={{
                  marginTop: "0.35rem",
                  color: "#6b7280",
                }}
            >
              Manage tender opportunities
              published on GVICE.
            </p>
          </div>

          <button
              className="admin-btn"
              onClick={() => openModal()}
          >
            <Plus size={18} />
            Add Tender
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

                  {tenders.map((item) => (

                      <tr key={item.id}>

                        <td>{item.title}</td>

                        <td>{item.client}</td>

                        <td>{item.value}</td>

                        <td>

                      <span
                          className={`tender-status status-${(
                              item.status ||
                              "Open"
                          )
                              .toLowerCase()
                              .replace(
                                  /\s+/g,
                                  "-"
                              )}`}
                          style={{
                            display:
                                "inline-block",
                            padding:
                                "0.25rem 0.5rem",
                            borderRadius:
                                "0.25rem",
                            fontSize:
                                "0.85rem",
                          }}
                      >
                        {item.status ||
                            "Open"}
                      </span>

                        </td>

                        <td>

                          <div className="action-btns">

                            <button
                                className="icon-action-btn edit"
                                onClick={() =>
                                    openModal(item)
                                }
                                title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                                className="icon-action-btn delete"
                                onClick={() =>
                                    handleDelete(
                                        item.id
                                    )
                                }
                                title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>

                        </td>

                      </tr>

                  ))}

                  {tenders.length ===
                      0 && (

                          <tr>
                            <td
                                colSpan="5"
                                style={{
                                  textAlign:
                                      "center",
                                }}
                            >
                              No tenders found.
                            </td>
                          </tr>

                      )}

                  </tbody>

                </table>

              </div>
          )}

        </div>

        {isModalOpen && (

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
                          "1.5rem",
                    }}
                >

                  <h3
                      style={{
                        margin: 0,
                      }}
                  >
                    {editingId
                        ? "Edit Tender"
                        : "Add New Tender"}
                  </h3>

                  <button
                      className="icon-action-btn"
                      onClick={closeModal}
                      disabled={saving}
                  >
                    <X size={24} />
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
                    onSubmit={handleSubmit}
                >

                  <div className="admin-form-group">

                    <label>
                      Tender Title
                    </label>

                    <input
                        type="text"
                        name="title"
                        value={
                          formData.title
                        }
                        onChange={
                          handleInputChange
                        }
                        required
                    />

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Client
                    </label>

                    <input
                        type="text"
                        name="client"
                        value={
                          formData.client
                        }
                        onChange={
                          handleInputChange
                        }
                        required
                    />

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Value
                    </label>

                    <input
                        type="text"
                        name="value"
                        value={
                          formData.value
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="$1.2B"
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
                          handleInputChange
                        }
                    >
                      <option value="Open">
                        Open
                      </option>

                      <option value="Under Evaluation">
                        Under Evaluation
                      </option>

                      <option value="Awarded">
                        Awarded
                      </option>

                      <option value="Closed">
                        Closed
                      </option>
                    </select>

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
                        type="submit"
                        className="admin-btn"
                        disabled={saving}
                    >
                      {saving
                          ? "Saving..."
                          : editingId
                              ? "Save Changes"
                              : "Publish Tender"}
                    </button>

                  </div>

                </form>

              </div>

            </div>

        )}

      </div>
  );
};

export default ManageTenders;