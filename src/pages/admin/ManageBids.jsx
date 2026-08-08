import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import {
    Gavel,
    CheckCircle,
    XCircle,
    Trash2,
    RefreshCw,
} from "lucide-react";

import { db } from "../../lib/firebase";

const ManageBids = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [error, setError] = useState("");

    const fetchBids = async () => {
        setLoading(true);
        setError("");

        try {
            const bidsQuery = query(
                collection(db, "auctionBids"),
                orderBy("createdAt", "desc")
            );

            const snapshot = await getDocs(bidsQuery);

            const data = snapshot.docs.map((bidDoc) => ({
                id: bidDoc.id,
                ...bidDoc.data(),
            }));

            setBids(data);
        } catch (err) {
            console.error("Error loading bids:", err);

            setError(
                "Unable to load bids. Please check Firestore permissions or indexes."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBids();
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) {
            return "—";
        }

        try {
            if (typeof timestamp.toDate === "function") {
                return timestamp.toDate().toLocaleString();
            }

            return new Date(timestamp).toLocaleString();
        } catch {
            return "—";
        }
    };

    const formatAmount = (amount) => {
        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {
            return "—";
        }

        const numericAmount = Number(amount);

        if (Number.isNaN(numericAmount)) {
            return amount;
        }

        return numericAmount.toLocaleString();
    };

    const updateBidStatus = async (bidId, status) => {
        const message =
            status === "Accepted"
                ? "Accept this bid?"
                : "Reject this bid?";

        if (!window.confirm(message)) {
            return;
        }

        setActionId(bidId);
        setError("");

        try {
            await updateDoc(
                doc(db, "auctionBids", bidId),
                {
                    status,
                    updatedAt: serverTimestamp(),
                }
            );

            setBids((previous) =>
                previous.map((bid) =>
                    bid.id === bidId
                        ? {
                            ...bid,
                            status,
                        }
                        : bid
                )
            );
        } catch (err) {
            console.error("Error updating bid:", err);

            setError(
                "Unable to update this bid. Please check your Firestore permissions."
            );
        } finally {
            setActionId(null);
        }
    };

    const deleteBid = async (bidId) => {
        if (!window.confirm("Delete this bid permanently?")) {
            return;
        }

        setActionId(bidId);
        setError("");

        try {
            await deleteDoc(
                doc(db, "auctionBids", bidId)
            );

            setBids((previous) =>
                previous.filter((bid) => bid.id !== bidId)
            );
        } catch (err) {
            console.error("Error deleting bid:", err);

            setError(
                "Unable to delete this bid. Please check your Firestore permissions."
            );
        } finally {
            setActionId(null);
        }
    };

    const getStatusStyle = (status) => {
        const normalized = String(
            status || "Pending"
        ).toLowerCase();

        if (normalized === "accepted") {
            return {
                backgroundColor: "#dcfce7",
                color: "#166534",
            };
        }

        if (normalized === "rejected") {
            return {
                backgroundColor: "#fee2e2",
                color: "#991b1b",
            };
        }

        return {
            backgroundColor: "#fef3c7",
            color: "#92400e",
        };
    };

    return (
        <div>
            <div className="admin-page-header">
                <div>
                    <h2>Manage Bids</h2>

                    <p
                        style={{
                            margin: "0.35rem 0 0",
                            color: "#6b7280",
                        }}
                    >
                        View and manage all auction bids.
                    </p>
                </div>

                <button
                    className="admin-btn"
                    onClick={fetchBids}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {error && (
                <div
                    className="admin-card"
                    style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                    }}
                >
                    {error}
                </div>
            )}

            <div className="admin-card">
                {loading ? (
                    <div
                        style={{
                            padding: "2rem",
                            textAlign: "center",
                            color: "#6b7280",
                        }}
                    >
                        Loading bids...
                    </div>
                ) : (
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>Bidder</th>
                                <th>Seller</th>
                                <th>Bid Amount</th>
                                <th>Date / Time</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {bids.map((bid) => {
                                const isProcessing =
                                    actionId === bid.id;

                                return (
                                    <tr key={bid.id}>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                    minWidth: "200px",
                                                }}
                                            >
                                                {bid.equipmentImage ? (
                                                    <img
                                                        src={bid.equipmentImage}
                                                        alt={
                                                            bid.equipmentName ||
                                                            "Equipment"
                                                        }
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            objectFit: "cover",
                                                            borderRadius: "0.375rem",
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: "50px",
                                                            height: "50px",
                                                            borderRadius: "0.375rem",
                                                            backgroundColor: "#f3f4f6",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <Gavel size={20} />
                                                    </div>
                                                )}

                                                <div>
                                                    <strong>
                                                        {bid.equipmentName ||
                                                            "Unknown Equipment"}
                                                    </strong>

                                                    {bid.sector && (
                                                        <div
                                                            style={{
                                                                fontSize: "0.8rem",
                                                                color: "#6b7280",
                                                                marginTop: "0.2rem",
                                                            }}
                                                        >
                                                            {bid.sector}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div>
                                                <strong>
                                                    {bid.bidderName ||
                                                        "Unknown Bidder"}
                                                </strong>

                                                {bid.bidderEmail && (
                                                    <div
                                                        style={{
                                                            fontSize: "0.8rem",
                                                            color: "#6b7280",
                                                            marginTop: "0.2rem",
                                                        }}
                                                    >
                                                        {bid.bidderEmail}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <div>
                                                <strong>
                                                    {bid.sellerName ||
                                                        bid.sellerCompany ||
                                                        "—"}
                                                </strong>

                                                {bid.sellerEmail && (
                                                    <div
                                                        style={{
                                                            fontSize: "0.8rem",
                                                            color: "#6b7280",
                                                            marginTop: "0.2rem",
                                                        }}
                                                    >
                                                        {bid.sellerEmail}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <strong>
                                                {formatAmount(
                                                    bid.bidAmount
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            {formatDate(
                                                bid.createdAt
                                            )}
                                        </td>

                                        <td>
                        <span
                            style={{
                                ...getStatusStyle(
                                    bid.status
                                ),
                                display: "inline-block",
                                padding: "0.35rem 0.65rem",
                                borderRadius: "999px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                            }}
                        >
                          {bid.status ||
                              "Pending"}
                        </span>
                                        </td>

                                        <td>
                                            <div
                                                className="action-btns"
                                                style={{
                                                    flexWrap: "wrap",
                                                    minWidth: "180px",
                                                }}
                                            >
                                                {bid.status !==
                                                    "Accepted" && (
                                                        <button
                                                            className="icon-action-btn"
                                                            title="Accept Bid"
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                updateBidStatus(
                                                                    bid.id,
                                                                    "Accepted"
                                                                )
                                                            }
                                                            style={{
                                                                color: "#16a34a",
                                                            }}
                                                        >
                                                            <CheckCircle
                                                                size={18}
                                                            />
                                                        </button>
                                                    )}

                                                {bid.status !==
                                                    "Rejected" && (
                                                        <button
                                                            className="icon-action-btn"
                                                            title="Reject Bid"
                                                            disabled={
                                                                isProcessing
                                                            }
                                                            onClick={() =>
                                                                updateBidStatus(
                                                                    bid.id,
                                                                    "Rejected"
                                                                )
                                                            }
                                                            style={{
                                                                color: "#dc2626",
                                                            }}
                                                        >
                                                            <XCircle
                                                                size={18}
                                                            />
                                                        </button>
                                                    )}

                                                <button
                                                    className="icon-action-btn delete"
                                                    title="Delete Bid"
                                                    disabled={
                                                        isProcessing
                                                    }
                                                    onClick={() =>
                                                        deleteBid(
                                                            bid.id
                                                        )
                                                    }
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {bids.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="7"
                                        style={{
                                            textAlign: "center",
                                            padding: "3rem",
                                            color: "#6b7280",
                                        }}
                                    >
                                        No bids found.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageBids;