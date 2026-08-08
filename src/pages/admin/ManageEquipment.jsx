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
import { useAuth } from "../../context/AuthContext";

const EMPTY_FORM = {
  company: "",
  name: "",
  sector: "oil",
  price: "",
  img: "",
  featured: false,
  specs: [],
};

const ManageEquipment = () => {
  const { user } = useAuth();

  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [ownerUserId, setOwnerUserId] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchEquipment = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(
          collection(db, "equipmentListings")
      );

      const data = snap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setEquipment(data);
    } catch (err) {
      console.error("Error fetching equipment:", err);
      setError("Unable to load equipment listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
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

  const handleSpecChange = (
      index,
      field,
      value
  ) => {
    setFormData((prev) => {
      const specs = [...prev.specs];

      specs[index] = {
        ...specs[index],
        [field]: value,
      };

      return {
        ...prev,
        specs,
      };
    });
  };

  const addSpecRow = () => {
    setFormData((prev) => ({
      ...prev,
      specs: [
        ...prev.specs,
        {
          label: "",
          val: "",
        },
      ],
    }));
  };

  const removeSpecRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      specs: prev.specs.filter(
          (_, i) => i !== index
      ),
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

  const openModal = (item = null) => {
    setError("");
    setImageFile(null);

    if (item) {
      setEditingId(item.id);

      setFormData({
        company: item.company || "",
        name: item.name || "",
        sector: item.sector || "oil",
        price: item.price || "",
        img: item.img || "",
        featured: Boolean(item.featured),
        specs: Array.isArray(item.specs)
            ? item.specs
            : [],
      });

      setOwnerUserId(item.userId || "");
      setOwnerEmail(item.userEmail || "");

      setImagePreview(item.img || "");
    } else {
      setEditingId(null);

      setFormData({
        ...EMPTY_FORM,
        specs: [],
      });

      /*
       * New equipment created from the Admin panel
       * belongs to the currently logged-in user.
       */
      setOwnerUserId(user?.uid || "");
      setOwnerEmail(user?.email || "");

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
    setOwnerUserId("");
    setOwnerEmail("");

    setFormData({
      ...EMPTY_FORM,
      specs: [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError(
          "You must be logged in to manage equipment."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      let imageUrl = formData.img;

      if (imageFile) {
        imageUrl =
            await uploadToCloudinary(imageFile);
      }

      if (!imageUrl) {
        throw new Error(
            "Please select an equipment image."
        );
      }

      /*
       * For a NEW listing:
       *   ownerUserId = current logged-in admin UID
       *
       * For an EXISTING listing:
       *   preserve the existing owner.
       *
       * This prevents editing an old listing from
       * accidentally changing its ownership.
       */
      const finalOwnerUserId =
          ownerUserId || user.uid;

      const finalOwnerEmail =
          ownerEmail || user.email || "";

      const payload = {
        company: formData.company.trim(),
        name: formData.name.trim(),
        sector: formData.sector,
        price: formData.price.trim(),
        img: imageUrl,
        featured: Boolean(formData.featured),

        /*
         * Ownership fields
         */
        userId: finalOwnerUserId,
        userEmail: finalOwnerEmail,

        specs: formData.specs.filter(
            (spec) =>
                spec.label?.trim() &&
                spec.val?.trim()
        ),

        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(
            doc(
                db,
                "equipmentListings",
                editingId
            ),
            payload
        );
      } else {
        await addDoc(
            collection(db, "equipmentListings"),
            {
              ...payload,
              createdAt: serverTimestamp(),
            }
        );
      }

      closeModal();

      await fetchEquipment();
    } catch (err) {
      console.error(
          "Error saving equipment:",
          err
      );

      setError(
          err.message ||
          "Failed to save equipment listing."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
        "Are you sure you want to delete this equipment listing?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(
          doc(
              db,
              "equipmentListings",
              id
          )
      );

      await fetchEquipment();
    } catch (err) {
      console.error(
          "Error deleting equipment:",
          err
      );

      alert(
          "Unable to delete equipment listing."
      );
    }
  };

  return (
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2>Manage Equipment</h2>

            <p
                style={{
                  marginTop: "0.35rem",
                  color: "#6b7280",
                }}
            >
              Manage equipment listings available
              in the auction platform.
            </p>
          </div>

          <button
              className="admin-btn"
              onClick={() => openModal()}
          >
            <Plus size={18} />
            Add Equipment
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
                    <th>Image</th>
                    <th>Equipment</th>
                    <th>Company</th>
                    <th>Owner</th>
                    <th>Sector</th>
                    <th>Price</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                  </thead>

                  <tbody>
                  {equipment.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.img ? (
                              <img
                                  src={item.img}
                                  alt={item.name}
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

                        <td>
                          {item.name}
                        </td>

                        <td>
                          {item.company}
                        </td>

                        <td>
                          <div>
                            <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: 500,
                                }}
                            >
                              {item.userEmail ||
                                  "No owner"}
                            </div>

                            {item.userId && (
                                <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#9ca3af",
                                      marginTop: "0.2rem",
                                    }}
                                >
                                  {item.userId}
                                </div>
                            )}
                          </div>
                        </td>

                        <td
                            style={{
                              textTransform:
                                  "capitalize",
                            }}
                        >
                          {item.sector}
                        </td>

                        <td>
                          {item.price}
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

                  {equipment.length === 0 && (
                      <tr>
                        <td
                            colSpan="8"
                            style={{
                              textAlign: "center",
                            }}
                        >
                          No equipment listings found.
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
                      marginBottom: "1.5rem",
                    }}
                >
                  <h3 style={{ margin: 0 }}>
                    {editingId
                        ? "Edit Equipment"
                        : "Add New Equipment"}
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
                    <label>
                      Equipment Name
                    </label>

                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Seller Company
                    </label>

                    <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
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
                      <label>Sector</label>

                      <select
                          name="sector"
                          value={formData.sector}
                          onChange={handleInputChange}
                      >
                        <option value="oil">
                          Oil & Gas
                        </option>

                        <option value="civil">
                          Civil
                        </option>

                        <option value="marine">
                          Marine
                        </option>
                      </select>
                    </div>

                    <div
                        className="admin-form-group"
                        style={{ flex: 1 }}
                    >
                      <label>
                        Asking Price
                      </label>

                      <input
                          type="text"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          placeholder="$4,200,000"
                          required
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label>
                      Equipment Image
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
                              alt="Equipment preview"
                              style={{
                                maxWidth: "100%",
                                maxHeight: 180,
                                objectFit: "contain",
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
                              Click to upload image
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
                    <div
                        style={{
                          display: "flex",
                          justifyContent:
                              "space-between",
                          alignItems: "center",
                          marginBottom:
                              "0.5rem",
                        }}
                    >
                      <label
                          style={{ margin: 0 }}
                      >
                        Specifications
                      </label>

                      <button
                          type="button"
                          onClick={addSpecRow}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#3b82f6",
                            cursor: "pointer",
                          }}
                      >
                        + Add Spec
                      </button>
                    </div>

                    {formData.specs.map(
                        (spec, index) => (
                            <div
                                key={index}
                                style={{
                                  display: "flex",
                                  gap: "0.5rem",
                                  marginBottom:
                                      "0.5rem",
                                }}
                            >
                              <input
                                  type="text"
                                  placeholder="Label"
                                  value={
                                    spec.label
                                  }
                                  onChange={(e) =>
                                      handleSpecChange(
                                          index,
                                          "label",
                                          e.target.value
                                      )
                                  }
                                  style={{
                                    flex: 1,
                                  }}
                                  required
                              />

                              <input
                                  type="text"
                                  placeholder="Value"
                                  value={
                                    spec.val
                                  }
                                  onChange={(e) =>
                                      handleSpecChange(
                                          index,
                                          "val",
                                          e.target.value
                                      )
                                  }
                                  style={{
                                    flex: 1,
                                  }}
                                  required
                              />

                              <button
                                  type="button"
                                  className="icon-action-btn delete"
                                  onClick={() =>
                                      removeSpecRow(
                                          index
                                      )
                                  }
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                        )
                    )}

                    {formData.specs.length ===
                        0 && (
                            <p
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#6b7280",
                                  fontStyle: "italic",
                                }}
                            >
                              No specifications added.
                            </p>
                        )}
                  </div>

                  <div
                      className="admin-form-group"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                  >
                    <input
                        type="checkbox"
                        name="featured"
                        id="featuredEquipment"
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
                        htmlFor="featuredEquipment"
                        style={{ margin: 0 }}
                    >
                      Featured Listing
                    </label>
                  </div>

                  <div
                      className="admin-form-group"
                      style={{
                        padding: "0.75rem",
                        background: "#f9fafb",
                        borderRadius: 6,
                        fontSize: "0.85rem",
                      }}
                  >
                    <strong>
                      Listing Owner
                    </strong>

                    <div
                        style={{
                          marginTop: "0.35rem",
                          color: "#6b7280",
                          wordBreak: "break-all",
                        }}
                    >
                      {ownerEmail ||
                          user?.email ||
                          "Current administrator"}
                    </div>
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
                              : "Publish Listing"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
};

export default ManageEquipment;