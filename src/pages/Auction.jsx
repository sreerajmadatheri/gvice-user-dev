import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import { uploadToCloudinary } from "../lib/cloudinary";
import { useAuth } from "../context/AuthContext";
import { sendBidNotification } from "../lib/formspree";

import "./Auction.css";

const mockEquipmentListings = [
  {
    id: "1",
    company: "Saudi Aramco Contractors",
    name: "Elevated Flare Stack with Multi-Risers",
    sector: "oil",
    specs: [
      { label: "Height", val: "120m" },
      { label: "Condition", val: "New" },
      { label: "Location", val: "Jubail, KSA" },
    ],
    price: "$850,000",
    featured: true,
    img: "/Products/Elevated-Flare-Stack-with-Multi-Risers.avif",
  },
  {
    id: "2",
    company: "Gulf Engineering",
    name: "High-Pressure Desander",
    sector: "oil",
    specs: [
      { label: "Pressure", val: "10,000 PSI" },
      { label: "Condition", val: "Refurbished" },
      { label: "Location", val: "Dhahran" },
    ],
    price: "$320,000",
    featured: true,
    img: "/Products/High-Pressure Desander.png",
  },
  {
    id: "3",
    company: "Bin Laden Group",
    name: "Batch Mixture Unit",
    sector: "civil",
    specs: [
      { label: "Capacity", val: "120 m³/h" },
      { label: "Year", val: "2023" },
      { label: "Location", val: "Riyadh" },
    ],
    price: "$415,000",
    featured: false,
    img: "/Products/Batch Mixture Unit.jpg",
  },
  {
    id: "4",
    company: "NMDC Marine",
    name: "Managed Pressure Drilling System",
    sector: "marine",
    specs: [
      { label: "Type", val: "Automated" },
      { label: "Condition", val: "Excellent" },
      { label: "Location", val: "Dubai" },
    ],
    price: "$1,200,000",
    featured: true,
    img: "/Products/Managed Pressure Drilling.jpg",
  },
  {
    id: "5",
    company: "Petrofac Solutions",
    name: "Steam Exchanger",
    sector: "oil",
    specs: [
      { label: "Capacity", val: "50 MW" },
      { label: "Material", val: "SS" },
      { label: "Location", val: "Al Khobar" },
    ],
    price: "$210,000",
    featured: false,
    img: "/Products/Steam Exchanger.png",
  },
];

