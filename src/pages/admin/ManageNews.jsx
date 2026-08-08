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
  Upload,
} from "lucide-react";

import { db } from "../../lib/firebase";
import { uploadToCloudinary } from "../../lib/cloudinary";

const getTodayDate = () =>
    new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

const EMPTY_FORM = {
  title: "",
  category: "",
  author: "",
  date: getTodayDate(),
  excerpt: "",
  body: "",
  image: "",
  featured: false,
};

const ManageNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] =
      useState(false);

  const [editingId, setEditingId] =
      useState(null);

  const [formData, setFormData] =
      useState(EMPTY_FORM);

  const [imageFile, setImageFile] =
      useState(null);

  const [imagePreview, setImagePreview] =
      useState("");

  const [saving, setSaving] =
      useState(false);

  const [error, setError] =
      useState("");

  const fetchNews = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(
          collection(db, "news")
      );

      setNews(
          snap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
      );
    } catch (err) {
      console.error(
          "Error fetching news:",
          err
      );

      setError(
          "Unable to load news articles."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleInputChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
          type === "checkbox"
              ? checked
              : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const openModal = (newsItem = null) => {
    setError("");
    setImageFile(null);

    if (newsItem) {
      setEditingId(newsItem.id);

      setFormData({
        title: newsItem.title || "",
        category: newsItem.category || "",
        author: newsItem.author || "",
        date:
            newsItem.date || getTodayDate(),
        excerpt: newsItem.excerpt || "",
        body: newsItem.body || "",
        image: newsItem.image || "",
        featured: Boolean(
            newsItem.featured
        ),
      });

      setImagePreview(
          newsItem.image || ""
      );
    } else {
      setEditingId(null);

      setFormData({
        ...EMPTY_FORM,
        date: getTodayDate(),
      });

      setImagePreview("");
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
    setError("");
    setFormData({
      ...EMPTY_FORM,
      date: getTodayDate(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      let imageUrl = formData.image;

      if (imageFile) {
        imageUrl =
            await uploadToCloudinary(imageFile);
      }

      if (!imageUrl) {
        throw new Error(
            "Please select a news image."
        );
      }

      const payload = {
        title: formData.title.trim(),
        category:
            formData.category.trim(),
        author: formData.author.trim(),
        date: formData.date.trim(),
        excerpt: formData.excerpt.trim(),
        body: formData.body,
        image: imageUrl,
        featured: Boolean(
            formData.featured
        ),
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
            doc(db, "news", editingId),
            payload
        );
      } else {
        await addDoc(
            collection(db, "news"),
            {
              ...payload,
              createdAt:
                  serverTimestamp(),
            }
        );
      }

      closeModal();
      await fetchNews();
    } catch (err) {
      console.error(
          "Error saving news:",
          err
      );

      setError(
          err.message ||
          "Failed to save news article."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
        !window.confirm(
            "Are you sure you want to delete this article?"
        )
    ) {
      return;
    }

    try {
      await deleteDoc(
          doc(db, "news", id)
      );

      await fetchNews();
    } catch (err) {
      console.error(
          "Error deleting news:",
          err
      );

      alert(
          "Unable to delete this article."
      );
    }
  };

  return (
      <div className="admin-page">

        <div className="admin-page-header">

          <div>
            <h2>Manage News</h2>

            <p
                style={{
                  marginTop: "0.35rem",
                  color: "#6b7280",
                }}
            >
              Create and manage GVICE news
              articles.
            </p>
          </div>

          <button
              className="admin-btn"
              onClick={() => openModal()}
          >
            <Plus size={18} />
            Add Article
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
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                  </thead>

                  <tbody>

                  {news.map((item) => (

                      <tr key={item.id}>

                        <td>
                          {item.image ? (
                              <img
                                  src={item.image}
                                  alt={item.title}
                                  style={{
                                    width: 55,
                                    height: 45,
                                    objectFit: "cover",
                                    borderRadius: 6,
                                  }}
                              />
                          ) : (
                              "-"
                          )}
                        </td>

                        <td
                            style={{
                              maxWidth: 300,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow:
                                  "ellipsis",
                            }}
                        >
                          {item.title}
                        </td>

                        <td>
                          {item.category}
                        </td>

                        <td>
                          {item.date}
                        </td>

                        <td>
                          {item.featured
                              ? "Yes"
                              : "No"}
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

                  {news.length === 0 && (

                      <tr>
                        <td
                            colSpan="6"
                            style={{
                              textAlign: "center",
                            }}
                        >
                          No news articles found.
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
                      alignItems: "center",
                      marginBottom:
                          "1.5rem",
                    }}
                >

                  <h3 style={{ margin: 0 }}>
                    {editingId
                        ? "Edit Article"
                        : "Add New Article"}
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
                          marginBottom: "1rem",
                          padding: "0.75rem",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          border:
                              "1px solid #fecaca",
                          borderRadius: 6,
                        }}
                    >
                      {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                  <div className="admin-form-group">
                    <label>Title</label>

                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={
                          handleInputChange
                        }
                        required
                    />
                  </div>

                  <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                      }}
                  >

                    <div
                        className="admin-form-group"
                        style={{ flex: 1 }}
                    >
                      <label>Category</label>

                      <input
                          type="text"
                          name="category"
                          value={
                            formData.category
                          }
                          onChange={
                            handleInputChange
                          }
                          required
                      />
                    </div>

                    <div
                        className="admin-form-group"
                        style={{ flex: 1 }}
                    >
                      <label>Author</label>

                      <input
                          type="text"
                          name="author"
                          value={
                            formData.author
                          }
                          onChange={
                            handleInputChange
                          }
                          required
                      />
                    </div>

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Date
                    </label>

                    <input
                        type="text"
                        name="date"
                        value={formData.date}
                        onChange={
                          handleInputChange
                        }
                        placeholder="July 17, 2026"
                        required
                    />

                  </div>

                  <div className="admin-form-group">

                    <label>
                      News Image
                    </label>

                    <label
                        style={{
                          display: "block",
                          border:
                              "2px dashed #d1d5db",
                          borderRadius: 8,
                          padding: "1rem",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                    >

                      {imagePreview ? (
                          <img
                              src={imagePreview}
                              alt="News preview"
                              style={{
                                maxWidth: "100%",
                                maxHeight: 180,
                                objectFit:
                                    "contain",
                                borderRadius: 6,
                              }}
                          />
                      ) : (
                          <>
                            <Upload
                                size={30}
                                style={{
                                  marginBottom: 8,
                                }}
                            />

                            <div>
                              Click to upload
                              image
                            </div>
                          </>
                      )}

                      <input
                          type="file"
                          accept="image/*"
                          onChange={
                            handleImageChange
                          }
                          hidden
                      />

                    </label>

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Excerpt
                    </label>

                    <textarea
                        name="excerpt"
                        value={
                          formData.excerpt
                        }
                        onChange={
                          handleInputChange
                        }
                        rows="3"
                        required
                    />

                  </div>

                  <div className="admin-form-group">

                    <label>
                      Body
                    </label>

                    <textarea
                        name="body"
                        value={formData.body}
                        onChange={
                          handleInputChange
                        }
                        rows="8"
                        required
                    />

                  </div>

                  <div
                      className="admin-form-group"
                      style={{
                        display: "flex",
                        alignItems:
                            "center",
                        gap: "0.5rem",
                      }}
                  >

                    <input
                        type="checkbox"
                        name="featured"
                        id="featuredNews"
                        checked={
                          formData.featured
                        }
                        onChange={
                          handleInputChange
                        }
                        style={{
                          width: "auto",
                        }}
                    />

                    <label
                        htmlFor="featuredNews"
                        style={{ margin: 0 }}
                    >
                      Featured Article
                    </label>

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
                              : "Publish Article"}
                    </button>

                  </div>

                </form>

              </div>

            </div>

        )}

      </div>
  );
};

export default ManageNews;