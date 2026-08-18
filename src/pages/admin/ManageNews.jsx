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

  const [news, setNews] =
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

  const [imageFile, setImageFile] =
      useState(null);

  const [imagePreview, setImagePreview] =
      useState("");

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
  // FETCH NEWS
  // =====================================================

  const fetchNews = async () => {

    setLoading(true);
    setError("");

    try {

      const snap =
          await getDocs(
              collection(db, "news")
          );


      /*
       * IMPORTANT:
       *
       * Firestore data FIRST.
       * Real Firestore document ID LAST.
       *
       * This guarantees that the actual
       * Firestore document ID is retained.
       */

      setNews(
          snap.docs.map((item) => ({
            ...item.data(),
            id: item.id,
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


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchNews();

  }, []);


  // =====================================================
  // FILTER NEWS
  // =====================================================

  const filteredNews =
      useMemo(() => {

        const search =
            searchTerm
                .trim()
                .toLowerCase();


        // Empty search = show everything

        if (!search) {

          return news;

        }


        // Search by title

        return news.filter(
            (item) =>
                (
                    item.title ||
                    ""
                )
                    .toLowerCase()
                    .includes(search)
        );

      }, [
        news,
        searchTerm,
      ]);


  // =====================================================
  // FORM INPUT CHANGE
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
      newsItem = null
  ) => {

    setError("");

    setImageFile(null);


    if (newsItem) {

      setEditingId(
          newsItem.id
      );


      setFormData({

        title:
            newsItem.title || "",

        category:
            newsItem.category || "",

        author:
            newsItem.author || "",

        date:
            newsItem.date ||
            getTodayDate(),

        excerpt:
            newsItem.excerpt || "",

        body:
            newsItem.body || "",

        image:
            newsItem.image || "",

        featured:
            Boolean(
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


    setFormData({
      ...EMPTY_FORM,
      date: getTodayDate(),
    });

  };


  // =====================================================
  // SAVE NEWS
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setSaving(true);
    setError("");


    try {

      // -------------------------------------------------
      // IMAGE
      // -------------------------------------------------

      let imageUrl =
          formData.image;


      if (imageFile) {

        imageUrl =
            await uploadToCloudinary(
                imageFile
            );

      }


      if (!imageUrl) {

        throw new Error(
            "Please select a news image."
        );

      }


      // -------------------------------------------------
      // PAYLOAD
      // -------------------------------------------------

      const payload = {

        title:
            formData.title.trim(),

        category:
            formData.category.trim(),

        author:
            formData.author.trim(),

        date:
            formData.date.trim(),

        excerpt:
            formData.excerpt.trim(),

        body:
        formData.body,

        image:
        imageUrl,

        featured:
            Boolean(
                formData.featured
            ),

        updatedAt:
            serverTimestamp(),

      };


      // -------------------------------------------------
      // UPDATE
      // -------------------------------------------------

      if (editingId) {

        await updateDoc(
            doc(
                db,
                "news",
                editingId
            ),
            payload
        );

      }


          // -------------------------------------------------
          // CREATE
      // -------------------------------------------------

      else {

        await addDoc(
            collection(
                db,
                "news"
            ),
            {
              ...payload,

              createdAt:
                  serverTimestamp(),
            }
        );

      }


      // -------------------------------------------------
      // CLOSE + REFRESH
      // -------------------------------------------------

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


  // =====================================================
  // DELETE NEWS
  // =====================================================

  const handleDelete = async (
      id
  ) => {

    if (
        !window.confirm(
            "Are you sure you want to delete this article?"
        )
    ) {

      return;

    }


    try {

      await deleteDoc(
          doc(
              db,
              "news",
              id
          )
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
              Manage News
            </h2>

            <p
                style={{
                  marginTop:
                      "0.35rem",

                  color:
                      "#6b7280",
                }}
            >
              Create and manage GVICE
              news articles.
            </p>

          </div>


          <button
              className="admin-btn"
              onClick={() =>
                  openModal()
              }
          >

            <Plus size={18} />

            Add Article

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
                placeholder="Search news by title..."
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


          {/* Search result count */}

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
                    filteredNews.length
                  }
                </strong>{" "}

                article
                {
                  filteredNews.length === 1
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
          NEWS TABLE
      ================================================= */}

        <div className="admin-card">

          {loading ? (

              <p>
                Loading news...
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
                      Title
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Date
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

                  {filteredNews.map(
                      (item) => (

                          <tr
                              key={
                                item.id
                              }
                          >

                            {/* IMAGE */}

                            <td>

                              {item.image ? (

                                  <img
                                      src={
                                        item.image
                                      }
                                      alt={
                                        item.title
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


                            {/* TITLE */}

                            <td
                                style={{
                                  maxWidth:
                                      300,

                                  whiteSpace:
                                      "nowrap",

                                  overflow:
                                      "hidden",

                                  textOverflow:
                                      "ellipsis",
                                }}
                            >

                              {item.title}

                            </td>


                            {/* CATEGORY */}

                            <td>
                              {item.category}
                            </td>


                            {/* DATE */}

                            <td>
                              {item.date}
                            </td>


                            {/* FEATURED */}

                            <td>

                              {item.featured
                                  ? "Yes"
                                  : "No"}

                            </td>


                            {/* ACTIONS */}

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


                  {/* NO RESULTS */}

                  {filteredNews.length ===
                      0 && (

                          <tr>

                            <td
                                colSpan="6"
                                style={{
                                  textAlign:
                                      "center",

                                  padding:
                                      "2rem",
                                }}
                            >

                              {searchTerm
                                  ? `No news articles found matching "${searchTerm}".`
                                  : "No news articles found."}

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
                MODAL HEADER
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
                        ? "Edit Article"
                        : "Add New Article"}

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

                  {/* TITLE */}

                  <div
                      className="admin-form-group"
                  >

                    <label>
                      Title
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


                  {/* CATEGORY + AUTHOR */}

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
                        Category
                      </label>

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
                        style={{
                          flex: 1,
                        }}
                    >

                      <label>
                        Author
                      </label>

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


                  {/* DATE */}

                  <div
                      className="admin-form-group"
                  >

                    <label>
                      Date
                    </label>

                    <input
                        type="text"
                        name="date"
                        value={
                          formData.date
                        }
                        onChange={
                          handleInputChange
                        }
                        placeholder="July 17, 2026"
                        required
                    />

                  </div>


                  {/* IMAGE */}

                  <div
                      className="admin-form-group"
                  >

                    <label>
                      News Image
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
                              alt="News preview"
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


                  {/* EXCERPT */}

                  <div
                      className="admin-form-group"
                  >

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


                  {/* BODY */}

                  <div
                      className="admin-form-group"
                  >

                    <label>
                      Body
                    </label>

                    <textarea
                        name="body"
                        value={
                          formData.body
                        }
                        onChange={
                          handleInputChange
                        }
                        rows="8"
                        required
                    />

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
                        id="featuredNews"
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
                        htmlFor="featuredNews"
                        style={{
                          margin: 0,
                        }}
                    >

                      Featured Article

                    </label>

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