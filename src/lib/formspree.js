const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT;

export async function sendBidNotification(data) {

    if (!endpoint) {
        console.warn("Formspree endpoint not configured.");
        return;
    }

    try {

        const response = await fetch(endpoint, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },

            body: JSON.stringify({

                subject: `🚨 New Auction Bid - ${data.equipmentName}`,

                equipment: data.equipmentName,

                company: data.sellerCompany,

                sector: data.sector,

                bidAmount: data.bidAmount,

                bidderName: data.bidderName,

                bidderEmail: data.bidderEmail,

                bidderUid: data.bidderUserId,

                bidderPhoto: data.bidderPhoto,

                auctionId: data.auctionId,

                status: data.status,

                date: new Date().toLocaleDateString(),

                time: new Date().toLocaleTimeString(),

            }),

        });

        if (!response.ok) {

            throw new Error("Formspree notification failed.");

        }

        console.log("Bid notification sent.");

    } catch (err) {

        console.error("Formspree:", err);

    }

}