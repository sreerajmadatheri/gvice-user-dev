import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import { Edit3, Save, X } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";

const MyBidsPage = () => {
    const { user } = useAuth();

    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingBidId, setEditingBidId] = useState(null);
    const [editAmount, setEditAmount] = useState("");
    const [savingBidId, setSavingBidId] = useState(null);

    useEffect(() => {
        fetchMyBids();
    }, [user?.uid]);

    const fetchMyBids = async () => {
        if (!user?.uid) {
            setBids([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const bidsQuery = query(
                collection(db, "auctionBids"),
                where("bidderUserId", "==", user.uid)
            );

            const snapshot = await getDocs(bidsQuery);

            const fetchedBids = snapshot.docs.map((bidDoc) => ({
                id: bidDoc.id,
                ...bidDoc.data(),
            }));

            fetchedBids.sort((a, b) => {
                const dateA = a.createdAt?.toDate
                    ? a.createdAt.toDate()
                    : new Date(0);

                const dateB = b.createdAt?.toDate
                    ? b.createdAt.toDate()
                    : new Date(0);

                return dateB - dateA;
            });

            setBids(fetchedBids);
        } catch (err) {
            console.error("Error fetching my bids:", err);

            setError(
                err.message ||
                "Failed to load your bid history."
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) {
            return "—";
        }

        try {
            const date = timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);

            if (Number.isNaN(date.getTime())) {
                return "—";
            }

            return date.toLocaleString();
        } catch {
            return "—";
        }
    };

    const getStatusClass = (status) => {
        switch ((status || "").toLowerCase()) {
            case "accepted":
                return "accepted";

            case "rejected":
                return "rejected";

            case "pending":
            default:
                return "pending";
        }
    };

    const getStatusLabel = (status) => {
        if (!status) {
            return "Pending";
        }

        return (
            status.charAt(0).toUpperCase() +
            status.slice(1)
        );
    };

    const startEditing = (bid) => {
        if (
            (bid.status || "Pending").toLowerCase() !==
            "pending"
        ) {
            return;
        }

        setEditingBidId(bid.id);
        setEditAmount(String(bid.bidAmount ?? ""));
        setError("");
    };

    const cancelEditing = () => {
        setEditingBidId(null);
        setEditAmount("");
    };

    const handleUpdateBid = async (bid) => {
        if (!user?.uid) {
            alert("Please login again.");
            return;
        }

        if (bid.bidderUserId !== user.uid) {
            alert(
                "You are not authorized to update this bid."
            );
            return;
        }

        if (
            (bid.status || "Pending").toLowerCase() !==
            "pending"
        ) {
            alert(
                "Only pending bids can be updated."
            );
            return;
        }

        const numericAmount = Number(editAmount);

        if (
            !editAmount ||
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            alert(
                "Please enter a valid bid amount greater than 0."
            );
            return;
        }

        if (numericAmount === Number(bid.bidAmount)) {
            alert(
                "Please enter a different bid amount."
            );
            return;
        }

        const confirmed = window.confirm(
            `Update your bid from ${bid.bidAmount} to ${numericAmount}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setSavingBidId(bid.id);
            setError("");

            await updateDoc(
                doc(db, "auctionBids", bid.id),
                {
                    bidAmount: numericAmount,
                    updatedAt: serverTimestamp(),
                }
            );

            setBids((previousBids) =>
                previousBids.map((item) =>
                    item.id === bid.id
                        ? {
                            ...item,
                            bidAmount: numericAmount,
                            updatedAt: new Date(),
                        }
                        : item
                )
            );

            setEditingBidId(null);
            setEditAmount("");
        } catch (err) {
            console.error(
                "Error updating bid:",
                err
            );

            alert(
                err.message ||
                "Unable to update your bid."
            );
        } finally {
            setSavingBidId(null);
        }
    };

    return (
        <div>
            <h2>My Bids</h2>

            <div
                className="admin-card"
                style={{
                    marginTop: "1.5rem",
                }}
            >
                <p>My bids for:</p>

                <strong>
                    {user?.email || "Not signed in"}
                </strong>

                {loading && (
                    <p
                        style={{
                            marginTop: "1rem",
                            color: "#6b7280",
                        }}
                    >
                        Loading your bids...
                    </p>
                )}

                {!loading && error && (
                    <div
                        style={{
                            marginTop: "1rem",
                            padding: "1rem",
                            borderRadius: "8px",
                            background: "#fef2f2",
                            color: "#b91c1c",
                        }}
                    >
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    bids.length === 0 && (
                        <p
                            style={{
                                marginTop: "1rem",
                                color: "#6b7280",
                            }}
                        >
                            You have not placed any bids
                            yet.
                        </p>
                    )}

                {!loading &&
                    !error &&
                    bids.length > 0 && (
                        <div
                            style={{
                                marginTop: "1.5rem",
                                display: "grid",
                                gap: "1rem",
                            }}
                        >
                            {bids.map((bid) => {
                                const status =
                                    bid.status ||
                                    "Pending";

                                const statusClass =
                                    getStatusClass(
                                        status
                                    );

                                const isPending =
                                    statusClass ===
                                    "pending";

                                const isEditing =
                                    editingBidId ===
                                    bid.id;

                                const isSaving =
                                    savingBidId ===
                                    bid.id;

                                return (
                                    <div
                                        key={bid.id}
                                        style={{
                                            display: "flex",
                                            gap: "1rem",
                                            padding: "1rem",
                                            border:
                                                "1px solid #e5e7eb",
                                            borderRadius:
                                                "10px",
                                            background:
                                                "#ffffff",
                                        }}
                                    >
                                        {bid.equipmentImage && (
                                            <img
                                                src={
                                                    bid.equipmentImage
                                                }
                                                alt={
                                                    bid.equipmentName ||
                                                    "Equipment"
                                                }
                                                style={{
                                                    width: "110px",
                                                    height: "80px",
                                                    objectFit:
                                                        "cover",
                                                    borderRadius:
                                                        "8px",
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}

                                        <div
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    margin:
                                                        "0 0 0.5rem",
                                                }}
                                            >
                                                {bid.equipmentName ||
                                                    "Equipment"}
                                            </h3>

                                            <p
                                                style={{
                                                    margin:
                                                        "0.25rem 0",
                                                    color:
                                                        "#6b7280",
                                                }}
                                            >
                                                Seller:{" "}
                                                <strong
                                                    style={{
                                                        color:
                                                            "#374151",
                                                    }}
                                                >
                                                    {bid.sellerCompany ||
                                                        "—"}
                                                </strong>
                                            </p>

                                            <div
                                                style={{
                                                    margin:
                                                        "0.5rem 0",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color:
                                                            "#6b7280",
                                                    }}
                                                >
                                                    Bid Amount:{" "}
                                                </span>

                                                {!isEditing ? (
                                                    <strong
                                                        style={{
                                                            color:
                                                                "#111827",
                                                        }}
                                                    >
                                                        {
                                                            bid.bidAmount
                                                        }
                                                    </strong>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        value={
                                                            editAmount
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setEditAmount(
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        min="1"
                                                        step="1"
                                                        autoFocus
                                                        style={{
                                                            width:
                                                                "160px",
                                                            marginLeft:
                                                                "0.25rem",
                                                            padding:
                                                                "0.45rem 0.6rem",
                                                            border:
                                                                "1px solid #d1d5db",
                                                            borderRadius:
                                                                "6px",
                                                            fontSize:
                                                                "1rem",
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <p
                                                style={{
                                                    margin:
                                                        "0.25rem 0",
                                                    color:
                                                        "#6b7280",
                                                }}
                                            >
                                                Submitted:{" "}
                                                {formatDate(
                                                    bid.createdAt
                                                )}
                                            </p>

                                            {bid.updatedAt &&
                                                bid.updatedAt !==
                                                bid.createdAt && (
                                                    <p
                                                        style={{
                                                            margin:
                                                                "0.25rem 0",
                                                            color:
                                                                "#6b7280",
                                                        }}
                                                    >
                                                        Updated:{" "}
                                                        {formatDate(
                                                            bid.updatedAt
                                                        )}
                                                    </p>
                                                )}
                                        </div>

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                flexDirection:
                                                    "column",
                                                alignItems:
                                                    "flex-end",
                                                gap: "0.75rem",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <span
                                                className={`bid-status ${statusClass}`}
                                                style={{
                                                    display:
                                                        "inline-block",
                                                    padding:
                                                        "0.35rem 0.7rem",
                                                    borderRadius:
                                                        "999px",
                                                    fontSize:
                                                        "0.8rem",
                                                    fontWeight: 600,
                                                    background:
                                                        statusClass ===
                                                        "accepted"
                                                            ? "#dcfce7"
                                                            : statusClass ===
                                                            "rejected"
                                                                ? "#fee2e2"
                                                                : "#fef3c7",
                                                    color:
                                                        statusClass ===
                                                        "accepted"
                                                            ? "#166534"
                                                            : statusClass ===
                                                            "rejected"
                                                                ? "#991b1b"
                                                                : "#92400e",
                                                }}
                                            >
                                                {getStatusLabel(
                                                    status
                                                )}
                                            </span>

                                            {isPending &&
                                                !isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEditing(
                                                                bid
                                                            )
                                                        }
                                                        disabled={
                                                            isSaving
                                                        }
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap:
                                                                "0.4rem",
                                                            padding:
                                                                "0.55rem 0.8rem",
                                                            border:
                                                                "1px solid #d1d5db",
                                                            borderRadius:
                                                                "6px",
                                                            background:
                                                                "#ffffff",
                                                            color:
                                                                "#374151",
                                                            fontWeight: 600,
                                                            cursor:
                                                                isSaving
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                        }}
                                                    >
                                                        <Edit3
                                                            size={
                                                                16
                                                            }
                                                        />
                                                        Update Bid
                                                    </button>
                                                )}

                                            {isEditing && (
                                                <div
                                                    style={{
                                                        display:
                                                            "flex",
                                                        gap: "0.5rem",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleUpdateBid(
                                                                bid
                                                            )
                                                        }
                                                        disabled={
                                                            isSaving
                                                        }
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap:
                                                                "0.4rem",
                                                            padding:
                                                                "0.55rem 0.8rem",
                                                            border:
                                                                "1px solid #16a34a",
                                                            borderRadius:
                                                                "6px",
                                                            background:
                                                                "#16a34a",
                                                            color:
                                                                "#ffffff",
                                                            fontWeight: 600,
                                                            cursor:
                                                                isSaving
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                            opacity:
                                                                isSaving
                                                                    ? 0.6
                                                                    : 1,
                                                        }}
                                                    >
                                                        <Save
                                                            size={
                                                                16
                                                            }
                                                        />
                                                        {isSaving
                                                            ? "Saving..."
                                                            : "Save"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            cancelEditing
                                                        }
                                                        disabled={
                                                            isSaving
                                                        }
                                                        style={{
                                                            display:
                                                                "inline-flex",
                                                            alignItems:
                                                                "center",
                                                            justifyContent:
                                                                "center",
                                                            gap:
                                                                "0.4rem",
                                                            padding:
                                                                "0.55rem 0.8rem",
                                                            border:
                                                                "1px solid #d1d5db",
                                                            borderRadius:
                                                                "6px",
                                                            background:
                                                                "#ffffff",
                                                            color:
                                                                "#374151",
                                                            fontWeight: 600,
                                                            cursor:
                                                                isSaving
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                        }}
                                                    >
                                                        <X
                                                            size={
                                                                16
                                                            }
                                                        />
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
            </div>
        </div>
    );
};

export default MyBidsPage;