const Auction = () => {
  const { user } = useAuth();

  const [equipmentListings, setEquipmentListings] = useState(
      mockEquipmentListings
  );

  const [activeFilter, setActiveFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    sector: "oil",
    price: "",
    location: "",
    condition: "Used",
    description: "",
  });

  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [existingBid, setExistingBid] = useState(null);
  const [savingBid, setSavingBid] = useState(false);
  const [myBids, setMyBids] = useState({});

  useEffect(() => {
    fetchEquipment();

    if (user) {
      fetchMyBids();
    } else {
      setMyBids({});
    }
  }, [user]);

  async function fetchEquipment() {
    try {
      const q = query(
          collection(db, "equipmentListings"),
          orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setEquipmentListings(mockEquipmentListings);
        return;
      }

      const data = snapshot.docs.map((equipmentDoc) => ({
        id: equipmentDoc.id,
        ...equipmentDoc.data(),
      }));

      setEquipmentListings(data);
    } catch (err) {
      console.error(err);
      setEquipmentListings(mockEquipmentListings);
    }
  }

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

  const handleFormChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm("Delete this listing?")) return;

    try {
      await deleteDoc(doc(db, "equipmentListings", id));

      setEquipmentListings((prev) =>
          prev.filter((item) => item.id !== id)
      );

      alert("Listing deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Unable to delete listing.");
    }
  };

  const openBidModal = (equipment) => {
    if (!user) {
      alert("Please login before placing a bid.");
      return;
    }

    if (equipment.userId && equipment.userId === user.uid) {
      alert("You cannot place a bid on your own equipment.");
      return;
    }

    setSelectedEquipment(equipment);

    const existing = myBids[equipment.id];

    if (existing) {
      setExistingBid(existing);
      setBidAmount(existing.bidAmount.toString());
    } else {
      setExistingBid(null);
      setBidAmount("");
    }

    setShowBidModal(true);
  };

  const submitBid = async () => {
    if (!user) {
      alert("Please login before placing a bid.");
      return;
    }

    if (!selectedEquipment) {
      alert("Please select an equipment listing.");
      return;
    }

    if (
        selectedEquipment.userId &&
        selectedEquipment.userId === user.uid
    ) {
      alert("You cannot place a bid on your own equipment.");
      setShowBidModal(false);
      return;
    }

    if (!bidAmount || Number(bidAmount) <= 0) {
      alert("Please enter a valid bid amount.");
      return;
    }

    setSavingBid(true);

    try {
      const sellerUserId =
          selectedEquipment.userId || "";

      if (
          sellerUserId &&
          sellerUserId === user.uid
      ) {
        throw new Error(
            "You cannot place a bid on your own equipment."
        );
      }

      // Keep the previous bid amount BEFORE updating Firestore.
      // This is required for the "updated" notification.
      const previousBidAmount = existingBid
          ? Number(existingBid.bidAmount)
          : null;

      const notificationType = existingBid
          ? "updated"
          : "created";

      const bidData = {
        auctionId: selectedEquipment.id,
        equipmentName: selectedEquipment.name,
        equipmentImage: selectedEquipment.img,
        sellerCompany: selectedEquipment.company,
        sellerUserId: sellerUserId,
        sector: selectedEquipment.sector,
        bidderUserId: user.uid,
        bidderName: user.displayName || "",
        bidderEmail: user.email || "",
        bidderPhoto: user.photoURL || "",
        bidAmount: Number(bidAmount),
        status: existingBid?.status || "Pending",
        updatedAt: serverTimestamp(),
      };

      if (existingBid) {
        await updateDoc(
            doc(db, "auctionBids", existingBid.id),
            bidData
        );
      } else {
        await addDoc(
            collection(db, "auctionBids"),
            {
              ...bidData,
              createdAt: serverTimestamp(),
            }
        );
      }

      await fetchMyBids();

      // ---------------------------------------------------
      // BID NOTIFICATION
      // ---------------------------------------------------
      //
      // This now calls the Firebase callable function
      // through src/lib/formspree.js.
      //
      // New bid:
      //   notificationType = "created"
      //
      // Existing bid:
      //   notificationType = "updated"
      //   oldBidAmount = previous amount
      //
      // sellerUserId identifies the equipment owner.
      // ---------------------------------------------------

      await sendBidNotification({
        auctionId:
        selectedEquipment.id,

        equipmentName:
        selectedEquipment.name,

        sellerCompany:
        selectedEquipment.company,

        sellerUserId:
        sellerUserId,

        sector:
        selectedEquipment.sector,

        bidAmount:
            Number(bidAmount),

        bidderName:
            user.displayName || "",

        bidderEmail:
            user.email || "",

        bidderUserId:
        user.uid,

        bidderPhoto:
            user.photoURL || "",

        status:
            existingBid?.status || "Pending",

        notificationType:
        notificationType,

        oldBidAmount:
        previousBidAmount,
      });

      setShowBidModal(false);
      setExistingBid(null);
      setSelectedEquipment(null);
      setBidAmount("");

      alert(
          existingBid
              ? "Bid updated successfully."
              : "Bid submitted successfully."
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSavingBid(false);
    }
  };

  const fetchMyBids = async () => {
    if (!user) return;

    try {
      const q = query(
          collection(db, "auctionBids"),
          where("bidderUserId", "==", user.uid)
      );

      const snap = await getDocs(q);

      const bids = {};

      snap.forEach((bidDoc) => {
        const data = bidDoc.data();

        bids[data.auctionId] = {
          id: bidDoc.id,
          ...data,
        };
      });

      setMyBids(bids);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      setError("Please choose an image.");
      return;
    }

    if (!user) {
      setError("Please login before posting equipment.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const imageUrl =
          await uploadToCloudinary(imageFile);

      const listing = {
        company:
            user?.displayName ||
            "GVICE Registered Contractor",

        userEmail:
            user?.email || "",

        userId:
            user?.uid || "",

        name:
        formData.name,

        sector:
        formData.sector,

        price:
        formData.price,

        img:
        imageUrl,

        featured:
            false,

        specs: [
          {
            label: "Condition",
            val: formData.condition,
          },
          {
            label: "Location",
            val: formData.location,
          },
        ],

        description:
        formData.description,

        createdAt:
            serverTimestamp(),
      };

      await addDoc(
          collection(db, "equipmentListings"),
          listing
      );

      setFormData({
        name: "",
        sector: "oil",
        price: "",
        location: "",
        condition: "Used",
        description: "",
      });

      setImageFile(null);
      setImagePreview("");
      setIsModalOpen(false);

      alert(
          "Equipment uploaded successfully."
      );

      fetchEquipment();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const filters = [
    "all",
    "oil",
    "civil",
    "marine",
  ];

  const filteredListings =
      activeFilter === "all"
          ? equipmentListings
          : equipmentListings.filter(
              (item) =>
                  item.sector === activeFilter
          );

  return (
      <div className="auction-page">

        <section className="auction-hero">

          <div className="auction-hero-bg" />

          <div className="auction-hero-content">

            <div className="auction-hero-badge">
              <span className="dot" />
              Verified Industrial Auctions
            </div>

            <h1 className="auction-hero-title">
              GVICE Equipment{" "}
              <span className="accent">
              Auction
            </span>
            </h1>

            <p className="auction-hero-sub">
              Buy and sell industrial equipment
              across the Middle East. Upload your
              machinery and reach verified buyers
              instantly.
            </p>

            <div className="auction-hero-ctas">

              <button
                  className="btn-primary-red"
                  onClick={() =>
                      setIsModalOpen(true)
                  }
              >
                <Upload
                    size={18}
                    style={{
                      marginRight: 8,
                    }}
                />

                Upload Equipment
              </button>

              <a
                  href="#listings"
                  className="btn-outline-white"
              >
                Browse Auctions
              </a>

            </div>

          </div>

        </section>


        <section
            className="listings-section"
            id="listings"
        >

          <div className="listings-inner">

            <div className="listings-header">

              <div>

                <p className="section-label">
                  Live Auction Items
                </p>

                <h2 className="section-title">
                  Current Inventory
                </h2>

              </div>

              <div className="filter-pills">

                {filters.map((filter) => (
                    <button
                        key={filter}
                        className={`filter-pill ${
                            activeFilter === filter
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setActiveFilter(filter)
                        }
                    >
                      {filter === "all"
                          ? "All Sectors"
                          : filter
                              .charAt(0)
                              .toUpperCase() +
                          filter.slice(1)}
                    </button>
                ))}

              </div>

            </div>


            <div className="equipment-grid">

              {filteredListings.map((item) => {

                const isOwner =
                    user &&
                    item.userId &&
                    item.userId === user.uid;

                const hasExistingBid =
                    Boolean(myBids[item.id]);

                return (
                    <div
                        className="equipment-card"
                        key={item.id}
                    >

                      <div className="equipment-img-wrapper">

                        <img
                            src={item.img}
                            alt={item.name}
                            className="equipment-card-img"
                            loading="lazy"
                        />

                        <span
                            className={`equipment-sector-badge ${item.sector}`}
                        >
                      {item.sector === "oil"
                          ? "Oil & Gas"
                          : item.sector === "civil"
                              ? "Civil"
                              : "Marine"}
                    </span>

                        {item.featured && (
                            <span className="featured-badge">
                        ⭐ Featured
                      </span>
                        )}

                        {user &&
                            item.userId === user.uid && (
                                <button
                                    className="delete-listing-btn"
                                    onClick={() =>
                                        handleDeleteListing(
                                            item.id
                                        )
                                    }
                                >
                                  <X size={14} />
                                  Delete
                                </button>
                            )}

                      </div>


                      <div className="equipment-card-body">

                        <p className="equipment-company">
                          {item.company}
                        </p>

                        <h3 className="equipment-name">
                          {item.name}
                        </h3>

                        <div className="equipment-specs">

                          {item.specs?.map(
                              (spec) => (
                                  <div
                                      className="equipment-spec"
                                      key={spec.label}
                                  >
                                    {spec.label}
                                    <span>
                              {spec.val}
                            </span>
                                  </div>
                              )
                          )}

                        </div>


                        <div className="equipment-footer">

                          <div>

                            <div className="equipment-price-label">
                              Asking Price
                            </div>

                            <div className="equipment-price">
                              {item.price}
                            </div>

                          </div>


                          {isOwner ? (
                              <button
                                  className="enquire-btn"
                                  disabled
                                  style={{
                                    opacity: 0.65,
                                    cursor:
                                        "not-allowed",
                                  }}
                              >
                                Your Equipment
                              </button>
                          ) : (
                              <button
                                  className="enquire-btn"
                                  onClick={() =>
                                      openBidModal(item)
                                  }
                              >
                                {hasExistingBid
                                    ? "✓ Bid Submitted"
                                    : "Bid Now"}
                              </button>
                          )}

                        </div>

                      </div>

                    </div>
                );
              })}

            </div>

          </div>

        </section>


        {isModalOpen && (
            <div className="upload-modal-overlay">

              <div className="upload-modal glass-panel">

                <button
                    className="close-btn"
                    onClick={() =>
                        setIsModalOpen(false)
                    }
                >
                  <X size={20} />
                </button>


                <div className="modal-header">

                  <h2>
                    Post Equipment for Auction
                  </h2>

                  <p>
                    Upload your equipment and make it
                    visible to verified buyers across
                    the Middle East.
                  </p>

                </div>


                {error && (
                    <div className="error-alert">
                      {error}
                    </div>
                )}


                <form
                    onSubmit={handleUploadSubmit}
                    className="upload-form"
                >

                  <div className="image-upload-area">

                    <label className="image-upload-label">

                      {imagePreview ? (
                          <img
                              src={imagePreview}
                              alt="Preview"
                              className="image-preview"
                          />
                      ) : (
                          <div className="upload-placeholder">

                            <Upload size={34} />

                            <span>
                        Click to choose equipment image
                      </span>

                          </div>
                      )}

                      <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageChange}
                      />

                    </label>

                  </div>


                  <div className="form-group">

                    <label>
                      Equipment Name
                    </label>

                    <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Equipment Name"
                    />

                  </div>


                  <div className="form-row">

                    <div className="form-group">

                      <label>
                        Sector
                      </label>

                      <select
                          name="sector"
                          value={formData.sector}
                          onChange={handleFormChange}
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


                    <div className="form-group">

                      <label>
                        Price
                      </label>

                      <input
                          required
                          name="price"
                          value={formData.price}
                          onChange={handleFormChange}
                          placeholder="$250,000"
                      />

                    </div>

                  </div>


                  <div className="form-row">

                    <div className="form-group">

                      <label>
                        Location
                      </label>

                      <input
                          required
                          name="location"
                          value={formData.location}
                          onChange={handleFormChange}
                          placeholder="Dubai, UAE"
                      />

                    </div>


                    <div className="form-group">

                      <label>
                        Condition
                      </label>

                      <select
                          name="condition"
                          value={formData.condition}
                          onChange={handleFormChange}
                      >
                        <option value="New">
                          New
                        </option>

                        <option value="Used">
                          Used
                        </option>

                        <option value="Refurbished">
                          Refurbished
                        </option>
                      </select>

                    </div>

                  </div>


                  <div className="form-group">

                    <label>
                      Description
                    </label>

                    <textarea
                        rows={5}
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        placeholder="Brief description..."
                    />

                  </div>


                  <button
                      type="submit"
                      className="submit-listing-btn"
                      disabled={uploading}
                  >
                    {uploading
                        ? "Uploading..."
                        : "Post Listing"}
                  </button>

                </form>

              </div>

            </div>
        )}


        {showBidModal && (
            <div className="upload-modal-overlay">

              <div className="upload-modal glass-panel">

                <button
                    className="close-btn"
                    onClick={() =>
                        setShowBidModal(false)
                    }
                >
                  <X size={20} />
                </button>


                <h2>
                  {selectedEquipment?.name}
                </h2>


                <p
                    style={{
                      marginBottom: 20,
                    }}
                >
                  Enter your bid amount
                </p>


                <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) =>
                        setBidAmount(e.target.value)
                    }
                    placeholder="Enter amount"
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginBottom: "20px",
                    }}
                />


                <button
                    className="submit-listing-btn"
                    onClick={submitBid}
                    disabled={
                        savingBid ||
                        (existingBid &&
                            Number(existingBid.bidAmount) ===
                            Number(bidAmount))
                    }
                >
                  {savingBid
                      ? "Saving..."
                      : existingBid
                          ? "Update Bid"
                          : "Submit Bid"}
                </button>

              </div>

            </div>
        )}

      </div>
  );
};

export default Auction;