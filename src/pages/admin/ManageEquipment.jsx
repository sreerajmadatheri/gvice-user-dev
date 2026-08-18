import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Search,
} from "lucide-react";

import { db } from "../../lib/firebase";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { useAuth } from "../../context/AuthContext";

import "./Admin.css";


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


  // =====================================================
  // EQUIPMENT STATE
  // =====================================================

  const [equipment, setEquipment] =
      useState([]);

  const [loading, setLoading] =
      useState(true);


  // =====================================================
  // USERS / OWNERS STATE
  // =====================================================

  const [users, setUsers] =
      useState([]);

  const [usersLoading, setUsersLoading] =
      useState(true);


  // =====================================================
  // MODAL STATE
  // =====================================================

  const [isModalOpen, setIsModalOpen] =
      useState(false);

  const [editingId, setEditingId] =
      useState(null);


  // =====================================================
  // FORM STATE
  // =====================================================

  const [formData, setFormData] =
      useState({
        ...EMPTY_FORM,
        specs: [],
      });


  // =====================================================
  // OWNER STATE
  // =====================================================

  const [ownerUserId, setOwnerUserId] =
      useState("");

  const [ownerEmail, setOwnerEmail] =
      useState("");


  // =====================================================
  // IMAGE STATE
  // =====================================================

  const [imageFile, setImageFile] =
      useState(null);

  const [imagePreview, setImagePreview] =
      useState("");


  // =====================================================
  // UI STATE
  // =====================================================

  const [saving, setSaving] =
      useState(false);

  const [error, setError] =
      useState("");


  // =====================================================
  // SEARCH
  // =====================================================

  const [searchTerm, setSearchTerm] =
      useState("");


  // =====================================================
  // FETCH EQUIPMENT
  // =====================================================

  const fetchEquipment = async () => {

    setLoading(true);
    setError("");

    try {

      const snap =
          await getDocs(
              collection(
                  db,
                  "equipmentListings"
              )
          );


      /*
       * IMPORTANT:
       *
       * Firestore data FIRST.
       * Actual Firestore document ID LAST.
       */

      const data =
          snap.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }));


      setEquipment(data);

    } catch (err) {

      console.error(
          "Error fetching equipment:",
          err
      );

      setError(
          "Unable to load equipment listings."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = async () => {

    setUsersLoading(true);

    try {

      const snap =
          await getDocs(
              collection(
                  db,
                  "users"
              )
          );


      const data =
          snap.docs.map((item) => ({
            ...item.data(),
            id: item.id,
          }));


      /*
       * Sort users by display name / email
       * to make the owner dropdown easier to use.
       */

      data.sort((a, b) => {

        const aName =
            (
                a.displayName ||
                a.email ||
                ""
            ).toLowerCase();

        const bName =
            (
                b.displayName ||
                b.email ||
                ""
            ).toLowerCase();

        return aName.localeCompare(
            bName
        );

      });


      setUsers(data);

    } catch (err) {

      console.error(
          "Error fetching users:",
          err
      );

      setError(
          "Unable to load registered users."
      );

    } finally {

      setUsersLoading(false);

    }

  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchEquipment();
    fetchUsers();

  }, []);


  // =====================================================
  // FILTER EQUIPMENT
  // =====================================================

  const filteredEquipment =
      useMemo(() => {

        const search =
            searchTerm
                .trim()
                .toLowerCase();


        if (!search) {

          return equipment;

        }


        return equipment.filter(
            (item) =>
                (
                    item.name ||
                    ""
                )
                    .toLowerCase()
                    .includes(search)
        );

      }, [
        equipment,
        searchTerm,
      ]);


  // =====================================================
  // INPUT CHANGE
  // =====================================================

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


  // =====================================================
  // OWNER CHANGE
  // =====================================================

  const handleOwnerChange = (e) => {

    const selectedUserId =
        e.target.value;


    setOwnerUserId(
        selectedUserId
    );


    const selectedUser =
        users.find(
            (item) =>
                item.id ===
                selectedUserId
        );


    setOwnerEmail(
        selectedUser?.email ||
        ""
    );

  };


  // =====================================================
  // SPECIFICATION CHANGE
  // =====================================================

  const handleSpecChange = (
      index,
      field,
      value
  ) => {

    setFormData((prev) => {

      const specs = [
        ...prev.specs,
      ];


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


  // =====================================================
  // ADD SPECIFICATION
  // =====================================================

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


  // =====================================================
  // REMOVE SPECIFICATION
  // =====================================================

  const removeSpecRow = (
      index
  ) => {

    setFormData((prev) => ({

      ...prev,

      specs:
          prev.specs.filter(
              (_, i) =>
                  i !== index
          ),

    }));

  };


  // =====================================================
  // IMAGE CHANGE
  // =====================================================

  const handleImageChange = (e) => {

    const file =
        e.target.files?.[0];


    if (!file) {

      return;

    }


    setImageFile(file);


    const reader =
        new FileReader();


    reader.onloadend = () => {

      setImagePreview(
          reader.result
      );

    };


    reader.readAsDataURL(file);

  };


  // =====================================================
  // OPEN MODAL
  // =====================================================

  const openModal = (
      item = null
  ) => {

    setError("");
    setImageFile(null);


    if (item) {

      // -----------------------------------------------
      // EDIT EXISTING
      // -----------------------------------------------

      setEditingId(
          item.id
      );


      setFormData({

        company:
            item.company || "",

        name:
            item.name || "",

        sector:
            item.sector || "oil",

        price:
            item.price || "",

        img:
            item.img || "",

        featured:
            Boolean(
                item.featured
            ),

        specs:
            Array.isArray(
                item.specs
            )
                ? item.specs
                : [],

      });


      /*
       * Preserve existing owner.
       */

      setOwnerUserId(
          item.userId || ""
      );

      setOwnerEmail(
          item.userEmail || ""
      );


      setImagePreview(
          item.img || ""
      );

    } else {

      // -----------------------------------------------
      // NEW EQUIPMENT
      // -----------------------------------------------

      setEditingId(null);


      setFormData({
        ...EMPTY_FORM,
        specs: [],
      });


      /*
       * Default the owner to the
       * currently logged-in admin.
       *
       * Admin can change this using
       * the Owner dropdown.
       */

      setOwnerUserId(
          user?.uid || ""
      );

      setOwnerEmail(
          user?.email || ""
      );


      setImagePreview("");

    }


    setIsModalOpen(true);

  };


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {

    if (saving) {

      return;

    }


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


  // =====================================================
  // SAVE EQUIPMENT
  // =====================================================

  const handleSubmit = async (
      e
  ) => {

    e.preventDefault();


    if (!user) {

      setError(
          "You must be logged in to manage equipment."
      );

      return;

    }


    // -----------------------------------------------
    // OWNER REQUIRED
    // -----------------------------------------------

    if (!ownerUserId) {

      setError(
          "Please select an equipment owner."
      );

      return;

    }


    setSaving(true);
    setError("");


    try {

      // ---------------------------------------------
      // IMAGE
      // ---------------------------------------------

      let imageUrl =
          formData.img;


      if (imageFile) {

        imageUrl =
            await uploadToCloudinary(
                imageFile
            );

      }


      if (!imageUrl) {

        throw new Error(
            "Please select an equipment image."
        );

      }


      // ---------------------------------------------
      // FIND SELECTED OWNER
      // ---------------------------------------------

      const selectedOwner =
          users.find(
              (item) =>
                  item.id ===
                  ownerUserId
          );


      const finalOwnerEmail =
          selectedOwner?.email ||
          ownerEmail ||
          "";


      // ---------------------------------------------
      // PAYLOAD
      // ---------------------------------------------

      const payload = {

        company:
            formData.company.trim(),

        name:
            formData.name.trim(),

        sector:
        formData.sector,

        price:
            formData.price.trim(),

        img:
        imageUrl,

        featured:
            Boolean(
                formData.featured
            ),


        /*
         * IMPORTANT:
         *
         * These fields make the listing
         * belong to the selected user.
         *
         * Auction uses userId to determine
         * whether the current user owns
         * the equipment.
         */

        userId:
        ownerUserId,

        userEmail:
        finalOwnerEmail,


        specs:
            formData.specs.filter(
                (spec) =>
                    spec.label?.trim() &&
                    spec.val?.trim()
            ),


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
                "equipmentListings",
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
                "equipmentListings"
            ),
            {
              ...payload,

              createdAt:
                  serverTimestamp(),
            }
        );

      }


      // ---------------------------------------------
      // CLOSE + REFRESH
      // ---------------------------------------------

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


  // =====================================================
  // DELETE EQUIPMENT
  // =====================================================

  const handleDelete = async (
      id
  ) => {

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this equipment listing?"
        );


    if (!confirmed) {

      return;

    }


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
              Manage Equipment
            </h2>

            <p
                style={{
                  marginTop:
                      "0.35rem",

                  color:
                      "#6b7280",
                }}
            >
              Manage equipment listings
              available in the auction
              platform.
            </p>

          </div>


          <button
              className="admin-btn"
              onClick={() =>
                  openModal()
              }
          >

            <Plus size={18} />

            Add Equipment

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
                placeholder="Search equipment by name..."
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
                    filteredEquipment.length
                  }
                </strong>{" "}

                equipment listing
                {
                  filteredEquipment.length ===
                  1
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
          EQUIPMENT TABLE
      ================================================= */}

        <div className="admin-card">

          {loading ? (

              <p>
                Loading equipment...
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
                      Image
                    </th>

                    <th>
                      Equipment
                    </th>

                    <th>
                      Company
                    </th>

                    <th>
                      Owner
                    </th>

                    <th>
                      Sector
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Featured
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                  </thead>


                  <tbody>

                  {filteredEquipment.map(
                      (item) => (

                          <tr
                              key={
                                item.id
                              }
                          >

                            <td>

                              {item.img ? (

                                  <img
                                      src={
                                        item.img
                                      }
                                      alt={
                                        item.name
                                      }
                                      style={{
                                        width:
                                            55,

                                        height:
                                            45,

                                        objectFit:
                                            "cover",

                                        borderRadius:
                                            6,
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

                              {item.userEmail ||
                                  "No owner"}

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

                              <div
                                  className="action-btns"
                              >

                                <button
                                    className="icon-action-btn edit"
                                    onClick={() =>
                                        openModal(
                                            item
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
                                        handleDelete(
                                            item.id
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


                  {filteredEquipment.length ===
                      0 && (

                          <tr>

                            <td
                                colSpan="8"
                                style={{
                                  textAlign:
                                      "center",

                                  padding:
                                      "2rem",
                                }}
                            >

                              {searchTerm
                                  ? `No equipment found matching "${searchTerm}".`
                                  : "No equipment listings found."}

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

        {isModalOpen && (

            <div
                className="admin-modal-overlay"
            >

              <div
                  className="admin-modal"
              >

                {/* ---------------------------------------------
                HEADER
            --------------------------------------------- */}

                <div
                    style={{
                      display:
                          "flex",

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
                        ? "Edit Equipment"
                        : "Add New Equipment"}

                  </h3>


                  <button
                      type="button"
                      className="icon-action-btn"
                      onClick={
                        closeModal
                      }
                      disabled={
                        saving
                      }
                  >

                    <X size={24} />

                  </button>

                </div>


                {/* ---------------------------------------------
                ERROR
            --------------------------------------------- */}

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


                {/* ---------------------------------------------
                FORM
            --------------------------------------------- */}

                <form
                    onSubmit={
                      handleSubmit
                    }
                >

                  {/* EQUIPMENT NAME */}

                  <div
                      className="admin-form-group"
                  >

                    <label>
                      Equipment Name
                    </label>

                    <input
                        type="text"
                        name="name"
                        value={
                          formData.name
                        }
                        onChange={
                          handleInputChange
                        }
                        required
                    />

                  </div>


                  {/* SELLER COMPANY */}

                  <div
                      className="admin-form-group"
                  >

                    <label>
                      Seller Company
                    </label>

                    <input
                        type="text"
                        name="company"
                        value={
                          formData.company
                        }
                        onChange={
                          handleInputChange
                        }
                        required
                    />

                  </div>


                  {/* OWNER */}

                  <div
                      className="admin-form-group"
                  >

                    <label>
                      Equipment Owner
                    </label>

                    <select
                        value={
                          ownerUserId
                        }
                        onChange={
                          handleOwnerChange
                        }
                        disabled={
                            usersLoading ||
                            saving
                        }
                        required
                    >

                      <option value="">
                        {usersLoading
                            ? "Loading users..."
                            : "Select equipment owner"}
                      </option>


                      {users.map(
                          (item) => (

                              <option
                                  key={
                                    item.id
                                  }
                                  value={
                                    item.id
                                  }
                              >

                                {
                                    item.displayName ||
                                    item.email ||
                                    item.id
                                }

                                {item.email &&
                                item.displayName
                                    ? ` — ${item.email}`
                                    : ""}

                              </option>

                          )
                      )}

                    </select>


                    <p
                        style={{
                          margin:
                              "0.35rem 0 0",

                          fontSize:
                              "0.8rem",

                          color:
                              "#6b7280",
                        }}
                    >

                      The selected user will
                      be treated as the owner
                      of this equipment and
                      cannot bid on their own
                      listing.

                    </p>

                  </div>


                  {/* SECTOR + PRICE */}

                  <div
                      style={{
                        display:
                            "flex",

                        gap:
                            "1rem",
                      }}
                  >

                    <div
                        className="admin-form-group"
                        style={{
                          flex: 1,
                        }}
                    >

                      <label>
                        Sector
                      </label>

                      <select
                          name="sector"
                          value={
                            formData.sector
                          }
                          onChange={
                            handleInputChange
                          }
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
                        style={{
                          flex: 1,
                        }}
                    >

                      <label>
                        Asking Price
                      </label>

                      <input
                          type="text"
                          name="price"
                          value={
                            formData.price
                          }
                          onChange={
                            handleInputChange
                          }
                          placeholder="$4,200,000"
                          required
                      />

                    </div>

                  </div>


                  {/* IMAGE */}

                  <div
                      className="admin-form-group"
                  >

                    <label>
                      Equipment Image
                    </label>


                    <label
                        style={{
                          display:
                              "block",

                          border:
                              "2px dashed #d1d5db",

                          borderRadius:
                              8,

                          padding:
                              "1rem",

                          cursor:
                              "pointer",

                          textAlign:
                              "center",
                        }}
                    >

                      {imagePreview ? (

                          <img
                              src={
                                imagePreview
                              }
                              alt="Equipment preview"
                              style={{
                                maxWidth:
                                    "100%",

                                maxHeight:
                                    180,

                                objectFit:
                                    "contain",

                                borderRadius:
                                    6,
                              }}
                          />

                      ) : (

                          <>

                            <Upload
                                size={30}
                                style={{
                                  marginBottom:
                                      8,
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


                  {/* SPECIFICATIONS */}

                  <div
                      className="admin-form-group"
                  >

                    <div
                        style={{
                          display:
                              "flex",

                          justifyContent:
                              "space-between",

                          alignItems:
                              "center",

                          marginBottom:
                              "0.5rem",
                        }}
                    >

                      <label
                          style={{
                            margin: 0,
                          }}
                      >
                        Specifications
                      </label>


                      <button
                          type="button"
                          onClick={
                            addSpecRow
                          }
                          style={{
                            background:
                                "none",

                            border:
                                "none",

                            color:
                                "#3b82f6",

                            cursor:
                                "pointer",
                          }}
                      >

                        + Add Spec

                      </button>

                    </div>


                    {formData.specs.map(
                        (
                            spec,
                            index
                        ) => (

                            <div
                                key={
                                  index
                                }
                                style={{
                                  display:
                                      "flex",

                                  gap:
                                      "0.5rem",

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
                                  title="Remove specification"
                              >

                                <Trash2
                                    size={18}
                                />

                              </button>

                            </div>

                        )
                    )}


                    {formData.specs.length ===
                        0 && (

                            <p
                                style={{
                                  fontSize:
                                      "0.85rem",

                                  color:
                                      "#6b7280",

                                  fontStyle:
                                      "italic",
                                }}
                            >

                              No specifications added.

                            </p>

                        )}

                  </div>


                  {/* FEATURED */}

                  <div
                      className="admin-form-group"
                      style={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            "0.5rem",
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
                          width:
                              "auto",
                        }}
                    />


                    <label
                        htmlFor="featuredEquipment"
                        style={{
                          margin: 0,
                        }}
                    >

                      Featured Listing

                    </label>

                  </div>


                  {/* OWNER INFO */}

                  <div
                      className="admin-form-group"
                      style={{
                        padding:
                            "0.75rem",

                        background:
                            "#f9fafb",

                        borderRadius:
                            6,

                        fontSize:
                            "0.85rem",
                      }}
                  >

                    <strong>
                      Listing Owner
                    </strong>


                    <div
                        style={{
                          marginTop:
                              "0.35rem",

                          color:
                              "#6b7280",

                          wordBreak:
                              "break-all",
                        }}
                    >

                      {ownerEmail ||
                          "No owner selected"}

                    </div>

                  </div>


                  {/* ACTIONS */}

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
                        type="submit"
                        className="admin-btn"
                        disabled={
                            saving ||
                            usersLoading
                        }
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