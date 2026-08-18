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
  Search,
} from "lucide-react";

import { db } from "../../lib/firebase";

import "./Admin.css";


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
      useState({
        ...EMPTY_FORM,
      });

  const [searchTerm, setSearchTerm] =
      useState("");

  const [saving, setSaving] =
      useState(false);

  const [error, setError] =
      useState("");


  // =====================================================
  // FETCH TENDERS
  // =====================================================

  const fetchTenders = async () => {

    setLoading(true);
    setError("");

    try {

      const snap =
          await getDocs(
              collection(db, "tenders")
          );


      /*
       * IMPORTANT:
       *
       * Firestore data FIRST.
       * Real Firestore document ID LAST.
       *
       * This guarantees that the actual document
       * ID is used internally even if an old
       * document contains an "id" field.
       */

      setTenders(
          snap.docs.map((item) => ({
            ...item.data(),
            id: item.id,
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


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchTenders();

  }, []);


  // =====================================================
  // FILTERED TENDERS
  // =====================================================

  const filteredTenders =
      useMemo(() => {

        const search =
            searchTerm
                .trim()
                .toLowerCase();


        if (!search) {

          return tenders;

        }


        return tenders.filter(
            (tender) =>
                (
                    tender.title ||
                    ""
                )
                    .toLowerCase()
                    .includes(search)
        );

      }, [
        tenders,
        searchTerm,
      ]);


  // =====================================================
  // INPUT CHANGE
  // =====================================================

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


  // =====================================================
  // OPEN MODAL
  // =====================================================

  const openModal = (
      tenderItem = null
  ) => {

    setError("");

    if (tenderItem) {

      setEditingId(
          tenderItem.id
      );

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


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {

    if (saving) {

      return;

    }


    setIsModalOpen(false);

    setEditingId(null);

    setFormData({
      ...EMPTY_FORM,
    });

    setError("");

  };


  // =====================================================
  // SAVE TENDER
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setSaving(true);
    setError("");


    try {

      // ---------------------------------------------
      // Validation
      // ---------------------------------------------

      const title =
          formData.title.trim();

      const client =
          formData.client.trim();

      const value =
          formData.value.trim();


      if (!title) {

        throw new Error(
            "Tender title is required."
        );

      }


      if (!client) {

        throw new Error(
            "Client is required."
        );

      }


      if (!value) {

        throw new Error(
            "Tender value is required."
        );

      }


      // ---------------------------------------------
      // Payload
      // ---------------------------------------------

      const payload = {

        title,

        client,

        value,

        status:
            formData.status ||
            "Open",

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
                "tenders",
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
                "tenders"
            ),
            {
              ...payload,

              createdAt:
                  serverTimestamp(),
            }
        );

      }


      // ---------------------------------------------
      // Close + refresh
      // ---------------------------------------------

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


  // =====================================================
  // DELETE TENDER
  // =====================================================

  const handleDelete = async (
      id
  ) => {

    if (
        !window.confirm(
            "Are you sure you want to delete this tender?"
        )
    ) {

      return;

    }


    try {

      await deleteDoc(
          doc(
              db,
              "tenders",
              id
          )
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
              Manage Tenders
            </h2>

            <p
                style={{
                  marginTop:
                      "0.35rem",

                  color:
                      "#6b7280",
                }}
            >
              Manage tender opportunities
              published on GVICE.
            </p>

          </div>


          <button
              className="admin-btn"
              onClick={() =>
                  openModal()
              }
          >

            <Plus size={18} />

            Add Tender

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
                placeholder="Search tenders by title..."
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
                    filteredTenders.length
                  }
                </strong>{" "}

                tender
                {
                  filteredTenders.length === 1
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
                TABLE
            ================================================= */}

        <div className="admin-card">

          {loading ? (

              <p>
                Loading tenders...
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
                      Title
                    </th>

                    <th>
                      Client
                    </th>

                    <th>
                      Value
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                  </thead>


                  <tbody>

                  {filteredTenders.map(
                      (item) => (

                          <tr
                              key={
                                item.id
                              }
                          >

                            <td>
                              {
                                item.title
                              }
                            </td>

                            <td>
                              {
                                item.client
                              }
                            </td>

                            <td>
                              {
                                item.value
                              }
                            </td>


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

                                                    {
                                                        item.status ||
                                                        "Open"
                                                    }

                                                </span>

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
                                      size={
                                        16
                                      }
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


                  {filteredTenders.length ===
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
                                  ? `No tenders found matching "${searchTerm}".`
                                  : "No tenders found."}

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
                      handleSubmit
                    }
                >


                  {/* TITLE */}

                  <div
                      className="admin-form-group"
                  >

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


                  {/* CLIENT */}

                  <div
                      className="admin-form-group"
                  >

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


                  {/* VALUE */}

                  <div
                      className="admin-form-group"
                  >

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
                          saving
                        }
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