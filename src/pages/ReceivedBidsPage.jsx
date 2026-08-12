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
import { Check, X } from "lucide-react";

import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

const ReceivedBidsPage = () => {
    const { user } = useAuth();

    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingBidId, setUpdatingBidId] = useState(null);

    useEffect(() => {
        fetchReceivedBids();
    }, [user?.uid]);

    const fetchReceivedBids = async () => {
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
                where("sellerUserId", "==", user.uid)
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
            console.error("Error fetching received bids:", err);

            setError(
                err.message ||
                "Failed to load received bids."
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

    const getStatusStyle = (status) => {
        const normalizedStatus =
            (status || "Pending").toLowerCase();

        if (normalizedStatus === "accepted") {
            return {
                background: "#dcfce7",
                color: "#166534",
            };
        }

        if (normalizedStatus === "rejected") {
            return {
                background: "#fee2e2",
                color: "#991b1b",
            };
        }

        return {
            background: "#fef3c7",
            color: "#92400e",
        };
    };

    const handleUpdateStatus = async (bid, newStatus) => {
        if (!user?.uid) {
            alert("Please login again.");
            return;
        }

        if (bid.sellerUserId !== user.uid) {
            alert(
                "You are not authorized to manage this bid."
            );
            return;
        }

        const actionText =
            newStatus === "Accepted"
                ? "accept"
                : "reject";

        const confirmed = window.confirm(
            `Are you sure you want to ${actionText} this bid?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setUpdatingBidId(bid.id);

            await updateDoc(
                doc(db, "auctionBids", bid.id),
                {
                    status: newStatus,
                    updatedAt: serverTimestamp(),
                }
            );

            setBids((previousBids) =>
                previousBids.map((item) =>
                    item.id === bid.id
                        ? {
                            ...item,
                            status: newStatus,
                        }
                        : item
                )
            );
        } catch (err) {
            console.error(
                "Error updating bid status:",
                err
            );

            alert(
                err.message ||
                "Unable to update bid status."
            );
        } finally {
            setUpdatingBidId(null);
        }
    };

    if (loading) {
        return (
            <div>
                <h2>Received Bids</h2>

                <div
                    className="admin-card"
                    style={{
                        marginTop: "1.5rem",
                    }}
                >
                    Loading received bids...
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2>Received Bids</h2>

            <div
                className="admin-card"
                style={{
                    marginTop: "1.5rem",
                }}
            >
                <p
                    style={{
                        marginTop: 0,
                        color: "#6b7280",
                    }}
                >
                    Bids received for your equipment
                </p>

                {error && (
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

                {!error && bids.length === 0 && (
                    <div
                        style={{
                            marginTop: "1.5rem",
                            padding: "2rem",
                            textAlign: "center",
                            border: "1px dashed #d1d5db",
                            borderRadius: "10px",
                            color: "#6b7280",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontWeight: 600,
                            }}
                        >
                            No received bids yet.
                        </p>

                        <p
                            style={{
                                marginBottom: 0,
                                marginTop: "0.5rem",
                            }}
                        >
                            When someone bids on your
                            equipment, the bid will appear
                            here.
                        </p>
                    </div>
                )}

                {!error && bids.length > 0 && (
                    <div
                        style={{
                            marginTop: "1.5rem",
                            display: "grid",
                            gap: "1rem",
                        }}
                    >
                        {bids.map((bid) => {
                            const status =
                                bid.status || "Pending";

                            const normalizedStatus =
                                status.toLowerCase();

                            const isPending =
                                normalizedStatus ===
                                "pending";

                            const isUpdating =
                                updatingBidId === bid.id;

                            return (
                                <div
                                    key={bid.id}
                                    style={{
                                        display: "flex",
                                        gap: "1rem",
                                        padding: "1rem",
                                        border:
                                            "1px solid #e5e7eb",
                                        borderRadius: "10px",
                                        background:
                                            "#ffffff",
                                        alignItems:
                                            "flex-start",
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
                                                width: "130px",
                                                height: "90px",
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
                                                margin: "0 0 0.5rem",
                                            }}
                                        >
                                            {bid.equipmentName ||
                                                "Equipment"}
                                        </h3>

                                        <p
                                            style={{
                                                margin:
                                                    "0.25rem 0",
                                                color: "#6b7280",
                                            }}
                                        >
                                            Bidder:{" "}
                                            <strong
                                                style={{
                                                    color:
                                                        "#374151",
                                                }}
                                            >
                                                {bid.bidderName ||
                                                    "—"}
                                            </strong>
                                        </p>

                                        <p
                                            style={{
                                                margin:
                                                    "0.25rem 0",
                                                color: "#6b7280",
                                            }}
                                        >
                                            Email:{" "}
                                            <strong
                                                style={{
                                                    color:
                                                        "#374151",
                                                }}
                                            >
                                                {bid.bidderEmail ||
                                                    "—"}
                                            </strong>
                                        </p>

                                        <p
                                            style={{
                                                margin:
                                                    "0.25rem 0",
                                                color: "#6b7280",
                                            }}
                                        >
                                            Bid Amount:{" "}
                                            <strong
                                                style={{
                                                    color:
                                                        "#111827",
                                                    fontSize:
                                                        "1.05rem",
                                                }}
                                            >
                                                {bid.bidAmount ??
                                                    "—"}
                                            </strong>
                                        </p>

                                        <p
                                            style={{
                                                margin:
                                                    "0.25rem 0",
                                                color: "#6b7280",
                                            }}
                                        >
                                            Submitted:{" "}
                                            {formatDate(
                                                bid.createdAt
                                            )}
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection:
                                                "column",
                                            alignItems:
                                                "flex-end",
                                            gap: "0.75rem",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span
                                            style={{
                                                ...getStatusStyle(
                                                    status
                                                ),
                                                display:
                                                    "inline-block",
                                                padding:
                                                    "0.35rem 0.7rem",
                                                borderRadius:
                                                    "999px",
                                                fontSize:
                                                    "0.8rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {status}
                                        </span>

                                        {isPending && (
                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    flexDirection:
                                                        "column",
                                                    gap: "0.5rem",
                                                    width: "128px",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateStatus(
                                                            bid,
                                                            "Accepted"
                                                        )
                                                    }
                                                    disabled={
                                                        isUpdating
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        justifyContent:
                                                            "center",
                                                        gap: "0.4rem",
                                                        padding:
                                                            "0.65rem 0.8rem",
                                                        border: "none",
                                                        borderRadius:
                                                            "6px",
                                                        background:
                                                            "#16a34a",
                                                        color:
                                                            "#ffffff",
                                                        fontSize:
                                                            "0.9rem",
                                                        fontWeight: 600,
                                                        cursor:
                                                            isUpdating
                                                                ? "not-allowed"
                                                                : "pointer",
                                                        opacity:
                                                            isUpdating
                                                                ? 0.6
                                                                : 1,
                                                    }}
                                                >
                                                    <Check
                                                        size={16}
                                                    />
                                                    Accept
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateStatus(
                                                            bid,
                                                            "Rejected"
                                                        )
                                                    }
                                                    disabled={
                                                        isUpdating
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        display:
                                                            "flex",
                                                        alignItems:
                                                            "center",
                                                        justifyContent:
                                                            "center",
                                                        gap: "0.4rem",
                                                        padding:
                                                            "0.65rem 0.8rem",
                                                        border: "none",
                                                        borderRadius:
                                                            "6px",
                                                        background:
                                                            "#ef4444",
                                                        color:
                                                            "#ffffff",
                                                        fontSize:
                                                            "0.9rem",
                                                        fontWeight: 600,
                                                        cursor:
                                                            isUpdating
                                                                ? "not-allowed"
                                                                : "pointer",
                                                        opacity:
                                                            isUpdating
                                                                ? 0.6
                                                                : 1,
                                                    }}
                                                >
                                                    <X
                                                        size={16}
                                                    />
                                                    Reject
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

export default ReceivedBidsPage;